# SoundNext 🎵

A modern web application for streaming and downloading music from SoundCloud, built with Next.js and FastAPI.

<img src="./img/img.png">

![SoundNext](https://img.shields.io/badge/SoundNext-Music%20Streamer-orange)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.119-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue)

## Features ✨

- 🔍 **Search tracks** by name - no URL needed!
- 🎵 **Stream music** directly in your browser
- 💾 **Download tracks** with embedded metadata and artwork
- 🎨 **Beautiful UI** with modern design and smooth animations
- ⚡ **Fast streaming** with smart caching
- 📊 **Track information** including play counts and likes
- 🔄 **Real-time playback** controls with progress tracking
- 📱 **Responsive design** works on all devices

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
4. **Click on a track** from the search results
5. **Play** the track directly in the browser or **download** it

### Example searches to try:
- "Billie Eilish bad guy"
- "The Weeknd"
- "Lo-fi beats"
- Or paste a direct SoundCloud URL

## API Endpoints 🔌

### `GET /`
Returns API information and available endpoints

### `GET /health`
Health check endpoint with cache statistics

### `GET /search?q={query}&limit={number}`
Search for tracks by name
- **Parameters**: 
  - `q` - Search query (minimum 2 characters)
  - `limit` - Maximum results to return (default: 20)
- **Returns**: List of matching tracks

### `GET /track-info?url={soundcloud_url}`
Get track metadata without downloading
- **Parameters**: `url` - SoundCloud track URL
- **Returns**: Track information (title, artist, duration, artwork, stats)

### `GET /stream?url={soundcloud_url}`
Stream track audio
- **Parameters**: `url` - SoundCloud track URL
- **Returns**: Audio stream (MP3)

### `GET /download?url={soundcloud_url}`
Download track with metadata
- **Parameters**: `url` - SoundCloud track URL
- **Returns**: MP3 file with ID3 tags and artwork

### `GET /playlist?url={soundcloud_url}`
Get playlist information
- **Parameters**: `url` - SoundCloud playlist URL
- **Returns**: Playlist metadata and track list

### `DELETE /cache`
Clear all cached files

### `DELETE /cache/{track_id}`
Delete specific cached track

## Features Explained 💡

### Smart Caching
Downloaded tracks are cached in a temporary directory to speed up subsequent requests. The cache can be managed through the API endpoints.

### Metadata Embedding
All downloaded tracks include:
- Album artist
- Track title
- Album artwork (high quality)
- Duration

### Streaming
Tracks are streamed in chunks for efficient playback without full download.

## Project Structure 📁

```
soundcloud/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── venv/               # Virtual environment
├── src/
│   └── app/
│       ├── page.tsx        # Main player page
│       ├── layout.tsx      # App layout
│       └── globals.css     # Global styles
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


## Acknowledgments 🙏

- [soundcloud-lib](https://github.com/3jackdaws/soundcloud-lib) - SoundCloud API wrapper
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework

## 💻 Desktop Application

**SoundNext теперь доступен как нативное десктопное приложение!**

### Быстрый старт:

```bash
# Полная сборка приложения
./build_app.sh

# Запустить готовое приложение
open backend/dist/SoundNext.app
```

### Режим разработки:

```bash
# Разработка с PyWebView
cd backend
./run_dev.sh
```

📖 **Полная документация**: См. [DESKTOP_APP.md](./DESKTOP_APP.md)

### Что нового:
- ✅ Нативное приложение для macOS (.app)
- ✅ Упаковано с PyInstaller - один файл, все включено
- ✅ PyWebView GUI - быстрое и легкое
- ✅ Исправлены баги (время трека, audio visualizer)
- ✅ Автоматическая сборка одной командой
- ✅ Кроссплатформенность (можно собрать для Windows/Linux)

---

## 📋 TODO / Future Features

### Planned Features
- [ ] **User Profile System**
  - User authentication (login/register)
  - Profile page with user info
  - Favorite tracks collection
  - Listening history
  - Custom playlists
  - User preferences and settings

### Other Ideas
- [ ] Queue management (next/previous track)
- [ ] Lyrics support
- [ ] Social features (share tracks)
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts
- [x] ~~Desktop app~~ ✅ **Done!**
- [ ] Windows/Linux builds
- [ ] Auto-updates for desktop app

---

Built with ❤️ using Next.js, FastAPI and PyWebView