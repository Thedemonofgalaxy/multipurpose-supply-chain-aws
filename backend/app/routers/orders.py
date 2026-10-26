"""
AWS CloudChain SCM - Order Lifecycle & Shipment Tracking Router
"""

import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.app.config import settings
from backend.app.aws_services import aws_hub
from backend.app.models import Order, OrderStatus, CreateOrderRequest, AdvanceMilestoneRequest, ShipmentMilestone

router = APIRouter(prefix="/api/orders", tags=["Orders & Shipments"])

MILESTONE_PROGRESSION = [
    (OrderStatus.PLACED, "Purchase Order Placed", "Origin Fulfillment Center"),
    (OrderStatus.PROCESSING, "Warehouse Pick & Pack Verification", "Origin Fulfillment Center"),
    (OrderStatus.DISPATCHED, "Dispatched & Manifest Generated", "Carrier Hub Dock"),
    (OrderStatus.IN_TRANSIT, "In Transit Across Logistics Network", "Intermodal Freight Terminal"),
    (OrderStatus.CUSTOMS_CLEARED, "Customs Cleared & Port Entry", "Regional Customs Gateway"),
    (OrderStatus.OUT_FOR_DELIVERY, "Out for Last-Mile Delivery", "Destination City Distribution Center"),
    (OrderStatus.DELIVERED, "Delivered & Proof of Delivery Signed", "Recipient Receiving Facility")
]

@router.get("", response_model=List[dict])
def list_orders(status: Optional[str] = None):
    orders = aws_hub.scan_table(settings.DYNAMODB_TABLE_ORDERS)
    if status:
        orders = [o for o in orders if o.get("status") == status]
    # Sort newest first
    orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return orders

@router.get("/metrics/summary")
def get_order_metrics():
    orders = aws_hub.scan_table(settings.DYNAMODB_TABLE_ORDERS)
    total_orders = len(orders)
    in_transit_count = sum(1 for o in orders if o.get("status") in [OrderStatus.DISPATCHED.value, OrderStatus.IN_TRANSIT.value, OrderStatus.OUT_FOR_DELIVERY.value])
    delivered_count = sum(1 for o in orders if o.get("status") == OrderStatus.DELIVERED.value)
    processing_count = sum(1 for o in orders if o.get("status") in [OrderStatus.PLACED.value, OrderStatus.PROCESSING.value])
    total_revenue = sum(o.get("total_amount", 0) for o in orders)
    fulfillment_rate = round((delivered_count / total_orders * 100), 1) if total_orders > 0 else 100.0

    return {
        "total_orders": total_orders,
        "active_shipments": in_transit_count,
        "delivered_orders": delivered_count,
        "processing_orders": processing_count,
        "total_revenue_usd": round(total_revenue, 2),
        "fulfillment_rate_pct": fulfillment_rate
    }

@router.get("/{order_id}")
def get_order(order_id: str):
    order = aws_hub.get_item(settings.DYNAMODB_TABLE_ORDERS, order_id, "id")
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")
    return order

@router.post("", response_model=dict)
def create_order(req: CreateOrderRequest):
    order_id = f"ORD-{uuid.uuid4().hex[:5].upper()}"
    tracking_num = f"CC-AWS-{uuid.uuid4().hex[:7].upper()}"
    now_iso = datetime.utcnow().isoformat()
    est_delivery = (datetime.utcnow() + timedelta(days=3)).isoformat()
    
    total_amount = sum(item.quantity * item.unit_price for item in req.items)
    
    # Check inventory and deduct stock
    requires_cold_chain = req.requires_cold_chain
    for item in req.items:
        inv_item = aws_hub.get_item(settings.DYNAMODB_TABLE_INVENTORY, item.sku, "sku")
        if inv_item:
            current_qty = inv_item.get("quantity", 0)
            if current_qty < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient inventory for SKU {item.sku}. Requested: {item.quantity}, Available: {current_qty}"
                )
            # Deduct
            new_qty = current_qty - item.quantity
            inv_item["quantity"] = new_qty
            if inv_item.get("requires_cold_chain"):
                requires_cold_chain = True
            if new_qty <= inv_item.get("min_threshold", 0):
                inv_item["reorder_status"] = "REORDER_REQUIRED"
                # Publish SNS Alert
                aws_hub.publish_alert(
                    subject=f"⚠️ Low Stock Alert: {inv_item.get('name')} ({item.sku})",
                    message=f"Stock for SKU {item.sku} dropped to {new_qty} units following order {order_id}. Minimum threshold is {inv_item.get('min_threshold')}.",
                    severity="WARNING"
                )
            aws_hub.put_item(settings.DYNAMODB_TABLE_INVENTORY, inv_item, "sku")

    # Generate initial milestones
    milestones = []
    for code, title, default_loc in MILESTONE_PROGRESSION:
        is_completed = (code == OrderStatus.PLACED)
        milestones.append({
            "code": code.value,
            "title": title,
            "location": f"{req.origin_warehouse_id} Logistics Center" if is_completed else default_loc,
            "timestamp": now_iso if is_completed else "",
            "description": "Order submitted and verified in AWS DynamoDB." if is_completed else f"Scheduled: {title}",
            "completed": is_completed
        })

    order_data = {
        "id": order_id,
        "customer_name": req.customer_name,
        "customer_email": req.customer_email,
        "destination_city": req.destination_city,
        "destination_country": req.destination_country,
        "origin_warehouse_id": req.origin_warehouse_id,
        "items": [item.dict() for item in req.items],
        "total_amount": round(total_amount, 2),
        "status": OrderStatus.PLACED.value,
        "tracking_number": tracking_num,
        "carrier": "CloudChain Global Express",
        "requires_cold_chain": requires_cold_chain,
        "current_location": f"Warehouse {req.origin_warehouse_id}",
        "latitude": 47.6062 if "NA" in req.origin_warehouse_id else 50.1109,
        "longitude": -122.3321 if "NA" in req.origin_warehouse_id else 8.6821,
        "estimated_delivery": est_delivery,
        "milestones": milestones,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    saved = aws_hub.put_item(settings.DYNAMODB_TABLE_ORDERS, order_data, "id")

    # Audit log
    audit = {
        "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": now_iso,
        "event_type": "ORDER_CREATED",
        "entity_id": order_id,
        "description": f"Order {order_id} created for {req.customer_name} (${total_amount:.2f}). Inventory allocated.",
        "source": "Order Management Engine",
        "severity": "INFO"
    }
    aws_hub.put_item(settings.DYNAMODB_TABLE_AUDIT, audit, "id")

    return saved

@router.post("/{order_id}/advance")
def advance_order_milestone(order_id: str, req: AdvanceMilestoneRequest):
    order = aws_hub.get_item(settings.DYNAMODB_TABLE_ORDERS, order_id, "id")
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")
        
    current_status = order.get("status", OrderStatus.PLACED.value)
    milestones = order.get("milestones", [])
    now_iso = datetime.utcnow().isoformat()

    status_codes = [m[0].value for m in MILESTONE_PROGRESSION]
    try:
        current_idx = status_codes.index(current_status)
    except ValueError:
        current_idx = 0

    if current_idx >= len(status_codes) - 1:
        return {
            "message": f"Order {order_id} is already in final status '{current_status}'.",
            "order": order
        }

    next_idx = current_idx + 1
    next_code = status_codes[next_idx]
    next_tuple = MILESTONE_PROGRESSION[next_idx]

    # Update milestone list
    for m in milestones:
        if m.get("code") == next_code:
            m["completed"] = True
            m["timestamp"] = now_iso
            if req.notes:
                m["description"] = req.notes
            if req.location_update:
                m["location"] = req.location_update

    order["status"] = next_code
    order["updated_at"] = now_iso
    if req.location_update:
        order["current_location"] = req.location_update
    else:
        order["current_location"] = next_tuple[2]

    # If delivered, trigger notification
    if next_code == OrderStatus.DELIVERED.value:
        aws_hub.publish_alert(
            subject=f"✅ Shipment Delivered: {order_id}",
            message=f"Order {order_id} ({order.get('tracking_number')}) has been confirmed delivered to {order.get('destination_city')}, {order.get('destination_country')}.",
            severity="INFO"
        )

    aws_hub.put_item(settings.DYNAMODB_TABLE_ORDERS, order, "id")

    # Audit log
    audit = {
        "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": now_iso,
        "event_type": "SHIPMENT_MILESTONE_UPDATED",
        "entity_id": order_id,
        "description": f"Shipment {order_id} advanced to milestone '{next_code}' at {order['current_location']}.",
        "source": "Logistics Route Engine",
        "severity": "INFO"
    }
    aws_hub.put_item(settings.DYNAMODB_TABLE_AUDIT, audit, "id")

    return {
        "message": f"Shipment advanced to {next_code}",
        "previous_status": current_status,
        "new_status": next_code,
        "order": order
    }
