# Attendify — QR-Based Geo-Tagged Attendance Management System

A full-stack web application that lets event organizers create events and securely track attendance using QR code scanning combined with geolocation (geofence) verification. Built as part of the NSCC Full-Stack Task 2.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Additional Features](#additional-features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Database Configuration](#database-configuration)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Implementation Decisions](#implementation-decisions)
- [Concepts Learned](#concepts-learned)
- [Demo](#demo)

---

## Overview

Organizers create events with a venue, date/time, and a **geofence radius**. Each event gets a unique, randomly-generated QR code. Attendees scan that QR code with their device camera and share their live location — the system verifies they're physically within the geofence before marking attendance, and blocks duplicate check-ins at both the application and database level.

Organizers get a dashboard with live attendance stats, attendee lists, and CSV export. An optional AI feature can auto-generate event descriptions.

---

## Tech Stack

**Frontend**
- React + Vite
- Axios for API calls

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (`jsonwebtoken`, `bcryptjs`)
- `cors`, `morgan`

**AI**
- Google Gemini API — used for automated event description generation

---

## Features

### User Side
- JWT-based registration and login (each user gets a unique Registration ID)
- View upcoming events with name, venue, date, and time
- Scan an event's QR code via the device camera
- Browser geolocation access requested at scan time
- Location is verified against the event's geofence radius before attendance is accepted
- Clear confirmation (or rejection, with the actual distance shown) after scanning

### Organizer Side
- Create, edit, and delete events — including name, venue, date, time, and a configurable geofence radius (defaults to 100m)
- Each event automatically gets a unique QR code (a cryptographically random UUID, generated on creation)
- View the full attendee list for any event they own, with user details (name, email, registration ID)
- Search/filter attendees (via the organizer dashboard)

### Backend / API
- Events, users, and attendance records persisted in MongoDB
- QR codes are validated server-side by looking up the scanned code against stored events — an invalid/unknown code is rejected
- Geofence verification computes the real-world distance between the user's reported coordinates and the event's venue coordinates, rejecting the check-in (with the measured distance shown) if it exceeds the event's configured radius
- Duplicate attendance is blocked **twice over**: an application-level lookup before insert, and a MongoDB compound unique index on `{event, user}` that rejects duplicates even under race conditions
- Every attendance record stores a timestamp and the exact coordinates that were verified
- Organizer-owned events are enforced everywhere — an organizer can only view, edit, delete, or export attendance for events they created; ownership is checked against the JWT-authenticated user on every relevant request
- Input validation and clear error responses for missing fields, invalid types, unknown QR codes, out-of-range locations, and duplicate submissions

### Data Export
- Organizers can export an event's attendance as **CSV**, containing Name, Registration ID, Email, Attendance Status, and Timestamp — generated with manual, properly-escaped CSV formatting (no external library required)

### Real-Time Attendance Tracking (Brownie Subtask)
- Per-event stats endpoint returns total registrations, total attendees, and attendance percentage
- Attendee list is sorted by most recent check-in first, so organizers can see live/recent activity
- Downloadable attendance reports (CSV) directly from the same dashboard

---

## Additional Features

- **AI-generated event descriptions (`/api/ai/generate-description`)** — organizers can have Gemini draft a description for their event automatically, rather than writing one from scratch.
- **Cryptographically random QR codes** — each event's QR code is a `crypto.randomUUID()`, not a predictable sequential ID, making it impractical to guess another event's code.
- **Graceful DB-outage handling** — if the MongoDB connection fails at startup, the server still starts and logs a clear warning instead of crashing outright, making local debugging (and any transient connectivity issue) easier to diagnose.

---

## Project Structure

```
Attendify/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── components/
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── EventsList.jsx
│       │   ├── EventForm.jsx
│       │   ├── EventDetail.jsx
│       │   ├── ScanAttendance.jsx
│       │   └── OrganizerDashboard.jsx
│       └── services/
│           └── api.js
│
└── server/                     # Express backend
    └── src/
        ├── config/              # env + DB connection
        ├── controllers/
        │   ├── authController.js
        │   ├── eventController.js
        │   ├── attendanceController.js
        │   └── aiController.js
        ├── middleware/
        │   └── authMiddleware.js   # protect, authorizeRoles
        ├── models/
        │   ├── User.js
        │   ├── Event.js
        │   └── Attendance.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── event.routes.js
        │   ├── attendance.routes.js
        │   ├── ai.routes.js
        │   └── index.js
        ├── utils/
        │   └── geoUtils.js        # distance calculation
        ├── app.js
        └── index.js
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local instance or a MongoDB Atlas connection string)
- npm
- A device/browser with camera and geolocation support (for the QR scanning + location features)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/qr-geo-attendance-system.git
cd Attendify
```

### 2. Backend setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/` (see `.env.example` for the template):
```dotenv
PORT=5000
NODE_ENV=development

# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/attendify

# JWT secret
JWT_SECRET=your_strong_jwt_secret_here

# Client URL for CORS
CLIENT_URL=http://localhost:5173

# Optional — enables AI-generated event descriptions
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:
```bash
npm run dev      # nodemon, for development
# or
npm start        # plain node, for production
```

The server starts on `http://localhost:5000`. Confirm it's running by visiting `http://localhost:5000/api/health`.

### 3. Frontend setup
```bash
cd ../client
npm install
npm run dev
```

The frontend runs on Vite's default port (`http://localhost:5173`) and calls the backend at `/api`, proxied to `http://localhost:5000` during local development (see `vite.config.js`).

### 4. Try it out
- Register a new account (you'll be an `attendee` by default).
- To act as an organizer, register a second account and manually set its `role` to `organizer` in the database (via MongoDB Compass, Atlas's Data Explorer, or the mongo shell) — there's no self-service "become an organizer" flow in this build.
- Log in as the organizer, create an event with a venue and geofence radius, and note the generated QR code.
- Log in as the attendee, scan the QR code (or supply its value directly if testing without a physical code), and allow location access to check in.

---

## Database Configuration

The app uses **MongoDB** via Mongoose. By default it points to a local instance:
```
mongodb://localhost:27017/attendify
```
To use MongoDB Atlas instead, replace `MONGODB_URI` in `.env` with your Atlas connection string — no code changes required. Two important constraints are enforced at the schema level:
- `User.email` and `User.registrationId` are unique
- `Event.qrCode` is unique
- `Attendance` has a **compound unique index** on `{event, user}`, so the database itself blocks a user from checking into the same event twice, even under concurrent requests

---

## API Reference

All endpoints are prefixed with `/api`. Routes marked 🔒 require a valid JWT. Routes marked 👑 additionally require the `organizer` role.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in, returns a JWT |
| GET 🔒 | `/auth/me` | Get the currently logged-in user |

### Events
| Method | Endpoint | Description |
|---|---|---|
| POST 🔒👑 | `/events` | Create an event (auto-generates a unique QR code) |
| GET 🔒👑 | `/events/mine` | List events created by the logged-in organizer |
| GET 🔒 | `/events/upcoming` | List upcoming events (any authenticated user) |
| GET 🔒 | `/events/:id` | Get a single event's details |
| PUT 🔒👑 | `/events/:id` | Update an event (must be the owning organizer) |
| DELETE 🔒👑 | `/events/:id` | Delete an event (must be the owning organizer) |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| POST 🔒 | `/attendance/mark` | Mark attendance (validates QR code + geofence, blocks duplicates) |
| GET 🔒👑 | `/attendance/event/:eventId` | List attendance records for an event (owner only) |
| GET 🔒👑 | `/attendance/event/:eventId/stats` | Total registrations, attendees, and attendance % (owner only) |
| GET 🔒👑 | `/attendance/event/:eventId/export` | Download attendance as CSV (owner only) |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST 🔒👑 | `/ai/generate-description` | Generate an event description using Gemini |

---

## Data Models

**User**
`name`, `email` (unique), `password` (bcrypt-hashed, excluded from queries by default), `registrationId` (unique), `role` (`attendee` / `organizer`, default `attendee`).

**Event**
`name`, `venue`, `date`, `time`, `latitude`, `longitude`, `geofenceRadius` (meters, default 100), `organizer` (ref → User), `qrCode` (unique, auto-generated UUID on creation).

**Attendance**
`event` (ref → Event), `user` (ref → User), `status` (`present`), `timestamp` (defaults to now), `verifiedLocation` (`latitude`, `longitude` — the coordinates that were actually checked against the geofence). Enforced unique on `{event, user}` together.

---

## Implementation Decisions

- **Geofence check is done server-side, on every check-in**, using the coordinates the client reports at scan time compared against the event's stored venue coordinates — the client never decides for itself whether it's "in range." This matches the assignment's explicit scope (basic distance-based geofencing, no anti-spoofing hardening required).
- **QR codes are random UUIDs**, not sequential or human-readable IDs, so they can't be guessed or enumerated the way an incrementing ID could be.
- **Duplicate attendance is defended twice**: an application-level check (so a normal duplicate request gets a clean, friendly error) and a MongoDB unique index as a hard backstop (so even a race condition — two near-simultaneous requests slipping past the app-level check — cannot create two records). The controller explicitly catches Mongo's duplicate-key error code (`11000`) and converts it into the same clean error message.
- **Ownership is enforced per-request, not just per-role.** Being an `organizer` alone isn't enough to view or export another organizer's event — every attendance and event-management endpoint re-checks that `event.organizer` matches the authenticated user's ID.
- **CSV export is hand-rolled rather than using a library**, with a small `escapeCsvField` helper to correctly quote values containing commas, quotes, or newlines — kept intentionally simple since the export only needs five fixed columns.
- **Attendance percentage is a simplification.** Since there's no explicit event RSVP/registration flow, "total registrations" is approximated as the count of all `attendee`-role users system-wide, not people who specifically registered for that one event. This is called out directly in the code as a known scope limitation rather than hidden.
- **The server stays up even if MongoDB is unreachable at startup**, logging a warning instead of crashing — useful during development on networks where DNS-based `mongodb+srv://` lookups can intermittently fail.

---

## Concepts Learned

- Implementing **geofencing** from scratch: calculating real-world distance between two lat/long coordinates and using it as an access-control condition.
- Handling the **browser Geolocation API** and device camera access for QR scanning in a real, permission-gated user flow.
- Designing **defense-in-depth uniqueness constraints** — combining an application-level duplicate check with a database-level unique index to close race-condition gaps that application logic alone can't fully prevent.
- Applying **role-based authorization scoped to ownership**, not just role membership — the difference between "is an organizer" and "is *the* organizer who owns this resource."
- Generating and validating **QR codes as opaque, unguessable identifiers** rather than exposing internal database IDs directly.
- Writing a **manual CSV exporter** with correct field escaping, understanding why naive comma-joining breaks on real-world text data.

---

## Demo

📹 **Video Demo:** https://drive.google.com/file/d/1et8bybt1PDWnOLmcsTsNcre-6RQTAl8Y/view?usp=sharing
🌐 **Live app:** https://qr-geo-attendance-system.vercel.app/
🔗 **Backend API:** https://attendify-backend-xgaf.onrender.com

