import React, { useState } from 'react';
import { Library, ListMusic, User, Plus } from 'lucide-react';
import { Playlist, ViewMode } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  playlists: Playlist[];
  authors: string[];
  onCreatePlaylist: (name: string) => void;
}

export function Sidebar({ viewMode, setViewMode, playlists, authors, onCreatePlaylist }: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  const isLibrary = viewMode === 'library';

  return (
    <div className="w-full h-full glass-panel border-r border-white/10 flex flex-col overflow-hidden z-20 bg-black/20">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <img src="/icon.svg" alt="Aura" className="w-8 h-8" />
        <h1 className="text-lg font-semibold tracking-wide">Aura</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Library */}
        <div>
          <button
            onClick={() => setViewMode('library')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
              isLibrary ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Library size={18} />
            All Media
          </button>
        </div>

        {/* Playlists */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Playlists</h3>
            <button 
              onClick={() => onCreatePlaylist('')} // We'll intercept this in App.tsx to open modal
              className="text-white/40 hover:text-white transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1">
            {playlists.map(p => {
              const isActive = typeof viewMode === 'object' && viewMode.type === 'playlist' && viewMode.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setViewMode({ type: 'playlist', id: p.id })}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                    isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <ListMusic size={16} />
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Authors */}
        {authors.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">Authors</h3>
            <div className="space-y-1">
              {authors.map(author => {
                const isActive = typeof viewMode === 'object' && viewMode.type === 'author' && viewMode.name === author;
                return (
                  <button
                    key={author}
                    onClick={() => setViewMode({ type: 'author', name: author })}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                      isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <User size={16} />
                    <span className="truncate">{author}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
