# =============================================================================
# STAGE 1 — Builder
# Full-featured image with dev dependencies for compiling TypeScript and
# generating the Prisma client.
# =============================================================================
FROM node:22-alpine AS builder

# Set working directory for all subsequent commands
WORKDIR /app

# ---------------------------------------------------------------------------
# Layer 1: Dependency manifests
# COPY package*.json first, BEFORE source code, so Docker layer caching
# prevents reinstalling dependencies every time application code changes.
# ---------------------------------------------------------------------------
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for tsc, jest, etc.)
# npm ci is preferred over npm install because:
#   - It uses package-lock.json for deterministic, reproducible builds
#   - It fails if the lock file is out of sync with package.json
#   - It does not modify the lock file
RUN npm ci

# ---------------------------------------------------------------------------
# Layer 2: Prisma schema
# Must be copied before prisma generate, and BEFORE source code, so that
# schema changes don't invalidate the dependency layer above.
# ---------------------------------------------------------------------------
COPY prisma/ ./prisma/

# Generate the Prisma client (creates node_modules/.prisma/client).
# This MUST run in the builder stage so the generated types exist when tsc
# compiles the application code that imports @prisma/client.
RUN npx prisma generate

# ---------------------------------------------------------------------------
# Layer 3: Build configuration and source
# tsconfig.json and src/ are copied last because they change most frequently.
# ---------------------------------------------------------------------------
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → JavaScript (outputs to ./dist per tsconfig.json)
RUN npm run build

# =============================================================================
# STAGE 2 — Production Runtime
# Minimal image containing only what is needed to run the compiled
# application: production node_modules, Prisma client, and the dist/ output.
# =============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# ---------------------------------------------------------------------------
# Base image hardening
# Upgrade Alpine system packages to pick up the latest security patches
# (e.g. OpenSSL CVEs in libcrypto3/libssl3 that ship with node:22-alpine),
# and upgrade the bundled npm to a version whose internal deps (picomatch
# et al.) have no outstanding HIGH/CRITICAL CVEs.
# ---------------------------------------------------------------------------
RUN apk upgrade --no-cache && \
    npm install -g npm@latest && \
    rm -rf /var/cache/apk/*

# ---------------------------------------------------------------------------
# Security: use the built-in unprivileged 'node' user
# The official node:22-alpine image ships with a 'node' user (uid 1000).
# Running the application as non-root limits damage from container
# compromise — a standard principle of least privilege.
# We switch to this user AFTER all files are copied and permissions are set.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Layer 1: Production dependencies and Prisma client
# Copy manifest first (caching optimization), then install only production
# packages. The 'prisma' CLI is listed under dependencies in package.json
# (NOT devDependencies), so it is retained with --omit=dev and can still
# generate the client.
# ---------------------------------------------------------------------------
COPY package*.json ./
COPY prisma/ ./prisma/

# Install production dependencies only. Then explicitly generate the Prisma
# client so the runtime has access to the typed query engine.
# Finally, purge the npm cache to keep the layer as small as possible.
# Notes on flags:
#   --omit=dev  — skip devDependencies (typescript, tsx, jest, etc.)
#   --no-audit  — skip security audit (already handled in CI pipeline)
#   --no-fund   — suppress funding messages (noisy and unnecessary in CI)
RUN npm ci --omit=dev --no-audit --no-fund && \
    npx prisma generate && \
    npm cache clean --force

# ---------------------------------------------------------------------------
# Layer 2: Compiled application
# Copy only the build artifact from the builder stage — NOT the TypeScript
# source, NOT devDependencies, and NOT the node_modules from builder
# (which includes dev packages and the Prisma generate intermediate files).
# ---------------------------------------------------------------------------
COPY --from=builder /app/dist ./dist

# ---------------------------------------------------------------------------
# Layer 3: Seed data and seed script
# Harmonized JSON output from the ETL pipeline and its runner script.
# These are copied in the runtime stage only (not needed for build).
# ---------------------------------------------------------------------------
COPY output/harmonized/ ./output/harmonized/
COPY seed-source-paddles.cjs ./

# ---------------------------------------------------------------------------
# Final security & runtime configuration
# ---------------------------------------------------------------------------

# Ensure the entire /app directory is owned by the unprivileged node user
# so the application can write to logs or temp files if needed.
RUN chown -R node:node /app

# Switch to the unprivileged node user
USER node

# Document the port the application binds to (cosmetic/metadata — actual
# mapping is done in docker-compose.yml or at runtime with -p).
EXPOSE 3001

# ---------------------------------------------------------------------------
# Health check
# Docker will poll this endpoint to determine container liveness.
# Uses Node's built-in http module so no extra binaries (curl, wget) are
# needed in the image — keeping the attack surface minimal.
# ---------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# ---------------------------------------------------------------------------
# Start the application
# Using "node dist/server.js" directly instead of "npm start" avoids the
# extra npm shell process — making signals (SIGTERM/SIGINT) propagate
# reliably to the Node process for graceful shutdown.
# ---------------------------------------------------------------------------
CMD ["node", "dist/server.js"]
