"""
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import router as regression_router
from app.schemas.regression import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Makroku Regression Service...")
    yield
    # Shutdown
    print("Shutting down Makroku Regression Service...")


app = FastAPI(
    title="Makroku Regression Service",
    description="OLS regression microservice with diagnostics",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(regression_router, prefix="/api/v1", tags=["regression"])


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def root_health():
    """Root health check"""
    import numpy as np
    import pandas as pd
    import statsmodels

    return HealthResponse(
        status="healthy",
        version="0.1.0",
        numpy_version=np.__version__,
        pandas_version=pd.__version__,
        statsmodels_version=statsmodels.__version__,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)