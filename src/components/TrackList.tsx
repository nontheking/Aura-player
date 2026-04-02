import React, { useState } from 'react';
import { Music, Video, Trash2, Play, Plus, Loader2, CheckSquare, Square } from 'lucide-react';
import { MediaFile, Playlist } from '../types';
import { cn } from '../lib/utils';

interface TrackListProps {
  files: MediaFile[];
  currentMedia: MediaFile | null;
  playlists: Playlist[];
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
  onAddToPlaylist: (playlistId: string, fileId: string) => void;
}

export function TrackList({ files, currentMedia, playlists, onPlay, onRemove, onAddToPlaylist }: TrackListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const handleBulkRemove = () => {
    selectedIds.forEach(id => onRemove(id));
    setSelectedIds(new Set());
  };

  const handleBulkAddToPlaylist = (playlistId: string) => {
    selectedIds.forEach(id => onAddToPlaylist(playlistId, id));
    setSelectedIds(new Set());
  };

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center border border-dashed border-white/10 rounded-2xl m-4">
        <Music size={48} className="mb-4 opacity-50" />
        <p>No media found</p>
        <p className="text-sm mt-2">Drag and drop files to add them to your library</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden m-4 glass-panel rounded-2xl relative">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={selectAll}
            className="text-white/50 hover:text-white transition-colors flex items-center gap-2"
          >
            {selectedIds.size === files.length && files.length > 0 ? (
              <CheckSquare size={18} className="text-[var(--color-accent)]" />
            ) : (
              <Square size={18} />
            )}
            <span className="font-semibold text-lg">Tracks ({files.length})</span>
          </button>
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm text-white/60 mr-2">{selectedIds.size} selected</span>
            
            {playlists.length > 0 && (
              <div className="relative group/bulkmenu">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors text-sm">
                  <Plus size={14} />
                  <span>Add to Playlist</span>
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover/bulkmenu:block bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50 min-w-[150px] overflow-hidden">
                  {playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleBulkAddToPlaylist(p.id)}
                      className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors truncate"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleBulkRemove}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm"
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {files.map((file) => {
          const isActive = currentMedia?.id === file.id;
          const isSelected = selectedIds.has(file.id);
          return (
            <div
              key={file.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/70",
                isSelected && !isActive && "bg-white/5"
              )}
              onClick={() => onPlay(file.id)}
            >
              <button 
                onClick={(e) => toggleSelection(e, file.id)}
                className="text-white/30 hover:text-white transition-colors p-1"
              >
                {isSelected ? (
                  <CheckSquare size={18} className="text-[var(--color-accent)]" />
                ) : (
                  <Square size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>

              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 flex-shrink-0">
                {isActive ? (
                  <Play size={14} className="fill-current text-[var(--color-accent)]" />
                ) : file.type === 'video' ? (
                  <Video size={16} />
                ) : (
                  <Music size={16} />
                )}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2">
                  <p className={cn("truncate text-sm font-medium", isActive && "text-[var(--color-accent)]")}>
                    {file.title || file.name}
                  </p>
                  {file.isIdentifying && <Loader2 size={12} className="animate-spin text-white/40" />}
                </div>
                <p className="text-xs opacity-50 truncate mt-0.5">
                  {file.author || 'Unknown'}
                </p>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                {/* Add to playlist dropdown */}
                {playlists.length > 0 && (
                  <div className="relative group/menu">
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-white/40 hover:text-white transition-all rounded-full hover:bg-white/10"
                      title="Add to Playlist"
                    >
                      <Plus size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50 min-w-[150px] overflow-hidden">
                      {playlists.map(p => (
                        <button
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToPlaylist(p.id, file.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors truncate"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}
                  className="p-2 text-white/40 hover:text-red-400 transition-all rounded-full hover:bg-white/10"
                  title="Remove from library"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
