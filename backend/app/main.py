from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .routers import scan, crawler, notices, dashboard, truthin

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Compliance & Food Safety Platform — SIH26034"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(crawler.router)
app.include_router(notices.router)
app.include_router(dashboard.router)
app.include_router(truthin.router)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "scan": "/api/v1/scan",
            "crawl": "/api/v1/crawl",
            "notices": "/api/v1/notices/generate",
            "dashboard_stats": "/api/v1/dashboard/stats",
            "dashboard_history": "/api/v1/dashboard/history"
        }
    }


from .services.supabase_service import get_supabase_status

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "supabase": get_supabase_status()
    }
