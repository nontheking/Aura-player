import { GoogleGenAI, Type } from "@google/genai";

export async function identifyMedia(filename: string): Promise<{ title: string; author: string }> {
  try {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("No Gemini API key found. Skipping AI identification.");
      return { title: filename.replace(/\.[^/.]+$/, ""), author: "Unknown" };
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this media filename and extract the likely song title and author/artist. If it's not a song or you can't tell, just return the cleaned up filename as title and 'Unknown' as author. Filename: "${filename}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the song or media" },
            author: { type: Type.STRING, description: "The author or artist" }
          },
          required: ["title", "author"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (error) {
    console.error("AI Identification failed:", error);
  }
  
  // Fallback
  return { title: filename.replace(/\.[^/.]+$/, ""), author: "Unknown" };
}
