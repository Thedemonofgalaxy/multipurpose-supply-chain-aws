"""
AWS CloudChain SCM - Supplier & Procurement Network Router
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from backend.app.config import settings
from backend.app.aws_services import aws_hub
from backend.app.models import Supplier

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers & Procurement"])

class PurchaseOrderRequest(BaseModel):
    sku: str
    quantity: int
    notes: Optional[str] = None

@router.get("", response_model=List[dict])
def list_suppliers(category: Optional[str] = None):
    suppliers = aws_hub.scan_table(settings.DYNAMODB_TABLE_SUPPLIERS)
    if category:
        suppliers = [s for s in suppliers if s.get("category") == category]
    return suppliers

@router.get("/{supplier_id}")
def get_supplier(supplier_id: str):
    supplier = aws_hub.get_item(settings.DYNAMODB_TABLE_SUPPLIERS, supplier_id, "id")
    if not supplier:
        raise HTTPException(status_code=404, detail=f"Supplier '{supplier_id}' not found.")
    return supplier

@router.post("", response_model=dict)
def create_supplier(supplier: Supplier):
    existing = aws_hub.get_item(settings.DYNAMODB_TABLE_SUPPLIERS, supplier.id, "id")
    if existing:
        raise HTTPException(status_code=400, detail=f"Supplier ID '{supplier.id}' already exists.")
    
    saved = aws_hub.put_item(settings.DYNAMODB_TABLE_SUPPLIERS, supplier.dict(), "id")
    
    audit = {
        "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": "SUPPLIER_ONBOARDED",
        "entity_id": supplier.id,
        "description": f"Supplier '{supplier.name}' ({supplier.country}) added to procurement registry.",
        "source": "Procurement Portal",
        "severity": "INFO"
    }
    aws_hub.put_item(settings.DYNAMODB_TABLE_AUDIT, audit, "id")
    return saved

@router.post("/{supplier_id}/purchase-order")
def create_purchase_order(supplier_id: str, req: PurchaseOrderRequest):
    supplier = aws_hub.get_item(settings.DYNAMODB_TABLE_SUPPLIERS, supplier_id, "id")
    if not supplier:
        raise HTTPException(status_code=404, detail=f"Supplier '{supplier_id}' not found.")
        
    item = aws_hub.get_item(settings.DYNAMODB_TABLE_INVENTORY, req.sku, "sku")
    if not item:
        raise HTTPException(status_code=404, detail=f"SKU '{req.sku}' not found.")

    po_id = f"PO-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.utcnow().isoformat()
    lead_time = supplier.get("lead_time_days", 7)
    
    # Automatically add stock to represent delivery in prototype or mark restocked
    item["quantity"] = item.get("quantity", 0) + req.quantity
    item["reorder_status"] = "IN_STOCK"
    item["last_restocked"] = now_iso
    aws_hub.put_item(settings.DYNAMODB_TABLE_INVENTORY, item, "sku")

    # Log audit
    audit = {
        "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": now_iso,
        "event_type": "PURCHASE_ORDER_ISSUED",
        "entity_id": po_id,
        "description": f"Purchase order {po_id} issued to {supplier.get('name')} for {req.quantity} units of {req.sku}. Inventory refreshed.",
        "source": "Automated Procurement",
        "severity": "INFO"
    }
    aws_hub.put_item(settings.DYNAMODB_TABLE_AUDIT, audit, "id")

    return {
        "po_id": po_id,
        "supplier_name": supplier.get("name"),
        "sku": req.sku,
        "quantity_ordered": req.quantity,
        "lead_time_days": lead_time,
        "new_stock_level": item["quantity"],
        "status": "APPROVED_AND_FULFILLED"
    }
