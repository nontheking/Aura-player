import { Music, Video, Trash2, Play } from 'lucide-react';
import { MediaFile } from '../types';
import { cn } from '../lib/utils';

interface PlaylistProps {
  files: MediaFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function Playlist({ files, currentIndex, onSelect, onRemove, onClear }: PlaylistProps) {
  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center border border-dashed border-white/10 rounded-2xl m-4">
        <Music size={48} className="mb-4 opacity-50" />
        <p>Your playlist is empty</p>
        <p className="text-sm mt-2">Drag and drop audio or video files here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden m-4 glass-panel rounded-2xl">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="font-semibold text-lg">Playlist ({files.length})</h2>
        <button
          onClick={onClear}
          className="text-xs text-white/50 hover:text-red-400 transition-colors uppercase tracking-wider font-semibold"
        >
          Clear All
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {files.map((file, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={file.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/70"
              )}
              onClick={() => onSelect(index)}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 flex-shrink-0">
                {isActive ? (
                  <Play size={14} className="fill-current text-[var(--color-accent)]" />
                ) : file.type === 'video' ? (
                  <Video size={16} />
                ) : (
                  <Music size={16} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn("truncate text-sm font-medium", isActive && "text-[var(--color-accent)]")}>
                  {file.name}
                </p>
                <p className="text-xs opacity-50 uppercase tracking-wider mt-0.5">
                  {file.type}
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 transition-all rounded-full hover:bg-white/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
