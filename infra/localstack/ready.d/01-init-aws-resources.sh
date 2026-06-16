#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
KINESIS_STREAM_NAME="${KINESIS_STREAM_NAME:-telemetry}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-verdiron-raw}"
DYNAMODB_TABLE_NAME="${DYNAMODB_TABLE_NAME:-telemetry-hot}"

export AWS_DEFAULT_REGION="$REGION"

echo "Initializing LocalStack resources in ${REGION}..."

if ! awslocal kinesis describe-stream --stream-name "$KINESIS_STREAM_NAME" >/dev/null 2>&1; then
  awslocal kinesis create-stream \
    --stream-name "$KINESIS_STREAM_NAME" \
    --shard-count 1
  echo "Created Kinesis stream: ${KINESIS_STREAM_NAME}"
else
  echo "Kinesis stream already exists: ${KINESIS_STREAM_NAME}"
fi

if ! awslocal s3api head-bucket --bucket "$S3_BUCKET_NAME" >/dev/null 2>&1; then
  awslocal s3 mb "s3://${S3_BUCKET_NAME}"
  echo "Created S3 bucket: ${S3_BUCKET_NAME}"
else
  echo "S3 bucket already exists: ${S3_BUCKET_NAME}"
fi

if ! awslocal dynamodb describe-table --table-name "$DYNAMODB_TABLE_NAME" >/dev/null 2>&1; then
  awslocal dynamodb create-table \
    --table-name "$DYNAMODB_TABLE_NAME" \
    --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
    --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST
  echo "Created DynamoDB table: ${DYNAMODB_TABLE_NAME} (PK, SK)"
else
  echo "DynamoDB table already exists: ${DYNAMODB_TABLE_NAME}"
fi

echo "LocalStack resource init complete."
