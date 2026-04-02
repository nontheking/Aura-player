import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { get, set } from 'idb-keyval';
import { MediaFile, RepeatMode, Playlist, ViewMode } from '../types';
import { identifyMedia } from '../lib/ai';

export function usePlayer() {
  const [library, setLibrary] = useState<MediaFile[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [queue, setQueue] = useState<MediaFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  const mediaRef = useRef<HTMLMediaElement | null>(null);

  // Load from IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      try {
        const storedLibrary = await get<MediaFile[]>('aura_library');
        const storedPlaylists = await get<Playlist[]>('aura_playlists');
        
        if (storedLibrary && Array.isArray(storedLibrary)) {
          // Recreate URLs for the stored files
          const loadedLibrary = storedLibrary.map(f => ({
            ...f,
            url: f.file ? URL.createObjectURL(f.file) : f.url
          }));
          setLibrary(loadedLibrary);
        }
        
        if (storedPlaylists && Array.isArray(storedPlaylists)) {
          setPlaylists(storedPlaylists);
        }
      } catch (err) {
        console.error("Failed to load data from IndexedDB:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Save to IndexedDB when library changes
  useEffect(() => {
    if (!isLoaded) return;
    // We don't need to save the `url` as it's session specific
    const libraryToSave = library.map(f => ({ ...f, url: '' }));
    set('aura_library', libraryToSave).catch(err => console.error("Failed to save library:", err));
  }, [library, isLoaded]);

  // Save to IndexedDB when playlists change
  useEffect(() => {
    if (!isLoaded) return;
    set('aura_playlists', playlists).catch(err => console.error("Failed to save playlists:", err));
  }, [playlists, isLoaded]);

  const currentMedia = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  const currentViewFiles = useMemo(() => {
    if (viewMode === 'library') return library;
    if (typeof viewMode === 'object') {
      if (viewMode.type === 'playlist') {
        const pl = playlists.find(p => p.id === viewMode.id);
        return pl ? pl.fileIds.map(id => library.find(f => f.id === id)).filter(Boolean) as MediaFile[] : [];
      }
      if (viewMode.type === 'author') {
        return library.filter(f => f.author === viewMode.name);
      }
    }
    return [];
  }, [library, playlists, viewMode]);

  const authors = useMemo(() => {
    const auths = new Set(library.map(f => f.author || 'Unknown'));
    return Array.from(auths).sort();
  }, [library]);

  // Handle shuffle logic
  useEffect(() => {
    if (isShuffle && queue.length > 0) {
      const indices = Array.from({ length: queue.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    } else {
      setShuffledIndices([]);
    }
  }, [isShuffle, queue.length]);

  const play = useCallback(async () => {
    if (mediaRef.current) {
      try {
        await mediaRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const getNextIndex = useCallback(() => {
    if (queue.length === 0) return -1;
    
    if (isShuffle && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      if (currentShufflePos === -1 || currentShufflePos === shuffledIndices.length - 1) {
        return repeatMode === 'all' ? shuffledIndices[0] : -1;
      }
      return shuffledIndices[currentShufflePos + 1];
    }

    if (currentIndex === queue.length - 1) {
      return repeatMode === 'all' ? 0 : -1;
    }
    return currentIndex + 1;
  }, [currentIndex, queue.length, isShuffle, shuffledIndices, repeatMode]);

  const getPrevIndex = useCallback(() => {
    if (queue.length === 0) return -1;

    if (isShuffle && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      if (currentShufflePos <= 0) {
        return repeatMode === 'all' ? shuffledIndices[shuffledIndices.length - 1] : -1;
      }
      return shuffledIndices[currentShufflePos - 1];
    }

    if (currentIndex <= 0) {
      return repeatMode === 'all' ? queue.length - 1 : -1;
    }
    return currentIndex - 1;
  }, [currentIndex, queue.length, isShuffle, shuffledIndices, repeatMode]);

  const playNext = useCallback(() => {
    const nextIdx = getNextIndex();
    if (nextIdx !== -1) {
      setCurrentIndex(nextIdx);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      if (mediaRef.current) mediaRef.current.currentTime = 0;
    }
  }, [getNextIndex]);

  const playPrev = useCallback(() => {
    if (currentTime > 3 && mediaRef.current) {
      mediaRef.current.currentTime = 0;
      return;
    }
    const prevIdx = getPrevIndex();
    if (prevIdx !== -1) {
      setCurrentIndex(prevIdx);
    }
  }, [currentTime, getPrevIndex]);

  const seek = useCallback((time: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      if (isPlaying) play();
    }
  }, [isPlaying, play]);

  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      if (mediaRef.current) {
        mediaRef.current.currentTime = 0;
        play();
      }
    } else {
      playNext();
    }
  }, [repeatMode, play, playNext]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const validExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.mp4', '.webm', '.mkv'];
    
    const newFiles: MediaFile[] = Array.from(files)
      .filter(f => {
        if (f.type.startsWith('audio/') || f.type.startsWith('video/')) return true;
        const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
        return validExtensions.includes(ext);
      })
      .map(file => {
        const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.mkv'].some(ext => file.name.toLowerCase().endsWith(ext));
        return {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          url: URL.createObjectURL(file),
          type: isVideo ? 'video' : 'audio',
          file,
          title: file.name.replace(/\.[^/.]+$/, ""),
          author: "Unknown",
          isIdentifying: true
        };
      });

    if (newFiles.length === 0) return;

    setLibrary(prev => [...prev, ...newFiles]);
    
    setQueue(prev => {
      if (prev.length === 0) {
        setCurrentIndex(0);
        setTimeout(() => setIsPlaying(true), 100);
        return newFiles;
      }
      return prev;
    });

    // Run AI identification in background
    newFiles.forEach(async (file) => {
      try {
        const { title, author } = await identifyMedia(file.name);
        setLibrary(prev => prev.map(f => 
          f.id === file.id ? { ...f, title, author, isIdentifying: false } : f
        ));
        setQueue(prev => prev.map(f => 
          f.id === file.id ? { ...f, title, author, isIdentifying: false } : f
        ));
      } catch (e) {
        setLibrary(prev => prev.map(f => f.id === file.id ? { ...f, isIdentifying: false } : f));
        setQueue(prev => prev.map(f => f.id === file.id ? { ...f, isIdentifying: false } : f));
      }
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setLibrary(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx !== -1) URL.revokeObjectURL(prev[idx].url);
      return prev.filter(f => f.id !== id);
    });
    setQueue(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx === -1) return prev;
      const updated = prev.filter(f => f.id !== id);
      if (updated.length === 0) {
        setCurrentIndex(-1);
        setIsPlaying(false);
      } else if (idx === currentIndex) {
        setCurrentIndex(idx >= updated.length ? 0 : idx);
      } else if (idx < currentIndex) {
        setCurrentIndex(c => c - 1);
      }
      return updated;
    });
  }, [currentIndex]);

  const createPlaylist = useCallback((name: string) => {
    setPlaylists(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 9),
      name,
      fileIds: []
    }]);
  }, []);

  const addToPlaylist = useCallback((playlistId: string, fileId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.fileIds.includes(fileId)) {
        return { ...p, fileIds: [...p.fileIds, fileId] };
      }
      return p;
    }));
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, fileId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, fileIds: p.fileIds.filter(id => id !== fileId) };
      }
      return p;
    }));
  }, []);

  const playTrack = useCallback((fileId: string) => {
    setQueue(currentViewFiles);
    const idx = currentViewFiles.findIndex(f => f.id === fileId);
    setCurrentIndex(idx !== -1 ? idx : 0);
    setTimeout(() => setIsPlaying(true), 50);
  }, [currentViewFiles]);

  // Handle volume changes
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      library.forEach(f => URL.revokeObjectURL(f.url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    library,
    playlists,
    viewMode,
    setViewMode,
    currentViewFiles,
    authors,
    currentMedia,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    mediaRef,
    play,
    pause,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
    setIsMuted,
    setRepeatMode,
    setIsShuffle,
    addFiles,
    removeFile,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    playTrack,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded
  };
}
