"""
AWS CloudChain SCM - AWS Cloud Service Integration & Emulation Layer
Supports both Live AWS Cloud (DynamoDB, S3, SNS) and Zero-Config Local Cloud Emulation.
"""

import os
import json
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.config import settings

logger = logging.getLogger("cloudchain.aws")

LOCAL_STORAGE_FILE = os.path.join("data", "local_cloud_storage.json")
LOCAL_S3_DIR = os.path.join("data", "s3_storage")

class LocalCloudEngine:
    """
    In-memory and file-backed emulation of DynamoDB, S3, and SNS for local development,
    demonstration, and offline hackathons without an AWS credit card.
    """
    def __init__(self):
        os.makedirs("data", exist_ok=True)
        os.makedirs(LOCAL_S3_DIR, exist_ok=True)
        self.tables: Dict[str, Dict[str, Any]] = {
            settings.DYNAMODB_TABLE_INVENTORY: {},
            settings.DYNAMODB_TABLE_ORDERS: {},
            settings.DYNAMODB_TABLE_SUPPLIERS: {},
            settings.DYNAMODB_TABLE_TELEMETRY: {},
            settings.DYNAMODB_TABLE_AUDIT: {},
            "warehouses": {}
        }
        self.sns_alerts: List[Dict[str, Any]] = []
        self._load_from_disk()

    def _load_from_disk(self):
        if os.path.exists(LOCAL_STORAGE_FILE):
            try:
                with open(LOCAL_STORAGE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for k, v in data.get("tables", {}).items():
                        self.tables[k] = v
                    self.sns_alerts = data.get("sns_alerts", [])
                logger.info("Loaded local cloud storage from disk.")
            except Exception as e:
                logger.warning(f"Could not load local storage: {e}. Starting fresh.")
                self.seed_defaults()
        else:
            self.seed_defaults()

    def save_to_disk(self):
        try:
            with open(LOCAL_STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "tables": self.tables,
                    "sns_alerts": self.sns_alerts,
                    "saved_at": datetime.utcnow().isoformat()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist local storage: {e}")

    def seed_defaults(self, force=False):
        from backend.app.sample_data import (
            get_seed_warehouses,
            get_seed_suppliers,
            get_seed_inventory,
            get_seed_orders,
            get_seed_telemetry,
            get_seed_audit_logs
        )
        
        # Check if already seeded and not force
        if not force and any(len(t) > 0 for t in self.tables.values()):
            return

        self.tables["warehouses"] = {w["id"]: w for w in get_seed_warehouses()}
        self.tables[settings.DYNAMODB_TABLE_SUPPLIERS] = {s["id"]: s for s in get_seed_suppliers()}
        self.tables[settings.DYNAMODB_TABLE_INVENTORY] = {i["sku"]: i for i in get_seed_inventory()}
        self.tables[settings.DYNAMODB_TABLE_ORDERS] = {o["id"]: o for o in get_seed_orders()}
        self.tables[settings.DYNAMODB_TABLE_TELEMETRY] = {t["order_id"]: t for t in get_seed_telemetry()}
        self.tables[settings.DYNAMODB_TABLE_AUDIT] = {a["id"]: a for a in get_seed_audit_logs()}
        
        # Seed initial SNS alert
        self.sns_alerts = [
            {
                "id": "SNS-ALT-001",
                "topic": settings.SNS_TOPIC_ALERTS,
                "timestamp": datetime.utcnow().isoformat(),
                "subject": "⚠️ Low Stock Notice: MED-VAC-001",
                "message": "Inventory below minimum safe threshold (18/30 units). Automated supplier replenishment alert.",
                "severity": "WARNING"
            }
        ]
        self.save_to_disk()
        logger.info("Successfully seeded local demonstration data.")

    # DynamoDB Emulation
    def put_item(self, table_name: str, item: Dict[str, Any], key_field: str = "id") -> Dict[str, Any]:
        if table_name not in self.tables:
            self.tables[table_name] = {}
        key = item.get(key_field) or item.get("sku") or item.get("id") or str(uuid.uuid4())
        self.tables[table_name][key] = item
        self.save_to_disk()
        return item

    def get_item(self, table_name: str, key_value: str) -> Optional[Dict[str, Any]]:
        return self.tables.get(table_name, {}).get(key_value)

    def scan(self, table_name: str) -> List[Dict[str, Any]]:
        return list(self.tables.get(table_name, {}).values())

    def delete_item(self, table_name: str, key_value: str) -> bool:
        if table_name in self.tables and key_value in self.tables[table_name]:
            del self.tables[table_name][key_value]
            self.save_to_disk()
            return True
        return False

    # S3 Emulation
    def put_s3_object(self, key: str, body: bytes, content_type: str = "text/plain") -> Dict[str, Any]:
        file_path = os.path.join(LOCAL_S3_DIR, key.replace("/", "_"))
        with open(file_path, "wb") as f:
            f.write(body)
        return {
            "bucket": settings.S3_BUCKET_NAME,
            "key": key,
            "size": len(body),
            "content_type": content_type,
            "url": f"/api/manifests/download/{key}",
            "created_at": datetime.utcnow().isoformat()
        }

    def get_s3_object(self, key: str) -> Optional[bytes]:
        file_path = os.path.join(LOCAL_S3_DIR, key.replace("/", "_"))
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                return f.read()
        return None

    def list_s3_objects(self) -> List[Dict[str, Any]]:
        results = []
        if os.path.exists(LOCAL_S3_DIR):
            for filename in os.listdir(LOCAL_S3_DIR):
                file_path = os.path.join(LOCAL_S3_DIR, filename)
                if os.path.isfile(file_path):
                    results.append({
                        "key": filename,
                        "size": os.path.getsize(file_path),
                        "last_modified": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                        "url": f"/api/manifests/download/{filename}"
                    })
        return results

    # SNS Emulation
    def publish_sns(self, subject: str, message: str, severity: str = "INFO") -> Dict[str, Any]:
        alert = {
            "id": f"SNS-{uuid.uuid4().hex[:8].upper()}",
            "topic": settings.SNS_TOPIC_ALERTS,
            "timestamp": datetime.utcnow().isoformat(),
            "subject": subject,
            "message": message,
            "severity": severity
        }
        self.sns_alerts.insert(0, alert)
        self.save_to_disk()
        return alert


class AWSCloudService:
    """
    Main AWS Service Orchestrator:
    Automatically manages connections to Amazon DynamoDB, Amazon S3, and Amazon SNS.
    Seamlessly switches between Live AWS Cloud and Local Cloud Engine.
    """
    def __init__(self):
        self.local_engine = LocalCloudEngine()
        self.is_live_aws = False
        self.boto3_session = None
        self.dynamodb_client = None
        self.dynamodb_resource = None
        self.s3_client = None
        self.sns_client = None
        self._init_aws()

    def _init_aws(self):
        if settings.AWS_MODE == "local":
            logger.info("AWS_MODE is explicitly set to 'local'. Using local cloud emulation.")
            self.is_live_aws = False
            return

        has_keys = bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)
        
        try:
            import boto3
            from botocore.exceptions import NoCredentialsError, ClientError

            if has_keys:
                self.boto3_session = boto3.Session(
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_DEFAULT_REGION
                )
            else:
                # Attempt default IAM credentials / environment
                self.boto3_session = boto3.Session(region_name=settings.AWS_DEFAULT_REGION)

            # Test STS identity
            sts = self.boto3_session.client("sts")
            caller_identity = sts.get_caller_identity()
            self.dynamodb_resource = self.boto3_session.resource("dynamodb")
            self.dynamodb_client = self.boto3_session.client("dynamodb")
            self.s3_client = self.boto3_session.client("s3")
            self.sns_client = self.boto3_session.client("sns")
            self.is_live_aws = True
            logger.info(f"Connected to Live AWS Cloud! Identity: {caller_identity.get('Arn')}")
        except Exception as e:
            logger.info(f"Live AWS credentials not active ({e}). Operating in Local Cloud Emulation Mode.")
            self.is_live_aws = False

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "AWS_CLOUD" if self.is_live_aws else "LOCAL_EMULATION",
            "is_live_aws": self.is_live_aws,
            "region": settings.AWS_DEFAULT_REGION,
            "s3_bucket": settings.S3_BUCKET_NAME,
            "sns_topic": settings.SNS_TOPIC_ALERTS,
            "tables": {
                "inventory": settings.DYNAMODB_TABLE_INVENTORY,
                "orders": settings.DYNAMODB_TABLE_ORDERS,
                "suppliers": settings.DYNAMODB_TABLE_SUPPLIERS,
                "telemetry": settings.DYNAMODB_TABLE_TELEMETRY,
                "audit": settings.DYNAMODB_TABLE_AUDIT
            },
            "status_message": (
                f"Connected to Live AWS Cloud ({settings.AWS_DEFAULT_REGION})"
                if self.is_live_aws
                else "Active in Zero-Config Local Cloud Emulation Mode (Full functionality without AWS charges)"
            )
        }

    # ==========================================
    # DynamoDB Operations
    # ==========================================
    def put_item(self, table_name: str, item: Dict[str, Any], key_field: str = "id") -> Dict[str, Any]:
        if not self.is_live_aws:
            return self.local_engine.put_item(table_name, item, key_field)
        try:
            table = self.dynamodb_resource.Table(table_name)
            table.put_item(Item=item)
            return item
        except Exception as e:
            logger.error(f"AWS DynamoDB put_item error: {e}. Falling back to local.")
            return self.local_engine.put_item(table_name, item, key_field)

    def get_item(self, table_name: str, key_value: str, key_name: str = "id") -> Optional[Dict[str, Any]]:
        if not self.is_live_aws:
            return self.local_engine.get_item(table_name, key_value)
        try:
            table = self.dynamodb_resource.Table(table_name)
            response = table.get_item(Key={key_name: key_value})
            return response.get("Item")
        except Exception as e:
            logger.error(f"AWS DynamoDB get_item error: {e}. Falling back to local.")
            return self.local_engine.get_item(table_name, key_value)

    def scan_table(self, table_name: str) -> List[Dict[str, Any]]:
        if not self.is_live_aws:
            return self.local_engine.scan(table_name)
        try:
            table = self.dynamodb_resource.Table(table_name)
            response = table.scan()
            items = response.get("Items", [])
            while "LastEvaluatedKey" in response:
                response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
                items.extend(response.get("Items", []))
            return items
        except Exception as e:
            logger.error(f"AWS DynamoDB scan error: {e}. Falling back to local.")
            return self.local_engine.scan(table_name)

    def delete_item(self, table_name: str, key_value: str, key_name: str = "id") -> bool:
        if not self.is_live_aws:
            return self.local_engine.delete_item(table_name, key_value)
        try:
            table = self.dynamodb_resource.Table(table_name)
            table.delete_item(Key={key_name: key_value})
            return True
        except Exception as e:
            logger.error(f"AWS DynamoDB delete error: {e}. Falling back to local.")
            return self.local_engine.delete_item(table_name, key_value)

    # ==========================================
    # Amazon S3 Operations
    # ==========================================
    def put_s3_file(self, key: str, body: bytes, content_type: str = "application/pdf") -> Dict[str, Any]:
        if not self.is_live_aws:
            return self.local_engine.put_s3_object(key, body, content_type)
        try:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=body,
                ContentType=content_type
            )
            # Generate pre-signed URL valid for 2 hours
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
                ExpiresIn=7200
            )
            return {
                "bucket": settings.S3_BUCKET_NAME,
                "key": key,
                "size": len(body),
                "content_type": content_type,
                "url": url,
                "created_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"AWS S3 put_object error: {e}. Falling back to local.")
            return self.local_engine.put_s3_object(key, body, content_type)

    def get_s3_file(self, key: str) -> Optional[bytes]:
        if not self.is_live_aws:
            return self.local_engine.get_s3_object(key)
        try:
            obj = self.s3_client.get_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            return obj["Body"].read()
        except Exception as e:
            logger.error(f"AWS S3 get_object error: {e}. Falling back to local.")
            return self.local_engine.get_s3_object(key)

    def list_s3_files(self) -> List[Dict[str, Any]]:
        if not self.is_live_aws:
            return self.local_engine.list_s3_objects()
        try:
            response = self.s3_client.list_objects_v2(Bucket=settings.S3_BUCKET_NAME)
            results = []
            for item in response.get("Contents", []):
                results.append({
                    "key": item["Key"],
                    "size": item["Size"],
                    "last_modified": item["LastModified"].isoformat(),
                    "url": f"/api/manifests/download/{item['Key']}"
                })
            return results
        except Exception as e:
            logger.error(f"AWS S3 list error: {e}. Falling back to local.")
            return self.local_engine.list_s3_objects()

    # ==========================================
    # Amazon SNS Operations
    # ==========================================
    def publish_alert(self, subject: str, message: str, severity: str = "INFO") -> Dict[str, Any]:
        # Always log to local engine for UI dashboard display
        alert = self.local_engine.publish_sns(subject, message, severity)
        
        # Also log to audit logs
        audit_log = {
            "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "SNS_ALERT_PUBLISHED",
            "entity_id": alert["id"],
            "description": f"{subject}: {message}",
            "source": "AWS SNS Publisher",
            "severity": severity
        }
        self.put_item(settings.DYNAMODB_TABLE_AUDIT, audit_log, "id")

        if self.is_live_aws and settings.SNS_TOPIC_ARN:
            try:
                self.sns_client.publish(
                    TopicArn=settings.SNS_TOPIC_ARN,
                    Subject=subject[:100],
                    Message=f"[{severity}] {subject}\n\n{message}\nTimestamp: {datetime.utcnow().isoformat()}"
                )
                logger.info(f"Published alert to Live AWS SNS Topic {settings.SNS_TOPIC_ARN}")
            except Exception as e:
                logger.error(f"Failed to publish to live AWS SNS: {e}")

        return alert

    def get_recent_alerts(self) -> List[Dict[str, Any]]:
        return self.local_engine.sns_alerts

    def seed_data(self, force=True):
        self.local_engine.seed_defaults(force=force)

# Global singleton
aws_hub = AWSCloudService()
