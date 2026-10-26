output "dynamodb_tables" {
  value = [
    aws_dynamodb_table.inventory.name,
    aws_dynamodb_table.orders.name,
    aws_dynamodb_table.suppliers.name,
    aws_dynamodb_table.telemetry.name,
    aws_dynamodb_table.audit.name
  ]
  description = "Created DynamoDB Table Names"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.manifests.bucket
  description = "Created S3 Bucket Name for Manifests"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "Amazon SNS Critical Alerts Topic ARN"
}
