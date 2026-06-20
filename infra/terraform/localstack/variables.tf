variable "aws_region" {
  description = "AWS region used for LocalStack resources."
  type        = string
  default     = "us-east-1"
}

variable "localstack_endpoint" {
  description = "LocalStack edge URL reachable from the host running Terraform."
  type        = string
  default     = "http://localhost:4566"
}

variable "kinesis_stream_name" {
  description = "Telemetry Kinesis stream name."
  type        = string
  default     = "telemetry"
}

variable "kinesis_shard_count" {
  description = "Shard count for the telemetry stream (LocalStack dev default)."
  type        = number
  default     = 1
}

variable "s3_bucket_name" {
  description = "Raw telemetry archive bucket."
  type        = string
  default     = "verdiron-raw"
}

variable "dynamodb_table_name" {
  description = "Hot telemetry DynamoDB table."
  type        = string
  default     = "telemetry-hot"
}
