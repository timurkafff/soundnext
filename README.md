# SoundNext 🎵

<p align="center">
  <img src="./img/icons.png" alt="SoundNext Icon" width="128" height="128">
</p>

A modern desktop and web application for streaming and downloading music from SoundCloud, built with Next.js, FastAPI, and PyWebView.

<img src="./img/img.png">

![SoundNext](https://img.shields.io/badge/SoundNext-Music%20Streamer-orange)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.119-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue)

## Features ✨

### 🎵 Playback & Streaming
- **Search tracks** by name - no URL needed!
- **Stream music** directly in your browser or desktop app
- **Auto-play next track** - continuous playback experience
- **Smart caching** - liked tracks load instantly without API calls
- **Seamless navigation** - music keeps playing when switching pages
- **Media Session API** integration - native OS media controls support

### ⌨️ Keyboard Controls
- `Space` - Play/Pause
- `F7` / `MediaTrackPrevious` - Previous track
- `F8` / `MediaPlayPause` - Play/Pause  
- `F9` / `MediaTrackNext` - Next track
- `Shift + ←` - Previous track
- `Shift + →` - Next track

### ❤️ Liked Tracks Management
- **Persistent storage** - likes saved to `~/.soundnext/liked_tracks.json`
- **Auto-caching** - liked tracks download automatically in background
- **Smart cache cleanup** - only non-liked tracks are removed on app close
- **Sync across sessions** - your likes survive app restarts

### 💾 Download & Metadata
- **Download tracks** with embedded metadata and artwork
- **High-quality artwork** - album art embedded in MP3 files
- **ID3 tags** - artist, title, duration automatically added

### 🎨 User Interface
- **Beautiful UI** with modern design and smooth animations
- **Like animations** - satisfying heart animations
- **Profile page** to view and manage your liked tracks
- **Track information** - play counts and likes from SoundCloud
- **Real-time progress** tracking with seekable timeline
- **Responsive design** - works on all screen sizes

### 🖥️ Desktop Application
- **Native macOS app** built with PyWebView
- **Single executable** - no installation required
- **Auto-cleanup** - cache managed automatically
- **System integration** - appears in Dock with media controls

## Tech Stack 🛠️

### Frontend
- **Next.js 15.5** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern styling

### Backend
- **FastAPI** - High-performance Python web framework
- **soundcloud-lib** - SoundCloud API wrapper
- **uvicorn** - ASGI server
- **aiohttp** - Async HTTP client

## Installation 📦

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- pip

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Usage 🎯

1. **Start the backend server** (FastAPI on port 8000)
2. **Start the frontend** (Next.js on port 3000)
3. **Search for any track** by typing its name
4. **Click on a track** to play it
5. **Like tracks** by clicking the heart icon
6. **View your liked tracks** in the Profile page
7. **Download tracks** with embedded metadata

## API Endpoints 🔌

### Track Operations

#### `GET /search?q={query}&limit={number}`
Search for tracks by name
- **Parameters**: 
  - `q` - Search query (minimum 2 characters)
  - `limit` - Maximum results to return (default: 20)
- **Returns**: List of matching tracks

#### `GET /track-info?url={soundcloud_url}`
Get track metadata without downloading
- **Parameters**: `url` - SoundCloud track URL
- **Returns**: Track information (title, artist, duration, artwork, stats)

#### `GET /stream?url={soundcloud_url}`
Stream track audio (with fast path for liked tracks)
- **Parameters**: `url` - SoundCloud track URL
- **Returns**: Audio stream (MP3)
- **Note**: Liked tracks stream ~500-1000x faster (no API call needed)

#### `GET /download?url={soundcloud_url}`
Download track with metadata
- **Parameters**: `url` - SoundCloud track URL
- **Returns**: MP3 file with ID3 tags and artwork

#### `GET /playlist?url={soundcloud_url}`
Get playlist information
- **Parameters**: `url` - SoundCloud playlist URL
- **Returns**: Playlist metadata and track list

### Likes Management

#### `GET /likes`
Get all liked tracks
- **Returns**: Array of liked track objects

#### `POST /likes`
Add a track to likes
- **Body**: Track object
- **Returns**: Success message and count
- **Side Effect**: Automatically caches track in background

#### `DELETE /likes/{track_id}`
Remove a track from likes
- **Parameters**: `track_id` - Track ID
- **Returns**: Success message and count
- **Side Effect**: Removes track from cache

#### `PUT /likes`
Sync all liked tracks (replace existing)
- **Body**: Array of track objects
- **Returns**: Success message and count

### System

#### `GET /`
Returns API information and available endpoints

#### `GET /health`
Health check endpoint with cache statistics
- **Returns**: Status, cache directory, file count, and size

## Features Explained 💡

### Smart Caching System
- **Dual-layer storage**: localStorage (browser) + file system (persistent)
- **Liked tracks cache**: Automatically downloads and caches liked tracks in background
- **Fast streaming**: Liked tracks bypass SoundCloud API entirely (~1ms vs ~1000ms)
- **Intelligent cleanup**: Only non-liked tracks removed on app exit
- **Persistent storage**: Cache survives app restarts

### Persistent Likes
- **File-based storage**: `~/.soundnext/liked_tracks.json`
- **Cross-session sync**: Works between browser localStorage and file system
- **Automatic background caching**: Liked tracks download silently in background
- **No data loss**: Likes persist even if browser data is cleared

### Media Session API Integration
- **Native OS controls**: Works with Touch Bar, media keys, and system notifications
- **Rich metadata**: Shows track title, artist, and artwork in system player
- **Playback state sync**: System UI reflects actual playback state
- **Keyboard shortcuts**: Full keyboard control without focus needed

### Global Player Context
- **Seamless navigation**: Music continues playing when switching pages
- **Single audio element**: No interruptions or restarts
- **Shared state**: Current track and playback status global across app
- **Optimized performance**: React Context API with useCallback for efficiency

### Auto-Play Queue
- **Continuous playback**: Automatically plays next track when current ends
- **Smart queuing**: Uses current page's track list as playlist
- **No looping**: Stops after last track (can be modified)
- **Keyboard navigation**: Skip tracks with F7/F9 or Shift+Arrow keys

### Metadata Embedding
All downloaded tracks include:
- Album artist
- Track title  
- Album artwork (high quality)
- Duration
- Proper ID3 tags

## Project Structure 📁

```
soundcloud/
├── backend/
│   ├── main.py              # FastAPI application with likes API
│   ├── app_launcher.py      # Desktop app launcher with cache cleanup
│   ├── requirements.txt     # Python dependencies
│   ├── soundnext.spec       # PyInstaller build config
│   └── venv/               # Virtual environment
├── src/
│   ├── app/
│   │   ├── page.tsx        # Main search page
│   │   ├── profile/
│   │   │   └── page.tsx    # Liked tracks page
│   │   ├── layout.tsx      # App layout with ClientLayout
│   │   └── globals.css     # Global styles with animations
│   ├── components/
│   │   ├── Player.tsx      # Original player (deprecated)
│   │   ├── PlayerUI.tsx    # New UI-only player component
│   │   ├── TrackList.tsx   # Track list with like buttons
│   │   ├── SearchBar.tsx   # Search component
│   │   └── ClientLayout.tsx # Client-side provider wrapper
│   ├── contexts/
│   │   └── PlayerContext.tsx # Global player state & keyboard controls
│   ├── hooks/
│   │   ├── useLikes.ts     # Likes management with API sync
│   │   └── useSearch.ts    # Search functionality
│   └── types/
│       └── index.ts        # TypeScript interfaces
├── out/                     # Next.js static export for desktop app
├── build_app.sh            # Desktop app build script
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## Development 🔧

### Backend Development
The backend uses FastAPI with async/await for optimal performance. The SoundCloud API client is initialized once and reused across requests.

### Frontend Development
Built with Next.js 15 using the App Router and React Server Components where appropriate. The player component uses React hooks for state management.

## Known Limitations ⚠️

- Only works with **downloadable** SoundCloud tracks
- Tracks must be **publicly accessible**
- HLS streams are not yet supported

## Contributing 🤝

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests


## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [soundcloud-lib](https://github.com/3jackdaws/soundcloud-lib) - SoundCloud API wrapper
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework

## 💻 Desktop Application

**SoundNext is now available as a native desktop application!**

### Quick Start:

```bash
# Build the application
./build_app.sh

# Run the app
open backend/dist/SoundNext.app
```

### Features:
- ✅ Native macOS application (.app)
- ✅ Packaged with PyInstaller - single file, everything included
- ✅ PyWebView GUI - fast and lightweight
- ✅ Cross-platform support (can be built for Windows/Linux)

---

## 📋 Feature Checklist

### ✅ Completed Features

#### Core Playback
- [x] Track search by name
- [x] Audio streaming with progress bar
- [x] Download with metadata
- [x] Play/pause controls
- [x] Seek/scrub timeline
- [x] Auto-play next track
- [x] Continuous playback (no interruptions on navigation)

#### Likes System
- [x] Like/unlike tracks
- [x] Persistent storage (file-based)
- [x] Profile page with liked tracks
- [x] Beautiful like animations
- [x] Auto-caching of liked tracks
- [x] Smart cache management (preserves liked tracks)
- [x] Sync between localStorage and file system

#### Keyboard Controls
- [x] Space - Play/Pause
- [x] F7/F8/F9 - Media controls (macOS)
- [x] Media keys support
- [x] Shift+Arrow keys - Track navigation
- [x] Works when app not focused (global)

#### Desktop Application
- [x] Native macOS app
- [x] PyInstaller packaging
- [x] PyWebView integration
- [x] Auto-cleanup on exit
- [x] System media controls integration

#### Performance Optimizations
- [x] Smart caching (500-1000x faster for liked tracks)
- [x] Background track downloading
- [x] Global player context (no remounting)
- [x] React optimizations (useCallback, useRef)

#### User Interface
- [x] Modern responsive design
- [x] Smooth animations
- [x] Track artwork display
- [x] Play counts and likes stats
- [x] Search with loading states
- [x] Error handling

#### System Integration
- [x] Media Session API
- [x] Native OS media controls
- [x] Rich notifications with artwork
- [x] Playback state sync

### 🚀 Planned Features

#### User Experience
- [ ] Shuffle mode
- [ ] Repeat modes (one/all)
- [ ] Volume control
- [ ] Equalizer
- [ ] Dark/Light theme toggle
- [ ] Custom playlists

#### Advanced Features
- [ ] User authentication
- [ ] Cloud sync for likes
- [ ] Listening history
- [ ] Lyrics support
- [ ] Social features (share tracks)
- [ ] Recommended tracks

#### Platform Support
- [ ] Windows desktop build
- [ ] Linux desktop build
- [ ] Mobile apps (iOS/Android)
- [ ] Browser extension

#### Technical Improvements
- [ ] HLS streaming support
- [ ] Auto-updates for desktop app
- [ ] Database for metadata
- [ ] GraphQL API

---

## Performance Metrics 📊

- **Liked tracks streaming**: ~1ms (vs ~1000ms for API call)
- **Cache hit rate**: 100% for liked tracks
- **Memory usage**: ~50MB (desktop app)
- **App size**: ~80MB (macOS build with Python runtime)

## Tech Highlights 🔥

- **React Context API** for global state
- **Media Session API** for OS integration
- **Smart caching** with dual-layer storage
- **WebView** for cross-platform desktop
- **Async/await** throughout for performance
- **TypeScript** for type safety
- **Tailwind CSS 4** with custom animations

---

Built with ❤️ by [Timur](https://github.com/timurbikbaev) using Next.js, FastAPI, and PyWebView

**Star ⭐ this repo if you found it useful!**