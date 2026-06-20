output "kinesis_stream_name" {
  description = "Telemetry Kinesis stream name."
  value       = module.telemetry_stream.stream_name
}

output "kinesis_stream_arn" {
  description = "Telemetry Kinesis stream ARN."
  value       = module.telemetry_stream.stream_arn
}

output "s3_bucket_name" {
  description = "Raw telemetry S3 bucket name."
  value       = module.raw_archive_bucket.bucket_name
}

output "s3_bucket_arn" {
  description = "Raw telemetry S3 bucket ARN."
  value       = module.raw_archive_bucket.bucket_arn
}

output "dynamodb_table_name" {
  description = "Hot telemetry DynamoDB table name."
  value       = module.telemetry_hot_table.table_name
}

output "dynamodb_table_arn" {
  description = "Hot telemetry DynamoDB table ARN."
  value       = module.telemetry_hot_table.table_arn
}
