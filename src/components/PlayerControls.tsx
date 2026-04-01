import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { cn, formatTime } from '../lib/utils';
import { RepeatMode } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
}

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
  onToggleShuffle
}: PlayerControlsProps) {
  
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(Number(e.target.value));
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto p-4 glass-panel rounded-2xl">
      {/* Progress Bar */}
      <div className="flex items-center gap-3 text-xs font-mono text-white/70">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeekChange}
          className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left: Volume */}
        <div className="flex items-center gap-2 w-1/3">
          <button onClick={onToggleMute} className="text-white/70 hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>

        {/* Center: Playback */}
        <div className="flex items-center justify-center gap-4 w-1/3">
          <button onClick={onPrev} className="text-white/70 hover:text-white transition-colors">
            <SkipBack size={24} />
          </button>
          <button
            onClick={onPlayPause}
            className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={24} className="fill-black" /> : <Play size={24} className="fill-black ml-1" />}
          </button>
          <button onClick={onNext} className="text-white/70 hover:text-white transition-colors">
            <SkipForward size={24} />
          </button>
        </div>

        {/* Right: Options */}
        <div className="flex items-center justify-end gap-4 w-1/3">
          <button
            onClick={onToggleShuffle}
            className={cn("transition-colors", isShuffle ? "text-[var(--color-accent)]" : "text-white/50 hover:text-white/80")}
          >
            <Shuffle size={20} />
          </button>
          <button
            onClick={onToggleRepeat}
            className={cn("transition-colors", repeatMode !== 'none' ? "text-[var(--color-accent)]" : "text-white/50 hover:text-white/80")}
          >
            {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
