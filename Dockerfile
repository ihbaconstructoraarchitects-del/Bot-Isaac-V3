# Stage 1: Build
FROM node:21-alpine3.18 AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

COPY . .

RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && apk add --no-cache git \
    && pnpm install && pnpm run build \
    && apk del .gyp

# Stage 2: Deploy
FROM node:21-alpine3.18 AS deploy

WORKDIR /app

ENV NODE_ENV=production
EXPOSE 8080

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/assets ./assets


# Crear usuario nodeuser y darle permisos a /app y logs
# Crear usuario nodeuser y darle permisos a /app y logs
RUN addgroup nodegroup \
    && adduser -D -G nodegroup nodeuser \
    && mkdir -p /app/logs \
    && chown -R nodeuser:nodegroup /app


# Activar pnpm e instalar solo dependencias de producción
RUN corepack enable \
    && corepack prepare pnpm@latest --activate \
    && pnpm install --prod

USER nodeuser

CMD ["node", "dist/app.js"]
