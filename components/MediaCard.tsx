import React, { useState } from 'react';
import { MediaItem } from '../types';
import { Play, Calendar, Star, Tv } from 'lucide-react';
import { FALLBACK_POSTER } from '../constants';

interface MediaCardProps {
  item: MediaItem;
  onClick: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const isSport = item.mediaType === 'sport';
  
  // Logic: Show image if it exists and hasn't failed. 
  // If it's a sport and image fails/missing, show the specialized sport card.
  // If it's a movie/tv and image fails/missing, show fallback poster.
  const showImage = item.posterPath && !imgError;

  // Format Date for Sport
  const formattedDate = item.startTime 
    ? new Date(item.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative bg-white dark:bg-dark-card rounded-xl overflow-hidden cursor-pointer border border-stone-200 dark:border-white/5 hover:border-stone-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-stone-500/10 flex flex-col h-full"
    >
      {/* Image / Gradient Header */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-stone-200 dark:bg-stone-800">
        
        {showImage ? (
           <img 
            src={item.posterPath} 
            alt={item.title} 
            onError={() => setImgError(true)}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : isSport ? (
          // Fallback Sport Card (Gradient)
          <div className="absolute inset-0 bg-gradient-to-br from-stone-600 to-stone-900 dark:from-stone-900 dark:to-stone-950 flex items-center justify-center p-4">
             <div className="text-center">
                <div className="inline-block p-3 rounded-full bg-white/20 mb-3">
                  <Tv className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg leading-tight text-white">{item.title}</h3>
                {item.league && <p className="text-sm text-stone-100 mt-1">{item.league}</p>}
             </div>
          </div>
        ) : (
          // Fallback Movie/TV Poster
           <img 
            src={FALLBACK_POSTER} 
            alt={item.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        )}
        
        {/* Gradient Overlay for Text Readability on Images */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:hidden" />
        
        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
            {item.rating && (
                <div className="bg-black/60 backdrop-blur-md text-yellow-400 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400" /> {item.rating}
                </div>
            )}
            {item.isLive && (
                <div className="bg-stone-500 text-white px-2 py-1 rounded-md text-xs font-bold animate-pulse">
                    LIVE
                </div>
            )}
        </div>

        {/* Date Overlay for Sports */}
        {isSport && formattedDate && (
             <div className="absolute bottom-2 left-2 right-2">
                 <div className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 w-fit shadow-sm">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {formattedDate}
                 </div>
             </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg line-clamp-1 text-stone-900 dark:text-white group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors">
            {item.title}
        </h3>
        
        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1 mt-2 mb-3">
             {item.genres && item.genres.length > 0 ? (
                 item.genres.map((g, i) => (
                    <span key={i} className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                        {g}
                    </span>
                 ))
             ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                    {item.mediaType}
                </span>
             )}
             {item.releaseDate && !isSport && (
                 <span className="text-[10px] text-stone-400 flex items-center ml-auto">
                    {item.releaseDate.split('-')[0]}
                 </span>
             )}
        </div>

        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-4 flex-1">
            {item.overview || "No description available."}
        </p>

        <button className="w-full mt-auto bg-stone-100 dark:bg-white/5 hover:bg-stone-500 dark:hover:bg-stone-600 hover:text-white text-stone-600 dark:text-stone-400 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
            <Play className="w-4 h-4 fill-current" />
            Where to Watch
        </button>
      </div>
    </div>
  );
};