# Aura Player

Aura player is a dedicated app to play music and audio files.

## Features

- **Audio-Centric Video Playback:** Import MP4, MKV, and MOV files to listen to their audio tracks in a lightweight environment.
- **Hybrid Import Engine:** Supports both granular file selection and bulk folder loading.
- **Custom playlist creation**: Build personalized collections.
- **AI-powered metadata enrichment**: Integrates with [Google AI Studio](https://aistudio.google.com/api-keys) API to identify and retrieve information about music and video files.
- **Dynamic Synced Lyrics (New):** Automatically fetches plain and time-synchronized lyrics for the currently playing track.
- **AI-Powered Lyrics Auto-Sync (New):** Uses Gemini Audio Analysis to "listen" to track intros and automatically calculate precise lyric offsets for YouTube downloads and non-standard audio files.
- **Manual Sync Controls (New):** Fine-tune lyric timings natively on the fly with sub-second precision and save offsets permanently to your library.
- **Immersive Visualizer:** Responsive audio reactive visualization engine.
- **Integrated 3-Band Equalizer:** Fine-tune your listening experience with dedicated controls for **Bass**, **Mid**, and **Treble**.
- **One-Click YT-to-Audio:** Fast extraction from YouTube links.

## Configuration Setup

Customize the app in the **Settings** menu:

- **Gemini API Integration:** Enter the API key in the **Gemini API Key** field to enable automated creator sorting, metadata retrieval, and AI lyrics audio-synchronization.
- **Download Directory:** Use the **Browse** button to choose the save location. All YouTube downloads will go to this folder.

## Getting Started

### 1. Initial Setup (Required)

To enable the **AI-powered sorting**, metadata features, and **Lyrics Auto-Sync**, you must configure your API key:

1. Click the **Settings** ⚙️ button in the main menu.
2. Locate the **Gemini API Key** field.
3. Paste your key from Google AI Studio.
4. *This allows the app to automatically identify and categorize your music by creator, and perfectly align your lyrics!*

### 2. Building Your Library

You can populate your playlist in two ways:

- **Add Individual Files:** Use the **"Add Files"** button to hand-pick specific tracks.
- **Multi-File Batch Import:** Click **"Add Folder"** to instantly import every supported audio and video file from a specific directory.

### 3. YouTube Integration

Download audio directly from YouTube to your local machine:

1. **Set Your Path:** Go to **Settings** and use the **Browse** button to set your preferred **Download Directory**.
2. **Download:** Click the **YouTube** button and paste the video URL.
3. **Retrieve:** Once the download is complete, the file will be waiting in your chosen folder.
4. **Import:** Use the **Add Files** button to bring your new download into the app's active playlist.

### 4. Viewing & Syncing Lyrics

1. Play any song in your library to automatically fetch lyrics from the database.
2. If the lyrics belong to a YouTube video or file with a long intro, click **Sync First Word** in the lyrics panel to have the AI analyze the audio track and precisely snap the lyrics to the vocals.
3. Fine-tune manually with the `+` and `-` timing controls to lock the perfect offset into your playlist forever.
