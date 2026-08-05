export interface LyricsData {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

// Clean up title by removing common noise patterns
function cleanTitle(title: string): string {
  let cleaned = title;
  
  // Remove file extensions
  cleaned = cleaned.replace(/\.[^/.]+$/, "");
  
  // Remove common noise patterns (case insensitive)
  const noisePatterns = [
    /\s*\([^)]*(?:official|video|lyric|audio|music|hd|4k|remix|feat\.?|ft\.?|cover|live|acoustic|instrumental|extended|mix|edit|version)[^)]*\)*/gi,
    /\s*\[[^\]]*(?:official|video|lyric|audio|music|hd|4k|remix|feat\.?|ft\.?|cover|live|acoustic|instrumental|extended|mix|edit|version)[^\]]*\]*/gi,
    /\s*[-–_]\s*(?:official|video|lyric|audio|music|hd|4k|remix|feat\.?|ft\.?|cover|live|acoustic|instrumental|extended|mix|edit|version).*/gi,
    /\s*(?:lyrics?|subtitles?|cc|eng|english)\s*$/gi,
  ];
  
  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Clean up extra spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Clean up artist name
function cleanArtist(artist: string): string {
  let cleaned = artist;
  
  // Remove common patterns that aren't part of artist names
  cleaned = cleaned.replace(/\s*\([^)]*(?:topic|vevo|official|records|entertainment)[^)]*\)*/gi, '');
  cleaned = cleaned.replace(/\s*\[[^\]]*\]/g, '');
  cleaned = cleaned.replace(/[-–_]\s*(?:topic|vevo|official|records|entertainment).*$/gi, '');
  
  // Clean up extra spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

async function fetchFromLRCLIB(artist: string, title: string): Promise<LyricsData | null> {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`LRCLIB API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data as LyricsData;
  } catch (error) {
    console.warn('LRCLIB fetch failed:', error);
    return null;
  }
}

async function fetchFromLRCLIBSearch(query: string): Promise<LyricsData | null> {
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const results = await response.json() as LyricsData[];
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch (error) {
    console.warn('LRCLIB search failed:', error);
    return null;
  }
}

export async function fetchLyricsWithGemini(artist: string, title: string): Promise<LyricsData | null> {
  try {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("No Gemini API key found for lyrics fallback.");
      return null;
    }

    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Find the complete lyrics for the song "${title}" by ${artist}. 
    Provide the response in the following JSON format:
    {
      "plainLyrics": "the complete lyrics text here with line breaks preserved",
      "isInstrumental": false
    }
    
    If you cannot find the exact lyrics, provide what you know or indicate it's unavailable.
    Do not include any copyright notices or disclaimers in the lyrics themselves.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plainLyrics: { type: Type.STRING, description: "The complete lyrics of the song" },
            isInstrumental: { type: Type.BOOLEAN, description: "Whether the song is instrumental" }
          },
          required: ["plainLyrics", "isInstrumental"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      if (result.plainLyrics && result.plainLyrics.trim()) {
        return {
          id: Date.now(),
          trackName: title,
          artistName: artist,
          albumName: "",
          duration: 0,
          instrumental: result.isInstrumental || false,
          plainLyrics: result.plainLyrics,
          syncedLyrics: null
        };
      }
    }
  } catch (error) {
    console.warn('Gemini lyrics fetch failed:', error);
  }
  return null;
}

export async function fetchLyrics(artist: string, title: string): Promise<LyricsData | null> {
  // Clean up inputs
  const cleanArtistName = cleanArtist(artist || 'Unknown');
  const cleanTitleName = cleanTitle(title || '');
  
  if (!cleanTitleName) {
    return null;
  }

  // Strategy 1: Direct search with cleaned artist and title
  console.log('Trying LRCLIB with cleaned metadata...');
  let result = await fetchFromLRCLIB(cleanArtistName, cleanTitleName);
  if (result) {
    console.log('Found lyrics via direct LRCLIB search');
    return result;
  }

  // Strategy 2: Search with just title (in case artist name doesn't match)
  console.log('Trying LRCLIB with title only...');
  result = await fetchFromLRCLIBSearch(cleanTitleName);
  if (result) {
    console.log('Found lyrics via LRCLIB title search');
    return result;
  }

  // Strategy 3: Try with "artist - title" combined query
  console.log('Trying LRCLIB with combined query...');
  result = await fetchFromLRCLIBSearch(`${cleanArtistName} ${cleanTitleName}`);
  if (result) {
    console.log('Found lyrics via LRCLIB combined search');
    return result;
  }

  // Strategy 4: Try without parentheses content in title
  const simpleTitle = cleanTitleName.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  if (simpleTitle && simpleTitle !== cleanTitleName) {
    console.log('Trying LRCLIB with simplified title...');
    result = await fetchFromLRCLIBSearch(simpleTitle);
    if (result) {
      console.log('Found lyrics via simplified title search');
      return result;
    }
  }

  // Strategy 5: Fallback to Gemini AI
  console.log('Falling back to Gemini AI for lyrics...');
  result = await fetchLyricsWithGemini(cleanArtistName, cleanTitleName);
  if (result) {
    console.log('Found lyrics via Gemini AI');
    return result;
  }

  console.log('No lyrics found after all strategies');
  return null;
}
