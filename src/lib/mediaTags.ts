export interface MediaTags {
  title: string;
  author: string;
  album?: string;
  genre?: string;
}

export function readMediaTags(file: File): Promise<MediaTags | null> {
  return new Promise((resolve) => {
    // Check if jsmediatags is available on window (loaded via script tag)
    const jsmediatags = (window as any).jsmediatags;
    
    if (!jsmediatags) {
      console.warn('jsmediatags not loaded, skipping tag reading');
      resolve(null);
      return;
    }
    
    jsmediatags.read(file, {
      onSuccess: (tag: any) => {
        const tags = tag.tags;
        if (tags.title || tags.artist) {
          resolve({
            title: tags.title || file.name.replace(/\.[^/.]+$/, ""),
            author: tags.artist || "Unknown",
            album: tags.album,
            genre: tags.genre
          });
        } else {
          resolve(null);
        }
      },
      onError: (error: any) => {
        console.warn('Error reading media tags:', error.type, error.info);
        resolve(null);
      }
    });
  });
}
