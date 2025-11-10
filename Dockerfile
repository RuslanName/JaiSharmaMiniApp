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
      bash \
      chromium \
      chromium-sandbox \
      fonts-liberation \
      libnss3 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libatspi2.0-0 \
      libcups2 \
      libdrm2 \
      libdbus-1-3 \
      libxkbcommon0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxrandr2 \
      libgbm1 \
      libasound2 \
      libpango-1.0-0 \
      libcairo2 \
      libgtk-3-0 \
      libgdk-pixbuf2.0-0 \
      libxss1 \
      ca-certificates \
      xvfb \
      x11vnc \
      fluxbox \
      xfonts-base \
      xfonts-75dpi \
      xfonts-100dpi \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    DISPLAY=:99 \
    PUPPETEER_HEADLESS=false

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/data ./data

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]