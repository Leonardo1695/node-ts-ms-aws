FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src

# Defaults match docker-compose service hostnames (override via env at runtime).
ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_USER=verdiron
ENV POSTGRES_PASSWORD=verdiron
ENV POSTGRES_DB=verdiron
ENV AWS_REGION=us-east-1
ENV AWS_ENDPOINT_URL=http://localstack:4566
ENV AWS_ACCESS_KEY_ID=test
ENV AWS_SECRET_ACCESS_KEY=test
ENV S3_BUCKET_NAME=verdiron-raw
ENV RABBITMQ_URL=amqp://verdiron:verdiron@rabbitmq:5672

CMD ["python", "-m", "verdiron_etl", "worker"]
