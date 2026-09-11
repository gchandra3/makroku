"""
Statistical diagnostic tests for regression models
"""

import numpy as np
from scipy import stats
from statsmodels.stats.diagnostic import (
    het_breuschpagan,
    het_white,
    linear_rainbow,
    linear_harvey_collier,
)
from statsmodels.stats.stattools import jarque_bera, omni_normtest
from typing import List
from app.schemas.regression import DiagnosticTest


def run_all_diagnostics(
    residuals: np.ndarray,
    fitted: np.ndarray,
    exog: np.ndarray,
    endog: np.ndarray,
) -> List[DiagnosticTest]:
    """Run all diagnostic tests on the regression model"""
    tests = []

    # 1. Normality tests
    tests.extend(_test_normality(residuals))

    # 2. Heteroskedasticity tests
    tests.extend(_test_heteroskedasticity(residuals, exog))

    # 3. Linearity tests
    tests.extend(_test_linearity(endog, exog))

    # 4. Autocorrelation (Durbin-Watson)
    tests.append(_test_durbin_watson(residuals))

    # 5. Multicollinearity (VIF)
    tests.extend(_test_multicollinearity(exog))

    return tests


def _test_normality(residuals: np.ndarray) -> List[DiagnosticTest]:
    """Test for normality of residuals"""
    tests = []

    # Jarque-Bera test
    jb_stat, jb_p = jarque_bera(residuals)
    tests.append(DiagnosticTest(
        name="Jarque-Bera Normality Test",
        statistic=jb_stat,
        p_value=jb_p,
        passed=jb_p > 0.05,
        interpretation="Residuals appear normally distributed" if jb_p > 0.05
        else "Residuals deviate from normality",
        critical_value=None,
    ))

    # Omnibus normality test
    omni_stat, omni_p = omni_normtest(residuals)
    tests.append(DiagnosticTest(
        name="Omnibus Normality Test",
        statistic=omni_stat,
        p_value=omni_p,
        passed=omni_p > 0.05,
        interpretation="Residuals appear normally distributed" if omni_p > 0.05
        else "Residuals deviate from normality",
        critical_value=None,
    ))

    return tests


def _test_heteroskedasticity(
    residuals: np.ndarray,
    exog: np.ndarray,
) -> List[DiagnosticTest]:
    """Test for heteroskedasticity"""
    tests = []

    # Breusch-Pagan test
    try:
        bp_lm, bp_p, _, _ = het_breuschpagan(residuals, exog)
        tests.append(DiagnosticTest(
            name="Breusch-Pagan Test",
            statistic=bp_lm,
            p_value=bp_p,
            passed=bp_p > 0.05,
            interpretation="Homoskedasticity assumed" if bp_p > 0.05
            else "Evidence of heteroskedasticity",
            critical_value=None,
        ))
    except Exception:
        pass

    # White test
    try:
        white_lm, white_p, _, _ = het_white(residuals, exog)
        tests.append(DiagnosticTest(
            name="White Test",
            statistic=white_lm,
            p_value=white_p,
            passed=white_p > 0.05,
            interpretation="Homoskedasticity assumed" if white_p > 0.05
            else "Evidence of heteroskedasticity",
            critical_value=None,
        ))
    except Exception:
        pass

    return tests


def _test_linearity(
    endog: np.ndarray,
    exog: np.ndarray,
) -> List[DiagnosticTest]:
    """Test for linearity"""
    tests = []

    # Rainbow test
    try:
        rainbow_stat, rainbow_p = linear_rainbow(endog, exog)
        tests.append(DiagnosticTest(
            name="Rainbow Test (Linearity)",
            statistic=rainbow_stat,
            p_value=rainbow_p,
            passed=rainbow_p > 0.05,
            interpretation="Linear specification adequate" if rainbow_p > 0.05
            else "Evidence of non-linearity",
            critical_value=None,
        ))
    except Exception:
        pass

    # Harvey-Collier test
    try:
        hc_stat, hc_p = linear_harvey_collier(endog, exog)
        tests.append(DiagnosticTest(
            name="Harvey-Collier Test (Linearity)",
            statistic=hc_stat,
            p_value=hc_p,
            passed=hc_p > 0.05,
            interpretation="Linear specification adequate" if hc_p > 0.05
            else "Evidence of non-linearity",
            critical_value=None,
        ))
    except Exception:
        pass

    return tests


def _test_durbin_watson(residuals: np.ndarray) -> DiagnosticTest:
    """Durbin-Watson test for autocorrelation"""
    n = len(residuals)
    diff = np.diff(residuals)
    dw = np.sum(diff**2) / np.sum(residuals**2)

    # Approximate critical values for alpha=0.05
    # dl and du bounds (approximate for large n, k=3)
    dl = 1.5 - 1.5 / np.sqrt(n)
    du = 1.5 + 1.5 / np.sqrt(n)

    passed = dl < dw < (4 - du)

    if dw < dl:
        interp = "Positive autocorrelation detected"
    elif dw > 4 - du:
        interp = "Negative autocorrelation detected"
    else:
        interp = "No significant autocorrelation"

    return DiagnosticTest(
        name="Durbin-Watson Test",
        statistic=dw,
        p_value=None,
        critical_value=dl,
        passed=passed,
        interpretation=interp,
    )


def _test_multicollinearity(exog: np.ndarray) -> List[DiagnosticTest]:
    """Variance Inflation Factor (VIF) for multicollinearity"""
    tests = []

    n_vars = exog.shape[1]
    for i in range(n_vars):
        # Regress variable i on all others
        x_i = exog[:, i]
        x_others = np.delete(exog, i, axis=1)

        if x_others.shape[1] == 0:
            continue

        try:
            coeffs = np.linalg.lstsq(x_others, x_i, rcond=None)[0]
            r_squared = 1 - np.sum((x_i - x_others @ coeffs)**2) / np.sum((x_i - np.mean(x_i))**2)

            if r_squared >= 1:
                vif = float('inf')
            else:
                vif = 1 / (1 - r_squared)

            passed = vif < 10  # Common threshold

            tests.append(DiagnosticTest(
                name=f"VIF (Variable {i})",
                statistic=vif,
                p_value=None,
                critical_value=10.0,
                passed=passed,
                interpretation=f"VIF = {vif:.2f}" + (" - High multicollinearity" if vif >= 10 else " - Acceptable"),
            ))
        except Exception:
            pass

    return tests