import React, { useState, useEffect, useRef } from 'react';
import { MediaFile } from '../types';
import { fetchLyrics, LyricsData } from '../lib/lyrics';
import { autoSyncLyricsOffset } from '../lib/ai';
import { RefreshCw, SearchX, Mic2, Plus, Minus, ScanLine, Bot } from 'lucide-react';

interface LyricsPanelProps {
  currentMedia: MediaFile | null;
  currentTime: number;
  updateMediaFile: (fileId: string, updates: Partial<MediaFile>) => void;
}

export function LyricsPanel({ currentMedia, currentTime, updateMediaFile }: LyricsPanelProps) {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse synced lyrics if available
  const [parsedLyrics, setParsedLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [syncOffset, setSyncOffset] = useState<number>(0);

  useEffect(() => {
    async function loadLyrics() {
      if (!currentMedia) {
        setLyricsData(null);
        setParsedLyrics([]);
        setSyncOffset(0);
        return;
      }

      setLoading(true);
      setError(null);
      setLyricsData(null);
      setParsedLyrics([]);
      setSyncOffset(currentMedia.lyricsOffset || 0);

      // Check if we already have lyrics bound to this file in IndexedDB
      if (currentMedia.lyrics) {
        setLyricsData(currentMedia.lyrics);
        if (currentMedia.lyrics.syncedLyrics) {
          const parsed = parseSyncedLyrics(currentMedia.lyrics.syncedLyrics);
          setParsedLyrics(parsed);
        }
        setLoading(false);
        return;
      }

      const artist = currentMedia.author || 'Unknown';
      const title = currentMedia.title || currentMedia.name;

      if (title) {
        // Remove file extension from title if exists
        const cleanTitle = title.replace(/\.[^/.]+$/, "");
        try {
          const data = await fetchLyrics(artist, cleanTitle);
          if (data) {
            setLyricsData(data);
            
            let finalOffset = 0;
            
            // If we found synced lyrics and want to auto-sync using AI, do it now
            if (data.syncedLyrics && !currentMedia.lyricsOffset && currentMedia.file) {
              const _parsed = parseSyncedLyrics(data.syncedLyrics);
              const firstLine = _parsed.find(l => l.text.trim() !== '');
              
              if (firstLine) {
                 setLoading(true);
                 setError("Aligning lyrics with AI audio analysis...");
                 console.log("Starting AI Auto-Sync...");
                 const aiOffset = await autoSyncLyricsOffset(currentMedia.file, firstLine.text, firstLine.time);
                 if (aiOffset !== null) {
                   finalOffset = aiOffset;
                   setSyncOffset(aiOffset);
                   console.log(`AI calculated offset: ${aiOffset}s`);
                 }
              }
            }

            // Save permanently in library
            updateMediaFile(currentMedia.id, { lyrics: data, lyricsOffset: finalOffset });

            if (data.syncedLyrics) {
              const parsed = parseSyncedLyrics(data.syncedLyrics);
              setParsedLyrics(parsed);
            }
          } else {
            setError("No lyrics found for this track.");
          }
        } catch (err) {
          setError("Failed to load lyrics.");
        }
      } else {
         setError("Not enough metadata to search lyrics.");
      }
      setLoading(false);
    }

    loadLyrics();
  }, [currentMedia]);

  useEffect(() => {
    if (parsedLyrics.length > 0) {
      // Find the current active line
      // The current line is the last line whose time is less than or equal to current time
      // plus a small threshold
      const adjustedTime = currentTime - syncOffset;
      const index = parsedLyrics.findIndex((line, i) => {
        const nextLineTime = i < parsedLyrics.length - 1 ? parsedLyrics[i + 1].time : Infinity;
        return adjustedTime >= line.time && adjustedTime < nextLineTime;
      });
      setCurrentLineIndex(index !== -1 ? index : parsedLyrics.findIndex(line => adjustedTime < line.time) === 0 ? -1 : parsedLyrics.length - 1);
    }
  }, [currentTime, parsedLyrics, syncOffset]);

  // Auto-scroll to active line
  useEffect(() => {
    if (currentLineIndex !== -1 && scrollRef.current) {
      const activeLine = scrollRef.current.querySelector('[data-active="true"]');
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLineIndex]);

  if (!currentMedia) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center glass-panel rounded-2xl h-full m-4">
        <Mic2 size={48} className="mb-4 opacity-50" />
        <p>Play a song to see lyrics</p>
      </div>
    );
  }

  const handleOffsetChange = (delta: number) => {
    const newOffset = Number((syncOffset + delta).toFixed(1));
    setSyncOffset(newOffset);
    updateMediaFile(currentMedia.id, { lyricsOffset: newOffset });
  };

  const handleSyncToFirstWord = () => {
    if (parsedLyrics.length > 0) {
      // Find the first line that has text
      const firstLine = parsedLyrics.find(line => line.text.trim().length > 0) || parsedLyrics[0];
      // We want the adjustedTime to equal the firstLine.time exactly right now
      // adjustedTime = currentTime - newOffset
      // firstLine.time = currentTime - newOffset
      // newOffset = currentTime - firstLine.time
      const newOffset = Number((currentTime - firstLine.time).toFixed(1));
      setSyncOffset(newOffset);
      updateMediaFile(currentMedia.id, { lyricsOffset: newOffset });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden m-4 glass-panel rounded-2xl relative">
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Mic2 size={20} className="text-[var(--color-accent)]" />
          <h2 className="font-semibold text-lg">Lyrics</h2>
        </div>
        
        {parsedLyrics.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToFirstWord}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-xs font-medium text-white/80 hover:text-white"
              title="Click exactly when you hear the first word to align everything"
            >
              <ScanLine size={12} />
              <span>Sync First Word</span>
            </button>
            <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 shadow-inner border border-white/5" title="Fine-tune lyrics sync">
              <button 
                onClick={() => handleOffsetChange(-0.5)}
                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Lyrics appear 0.5s earlier"
              >
                <Minus size={14} />
              </button>
              <span className="text-xs font-mono text-white/80 w-12 text-center select-none">
                {syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s
              </span>
              <button 
                onClick={() => handleOffsetChange(0.5)}
                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Lyrics appear 0.5s later"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide" ref={scrollRef}>
        {loading && (
          <div className="flex flex-col flex-1 items-center justify-center text-white/40 h-full gap-4">
             <RefreshCw className="animate-spin" size={24} />
             <p className="text-sm">Searching LRCLIB...</p>
          </div>
        )}

        {!loading && error && error !== "Aligning lyrics with AI audio analysis..." && (
          <div className="flex flex-col flex-1 items-center justify-center text-white/40 h-full gap-4">
             <SearchX size={32} className="opacity-50" />
             <p className="text-sm">{error}</p>
          </div>
        )}
        
        {loading && error === "Aligning lyrics with AI audio analysis..." && (
           <div className="flex flex-col flex-1 items-center justify-center text-white/40 h-full gap-4">
             <Bot className="animate-pulse text-[var(--color-accent)]" size={32} />
             <p className="text-sm">Aligning lyrics using AI audio analysis...</p>
          </div>
        )}

        {!loading && lyricsData && (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-32 pt-8">
            {parsedLyrics.length > 0 ? (
              // Synced lyrics
              parsedLyrics.map((line, idx) => (
                <p 
                  key={idx} 
                  data-active={idx === currentLineIndex}
                  className={`text-2xl lg:text-3xl font-bold transition-all duration-300 transform-gpu ${
                    idx === currentLineIndex 
                      ? 'text-white scale-105' 
                      : idx < currentLineIndex 
                        ? 'text-white/40' 
                        : 'text-white/20'
                  }`}
                  style={{ textShadow: idx === currentLineIndex ? '0 0 20px rgba(255,255,255,0.2)' : 'none' }}
                >
                  {line.text === '' ? '• • •' : line.text}
                </p>
              ))
            ) : lyricsData.plainLyrics ? (
              // Plain lyrics
              <div className="whitespace-pre-wrap text-lg text-white/80 leading-relaxed font-medium">
                {lyricsData.plainLyrics}
              </div>
            ) : lyricsData.instrumental ? (
               <div className="text-center text-white/40 text-xl font-medium mt-10">
                 Instrumental Track
               </div>
            ) : (
               <div className="text-center text-white/40 text-xl">
                 No lyrics available.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function parseSyncedLyrics(lrc: string): { time: number; text: string }[] {
  const lines = lrc.split('\n');
  const result: { time: number; text: string }[] = [];
  
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
      
      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      
      result.push({ time: timeInSeconds, text });
    }
  }

  // Sort by time just in case
  return result.sort((a, b) => a.time - b.time);
}
