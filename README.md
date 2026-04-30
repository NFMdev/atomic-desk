# Atomic Desk

Atomic Desk is a full-stack proof of concept for booking exclusive, time-boxed physical assets under concurrent load. The sample domain is a coworking office with desks and meeting rooms, but the core pattern can apply to other resources such as courts, simulators, chargers, rooms, or equipment.

The project combines a Strapi backend with a React/Vite frontend. The backend uses PostgreSQL transactions, pessimistic row locks, idempotency keys, and lock expiry to prevent duplicate or conflicting reservations.

## What It Demonstrates

- Exclusive resource locking for a selected time window.
- Idempotent reservation requests through the `x-idempotency-key` header.
- Conflict detection for overlapping `PENDING_LOCK` and `CONFIRMED` reservations.
- A five-minute pending lock before confirmation.
- A scheduled heartbeat that releases expired pending locks.
- A small React UI that loads spaces and requests a one-hour lock.

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend | Strapi 5, TypeScript, Koa |
| Database | PostgreSQL |
| Frontend | React 19, Vite, TypeScript |
| Data fetching | TanStack Query, Axios |
| Styling | Tailwind CSS utilities, `clsx`, `tailwind-merge` |
| Package manager | pnpm |

## Repository Layout

```text
.
├── backend/    # Strapi API, content types, reservation transaction logic
├── frontend/   # React/Vite booking UI
└── README.md
```

Key backend files:

- `backend/src/api/reservation/services/reservation.ts` - transactional lock and confirmation logic.
- `backend/src/api/reservation/controllers/reservation.ts` - custom reservation endpoints.
- `backend/src/api/reservation/routes/custom.ts` - public lock and confirm routes.
- `backend/config/cron-tasks.ts` - scheduled release of expired locks.
- `backend/config/database.ts` - PostgreSQL connection settings.

Key frontend files:

- `frontend/src/components/space-grid.tsx` - space grid and lock action.
- `frontend/src/hooks/use-spaces.ts` - API client and React Query hooks.
- `frontend/src/types/index.ts` - shared frontend data shapes.

## Prerequisites

- Node.js 20 through 24.
- pnpm.
- PostgreSQL running locally or reachable through `DATABASE_URL`.

Strapi is configured for PostgreSQL by default. The default database settings are:

```text
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi
DATABASE_SCHEMA=public
```

## Local Setup

Install backend dependencies:

```sh
cd backend
pnpm install
```

Create `backend/.env` from the example:

```sh
cp .env.example .env
```

Update `backend/.env` with strong secrets and your PostgreSQL settings. A local development file usually needs at least:

```text
HOST=0.0.0.0
PORT=1337
APP_KEYS=replace-me-1,replace-me-2
API_TOKEN_SALT=replace-me
ADMIN_JWT_SECRET=replace-me
TRANSFER_TOKEN_SALT=replace-me
JWT_SECRET=replace-me
ENCRYPTION_KEY=replace-me
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi
DATABASE_SCHEMA=public
DATABASE_SSL=false
```

Start the backend:

```sh
pnpm dev
```

The Strapi API runs at `http://localhost:1337`. On first run, create the Strapi admin user in the browser and add/publish any facilities and spaces needed by the frontend.

Install frontend dependencies in a second terminal:

```sh
cd frontend
pnpm install
```

Start the frontend:

```sh
pnpm dev
```

The Vite app runs at `http://localhost:5173` and calls the backend at `http://localhost:1337/api`.

## Data Model

The backend defines three Strapi collection types:

- `Facility` - a named location with an optional address.
- `Space` - a bookable resource, currently `Desk` or `MeetingRoom`, related to a facility.
- `Reservation` - a time-bound booking for one space.

Reservation states:

- `PENDING_LOCK` - the space is temporarily held while checkout/payment completes.
- `CONFIRMED` - the reservation is finalized.
- `RELEASED` - a pending lock expired and the space can be booked again.

## Notes

- CORS is configured for `http://localhost:5173` and `http://127.0.0.1:5173`.
- The frontend currently generates a new idempotency key for each lock request and books a one-hour window starting immediately.
- The custom reservation endpoints are configured with `auth: false` for proof-of-concept use. Add authentication and authorization before using this outside local development.
- PostgreSQL is required for the row-locking behavior used by the reservation transaction.
