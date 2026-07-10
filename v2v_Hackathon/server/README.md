# Community Safety Network — Backend

Node.js + Express + MongoDB (Mongoose) backend powering two features:

1. **Community Safety Network** — location-based incident reporting & peer verification
2. **Smart Emergency SOS** — one-tap, 3-level emergency alert system

---

## 1. Folder structure

```
community-safety-backend/
├── server.js                  # Entry point: HTTP server + Socket.io + DB connect
├── package.json
├── .env.example                # Copy to .env and fill in
├── .gitignore
├── uploads/                    # SOS evidence files land here (auto-created)
└── src/
    ├── app.js                  # Express app: middleware + route mounting
    ├── config/
    │   └── db.js                # Mongoose connection
    ├── models/
    │   ├── User.js
    │   ├── TrustedContact.js
    │   ├── Incident.js          # Feature 1
    │   └── SOSAlert.js          # Feature 2
    ├── controllers/
    │   ├── authController.js
    │   ├── trustedContactController.js
    │   ├── incidentController.js
    │   ├── sosController.js
    │   └── locationController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── trustedContactRoutes.js
    │   ├── incidentRoutes.js
    │   ├── sosRoutes.js
    │   └── locationRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js    # JWT protect()
    │   ├── errorHandler.js
    │   └── upload.js            # Multer config for evidence uploads
    ├── services/
    │   ├── geocodingService.js  # Google Maps Geocoding API wrapper (NOT map rendering)
    │   └── notificationService.js # Email (Nodemailer) + SMS (Twilio) + police webhook
    ├── sockets/
    │   └── index.js             # Socket.io: live location broadcast rooms
    └── utils/
        ├── asyncHandler.js
        └── generateToken.js
```

---

## 2. Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in your values
cp .env.example .env

# 3. Start MongoDB (Atlas cloud cluster, or locally: mongod)

# 4. Run in dev mode (auto-restarts on change)
npm run dev

# or plain
npm start
```

Server runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

### Required `.env` values to get started
- `MONGO_URI` — MongoDB Atlas or local connection string
- `JWT_SECRET` — any long random string
- `GOOGLE_MAPS_API_KEY` — **only needs the "Geocoding API" enabled** in Google Cloud Console (Billing must be on, but usage is far below free-tier limits for a hackathon). No Maps JavaScript API / map rendering needed.

Everything else (email, SMS, police webhook) is **optional** — if left blank, the app logs `[MOCK EMAIL]` / `[MOCK SMS]` / `[SIMULATED POLICE ALERT]` to the console instead of failing, so you can demo the full flow with zero paid services configured.

---

## 3. How Feature 1 (Community Safety Network) maps to code

- Uses **Geocoding API only** (`geocodingService.js` → `reverseGeocode()`), exactly as you specified — coordinates in, readable address out. No map is rendered anywhere.
- `Incident` model stores a GeoJSON `Point` + `2dsphere` index → enables `GET /api/incidents/nearby?lat=..&lng=..&radius=2000` using MongoDB's native `$near` geospatial query (fast, no external API call needed for the "what's near me" search itself).
- Peer verification: `POST /api/incidents/:id/verify` lets other users confirm/dispute a report; after 3 confirms it's auto-marked `verified`, after 3 disputes it's `disputed`.
- `isAnonymous` flag hides the reporter's identity in every response.

## 4. How Feature 2 (Smart Emergency SOS) maps to code

The three levels are implemented as a single `SOSAlert` document whose feature flags are derived from `level` (see `flagsForLevel()` in `sosController.js`):

| Level | Label | guardianModeActive | audioRecordingActive | videoRecordingActive | policeNotified | Who's notified |
|---|---|---|---|---|---|---|
| 1 | Feeling Unsafe | ✅ | ❌ | ❌ | ❌ | Primary trusted contacts only |
| 2 | Need Help | ✅ | ✅ | ❌ | ❌ | All trusted contacts |
| 3 | Emergency | ✅ | ✅ | ✅ | ✅ (simulated) | All trusted contacts + police |

Flow:
1. `POST /api/sos/trigger` `{ level, lat, lng }` → creates the alert, reverse-geocodes the location, notifies the right contact tier, simulates police dispatch for Level 3, and emits a `sos_triggered` Socket.io event.
2. `PATCH /api/sos/:id/location` `{ lat, lng }` → called on an interval (e.g. every 10–15s) by the client while the alert is active. Appends to `locationHistory` and broadcasts `location_update` over the alert's Socket.io room — this is the "continue sharing location until safe" requirement.
3. `PATCH /api/sos/:id/escalate` `{ level }` → e.g. user starts at Level 1, situation worsens, bump to Level 3. Notifies any newly-added contacts + police, logs to `escalationHistory`.
4. `POST /api/sos/:id/recording` (multipart, field `file`, body `type=audio|video|photo`) → stores evidence file, returns its URL.
5. `PATCH /api/sos/:id/resolve` → "I'm safe now", stops the alert, clears `user.activeSOS`.

### Real-time updates (trusted contacts watching live)
Trusted contacts' client apps connect via Socket.io and:
```js
socket.emit("join_sos_room", alertId);
socket.on("location_update", (payload) => { /* move marker */ });
socket.on("sos_escalated", (payload) => { /* alert UI */ });
socket.on("sos_resolved", (payload) => { /* clear alert */ });
```

---

## 5. API Reference

All endpoints except `/api/auth/register` and `/api/auth/login` require header:
`Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, phone }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | — |
| PATCH | `/api/auth/location` | `{ lat, lng }` |

### Trusted Contacts
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/contacts` | `{ name, phone, email, relation, notifyBy: ["sms","email"], isPrimary }` |
| GET | `/api/contacts` | — |
| PATCH | `/api/contacts/:id` | any updatable field |
| DELETE | `/api/contacts/:id` | — |

### Incidents (Feature 1)
| Method | Endpoint | Body / Query |
|---|---|---|
| POST | `/api/incidents` | `{ type, description, severity, lat, lng, isAnonymous }` |
| GET | `/api/incidents/nearby` | `?lat=&lng=&radius=2000&type=&status=` |
| GET | `/api/incidents/:id` | — |
| POST | `/api/incidents/:id/verify` | `{ vote: "confirm"|"dispute", comment }` |
| PATCH | `/api/incidents/:id/status` | `{ status }` |

### SOS (Feature 2)
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/sos/trigger` | `{ level: 1\|2\|3, lat, lng }` |
| GET | `/api/sos/active` | — |
| GET | `/api/sos/history` | — |
| GET | `/api/sos/:id` | — |
| PATCH | `/api/sos/:id/location` | `{ lat, lng }` |
| PATCH | `/api/sos/:id/escalate` | `{ level }` |
| POST | `/api/sos/:id/recording` | multipart: `file`, `type` |
| PATCH | `/api/sos/:id/resolve` | — |

### Location (standalone geocoding utilities)
| Method | Endpoint | Query |
|---|---|---|
| GET | `/api/location/reverse-geocode` | `?lat=&lng=` |
| GET | `/api/location/geocode` | `?address=` |

---

## 6. Notes & next steps

- **Verified:** every file has been syntax-checked and the full Express app was smoke-tested (all routes/controllers/models load and the server boots cleanly) before delivery.
- File uploads currently save to local disk (`/uploads`) — fine for a hackathon demo, but swap `middleware/upload.js` to stream to S3/Cloudinary/Firebase before any real deployment (local disk storage isn't persistent on most hosting platforms).
- Trusted-contact viewing of a live SOS alert currently just requires being logged in and knowing the alert ID — for production, generate a separate expiring signed share-link/token per contact instead.
- If you'd rather use **Supabase/Postgres** instead of MongoDB: the main change is swapping Mongoose schemas for Supabase tables + using PostGIS (`geography(Point)` + `ST_DWithin`) instead of `2dsphere`/`$near` for the nearby-incidents query. Everything else (controllers' logic, routes, services) stays conceptually the same. Happy to generate that version too if you want it.
