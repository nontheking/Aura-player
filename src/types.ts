export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string; // 'audio' | 'video'
  file: File;
  duration?: number;
  author?: string;
  title?: string;
  isIdentifying?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  fileIds: string[];
}

export type RepeatMode = 'none' | 'all' | 'one';
export type ViewMode = 'library' | { type: 'playlist', id: string } | { type: 'author', name: string };
