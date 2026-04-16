import { GoogleGenAI, Type } from "@google/genai";
import { extractAudioClipBase64 } from './audio-utils';

export async function identifyMediaBatch(filenames: string[]): Promise<{ title: string; author: string; album?: string; genre?: string }[]> {
  const fallbacks = filenames.map(filename => ({ title: filename.replace(/\.[^/.]+$/, ""), author: "Unknown" }));
  
  if (filenames.length === 0) return [];

  try {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("No Gemini API key found. Skipping AI identification.");
      return fallbacks;
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these media filenames and extract the likely song title, author/artist, album, and genre for each. If it's not a song or you can't tell, just return the cleaned up filename as title and 'Unknown' as author. Filenames:\n${filenames.map((f, i) => `${i}: "${f}"`).join('\n')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The title of the song or media" },
              author: { type: Type.STRING, description: "The author or artist" },
              album: { type: Type.STRING, description: "The album name, if identifiable" },
              genre: { type: Type.STRING, description: "The genre, if identifiable" }
            },
            required: ["title", "author"]
          }
        }
      }
    });

    if (response.text) {
      const results = JSON.parse(response.text);
      if (Array.isArray(results) && results.length === filenames.length) {
        return results;
      }
    }
  } catch (error) {
    console.error("AI Batch Identification failed:", error);
  }
  
  // Fallback
  return fallbacks;
}

export async function autoSyncLyricsOffset(file: File, firstLyricLine: string, expectedTime: number): Promise<number | null> {
  try {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    // Instead of using the raw file which could be a 50MB video, extract the audio specifically 
    // where we expect the first lyric to play, plus 45 seconds of padding for intros.
    // 1 minute of 16kHz audio = ~1.9MB! Safe for Gemini!
    const clipDuration = expectedTime + 45;
    const base64Data = await extractAudioClipBase64(file, clipDuration);

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'audio/wav'
          }
        },
        `Listen to this audio track. The singer will eventually start singing the following line of lyrics: "${firstLyricLine}". 
According to the official database, they start singing this at exactly ${expectedTime} seconds, but this specific audio file might have a video intro, padded silence, or a different arrangement, causing it to be out of sync.
At what exact timestamp (in seconds) does the singer ACTUALLY begin singing the words "${firstLyricLine}" in this specific audio file?
Be as precise as possible. Respond with ONLY the numeric timestamp in seconds in the required JSON format. If you cannot find the vocals at all, return null.`
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actualTimeInSeconds: { 
              type: Type.NUMBER, 
              // Need to pass nullable differently or avoid it. GenAI SDK handles raw schemas.
              description: "The actual time in seconds when the singer starts singing"
            }
          }
        }
      }
    });

    if (response.text) {
      const res = JSON.parse(response.text);
      if (typeof res.actualTimeInSeconds === 'number') {
        const offset = res.actualTimeInSeconds - expectedTime;
        // Keep to 1 decimal place
        return Number(offset.toFixed(1));
      }
    }
  } catch (err) {
    console.error("AI Auto-Sync failed:", err);
  }
  
  return null;
}
