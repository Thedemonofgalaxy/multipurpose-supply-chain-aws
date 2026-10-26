"""
AWS CloudChain SCM - Main Application Entrypoint
FastAPI Backend + Mangum AWS Lambda Serverless Handler
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from mangum import Mangum

from backend.app.config import settings
from backend.app.routers import (
    inventory,
    orders,
    suppliers,
    telemetry,
    manifest,
    cloud
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade Multipurpose Supply Chain Management Platform powered by AWS (DynamoDB, S3, SNS, Lambda)"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(inventory.router)
app.include_router(orders.router)
app.include_router(suppliers.router)
app.include_router(telemetry.router)
app.include_router(manifest.router)
app.include_router(cloud.router)

# Static and Web UI Mounting
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", include_in_schema=False)
def serve_frontend():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "AWS CloudChain SCM API is running. Visit /docs for OpenAPI documentation."}

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

# AWS Lambda Handler (Serverless execution)
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
