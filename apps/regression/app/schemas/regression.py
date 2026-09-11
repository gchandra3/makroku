"""
Regression request/response schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class RegressionConfig(BaseModel):
    """Configuration for the regression analysis"""
    include_intercept: bool = True
    robust_standard_errors: bool = False
    significance_level: float = Field(0.05, ge=0.001, le=0.1)


class RegressionRequest(BaseModel):
    """Request to run OLS regression"""
    target: List[float] = Field(..., min_length=2)
    features: List[List[float]] = Field(..., min_length=1)
    feature_names: List[str] = Field(..., min_length=1)
    config: RegressionConfig = Field(default_factory=lambda: RegressionConfig(significance_level=0.05))
    name: Optional[str] = None
    description: Optional[str] = None


class Coefficient(BaseModel):
    """Single coefficient result"""
    name: str
    estimate: float
    std_error: float
    t_statistic: float
    p_value: float
    ci_lower: float
    ci_upper: float
    significant: bool


class ModelFit(BaseModel):
    """Model fit statistics"""
    r_squared: float
    adjusted_r_squared: float
    f_statistic: float
    f_p_value: float
    aic: float
    bic: float
    n_observations: int
    degrees_of_freedom: int
    log_likelihood: float


class ResidualStats(BaseModel):
    """Residual statistics"""
    mean: float
    std: float
    min: float
    max: float
    skewness: float
    kurtosis: float
    jarque_bera: float
    jarque_bera_p_value: float


class DiagnosticTest(BaseModel):
    """Individual diagnostic test result"""
    name: str
    statistic: float
    p_value: Optional[float]
    critical_value: Optional[float]
    passed: bool
    interpretation: str


class RegressionResult(BaseModel):
    """Complete regression result"""
    name: Optional[str]
    description: Optional[str]
    coefficients: List[Coefficient]
    model_fit: ModelFit
    residuals: ResidualStats
    diagnostics: List[DiagnosticTest]
    warnings: List[str]
    created_at: datetime


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    version: str = "0.1.0"
    numpy_version: str
    pandas_version: str
    statsmodels_version: str