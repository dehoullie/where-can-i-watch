import { MediaItem, Provider, Genre, FilterState, StreamingInfo, WatchProvider } from '../types';

const TMDB_ACCESS_TOKEN = process.env.TMDB_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
  }
};

let GENRE_CACHE: Record<number, string> = {};
let GENRES_FETCHED = false;

const fetchGenres = async () => {
  if (GENRES_FETCHED) return;
  try {
    const [movieG, tvG] = await Promise.all([
      fetch(`${BASE_URL}/genre/movie/list?language=en`, options).then(r => r.json()),
      fetch(`${BASE_URL}/genre/tv/list?language=en`, options).then(r => r.json())
    ]);
    
    [...(movieG.genres || []), ...(tvG.genres || [])].forEach((g: any) => {
      GENRE_CACHE[g.id] = g.name;
    });
    GENRES_FETCHED = true;
  } catch (e) {
    console.error("Failed to load genres", e);
  }
};

const mapToMediaItem = (item: any, type: 'movie' | 'tv'): MediaItem => {
  const genreNames = (item.genre_ids || []).map((id: number) => GENRE_CACHE[id]).filter(Boolean);
  
  return {
    id: item.id.toString(),
    title: item.title || item.name, 
    originalTitle: item.original_title || item.original_name,
    overview: item.overview,
    posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : undefined,
    backdropPath: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : undefined,
    mediaType: type,
    releaseDate: item.release_date || item.first_air_date,
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
    genres: genreNames.slice(0, 3)
  };
};

export const getTMDBTrending = async (type: 'movie' | 'tv'): Promise<MediaItem[]> => {
  await fetchGenres();
  try {
    const response = await fetch(`${BASE_URL}/trending/${type}/week?language=en-US`, options);
    const data = await response.json();
    return (data.results || []).map((item: any) => mapToMediaItem(item, type));
  } catch (error) {
    return [];
  }
};

export const searchTMDB = async (query: string): Promise<MediaItem[]> => {
  await fetchGenres();
  try {
    const response = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, options);
    const data = await response.json();
    return (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => mapToMediaItem(item, item.media_type));
  } catch (error) {
    return [];
  }
};

export const getGenresList = async (type: 'movie' | 'tv'): Promise<Genre[]> => {
    try {
        const response = await fetch(`${BASE_URL}/genre/${type}/list?language=en`, options);
        const data = await response.json();
        return data.genres || [];
    } catch (error) { return []; }
};

export const getWatchProviders = async (region: string, type: 'movie' | 'tv'): Promise<Provider[]> => {
    try {
        const response = await fetch(`${BASE_URL}/watch/providers/${type}?language=en-US&watch_region=${region}`, options);
        const data = await response.json();
        return (data.results || []).sort((a: any, b: any) => a.display_priority - b.display_priority);
    } catch (error) { return []; }
};

export const discoverMedia = async (type: 'movie' | 'tv', filters: FilterState, regionCode: string, presetEndpoint?: string): Promise<MediaItem[]> => {
    await fetchGenres();
    try {
        let url = `${BASE_URL}`;
        const useDiscover = filters.genreIds.length > 0 || filters.providerIds.length > 0 || !presetEndpoint;
        if (useDiscover) {
            url += `/discover/${type}?language=en-US&page=1&watch_region=${regionCode}&include_adult=false&sort_by=${filters.sort}`;
            if (filters.genreIds.length > 0) url += `&with_genres=${filters.genreIds.join(',')}`;
            if (filters.providerIds.length > 0) url += `&with_watch_providers=${filters.providerIds.join('|')}&watch_region=${regionCode}`;
        } else {
            url += `/${type}/${presetEndpoint}?language=en-US&page=1&region=${regionCode}`;
        }
        const response = await fetch(url, options);
        const data = await response.json();
        return (data.results || []).map((item: any) => mapToMediaItem(item, type));
    } catch (error) { return []; }
};

/**
 * Updated: Unified fetch for details + watch providers
 */
export const getMediaWatchProviders = async (id: string, type: 'movie' | 'tv', region: string): Promise<StreamingInfo> => {
    try {
        // We use append_to_response to get everything in ONE request
        const url = `${BASE_URL}/${type}/${id}?append_to_response=watch/providers`;
        const response = await fetch(url, options);
        const details = await response.json();
        
        const regionData = details['watch/providers']?.results?.[region];

        const providers: WatchProvider[] = [];
        if (regionData) {
            const processList = (list: any[], providerType: any) => {
                if (!list) return;
                list.forEach(p => {
                    providers.push({
                        name: p.provider_name,
                        type: providerType,
                        logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : undefined
                    });
                });
            };

            processList(regionData.flatrate, 'flatrate');
            processList(regionData.rent, 'rent');
            processList(regionData.buy, 'buy');
            processList(regionData.ads, 'free');
        }

        const groundingSources = [];
        // Push Official Homepage FIRST as requested
        if (details.homepage) {
            groundingSources.push({ title: 'Official Homepage', uri: details.homepage });
        }
        // Then push Streaming Details (TMDB link)
        if (regionData?.link) {
            groundingSources.push({ title: 'View Streaming Details', uri: regionData.link });
        }

        return {
            description: details.overview || "No description available.",
            providers,
            link: regionData?.link,
            homepage: details.homepage,
            groundingSources
        };
    } catch (error) {
        console.error("Content Metadata Fetch Error:", error);
        return { description: "Failed to connect to database.", providers: [], groundingSources: [] };
    }
};