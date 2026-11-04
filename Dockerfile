# Node-Version wie in ski-kunden-dialog
ARG NODE_VERSION=24.22.1-slim

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Baut ohne Datenbank: "prisma generate" braucht nur das Schema
RUN npm run build

# Nur das fertige Ergebnis von Nitro, ohne Quellcode und node_modules
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
