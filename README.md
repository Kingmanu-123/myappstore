# My App Hub

A personal, no-login "app store" for your own HTML/CSS/JS projects. Import a zip or
folder (or pull straight from GitHub), it shows up as an app tile, tap to run it in
a built-in viewer. Browse and preview files — including PDFs — and push anything
back to GitHub with one tap.

No accounts, no backend server: everything lives in this device's browser storage
(IndexedDB), and GitHub sync talks directly to `api.github.com` using a personal
access token you provide once.

## Features
- **Play-Store-style home screen** — recent apps, search, quick actions.
- **Import from device** — pick a `.zip` or a whole project folder.
- **Import from GitHub** — paste `owner/repo` (+ branch) to pull a public or, with
  a token, private repo.
- **Runner** — bundles the app's HTML/CSS/JS into one page so it runs standalone
  in a sandboxed iframe with full internet access (external CDN scripts, fonts,
  APIs all work).
- **Files tab** — browse every file across every imported app; view code, images,
  and PDFs (via pdf.js) inline.
- **GitHub tab** — connect a repo with a token, test the connection, upload any
  app on demand, or flip on **auto-upload** so new imports sync immediately.
- **Settings** — see storage used, wipe local data.

## One important limitation, honestly stated
Imported multi-file apps are **inlined into a single HTML document** (CSS/JS/images
get embedded) so they can run without a real local web server. This works well for
the vast majority of small/medium single-page HTML/CSS/JS projects. Apps that fetch
extra local files dynamically at runtime (via `fetch('./data.json')`, for example)
may need small tweaks, since there's no live local file server behind the scenes —
only real hosting (or a future native storage layer) fully solves that.

## Getting a GitHub token
GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained
token** → give it **Contents: Read and write** on the one repo you want to sync to.
Paste it into the GitHub tab here. It's stored only in this device's local storage.

---

## Turning this into an installable Android APK — entirely from your phone

You don't need a computer or Android Studio. This app is a PWA (it has a
`manifest.json` + service worker already), so **PWABuilder** can package it for you.

**Step 1 — Host the files somewhere public (GitHub Pages is easiest, and you
already want GitHub in the loop):**
1. On GitHub (mobile web or app), create a new repository, e.g. `app-hub`.
2. Upload every file in this zip into that repo, **keeping the folder structure**
   (`index.html` at the root, `css/`, `js/`, `icons/`, `manifest.json`, `sw.js`).
3. Repo → Settings → Pages → Source: **Deploy from a branch** → Branch: `main`
   → `/ (root)` → Save.
4. Wait ~1 minute, then your app is live at:
   `https://<your-username>.github.io/app-hub/`

**Step 2 — Build the APK with PWABuilder:**
1. Open `https://www.pwabuilder.com` in your phone's browser.
2. Paste your GitHub Pages URL and tap **Start**.
3. PWABuilder scores your manifest/service worker (already included here) and
   shows a green checkmark for Android readiness.
4. Tap **Package for stores → Android** → download the generated **.apk** (or
   **.aab** if you plan to publish to Google Play).
5. Open the downloaded `.apk` on your phone (allow "install unknown apps" for
   your browser if prompted) to install it like any other app.

That's it — no PC, no Android Studio, no signing keys to manage manually
(PWABuilder generates a debug-signable APK for personal installs).

## Files in this project
```
index.html        Main app shell
manifest.json     PWA manifest (used by PWABuilder for the APK)
sw.js             Service worker (offline app-shell caching)
css/style.css     Material You styling
js/icons.js       Inline SVG icon set
js/db.js          IndexedDB storage layer
js/importer.js    Zip/folder import + HTML bundling
js/github.js      GitHub REST API (import + upload)
js/pdf-viewer.js  pdf.js-based PDF rendering
js/app.js         App logic / view router
icons/            App icons (192, 512, maskable)
```
