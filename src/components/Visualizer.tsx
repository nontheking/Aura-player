import React, { useEffect, useRef, useState } from 'react';
import { MediaFile } from '../types';

interface VisualizerProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  currentMedia: MediaFile | null;
  isPlaying: boolean;
}

export function Visualizer({ mediaRef, currentMedia, isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);

  // Initialize AudioContext on user interaction (play)
  useEffect(() => {
    if (isPlaying && !isAudioContextInitialized && mediaRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        // Create source from media element
        sourceRef.current = audioCtxRef.current.createMediaElementSource(mediaRef.current);
        
        // Connect nodes
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
        
        setIsAudioContextInitialized(true);
      } catch (e) {
        console.error("AudioContext initialization failed:", e);
      }
    }
  }, [isPlaying, isAudioContextInitialized, mediaRef]);

  // Handle visualizer drawing
  useEffect(() => {
    if (!isAudioContextInitialized || !analyserRef.current || !canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
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
        
        // Draw centered bars
        const y = canvas.height - barHeight;
        
        // Add glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
        
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
  }, [isAudioContextInitialized, isPlaying]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
