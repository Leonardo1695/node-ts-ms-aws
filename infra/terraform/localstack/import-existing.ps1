# Import resources already created by infra/localstack/ready.d when docker compose is running.
# Run from infra/terraform/localstack after: terraform init

$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot

terraform import module.telemetry_stream.aws_kinesis_stream.this telemetry
terraform import module.raw_archive_bucket.aws_s3_bucket.this verdiron-raw
terraform import module.telemetry_hot_table.aws_dynamodb_table.this telemetry-hot

Pop-Location
