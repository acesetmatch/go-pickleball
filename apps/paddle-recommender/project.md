# Pickleball Paddle Recommender

## Overview
A full-stack pickleball paddle recommendation and database platform. Features a TypeScript/Fastify backend API with PostgreSQL, a comprehensive data pipeline sourcing paddles from Matt's Pickleball, Pickleball Effect, and Pickleball Studio, and a Next.js frontend with an 8-step player onboarding wizard for personalized recommendations.

## Current Status ✅

### Completed Features
- **Database**: PostgreSQL with Prisma ORM — `paddles`, `paddle_specs`, `paddle_performance`, and `source_paddles` tables
- **Backend API**: TypeScript + Fastify server with CORS, Helmet security, structured logging, and comprehensive REST endpoints
- **Frontend**: Next.js 15 app with Turbopack, React 19, Tailwind CSS v4, and Shadcn UI component library
- **Onboarding Wizard**: 8-step player profile flow — skill level, play style, physical factors, paddle feel/customization, current setup/pain points, environment/opponents, budget/brands, and aspirations
- **Data Pipeline**: CSV-based scraping pipeline for Matt's Pickleball, Pickleball Effect, and Pickleball Studio with harmonization and median combination
- **Recommendations**: Dual recommendation engine — TypeScript-based scoring (Fastify) and Python RAG endpoint
- **Docker Setup**: Containerized Node.js API and PostgreSQL

### Technical Architecture
```
Frontend (Next.js 15 → Vercel) → Backend API (Fastify :3001) → PostgreSQL Database
                                    ↕
Python Recommendation API (:8000)   CSV Data Pipeline (3 sources)
                                    ↕
Matt's Pickleball | Pickleball Effect | Pickleball Studio
```

## Backend — TypeScript + Fastify (`backend/nodejs/`)

### Tech Stack
- **Runtime**: Node.js 18, TypeScript 5.3
- **Framework**: Fastify 4 (with `@fastify/cors`, `@fastify/helmet`, `@fastify/env`)
- **ORM**: Prisma 6 with PostgreSQL
- **Logging**: Pino with pino-pretty (dev)
- **Testing**: Jest + ts-jest

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/v1/health` | GET | Health check |
| `/api/v1/recommendations` | POST | Get paddle recommendations |
| `/api/v1/recommendations/paddle/:id` | GET | Paddle details |
| `/api/v1/recommendations/paddles` | GET | List all paddles |
| `/api/paddles` | GET | All paddles (basic) |
| `/api/paddles` | POST | Upload harmonized paddle data |
| `/api/paddles/:id` | GET | Paddle by ID (full details) |
| `/api/paddles/combined` | GET | Combined median data (cursor paginated) |
| `/api/paddles/sources/all` | GET | All 3 source harmonized datasets |
| `/api/paddles/sources/:source` | GET | Single source data |

### Database Schema (Prisma)
- **`paddles`** — Core paddle info (brand, model, price, image, buy URL)
- **`paddle_specs`** — Physical specs (shape, surface, weight, core, length, width, grip)
- **`paddle_performance`** — Performance metrics (power, pop, spin, twist/swing weight, balance point)
- **`source_paddles`** — Raw harmonized data from scraped sources (50+ fields)

### Data Sourcing & Pipeline
Three CSV sources are parsed and harmonized:
1. **Matt's Pickleball** — `parseMattspickleballCSV.ts`
2. **Pickleball Effect** — `parsePickleballEffectCSV.ts` (downloads CSV via API)
3. **Pickleball Studio** — `parsePickleballStudioCSV.ts`, `parsePickleballStudioNotion.ts`

Pipeline: CSV parsing → Harmonization (`harmonizeData.ts`) → Median combination (`combineSourcesMedian.ts`) → Import to DB (`importHarmonizedData.ts`)

## Frontend — Next.js 15 (`frontend/`)

### Tech Stack
- **Framework**: Next.js 15 (Turbopack), React 19
- **Styling**: Tailwind CSS v4
- **UI Library**: Shadcn UI (Radix primitives: Dialog, Popover, Select, Slider, Toggle, Tooltip, etc.)
- **State**: Zustand 5 (devtools middleware)
- **Validation**: Zod schemas
- **Charts**: Recharts
- **Data Fetching**: Axios + TanStack React Query
- **Virtualization**: react-window for large lists

### Pages
| Route | Description |
|---|---|
| `/` | Landing page with CTA to find paddle or browse |
| `/onboarding` | 8-step player profile wizard |
| `/paddles` | Paddle collection with brand filter & search |
| `/paddles/[id]` | Individual paddle detail |
| `/paddles/combined` | Combined source paddle view |

### Onboarding Steps
1. **Skill Level & Context** — Rating, singles/doubles, competitive level (rec/league/tournament)
2. **Play Style & Tendencies** — Aggressive, all-court, reset-first, etc. + priority (power/control/spin/balanced)
3. **Physical Factors** — Arm sensitivity, grip size, handle preference, height, wingspan, weight tolerance
4. **Paddle Feel & Customization** — Feel preference (power/control/balanced), customization interest
5. **Current Setup & Pain Points** — Current paddle, pain points (resets, pop-ups, spin, vibration, etc.)
6. **Environment & Opponents** — Indoor/outdoor split, common opponent types
7. **Budget & Brand Preferences** — Price range, preferred/avoided brands
8. **Aspirations / Goals** — Primary goal (power/control/consistency/spin/comfort), target rating

### Smart Branching
- **Wind questions**: Shown only if outdoor play > 20%
- **Arm sensitivity details**: Shown only if arm sensitivity indicated
- **Customization questions**: Shown for intermediate+ players
- **Advanced metrics**: Shown for advanced/expert players
- **Competitive questions**: Shown if tournament level is set

### Data Flow
1. User completes onboarding profile (Zustand store) → serialized to API format
2. Sent to Fastify `/api/v1/recommendations` or Python `/api/recommendations`
3. Backend scores paddles by experience, play style, budget, and preferences
4. Recommendations returned with match scores and reasons

## Data Pipeline Improvements

### CSV Scraping Pipeline
- Three sources parsed from downloaded CSVs
- Harmonization normalizes fields across sources
- Median combination creates unified paddle dataset
- Optional import to PostgreSQL via Prisma

### Scraper Scripts (`backend/nodejs/scripts/scraper/`)
- `downloadPickleballEffectCsv.ts` — Downloads Pickleball Effect CSV via API
- `parsePickleballStudioCSV.ts` / `parsePickleballStudioNotion.ts`
- `combineSourcesMedian.ts` — Combines sources using median values
- `harmonizeData.ts` — Normalizes field names and values
- `scrapeAll.sh` — Orchestrates full pipeline

## DevOps

### Docker
- **Backend**: Multi-stage Node.js 18 Dockerfile with non-root user, health check
- **docker-compose.yml**: PostgreSQL 15 + API service on `paddle-network`
- **docker-compose.dev.yml**: Dev overrides with volume mounts and debug port

### CI/CD
- `workflows/ci.yml` — Tests (PostgreSQL service, Go unit tests, RAG integration) and build
- `workflows/deploy-frontend.yml` — Production deploy to Vercel on push to main/master
- `workflows/preview-frontend.yml` — Preview deploy to Vercel for PRs

### Local Development
```bash
# Start both backend and frontend
scripts/dev.sh

# Or individually:
cd backend/nodejs && npm run dev    # Fastify on :3001
cd frontend && npm run dev          # Next.js on :3000
```

## Current Tasks & Roadmap 🚀

### High Priority
- [ ] **Recommendation Engine Enhancement**
  - Integrate deep onboarding profile data into recommendation scoring
  - Implement ML-based paddle matching using RAG (Go + pgvector)
  - Add feedback loop for recommendation quality

- [ ] **RAG Stack Implementation** (Go + pgvector + Python embedding service)
  - Database migrations for vector embeddings
  - Python embedding service on port 8008
  - Backfill existing paddles with embeddings
  - RAG retrieval for semantic paddle search

### Medium Priority
- [ ] **Performance Optimization**
  - Database indexing for faster queries
  - API response caching
  - Image optimization and lazy loading
  
- [ ] **User Features**
  - Paddle favorites/wishlist
  - Advanced filtering (price range, specs, performance)
  - User reviews and ratings

- [ ] **Data Quality**
  - Validate and clean existing paddle data
  - Implement duplicate detection
  - Add data source attribution

### Low Priority
- [ ] **Analytics & Monitoring**
  - API usage tracking
  - Performance monitoring
  - Error logging and alerting
  
- [ ] **Additional Data Sources**
  - Integrate other paddle retailer APIs
  - Add professional player endorsement data

## Technical Debt & Improvements

### Backend
- [ ] Add comprehensive API documentation (OpenAPI/Swagger)
- [ ] Implement proper error handling and logging middleware
- [ ] Add API rate limiting
- [ ] Refactor legacy Go references in CI and Makefile
- [ ] Prisma migration system for schema changes
- [ ] Unit and integration tests for services and routes

### Frontend
- [ ] Add TypeScript strict mode
- [ ] Implement proper error boundaries
- [ ] Add loading states and skeleton screens
- [ ] Accessibility improvements (WCAG compliance)
- [ ] SEO optimization
- [ ] Implement results page after onboarding

### DevOps
- [ ] CI/CD for backend deployment
- [ ] Production Docker configuration
- [ ] Database backup strategy
- [ ] Environment-specific configurations

## LLM-Powered Scraping Agent (Planned)

### (`project_planning.md`)
- LLM-powered web scraping agent using OpenAI/Ollama for autonomous navigation
- Adaptive data extraction, multi-site agent framework
- Human-in-the-loop intervention system

## Key URLs

| Environment | Service | URL |
|---|---|---|
| **Deployed** | Frontend (Vercel) | https://pickleball-db.vercel.app |
| **Local** | Frontend | http://localhost:3000 |
| **Local** | Backend API | http://localhost:3001/api/v1/health |
| **Local** | Paddles API | http://localhost:3001/api/paddles |
| **Local** | Combined Data | http://localhost:3001/api/paddles/combined |
| **Local** | PostgreSQL | localhost:5433 (postgres/postgres) |
| **Local** | Python Recommender | http://localhost:8000 |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Python 3.9+ (for recommendation API)

### Setup
```bash
# Backend
cd backend/nodejs
npm install
cp .env.example .env  # Configure DATABASE_URL
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Data Import Pipeline
```bash
cd backend/nodejs
# Run all scrapers sequentially
bash scripts/scraper/scrapeAll.sh

# Or individually:
npm run scrape:mattspickleball:csv
npm run scrape:pickleballeffect:csv
npm run scrape:pickleballstudio:csv
npm run harmonize
npm run combine:median
npm run import:harmonized
```

## Contributing
1. Pick a task from the roadmap
2. Create feature branch
3. Implement with tests
4. Submit PR with documentation updates

---
*Last updated: 2026-06-04*
