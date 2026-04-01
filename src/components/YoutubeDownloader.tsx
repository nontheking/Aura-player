import React, { useState } from 'react';
import { X, Youtube, Download, Loader2 } from 'lucide-react';
import { usePlayer } from '../hooks/usePlayer';

interface YoutubeDownloaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YoutubeDownloader({ isOpen, onClose }: YoutubeDownloaderProps) {
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const { addFiles } = usePlayer();

  if (!isOpen) return null;

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsDownloading(true);
    setError('');

    try {
      const isTauri = '__TAURI__' in window;
      
      if (isTauri) {
        // Use local yt-dlp via Tauri
        const { Command } = await import('@tauri-apps/api/shell');
        const { downloadDir, join } = await import('@tauri-apps/api/path');
        const { readBinaryFile } = await import('@tauri-apps/api/fs');

        // 1. Get info
        const infoCmd = new Command('yt-dlp', ['--dump-json', '--no-warnings', url]);
        const infoRes = await infoCmd.execute();
        if (infoRes.code !== 0) {
          throw new Error('yt-dlp failed. Make sure it is installed (pip install yt-dlp) and added to your PATH.');
        }
        
        const info = JSON.parse(infoRes.stdout);
        const title = info.title || 'YouTube Audio';
        const ext = info.ext || 'webm';
        
        // 2. Download to Downloads dir
        const dlDir = await downloadDir();
        const filename = `${title.replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
        const outPath = await join(dlDir, filename);
        
        const dlCmd = new Command('yt-dlp', [
          '-f', 'bestaudio',
          '-o', outPath,
          url
        ]);
        
        const dlRes = await dlCmd.execute();
        if (dlRes.code !== 0) throw new Error(dlRes.stderr);

        // 3. Read file and add to player
        const buffer = await readBinaryFile(outPath);
        const blob = new Blob([buffer], { type: `audio/${ext}` });
        const file = new File([blob], filename, { type: `audio/${ext}` });
        
        addFiles([file]);
        
        setUrl('');
        onClose();
      } else {
        // Use the backend API to download the audio
        const backendUrl = localStorage.getItem('BACKEND_URL') || '';
        const response = await fetch(`${backendUrl}/api/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to download from YouTube');
        }

        // Get the title from headers if available
        const titleHeader = response.headers.get('X-Video-Title');
        const title = titleHeader ? decodeURIComponent(titleHeader) : 'YouTube Audio';

        // Convert the response to a Blob
        const blob = await response.blob();
        
        // Create a File object from the Blob
        const file = new File([blob], `${title}.mp3`, { type: 'audio/mpeg' });
        
        // Add it to the player library
        addFiles([file]);
        
        // Close the modal and reset
        setUrl('');
        onClose();
      }
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during download');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Youtube size={18} className="text-red-500" />
            Download from YouTube
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleDownload} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              YouTube Video URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500 transition-colors"
              required
              disabled={isDownloading}
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isDownloading || !url}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Download Audio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
