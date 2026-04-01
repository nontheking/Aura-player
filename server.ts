import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import youtubedl from 'youtube-dl-exec';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // Get video info first to get the title
      const info: any = await youtubedl(url, {
        dumpJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
      });

      const title = info.title || 'Unknown Title';
      
      // We will stream the best audio format directly to the client
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`);
      res.setHeader('X-Video-Title', encodeURIComponent(title));
      res.setHeader('Access-Control-Expose-Headers', 'X-Video-Title');

      const subprocess = youtubedl.exec(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: '-', // stdout
        noCheckCertificates: true,
        noWarnings: true,
      });

      subprocess.stdout.pipe(res);

      subprocess.on('error', (err) => {
        console.error('yt-dlp error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download audio' });
        }
      });
    } catch (error) {
      console.error('Error fetching video info:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to fetch video info' });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
