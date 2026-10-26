"""
AWS CloudChain SCM - Domain Data Models & Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ProductCategory(str, Enum):
    ELECTRONICS = "Electronics"
    HEALTHCARE_PHARMA = "Healthcare & Pharma"
    AUTOMOTIVE = "Automotive Components"
    CONSUMER_GOODS = "Consumer Goods"
    RAW_MATERIALS = "Raw Materials"

class OrderStatus(str, Enum):
    PLACED = "PLACED"
    PROCESSING = "PROCESSING"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    CUSTOMS_CLEARED = "CUSTOMS_CLEARED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class TelemetryStatus(str, Enum):
    NORMAL = "NORMAL"
    TEMP_BREACH_HIGH = "TEMP_BREACH_HIGH"
    TEMP_BREACH_LOW = "TEMP_BREACH_LOW"
    HUMIDITY_ALERT = "HUMIDITY_ALERT"
    BATTERY_LOW = "BATTERY_LOW"

class Warehouse(BaseModel):
    id: str
    name: str
    region: str
    country: str
    city: str
    capacity_sqft: int
    current_utilization_pct: float
    manager_name: str
    manager_contact: str

class Supplier(BaseModel):
    id: str
    name: str
    category: ProductCategory
    country: str
    city: str
    contact_email: str
    contact_phone: str
    rating: float = Field(..., ge=1.0, le=5.0)
    lead_time_days: int
    is_active: bool = True

class InventoryItem(BaseModel):
    sku: str
    name: str
    category: ProductCategory
    warehouse_id: str
    supplier_id: str
    quantity: int
    min_threshold: int
    unit_price: float
    storage_temp_min_c: Optional[float] = None
    storage_temp_max_c: Optional[float] = None
    requires_cold_chain: bool = False
    reorder_status: str = "IN_STOCK"  # IN_STOCK, REORDER_REQUIRED, RESTOCK_ORDERED
    last_restocked: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class OrderItem(BaseModel):
    sku: str
    name: str
    quantity: int
    unit_price: float

class ShipmentMilestone(BaseModel):
    code: OrderStatus
    title: str
    location: str
    timestamp: str
    description: str
    completed: bool = False

class Order(BaseModel):
    id: str
    customer_name: str
    customer_email: str
    destination_city: str
    destination_country: str
    origin_warehouse_id: str
    items: List[OrderItem]
    total_amount: float
    status: OrderStatus = OrderStatus.PLACED
    tracking_number: str
    carrier: str = "CloudChain Express Logistics"
    requires_cold_chain: bool = False
    current_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    estimated_delivery: str
    milestones: List[ShipmentMilestone]
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TelemetryReading(BaseModel):
    order_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    temperature_c: float
    humidity_pct: float
    battery_pct: float
    latitude: float
    longitude: float
    speed_kmh: float
    status: TelemetryStatus = TelemetryStatus.NORMAL
    message: Optional[str] = None

class AuditLog(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    event_type: str
    entity_id: str
    description: str
    source: str = "CloudChain System"
    severity: str = "INFO"  # INFO, WARNING, CRITICAL

class RestockRequest(BaseModel):
    sku: str
    quantity: int
    supplier_id: Optional[str] = None

class CreateOrderRequest(BaseModel):
    customer_name: str
    customer_email: str
    destination_city: str
    destination_country: str
    origin_warehouse_id: str
    items: List[OrderItem]
    requires_cold_chain: bool = False

class AdvanceMilestoneRequest(BaseModel):
    next_status: Optional[OrderStatus] = None
    location_update: Optional[str] = None
    notes: Optional[str] = None
