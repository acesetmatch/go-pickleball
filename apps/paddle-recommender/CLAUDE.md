# OpenWolf

@.wolf/OPENWOLF.md
@RTK.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# Paddle Recommender

Monorepo with Next.js 15 frontend, Fastify/Prisma backend, and Python RAG service.

## Commands

```sh
# Run both frontend and backend simultaneously
bash scripts/dev.sh

# Frontend (apps/paddle-recommender/frontend/)
npm run dev          # Next.js dev server on :3000
npm run build        # Production build
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npm run lint         # next lint

# Backend (apps/paddle-recommender/backend/nodejs/)
npm run dev          # tsx watch on :3001
npm run build        # tsc
npm run test         # Jest
npm run type-check   # tsc --noEmit
npm run lint         # eslint
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:seed      # prisma/seed.ts

# Docker
docker compose up --build -d   # Start postgres + backend
```

## Architecture

```
apps/paddle-recommender/
  frontend/          # Next.js 15 + Tailwind + shadcn/ui
    src/
      app/           # App router pages
      components/    # React components grouped by domain
      hooks/         # Custom hooks
      store/         # Zustand stores
      services/      # API client (axios)
      schemas/       # Zod schemas
  backend/
    nodejs/          # Fastify + Prisma + PostgreSQL
      src/
        routes/      # Fastify route plugins
        services/    # Business logic + Prisma queries
        middleware/   # Auth middleware
        types/       # TypeScript types
        utils/       # Helpers
        tests/       # Jest tests
      prisma/        # Schema + migrations
```

## Data Flow

- Frontend calls backend via axios to `NEXT_PUBLIC_API_BASE_URL` (`localhost:3001`)
- Python RAG service at `localhost:8000/api/recommendations` (separate service)
- Backend uses Prisma to query PostgreSQL on port 5433
- E2e tests mock API responses via Playwright route interception

## Conventions

### TypeScript
- Explicit types for function signatures
- `interface` for object shapes, `type` for unions/intersections
- `PascalCase` types, `camelCase` variables/functions
- `unknown` over `any` — never `as any`
- `const` by default

### Backend
- Routes use `FastifyPluginAsync` pattern
- Validation in Zod schemas, not manual checks
- Prisma queries in service classes, not route handlers
- Responses: `{ success, data?, error? }`
- `request.log` for logging, `reply.status(code).send(...)`

### Frontend
- `'use client'` only when hooks/browser APIs needed
- Components in `src/components/<domain>/`
- Tailwind utility classes only
- API calls in `src/services/fetch.ts`, not inline
- shadcn/ui components from `src/components/ui/`

### Auth
- JWT via `@fastify/jwt`, 7-day expiry
- bcryptjs with 12 salt rounds
- Protect routes with `preHandler: [authMiddleware]`

### Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Run lint + type-check before committing

## Orchestration Rules

You are the Lead Architect. Default posture: design, plan, review. Delegate **net-new feature implementation** to OpenCode; handle **debugging, small edits, and review-driven fixes** yourself.

### Delegate to OpenCode when:
- Creating a **new file** from scratch
- Implementing a **new feature** that spans one or more files
- Scaffolding boilerplate (new route, new component, new service class)

Command:
`opencode run -f [target_file] "Write the implementation. Requirements: [highly specific instructions]"`

Wait for it to finish, verify the file, then continue.

### Handle directly (do NOT delegate) when:
- **Debugging** — diagnosing errors, tracing root cause, applying the fix
- **Small edits** — typos, renames, one-to-few-line changes, import fixes, config tweaks
- **Review-driven fixes** — applying findings from `/code-review --fix`, `/simplify`, or `/security-review`
- **Bug fixes logged to `.wolf/buglog.json`** — the OpenWolf bug protocol assumes the fixer is also the logger
- **Mechanical refactors** — rename-across-files, extract-function, lint autofixes
- **Test-only changes** — adding/updating a single test case for an existing suite

### When in doubt
If the work is "fix this" → do it. If the work is "build this" → delegate it.
