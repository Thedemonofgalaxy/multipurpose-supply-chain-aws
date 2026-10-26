"""
AWS CloudChain SCM - AWS Cloud Architecture & Infrastructure Inspector
"""

from fastapi import APIRouter
from backend.app.config import settings
from backend.app.aws_services import aws_hub

router = APIRouter(prefix="/api/cloud", tags=["AWS Cloud Architecture & Admin"])

@router.get("/status")
def get_cloud_status():
    status = aws_hub.get_status()
    
    # Calculate live counts in tables
    table_counts = {
        "inventory": len(aws_hub.scan_table(settings.DYNAMODB_TABLE_INVENTORY)),
        "orders": len(aws_hub.scan_table(settings.DYNAMODB_TABLE_ORDERS)),
        "suppliers": len(aws_hub.scan_table(settings.DYNAMODB_TABLE_SUPPLIERS)),
        "telemetry": len(aws_hub.scan_table(settings.DYNAMODB_TABLE_TELEMETRY)),
        "audit": len(aws_hub.scan_table(settings.DYNAMODB_TABLE_AUDIT)),
        "s3_manifests": len(aws_hub.list_s3_files()),
        "sns_alerts_queued": len(aws_hub.get_recent_alerts())
    }
    status["counts"] = table_counts
    return status

@router.get("/audit-logs")
def get_audit_logs():
    logs = aws_hub.scan_table(settings.DYNAMODB_TABLE_AUDIT)
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs[:50]

@router.get("/alerts")
def get_recent_alerts():
    return aws_hub.get_recent_alerts()

@router.post("/seed")
def seed_demo_data():
    aws_hub.seed_data(force=True)
    return {
        "message": "Demo data successfully re-seeded across DynamoDB tables and S3 storage.",
        "status": "SUCCESS"
    }

@router.post("/test-connection")
def test_aws():
    aws_hub._init_aws()
    return aws_hub.get_status()
