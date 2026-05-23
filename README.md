# sngr

A simple web app that identifies songs playing around you — like Shazam, but in the browser.

Tap the button, hold your phone or laptop near the music, and sngr listens for up to 10 seconds, then tells you the track title and artist.

## How it works

1. **Record** — Click the button to start capturing audio from your microphone. A live waveform shows that it is listening.
2. **Stop** — Click again to stop early, or wait for the 10-second limit.
3. **Recognize** — The recording is sent to the [AudD](https://audd.io/) music recognition API.
4. **Result** — If a match is found, the song title and artist appear below the button.

## Tech stack

- [Vue 3](https://vuejs.org/) with `<script setup>`
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [AudD API](https://docs.audd.io/) for song identification

## Getting started

```bash
npm install
cp .env.sample .env   # add your AudD API token
npm run dev
```

Set `VITE_AUDD_API_TOKEN` in `.env` to your [AudD API token](https://dashboard.audd.io/). The app needs microphone access in the browser to work.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start the dev server     |
| `npm run build` | Build for production     |
| `npm run preview` | Preview production build |
