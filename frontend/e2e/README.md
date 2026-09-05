Run against the DEV-only Design Mode server (synthetic data):

```powershell
$env:VITE_DESIGN_MODE='true'
npm run dev -- --port 3101
```

In another terminal, from `frontend`, run `node e2e/run.mjs`.
Playwright must be available; if it is installed elsewhere, set
`PLAYWRIGHT_MODULE` to its absolute package directory. The runner uses a
headless browser and does not control the desktop or the live Tauri app.

Checks: ten-player layout and four skins per player at 1200x700 and 1920x1080;
one dialog through profile/history/detail navigation; keyboard Back/Escape,
focus and scroll restoration; cross-match note drafts and successful saving.
