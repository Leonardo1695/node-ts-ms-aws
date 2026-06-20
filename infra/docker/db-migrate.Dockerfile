# syntax=docker/dockerfile:1
# Build: docker build -f infra/docker/db-migrate.Dockerfile .

FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
COPY libs ./libs
COPY infra/docker/link-verdiron-libs.sh ./infra/docker/link-verdiron-libs.sh

RUN npm install --no-audit --no-fund
RUN npx nx run persistence:build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund --omit=dev

COPY --from=build /workspace/dist/libs ./dist-libs
COPY --from=build /workspace/infra/docker/link-verdiron-libs.sh ./link-verdiron-libs.sh
COPY tools/run-migrations.cjs ./run-migrations.cjs

RUN chmod +x ./link-verdiron-libs.sh \
  && ./link-verdiron-libs.sh ./dist-libs ./node_modules

CMD ["node", "run-migrations.cjs"]
