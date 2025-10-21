import sys
import time
from pathlib import Path
import logging
import multiprocessing
import webview
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys._MEIPASS)
    STATIC_DIR = BASE_DIR / "static"
else:
    BASE_DIR = Path(__file__).parent.parent
    STATIC_DIR = BASE_DIR / "out"

backend_process: Optional[multiprocessing.Process] = None
backend_ready = False


def check_backend_health(max_retries=30, delay=0.5):
    import requests
    
    for i in range(max_retries):
        try:
            response = requests.get("http://localhost:8000/health", timeout=1)
            if response.status_code == 200:
                logger.info("✓ Backend is ready")
                return True
        except Exception:
            pass
        time.sleep(delay)
    
    logger.error("✗ Backend failed to start")
    return False


def run_backend_server():
    import uvicorn
    from main import app
    
    logger.info("Starting FastAPI backend...")
    
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="info",
            access_log=False
        )
    except Exception as e:
        logger.error(f"Backend error: {e}")


def start_backend():
    global backend_process
    
    backend_process = multiprocessing.Process(target=run_backend_server, daemon=True)
    backend_process.start()
    
    if check_backend_health():
        logger.info("Backend started successfully")
        return True
    else:
        logger.error("Failed to start backend")
        return False


def create_window():
    
    if STATIC_DIR.exists():
        index_html = STATIC_DIR / "index.html"
        if index_html.exists():
            url = str(index_html.absolute())
            logger.info(f"Loading from static files: {url}")
        else:
            logger.error(f"index.html not found in {STATIC_DIR}")
            url = "http://localhost:8000"
    else:
        url = "http://localhost:3000"
        logger.info("Loading from Next.js dev server")
    
    window = webview.create_window(
        title="SoundNext - Music Player",
        url=url,
        width=1200,
        height=850,
        resizable=False,
        frameless=False,
        easy_drag=True,
        background_color='#000000',
        text_select=True,
    )
    
    return window


def on_closing():
    global backend_process
    
    logger.info("Closing application...")
    
    if backend_process and backend_process.is_alive():
        backend_process.terminate()
        backend_process.join(timeout=2)
        if backend_process.is_alive():
            backend_process.kill()
    
    logger.info("Application closed")


class Api:
    
    def get_version(self):
        return "1.0.0"
    
    def quit(self):
        on_closing()
        webview.windows[0].destroy()


def main():
    logger.info("=" * 50)
    logger.info("Starting SoundNext Desktop Application")
    logger.info("=" * 50)
    
    if not start_backend():
        logger.error("Failed to start backend. Exiting.")
        return 1
    
    time.sleep(1)
    
    try:
        api = Api()
        window = create_window()
        
        webview.start(debug=True)
        
    except Exception as e:
        logger.error(f"Application error: {e}", exc_info=True)
        return 1
    finally:
        on_closing()
    
    return 0


if __name__ == "__main__":
    multiprocessing.freeze_support()
    
    exit_code = main()
    sys.exit(exit_code)

