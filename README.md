# Makroku

Design a modern mobile-first macroeconomic forecasting application inspired by the visual language and UX patterns of Indonesian super apps such as Grab and Gojek, but do NOT directly copy their logos, branding, icons, or proprietary UI.

The app is called MacroCast and helps users explore economic indicators and generate forecasts for GDP growth, CPI inflation, unemployment, interest rates, and other macroeconomic variables.

Overall visual style

Indonesian super-app aesthetic

Clean, friendly, approachable, and highly polished

Minimalist white/light-gray background

Strong green primary accent

Rounded cards with generous spacing

Soft shadows and subtle borders

Large bold numbers for important metrics

Simple line icons

Compact but information-dense layouts

Mobile-first responsive design

Smooth hierarchy similar to a consumer fintech/transport app rather than an academic statistics website

Use subtle green gradients sparingly

Avoid overly technical Bloomberg-style styling

The interface should feel accessible to a university student who is learning economics and data science

Home screen

Create a dashboard with:

Header

"Good afternoon 👋"

"MacroCast"

Small profile/settings icon

Main forecast card

"Indonesia GDP Growth"

Large number: "5.1%"

Label: "Next quarter forecast"

Small indicator: "+0.3% vs previous forecast"

Compact sparkline showing historical GDP growth

"View forecast →"

Quick indicators
Display horizontally scrollable cards:

GDP Growth — 5.1%

CPI Inflation — 2.8%

Unemployment — 4.9%

Interest Rate — 5.75%

Quick actions
Four rounded buttons:

Explore Data

Forecast

Compare

Research

Bottom navigation

Use a simple 4–5 item navigation bar:

Home
Indicators
Forecast
Models
Profile

Use recognizable minimalist icons and a green active state.

Indicators page

Create a search-driven interface inspired by Indonesian super-app discovery screens.

Top:

Search bar: "Search economic indicators..."

Filter chips:

Indonesia

Hong Kong

Singapore

Global

Sections:

Popular indicators

Recently viewed

Inflation

GDP

Employment

Interest rates

Each indicator should appear as a rounded card containing:

Indicator name

Current value

Percentage change

Tiny sparkline

Last updated date

Indicator detail page

For example:

"Indonesia CPI Inflation"

Large current value:
2.8%

Supporting information:

YoY

Previous: 2.9%

Forecast: 2.7%

Last updated: Aug 2026

Large interactive time-series chart.

Below the chart:

1Y

3Y

5Y

10Y

Max

Then cards for:

Trend

Volatility

Historical average

Latest change

Forecast page

Make forecasting feel extremely simple.

Header:
"Create a forecast"

Step 1:
Choose indicator
[ Indonesia GDP Growth ]

Step 2:
Choose model
Large selectable cards:

Naive

ARIMA

SARIMA

Regression

Each model card should have a one-line explanation.

Step 3:
Forecast horizon

1 quarter

2 quarters

4 quarters

8 quarters

Large green CTA:
Generate Forecast

When generated, display:

"Your forecast"

5.2%

Expected next-quarter GDP growth

Then show a large chart with:

historical observations

forecast line

confidence interval

vertical divider separating historical and forecast periods

Model comparison page

Create a consumer-friendly model comparison interface.

Title:
"Which model performs best?"

Cards:

ARIMA
MAE: 0.67
RMSE: 0.84
Accuracy: 82%

Regression
MAE: 0.54
RMSE: 0.71
Accuracy: 86%

Naive
MAE: 0.82
RMSE: 1.01
Accuracy: 77%

Highlight the best-performing model with a subtle green "BEST MODEL" badge.

Include a simple "Why?" expandable section explaining the result in plain English.

Research insights

Create an easy-to-understand research summary card:

What does the model tell us?

"GDP growth is expected to remain relatively stable over the next four quarters. The regression model performs better than ARIMA because additional economic indicators provide useful predictive information."

Use:

Short paragraphs

Highlighted statistics

Small charts

Expandable methodology sections

Data source section

Clearly show data provenance:

"Data sources"

World Bank
FRED
Hong Kong Census & Statistics Department

Include:

Source

Frequency

Observation period

Last updated

Number of observations

UX requirements

The application should feel like a real Indonesian consumer app:

Fast

Simple

Friendly

Highly scannable

Strong visual hierarchy

Rounded interactive components

Bottom navigation

Search-first discovery

Horizontal scrolling cards

Clear CTAs

Minimal technical jargon

However, maintain the credibility of a financial/economic research application.

Do NOT make it look childish, gamified, or like a generic fintech banking app.

The final result should feel like:

Gojek/Grab UX philosophy + modern fintech dashboard + FRED-style economic charts + professional data science research tool.

Use realistic sample economic data throughout the interface rather than lorem ipsum.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb32deb3-d543-462f-bfb7-024468b9ca77).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
