terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# -------------------------------------------------------------
# Amazon DynamoDB Tables
# -------------------------------------------------------------
resource "aws_dynamodb_table" "inventory" {
  name         = "scm-inventory"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sku"

  attribute {
    name = "sku"
    type = "S"
  }

  tags = {
    Project     = "AWS-CloudChain-SCM"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "orders" {
  name         = "scm-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Project     = "AWS-CloudChain-SCM"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "suppliers" {
  name         = "scm-suppliers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Project     = "AWS-CloudChain-SCM"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "telemetry" {
  name         = "scm-telemetry"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }

  tags = {
    Project     = "AWS-CloudChain-SCM"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "audit" {
  name         = "scm-audit-logs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Project     = "AWS-CloudChain-SCM"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# Amazon S3 Bucket for Shipping Manifests
# -------------------------------------------------------------
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "manifests" {
  bucket        = "scm-manifests-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Project     = "AWS-CloudChain-SCM"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "manifests_block" {
  bucket                  = aws_s3_bucket.manifests.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -------------------------------------------------------------
# Amazon SNS Topic for Critical Alerts
# -------------------------------------------------------------
resource "aws_sns_topic" "alerts" {
  name         = "scm-critical-alerts"
  display_name = "CloudChain Supply Chain Critical Alerts"

  tags = {
    Project     = "AWS-CloudChain-SCM"
    Environment = var.environment
  }
}
