"""
Ancient Text Translational Portal - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routes import auth, upload, translation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting Ancient Text Translational Portal...")
    init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## Ancient Text Translational Portal
    
    A full-stack web application that translates ancient Sanskrit text into Telugu and other languages.
    
    ### Features:
    - **User Authentication**: Secure login and registration with JWT tokens
    - **Multiple Input Formats**: Upload images, PDFs, documents, or enter text directly
    - **OCR Support**: Extract Sanskrit text from scanned images
    - **Multi-language Translation**: Translate to Telugu, Hindi, English, and more
    - **Translation History**: View and manage your past translations
    
    ### API Sections:
    - **Authentication**: User registration, login, and profile management
    - **Uploads**: File upload and text extraction
    - **Translations**: Text translation and history
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(translation.router)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Translate ancient Sanskrit text into Telugu and other languages",
        "docs": "/api/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "message": "Welcome to the Ancient Text Translational Portal API",
        "version": settings.APP_VERSION,
        "endpoints": {
            "auth": "/api/auth",
            "uploads": "/api/uploads",
            "translations": "/api/translations",
            "docs": "/api/docs"
        }
    }
