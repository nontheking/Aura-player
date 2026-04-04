import { GoogleGenAI, Type } from "@google/genai";

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
