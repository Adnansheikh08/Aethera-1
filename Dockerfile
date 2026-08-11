# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Aethera — Express API + React SPA
#
# The SPA is built here rather than at deploy time so the image is the single
# artefact: `client/dist` is copied into the runtime layer and served by nginx
# from a shared volume (see docker-compose.prod.yml). Two independent builder
# stages mean a change to client/ doesn't invalidate the server's npm layer.
# ---------------------------------------------------------------------------

# ---- Stage 1: server dependencies -----------------------------------------
FROM node:22-alpine AS server-deps
WORKDIR /app/server

# npm ci needs the lockfile and refuses to run without one — copying only the
# manifests keeps this layer cached until a dependency actually changes.
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: client build -------------------------------------------------
FROM node:22-alpine AS client-build
WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
# devDependencies are required here: vite and @vitejs/plugin-react are what
# perform the build, so --omit=dev would leave nothing to run.
RUN npm ci

COPY client/ ./
RUN npm run build

# ---- Stage 3: runtime ------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Matches the uid/gid the Django image used, so any bind-mounted volume left
# over from the old stack keeps working without a recursive chown.
RUN addgroup -g 10001 -S appgroup \
    && adduser -u 10001 -S appuser -G appgroup

COPY --chown=appuser:appgroup server/ ./server/
# After the source copy, not before: .dockerignore keeps the host's
# node_modules out of the build context, and this ordering means the installed
# tree still wins even if that exclusion is ever removed.
COPY --from=server-deps --chown=appuser:appgroup /app/server/node_modules ./server/node_modules
COPY --from=client-build --chown=appuser:appgroup /app/client/dist ./client/dist

USER appuser

EXPOSE 5000

# Same contract the Django health_check served: 200 when every dependency is
# reachable, 503 otherwise. Compose and orchestrators both read this.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:5000/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/src/index.js"]
