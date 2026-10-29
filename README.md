# Orelytics — Mining Economics Intelligence

Orelytics is a responsive, interactive educational dashboard connecting mining engineering, data visualization, and economics. It is designed as a small portfolio project that can be published with GitHub Pages.

## Features

- **Commodity lab:** illustrative gold, copper, and iron ore price series with 30-, 90-, and 180-day views.
- **Price path explorer:** normalized, synthetic time-series chart.
- **Mine economics simulator:** adjustable selling price, annual production, operating cost, and annualized capital/other costs.
- **Instant model outputs:** revenue, operating cost, estimated operating surplus, surplus margin, and break-even price.
- **Risk explorer:** combines price and operating-cost shocks to stress-test the scenario.
- **CSV export:** download the current scenario and model results.
- **Responsive layout:** desktop, tablet, and mobile-friendly design.
- **No build step:** plain HTML, CSS, and JavaScript. No API keys or backend required.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a browser.

For a local server, if Python is installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a new public repository on GitHub, for example `mining-economics-intelligence`.
2. Upload `index.html`, `styles.css`, `app.js`, `README.md`, and `LICENSE` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site. The URL will look like `https://YOUR-USERNAME.github.io/mining-economics-intelligence/`.

## Model notes

This is a simplified teaching model, not a reserve estimate, feasibility study, financial forecast, or investment recommendation.

The model calculates:

- `Revenue = Selling price × Annual production`
- `Operating cost = Unit operating cost × Annual production`
- `Estimated operating surplus = Revenue − Operating cost − Annualized capital and other costs`
- `Break-even price = Unit operating cost + Annualized capital and other costs / Annual production`
- `Surplus margin = Estimated operating surplus / Revenue × 100`

The simulator excludes taxes, royalties, financing, closure costs, working capital, recovery, dilution, payability, and price hedging. Real mine economics require engineering studies and site-specific data.

**All market prices and chart series in this project are illustrative synthetic data. There is no live market feed.** The dashboard labels this so it cannot be mistaken for real-time commodity pricing.

## Suggested next steps

- Add a CSV upload for user-defined scenarios.
- Add sensitivity tables for price and cost combinations.
- Compare two mine scenarios side by side.
- Add a Python notebook to document the model and assumptions.
- Replace the synthetic series only with a reputable data source and clearly document the source, timestamp, license, and units.

## Project context

Created as a learning portfolio project combining mining engineering, computer/data science, and economics. No affiliation with a mining company or financial institution is implied.

## License

MIT. See [`LICENSE`](LICENSE).
