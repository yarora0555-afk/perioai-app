# Publishing PerioAI on Google Play

PerioAI is an installable Progressive Web App (PWA) with a web manifest, maskable icons, a service worker
and a privacy policy. To ship it as a native Android app, wrap it in a **Trusted Web Activity (TWA)**.

## 1. Deploy
Deploy the app to a public HTTPS domain (e.g. `https://perioai.example.com`) with a PostgreSQL database
(`DATABASE_URL`). Optional: set `AI_MODEL_URL` / `AI_MODEL_KEY` to connect your Python/TensorFlow model server.

## 2. Generate the Android App Bundle
Option A: PWABuilder (no code)
1. Go to https://www.pwabuilder.com and enter your domain.
2. Choose **Android → Generate Package** (package id e.g. `com.perioai.app`).
3. Download the ZIP. It contains `app-release-bundle.aab`, a signing key and `assetlinks.json`.

Option B: Bubblewrap CLI / Android Studio
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://perioai.example.com/manifest.webmanifest
bubblewrap build        # produces app-release-bundle.aab
```
Open the generated project in Android Studio if you want to customise the splash screen or signing.

## 3. Digital Asset Links
Place the generated `assetlinks.json` at `public/.well-known/assetlinks.json` and redeploy, so the app
opens full-screen without a browser bar.

## 4. Play Console
- Upload the `.aab` in Play Console → Production → Create release.
- Store listing: use `public/icons/icon-512.png` as the app icon, and add screenshots.
- Privacy policy URL: `https://perioai.example.com/privacy`
- Category: Medical. Complete the Health apps declaration and Data safety form (camera, health info, stored securely).
