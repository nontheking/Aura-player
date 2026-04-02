import React, { useState, useEffect } from 'react';
import { X, Key, Server, Folder } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [downloadDir, setDownloadDir] = useState('');
  const isTauri = '__TAURI__' in window;

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('GEMINI_API_KEY') || '');
      setBackendUrl(localStorage.getItem('BACKEND_URL') || '');
      setDownloadDir(localStorage.getItem('DOWNLOAD_DIR') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    localStorage.setItem('BACKEND_URL', backendUrl.trim().replace(/\/$/, '')); // Remove trailing slash
    localStorage.setItem('DOWNLOAD_DIR', downloadDir.trim());
    onClose();
  };

  const handleBrowseFolder = async () => {
    if (isTauri) {
      try {
        const { open } = await import('@tauri-apps/api/dialog');
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Download Folder'
        });
        if (selected && typeof selected === 'string') {
          setDownloadDir(selected);
        }
      } catch (err) {
        console.error("Failed to open dialog:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key size={18} className="text-[var(--color-accent)]" />
            Settings
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
              <Key size={14} />
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <p className="text-xs text-white/40 mt-2">
              Required for automatic song title and artist identification. Your key is stored locally on your device.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
              <Server size={14} />
              Backend URL (For Tauri App)
            </label>
            <input
              type="url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://your-backend.com"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <p className="text-xs text-white/40 mt-2">
              Required if you are running the standalone Tauri .exe and want to use the YouTube downloader. Leave blank if using the web version.
            </p>
          </div>

          {isTauri && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                <Folder size={14} />
                Download Directory
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={downloadDir}
                  onChange={(e) => setDownloadDir(e.target.value)}
                  placeholder="Default Downloads Folder"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/10"
                >
                  Browse
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Choose where YouTube downloads are saved. If empty, uses your system's default Downloads folder.
              </p>
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-[var(--color-accent)] hover:bg-violet-400 text-white rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
