# CivicLoop 🔄

> Report civic problems — broken streetlights, garbage piles, potholes, water issues — in under a minute and know your complaint was received.

CivicLoop is a **mobile-first web app** built as a Buildathon demo. It lets a citizen (Priya, Ghaziabad) file a civic complaint with a category, description, optional photo, and GPS location, then instantly see a reference number and "Received" status. No backend required — reports are stored in `localStorage`.

---

## Screenshots

| Home | Report Form | Confirmation |
|------|-------------|--------------|
| Stats, report history, and the big CTA | Category, description, photo, GPS location | Reference number + status |

---

## Features

- **One-minute reporting** — category → description → location → submit
- **4 issue categories** — 💡 Streetlight · 🗑️ Garbage · 🕳️ Pothole · 💧 Water
- **GPS auto-location** — uses the browser Geolocation API and reverse-geocodes to a readable address via [OpenStreetMap Nominatim](https://nominatim.org/); falls back gracefully to manual text entry
- **Optional photo** — attach a photo from camera or gallery (up to 8 MB); previewed before submit
- **Auto reference number** — format `CL-YYMMDD-XXXX`, shown on the confirmation screen
- **Persistent history** — all reports saved in `localStorage`; survive page refresh
- **Live stats** — Total / Received / Resolved counts on the home screen
- **Accessible** — semantic HTML, ARIA labels, focus-visible rings, `aria-live` for status messages
- **Zero dependencies** — plain HTML, CSS, and JavaScript; no build step, no npm

---

## Project Structure

```
civicloop-demo/
├── index.html   # App shell — 3 screens (Home, Report Form, Confirmation)
├── style.css    # All styles — dark theme, glassmorphism, animations
├── app.js       # All logic — routing, form handling, geolocation, localStorage
├── .gitignore
└── README.md
```

---

## Running Locally

Because the app uses the **Geolocation API**, browsers block it on plain `file://` URLs in some configurations. The safest way to test is with a local server.

### Option 1 — VS Code Live Server (easiest)
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Right-click `index.html` → **Open with Live Server**.
3. The app opens at `http://127.0.0.1:5500`.

### Option 2 — Python (no install needed on macOS)
```bash
cd civicloop-demo
python3 -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 3 — Node `serve`
```bash
npx serve .
```
Then open the URL it prints.

### Option 4 — Double-click (limited)
Open `index.html` directly in Chrome or Safari. Everything works except GPS (blocked on `file://` by some browsers).

---

## Deploying to Vercel

No build step needed — Vercel serves the files as-is.

### Via the Vercel Dashboard (drag & drop)
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New → Project**.
3. Drag the `civicloop-demo` folder onto the import area.
4. Leave all settings at their defaults and click **Deploy**.
5. Your app is live at a `*.vercel.app` URL in ~30 seconds.

### Via the Vercel CLI
```bash
# Install the CLI once
npm install -g vercel

# From inside the project folder
cd civicloop-demo
vercel

# Follow the prompts — no framework, no build command, output dir = ./
```

### Via GitHub (recommended for ongoing work)
1. Push this repo to GitHub.
2. On Vercel, click **Add New → Project → Import Git Repository**.
3. Select your repo. Leave Framework Preset as **Other**, Build Command blank, Output Directory blank.
4. Click **Deploy**. Every future push to `main` auto-deploys.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Structure | HTML5 | Semantic, accessible |
| Styling | Vanilla CSS | No build step, full control |
| Logic | Vanilla JavaScript (ES2020) | No framework overhead |
| Storage | `localStorage` | Works offline, no backend needed |
| Geocoding | OpenStreetMap Nominatim | Free, no API key required |
| Hosting | Vercel (static) | Zero-config static deploy |

---

## Browser Support

Works on all modern browsers (Chrome 90+, Safari 14+, Firefox 88+, Edge 90+).  
Geolocation requires HTTPS in production — Vercel provides this automatically.

---

## License

MIT — free to use, modify, and share.
