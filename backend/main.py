import asyncio
import os
import tempfile
import json
from pathlib import Path
from typing import Optional, List
from urllib.parse import quote
import unicodedata
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sclib.asyncio import SoundcloudAPI, Track, Playlist
import aiohttp
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SoundCloud Music Server", version="1.0.0")

def create_safe_filename(artist: str, title: str) -> str:
    artist = artist or 'Unknown'
    title = title or 'Track'
    
    artist_normalized = unicodedata.normalize('NFKD', artist).encode('ascii', 'ignore').decode('ascii')
    title_normalized = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    
    safe_artist = "".join(c for c in artist_normalized if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_title = "".join(c for c in title_normalized if c.isalnum() or c in (' ', '-', '_')).strip()
    
    safe_artist = safe_artist if safe_artist else 'Unknown'
    safe_title = safe_title if safe_title else 'Track'
    
    return f"{safe_artist} - {safe_title}.mp3"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = SoundcloudAPI()
TEMP_DIR = Path(tempfile.gettempdir()) / "soundcloud_downloads"
TEMP_DIR.mkdir(exist_ok=True)

DATA_DIR = Path.home() / ".soundnext"
DATA_DIR.mkdir(exist_ok=True)
LIKES_FILE = DATA_DIR / "liked_tracks.json"

class TrackInfo(BaseModel):
    url: str
    artist: str
    title: str
    duration: int
    artwork_url: Optional[str] = None
    id: int
    playback_count: Optional[int] = None
    likes_count: Optional[int] = None

class SearchResult(BaseModel):
    tracks: List[TrackInfo]

@app.get("/")
async def root():
    return {
        "message": "SoundCloud Music Server",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "search": "/search?q=track_name",
            "track_info": "/track-info?url=soundcloud_url",
            "stream": "/stream?url=soundcloud_url",
            "download": "/download?url=soundcloud_url",
            "likes": {
                "get_all": "GET /likes",
                "add": "POST /likes",
                "remove": "DELETE /likes/{track_id}",
                "sync": "PUT /likes"
            }
        }
    }

@app.get("/search", response_model=SearchResult)
async def search_tracks(q: str, limit: int = 20):
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    try:
        logger.info(f"Searching for: {q}")
        
        if not api.client_id:
            await api.get_credentials()
        
        search_url = f"https://api-v2.soundcloud.com/search/tracks"
        params = {
            "q": q,
            "client_id": api.client_id,
            "limit": limit,
            "offset": 0
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(search_url, params=params) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="Failed to search tracks")
                
                data = await response.json()
                
                tracks = []
                for item in data.get("collection", []):
                    if item.get("kind") == "track":
                        track = Track(obj=item, client=api)
                        
                        track_info = TrackInfo(
                            url=track.permalink_url,
                            artist=track.artist or "Unknown Artist",
                            title=track.title,
                            duration=track.duration or 0,
                            artwork_url=track.artwork_url,
                            id=track.id,
                            playback_count=track.playback_count,
                            likes_count=track.likes_count
                        )
                        tracks.append(track_info)
                
                if not tracks:
                    raise HTTPException(status_code=404, detail="No tracks found")
                
                logger.info(f"Found {len(tracks)} tracks")
                return SearchResult(tracks=tracks)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/track-info")
async def get_track_info(url: str):
    if not url.startswith("https://soundcloud.com"):
        raise HTTPException(status_code=400, detail="Invalid SoundCloud URL")
    
    try:
        logger.info(f"Getting info for: {url}")
        track = await api.resolve(url)
        
        if not isinstance(track, Track):
            raise HTTPException(status_code=400, detail="URL is not a valid track")
        
        return TrackInfo(
            url=track.permalink_url,
            artist=track.artist,
            title=track.title,
            duration=track.duration,
            artwork_url=track.artwork_url,
            id=track.id,
            playback_count=track.playback_count,
            likes_count=track.likes_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Info error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get track info: {str(e)}")

@app.get("/stream")
async def stream_track(url: str):
    if not url.startswith("https://soundcloud.com"):
        raise HTTPException(status_code=400, detail="Invalid SoundCloud URL")
    
    try:
        logger.info(f"Streaming: {url}")
        
        liked_tracks = load_likes()
        cached_track = None
        
        for track_info in liked_tracks:
            if track_info.url == url:
                file_path = TEMP_DIR / f"{track_info.id}.mp3"
                if file_path.exists() and file_path.stat().st_size > 0:
                    cached_track = track_info
                    logger.info(f"Fast streaming from cache: {cached_track.artist} - {cached_track.title}")
                    
                    filename = create_safe_filename(cached_track.artist, cached_track.title)
                    
                    async def iterfile():
                        with open(file_path, 'rb') as file:
                            chunk_size = 64 * 1024
                            while chunk := file.read(chunk_size):
                                yield chunk
                    
                    encoded_filename = quote(filename)
                    
                    return StreamingResponse(
                        iterfile(),
                        media_type="audio/mpeg",
                        headers={
                            "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
                            "Accept-Ranges": "bytes",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET, OPTIONS, HEAD",
                            "Access-Control-Allow-Headers": "*",
                            "Access-Control-Expose-Headers": "*",
                            "Cache-Control": "no-cache",
                        }
                    )
                break
        
        track = await api.resolve(url)
        
        if not isinstance(track, Track):
            raise HTTPException(status_code=400, detail="URL is not a valid track")
        
        if not track.streamable:
            raise HTTPException(status_code=403, detail="Track is not streamable")
        
        filename = create_safe_filename(track.artist, track.title)
        file_path = TEMP_DIR / f"{track.id}.mp3"
        
        if not file_path.exists():
            logger.info(f"Downloading to: {file_path}")
            try:
                with open(file_path, 'wb+') as file:
                    await track.write_mp3_to(file)
                
                if not file_path.exists() or file_path.stat().st_size == 0:
                    raise Exception("Failed to download track - file is empty")
                    
            except Exception as download_error:
                if file_path.exists():
                    file_path.unlink()
                logger.error(f"Download failed: {str(download_error)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Track download failed. This track may not be available for streaming."
                )
        else:
            logger.info(f"Using cached file: {file_path}")
        
        async def iterfile():
            with open(file_path, 'rb') as file:
                chunk_size = 64 * 1024
                while chunk := file.read(chunk_size):
                    yield chunk
        
        encoded_filename = quote(filename)
        
        logger.info(f"Streaming file: {filename}")
        return StreamingResponse(
            iterfile(),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
                "Accept-Ranges": "bytes",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS, HEAD",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Expose-Headers": "*",
                "Cache-Control": "no-cache",
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stream error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")

@app.get("/download")
async def download_track(url: str):
    if not url.startswith("https://soundcloud.com"):
        raise HTTPException(status_code=400, detail="Invalid SoundCloud URL")
    
    try:
        logger.info(f"Downloading: {url}")
        track = await api.resolve(url)
        
        if not isinstance(track, Track):
            raise HTTPException(status_code=400, detail="URL is not a valid track")
        
        filename = create_safe_filename(track.artist, track.title)
        file_path = TEMP_DIR / f"{track.id}.mp3"
        
        if not file_path.exists():
            logger.info(f"Downloading to: {file_path}")
            with open(file_path, 'wb+') as file:
                await track.write_mp3_to(file)
        
        encoded_filename = quote(filename)
        
        logger.info(f"Serving file: {filename}")
        return FileResponse(
            path=file_path,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.get("/playlist")
async def get_playlist(url: str):
    if not url.startswith("https://soundcloud.com"):
        raise HTTPException(status_code=400, detail="Invalid SoundCloud URL")
    
    try:
        logger.info(f"Getting playlist: {url}")
        playlist = await api.resolve(url)
        
        if not isinstance(playlist, Playlist):
            raise HTTPException(status_code=400, detail="URL is not a valid playlist")
        
        tracks = []
        async for track in playlist:
            if isinstance(track, Track):
                track_info = TrackInfo(
                    url=track.permalink_url,
                    artist=track.artist,
                    title=track.title,
                    duration=track.duration,
                    artwork_url=track.artwork_url,
                    id=track.id,
                    playback_count=track.playback_count,
                    likes_count=track.likes_count
                )
                tracks.append(track_info)
        
        return {
            "title": playlist.title,
            "track_count": playlist.track_count,
            "tracks": tracks
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Playlist error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get playlist: {str(e)}")

@app.delete("/cache/{track_id}")
async def delete_cache(track_id: int):
    file_path = TEMP_DIR / f"{track_id}.mp3"
    
    if file_path.exists():
        file_path.unlink()
        logger.info(f"Deleted cached file: {file_path}")
        return {"message": f"Cache deleted for track {track_id}"}
    else:
        raise HTTPException(status_code=404, detail="Cached file not found")

@app.delete("/cache")
async def clear_cache():
    deleted_count = 0
    for file_path in TEMP_DIR.glob("*.mp3"):
        file_path.unlink()
        deleted_count += 1
    
    logger.info(f"Cleared cache: {deleted_count} files deleted")
    return {"message": f"Cache cleared: {deleted_count} files deleted"}

@app.get("/health")
async def health_check():
    cache_files = len(list(TEMP_DIR.glob("*.mp3")))
    cache_size = sum(f.stat().st_size for f in TEMP_DIR.glob("*.mp3"))
    
    return {
        "status": "healthy",
        "temp_dir": str(TEMP_DIR),
        "cache_files": cache_files,
        "cache_size_mb": round(cache_size / (1024 * 1024), 2)
    }

async def cache_liked_track(track: TrackInfo):
    try:
        file_path = TEMP_DIR / f"{track.id}.mp3"
        
        if file_path.exists():
            logger.info(f"Track already cached: {track.artist} - {track.title}")
            return
        
        logger.info(f"Caching liked track: {track.artist} - {track.title}")
        
        resolved_track = await api.resolve(track.url)
        
        if not isinstance(resolved_track, Track):
            logger.error(f"Could not resolve track: {track.url}")
            return
        
        if not resolved_track.streamable:
            logger.warning(f"Track is not streamable: {track.artist} - {track.title}")
            return
        
        with open(file_path, 'wb+') as file:
            await resolved_track.write_mp3_to(file)
        
        logger.info(f"Successfully cached: {track.artist} - {track.title}")
    except Exception as e:
        logger.error(f"Error caching track {track.artist} - {track.title}: {e}")

def load_likes() -> List[TrackInfo]:
    if LIKES_FILE.exists():
        try:
            with open(LIKES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [TrackInfo(**track) for track in data]
        except Exception as e:
            logger.error(f"Error loading likes: {e}")
            return []
    return []

def save_likes(tracks: List[TrackInfo]):
    try:
        with open(LIKES_FILE, 'w', encoding='utf-8') as f:
            tracks_data = []
            for track in tracks:
                if hasattr(track, 'model_dump'):
                    tracks_data.append(track.model_dump())
                else:
                    tracks_data.append(track.dict())
            json.dump(tracks_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(tracks)} liked tracks")
    except Exception as e:
        logger.error(f"Error saving likes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save likes: {str(e)}")

@app.get("/likes", response_model=List[TrackInfo])
async def get_likes():
    try:
        likes = load_likes()
        logger.info(f"Retrieved {len(likes)} liked tracks")
        return likes
    except Exception as e:
        logger.error(f"Error getting likes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get likes: {str(e)}")

@app.post("/likes")
async def add_like(track: TrackInfo):
    try:
        likes = load_likes()
        
        if any(t.id == track.id for t in likes):
            return {"message": "Track already liked", "count": len(likes)}
        
        likes.append(track)
        save_likes(likes)
        
        asyncio.create_task(cache_liked_track(track))
        
        logger.info(f"Added like: {track.artist} - {track.title}")
        return {"message": "Track liked", "count": len(likes)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding like: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add like: {str(e)}")

@app.delete("/likes/{track_id}")
async def remove_like(track_id: int):
    try:
        likes = load_likes()
        original_count = len(likes)
        
        likes = [t for t in likes if t.id != track_id]
        
        if len(likes) == original_count:
            raise HTTPException(status_code=404, detail="Track not found in likes")
        
        save_likes(likes)
        
        file_path = TEMP_DIR / f"{track_id}.mp3"
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"Removed cached file for unliked track: {track_id}")
            except Exception as e:
                logger.warning(f"Failed to remove cached file: {e}")
        
        logger.info(f"Removed like for track ID: {track_id}")
        return {"message": "Track unliked", "count": len(likes)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing like: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove like: {str(e)}")

@app.put("/likes")
async def sync_likes(tracks: List[TrackInfo]):
    try:
        save_likes(tracks)
        logger.info(f"Synced {len(tracks)} liked tracks")
        return {"message": "Likes synced", "count": len(tracks)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing likes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync likes: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server... Temp directory: {TEMP_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
