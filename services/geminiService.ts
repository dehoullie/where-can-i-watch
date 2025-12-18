
import { GoogleGenAI, Type } from "@google/genai";
import { MediaItem, StreamingInfo, MediaType, WatchProvider } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_FAST = 'gemini-3-flash-preview';

// TheSportsDB Configuration
const SPORTSDB_KEY = '3'; // Public Test Key
const SPORTSDB_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;

// Helper to safely parse JSON from Gemini
const parseJSON = (text: string) => {
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error("JSON Parse Error:", e2);
      return [];
    }
  }
};

/**
 * Generate team name variations for retry logic
 */
const getTeamNameVariations = (name: string): string[] => {
    const variations = [name]; 
    if (name.includes('1. ')) variations.push(name.replace('1. ', ''));
    const noDigits = name.replace(/\s\d+\s/g, ' ').trim();
    if (noDigits !== name) variations.push(noDigits);
    const noFc = name.replace(/\b(FC|CF|AS)\b/gi, '').replace(/\s+/g, ' ').trim();
    if (noFc !== name && noFc.length > 3) variations.push(noFc);
    return variations;
};

// --- API FETCHERS ---

const fetchSportsDBEventImage = async (eventTitle: string): Promise<string | undefined> => {
    if (!eventTitle) return undefined;
    try {
        const url = `${SPORTSDB_BASE_URL}/searchevents.php?e=${encodeURIComponent(eventTitle)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.event && data.event.length > 0) {
            const evt = data.event[0];
            return evt.strThumb || evt.strLeagueBadge || evt.strHomeTeamBadge || undefined;
        }
        return undefined;
    } catch (error) { return undefined; }
};

const fetchSportsDBTeamImage = async (teamName: string): Promise<string | undefined> => {
    try {
        const url = `${SPORTSDB_BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.teams && data.teams.length > 0) {
            const team = data.teams[0];
            return team.strTeamFanart1 || team.strTeamBadge || team.strTeamBanner || undefined;
        }
        return undefined;
    } catch (e) { return undefined; }
};

const fetchSportsDBLeagueImage = async (leagueName: string): Promise<string | undefined> => {
    if (!leagueName) return undefined;
    try {
        const url = `${SPORTSDB_BASE_URL}/search_all_leagues.php?l=${encodeURIComponent(leagueName)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.countrys && data.countrys.length > 0) {
            const league = data.countrys[0];
            return league.strFanart1 || league.strBadge || league.strBanner || undefined;
        }
        return undefined;
    } catch (e) { return undefined; }
};

// --- CORE HYDRATION LOGIC ---

const hydrateSportsImages = async (events: MediaItem[]): Promise<MediaItem[]> => {
    return Promise.all(events.map(async (event) => {
        let image = await fetchSportsDBEventImage(event.title);
        if (image) return { ...event, posterPath: image };

        if (event.teams && event.teams.length > 0) {
            const homeTeam = event.teams[0];
            const variations = getTeamNameVariations(homeTeam);
            for (const name of variations) {
                image = await fetchSportsDBTeamImage(name);
                if (image) return { ...event, posterPath: image };
            }
        }

        if (event.league) {
             image = await fetchSportsDBLeagueImage(event.league);
             if (image) return { ...event, posterPath: image };
        }
        return event;
    }));
};

// --- EXPORTED FUNCTIONS ---

export const getLiveSports = async (countryName: string): Promise<MediaItem[]> => {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    
    const todayStr = now.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const searchResponse = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Find 8 major sports events in ${countryName} (${todayStr} to ${nextWeekStr}). Use Google Search. Include official League/Team names and ISO startTime.`,
      config: { tools: [{ googleSearch: {} }] }
    });

    // Define the response schema using correct Type enum from @google/genai
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          overview: { type: Type.STRING },
          mediaType: { type: Type.STRING },
          league: { type: Type.STRING },
          startTime: { type: Type.STRING },
          teams: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["id", "title", "mediaType", "teams", "startTime", "league"]
      }
    };

    const jsonResponse = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Extract the sports events from this text into JSON: ${searchResponse.text}`,
      config: { responseMimeType: "application/json", responseSchema: responseSchema }
    });

    const rawEvents: MediaItem[] = parseJSON(jsonResponse.text || "[]");
    return await hydrateSportsImages(rawEvents);
  } catch (error) {
    return [];
  }
};

export const searchSports = async (query: string): Promise<MediaItem[]> => {
  try {
    // Define the response schema using correct Type enum from @google/genai
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          mediaType: { type: Type.STRING },
          league: { type: Type.STRING },
          teams: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["id", "title", "mediaType", "teams"]
      }
    };
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Find teams or matches for: ${query}. Return JSON.`,
      config: { responseMimeType: "application/json", responseSchema: responseSchema }
    });
    const results: MediaItem[] = parseJSON(response.text || "[]");
    return await hydrateSportsImages(results);
  } catch (error) { return []; }
};

/**
 * Optimizing Streaming Availability to use ONE call with Gemini 3 Flash
 * This significantly reduces the wait time when clicking a movie/show.
 */
export const getStreamingAvailability = async (title: string, countryName: string, mediaType: MediaType): Promise<StreamingInfo> => {
    try {
      // We ask Gemini to provide both the description AND a structured block in one turn
      const prompt = `SEARCH GROUNDING: Where can I watch the ${mediaType} "${title}" in ${countryName}?
      
      Provide a natural language summary first.
      
      At the very end of your response, include a JSON block containing the providers like this:
      DATA: [{"name": "Netflix", "type": "flatrate"}, {"name": "Prime Video", "type": "rent", "price": "$3.99"}]
      
      Use types: 'flatrate', 'rent', 'buy', 'free', 'broadcast'.`;
  
      const response = await ai.models.generateContent({
        model: MODEL_FAST, 
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
  
      const fullText = response.text || "";
      
      // Extract the data from the text
      let providers: WatchProvider[] = [];
      const jsonMatch = fullText.match(/DATA:\s*(\[.*\])/s);
      if (jsonMatch && jsonMatch[1]) {
          try {
              providers = JSON.parse(jsonMatch[1]);
          } catch (e) {
              console.warn("Failed to parse providers from single-step call");
          }
      }

      const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(c => c.web ? { uri: c.web.uri, title: c.web.title } : null)
        .filter((c): c is { uri: string; title: string } => c !== null) || [];
  
      return {
        description: fullText.split('DATA:')[0].trim(),
        providers: providers,
        groundingSources: groundingSources
      };
  
    } catch (error) {
      console.error("Error checking availability:", error);
      return { description: "Error loading data.", providers: [], groundingSources: [] };
    }
  };
