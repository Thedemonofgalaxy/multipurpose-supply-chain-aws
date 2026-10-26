"""
AWS CloudChain SCM - Automated Test Suite
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.aws_services import aws_hub

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_data():
    """Ensure clean sample data before tests"""
    aws_hub.seed_data(force=True)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "service" in data

def test_inventory_list_and_metrics():
    # Test inventory list
    res = client.get("/api/inventory")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0

    # Test metrics
    res_m = client.get("/api/inventory/metrics")
    assert res_m.status_code == 200
    metrics = res_m.json()
    assert "total_valuation_usd" in metrics
    assert metrics["total_skus"] > 0
    assert metrics["total_valuation_usd"] > 0

def test_order_creation_and_stock_deduction():
    # Pick a product
    sku = "ELC-CHIP-701"
    initial_item = client.get(f"/api/inventory/{sku}").json()
    initial_qty = initial_item["quantity"]

    order_payload = {
        "customer_name": "Test Global Tech",
        "customer_email": "test@globaltech.demo",
        "destination_city": "Tokyo",
        "destination_country": "Japan",
        "origin_warehouse_id": "WH-APAC-01",
        "items": [
            {
                "sku": sku,
                "name": initial_item["name"],
                "quantity": 5,
                "unit_price": initial_item["unit_price"]
            }
        ]
    }

    # Create order
    res_order = client.post("/api/orders", json=order_payload)
    assert res_order.status_code == 200
    created_order = res_order.json()
    assert created_order["status"] == "PLACED"
    assert "ORD-" in created_order["id"]

    # Verify inventory was deducted by 5
    updated_item = client.get(f"/api/inventory/{sku}").json()
    assert updated_item["quantity"] == initial_qty - 5

def test_advance_milestone():
    # Get first order
    orders = client.get("/api/orders").json()
    assert len(orders) > 0
    target_order = orders[0]
    initial_status = target_order["status"]

    res_adv = client.post(f"/api/orders/{target_order['id']}/advance", json={})
    assert res_adv.status_code == 200
    adv_data = res_adv.json()
    assert "new_status" in adv_data

def test_cold_chain_telemetry_breach():
    # Trigger temperature spike
    spike_payload = {
        "order_id": "ORD-70891",
        "spike_temperature_c": 16.5
    }
    res = client.post("/api/telemetry/simulate-breach", json=spike_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "BREACH_SIMULATED"
    assert data["sns_alert_published"]["severity"] == "CRITICAL"

def test_s3_manifest_generation():
    # Generate S3 manifest for an order
    order_id = "ORD-70891"
    res = client.post(f"/api/manifests/generate/{order_id}")
    assert res.status_code == 200
    manifest_data = res.json()
    assert "s3_key" in manifest_data
    assert "download_url" in manifest_data

    # Download manifest from S3 endpoint
    download_res = client.get(manifest_data["download_url"])
    assert download_res.status_code == 200
    assert "AWS CloudChain SCM" in download_res.text
    assert order_id in download_res.text
