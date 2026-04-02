import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, ListMusic } from 'lucide-react';
import { MediaFile } from '../types';

interface PlaylistEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: MediaFile[];
  onSave: (name: string, selectedIds: string[]) => void;
  initialName?: string;
  initialSelectedIds?: string[];
}

export function PlaylistEditorModal({
  isOpen,
  onClose,
  library,
  onSave,
  initialName = '',
  initialSelectedIds = []
}: PlaylistEditorModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setSelectedIds(new Set(initialSelectedIds));
      setSearchQuery('');
    }
  }, [isOpen, initialName, initialSelectedIds]);

  const filteredLibrary = useMemo(() => {
    if (!searchQuery) return library;
    const lowerQ = searchQuery.toLowerCase();
    return library.filter(f => 
      (f.title || f.name).toLowerCase().includes(lowerQ) || 
      (f.author || '').toLowerCase().includes(lowerQ)
    );
  }, [library, searchQuery]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListMusic size={18} className="text-[var(--color-accent)]" />
            {initialName ? 'Edit Playlist' : 'Create Playlist'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-white/10 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Playlist Name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Mix..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                required
              />
            </div>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs to add..."
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredLibrary.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-sm">
                No songs found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLibrary.map(file => {
                  const isSelected = selectedIds.has(file.id);
                  return (
                    <div 
                      key={file.id}
                      onClick={() => handleToggle(file.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-[var(--color-accent)]/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-white/20'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {file.title || file.name}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {file.author}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
            <span className="text-sm text-white/50">
              {selectedIds.size} song{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-6 py-2 bg-[var(--color-accent)] hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Save Playlist
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
