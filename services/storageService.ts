import { UserSettings, Country } from '../types';
import { POPULAR_COUNTRIES } from '../constants';

const SETTINGS_KEY = 'wtw_user_settings';
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

const DEFAULT_SETTINGS: UserSettings = {
  selectedCountry: POPULAR_COUNTRIES[0], // Default to US
  favorites: [],
};

interface StoredData {
  settings: UserSettings;
  timestamp: number;
}

export const getSettings = (): UserSettings => {
  try {
    const item = localStorage.getItem(SETTINGS_KEY);
    if (!item) return DEFAULT_SETTINGS;

    const parsed: StoredData = JSON.parse(item);
    const now = Date.now();

    // Check if expired
    if (now - parsed.timestamp > EXPIRATION_MS) {
      localStorage.removeItem(SETTINGS_KEY);
      return DEFAULT_SETTINGS;
    }

    return parsed.settings;
  } catch (e) {
    console.error("Failed to load settings", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings): void => {
  try {
    const data: StoredData = {
      settings,
      timestamp: Date.now(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
};

export const toggleFavorite = (mediaId: string): string[] => {
  const settings = getSettings();
  const exists = settings.favorites.includes(mediaId);
  let newFavs;
  if (exists) {
    newFavs = settings.favorites.filter(id => id !== mediaId);
  } else {
    newFavs = [...settings.favorites, mediaId];
  }
  saveSettings({ ...settings, favorites: newFavs });
  return newFavs;
};