module "telemetry_stream" {
  source = "../modules/kinesis"

  stream_name = var.kinesis_stream_name
  shard_count = var.kinesis_shard_count
}

module "raw_archive_bucket" {
  source = "../modules/s3"

  bucket_name = var.s3_bucket_name
}

module "telemetry_hot_table" {
  source = "../modules/dynamodb"

  table_name = var.dynamodb_table_name
}

# Demonstrates real-AWS shapes for interview discussion. Not applied locally.
# module "real_aws_sketch" {
#   source = "../modules/real-aws-sketch"
#
#   project     = "verdiron"
#   environment = "prod"
#   aws_region  = var.aws_region
# }
