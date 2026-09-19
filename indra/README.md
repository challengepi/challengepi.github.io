# VocabLoop

A dependency-free, mobile-first static vocabulary learning PWA.

## Features

- Add/edit/delete vocabulary words and meanings.
- Adaptive spaced repetition: forgotten words return sooner; easy words are delayed longer.
- IndexedDB persistence, so the deck and learning state survive reloads.
- Compact per-card review history encoded into binary varints.
- Offline app shell via Service Worker.
- Backup export/import (`.json.gz` when Compression Streams are supported).
- Storage persistence request and quota estimate.
- Touch-first responsive UI with always-visible six-section mobile navigation.
- Optional Reel Mode: vertically swipe through due reviews or continuously add words in a full-screen capture flow.
- Re-review last session in an unscored practice replay so manual repetition does not distort spaced-repetition intervals.
- Keyboard shortcuts in normal review mode.
- No backend, account, analytics, CDN, or network dependency after installation.

## Run locally

Service Workers require HTTP(S), so serve this directory instead of opening `index.html` directly.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy

Upload the files to any static host (GitHub Pages, Netlify, Cloudflare Pages, S3/static hosting, etc.) over HTTPS. Keep the same origin if you want existing browser data to remain accessible.

## Data model

Cards use compact property names internally to reduce stored payload size. Review histories are stored per card as a small `ArrayBuffer`: delta-minutes are varint encoded and followed by one byte for the grade.

## Scheduler

The default scheduler tracks a card's log2 half-life. After each answer it updates the half-life and schedules the next due time from a target recall probability. `Again` shrinks memory strength and adds a short relearning delay; `Hard`, `Good`, and `Easy` progressively increase memory strength.
