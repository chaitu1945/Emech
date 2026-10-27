# MECHLAB 360

Interactive Engineering Mechanics lab: force resultant, friction, Lami's theorem, free-body diagrams and a quiz, with 3D views (Three.js).

## Run locally
Open `index.html` in a browser (needs internet once for the Three.js CDN), or run `python -m http.server` and visit http://localhost:8000.

## Deploy free on GitHub Pages
1. Push this folder to a GitHub repository (files at the repo root).
2. Repo Settings > Pages > Source: `main` branch, `/ (root)` > Save.
3. Your site appears at `https://<username>.github.io/<repo>/` in about a minute.

## Structure
- `index.html` page content
- `css/style.css` styles
- `js/main.js` calculators, 2D drawings, quiz
- `js/scene3d.js` 3D hero and 3D friction block (falls back to 2D if WebGL is unavailable)
