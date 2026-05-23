# sngr

A browser-based song identifier — like Shazam, but on the web. Tap record, hold your device near the music, and sngr tells you what is playing.

## Features

- **Live recording** — up to 10 seconds of audio from the microphone, with a real-time waveform visualization
- **Three states** — ready (gray), listening (green pulse), recognizing (yellow pulse with musical-note icon)
- **Cancel anytime** — ✕ button while listening or recognizing; stops recording or aborts the API request without sending audio
- **Song metadata** — title and artist from [AudD](https://audd.io/)
- **Listen on Spotify** — direct link to the track on Spotify (via AudD `return=spotify`; no separate Spotify API key needed)
- **Test mode** — add `?test` to the URL to run the full UI flow with a mock AudD response from `public/data/test-response1.json`

## How it works

1. **Record** — click the central button to start listening. A live waveform fills the background.
2. **Stop** — click again, wait for the 10-second limit, or press ✕ to cancel without recognizing.
3. **Recognize** — the audio is sent to the AudD API (or the mock JSON in test mode).
4. **Result** — if a match is found, the song title, artist, and a **Listen on Spotify** button appear below the button.

The main record button stays centered in the viewport; status text, cancel control, and results are positioned below it without shifting the button.

## Tech stack

- [Vue 3](https://vuejs.org/) with `<script setup>`
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)
- [AudD API](https://docs.audd.io/) for music recognition and Spotify links
- [Fredoka](https://fonts.google.com/specimen/Fredoka) (logo) and [Roboto](https://fonts.google.com/specimen/Roboto) (UI) via Google Fonts

## Getting started

```bash
npm install
cp .env.sample .env   # add your AudD API token
npm run dev
```

Open the app (e.g. `http://localhost:5173`). Grant microphone access when prompted.

Set `VITE_AUDD_API_TOKEN` in `.env` to your [AudD API token](https://dashboard.audd.io/).

### Test mode

To try the full flow without calling AudD or using the microphone result:

```
http://localhost:5173/?test
```

Record as usual — when recognition finishes, the mock response in `public/data/test-response1.json` is used instead of the live API.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start the dev server     |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
