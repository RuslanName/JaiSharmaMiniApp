FROM node:20-alpine AS builder
WORKDIR /app

COPY server/package*.json ./
RUN npm ci

COPY server/ .
RUN npm run build

FROM node:20-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      libnss3 \
      libatk-bridge2.0-0 \
      libxkbcommon0 \
      libgbm1 \
      libasound2 \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000
CMD ["node", "dist/main.js"]