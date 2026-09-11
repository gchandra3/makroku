"""
FastAPI routes for regression service
"""

from fastapi import APIRouter, HTTPException, status
from uuid import uuid4
from datetime import datetime
import numpy as np

from app.schemas.regression import (
    RegressionRequest,
    RegressionResult,
    HealthResponse,
)
from app.services.regression import run_ols_regression, validate_regression_inputs

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
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


@router.post("/regress", response_model=RegressionResult)
async def run_regression(request: RegressionRequest):
    """Run OLS regression with diagnostics"""
    try:
        # Validate inputs
        warnings = validate_regression_inputs(request)

        # Run regression
        result = run_ols_regression(request)

        # Add validation warnings
        result.warnings.extend(warnings)

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except np.linalg.LinAlgError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Linear algebra error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Regression failed: {str(e)}",
        )


@router.get("/regress/{regression_id}", response_model=RegressionResult)
async def get_regression(regression_id: str):
    """Get stored regression result (placeholder - would need persistence)"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Persistence not yet implemented",
    )