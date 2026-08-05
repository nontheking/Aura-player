export interface ArtistInfo {
  name: string;
  bio?: string;
  imageUrl?: string;
  genres?: string[];
  similarArtists?: string[];
}

export interface TrackInfo {
  title: string;
  artist: string;
  album?: string;
  releaseDate?: string;
  duration?: number;
  coverArtUrl?: string;
  genres?: string[];
}

export interface EnrichedMetadata extends TrackInfo {
  artistInfo?: ArtistInfo;
  lyrics?: string;
}

// MusicBrainz API client
async function fetchFromMusicBrainz(artist: string, title: string): Promise<TrackInfo | null> {
  try {
    // First search for the recording
    const query = encodeURIComponent(`artist:"${artist}" AND recording:"${title}"`);
    const url = `https://musicbrainz.org/ws/2/recording/?query=${query}&fmt=json&limit=5`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AuraMusicPlayer/1.0 ( https://github.com/yourusername/aura )'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.recordings && data.recordings.length > 0) {
      const recording = data.recordings[0];
      
      // Get artist info
      let artistName = artist;
      let artistId = '';
      if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
        artistName = recording['artist-credit'][0].artist?.name || artist;
        artistId = recording['artist-credit'][0].artist?.id || '';
      }
      
      // Get album info if available
      let albumName = '';
      let releaseDate = '';
      if (recording.releases && recording.releases.length > 0) {
        const release = recording.releases[0];
        albumName = release.title || '';
        releaseDate = release.date || '';
      }
      
      // Get cover art from Cover Art Archive
      let coverArtUrl = '';
      if (recording.releases && recording.releases.length > 0) {
        const releaseId = recording.releases[0].id;
        try {
          const coverArtResponse = await fetch(
            `https://coverartarchive.org/release/${releaseId}`,
            { headers: { 'User-Agent': 'AuraMusicPlayer/1.0' } }
          );
          if (coverArtResponse.ok) {
            const coverArtData = await coverArtResponse.json();
            if (coverArtData.images && coverArtData.images.length > 0) {
              // Find front cover or first image
              const frontImage = coverArtData.images.find((img: any) => img.front) || coverArtData.images[0];
              coverArtUrl = frontImage.image;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch cover art:', e);
        }
      }
      
      return {
        title: recording.title || title,
        artist: artistName,
        album: albumName || undefined,
        releaseDate: releaseDate || undefined,
        duration: recording.length ? parseInt(recording.length) / 1000 : undefined,
        coverArtUrl: coverArtUrl || undefined
      };
    }
    
    return null;
  } catch (error) {
    console.warn('MusicBrainz fetch failed:', error);
    return null;
  }
}

// Last.fm API client
async function fetchFromLastFM(artist: string, title?: string): Promise<{ trackInfo?: TrackInfo, artistInfo?: ArtistInfo }> {
  try {
    const apiKey = localStorage.getItem('LASTFM_API_KEY') || (import.meta as any).env?.VITE_LASTFM_API_KEY;
    
    if (!apiKey) {
      console.warn('No Last.fm API key found');
      return {};
    }
    
    const baseUrl = 'https://ws.audioscrobbler.com/2.0/';
    const result: { trackInfo?: TrackInfo, artistInfo?: ArtistInfo } = {};
    
    // Fetch track info if title provided
    if (title) {
      try {
        const trackUrl = `${baseUrl}?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&format=json`;
        const trackResponse = await fetch(trackUrl);
        
        if (trackResponse.ok) {
          const trackData = await trackResponse.json();
          if (trackData.track) {
            result.trackInfo = {
              title: trackData.track.name || title,
              artist: trackData.track.artist?.name || artist,
              album: trackData.track.album?.title,
              duration: trackData.track.duration ? parseInt(trackData.track.duration) / 1000 : undefined,
              coverArtUrl: trackData.track.album?.image?.find((img: any) => img.size === 'extralarge')?.['#text'] ||
                           trackData.track.album?.image?.find((img: any) => img.size === 'large')?.['#text'],
              genres: trackData.track.toptags?.tag?.slice(0, 5).map((t: any) => t.name)
            };
          }
        }
      } catch (e) {
        console.warn('Last.fm track fetch failed:', e);
      }
    }
    
    // Fetch artist info
    try {
      const artistUrl = `${baseUrl}?method=artist.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&lang=en&format=json`;
      const artistResponse = await fetch(artistUrl);
      
      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        if (artistData.artist) {
          result.artistInfo = {
            name: artistData.artist.name || artist,
            bio: artistData.artist.bio?.summary,
            imageUrl: artistData.artist.image?.find((img: any) => img.size === 'extralarge')?.['#text'] ||
                      artistData.artist.image?.find((img: any) => img.size === 'mega')?.['#text'],
            genres: artistData.artist.tags?.tag?.slice(0, 5).map((t: any) => t.name),
            similarArtists: artistData.artist.similar?.artist?.slice(0, 5).map((a: any) => a.name)
          };
        }
      }
    } catch (e) {
      console.warn('Last.fm artist fetch failed:', e);
    }
    
    return result;
  } catch (error) {
    console.warn('Last.fm fetch failed:', error);
    return {};
  }
}

// Combined metadata enrichment
export async function enrichMediaMetadata(artist: string, title: string, album?: string): Promise<EnrichedMetadata | null> {
  const cleanArtist = artist.trim() || 'Unknown';
  const cleanTitle = title.trim();
  
  if (!cleanTitle) return null;
  
  // Try MusicBrainz first (no API key needed)
  const musicBrainzResult = await fetchFromMusicBrainz(cleanArtist, cleanTitle);
  
  // Try Last.fm (requires API key but provides richer data)
  const lastFmResult = await fetchFromLastFM(cleanArtist, cleanTitle);
  
  // Combine results with preference for Last.fm when available
  const combined: EnrichedMetadata = {
    title: lastFmResult.trackInfo?.title || musicBrainzResult?.title || cleanTitle,
    artist: lastFmResult.trackInfo?.artist || musicBrainzResult?.artist || cleanArtist,
    album: lastFmResult.trackInfo?.album || musicBrainzResult?.album || album,
    releaseDate: musicBrainzResult?.releaseDate || lastFmResult.trackInfo?.releaseDate,
    duration: lastFmResult.trackInfo?.duration || musicBrainzResult?.duration,
    coverArtUrl: lastFmResult.trackInfo?.coverArtUrl || musicBrainzResult?.coverArtUrl,
    genres: lastFmResult.trackInfo?.genres || musicBrainzResult?.genres,
    artistInfo: lastFmResult.artistInfo
  };
  
  return combined;
}

// Search for tracks on MusicBrainz
export async function searchTracks(query: string, limit = 10): Promise<TrackInfo[]> {
  try {
    const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AuraMusicPlayer/1.0'
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.recordings || []).map((recording: any) => ({
      title: recording.title || 'Unknown',
      artist: recording['artist-credit']?.[0]?.artist?.name || 'Unknown',
      album: recording.releases?.[0]?.title,
      duration: recording.length ? parseInt(recording.length) / 1000 : undefined
    }));
  } catch (error) {
    console.warn('MusicBrainz search failed:', error);
    return [];
  }
}

// Search for artists on MusicBrainz
export async function searchArtists(query: string, limit = 10): Promise<ArtistInfo[]> {
  try {
    const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AuraMusicPlayer/1.0'
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.artists || []).map((artist: any) => ({
      name: artist.name || 'Unknown',
      genres: artist.tags?.slice(0, 5).map((t: any) => t.name)
    }));
  } catch (error) {
    console.warn('MusicBrainz artist search failed:', error);
    return [];
  }
}
