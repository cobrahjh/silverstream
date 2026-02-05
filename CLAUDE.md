# silverstream

**Port:** 8900
**Type:** Hive Service
**Status:** Development

---

## Overview

SilverStream is a web-based music and activity platform designed for senior living and care facilities. It provides a YouTube video library categorized by era (1940s–1970s, Hymns, Timeless), genre (Big Band, Motown, Gospel, etc.), and activity type (Sing-Along, Drum Circle, Trivia, Movement, Relaxation, Bingo). The frontend features large touch targets, adjustable font scaling, and high contrast mode for accessibility. An admin panel allows staff to customize activities, manage the video library, and configure features. All app logic is client-side with localStorage persistence; the server is a static file host with Hive ecosystem integration.

---

## Parent Context

See [main CLAUDE.md](C:/LLM-DevOSWE/CLAUDE.md) for full Hive ecosystem context.

Key references:
- [SERVICE-REGISTRY.md](C:/LLM-DevOSWE/SERVICE-REGISTRY.md) - All ports and services
- [STANDARDS.md](C:/LLM-DevOSWE/STANDARDS.md) - Coding patterns and conventions

---

## Quick Start

```bash
npm install
npm start
```

Health check: `http://localhost:8900/api/health`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (required) |
| GET | `/api/status` | Service status |

---

## Integration Points

### Relay (Port 8600)
```javascript
// Send alert
fetch('http://localhost:8600/api/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'info', message: 'Hello from silverstream' })
});

// Store data
fetch('http://localhost:8600/api/knowledge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'mydata', value: { foo: 'bar' } })
});
```

### Orchestrator (Port 8500)
Service will be auto-monitored if registered in orchestrator config.

---

## Configuration

Edit `config.json`:
```json
{
  "port": 8900,
  "name": "silverstream"
}
```

---

## Development Notes

- All app logic is client-side in `silverstream.html` (main UI) and `admin.html` (admin panel). No frontend framework — vanilla JS with innerHTML rendering and global state.
- Video library and feature config are stored in `localStorage`. Admin panel writes config that the main app reads.
- YouTube playback uses the IFrame Player API (`YT.Player`) with error handling for blocked/removed videos and auto-advance playlists.
- `server.js` is a minimal Express static file server. The only custom endpoints are `/api/health`, `/api/status`, and placeholder `/api/example` routes.
- Relay integration helpers (`sendAlert`, `storeKnowledge`, `getKnowledge`) are defined but only `sendAlert` is actively used (on startup).
- `test-browser.js` runs Puppeteer-based smoke tests — requires the server to be running first.
- `remove.js` is a Hive ecosystem utility for unregistering and deleting the service.
