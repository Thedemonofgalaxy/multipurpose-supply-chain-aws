"""
AWS CloudChain SCM - Configuration & Environment Management
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "AWS CloudChain SCM"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # AWS Configuration
    # Defaults to local emulation if AWS credentials are not set
    AWS_MODE: str = os.getenv("AWS_MODE", "auto")  # 'auto', 'aws', or 'local'
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    AWS_DEFAULT_REGION: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    
    # DynamoDB Table Names
    DYNAMODB_TABLE_INVENTORY: str = os.getenv("DYNAMODB_TABLE_INVENTORY", "scm-inventory")
    DYNAMODB_TABLE_ORDERS: str = os.getenv("DYNAMODB_TABLE_ORDERS", "scm-orders")
    DYNAMODB_TABLE_SUPPLIERS: str = os.getenv("DYNAMODB_TABLE_SUPPLIERS", "scm-suppliers")
    DYNAMODB_TABLE_TELEMETRY: str = os.getenv("DYNAMODB_TABLE_TELEMETRY", "scm-telemetry")
    DYNAMODB_TABLE_AUDIT: str = os.getenv("DYNAMODB_TABLE_AUDIT", "scm-audit-logs")
    
    # S3 Configuration
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "scm-shipping-manifests-demo")
    
    # SNS Configuration
    SNS_TOPIC_ALERTS: str = os.getenv("SNS_TOPIC_ALERTS", "scm-critical-alerts")
    SNS_TOPIC_ARN: Optional[str] = os.getenv("SNS_TOPIC_ARN", None)



settings = Settings()
