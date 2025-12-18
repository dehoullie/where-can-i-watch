import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import { MediaCard } from './components/MediaCard.tsx';
import { AvailabilityModal } from './components/AvailabilityModal.tsx';
import { UserSettings, MediaItem, Country, BrowseState, FilterState, Genre, Provider } from './types.ts';
import { getSettings, saveSettings } from './services/storageService.ts';
import { getLiveSports, searchSports } from './services/geminiService.ts';
import { getTMDBTrending, searchTMDB, discoverMedia, getGenresList, getWatchProviders } from './services/tmdbService.ts';
import { Search, Loader2, Film, Tv, Trophy, X, Filter, Check } from 'lucide-react';
import { FEATURE_FLAGS } from './constants.ts';

export default function App() {
  const [userSettings, setUserSettings] = useState<UserSettings>(getSettings());
  
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([]);
  const [liveSports, setLiveSports] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [browseState, setBrowseState] = useState<BrowseState>({ active: false, category: 'movie', title: '' });
  const [browseResults, setBrowseResults] = useState<MediaItem[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({ sort: 'popularity.desc', genreIds: [], providerIds: [] });
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    fetchDashboardData(userSettings.selectedCountry);
  }, []);

  const fetchDashboardData = async (country: Country) => {
    setLoading(true);
    try {
        const promises: Promise<any>[] = [];
        if (FEATURE_FLAGS.MOVIES) promises.push(getTMDBTrending('movie'));
        else promises.push(Promise.resolve([]));
        if (FEATURE_FLAGS.TV_SHOWS) promises.push(getTMDBTrending('tv'));
        else promises.push(Promise.resolve([]));
        if (FEATURE_FLAGS.SPORTS) promises.push(getLiveSports(country.name));
        else promises.push(Promise.resolve([]));

        const [movies, tv, sports] = await Promise.all(promises);
        setTrendingMovies(movies.slice(0, 8));
        setTrendingTV(tv.slice(0, 8));
        setLiveSports(sports.slice(0, 8));
    } catch (e) {
        console.error("Failed to fetch dashboard", e);
    } finally {
        setLoading(false);
    }
  };

  const handleCountryChange = (country: Country) => {
    const newSettings = { ...userSettings, selectedCountry: country };
    setUserSettings(newSettings);
    saveSettings(newSettings);
    if (browseState.active && browseState.category !== 'search') {
         fetchBrowseData(browseState.category, browseState.endpoint, newSettings.selectedCountry.code);
         fetchFilterOptions(browseState.category, newSettings.selectedCountry.code);
    } else {
         fetchDashboardData(country);
    }
  };

  const goHome = () => {
    setBrowseState({ active: false, category: 'movie', title: '' });
    setIsSearchOpen(false);
    setSearchQuery('');
    fetchDashboardData(userSettings.selectedCountry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (type: 'movie' | 'tv' | 'sport', endpoint?: string, title?: string) => {
    if (type === 'movie' && !FEATURE_FLAGS.MOVIES) return;
    if (type === 'tv' && !FEATURE_FLAGS.TV_SHOWS) return;
    if (type === 'sport' && !FEATURE_FLAGS.SPORTS) return;

    let defaultSort = 'popularity.desc';
    if (endpoint === 'top_rated') defaultSort = 'vote_average.desc';
    if (endpoint === 'upcoming') defaultSort = 'primary_release_date.desc';
    if (endpoint === 'on_the_air') defaultSort = 'first_air_date.desc';

    setBrowseState({ active: true, category: type, title: title || type.toUpperCase(), endpoint });
    setFilters({ sort: defaultSort, genreIds: [], providerIds: [] });
    setSearchQuery(''); setIsSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (type === 'sport') {
        setBrowseLoading(true);
        getLiveSports(userSettings.selectedCountry.name).then(res => {
            setBrowseResults(res);
            setBrowseLoading(false);
        });
    } else {
        fetchFilterOptions(type, userSettings.selectedCountry.code);
        fetchBrowseData(type, endpoint, userSettings.selectedCountry.code);
    }
  };

  const fetchFilterOptions = async (type: 'movie' | 'tv' | 'sport', region: string) => {
      if (type === 'sport') return;
      const [genres, providers] = await Promise.all([
          getGenresList(type),
          getWatchProviders(region, type)
      ]);
      setAvailableGenres(genres);
      setAvailableProviders(providers);
  };

  const fetchBrowseData = async (type: 'movie' | 'tv' | 'sport', endpoint: string | undefined, region: string) => {
      if (type === 'sport') return;
      setBrowseLoading(true);
      try {
          const results = await discoverMedia(type, filters, region, endpoint);
          setBrowseResults(results);
      } catch (e) { console.error(e); } finally { setBrowseLoading(false); }
  };

  useEffect(() => {
    if (browseState.active && browseState.category !== 'sport' && browseState.category !== 'search') {
        fetchBrowseData(browseState.category as 'movie'|'tv', browseState.endpoint, userSettings.selectedCountry.code);
    }
  }, [filters]);

  const toggleFilter = (type: 'genre' | 'provider', id: number) => {
      setFilters(prev => {
          const list = type === 'genre' ? prev.genreIds : prev.providerIds;
          const newList = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
          return type === 'genre' ? { ...prev, genreIds: newList } : { ...prev, providerIds: newList };
      });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setBrowseState({ active: true, category: 'search', title: `Results for "${searchQuery}"` });
    setBrowseLoading(true);
    try {
      const searchPromises: Promise<MediaItem[]>[] = [];
      if (FEATURE_FLAGS.MOVIES || FEATURE_FLAGS.TV_SHOWS) searchPromises.push(searchTMDB(searchQuery));
      else searchPromises.push(Promise.resolve([]));
      if (FEATURE_FLAGS.SPORTS) searchPromises.push(searchSports(searchQuery));
      else searchPromises.push(Promise.resolve([]));
      const [tmdbResults, sportResults] = await Promise.all(searchPromises);
      setBrowseResults([...tmdbResults, ...sportResults]);
    } catch (e) { console.error(e); } finally { setBrowseLoading(false); }
  };

  const renderSection = (title: string, icon: React.ReactNode, items: MediaItem[], emptyMsg: string) => (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-white/5 pb-4">
        <div className="p-2 bg-stone-500/10 rounded-lg text-stone-500">{icon}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(item => <MediaCard key={item.id} item={item} onClick={setSelectedMedia} />)}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-gray-300 dark:border-white/10 rounded-xl text-center text-gray-500 dark:text-dark-muted bg-gray-50 dark:bg-white/5">{emptyMsg}</div>
      )}
    </section>
  );

  return (
    <Layout userSettings={userSettings} onCountryChange={handleCountryChange} onSearchClick={() => setIsSearchOpen(!isSearchOpen)} onNavigate={handleNavigate} onGoHome={goHome}>
      {isSearchOpen && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
             <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-stone-500 transition-colors" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search movies, shows, or sports teams..." className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 focus:border-stone-500 dark:focus:border-stone-500 rounded-2xl py-4 pl-12 pr-12 text-lg text-gray-900 dark:text-white outline-none shadow-xl transition-all" autoFocus />
                    <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
                </form>
             </div>
        </div>
      )}
      {browseState.active ? (
          <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
             {(browseState.category === 'movie' || browseState.category === 'tv') && (
                 <aside className="w-full lg:w-64 shrink-0 space-y-8">
                     <div className="bg-white dark:bg-dark-card p-5 rounded-xl border border-gray-200 dark:border-white/5">
                         <div className="flex items-center gap-2 mb-4 font-bold text-gray-900 dark:text-white"><Filter className="w-4 h-4" /> Filters</div>
                         <div className="mb-6">
                             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sort By</h4>
                             <select value={filters.sort} onChange={(e) => setFilters(prev => ({...prev, sort: e.target.value}))} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm text-gray-900 dark:text-white outline-none">
                                 <option value="popularity.desc">Popularity</option>
                                 <option value="vote_average.desc">Rating</option>
                                 <option value={browseState.category === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc'}>Newest</option>
                             </select>
                         </div>
                         <div className="mb-6">
                             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Genres</h4>
                             <div className="flex flex-wrap gap-2">
                                 {availableGenres.map(g => (
                                     <button key={g.id} onClick={() => toggleFilter('genre', g.id)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${filters.genreIds.includes(g.id) ? 'bg-stone-500 border-stone-500 text-white' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-stone-500'}`}>{g.name}</button>
                                 ))}
                             </div>
                         </div>
                         <div>
                             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Where to Watch</h4>
                             <div className="grid grid-cols-2 gap-2">
                                 {availableProviders.slice(0, 10).map(p => (
                                     <button key={p.provider_id} onClick={() => toggleFilter('provider', p.provider_id)} className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${filters.providerIds.includes(p.provider_id) ? 'bg-stone-500/10 border-stone-500' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'}`} title={p.provider_name}>
                                         <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} className="w-8 h-8 rounded-md mb-1" />
                                         <span className="text-[10px] text-center w-full truncate text-gray-600 dark:text-gray-300">{p.provider_name}</span>
                                         {filters.providerIds.includes(p.provider_id) && <div className="absolute top-1 right-1 w-3 h-3 bg-stone-500 rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </aside>
             )}
             <div className="flex-1">
                 <div className="flex items-center justify-between mb-6">
                     <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{browseState.title}</h2>
                     <span className="text-sm text-gray-500">{browseResults.length} Results</span>
                 </div>
                 {browseLoading ? (
                     <div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-10 h-10 text-stone-500 animate-spin" /></div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {browseResults.map(item => <MediaCard key={item.id} item={item} onClick={setSelectedMedia} />)}
                    </div>
                 )}
             </div>
          </div>
      ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
             {!loading && (
                 <div className="text-center py-8">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Streaming in <span className="text-stone-500">{userSettings.selectedCountry.name}</span></h1>
                    <p className="text-gray-600 dark:text-dark-muted max-w-2xl mx-auto">Discover where to watch the latest content available in your region.</p>
                 </div>
             )}
             {loading ? (
                <div className="flex flex-col items-center justify-center py-32"><Loader2 className="w-12 h-12 text-stone-500 animate-spin mb-4" /><p className="text-gray-500 dark:text-dark-muted animate-pulse">Fetching latest content...</p></div>
             ) : (
                <>
                    {FEATURE_FLAGS.MOVIES && renderSection('Trending Movies', <Film className="w-6 h-6" />, trendingMovies, "No trending movies found.")}
                    {FEATURE_FLAGS.TV_SHOWS && renderSection('Popular TV Series', <Tv className="w-6 h-6" />, trendingTV, "No TV series found.")}
                    {FEATURE_FLAGS.SPORTS && renderSection('Live Sports', <Trophy className="w-6 h-6" />, liveSports, "No live sports events found.")}
                </>
             )}
          </div>
      )}
      {selectedMedia && <AvailabilityModal item={selectedMedia} country={userSettings.selectedCountry} onClose={() => setSelectedMedia(null)} />}
    </Layout>
  );
}