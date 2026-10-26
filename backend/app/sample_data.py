"""
AWS CloudChain SCM - Realistic Demonstration Seed Data
"""

from datetime import datetime, timedelta

def get_seed_warehouses():
    return [
        {
            "id": "WH-NA-01",
            "name": "North America Prime Hub (Seattle)",
            "region": "us-west-2",
            "country": "United States",
            "city": "Seattle, WA",
            "capacity_sqft": 450000,
            "current_utilization_pct": 74.2,
            "manager_name": "Elena Vance",
            "manager_contact": "elena.vance@cloudchain.demo"
        },
        {
            "id": "WH-EU-01",
            "name": "Central European Gateway (Frankfurt)",
            "region": "eu-central-1",
            "country": "Germany",
            "city": "Frankfurt",
            "capacity_sqft": 380000,
            "current_utilization_pct": 68.5,
            "manager_name": "Klaus Weber",
            "manager_contact": "klaus.weber@cloudchain.demo"
        },
        {
            "id": "WH-APAC-01",
            "name": "Asia-Pacific Mega Logistics (Singapore)",
            "region": "ap-southeast-1",
            "country": "Singapore",
            "city": "Jurong Port",
            "capacity_sqft": 520000,
            "current_utilization_pct": 86.9,
            "manager_name": "Wei Chen",
            "manager_contact": "wei.chen@cloudchain.demo"
        },
        {
            "id": "WH-LATAM-01",
            "name": "Latin America Distribution Center (São Paulo)",
            "region": "sa-east-1",
            "country": "Brazil",
            "city": "São Paulo",
            "capacity_sqft": 290000,
            "current_utilization_pct": 52.0,
            "manager_name": "Mateo Silva",
            "manager_contact": "mateo.silva@cloudchain.demo"
        }
    ]

def get_seed_suppliers():
    return [
        {
            "id": "SUP-101",
            "name": "Pacific MicroSemiconductor Corp",
            "category": "Electronics",
            "country": "Taiwan",
            "city": "Hsinchu",
            "contact_email": "orders@pacificmicro.demo",
            "contact_phone": "+886 3 578 9900",
            "rating": 4.9,
            "lead_time_days": 12,
            "is_active": True
        },
        {
            "id": "SUP-102",
            "name": "Nordic BioPharma Laboratories",
            "category": "Healthcare & Pharma",
            "country": "Denmark",
            "city": "Copenhagen",
            "contact_email": "supply@nordicbiopharma.demo",
            "contact_phone": "+45 39 17 00 00",
            "rating": 4.95,
            "lead_time_days": 7,
            "is_active": True
        },
        {
            "id": "SUP-103",
            "name": "Apex Advanced Mobility Systems",
            "category": "Automotive Components",
            "country": "Japan",
            "city": "Nagoya",
            "contact_email": "b2b@apexmobility.demo",
            "contact_phone": "+81 52 951 8820",
            "rating": 4.7,
            "lead_time_days": 15,
            "is_active": True
        },
        {
            "id": "SUP-104",
            "name": "BioHealth CryoVaccine Tech",
            "category": "Healthcare & Pharma",
            "country": "Switzerland",
            "city": "Basel",
            "contact_email": "logistics@cryovaccine.demo",
            "contact_phone": "+41 61 688 1111",
            "rating": 4.88,
            "lead_time_days": 5,
            "is_active": True
        },
        {
            "id": "SUP-105",
            "name": "Global Lithium-Ion PowerCell Ltd",
            "category": "Raw Materials",
            "country": "South Korea",
            "city": "Ulsan",
            "contact_email": "powercell@lithiumchem.demo",
            "contact_phone": "+82 52 270 3114",
            "rating": 4.6,
            "lead_time_days": 18,
            "is_active": True
        },
        {
            "id": "SUP-106",
            "name": "TerraPure Organic Coffee & Commodities",
            "category": "Consumer Goods",
            "country": "Colombia",
            "city": "Medellín",
            "contact_email": "trade@terrapure.demo",
            "contact_phone": "+57 4 444 8900",
            "rating": 4.8,
            "lead_time_days": 9,
            "is_active": True
        }
    ]

def get_seed_inventory():
    now_iso = datetime.utcnow().isoformat()
    return [
        {
            "sku": "MED-VAC-001",
            "name": "CryoShield mRNA Vaccine Vial (Pack of 50)",
            "category": "Healthcare & Pharma",
            "warehouse_id": "WH-EU-01",
            "supplier_id": "SUP-104",
            "quantity": 18,  # Low stock
            "min_threshold": 30,
            "unit_price": 1250.00,
            "storage_temp_min_c": 2.0,
            "storage_temp_max_c": 8.0,
            "requires_cold_chain": True,
            "reorder_status": "REORDER_REQUIRED",
            "last_restocked": now_iso
        },
        {
            "sku": "MED-INS-002",
            "name": "BioPure Fast-Acting Insulin Syringes (Box 100)",
            "category": "Healthcare & Pharma",
            "warehouse_id": "WH-NA-01",
            "supplier_id": "SUP-102",
            "quantity": 140,
            "min_threshold": 50,
            "unit_price": 85.00,
            "storage_temp_min_c": 2.0,
            "storage_temp_max_c": 8.0,
            "requires_cold_chain": True,
            "reorder_status": "IN_STOCK",
            "last_restocked": now_iso
        },
        {
            "sku": "ELC-CHIP-701",
            "name": "QualCore AI Neural Processing Unit (NPU 4nm)",
            "category": "Electronics",
            "warehouse_id": "WH-APAC-01",
            "supplier_id": "SUP-101",
            "quantity": 520,
            "min_threshold": 100,
            "unit_price": 320.00,
            "storage_temp_min_c": 15.0,
            "storage_temp_max_c": 30.0,
            "requires_cold_chain": False,
            "reorder_status": "IN_STOCK",
            "last_restocked": now_iso
        },
        {
            "sku": "ELC-OLED-505",
            "name": "UltraRetina 6.7-inch 120Hz Flexible OLED Panel",
            "category": "Electronics",
            "warehouse_id": "WH-APAC-01",
            "supplier_id": "SUP-101",
            "quantity": 42,  # Low stock
            "min_threshold": 60,
            "unit_price": 115.00,
            "storage_temp_min_c": 10.0,
            "storage_temp_max_c": 35.0,
            "requires_cold_chain": False,
            "reorder_status": "REORDER_REQUIRED",
            "last_restocked": now_iso
        },
        {
            "sku": "AUTO-LIDAR-09",
            "name": "SolSolid Dynamic Automotive LiDAR Sensor Array",
            "category": "Automotive Components",
            "warehouse_id": "WH-NA-01",
            "supplier_id": "SUP-103",
            "quantity": 88,
            "min_threshold": 25,
            "unit_price": 840.00,
            "storage_temp_min_c": -10.0,
            "storage_temp_max_c": 50.0,
            "requires_cold_chain": False,
            "reorder_status": "IN_STOCK",
            "last_restocked": now_iso
        },
        {
            "sku": "AUTO-INV-404",
            "name": "Silicon Carbide EV Traction Inverter 800V",
            "category": "Automotive Components",
            "warehouse_id": "WH-EU-01",
            "supplier_id": "SUP-103",
            "quantity": 64,
            "min_threshold": 30,
            "unit_price": 1450.00,
            "storage_temp_min_c": 0.0,
            "storage_temp_max_c": 45.0,
            "requires_cold_chain": False,
            "reorder_status": "IN_STOCK",
            "last_restocked": now_iso
        },
        {
            "sku": "RAW-LITH-2170",
            "name": "High-Density Grade-A Lithium-Ion Cells (Pack 250)",
            "category": "Raw Materials",
            "warehouse_id": "WH-APAC-01",
            "supplier_id": "SUP-105",
            "quantity": 230,
            "min_threshold": 80,
            "unit_price": 580.00,
            "storage_temp_min_c": 15.0,
            "storage_temp_max_c": 25.0,
            "requires_cold_chain": False,
            "reorder_status": "IN_STOCK",
            "last_restocked": now_iso
        },
        {
            "sku": "CNS-COF-990",
            "name": "Highland Supremo Organic Green Coffee Beans (60kg Sacks)",
            "category": "Consumer Goods",
            "warehouse_id": "WH-LATAM-01",
            "supplier_id": "SUP-106",
            "quantity": 110,
            "min_threshold": 40,
            "unit_price": 280.00,
            "storage_temp_min_c": 18.0,
            "storage_temp_max_c": 24.0,
            "requires_cold_chain": False,
            "reorder_status": "IN_STOCK",
            "last_restocked": now_iso
        }
    ]

def get_seed_orders():
    now = datetime.utcnow()
    t_minus_2d = (now - timedelta(days=2)).isoformat()
    t_minus_1d = (now - timedelta(days=1)).isoformat()
    t_minus_4h = (now - timedelta(hours=4)).isoformat()
    t_plus_2d = (now + timedelta(days=2)).isoformat()

    return [
        {
            "id": "ORD-70891",
            "customer_name": "Apollo Global Health Networks",
            "customer_email": "procurement@apollohealth.demo",
            "destination_city": "Zurich",
            "destination_country": "Switzerland",
            "origin_warehouse_id": "WH-EU-01",
            "items": [
                {
                    "sku": "MED-VAC-001",
                    "name": "CryoShield mRNA Vaccine Vial (Pack of 50)",
                    "quantity": 10,
                    "unit_price": 1250.00
                }
            ],
            "total_amount": 12500.00,
            "status": "IN_TRANSIT",
            "tracking_number": "CC-AWS-8839210",
            "carrier": "ColdFlight Air Express",
            "requires_cold_chain": True,
            "current_location": "Basel Air Cargo Gateway, Switzerland",
            "latitude": 47.5596,
            "longitude": 7.5886,
            "estimated_delivery": t_plus_2d,
            "milestones": [
                {
                    "code": "PLACED",
                    "title": "Purchase Order Confirmed",
                    "location": "Frankfurt Central Hub",
                    "timestamp": t_minus_2d,
                    "description": "Order submitted and verified via DynamoDB.",
                    "completed": True
                },
                {
                    "code": "DISPATCHED",
                    "title": "Cryogenic Packing & Seal Verified",
                    "location": "Frankfurt Central Hub",
                    "timestamp": t_minus_1d,
                    "description": "Inspected at 4.2°C; packed in dry-ice thermal tote with IoT telemetry tag.",
                    "completed": True
                },
                {
                    "code": "IN_TRANSIT",
                    "title": "Cross-Border Transit Cleared",
                    "location": "Basel Air Cargo Gateway",
                    "timestamp": t_minus_4h,
                    "description": "Airway bill verified. Connected to refrigerated transit van #CH-401.",
                    "completed": True
                },
                {
                    "code": "OUT_FOR_DELIVERY",
                    "title": "Final Mile Distribution",
                    "location": "Zurich Hospital District",
                    "timestamp": "",
                    "description": "Awaiting local courier dispatch.",
                    "completed": False
                },
                {
                    "code": "DELIVERED",
                    "title": "Delivered & Proof of Cold-Chain Integrity Signed",
                    "location": "Apollo Central Clinic Zurich",
                    "timestamp": "",
                    "description": "Customer sign-off and temperature history archived in S3.",
                    "completed": False
                }
            ],
            "created_at": t_minus_2d,
            "updated_at": t_minus_4h
        },
        {
            "id": "ORD-70892",
            "customer_name": "Tesla NextGen Mobility Works",
            "customer_email": "logistics@teslamobility.demo",
            "destination_city": "Austin, TX",
            "destination_country": "United States",
            "origin_warehouse_id": "WH-NA-01",
            "items": [
                {
                    "sku": "AUTO-LIDAR-09",
                    "name": "SolSolid Dynamic Automotive LiDAR Sensor Array",
                    "quantity": 12,
                    "unit_price": 840.00
                }
            ],
            "total_amount": 10080.00,
            "status": "OUT_FOR_DELIVERY",
            "tracking_number": "CC-AWS-9120481",
            "carrier": "CloudChain Freight Intermodal",
            "requires_cold_chain": False,
            "current_location": "Austin Regional Logistics Hub, TX",
            "latitude": 30.2672,
            "longitude": -97.7431,
            "estimated_delivery": (now + timedelta(hours=5)).isoformat(),
            "milestones": [
                {
                    "code": "PLACED",
                    "title": "Order Placed",
                    "location": "Seattle Hub",
                    "timestamp": t_minus_2d,
                    "description": "Inventory reserved.",
                    "completed": True
                },
                {
                    "code": "DISPATCHED",
                    "title": "Dispatched via Interstate Express",
                    "location": "Seattle Hub",
                    "timestamp": t_minus_1d,
                    "description": "Pallet scanned onto Freight Truck #992.",
                    "completed": True
                },
                {
                    "code": "IN_TRANSIT",
                    "title": "Interstate Highway Transit",
                    "location": "Salt Lake City Transfer",
                    "timestamp": t_minus_1d,
                    "description": "Mid-point telemetry checkpoint passed.",
                    "completed": True
                },
                {
                    "code": "OUT_FOR_DELIVERY",
                    "title": "Out for Final Delivery",
                    "location": "Austin Regional Facility",
                    "timestamp": t_minus_4h,
                    "description": "Loaded on last-mile truck for delivery before 5:00 PM.",
                    "completed": True
                },
                {
                    "code": "DELIVERED",
                    "title": "Receipt Confirmation",
                    "location": "Giga Austin Facility Gate 4",
                    "timestamp": "",
                    "description": "Awaiting dock receipt signature.",
                    "completed": False
                }
            ],
            "created_at": t_minus_2d,
            "updated_at": t_minus_4h
        },
        {
            "id": "ORD-70893",
            "customer_name": "Foxconn Smart Manufacturing",
            "customer_email": "component-sourcing@foxconn.demo",
            "destination_city": "Shenzhen",
            "destination_country": "China",
            "origin_warehouse_id": "WH-APAC-01",
            "items": [
                {
                    "sku": "ELC-CHIP-701",
                    "name": "QualCore AI Neural Processing Unit (NPU 4nm)",
                    "quantity": 50,
                    "unit_price": 320.00
                }
            ],
            "total_amount": 16000.00,
            "status": "DELIVERED",
            "tracking_number": "CC-AWS-6712390",
            "carrier": "TransAsia Express",
            "requires_cold_chain": False,
            "current_location": "Shenzhen High-Tech Industrial Park",
            "latitude": 22.5431,
            "longitude": 114.0579,
            "estimated_delivery": t_minus_4h,
            "milestones": [
                {
                    "code": "PLACED",
                    "title": "Order Placed",
                    "location": "Singapore Port",
                    "timestamp": (now - timedelta(days=4)).isoformat(),
                    "description": "Direct fulfillment request.",
                    "completed": True
                },
                {
                    "code": "DISPATCHED",
                    "title": "Container Sealed & Shipped",
                    "location": "Singapore Port",
                    "timestamp": (now - timedelta(days=3)).isoformat(),
                    "description": "Loaded onto Flight SQ-882.",
                    "completed": True
                },
                {
                    "code": "CUSTOMS_CLEARED",
                    "title": "Customs Verification Complete",
                    "location": "Shenzhen Airport Customs",
                    "timestamp": (now - timedelta(days=1)).isoformat(),
                    "description": "Duties processed; S3 digital bill of lading accepted.",
                    "completed": True
                },
                {
                    "code": "OUT_FOR_DELIVERY",
                    "title": "Dispatched to Facility",
                    "location": "Shenzhen High-Tech Park",
                    "timestamp": (now - timedelta(hours=8)).isoformat(),
                    "description": "Van en route.",
                    "completed": True
                },
                {
                    "code": "DELIVERED",
                    "title": "Delivered & Accepted",
                    "location": "Foxconn Receiving Bay B",
                    "timestamp": t_minus_4h,
                    "description": "Dock manager Li Wei verified tamper seals.",
                    "completed": True
                }
            ],
            "created_at": (now - timedelta(days=4)).isoformat(),
            "updated_at": t_minus_4h
        },
        {
            "id": "ORD-70894",
            "customer_name": "Siemens Energy Automation",
            "customer_email": "logistics@siemensenergy.demo",
            "destination_city": "Munich",
            "destination_country": "Germany",
            "origin_warehouse_id": "WH-EU-01",
            "items": [
                {
                    "sku": "AUTO-INV-404",
                    "name": "Silicon Carbide EV Traction Inverter 800V",
                    "quantity": 4,
                    "unit_price": 1450.00
                }
            ],
            "total_amount": 5800.00,
            "status": "PROCESSING",
            "tracking_number": "CC-AWS-5501832",
            "carrier": "DHL Global Forwarding",
            "requires_cold_chain": False,
            "current_location": "Frankfurt Warehouse Loading Bay 3",
            "latitude": 50.1109,
            "longitude": 8.6821,
            "estimated_delivery": (now + timedelta(days=3)).isoformat(),
            "milestones": [
                {
                    "code": "PLACED",
                    "title": "Order Placed",
                    "location": "Frankfurt Central Hub",
                    "timestamp": t_minus_4h,
                    "description": "B2B contract order received.",
                    "completed": True
                },
                {
                    "code": "PROCESSING",
                    "title": "Warehouse Pick & Pack",
                    "location": "Frankfurt Central Hub",
                    "timestamp": now.isoformat(),
                    "description": "Robotic automated picking active.",
                    "completed": True
                },
                {
                    "code": "DISPATCHED",
                    "title": "Awaiting Carrier Pickup",
                    "location": "Frankfurt Central Hub",
                    "timestamp": "",
                    "description": "Scheduled pickup at 14:00 CET.",
                    "completed": False
                }
            ],
            "created_at": t_minus_4h,
            "updated_at": now.isoformat()
        }
    ]

def get_seed_telemetry():
    now = datetime.utcnow()
    return [
        {
            "order_id": "ORD-70891",
            "timestamp": now.isoformat(),
            "temperature_c": 4.6,  # Safe range is 2.0 to 8.0
            "humidity_pct": 42.1,
            "battery_pct": 94.0,
            "latitude": 47.5596,
            "longitude": 7.5886,
            "speed_kmh": 68.4,
            "status": "NORMAL",
            "message": "Cold-chain parameters well within safe compliance thresholds (2°C - 8°C)."
        },
        {
            "order_id": "ORD-70892",
            "timestamp": now.isoformat(),
            "temperature_c": 21.4,
            "humidity_pct": 38.0,
            "battery_pct": 88.5,
            "latitude": 30.2672,
            "longitude": -97.7431,
            "speed_kmh": 32.0,
            "status": "NORMAL",
            "message": "Standard ambient telemetry nominal."
        }
    ]

def get_seed_audit_logs():
    now = datetime.utcnow()
    return [
        {
            "id": "AUD-001",
            "timestamp": (now - timedelta(hours=6)).isoformat(),
            "event_type": "STOCK_ALERT",
            "entity_id": "MED-VAC-001",
            "description": "Inventory dropped to 18 units (Threshold: 30). Automated SNS reorder alert queued.",
            "source": "Inventory Engine",
            "severity": "WARNING"
        },
        {
            "id": "AUD-002",
            "timestamp": (now - timedelta(hours=4)).isoformat(),
            "event_type": "ORDER_DISPATCH",
            "entity_id": "ORD-70891",
            "description": "Order ORD-70891 dispatched with Cold-Chain sensor active. Manifest generated to S3.",
            "source": "Logistics Engine",
            "severity": "INFO"
        },
        {
            "id": "AUD-003",
            "timestamp": (now - timedelta(hours=1)).isoformat(),
            "event_type": "TELEMETRY_CHECK",
            "entity_id": "ORD-70891",
            "description": "IoT Heartbeat verified: Temperature 4.6°C within safety envelope (2.0°C - 8.0°C).",
            "source": "AWS IoT / SNS Bridge",
            "severity": "INFO"
        }
    ]
