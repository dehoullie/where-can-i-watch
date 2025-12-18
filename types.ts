export type MediaType = 'movie' | 'tv' | 'sport';

export interface WatchProvider {
  name: string;
  type: 'flatrate' | 'rent' | 'buy' | 'free' | 'broadcast';
  price?: string;
  logoUrl?: string;
  link?: string;
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  mediaType: MediaType;
  releaseDate?: string;
  rating?: number;
  genres?: string[];
  // Specific for sports
  league?: string;
  startTime?: string;
  teams?: string[];
  isLive?: boolean;
}

export interface StreamingInfo {
  providers: WatchProvider[];
  link?: string;
  homepage?: string;
  description: string;
  groundingSources?: Array<{uri: string; title: string}>;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export interface UserSettings {
  selectedCountry: Country;
  favorites: string[];
}

export interface BrowseState {
  active: boolean;
  category: 'movie' | 'tv' | 'sport' | 'search';
  title: string;
  endpoint?: string;
}

export interface FilterState {
  sort: string;
  genreIds: number[];
  providerIds: number[];
}