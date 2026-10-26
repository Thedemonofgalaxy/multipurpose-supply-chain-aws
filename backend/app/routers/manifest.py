"""
AWS CloudChain SCM - Amazon S3 Shipping Manifest & Bill of Lading Router
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import HTMLResponse
from typing import List, Optional
from backend.app.config import settings
from backend.app.aws_services import aws_hub

router = APIRouter(prefix="/api/manifests", tags=["S3 Shipping Manifests & Documents"])

def generate_manifest_html(order: dict) -> str:
    items_rows = ""
    for idx, item in enumerate(order.get("items", []), start=1):
        total = item.get("quantity", 0) * item.get("unit_price", 0)
        items_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">#{idx}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">{item.get('sku')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{item.get('name')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">{item.get('quantity')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.get('unit_price', 0):,.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${total:,.2f}</td>
        </tr>
        """

    cold_chain_badge = ""
    if order.get("requires_cold_chain"):
        cold_chain_badge = """
        <div style="background: #e0f2fe; border: 1px solid #38bdf8; color: #0369a1; padding: 10px 16px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            ❄️ COLD-CHAIN REGULATED CARGO: Requires continuous active temperature monitor between +2.0°C and +8.0°C.
        </div>
        """

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bill of Lading - {order.get('id')}</title>
    <style>
        body {{ font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 30px; line-height: 1.5; }}
        .manifest-card {{ max-width: 850px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; border: 1px solid #e2e8f0; }}
        .header {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }}
        .logo-title {{ font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }}
        .logo-sub {{ font-size: 13px; color: #64748b; font-weight: 500; }}
        .barcode-box {{ text-align: right; }}
        .barcode-svg {{ font-family: 'Courier New', Courier, monospace; letter-spacing: 5px; font-size: 18px; font-weight: bold; background: #f1f5f9; padding: 8px 16px; border-radius: 4px; display: inline-block; }}
        .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }}
        .meta-col {{ background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .meta-title {{ font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }}
        th {{ background: #0f172a; color: #ffffff; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }}
        .footer {{ margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }}
        .seal-box {{ border: 2px solid #0f172a; padding: 12px; text-align: center; border-radius: 8px; font-weight: bold; color: #0f172a; font-size: 11px; text-transform: uppercase; }}
    </style>
</head>
<body>
    <div class="manifest-card">
        <div class="header">
            <div>
                <div class="logo-title">AWS CloudChain SCM</div>
                <div class="logo-sub">GLOBAL INTERMODAL FREIGHT & LOGISTICS MANIFEST</div>
            </div>
            <div class="barcode-box">
                <div class="barcode-svg">||| | |||| | ||| | |||</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">TRACKING: {order.get('tracking_number')}</div>
            </div>
        </div>

        {cold_chain_badge}

        <div class="meta-grid">
            <div class="meta-col">
                <div class="meta-title">Shipper / Origin Facility</div>
                <div style="font-weight: 700; font-size: 15px;">Warehouse Hub: {order.get('origin_warehouse_id')}</div>
                <div style="color: #475569; font-size: 13px; margin-top: 4px;">AWS CloudChain Logistics Center</div>
                <div style="color: #475569; font-size: 13px;">Carrier: {order.get('carrier')}</div>
                <div style="color: #475569; font-size: 13px;">Dispatch Time: {order.get('created_at', '')[:16]}</div>
            </div>
            <div class="meta-col">
                <div class="meta-title">Consignee / Destination</div>
                <div style="font-weight: 700; font-size: 15px;">{order.get('customer_name')}</div>
                <div style="color: #475569; font-size: 13px; margin-top: 4px;">{order.get('destination_city')}, {order.get('destination_country')}</div>
                <div style="color: #475569; font-size: 13px;">Contact: {order.get('customer_email')}</div>
                <div style="color: #475569; font-size: 13px;">Status: <span style="font-weight: bold; color: #0284c7;">{order.get('status')}</span></div>
            </div>
        </div>

        <div style="margin-top: 20px;">
            <div style="font-weight: 700; font-size: 14px; text-transform: uppercase; color: #334155; margin-bottom: 8px;">Manifest Itemized Bill</div>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>SKU Number</th>
                        <th>Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Total (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    {items_rows}
                </tbody>
            </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <div style="width: 280px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                    <span>Freight Handling:</span>
                    <span>$0.00 (Standard)</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; border-top: 1px solid #cbd5e1; padding-top: 8px;">
                    <span>Total Valuation:</span>
                    <span>${order.get('total_amount', 0):,.2f}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div>
                <div><strong>Amazon S3 Cloud Key:</strong> manifests/{order.get('id')}_manifest.html</div>
                <div>Archived in Amazon S3 Bucket: {settings.S3_BUCKET_NAME}</div>
                <div>Security Verification Hash: SHA256-AUTHENTICATED</div>
            </div>
            <div class="seal-box">
                AWS CLOUDCHAIN<br>VERIFIED CARGO
            </div>
        </div>
    </div>
</body>
</html>
    """
    return html

@router.post("/generate/{order_id}")
def generate_and_store_manifest(order_id: str):
    order = aws_hub.get_item(settings.DYNAMODB_TABLE_ORDERS, order_id, "id")
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")

    html_content = generate_manifest_html(order)
    s3_key = f"manifests/{order_id}_manifest.html"
    
    # Store in S3
    s3_result = aws_hub.put_s3_file(
        key=s3_key,
        body=html_content.encode("utf-8"),
        content_type="text/html"
    )

    # Log to audit
    audit = {
        "id": f"AUD-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": "S3_MANIFEST_ARCHIVED",
        "entity_id": order_id,
        "description": f"Generated shipping manifest and archived to Amazon S3 key '{s3_key}' ({s3_result['size']} bytes).",
        "source": "Amazon S3 Archiver",
        "severity": "INFO"
    }
    aws_hub.put_item(settings.DYNAMODB_TABLE_AUDIT, audit, "id")

    return {
        "message": "Shipping manifest successfully generated and uploaded to Amazon S3.",
        "order_id": order_id,
        "s3_bucket": s3_result["bucket"],
        "s3_key": s3_key,
        "file_size_bytes": s3_result["size"],
        "download_url": s3_result["url"]
    }

@router.get("/list", response_model=List[dict])
def list_manifests():
    return aws_hub.list_s3_files()

@router.get("/download/{filename:path}")
def download_manifest(filename: str):
    data = aws_hub.get_s3_file(filename)
    if not data:
        # Try prepending manifests/ if not found
        data = aws_hub.get_s3_file(f"manifests/{filename}")
        
    if not data:
        raise HTTPException(status_code=404, detail=f"Manifest file '{filename}' not found in S3.")
        
    return HTMLResponse(content=data.decode("utf-8"))
