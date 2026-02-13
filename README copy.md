# Bus Tracker Client

This is a minimal React + Vite frontend for the Private Bus Tracking system.

Quick start

1. cd into the client folder

```bash
cd client
npm install
npm run dev
```

2. The app expects a backend API endpoint at `/api/buses` that returns JSON array of buses with fields: `id`, `lat`, `lng`, `route` (optional), `speed` (optional), `status` (optional).

Polling runs every 5s by default. Build with `npm run build` for production.
