"""
AWS CloudChain SCM - IoT Telemetry & Cold-Chain Anomaly Router
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from backend.app.config import settings
from backend.app.aws_services import aws_hub
from backend.app.models import TelemetryReading, TelemetryStatus

router = APIRouter(prefix="/api/telemetry", tags=["IoT Cold-Chain Telemetry"])

class TelemetrySimulateRequest(BaseModel):
    order_id: str
    temperature_c: float
    humidity_pct: float
    battery_pct: float
    latitude: float
    longitude: float
    speed_kmh: float

class AnomalyBreachRequest(BaseModel):
    order_id: str
    spike_temperature_c: float = 14.8

@router.get("", response_model=List[dict])
def get_all_telemetry():
    return aws_hub.scan_table(settings.DYNAMODB_TABLE_TELEMETRY)

@router.get("/{order_id}")
def get_order_telemetry(order_id: str):
    reading = aws_hub.get_item(settings.DYNAMODB_TABLE_TELEMETRY, order_id, "order_id")
    if not reading:
        raise HTTPException(status_code=404, detail=f"No telemetry data found for order '{order_id}'.")
    return reading

@router.post("/update")
def post_telemetry(req: TelemetrySimulateRequest):
    order = aws_hub.get_item(settings.DYNAMODB_TABLE_ORDERS, req.order_id, "id")
    now_iso = datetime.utcnow().isoformat()
    
    # Check cold chain limits (default safe 2.0 to 8.0 C)
    status = TelemetryStatus.NORMAL.value
    msg = "Sensor telemetry within normal parameters."
    
    if req.temperature_c > 8.0:
        status = TelemetryStatus.TEMP_BREACH_HIGH.value
        msg = f"Temperature {req.temperature_c}°C exceeds upper safety threshold (8.0°C)!"
    elif req.temperature_c < 2.0:
        status = TelemetryStatus.TEMP_BREACH_LOW.value
        msg = f"Temperature {req.temperature_c}°C dropped below lower safety limit (2.0°C)!"

    reading = {
        "order_id": req.order_id,
        "timestamp": now_iso,
        "temperature_c": req.temperature_c,
        "humidity_pct": req.humidity_pct,
        "battery_pct": req.battery_pct,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "speed_kmh": req.speed_kmh,
        "status": status,
        "message": msg
    }
    
    aws_hub.put_item(settings.DYNAMODB_TABLE_TELEMETRY, reading, "order_id")
    
    # Update order location coordinates
    if order:
        order["latitude"] = req.latitude
        order["longitude"] = req.longitude
        aws_hub.put_item(settings.DYNAMODB_TABLE_ORDERS, order, "id")

    return reading

@router.post("/simulate-breach")
def trigger_breach(req: AnomalyBreachRequest):
    order = aws_hub.get_item(settings.DYNAMODB_TABLE_ORDERS, req.order_id, "id")
    now_iso = datetime.utcnow().isoformat()
    
    reading = {
        "order_id": req.order_id,
        "timestamp": now_iso,
        "temperature_c": req.spike_temperature_c,
        "humidity_pct": 78.4,
        "battery_pct": 91.0,
        "latitude": order.get("latitude", 47.5596) if order else 47.5596,
        "longitude": order.get("longitude", 7.5886) if order else 7.5886,
        "speed_kmh": 64.0,
        "status": TelemetryStatus.TEMP_BREACH_HIGH.value,
        "message": f"CRITICAL: Temperature spike to {req.spike_temperature_c}°C! Cold-chain protocol violated."
    }
    
    aws_hub.put_item(settings.DYNAMODB_TABLE_TELEMETRY, reading, "order_id")
    
    # Send SNS Emergency notification
    alert = aws_hub.publish_alert(
        subject=f"🚨 CRITICAL COLD-CHAIN ANOMALY: Order {req.order_id}",
        message=(
            f"IoT Sensor on shipment {req.order_id} recorded {req.spike_temperature_c}°C, "
            f"exceeding standard pharmaceutical threshold (8.0°C). Carrier: {order.get('carrier') if order else 'Express'}. "
            f"Location: {order.get('current_location') if order else 'In Transit'}."
        ),
        severity="CRITICAL"
    )

    return {
        "status": "BREACH_SIMULATED",
        "order_id": req.order_id,
        "temperature": req.spike_temperature_c,
        "sns_alert_published": alert
    }
