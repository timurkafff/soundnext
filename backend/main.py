import asyncio
import os
import tempfile
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

# Вспомогательная функция для создания безопасного имени файла
def create_safe_filename(artist: str, title: str) -> str:
    """
    Создает безопасное имя файла, удаляя/заменяя проблемные символы.
    Нормализует Unicode символы в ASCII.
    """
    artist = artist or 'Unknown'
    title = title or 'Track'
    
    # Нормализуем Unicode и конвертируем в ASCII
    artist_normalized = unicodedata.normalize('NFKD', artist).encode('ascii', 'ignore').decode('ascii')
    title_normalized = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    
    # Оставляем только безопасные символы
    safe_artist = "".join(c for c in artist_normalized if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_title = "".join(c for c in title_normalized if c.isalnum() or c in (' ', '-', '_')).strip()
    
    # Если после очистки ничего не осталось, используем значения по умолчанию
    safe_artist = safe_artist if safe_artist else 'Unknown'
    safe_title = safe_title if safe_title else 'Track'
    
    return f"{safe_artist} - {safe_title}.mp3"

# Enable CORS для подключения фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене укажите конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация API
api = SoundcloudAPI()
TEMP_DIR = Path(tempfile.gettempdir()) / "soundcloud_downloads"
TEMP_DIR.mkdir(exist_ok=True)

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
            "download": "/download?url=soundcloud_url"
        }
    }

@app.get("/search", response_model=SearchResult)
async def search_tracks(q: str, limit: int = 20):
    """Поиск треков по названию"""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    try:
        logger.info(f"Searching for: {q}")
        
        # Получаем client_id если его еще нет
        if not api.client_id:
            await api.get_credentials()
        
        # Используем SoundCloud API для поиска
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
                        # Создаем Track объект из результата поиска
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
    """Получение информации о треке без скачивания"""
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
    """Потоковая передача трека (скачивание и отправка по частям)"""
    if not url.startswith("https://soundcloud.com"):
        raise HTTPException(status_code=400, detail="Invalid SoundCloud URL")
    
    try:
        logger.info(f"Streaming: {url}")
        track = await api.resolve(url)
        
        if not isinstance(track, Track):
            raise HTTPException(status_code=400, detail="URL is not a valid track")
        
        # Проверяем, доступен ли трек для скачивания
        if not track.streamable:
            raise HTTPException(status_code=403, detail="Track is not streamable")
        
        # Создаем безопасное имя файла
        filename = create_safe_filename(track.artist, track.title)
        file_path = TEMP_DIR / f"{track.id}.mp3"
        
        if not file_path.exists():
            logger.info(f"Downloading to: {file_path}")
            try:
                with open(file_path, 'wb+') as file:
                    await track.write_mp3_to(file)
                
                # Проверяем, что файл действительно создан и не пустой
                if not file_path.exists() or file_path.stat().st_size == 0:
                    raise Exception("Failed to download track - file is empty")
                    
            except Exception as download_error:
                # Удаляем пустой или поврежденный файл
                if file_path.exists():
                    file_path.unlink()
                logger.error(f"Download failed: {str(download_error)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Track download failed. This track may not be available for streaming."
                )
        else:
            logger.info(f"Using cached file: {file_path}")
        
        # Создаем генератор для стриминга
        async def iterfile():
            with open(file_path, 'rb') as file:
                chunk_size = 64 * 1024  # 64KB chunks
                while chunk := file.read(chunk_size):
                    yield chunk
        
        # Кодируем имя файла для заголовка (RFC 5987)
        encoded_filename = quote(filename)
        
        logger.info(f"Streaming file: {filename}")
        return StreamingResponse(
            iterfile(),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
                "Accept-Ranges": "bytes",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stream error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")

@app.get("/download")
async def download_track(url: str):
    """Скачивание трека как файл"""
    if not url.startswith("https://soundcloud.com"):
        raise HTTPException(status_code=400, detail="Invalid SoundCloud URL")
    
    try:
        logger.info(f"Downloading: {url}")
        track = await api.resolve(url)
        
        if not isinstance(track, Track):
            raise HTTPException(status_code=400, detail="URL is not a valid track")
        
        # Создаем безопасное имя файла
        filename = create_safe_filename(track.artist, track.title)
        file_path = TEMP_DIR / f"{track.id}.mp3"
        
        # Скачиваем трек, если его еще нет
        if not file_path.exists():
            logger.info(f"Downloading to: {file_path}")
            with open(file_path, 'wb+') as file:
                await track.write_mp3_to(file)
        
        # Кодируем имя файла для заголовка (RFC 5987)
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
    """Получение информации о плейлисте"""
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
    """Удаление кэшированного трека"""
    file_path = TEMP_DIR / f"{track_id}.mp3"
    
    if file_path.exists():
        file_path.unlink()
        logger.info(f"Deleted cached file: {file_path}")
        return {"message": f"Cache deleted for track {track_id}"}
    else:
        raise HTTPException(status_code=404, detail="Cached file not found")

@app.delete("/cache")
async def clear_cache():
    """Очистка всего кэша"""
    deleted_count = 0
    for file_path in TEMP_DIR.glob("*.mp3"):
        file_path.unlink()
        deleted_count += 1
    
    logger.info(f"Cleared cache: {deleted_count} files deleted")
    return {"message": f"Cache cleared: {deleted_count} files deleted"}

@app.get("/health")
async def health_check():
    """Проверка работоспособности сервера"""
    cache_files = len(list(TEMP_DIR.glob("*.mp3")))
    cache_size = sum(f.stat().st_size for f in TEMP_DIR.glob("*.mp3"))
    
    return {
        "status": "healthy",
        "temp_dir": str(TEMP_DIR),
        "cache_files": cache_files,
        "cache_size_mb": round(cache_size / (1024 * 1024), 2)
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server... Temp directory: {TEMP_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
