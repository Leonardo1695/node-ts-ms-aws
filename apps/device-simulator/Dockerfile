FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
COPY apps/device-simulator ./apps/device-simulator
COPY libs ./libs
COPY infra/docker/link-verdiron-libs.sh ./infra/docker/link-verdiron-libs.sh

RUN npm install --no-audit --no-fund
RUN npx nx run device-simulator:build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund --omit=dev

COPY --from=build /workspace/dist/apps/device-simulator ./simulator
COPY --from=build /workspace/dist/libs ./dist-libs
COPY --from=build /workspace/infra/docker/link-verdiron-libs.sh ./link-verdiron-libs.sh

RUN chmod +x ./link-verdiron-libs.sh \
  && ./link-verdiron-libs.sh ./dist-libs ./node_modules

WORKDIR /app/simulator

EXPOSE 3010

ENV SIMULATOR_PORT=3010
ENV INGESTION_BASE_URL=http://ingestion-service:3001
ENV RABBITMQ_URL=amqp://verdiron:verdiron@rabbitmq:5672
ENV API_KEY=dev-api-key-change-me

CMD ["node", "src/main.js"]
