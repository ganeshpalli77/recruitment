"""
Startup script for the FastAPI backend
"""

import uvicorn
import os
from config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
                }
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout"
                }
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"]
            }
        }
    )
