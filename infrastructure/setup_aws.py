"""
AWS CloudChain SCM - Automated AWS Resource Provisioner
Run: python infrastructure/setup_aws.py
Provisions DynamoDB tables, S3 Bucket, and SNS Topic in your AWS account using Boto3.
"""

import os
import sys
import boto3
from botocore.exceptions import ClientError

# Ensure parent directory is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.config import settings

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def provision_dynamodb(dynamodb):
    tables = [
        {"name": settings.DYNAMODB_TABLE_INVENTORY, "key": "sku"},
        {"name": settings.DYNAMODB_TABLE_ORDERS, "key": "id"},
        {"name": settings.DYNAMODB_TABLE_SUPPLIERS, "key": "id"},
        {"name": settings.DYNAMODB_TABLE_TELEMETRY, "key": "order_id"},
        {"name": settings.DYNAMODB_TABLE_AUDIT, "key": "id"}
    ]

    print("\n📦 [1/3] Provisioning Amazon DynamoDB Tables...")
    existing_tables = dynamodb.meta.client.list_tables()["TableNames"]

    for t in tables:
        name = t["name"]
        key = t["key"]
        if name in existing_tables:
            print(f"  ✓ Table '{name}' already exists.")
        else:
            print(f"  + Creating table '{name}' (Key: {key})...")
            table = dynamodb.create_table(
                TableName=name,
                KeySchema=[{"AttributeName": key, "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": key, "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            table.wait_until_exists()
            print(f"  ✓ Table '{name}' active!")

def provision_s3(s3_client, region):
    print("\n🪣 [2/3] Provisioning Amazon S3 Bucket...")
    bucket_name = settings.S3_BUCKET_NAME
    
    try:
        if region == "us-east-1":
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={"LocationConstraint": region}
            )
        print(f"  ✓ Created S3 Bucket: '{bucket_name}'")
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ["BucketAlreadyOwnedByYou", "BucketAlreadyExists"]:
            print(f"  ✓ S3 Bucket '{bucket_name}' is accessible.")
        else:
            print(f"  ⚠️ Warning creating bucket: {e}")

def provision_sns(sns_client):
    print("\n🔔 [3/3] Provisioning Amazon SNS Alert Topic...")
    topic_name = settings.SNS_TOPIC_ALERTS
    try:
        res = sns_client.create_topic(Name=topic_name)
        topic_arn = res["TopicArn"]
        print(f"  ✓ Created SNS Topic: '{topic_name}'")
        print(f"  ✓ ARN: {topic_arn}")
        return topic_arn
    except ClientError as e:
        print(f"  ⚠️ Warning creating SNS topic: {e}")
        return None

def main():
    region = settings.AWS_DEFAULT_REGION
    print(f"===========================================================")
    print(f"AWS CloudChain - Automatic Resource Provisioner")
    print(f"Region: {region}")
    print(f"===========================================================")

    session = boto3.Session(region_name=region)
    sts = session.client("sts")
    try:
        identity = sts.get_caller_identity()
        print(f"Connected AWS Account: {identity.get('Account')}")
        print(f"IAM User / Role:      {identity.get('Arn')}")
    except Exception as e:
        print(f"❌ Failed to verify AWS Credentials: {e}")
        print("\nPlease configure AWS credentials in your environment or in a .env file:")
        print("  AWS_ACCESS_KEY_ID=your_key")
        print("  AWS_SECRET_ACCESS_KEY=your_secret")
        print("  AWS_DEFAULT_REGION=us-east-1")
        sys.exit(1)

    dynamodb = session.resource("dynamodb")
    s3_client = session.client("s3")
    sns_client = session.client("sns")

    provision_dynamodb(dynamodb)
    provision_s3(s3_client, region)
    topic_arn = provision_sns(sns_client)

    print("\n🎉 All AWS Cloud resources provisioned successfully!")
    if topic_arn:
        print(f"Add this to your .env file: SNS_TOPIC_ARN={topic_arn}\n")

if __name__ == "__main__":
    main()
