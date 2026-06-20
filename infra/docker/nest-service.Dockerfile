# syntax=docker/dockerfile:1

ARG NX_PROJECT
ARG SERVICE_PORT=3000

FROM node:22-alpine AS build

ARG NX_PROJECT

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
COPY apps ./apps
COPY libs ./libs
COPY infra/docker/link-verdiron-libs.sh ./infra/docker/link-verdiron-libs.sh

RUN npm install --no-audit --no-fund
RUN npx nx run "${NX_PROJECT}:build"

FROM node:22-alpine AS runtime

ARG NX_PROJECT
ARG SERVICE_PORT

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund --omit=dev

COPY --from=build /workspace/dist/apps/${NX_PROJECT} ./service
COPY --from=build /workspace/dist/libs ./dist-libs
COPY --from=build /workspace/infra/docker/link-verdiron-libs.sh ./link-verdiron-libs.sh

RUN chmod +x ./link-verdiron-libs.sh \
  && ./link-verdiron-libs.sh ./dist-libs ./node_modules

WORKDIR /app/service

EXPOSE ${SERVICE_PORT}

CMD ["node", "src/main.js"]
