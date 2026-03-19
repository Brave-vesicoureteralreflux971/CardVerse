FROM node:20-alpine AS api-builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY scripts ./scripts
RUN npm ci

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:20-alpine AS admin-builder
WORKDIR /app/admin

COPY admin-web/package*.json ./
RUN npm ci

COPY admin-web/. ./
RUN npm run build

FROM node:20-alpine AS storefront-builder
WORKDIR /app/storefront

COPY storefront-web/package*.json ./
RUN npm ci

COPY storefront-web/. ./
RUN npm run build

FROM caddy:2.9-alpine AS runner
WORKDIR /app

ENV PORT=3000

RUN apk add --no-cache nodejs npm wget

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY scripts ./scripts
RUN npm ci --include=dev && npx prisma generate

ENV NODE_ENV=production

COPY --from=api-builder /app/dist ./dist
COPY --from=api-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=api-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=admin-builder /app/admin/dist /srv/admin
COPY --from=storefront-builder /app/storefront/dist /srv/storefront
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/start-app.sh /usr/local/bin/start-app.sh

RUN mkdir -p /app/uploads \
  && chmod +x /usr/local/bin/start-app.sh

EXPOSE 80

CMD ["/usr/local/bin/start-app.sh"]
