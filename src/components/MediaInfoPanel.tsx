import React, { useState, useEffect } from 'react';
import { Info, X, Music, User, Disc, Tag, Globe, Loader2, ExternalLink } from 'lucide-react';
import { MediaFile } from '../types';
import { enrichMediaMetadata, ArtistInfo } from '../lib/metadata';

interface MediaInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentMedia: MediaFile | null;
}

export function MediaInfoPanel({ isOpen, onClose, currentMedia }: MediaInfoPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState<{
    album?: string;
    genre?: string;
    releaseDate?: string;
    coverArtUrl?: string;
    artistInfo?: ArtistInfo;
    genres?: string[];
  } | null>(null);

  useEffect(() => {
    if (currentMedia && isOpen) {
      loadEnrichedMetadata();
    }
  }, [currentMedia, isOpen]);

  const loadEnrichedMetadata = async () => {
    if (!currentMedia?.title || !currentMedia?.author) return;
    
    setIsLoading(true);
    try {
      const enriched = await enrichMediaMetadata(
        currentMedia.author,
        currentMedia.title,
        currentMedia.album
      );
      
      if (enriched) {
        setEnrichedData({
          album: enriched.album,
          genre: enriched.genres?.join(', '),
          releaseDate: enriched.releaseDate,
          coverArtUrl: enriched.coverArtUrl,
          artistInfo: enriched.artistInfo,
          genres: enriched.genres
        });
      }
    } catch (error) {
      console.warn('Failed to load enriched metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              {/* Cover Art */}
              {(enrichedData?.coverArtUrl || currentMedia.file) && (
                <div className="flex justify-center mb-4">
                  <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 backdrop-blur-sm border border-white/10">
                    {enrichedData?.coverArtUrl ? (
                      <img 
                        src={enrichedData.coverArtUrl} 
                        alt="Album Art"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={64} className="text-white/30" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <Music size={14} />
                  Title
                </label>
                <p className="text-sm text-white/90 break-words font-medium">{currentMedia.title || currentMedia.name}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} />
                  Artist
                </label>
                <p className="text-sm text-white/90 break-words">{currentMedia.author || 'Unknown'}</p>
                {enrichedData?.artistInfo && (
                  <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                    {enrichedData.artistInfo.imageUrl && (
                      <img 
                        src={enrichedData.artistInfo.imageUrl}
                        alt={enrichedData.artistInfo.name}
                        className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <p className="text-xs text-white/70 line-clamp-3">
                      {enrichedData.artistInfo.bio || 'No biography available'}
                    </p>
                    {enrichedData.artistInfo.genres && enrichedData.artistInfo.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {enrichedData.artistInfo.genres.map((genre, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 bg-violet-600/30 text-violet-300 rounded-full">
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <Disc size={14} />
                  Album
                </label>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-white/50">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <p className="text-sm text-white/90 break-words">{enrichedData?.album || currentMedia.album || 'Unknown'}</p>
                )}
                {enrichedData?.releaseDate && (
                  <p className="text-xs text-white/50">Released: {enrichedData.releaseDate}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={14} />
                  Genre
                </label>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-white/50">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <>
                    {enrichedData?.genres && enrichedData.genres.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {enrichedData.genres.map((genre, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-fuchsia-600/30 text-fuchsia-300 rounded-full">
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/90 break-words">{currentMedia.genre || 'Unknown'}</p>
                    )}
                  </>
                )}
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

              {/* Data Sources */}
              <div className="pt-4 border-t border-white/10">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Metadata Sources</label>
                <div className="flex gap-2">
                  <a 
                    href="https://musicbrainz.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-600/30 text-blue-300 rounded hover:bg-blue-600/40 transition-colors"
                  >
                    <Globe size={12} />
                    MusicBrainz
                  </a>
                  <a 
                    href="https://www.last.fm/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-red-600/30 text-red-300 rounded hover:bg-red-600/40 transition-colors"
                  >
                    <ExternalLink size={12} />
                    Last.fm
                  </a>
                </div>
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
