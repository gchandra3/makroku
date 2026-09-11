"""
OLS Regression service
"""

import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.regression.linear_model import OLS
from statsmodels.tools.tools import add_constant
from typing import List, Optional

from app.schemas.regression import (
    RegressionRequest,
    RegressionResult,
    Coefficient,
    ModelFit,
    ResidualStats,
    DiagnosticTest,
    RegressionConfig,
)
from app.diagnostics.tests import run_all_diagnostics


def run_ols_regression(request: RegressionRequest) -> RegressionResult:
    """
    Run OLS regression and return complete results with diagnostics
    """
    # Prepare data
    y = np.array(request.target)
    X = np.array(request.features).T  # statsmodels expects (n_obs, n_features)

    # Validate dimensions
    if len(y) != X.shape[0]:
        raise ValueError(f"Target length ({len(y)}) != features rows ({X.shape[0]})")
    if X.shape[1] != len(request.feature_names):
        raise ValueError(f"Feature count ({X.shape[1]}) != names count ({len(request.feature_names)})")

    # Add intercept if requested
    config = request.config
    if config.include_intercept:
        X = add_constant(X, prepend=True)
        feature_names = ['intercept'] + request.feature_names
    else:
        feature_names = request.feature_names

    # Fit OLS model
    model = OLS(y, X)
    results = model.fit(
        cov_type='HC3' if config.robust_standard_errors else 'nonrobust'
    )

    # Extract coefficients
    coefficients = []
    for i, name in enumerate(feature_names):
        coef = Coefficient(
            name=name,
            estimate=float(results.params[i]),
            std_error=float(results.bse[i]),
            t_statistic=float(results.tvalues[i]),
            p_value=float(results.pvalues[i]),
            ci_lower=float(results.conf_int(alpha=config.significance_level)[i, 0]),
            ci_upper=float(results.conf_int(alpha=config.significance_level)[i, 1]),
            significant=float(results.pvalues[i]) < config.significance_level,
        )
        coefficients.append(coef)

    # Model fit
    model_fit = ModelFit(
        r_squared=float(results.rsquared),
        adjusted_r_squared=float(results.rsquared_adj),
        f_statistic=float(results.fvalue),
        f_p_value=float(results.f_pvalue),
        aic=float(results.aic),
        bic=float(results.bic),
        n_observations=int(results.nobs),
        degrees_of_freedom=int(results.df_model),
        log_likelihood=float(results.llf),
    )

    # Residual statistics
    residuals = results.resid
    residual_stats = ResidualStats(
        mean=float(np.mean(residuals)),
        std=float(np.std(residuals)),
        min=float(np.min(residuals)),
        max=float(np.max(residuals)),
        skewness=float(pd.Series(residuals).skew()),
        kurtosis=float(pd.Series(residuals).kurtosis()),
        jarque_bera=float(stats.jarque_bera(residuals)[0]),
        jarque_bera_p_value=float(stats.jarque_bera(residuals)[1]),
    )

    # Diagnostics
    diagnostics = run_all_diagnostics(
        residuals=residuals,
        fitted=results.fittedvalues,
        exog=X,
        endog=y,
    )

    # Warnings
    warnings = []
    if any(not d.passed for d in diagnostics if 'Normality' in d.name):
        warnings.append("Residuals may not be normally distributed")
    if any(not d.passed for d in diagnostics if 'Heteroskedasticity' in d.name or 'Breusch-Pagan' in d.name or 'White' in d.name):
        warnings.append("Heteroskedasticity detected - consider robust standard errors")
    if any(not d.passed for d in diagnostics if 'VIF' in d.name and d.statistic >= 10):
        warnings.append("High multicollinearity detected (VIF >= 10)")
    if not any(d.passed for d in diagnostics if 'Durbin-Watson' in d.name):
        warnings.append("Autocorrelation detected in residuals")

    return RegressionResult(
        name=request.name,
        description=request.description,
        coefficients=coefficients,
        model_fit=model_fit,
        residuals=residual_stats,
        diagnostics=diagnostics,
        warnings=warnings,
    )


def validate_regression_inputs(request: RegressionRequest) -> List[str]:
    """Validate regression inputs and return list of warnings"""
    warnings = []

    # Check sample size
    n = len(request.target)
    k = len(request.feature_names)
    if n < k + 2:
        warnings.append(f"Small sample size: n={n}, k={k}. Results may be unreliable.")

    # Check for constant features
    for i, feat in enumerate(request.features):
        if np.all(np.array(feat) == feat[0]):
            warnings.append(f"Feature '{request.feature_names[i]}' is constant")

    # Check for perfect multicollinearity
    X = np.array(request.features).T
    if config_include_intercept := request.config.include_intercept:
        X = add_constant(X, prepend=True)
    try:
        rank = np.linalg.matrix_rank(X)
        if rank < X.shape[1]:
            warnings.append("Perfect multicollinearity detected (rank deficient)")
    except Exception:
        pass

    return warnings