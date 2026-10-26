# AWS CloudChain SCM
### Enterprise Multipurpose Supply Chain & Logistics Cloud Management Platform

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![AWS Cloud](https://img.shields.io/badge/AWS-DynamoDB%20|%20S3%20|%20SNS%20|%20Lambda-FF9900.svg?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-Automated_CI%2FCD-2088FF.svg?style=flat&logo=github-actions&logoColor=white)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Executive Summary & Concept

**AWS CloudChain SCM** is a high-performance, working prototype of a **multipurpose supply chain management and logistics platform** built on **Amazon Web Services (AWS)**. It bridges multiple operational domains across the modern multi-echelon supply chain:

1. **Executive Control Tower:** Real-time visibility into inventory valuation, fulfillment velocity, active shipment volume, and automated cloud health telemetry.
2. **Multi-Location Inventory Management:** Dynamic stock monitoring across global logistics hubs (Seattle, Frankfurt, Singapore, São Paulo) with automated safety thresholds.
3. **End-to-End Shipment Milestone Tracking:** Lifecycle progression (`PLACED` ➔ `PROCESSING` ➔ `DISPATCHED` ➔ `IN_TRANSIT` ➔ `CUSTOMS_CLEARED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`).
4. **Cold-Chain IoT Sensor Telemetry:** Real-time temperature & humidity monitoring with automated anomaly detection for sensitive pharmaceuticals (e.g., mRNA vaccines) and high-value cargo.
5. **Amazon S3 Digital Manifest Archival:** Generation of cryptographically verifiable digital bills of lading and shipping manifests archived in Amazon S3.
6. **Amazon SNS Real-Time Alerting:** Event-driven notification broadcasts for inventory depletion and critical temperature breaches.

> **Zero-Friction Dual Cloud Engine:** Works instantly out-of-the-box with **zero AWS setup or cloud credit card needed** via a built-in Local Cloud Emulation engine, and switches to **Live AWS Cloud** seamlessly when AWS credentials are provided.

---

## 2. AWS Cloud Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend & Client Layer"]
        UI["Web Single Page Dashboard\n(Tailwind CSS + Chart.js + HTML5)"]
        API_DOCS["OpenAPI Swagger Docs\n(/docs)"]
    end

    subgraph AWSCloud["AWS Cloud Infrastructure"]
        APIGW["Amazon API Gateway\n(HTTP API)"]
        Lambda["AWS Lambda Function\n(Python 3.12 + Mangum ASGI)"]

        subgraph StorageLayer["Data & Persistence Layer"]
            DDB_INV[("Amazon DynamoDB\nscm-inventory")]
            DDB_ORD[("Amazon DynamoDB\nscm-orders")]
            DDB_SUP[("Amazon DynamoDB\nscm-suppliers")]
            DDB_TEL[("Amazon DynamoDB\nscm-telemetry")]
            DDB_AUD[("Amazon DynamoDB\nscm-audit-logs")]
        end

        subgraph DocumentStorage["Document & File Archival"]
            S3["Amazon S3 Bucket\nscm-shipping-manifests\n(Digital Bills of Lading)"]
        end

        subgraph EventLayer["Notification & Event Triggers"]
            SNS["Amazon SNS Topic\nscm-critical-alerts\n(Low Stock & Temp Spikes)"]
        end
    end

    UI -->|REST API Requests| APIGW
    API_DOCS -->|OpenAPI Calls| APIGW
    APIGW -->|Trigger| Lambda

    Lambda -->|Read / Write Inventory| DDB_INV
    Lambda -->|Order Milestones & Status| DDB_ORD
    Lambda -->|Supplier Records| DDB_SUP
    Lambda -->|IoT Telemetry Readings| DDB_TEL
    Lambda -->|Audit Trail Events| DDB_AUD

    Lambda -->|Upload HTML/PDF Manifests| S3
    Lambda -->|Publish Emergency Alerts| SNS
```

---

## 3. Key Operational Capabilities

| Capability | Purpose | AWS Service Used |
| :--- | :--- | :--- |
| **Multi-Hub Inventory** | Multi-warehouse stock tracking, auto safety thresholds, SKU cataloging | **Amazon DynamoDB** (`scm-inventory`) |
| **Order Lifecycle** | Milestone progression from purchase order to signed delivery receipt | **Amazon DynamoDB** (`scm-orders`) |
| **Cold-Chain IoT** | Active sensor telemetry (temp, humidity, battery, GPS) with spike anomaly tests | **Amazon DynamoDB** (`scm-telemetry`) |
| **Critical Alerts** | Real-time push notifications for low inventory and temperature violations | **Amazon SNS** (`scm-critical-alerts`) |
| **Digital Manifests** | Automated generation and storage of verifiable freight bills of lading | **Amazon S3** (`scm-shipping-manifests`) |
| **Audit Log Trail** | Immutable log of operational events, stock deductions, and dispatch actions | **Amazon DynamoDB** (`scm-audit-logs`) |
| **Serverless Backend**| Auto-scaling REST endpoints wrapped with ASGI Mangum adapter | **AWS Lambda** + **API Gateway** |

---

## 4. Quickstart Guide (Run Locally in 10 Seconds)

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/multipurpose-supply-chain-aws.git
cd multipurpose-supply-chain-aws
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Launch the Application
- **Windows (1-Click):** Double-click `run.bat` or run:
  ```cmd
  python app.py
  ```
- **macOS / Linux:**
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

Open your browser to:
- **Web Dashboard:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger REST API:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 5. Live Demonstration Walkthrough

When presenting or testing this prototype:

1. **Dashboard (Control Tower):**
   - View real-time KPI metrics (Inventory Valuation, Active Shipments, Low-Stock Warnings, Cold-Chain Status).
   - Review the **Shipment Pipeline** doughnut chart and **Inventory Units by Category** chart.
2. **Order Lifecycle & Milestone Advancement:**
   - Go to the **Orders & Shipments** tab.
   - Click **"Journey"** on any active order (e.g., `ORD-70891`).
   - Click **"Advance Milestone"** in the modal: watch the status transition in real time (`IN_TRANSIT` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`).
3. **Amazon S3 Manifest Generation:**
   - Click **"S3 Manifest"** on any order row.
   - The system formats a cryptographic Bill of Lading, uploads it to Amazon S3, and provides an immediate preview and download link!
4. **Cold-Chain IoT Sensor Stress Test:**
   - Go to the **Cold-Chain IoT** tab.
   - Click **"Simulate Temperature Breach (Spike)"**:
   - The temperature will spike above 8.0°C (e.g., to 15.4°C), the sensor card will flash red with alert status, and an automated emergency alert will be dispatched via **Amazon SNS** and logged to the audit stream!
5. **Stock Deduction & Restock:**
   - Click **"Create Order"** to purchase goods: notice that available stock in DynamoDB is immediately reduced. If it falls below the minimum safety threshold, a low-stock alert is generated.
   - Click **"+30 Restock"** in the **Inventory** tab to replenish units.

---

## 6. How to Deploy on GitHub

### Option A: Using the Automated Setup Script (Windows)
Double-click `setup_github.bat` in the project root. It will initialize Git, commit all files, and prompt for your repository URL.

### Option B: Using Git Command Line
```bash
# 1. Initialize Git repository
git init -b main

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "feat: initial commit of AWS CloudChain SCM multipurpose platform"

# 4. Link to your GitHub repository (create a new empty repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/multipurpose-supply-chain-aws.git

# 5. Push to GitHub
git push -u origin main
```

---

## 7. Connecting to Live AWS Cloud (Optional)

To connect the prototype to your actual AWS account:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Enter your AWS IAM Credentials:
   ```ini
   AWS_MODE=aws
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_DEFAULT_REGION=us-east-1
   ```
3. Run the automated resource provisioner to create the DynamoDB tables, S3 bucket, and SNS topic:
   ```bash
   python infrastructure/setup_aws.py
   ```
4. Restart the app (`python app.py`). The navbar will show **AWS Live: us-east-1**!

### Deploy via AWS SAM / CloudFormation:
```bash
cd infrastructure
sam build -t cloudformation.yaml
sam deploy --guided
```

### Deploy via Terraform:
```bash
cd infrastructure/terraform
terraform init
terraform apply
```

### Deploy via Docker:
```bash
docker-compose up --build
```

---

## 8. REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check & system diagnostics |
| `GET` | `/api/inventory` | List all inventory items with filtering |
| `GET` | `/api/inventory/metrics` | Inventory valuation & SKU summary stats |
| `POST`| `/api/inventory` | Register a new product SKU in DynamoDB |
| `POST`| `/api/inventory/restock` | Replenish stock count for a SKU |
| `GET` | `/api/orders` | List orders with optional status filters |
| `POST`| `/api/orders` | Create an order (reserves inventory in DynamoDB) |
| `POST`| `/api/orders/{id}/advance` | Advance shipment to next milestone |
| `GET` | `/api/telemetry` | List latest IoT sensor readings |
| `POST`| `/api/telemetry/simulate-breach` | Trigger cold-chain spike & SNS notification |
| `POST`| `/api/manifests/generate/{id}` | Generate digital manifest & store in S3 |
| `GET` | `/api/manifests/download/{key}`| Download manifest document from S3 |
| `GET` | `/api/cloud/status` | AWS connection health, region & table stats |
| `POST`| `/api/cloud/seed` | Reset and re-seed demo data |

---

## 9. Automated Testing

Execute the test suite with:
```bash
python -m pytest tests/ -v
```

All tests validate:
- System health check
- Inventory listing & financial valuation
- Order creation & inventory deduction
- Milestone progression
- Cold-chain temperature breach & SNS dispatch
- S3 manifest generation & retrieval

---

## 10. License
Distributed under the **MIT License**. See `LICENSE` for details.
