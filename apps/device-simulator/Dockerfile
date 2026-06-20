FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
COPY apps/device-simulator ./apps/device-simulator
COPY libs/domain ./libs/domain

RUN npm ci
RUN npx nx run device-simulator:build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /workspace/dist/apps/device-simulator ./simulator
COPY --from=build /workspace/dist/libs/domain ./domain-package
COPY --from=build /workspace/node_modules/tslib ./node_modules/tslib

RUN mkdir -p node_modules/@verdiron/domain \
  && cp -r domain-package/. node_modules/@verdiron/domain/

WORKDIR /app/simulator

EXPOSE 3010

ENV SIMULATOR_PORT=3010
ENV INGESTION_BASE_URL=http://ingestion-service:3001
ENV RABBITMQ_URL=amqp://verdiron:verdiron@rabbitmq:5672
ENV API_KEY=dev-api-key-change-me

CMD ["node", "src/main.js"]
