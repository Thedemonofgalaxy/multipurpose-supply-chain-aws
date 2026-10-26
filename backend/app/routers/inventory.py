"""
AWS CloudChain SCM - Inventory & Warehouse Management Router
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.app.config import settings
from backend.app.aws_services import aws_hub
from backend.app.models import InventoryItem, RestockRequest, Warehouse

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Warehouses"])

@router.get("", response_model=List[dict])
def list_inventory(
    category: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    low_stock_only: bool = False
):
    items = aws_hub.scan_table(settings.DYNAMODB_TABLE_INVENTORY)
    
    if category:
        items = [i for i in items if i.get("category") == category]
    if warehouse_id:
        items = [i for i in items if i.get("warehouse_id") == warehouse_id]
    if low_stock_only:
        items = [i for i in items if i.get("quantity", 0) <= i.get("min_threshold", 0)]
        
    return items

@router.get("/metrics")
def get_inventory_metrics():
    items = aws_hub.scan_table(settings.DYNAMODB_TABLE_INVENTORY)
    total_items = len(items)
    low_stock_items = [i for i in items if i.get("quantity", 0) <= i.get("min_threshold", 0)]
    total_units = sum(i.get("quantity", 0) for i in items)
    total_valuation = sum(i.get("quantity", 0) * i.get("unit_price", 0) for i in items)
    cold_chain_count = sum(1 for i in items if i.get("requires_cold_chain"))
    
    return {
        "total_skus": total_items,
        "total_units": total_units,
        "total_valuation_usd": round(total_valuation, 2),
        "low_stock_count": len(low_stock_items),
        "cold_chain_sku_count": cold_chain_count,
        "low_stock_skus": [i.get("sku") for i in low_stock_items]
    }

@router.get("/{sku}")
def get_inventory_item(sku: str):
    item = aws_hub.get_item(settings.DYNAMODB_TABLE_INVENTORY, sku, "sku")
    if not item:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{sku}' not found.")
    return item

@router.post("", response_model=dict)
def create_inventory_item(item: InventoryItem):
    existing = aws_hub.get_item(settings.DYNAMODB_TABLE_INVENTORY, item.sku, "sku")
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU '{item.sku}' already exists.")
    
    item_dict = item.dict()
    if item_dict["quantity"] <= item_dict["min_threshold"]:
        item_dict["reorder_status"] = "REORDER_REQUIRED"
    else:
        item_dict["reorder_status"] = "IN_STOCK"
        
    saved = aws_hub.put_item(settings.DYNAMODB_TABLE_INVENTORY, item_dict, "sku")
    
    # Audit log
    audit = {
        "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": "PRODUCT_ONBOARDED",
        "entity_id": item.sku,
        "description": f"New product SKU '{item.sku}' ({item.name}) registered in warehouse {item.warehouse_id}.",
        "source": "Inventory API",
        "severity": "INFO"
    }
    aws_hub.put_item(settings.DYNAMODB_TABLE_AUDIT, audit, "id")
    
    return saved

@router.post("/restock")
def restock_item(req: RestockRequest):
    item = aws_hub.get_item(settings.DYNAMODB_TABLE_INVENTORY, req.sku, "sku")
    if not item:
        raise HTTPException(status_code=404, detail=f"SKU '{req.sku}' not found.")
        
    old_qty = item.get("quantity", 0)
    new_qty = old_qty + req.quantity
    item["quantity"] = new_qty
    item["last_restocked"] = datetime.utcnow().isoformat()
    
    if new_qty > item.get("min_threshold", 0):
        item["reorder_status"] = "IN_STOCK"
        
    aws_hub.put_item(settings.DYNAMODB_TABLE_INVENTORY, item, "sku")
    
    # Audit log
    audit = {
        "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": "STOCK_REPLENISHED",
        "entity_id": req.sku,
        "description": f"Restocked {req.quantity} units for SKU {req.sku}. New inventory count: {new_qty}.",
        "source": "Procurement / Warehouse",
        "severity": "INFO"
    }
    aws_hub.put_item(settings.DYNAMODB_TABLE_AUDIT, audit, "id")
    
    return {
        "message": f"Successfully replenished {req.quantity} units.",
        "sku": req.sku,
        "previous_quantity": old_qty,
        "current_quantity": new_qty,
        "reorder_status": item["reorder_status"]
    }

@router.get("/warehouses/list", response_model=List[dict])
def list_warehouses():
    return aws_hub.scan_table("warehouses")
