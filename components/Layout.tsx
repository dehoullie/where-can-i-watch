import React, { useEffect, useState, useRef } from 'react';
import { Country, UserSettings } from '../types';
import { Globe, Menu, Search, Video, X, Sun, Moon, ChevronDown, Trophy, Tv, Film, Home } from 'lucide-react';
import { POPULAR_COUNTRIES, FEATURE_FLAGS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  userSettings: UserSettings;
  onCountryChange: (country: Country) => void;
  onSearchClick: () => void;
  onNavigate: (type: 'movie' | 'tv' | 'sport', endpoint?: string, title?: string) => void;
  onGoHome: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userSettings, onCountryChange, onSearchClick, onNavigate, onGoHome }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = React.useState(false);
  
  const [movieDropdown, setMovieDropdown] = useState(false);
  const [tvDropdown, setTvDropdown] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wtw_theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('wtw_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('wtw_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const NavLink = ({ label, onClick, icon }: { label: string, onClick: () => void, icon?: React.ReactNode }) => (
    <button 
        onClick={() => { onClick(); setIsMenuOpen(false); }}
        className="flex items-center gap-2 px-4 py-2 text-stone-600 dark:text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 rounded-lg transition-colors w-full text-left"
    >
        {icon}
        {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-dark-bg dark:text-dark-text flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-stone-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-2 cursor-pointer group" onClick={onGoHome}>
              <div className="p-1.5 bg-stone-500 rounded-lg group-hover:bg-stone-600 transition-colors">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block text-stone-900 dark:text-white group-hover:text-stone-500 transition-colors">Where can I watch?</span>
            </div>

            <nav className="hidden md:flex items-center gap-1 mx-4">
                <button 
                    onClick={onGoHome}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                >
                    <Home className="w-4 h-4 mr-1" />
                    Home
                </button>

                {FEATURE_FLAGS.MOVIES && (
                  <div className="relative group" onMouseEnter={() => setMovieDropdown(true)} onMouseLeave={() => setMovieDropdown(false)}>
                      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:text-stone-500 dark:hover:text-stone-400 transition-colors">
                          Movies <ChevronDown className="w-4 h-4" />
                      </button>
                      {movieDropdown && (
                          <div className="absolute top-full left-0 w-48 py-2 bg-white dark:bg-dark-card border border-stone-200 dark:border-white/10 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                               <NavLink label="Popular" onClick={() => onNavigate('movie', 'popular', 'Popular Movies')} icon={<Film className="w-4 h-4"/>} />
                               <NavLink label="Top Rated" onClick={() => onNavigate('movie', 'top_rated', 'Top Rated Movies')} icon={<Trophy className="w-4 h-4"/>} />
                               <NavLink label="Upcoming" onClick={() => onNavigate('movie', 'upcoming', 'Upcoming Movies')} icon={<Video className="w-4 h-4"/>} />
                          </div>
                      )}
                  </div>
                )}

                {FEATURE_FLAGS.TV_SHOWS && (
                  <div className="relative group" onMouseEnter={() => setTvDropdown(true)} onMouseLeave={() => setTvDropdown(false)}>
                      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:text-stone-500 dark:hover:text-stone-400 transition-colors">
                          TV Shows <ChevronDown className="w-4 h-4" />
                      </button>
                      {tvDropdown && (
                          <div className="absolute top-full left-0 w-48 py-2 bg-white dark:bg-dark-card border border-stone-200 dark:border-white/10 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                               <NavLink label="Popular" onClick={() => onNavigate('tv', 'popular', 'Popular Series')} icon={<Tv className="w-4 h-4"/>} />
                               <NavLink label="Top Rated" onClick={() => onNavigate('tv', 'top_rated', 'Top Rated Series')} icon={<Trophy className="w-4 h-4"/>} />
                               <NavLink label="On TV" onClick={() => onNavigate('tv', 'on_the_air', 'On The Air')} icon={<Video className="w-4 h-4"/>} />
                          </div>
                      )}
                  </div>
                )}

                {FEATURE_FLAGS.SPORTS && (
                  <button 
                      onClick={() => onNavigate('sport', undefined, 'Live Sports')} 
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                  >
                      Live Sports
                  </button>
                )}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 text-stone-500 hover:text-stone-500 dark:text-dark-muted dark:hover:text-stone-400">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button onClick={onSearchClick} className="p-2 text-stone-500 hover:text-stone-500 dark:text-dark-muted dark:hover:text-stone-400">
                <Search className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setIsCountryModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-dark-card dark:hover:bg-stone-900/30 border border-stone-200 dark:border-white/10 text-sm font-medium text-stone-900 dark:text-white"
              >
                <span className="text-lg">{userSettings.selectedCountry.flag}</span>
                <span>{userSettings.selectedCountry.name}</span>
                <Globe className="w-4 h-4 text-stone-500 dark:text-dark-muted ml-1" />
              </button>
            </div>

            <div className="md:hidden flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 text-stone-500 dark:text-dark-muted">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
               <button onClick={onSearchClick} className="p-2 text-stone-500 dark:text-dark-muted">
                <Search className="w-5 h-5" />
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-stone-500 dark:text-dark-muted">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-dark-bg pt-20 px-4 transition-colors duration-300 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Navigation</h3>
            <NavLink label="Home" onClick={onGoHome} icon={<Home className="w-4 h-4" />} />

            {FEATURE_FLAGS.MOVIES && (
              <>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-4 mb-2">Movies</h3>
                <NavLink label="Popular Movies" onClick={() => onNavigate('movie', 'popular', 'Popular Movies')} />
                <NavLink label="Top Rated Movies" onClick={() => onNavigate('movie', 'top_rated', 'Top Rated Movies')} />
                <NavLink label="Upcoming Movies" onClick={() => onNavigate('movie', 'upcoming', 'Upcoming Movies')} />
              </>
            )}
            
            {FEATURE_FLAGS.TV_SHOWS && (
              <>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-4 mb-2">TV Shows</h3>
                <NavLink label="Popular Series" onClick={() => onNavigate('tv', 'popular', 'Popular Series')} />
                <NavLink label="Top Rated Series" onClick={() => onNavigate('tv', 'top_rated', 'Top Rated Series')} />
                <NavLink label="On TV" onClick={() => onNavigate('tv', 'on_the_air', 'On The Air')} />
              </>
            )}

            {FEATURE_FLAGS.SPORTS && (
              <>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-4 mb-2">Sports</h3>
                <NavLink label="Live Sports" onClick={() => onNavigate('sport', undefined, 'Live Sports')} />
              </>
            )}

            <div className="h-px bg-stone-200 dark:bg-white/10 my-4" />

            <button 
              onClick={() => { setIsCountryModalOpen(true); setIsMenuOpen(false); }}
              className="flex items-center justify-between p-4 rounded-lg bg-stone-100 dark:bg-dark-card border border-stone-200 dark:border-white/10"
            >
              <span className="flex items-center gap-2 text-stone-900 dark:text-white">
                <Globe className="w-5 h-5 text-stone-500" />
                Change Country
              </span>
              <div className="flex items-center gap-2 text-stone-900 dark:text-white">
                <span className="text-2xl">{userSettings.selectedCountry.flag}</span>
                <span>{userSettings.selectedCountry.code}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {isCountryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[80vh] text-stone-900 dark:text-white">
            <div className="p-4 border-b border-stone-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Location</h3>
              <button onClick={() => setIsCountryModalOpen(false)} className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-2">
              <div className="grid grid-cols-1 gap-1">
                {POPULAR_COUNTRIES.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      onCountryChange(country);
                      setIsCountryModalOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      userSettings.selectedCountry.code === country.code 
                        ? 'bg-stone-500/10 dark:bg-stone-900/30 border border-stone-500' 
                        : 'hover:bg-stone-100 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <span className="font-medium flex-1 text-left">{country.name}</span>
                    {userSettings.selectedCountry.code === country.code && (
                      <div className="w-2 h-2 rounded-full bg-stone-500"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
        {children}
      </main>

      <footer className="bg-white dark:bg-dark-card border-t border-stone-200 dark:border-white/5 py-8 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center text-stone-500 dark:text-dark-muted text-sm">
          <p>© 2024 Where can I watch? Real-time streaming guide.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;