import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

interface SoundEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eq: { bass: number; mid: number; treble: number };
  setEq: React.Dispatch<React.SetStateAction<{ bass: number; mid: number; treble: number }>>;
}

export function SoundEnhancerModal({ isOpen, onClose, eq, setEq }: SoundEnhancerModalProps) {
  if (!isOpen) return null;

  const handleChange = (band: 'bass' | 'mid' | 'treble', value: number) => {
    setEq(prev => ({ ...prev, [band]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-[var(--color-accent)]" />
            Sound Enhancer
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Bass */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white/70">Bass</label>
              <span className="text-xs text-white/50 w-8 text-right">{eq.bass > 0 ? '+' : ''}{eq.bass}</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={eq.bass}
              onChange={(e) => handleChange('bass', parseInt(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          {/* Mid */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white/70">Mid</label>
              <span className="text-xs text-white/50 w-8 text-right">{eq.mid > 0 ? '+' : ''}{eq.mid}</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={eq.mid}
              onChange={(e) => handleChange('mid', parseInt(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          {/* Treble */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white/70">Treble</label>
              <span className="text-xs text-white/50 w-8 text-right">{eq.treble > 0 ? '+' : ''}{eq.treble}</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={eq.treble}
              onChange={(e) => handleChange('treble', parseInt(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setEq({ bass: 0, mid: 0, treble: 0 })}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
