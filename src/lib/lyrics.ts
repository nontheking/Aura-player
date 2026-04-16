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

export async function fetchLyrics(artist: string, title: string): Promise<LyricsData | null> {
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
    console.error('Failed to fetch lyrics:', error);
    return null;
  }
}
