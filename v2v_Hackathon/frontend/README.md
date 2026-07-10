# Community Safety Network — Client

React + Vite frontend wired to your `community-safety-backend`.

## What's included
- `src/api/` — axios client with JWT auto-attached on every request (`client.js`), plus `auth.js`, `sos.js`, `contacts.js`
- `src/context/AuthContext.jsx` — login/register/logout, session persisted in localStorage
- `src/hooks/useGeolocation.js` — one-off + continuous device location
- `src/hooks/useSocket.js` — Socket.io connection, joins the alert's room
- `src/hooks/useSOS.js` — full SOS lifecycle: trigger/escalate/resolve, restores an active alert on refresh, pings location every 12s while active (Guardian Mode), listens for live socket updates
- `src/components/SOSButton.jsx` — press-and-hold (1.5s) to trigger Level 1, escalate buttons once active, "I'm Safe Now" to resolve
- `src/components/TrustedContacts.jsx` — add/remove trusted contacts
- `src/pages/Login.jsx`, `Register.jsx`, `Dashboard.jsx`

## Setup

```bash
cd client
npm install
npm run dev
```

Opens on `http://localhost:3000`.

`.env` is already set to:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
Change these if your backend runs elsewhere.

## Run the backend alongside it

```bash
cd community-safety-backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GOOGLE_MAPS_API_KEY
npm install
npm run dev
```
Make sure `CLIENT_URL=http://localhost:3000` in the backend's `.env` (already the default) so CORS and the Socket.io CORS config allow the client.

## How the SOS flow works end to end

1. **Register/Login** — `AuthContext` calls `POST /api/auth/register` or `/login`, stores the JWT in `localStorage` as `csn_token`. `src/api/client.js` reads that token and attaches `Authorization: Bearer <token>` to every request automatically — nothing else in the app has to think about auth headers.
2. **Dashboard** loads and calls `GET /api/sos/active` — if you already have an active alert (e.g. you refreshed mid-emergency), the button UI picks up right where it left off.
3. **Press and hold the SOS button** for 1.5s → `useGeolocation.getCurrentPosition()` gets your coordinates → `POST /api/sos/trigger` with `{ level: 1, lat, lng }`. The backend reverse-geocodes it, notifies your primary contacts, and returns the created alert.
4. Once active, `useSOS` automatically:
   - starts `navigator.geolocation.watchPosition`
   - every 12 seconds, sends `PATCH /api/sos/:id/location` with your latest coords (this is Guardian Mode's live trail — matches the backend's 10–15s expected cadence)
   - joins the Socket.io room `sos:<alertId>` and listens for `location_update`, `sos_escalated`, `sos_resolved` so the UI stays in sync even if another device/tab triggers those.
5. **Escalate** buttons call `PATCH /api/sos/:id/escalate` with the new level — the backend notifies any newly-required contacts and (for Level 3) simulates a police alert.
6. **"I'm Safe Now"** calls `PATCH /api/sos/:id/resolve`, stops location tracking, and clears the panel.

## Adding it to your own components

```jsx
import SOSButton from "./components/SOSButton";

function SomePage() {
  return <SOSButton />;
}
```

The component is fully self-contained — it owns its own state via `useSOS()`, so you can drop it anywhere inside `<AuthProvider>`.

## Note on `express-validator`
Your backend's `package.json` lists `express-validator` but no route file uses it yet — the controllers do their own manual validation (e.g. checking `level` is 1/2/3). That's fine as-is; nothing to change on the client for it.
