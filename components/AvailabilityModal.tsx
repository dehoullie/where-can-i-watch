import React, { useEffect, useState } from 'react';
import { MediaItem, StreamingInfo, Country } from '../types';
import { getMediaWatchProviders } from '../services/tmdbService';
import { X, ExternalLink, Loader2, MonitorPlay, AlertCircle, Clapperboard, Search } from 'lucide-react';

interface AvailabilityModalProps {
  item: MediaItem | null;
  country: Country;
  onClose: () => void;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({ item, country, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StreamingInfo | null>(null);

  useEffect(() => {
    if (item) {
      setLoading(true);

      if (item.mediaType === 'sport') {
        getStreamingAvailability(item.title, country.name, item.mediaType)
          .then(setData)
          .finally(() => setLoading(false));
      } else {
        // Use optimized unified fetch for Movies/TV
        getMediaWatchProviders(item.id, item.mediaType as 'movie' | 'tv', country.code)
          .then(setData)
          .finally(() => setLoading(false));
      }
    }
  }, [item, country]);

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        // Close if clicking strictly on the backdrop overlay
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#0c0a09] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >

        {/* Cinematic Banner */}
        <div className="relative h-64 md:h-80 shrink-0">
          {item.backdropPath ? (
              <img
                src={item.backdropPath}
                alt={item.title}
                className="w-full h-full object-cover"
              />
          ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-950" />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-transparent to-black/20" />

          {/* Title & Location Info */}
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">{item.title}</h2>
            <div className="flex items-center gap-2 text-sm md:text-base font-medium text-white/90 drop-shadow-md">
                <span className="text-xl">{country.flag}</span>
                <span>{country.name}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-white/10 rounded-full transition-colors text-white backdrop-blur-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto bg-[#0c0a09] text-stone-100 flex-1 scrollbar-thin scrollbar-thumb-stone-700">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-stone-500 animate-spin" />
              <p className="text-stone-400 animate-pulse">Checking local availability...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Summary Text */}
              {data?.description && (
                <p className="text-stone-400 text-sm leading-relaxed">
                   {data.description}
                </p>
              )}

              {/* Providers Grid */}
              {data?.providers && data.providers.length > 0 ? (
                  <div>
                      <h3 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-4">Available Platforms</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {data.providers.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-stone-500/50 transition-all group">
                                  <div className="flex items-center gap-4">
                                      {p.logoUrl ? (
                                          <img src={p.logoUrl} alt={p.name} className="w-10 h-10 rounded-xl shadow-lg ring-1 ring-white/10" />
                                      ) : (
                                          <div className="p-3 rounded-xl bg-stone-500/20 text-stone-400">
                                              <MonitorPlay className="w-5 h-5" />
                                          </div>
                                      )}
                                      <div>
                                          <div className="font-bold text-white group-hover:text-stone-400 transition-colors">{p.name}</div>
                                          <div className="text-xs text-stone-500 capitalize font-medium">
                                              {p.type === 'flatrate' ? 'Subscription' : p.type} {p.price ? `• ${p.price}` : ''}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <div className="p-4 bg-stone-500/10 rounded-full mb-4">
                        <Clapperboard className="w-10 h-10 text-stone-500 opacity-60" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Not streaming yet?</h3>
                      <p className="text-sm text-stone-400 max-w-sm">
                        No direct streaming matches found for your location. Maybe it's still a hit on the big screen? 🍿
                        Time to grab some popcorn and search for a nearby cinema theater!
                      </p>
                      <button
                        onClick={() => window.open(`https://www.google.com/search?q=cinema+theaters+near+me+playing+${encodeURIComponent(item.title)}`, '_blank')}
                        className="mt-6 px-6 py-2.5 bg-stone-500 hover:bg-stone-600 text-white rounded-full text-sm font-bold transition-all flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" /> Find nearby cinemas
                      </button>
                  </div>
              )}

              {/* Links Section */}
              {data?.groundingSources && data.groundingSources.length > 0 && (
                 <div>
                    <h3 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-4 flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" /> External Links
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {data.groundingSources.map((source, idx) => (
                            <a
                                key={idx}
                                href={source.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-stone-500/30 transition-all"
                            >
                                <span className="font-bold text-white text-sm">{source.title}</span>
                                <span className="text-xs text-stone-500 truncate mt-1">{source.uri}</span>
                            </a>
                        ))}
                    </div>
                 </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
