FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=development \
    PATH=/app/node_modules/.bin:$PATH

COPY package.json package-lock.json* pnpm-lock.yaml* bun.lockb* .npmrc* ./ 2>/dev/null || true
RUN npm install

COPY . .

# =========================
# Development (hot reload)
# =========================
FROM base AS development

ENV NODE_ENV=development \
    VITE_API_URL=${VITE_API_URL:-http://localhost:3000}

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# =========================
# Production build
# =========================
FROM base AS build

ENV NODE_ENV=production

RUN npm run build

# =========================
# Production runtime (static)
# =========================
FROM nginx:1.27-alpine AS production

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist ./

# Pass API URL to the client at build time via Vite; at runtime we just serve static files.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

