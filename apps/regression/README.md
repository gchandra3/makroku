# Makroku Regression Service

Python FastAPI microservice for OLS regression with comprehensive diagnostics.

## Quick Start

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run development server
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/regress` - Run OLS regression
- `GET /api/v1/regress/{id}` - Get stored result (not implemented)

## Request Format

```json
{
  "target": [1.2, 2.3, 3.1, ...],
  "features": [[1, 2, 3, ...], [4, 5, 6, ...]],
  "feature_names": ["gdp", "inflation"],
  "config": {
    "include_intercept": true,
    "robust_standard_errors": false,
    "significance_level": 0.05
  }
}
```

## Diagnostics Included

- **Normality**: Jarque-Bera, Omnibus tests
- **Heteroskedasticity**: Breusch-Pagan, White tests
- **Linearity**: Rainbow, Harvey-Collier tests
- **Autocorrelation**: Durbin-Watson test
- **Multicollinearity**: Variance Inflation Factors (VIF)