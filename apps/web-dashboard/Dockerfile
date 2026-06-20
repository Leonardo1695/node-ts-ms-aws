# syntax=docker/dockerfile:1
# Build: docker build -f apps/web-dashboard/Dockerfile .

FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
COPY apps/web-dashboard ./apps/web-dashboard
COPY libs/domain ./libs/domain

ARG VITE_API_BASE_URL=http://localhost:3003
ARG VITE_API_KEY=dev-api-key-change-me

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_KEY=${VITE_API_KEY}

RUN npm install --no-audit --no-fund
RUN npx nx run web-dashboard:build

FROM nginx:1.27-alpine AS runtime

COPY infra/docker/nginx-web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/web-dashboard /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
