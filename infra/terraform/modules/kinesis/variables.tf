variable "stream_name" {
  description = "Kinesis stream name."
  type        = string
}

variable "shard_count" {
  description = "Number of shards."
  type        = number
  default     = 1
}

variable "retention_period_hours" {
  description = "Stream retention in hours."
  type        = number
  default     = 24
}
