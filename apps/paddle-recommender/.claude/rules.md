# Code Style Rules

## TypeScript
- Use explicit types over inference for function signatures
- Prefer `interface` over `type` for object shapes (use `type` for unions/intersections)
- Use `PascalCase` for types, `camelCase` for variables/functions
- Prefer `unknown` over `any` — narrow with type guards or extend the interface. Never use `as any` — it bypasses all type safety. If a type is missing a field, add it to the interface as optional (`?`).
- Use `const` by default, `let` only when reassignment is needed

## Backend (Fastify + Prisma + backend/nodejs/)
- All route handlers must use the `FastifyPluginAsync` pattern
- Request validation goes in Zod schemas in `src/schemas/` or JSON schema on the route — not manual checks in handlers
- Prisma queries go in `prismaService.ts` or `databaseService.ts`, not in route handlers
- All API responses follow `{ success: boolean, data?: T, error?: string }`
- Use `request.log` for logging, not `console.log`
- Use `reply.status(code).send(...)` — not `reply.send(...)` with status
- Service classes are instantiated once and exported as singletons
- Prefer `async/await` over `.then()/.catch()`

## Auth (JWT + bcryptjs)
- Auth routes live in `src/routes/auth.ts`, service in `src/services/authService.ts`, middleware in `src/middleware/auth.ts`
- Passwords are hashed with `bcryptjs` (12 salt rounds) — never stored in plaintext
- JWT tokens use `@fastify/jwt` with 7-day expiry, signed with `JWT_SECRET` env var
- Type augmentations for `@fastify/jwt` go in `src/types/auth.ts`
- Protect routes with `{ preHandler: [authMiddleware] }` from `src/middleware/auth.ts`
- Use `optionalAuthMiddleware` when a route works both authenticated and anonymously
- JWT payload shape: `{ userId: number, username: string }`

## Frontend (Next.js 15 + frontend/)
- Use `'use client'` only when hooks, browser APIs, or event handlers are needed
- Server components are the default — co-locate data fetching in the page/component
- Components go in `src/components/<domain>/` — not flat in `components/`
- Styles use Tailwind utility classes, not CSS modules or styled-components
- Zustand stores go in `src/store/`, Zod schemas in `src/schemas/`
- Use the `@/` path alias for imports (e.g. `import { Button } from "@/components/ui/button"`)
- API calls go in `src/services/fetch.ts` or `src/lib/api.ts`, not inline in components
- Custom hooks go in `src/hooks/`
- Use Shadcn UI components from `src/components/ui/` — avoid building custom UI primitives

## Data Pipeline (scripts/scraper/)
- CSV parsers output to `output/raw/` with a consistent schema
- Harmonization normalizes field names and values before combining
- The median combination is the canonical merged dataset
- Imports use Prisma — raw SQL imports only when performance requires it
- Never commit scraped or downloaded images to git — they are regeneratable artifacts. Add them to `.gitignore` and use `git rm --cached` if already tracked.

## Git & Commits
- Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Keep commits focused — one logical change per commit
- Run lint and type checks before committing
