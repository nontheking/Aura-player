import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Settings, Youtube, FolderPlus } from 'lucide-react';
import { usePlayer } from './hooks/usePlayer';
import { PlayerControls } from './components/PlayerControls';
import { TrackList } from './components/TrackList';
import { Visualizer } from './components/Visualizer';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { YoutubeDownloader } from './components/YoutubeDownloader';
import { RepeatMode } from './types';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);
  
  const {
    library,
    playlists,
    viewMode,
    setViewMode,
    currentViewFiles,
    authors,
    currentMedia,
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
  } = usePlayer();

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  }, [addFiles]);

  // Attach media event listeners
  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('loadedmetadata', handleLoadedMetadata);
      media.addEventListener('ended', handleEnded);

      return () => {
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('loadedmetadata', handleLoadedMetadata);
        media.removeEventListener('ended', handleEnded);
      };
    }
  }, [mediaRef, handleTimeUpdate, handleLoadedMetadata, handleEnded, currentMedia]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) playNext();
          else seek(Math.min(currentTime + 5, duration));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) playPrev();
          else seek(Math.max(currentTime - 5, 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(volume - 0.1, 0));
          break;
        case 'KeyM':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, playNext, playPrev, seek, currentTime, duration, volume, setVolume, isMuted, setIsMuted]);

  return (
    <div 
      className="h-screen w-full flex relative overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Background Atmosphere */}
      <div className="atmosphere" />

      <Sidebar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        playlists={playlists}
        authors={authors}
        onCreatePlaylist={createPlaylist}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="w-full p-6 flex items-center justify-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="audio/*,video/*"
          />
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFileSelect}
            className="hidden"
            {...{ webkitdirectory: "true", directory: "true" } as any}
          />
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setIsYoutubeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors text-sm font-medium border border-red-500/20"
          >
            <Youtube size={16} />
            <span>YouTube</span>
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
          >
            <FolderPlus size={16} />
            <span>Add Folder</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
          >
            <Upload size={16} />
            <span>Add Files</span>
          </button>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto p-4 gap-6 overflow-hidden">
          
          {/* Left/Top: Visualizer & Now Playing */}
          <div className="flex-[2] flex flex-col gap-6 min-h-[40vh] lg:min-h-0">
            <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              <Visualizer 
                mediaRef={mediaRef}
                currentMedia={currentMedia}
                isPlaying={isPlaying}
              />
            </div>

            <div className="px-4 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold truncate tracking-tight">
                {currentMedia ? (currentMedia.title || currentMedia.name) : 'No Media Selected'}
              </h2>
              <p className="text-[var(--color-accent)] text-sm mt-1 uppercase tracking-widest font-medium">
                {currentMedia ? currentMedia.author : 'Drag & drop files to begin'}
              </p>
            </div>

            <div className="mt-auto pb-4">
              <PlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                repeatMode={repeatMode}
                isShuffle={isShuffle}
                onPlayPause={togglePlay}
                onNext={playNext}
                onPrev={playPrev}
                onSeek={seek}
                onVolumeChange={setVolume}
                onToggleMute={() => setIsMuted(!isMuted)}
                onToggleRepeat={() => {
                  const modes: RepeatMode[] = ['none', 'all', 'one'];
                  const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
                  setRepeatMode(nextMode);
                }}
                onToggleShuffle={() => setIsShuffle(!isShuffle)}
              />
            </div>
          </div>

          {/* Right/Bottom: TrackList */}
          <div className="flex-1 flex flex-col max-h-[50vh] lg:max-h-full">
            <TrackList
              files={currentViewFiles}
              currentMedia={currentMedia}
              playlists={playlists}
              onPlay={playTrack}
              onRemove={removeFile}
              onAddToPlaylist={addToPlaylist}
            />
          </div>

        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <YoutubeDownloader
        isOpen={isYoutubeOpen}
        onClose={() => setIsYoutubeOpen(false)}
      />
    </div>
  );
}
