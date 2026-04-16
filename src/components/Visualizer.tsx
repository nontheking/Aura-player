import React, { useEffect, useRef } from 'react';
import { MediaFile } from '../types';

interface VisualizerProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  currentMedia: MediaFile | null;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
}

export function Visualizer({ mediaRef, currentMedia, isPlaying, analyser }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle visualizer drawing
  useEffect(() => {
    if (!analyser || !canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)'); // Violet
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.8)'); // Sky blue

        ctx.fillStyle = gradient;
        
        // Add glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
        
        // Draw centered bars
        const y = canvas.height - barHeight;
        
        // Draw rounded rect
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - 2, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isPlaying]);

  // Handle canvas resize
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    
    if (canvasRef.current && canvasRef.current.parentElement) {
      const parent = canvasRef.current.parentElement;
      resizeObserver = new ResizeObserver(() => {
        if (canvasRef.current) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
        }
      });
      resizeObserver.observe(parent);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  const isVideo = currentMedia?.type === 'video';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/20 rounded-2xl glass-panel">
      {/* Single Media Element for both Audio and Video */}
      <video
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        src={currentMedia?.url}
        className={`w-full h-full object-contain z-10 ${isVideo ? '' : 'hidden'}`}
        controls={false}
        playsInline
      />

      {/* Visualizer Canvas (hidden for video) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full z-0 opacity-80 ${isVideo ? 'hidden' : ''}`}
      />

      {/* Placeholder when empty */}
      {!currentMedia && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 z-20">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse" />
          </div>
          <p className="text-xl font-light tracking-widest uppercase">Aura Player</p>
        </div>
      )}
    </div>
  );
}
