import { Country } from './types';

/**
 * FEATURE FLAGS
 * Toggle these to true/false to enable or disable entire categories.
 * If set to false, the app will not fetch data or show UI for that category.
 */
export const FEATURE_FLAGS = {
  MOVIES: true,
  TV_SHOWS: true,
  SPORTS: false // Set to true to enable Live Sports functionality
};

export const POPULAR_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
];

export const GENRES = [
  'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Documentary', 'Sports'
];

// Placeholder for when we don't have a poster
export const FALLBACK_POSTER = "https://picsum.photos/300/450?grayscale";
export const FALLBACK_BACKDROP = "https://picsum.photos/800/400?blur=2";