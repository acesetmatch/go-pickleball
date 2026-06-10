# Developer Reference — Pickleball Paddle Recommender

Quick-reference for working on this codebase. For roadmap, tasks, and feature status see `project.md`.

---

## Project Layout

```
paddle-recommender/
├── backend/nodejs/               # TypeScript + Fastify API (port 3001)
│   ├── src/
│   │   ├── server.ts             # Entry point — registers plugins, routes, error handlers
│   │   ├── routes/               # Fastify route modules
│   │   │   ├── auth.ts           # POST /register, /login  |  GET /me
│   │   │   ├── health.ts         # GET /health, /health/ready
│   │   │   ├── paddles.ts        # CRUD + combined + harmonized sources
│   │   │   └── recommendations.ts # POST recommendations, GET paddle/:id, GET paddles
│   │   ├── services/             # Business logic classes (singletons)
│   │   │   ├── authService.ts    # Register (bcrypt), login (password verify)
│   │   │   ├── prismaService.ts  # All DB queries — paddles, source paddles, users
│   │   │   └── recommendationService.ts  # Paddle scoring engine
│   │   ├── middleware/
│   │   │   ├── auth.ts           # authMiddleware, optionalAuthMiddleware
│   │   │   └── validation.ts     # Request validation
│   │   ├── types/
│   │   │   ├── index.ts          # Core types: UserProfile, Paddle, RecommendationResponse
│   │   │   ├── auth.ts           # Auth types + @fastify/jwt augmentation
│   │   │   └── paddles.ts        # HarmonizedPaddle, CombinedPaddle, pagination types
│   │   ├── utils/                # Cursor encoding, data loaders
│   │   ├── data/                 # Static paddle data
│   │   └── tests/                # Jest test files (**/*.test.ts)
│   ├── prisma/
│   │   ├── schema.prisma         # Source of truth for DB schema
│   │   └── seed.ts               # Seed data
│   ├── migrations/               # Raw SQL migrations (docker-compose auto-runs these)
│   ├── scripts/scraper/          # CSV parsing & harmonization pipeline
│   ├── nginx.conf/               # Nginx config
│   ├── Dockerfile                # Multi-stage Node.js 18 alpine
│   ├── docker-compose.yml        # PostgreSQL 15 (port 5433) + API (port 3001)
│   └── package.json
├── frontend/                     # Next.js 15 (port 3000)
│   ├── src/
│   │   ├── app/                  # App router pages
│   │   │   ├── page.tsx          # Landing (/)
│   │   │   ├── layout.tsx        # Root layout (Geist fonts, Providers)
│   │   │   ├── onboarding/       # 8-step player profile wizard
│   │   │   └── paddles/          # Collection + detail + combined views
│   │   ├── components/
│   │   │   ├── onboarding/       # Wizard steps & shared UI
│   │   │   ├── paddles/          # Card, grid, header, loading/error states
│   │   │   └── ui/               # Shadcn UI primitives (23 components)
│   │   ├── store/onboarding.ts   # Zustand store (profile, steps, validation)
│   │   ├── schemas/profile.ts    # Zod schemas (8 step validators)
│   │   ├── hooks/                # usePaddleCollection, useFetchRecommendations, etc.
│   │   ├── services/fetch.ts     # Axios API client (paddles, sources, combined)
│   │   ├── lib/api.ts            # Python recommender client + Zod validation
│   │   └── data/paddles.json     # Static sample data
│   ├── public/                   # Static assets
│   └── package.json
├── scripts/dev.sh                # Concurrent backend + frontend dev start
├── workflows/                    # GitHub Actions (CI, deploy, preview)
├── Makefile                      # RAG stack orchestration
├── .editorconfig                 # Universal editor settings
├── .prettierrc                   # Formatting
├── .husky/pre-commit             # lint-staged on commit
├── .claude/rules.md              # Coding conventions for AI agents
└── .gitignore
```

---

## Backend Patterns

### Routes (FastifyPluginAsync)

```typescript
// Every route file follows this pattern:
const myRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: ResponseType }>("/path", async (request, reply) => {
    reply.send({ success: true, data: { ... } });
  });
};
export { myRoutes };

// Registered in server.ts:
await fastify.register(myRoutes, { prefix: "/api/v1/..." });
```

### API Response Shape

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: "message" }
```

### Prisma Queries

All DB access goes through `PrismaService` (never raw queries in route handlers):

```typescript
const prisma = new PrismaService();
const paddles = await prisma.getPaddles();
const user = await prisma.findUserByUsername(name);
```

### Auth

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT via `@fastify/jwt` v8 (signed with `JWT_SECRET`, 7-day expiry)
- Protect routes: `{ preHandler: [authMiddleware] }`
- Optional auth: `{ preHandler: [optionalAuthMiddleware] }`
- Types in `src/types/auth.ts`

### API Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` | No | Service health |
| `GET` | `/api/v1/health/ready` | No | DB + memory/CPU check |
| `POST` | `/api/v1/auth/register` | No | Create account → JWT |
| `POST` | `/api/v1/auth/login` | No | Login → JWT |
| `GET` | `/api/v1/auth/me` | Yes | Current user profile |
| `POST` | `/api/v1/recommendations` | No | Get paddle recommendations |
| `GET` | `/api/v1/recommendations/paddle/:id` | No | Paddle details |
| `GET` | `/api/v1/recommendations/paddles` | No | All paddles |
| `GET` | `/api/paddles` | No | All paddles (basic) |
| `POST` | `/api/paddles` | No | Upload harmonized data |
| `GET` | `/api/paddles/:id` | No | Paddle by ID (full) |
| `GET` | `/api/paddles/combined` | No | Combined source data (cursor-paginated) |
| `GET` | `/api/paddles/sources/all` | No | All 3 source datasets |
| `GET` | `/api/paddles/sources/:source` | No | Single source data |

---

## Prisma Schema

4 models: `Paddle`, `PaddleSpec`, `PaddlePerformance`, `SourcePaddle`, `User`

```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@map("users")
}
```

Full schema at `backend/nodejs/prisma/schema.prisma`. After changes, run:

```bash
cd backend/nodejs
npx prisma migrate dev --name description
npx prisma generate
```

---

## Frontend Patterns

### Component Organization

```
src/components/<domain>/   →   PaddleCollectionGrid, Wizard, QuickStartProfiles
src/components/ui/         →   Shadcn primitives (Button, Card, Dialog, etc.)
```

### State (Zustand)

One store: `src/store/onboarding.ts` — manages the 8-step wizard profile. Setters (`setPlayContext`, `setStyle`, ...), validators (`validateCurrentStep`, `isStepComplete`), and smart branching helpers.

### Validation (Zod)

`src/schemas/profile.ts` — step schemas: `PlayContextSchema`, `StyleSchema`, `PhysicalSchema`, etc.

### API Calls

Two API clients:
- `src/services/fetch.ts` — Axios, connects to Fastify backend (`NEXT_PUBLIC_API_BASE_URL`)
- `src/lib/api.ts` — Fetch, connects to Python recommender (`NEXT_PUBLIC_RECOMMENDER_URL`)

---

## Data Pipeline

```
CSV files (~/Downloads/) → parse → output/raw/ → harmonize → output/harmonized/
    → combine (median) → output/harmonized/combined_median.json → import → PostgreSQL
```

### Key Scripts

```bash
npm run scrape:mattspickleball:csv     # Parse Matt's CSV
npm run scrape:pickleballeffect:csv    # Parse Pickleball Effect CSV
npm run scrape:pickleballstudio:csv    # Parse Pickleball Studio CSV
npm run harmonize                      # Normalize all sources
npm run combine:median                 # Median aggregation
npm run import:harmonized              # Insert into source_paddles table
npm run scrape:all                     # Run full pipeline
```

---

## Development Setup

```bash
# Backend
cd backend/nodejs
npm install
cp .env.example .env     # Set DATABASE_URL, JWT_SECRET
npx prisma migrate dev
npm run dev               # Fastify on :3001

# Frontend
cd frontend
npm install
npm run dev               # Next.js on :3000

# Or both at once:
./scripts/dev.sh
```

### Prisma Commands

```bash
npx prisma migrate dev --name desc   # Create + apply migration
npx prisma generate                  # Regenerate client after schema change
npx prisma db push                   # Push schema without migration
npx prisma studio                    # Browser GUI at :5555
npx prisma db seed                   # Run seed
```

---

## Environment Variables

### Backend (`backend/nodejs/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/paddle_recommender_db
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=dev-secret-change-in-production
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_PYTHON_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_RECOMMENDER_URL=http://localhost:8000
```

---

## Database

### Manual Access

```bash
# Connect
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d paddle_recommender_db

# Show tables
\dt

# Describe a table
\d users

# Run a migration file
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d paddle_recommender_db -f migrations/003_add_users.sql
```

### Docker

```bash
docker compose up -d              # Start PostgreSQL + API
docker compose up -d postgres     # Start only DB
docker compose down               # Stop everything
```

---

## Testing

```bash
# Backend (Jest, uses real DB — make sure PostgreSQL is running)
cd backend/nodejs
npx jest                              # All tests
npx jest src/tests/auth.test.ts       # Single file
npm test                              # Same

# Frontend (Vitest)
cd frontend
npx vitest
```

Tests use `app.inject()` (in-process HTTP, no listener port needed). Auth tests register real users and clean up via `afterAll`.

---

## Common Issues

| Symptom | Fix |
|---|---|
| Prisma `P1001: can't reach database` | `docker compose up -d postgres` |
| `@fastify/jwt` version mismatch | Must be v8.x with Fastify 4.x |
| CSV not found | CSV files must be in `~/Downloads/` with specific filenames |
| Combined endpoint stale data | Add `?refresh=1` to bypass cache |
| Auth test failures (409 on fresh user) | Previous test run left users in DB — cleanup runs automatically, or run `npx prisma db push --force-reset` |
| `Cannot read properties of undefined (reading 'token')` | DB not accessible during test — check `DATABASE_URL` and ensure PostgreSQL is running |
