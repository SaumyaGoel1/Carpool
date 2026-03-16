# syntax=docker/dockerfile:1
# React frontend: dev (hot reload) and prod (multi-stage static build).
# API URL: set VITE_API_URL (dev: env at run; prod: build-arg at build).

# -----------------------------------------------------------------------------
# Development: run Vite dev server with hot reload
# -----------------------------------------------------------------------------
FROM node:22-alpine AS development

WORKDIR /app

# Install deps (will be overridden by volume in compose)
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Vite dev server with host 0.0.0.0 and polling for Docker
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Production: multi-stage build → static assets served by nginx
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Build-time API URL (used by Vite to replace import.meta.env.VITE_API_URL)
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY . .
RUN npm run build

# -----------------------------------------------------------------------------
# Production: serve static assets with nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback so client-side routes work on refresh
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime API URL: inject into index.html via envsubst or default config
# For static SPAs, VITE_* is baked at build time. To override at runtime,
# you can mount a config script or use a small entrypoint that patches window.__ENV__.
ENV VITE_API_URL=""
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
