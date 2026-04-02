import React from 'react';
import { Info, X } from 'lucide-react';
import { MediaFile } from '../types';

interface MediaInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentMedia: MediaFile | null;
}

export function MediaInfoPanel({ isOpen, onClose, currentMedia }: MediaInfoPanelProps) {
  return (
    <div className="w-full h-full glass-panel border-l border-white/10 flex flex-col overflow-hidden z-20 bg-black/20 flex-shrink-0 relative">
      <div className="w-80 h-full flex flex-col absolute top-0 right-0">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Info size={18} />
            Media Info
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMedia ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Title</label>
                <p className="text-sm text-white/90 break-words">{currentMedia.title || currentMedia.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Artist</label>
                <p className="text-sm text-white/90 break-words">{currentMedia.author || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Album</label>
                <p className="text-sm text-white/90 break-words">{currentMedia.album || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Genre</label>
                <p className="text-sm text-white/90 break-words">{currentMedia.genre || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">File Name</label>
                <p className="text-sm text-white/90 break-words">{currentMedia.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">File Path / URL</label>
                <p className="text-xs text-white/60 break-all bg-white/5 p-2 rounded-lg mt-1">
                  {currentMedia.file?.webkitRelativePath || currentMedia.file?.name || currentMedia.url}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Type</label>
                <p className="text-sm text-white/90 break-words">{currentMedia.type === 'video' ? 'Video' : 'Audio'}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/40 text-center">
              <Info size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No media currently playing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
