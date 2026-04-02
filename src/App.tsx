import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Settings, Youtube, FolderPlus, PanelLeft } from 'lucide-react';
import { usePlayer } from './hooks/usePlayer';
import { PlayerControls } from './components/PlayerControls';
import { TrackList } from './components/TrackList';
import { Visualizer } from './components/Visualizer';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { YoutubeDownloader } from './components/YoutubeDownloader';
import { PlaylistEditorModal } from './components/PlaylistEditorModal';
import { SoundEnhancerModal } from './components/SoundEnhancerModal';
import { useAudioEffects } from './hooks/useAudioEffects';
import { RepeatMode, Playlist } from './types';
import { SlidersHorizontal } from 'lucide-react';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);
  const [isEnhancerOpen, setIsEnhancerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(true);
  const [editingPlaylist, setEditingPlaylist] = useState<{ id: string | null, name: string, fileIds: string[] } | null>(null);
  
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
    createOrUpdatePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    playTrack,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded
  } = usePlayer();

  const { analyser, eq, setEq } = useAudioEffects(mediaRef, isPlaying);

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

      <div className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
        <Sidebar 
          viewMode={viewMode}
          setViewMode={setViewMode}
          playlists={playlists}
          authors={authors}
          onCreatePlaylist={() => setEditingPlaylist({ id: null, name: '', fileIds: [] })}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="w-full p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              title="Toggle Sidebar"
            >
              <PanelLeft size={18} />
            </button>
            {typeof viewMode === 'object' && viewMode.type === 'playlist' && (
              <button
                onClick={() => {
                  const pl = playlists.find(p => p.id === viewMode.id);
                  if (pl) setEditingPlaylist({ id: pl.id, name: pl.name, fileIds: pl.fileIds });
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors border border-white/10 text-sm"
              >
                Edit Playlist
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
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
              onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
              className={`flex items-center justify-center px-4 py-2 rounded-full transition-colors border text-sm font-medium ${
                isVisualizerOpen 
                  ? 'bg-white/10 hover:bg-white/20 border-white/10' 
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/60'
              }`}
              title="Toggle Visualizer"
            >
              Visualizer
            </button>
            <button
              onClick={() => setIsEnhancerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              title="Sound Enhancer"
            >
              <SlidersHorizontal size={18} />
            </button>
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
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto p-4 gap-6 overflow-hidden">
          
          {/* Left/Top: Visualizer & Now Playing */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col gap-6 ${isVisualizerOpen ? 'flex-[2] min-h-[40vh] lg:min-h-0 opacity-100' : 'w-0 h-0 opacity-0 flex-none lg:w-0 lg:h-auto'}`}>
            <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              <Visualizer 
                mediaRef={mediaRef}
                currentMedia={currentMedia}
                isPlaying={isPlaying}
                analyser={analyser}
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
          </div>

          {/* Right/Bottom: TrackList */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${isVisualizerOpen ? 'max-h-[50vh] lg:max-h-full' : 'h-full'}`}>
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

        {/* Player Controls - Always visible at the bottom */}
        <div className="w-full max-w-7xl mx-auto p-4 pt-0 mt-auto">
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
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <YoutubeDownloader
        isOpen={isYoutubeOpen}
        onClose={() => setIsYoutubeOpen(false)}
      />
      <SoundEnhancerModal
        isOpen={isEnhancerOpen}
        onClose={() => setIsEnhancerOpen(false)}
        eq={eq}
        setEq={setEq}
      />
      <PlaylistEditorModal
        isOpen={editingPlaylist !== null}
        onClose={() => setEditingPlaylist(null)}
        library={library}
        initialName={editingPlaylist?.name || ''}
        initialSelectedIds={editingPlaylist?.fileIds || []}
        onSave={(name, fileIds) => {
          createOrUpdatePlaylist(editingPlaylist?.id || null, name, fileIds);
        }}
      />
    </div>
  );
}
