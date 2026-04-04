// @ts-ignore
import * as jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

export interface MediaTags {
  title: string;
  author: string;
  album?: string;
  genre?: string;
}

export function readMediaTags(file: File): Promise<MediaTags | null> {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (tag) => {
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
      onError: (error) => {
        console.warn('Error reading media tags:', error.type, error.info);
        resolve(null);
      }
    });
  });
}
