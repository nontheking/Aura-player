import { useEffect, useRef, useState } from 'react';

export function useAudioEffects(mediaRef: React.RefObject<HTMLMediaElement | null>, isPlaying: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [eq, setEq] = useState({ bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    if (isPlaying && !isInitialized && mediaRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaElementSource(mediaRef.current);
        sourceRef.current = source;

        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 250;
        bassRef.current = bass;

        const mid = ctx.createBiquadFilter();
        mid.type = 'peaking';
        mid.frequency.value = 1000;
        mid.Q.value = 1;
        midRef.current = mid;

        const treble = ctx.createBiquadFilter();
        treble.type = 'highshelf';
        treble.frequency.value = 4000;
        trebleRef.current = treble;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Connect: source -> bass -> mid -> treble -> analyser -> destination
        source.connect(bass);
        bass.connect(mid);
        mid.connect(treble);
        treble.connect(analyser);
        analyser.connect(ctx.destination);

        setIsInitialized(true);
      } catch (e) {
        console.error("AudioContext init failed", e);
      }
    }
  }, [isPlaying, isInitialized, mediaRef]);

  useEffect(() => {
    if (bassRef.current) bassRef.current.gain.value = eq.bass;
    if (midRef.current) midRef.current.gain.value = eq.mid;
    if (trebleRef.current) trebleRef.current.gain.value = eq.treble;
  }, [eq]);

  return { analyser: analyserRef.current, eq, setEq, isInitialized };
}
