/**
 * AWS CloudChain SCM - Interactive Frontend Application Controller
 * Dual Mode: Live Backend API & Client-Side Browser Cloud Engine (GitHub Pages Zero-Install)
 */

const IS_GITHUB_PAGES = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

let state = {
    cloudStatus: null,
    orders: [],
    inventory: [],
    warehouses: [],
    suppliers: [],
    telemetry: [],
    auditLogs: [],
    s3Files: [],
    snsAlerts: [],
    selectedOrderId: null,
    activeTab: 'dashboard',
    isBrowserMode: false
};

let orderStatusChart = null;
let inventoryCategoryChart = null;

// =============================================================
// Seed Data for Browser Cloud Mode (GitHub Pages / Standalone)
// =============================================================
const DEFAULT_WAREHOUSES = [
    {
        "id": "WH-NA-01",
        "name": "North America Prime Hub (Seattle)",
        "region": "us-west-2",
        "country": "United States",
        "city": "Seattle, WA",
        "capacity_sqft": 450000,
        "current_utilization_pct": 74.2,
        "manager_name": "Elena Vance"
    },
    {
        "id": "WH-EU-01",
        "name": "Central European Gateway (Frankfurt)",
        "region": "eu-central-1",
        "country": "Germany",
        "city": "Frankfurt",
        "capacity_sqft": 380000,
        "current_utilization_pct": 68.5,
        "manager_name": "Klaus Weber"
    },
    {
        "id": "WH-APAC-01",
        "name": "Asia-Pacific Mega Logistics (Singapore)",
        "region": "ap-southeast-1",
        "country": "Singapore",
        "city": "Jurong Port",
        "capacity_sqft": 520000,
        "current_utilization_pct": 86.9,
        "manager_name": "Wei Chen"
    },
    {
        "id": "WH-LATAM-01",
        "name": "Latin America Distribution (São Paulo)",
        "region": "sa-east-1",
        "country": "Brazil",
        "city": "São Paulo",
        "capacity_sqft": 290000,
        "current_utilization_pct": 52.0,
        "manager_name": "Mateo Silva"
    }
];

const DEFAULT_SUPPLIERS = [
    {
        "id": "SUP-101",
        "name": "Pacific MicroSemiconductor Corp",
        "category": "Electronics",
        "country": "Taiwan",
        "city": "Hsinchu",
        "contact_email": "orders@pacificmicro.demo",
        "rating": 4.9,
        "lead_time_days": 12
    },
    {
        "id": "SUP-102",
        "name": "Nordic BioPharma Laboratories",
        "category": "Healthcare & Pharma",
        "country": "Denmark",
        "city": "Copenhagen",
        "contact_email": "supply@nordicbiopharma.demo",
        "rating": 4.95,
        "lead_time_days": 7
    },
    {
        "id": "SUP-103",
        "name": "Apex Advanced Mobility Systems",
        "category": "Automotive Components",
        "country": "Japan",
        "city": "Nagoya",
        "contact_email": "b2b@apexmobility.demo",
        "rating": 4.7,
        "lead_time_days": 15
    },
    {
        "id": "SUP-104",
        "name": "BioHealth CryoVaccine Tech",
        "category": "Healthcare & Pharma",
        "country": "Switzerland",
        "city": "Basel",
        "contact_email": "logistics@cryovaccine.demo",
        "rating": 4.88,
        "lead_time_days": 5
    },
    {
        "id": "SUP-105",
        "name": "Global Lithium-Ion PowerCell Ltd",
        "category": "Raw Materials",
        "country": "South Korea",
        "city": "Ulsan",
        "contact_email": "powercell@lithiumchem.demo",
        "rating": 4.6,
        "lead_time_days": 18
    },
    {
        "id": "SUP-106",
        "name": "TerraPure Organic Commodities",
        "category": "Consumer Goods",
        "country": "Colombia",
        "city": "Medellín",
        "contact_email": "trade@terrapure.demo",
        "rating": 4.8,
        "lead_time_days": 9
    }
];

const DEFAULT_INVENTORY = [
    {
        "sku": "MED-VAC-001",
        "name": "CryoShield mRNA Vaccine Vial (Pack of 50)",
        "category": "Healthcare & Pharma",
        "warehouse_id": "WH-EU-01",
        "supplier_id": "SUP-104",
        "quantity": 18,
        "min_threshold": 30,
        "unit_price": 1250.00,
        "requires_cold_chain": true,
        "reorder_status": "REORDER_REQUIRED"
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
        "requires_cold_chain": true,
        "reorder_status": "IN_STOCK"
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
        "requires_cold_chain": false,
        "reorder_status": "IN_STOCK"
    },
    {
        "sku": "ELC-OLED-505",
        "name": "UltraRetina 6.7-inch 120Hz Flexible OLED Panel",
        "category": "Electronics",
        "warehouse_id": "WH-APAC-01",
        "supplier_id": "SUP-101",
        "quantity": 42,
        "min_threshold": 60,
        "unit_price": 115.00,
        "requires_cold_chain": false,
        "reorder_status": "REORDER_REQUIRED"
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
        "requires_cold_chain": false,
        "reorder_status": "IN_STOCK"
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
        "requires_cold_chain": false,
        "reorder_status": "IN_STOCK"
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
        "requires_cold_chain": false,
        "reorder_status": "IN_STOCK"
    },
    {
        "sku": "CNS-COF-990",
        "name": "Highland Supremo Organic Coffee Beans (60kg)",
        "category": "Consumer Goods",
        "warehouse_id": "WH-LATAM-01",
        "supplier_id": "SUP-106",
        "quantity": 110,
        "min_threshold": 40,
        "unit_price": 280.00,
        "requires_cold_chain": false,
        "reorder_status": "IN_STOCK"
    }
];

const DEFAULT_ORDERS = [
    {
        "id": "ORD-70891",
        "customer_name": "Apollo Global Health Networks",
        "customer_email": "procurement@apollohealth.demo",
        "destination_city": "Zurich",
        "destination_country": "Switzerland",
        "origin_warehouse_id": "WH-EU-01",
        "items": [
            { "sku": "MED-VAC-001", "name": "CryoShield mRNA Vaccine Vial (Pack of 50)", "quantity": 10, "unit_price": 1250.00 }
        ],
        "total_amount": 12500.00,
        "status": "IN_TRANSIT",
        "tracking_number": "CC-AWS-8839210",
        "carrier": "ColdFlight Air Express",
        "requires_cold_chain": true,
        "current_location": "Basel Air Cargo Gateway, Switzerland",
        "milestones": [
            { "code": "PLACED", "title": "Purchase Order Confirmed", "location": "Frankfurt Central Hub", "timestamp": "2 days ago", "description": "Order submitted and verified via DynamoDB.", "completed": true },
            { "code": "PROCESSING", "title": "Cryogenic Packing & Seal Verified", "location": "Frankfurt Central Hub", "timestamp": "1 day ago", "description": "Packed in dry-ice thermal tote with IoT telemetry tag.", "completed": true },
            { "code": "DISPATCHED", "title": "Dispatched via Interstate Express", "location": "Frankfurt Air Gateway", "timestamp": "1 day ago", "description": "Loaded on refrigerated transport.", "completed": true },
            { "code": "IN_TRANSIT", "title": "Cross-Border Transit Cleared", "location": "Basel Air Cargo Gateway", "timestamp": "4 hours ago", "description": "Connected to refrigerated transit van #CH-401.", "completed": true },
            { "code": "OUT_FOR_DELIVERY", "title": "Final Mile Distribution", "location": "Zurich Hospital District", "timestamp": "", "description": "Awaiting local courier dispatch.", "completed": false },
            { "code": "DELIVERED", "title": "Delivered & Proof Signed", "location": "Apollo Central Clinic Zurich", "timestamp": "", "description": "Customer sign-off and temperature history archived in S3.", "completed": false }
        ]
    },
    {
        "id": "ORD-70892",
        "customer_name": "Tesla NextGen Mobility Works",
        "customer_email": "logistics@teslamobility.demo",
        "destination_city": "Austin, TX",
        "destination_country": "United States",
        "origin_warehouse_id": "WH-NA-01",
        "items": [
            { "sku": "AUTO-LIDAR-09", "name": "SolSolid Dynamic Automotive LiDAR Sensor", "quantity": 12, "unit_price": 840.00 }
        ],
        "total_amount": 10080.00,
        "status": "OUT_FOR_DELIVERY",
        "tracking_number": "CC-AWS-9120481",
        "carrier": "CloudChain Freight Intermodal",
        "requires_cold_chain": false,
        "current_location": "Austin Regional Logistics Hub, TX",
        "milestones": [
            { "code": "PLACED", "title": "Order Placed", "location": "Seattle Hub", "timestamp": "2 days ago", "description": "Inventory reserved.", "completed": true },
            { "code": "DISPATCHED", "title": "Dispatched Interstate", "location": "Seattle Hub", "timestamp": "1 day ago", "description": "Pallet scanned onto Freight Truck #992.", "completed": true },
            { "code": "IN_TRANSIT", "title": "Interstate Transit", "location": "Salt Lake City Transfer", "timestamp": "1 day ago", "description": "Mid-point telemetry checkpoint passed.", "completed": true },
            { "code": "OUT_FOR_DELIVERY", "title": "Out for Final Delivery", "location": "Austin Regional Facility", "timestamp": "4 hours ago", "description": "Loaded on last-mile truck for delivery.", "completed": true },
            { "code": "DELIVERED", "title": "Receipt Confirmation", "location": "Giga Austin Facility Gate 4", "timestamp": "", "description": "Awaiting dock receipt signature.", "completed": false }
        ]
    },
    {
        "id": "ORD-70893",
        "customer_name": "Foxconn Smart Manufacturing",
        "customer_email": "component-sourcing@foxconn.demo",
        "destination_city": "Shenzhen",
        "destination_country": "China",
        "origin_warehouse_id": "WH-APAC-01",
        "items": [
            { "sku": "ELC-CHIP-701", "name": "QualCore AI Neural Processing Unit", "quantity": 50, "unit_price": 320.00 }
        ],
        "total_amount": 16000.00,
        "status": "DELIVERED",
        "tracking_number": "CC-AWS-6712390",
        "carrier": "TransAsia Express",
        "requires_cold_chain": false,
        "current_location": "Shenzhen High-Tech Industrial Park",
        "milestones": [
            { "code": "PLACED", "title": "Order Placed", "location": "Singapore Port", "timestamp": "4 days ago", "description": "Fulfillment request accepted.", "completed": true },
            { "code": "DISPATCHED", "title": "Container Sealed", "location": "Singapore Port", "timestamp": "3 days ago", "description": "Loaded onto Flight SQ-882.", "completed": true },
            { "code": "CUSTOMS_CLEARED", "title": "Customs Verification", "location": "Shenzhen Airport", "timestamp": "1 day ago", "description": "Duties cleared via digital S3 manifest.", "completed": true },
            { "code": "DELIVERED", "title": "Delivered & Accepted", "location": "Foxconn Receiving Bay B", "timestamp": "4 hours ago", "description": "Dock manager verified tamper seal.", "completed": true }
        ]
    }
];

const DEFAULT_TELEMETRY = [
    {
        "order_id": "ORD-70891",
        "timestamp": new Date().toISOString(),
        "temperature_c": 4.6,
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
        "timestamp": new Date().toISOString(),
        "temperature_c": 21.4,
        "humidity_pct": 38.0,
        "battery_pct": 88.5,
        "latitude": 30.2672,
        "longitude": -97.7431,
        "speed_kmh": 32.0,
        "status": "NORMAL",
        "message": "Standard ambient telemetry nominal."
    }
];

const DEFAULT_AUDIT = [
    {
        "id": "AUD-001",
        "timestamp": new Date(Date.now() - 3600000 * 4).toISOString(),
        "event_type": "STOCK_ALERT",
        "entity_id": "MED-VAC-001",
        "description": "Inventory dropped to 18 units (Threshold: 30). Automated SNS reorder alert queued.",
        "severity": "WARNING"
    },
    {
        "id": "AUD-002",
        "timestamp": new Date(Date.now() - 3600000 * 2).toISOString(),
        "event_type": "ORDER_DISPATCH",
        "entity_id": "ORD-70891",
        "description": "Order ORD-70891 dispatched with Cold-Chain sensor active. Manifest archived in S3.",
        "severity": "INFO"
    },
    {
        "id": "AUD-003",
        "timestamp": new Date(Date.now() - 1800000).toISOString(),
        "event_type": "TELEMETRY_CHECK",
        "entity_id": "ORD-70891",
        "description": "IoT Heartbeat verified: Temperature 4.6°C within safety envelope (2.0°C - 8.0°C).",
        "severity": "INFO"
    }
];

const DEFAULT_SNS = [
    {
        "id": "SNS-ALT-001",
        "topic": "scm-critical-alerts",
        "timestamp": new Date().toISOString(),
        "subject": "⚠️ Low Stock Notice: MED-VAC-001",
        "message": "Inventory below minimum safe threshold (18/30 units). Automated supplier replenishment alert.",
        "severity": "WARNING"
    }
];

// =============================================================
// Browser Storage Helpers
// =============================================================
function getStorage(key, defaultVal) {
    try {
        const val = localStorage.getItem(`cloudchain_${key}`);
        return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
}

function setStorage(key, val) {
    try {
        localStorage.setItem(`cloudchain_${key}`, JSON.stringify(val));
    } catch (e) {}
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Detect whether we have a live backend or running on GitHub Pages
    try {
        const testRes = await fetch('/api/cloud/status', { method: 'GET', signal: AbortSignal.timeout(2000) });
        if (testRes.ok) {
            state.isBrowserMode = false;
        } else {
            state.isBrowserMode = true;
        }
    } catch (e) {
        state.isBrowserMode = true;
    }

    if (IS_GITHUB_PAGES) {
        state.isBrowserMode = true;
    }

    if (state.isBrowserMode) {
        initBrowserStorage();
    }

    await Promise.all([
        loadCloudStatus(),
        loadDashboardData(),
        loadWarehouses(),
        loadSuppliers(),
        loadTelemetry()
    ]);
    
    // Auto-refresh telemetry and audit
    setInterval(() => {
        loadTelemetry();
        loadAuditLogs();
    }, 15000);
}

function initBrowserStorage() {
    if (!localStorage.getItem('cloudchain_initialized')) {
        setStorage('inventory', DEFAULT_INVENTORY);
        setStorage('orders', DEFAULT_ORDERS);
        setStorage('suppliers', DEFAULT_SUPPLIERS);
        setStorage('warehouses', DEFAULT_WAREHOUSES);
        setStorage('telemetry', DEFAULT_TELEMETRY);
        setStorage('auditLogs', DEFAULT_AUDIT);
        setStorage('snsAlerts', DEFAULT_SNS);
        setStorage('s3Files', [
            {
                key: "manifests/ORD-70891_manifest.html",
                size: 4096,
                last_modified: new Date().toISOString(),
                url: "#"
            }
        ]);
        localStorage.setItem('cloudchain_initialized', 'true');
    }
}

// -------------------------------------------------------------
// Tab Switching
// -------------------------------------------------------------
function switchTab(tabId) {
    state.activeTab = tabId;
    const tabs = ['dashboard', 'shipments', 'inventory', 'telemetry', 'suppliers', 'cloud'];
    
    tabs.forEach(t => {
        const content = document.getElementById(`tab-content-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabId) {
            content.classList.remove('hidden');
            btn.classList.add('active', 'text-indigo-400', 'border-b-2', 'border-indigo-500');
            btn.classList.remove('text-slate-400');
        } else {
            content.classList.add('hidden');
            btn.classList.remove('active', 'text-indigo-400', 'border-b-2', 'border-indigo-500');
            btn.classList.add('text-slate-400');
        }
    });

    if (tabId === 'dashboard') loadDashboardData();
    if (tabId === 'shipments') loadOrders();
    if (tabId === 'inventory') loadInventory();
    if (tabId === 'telemetry') loadTelemetry();
    if (tabId === 'suppliers') loadSuppliers();
    if (tabId === 'cloud') loadCloudDetails();
}

// -------------------------------------------------------------
// API / Local Storage Loaders
// -------------------------------------------------------------
async function loadCloudStatus() {
    const badge = document.getElementById('cloud-mode-text');
    const pill = document.getElementById('aws-mode-pill');

    if (state.isBrowserMode) {
        state.cloudStatus = {
            mode: "GITHUB_PAGES_LIVE_DEMO",
            is_live_aws: false,
            region: "us-east-1 (Cloud Simulation)",
            s3_bucket: "scm-manifests-global-demo",
            sns_topic: "scm-critical-alerts",
            counts: {
                inventory: getStorage('inventory', DEFAULT_INVENTORY).length,
                orders: getStorage('orders', DEFAULT_ORDERS).length,
                suppliers: getStorage('suppliers', DEFAULT_SUPPLIERS).length,
                telemetry: getStorage('telemetry', DEFAULT_TELEMETRY).length,
                audit: getStorage('auditLogs', DEFAULT_AUDIT).length
            }
        };
        badge.innerHTML = `<span class="text-emerald-400 font-bold"><i class="fa-brands fa-aws"></i> Live Web Demo</span> (Zero-Install)`;
        if (pill) pill.innerText = `GitHub Pages Demo Mode`;
        return;
    }

    try {
        const res = await fetch('/api/cloud/status');
        const data = await res.json();
        state.cloudStatus = data;

        if (data.is_live_aws) {
            badge.innerHTML = `<span class="text-emerald-400 font-bold">AWS Live</span>: ${data.region}`;
            if (pill) pill.innerText = `Live AWS: ${data.region}`;
        } else {
            badge.innerHTML = `<span class="text-indigo-300 font-bold">AWS Local Emulation</span>`;
            if (pill) pill.innerText = `Zero-Config Local Cloud`;
        }
    } catch (e) {
        state.isBrowserMode = true;
        loadCloudStatus();
    }
}

async function loadDashboardData() {
    let invMetrics, orderMetrics;

    if (state.isBrowserMode) {
        const inv = getStorage('inventory', DEFAULT_INVENTORY);
        const ord = getStorage('orders', DEFAULT_ORDERS);

        const totalVal = inv.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
        const lowStock = inv.filter(i => i.quantity <= i.min_threshold).length;
        const inTransit = ord.filter(o => ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DISPATCHED'].includes(o.status)).length;
        const delivered = ord.filter(o => o.status === 'DELIVERED').length;
        const totalRev = ord.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        invMetrics = {
            total_skus: inv.length,
            total_valuation_usd: Math.round(totalVal),
            low_stock_count: lowStock
        };

        orderMetrics = {
            active_shipments: inTransit,
            delivered_orders: delivered,
            processing_orders: ord.length - inTransit - delivered,
            fulfillment_rate_pct: ord.length > 0 ? Math.round((delivered / ord.length) * 100) : 100
        };
    } else {
        try {
            const [invRes, orderRes] = await Promise.all([
                fetch('/api/inventory/metrics'),
                fetch('/api/orders/metrics/summary')
            ]);
            invMetrics = await invRes.json();
            orderMetrics = await orderRes.json();
        } catch (e) {
            state.isBrowserMode = true;
            return loadDashboardData();
        }
    }

    // Update metric cards
    document.getElementById('metric-valuation').innerText = `$${invMetrics.total_valuation_usd.toLocaleString()}`;
    document.getElementById('metric-skus').innerText = invMetrics.total_skus;
    document.getElementById('metric-active-shipments').innerText = orderMetrics.active_shipments;
    document.getElementById('metric-fulfillment-rate').innerText = `${orderMetrics.fulfillment_rate_pct}%`;
    document.getElementById('metric-low-stock').innerText = invMetrics.low_stock_count;

    renderCharts(orderMetrics, invMetrics);
    loadAuditLogs();
    loadOrders();
    loadInventory();
}

async function loadWarehouses() {
    if (state.isBrowserMode) {
        state.warehouses = getStorage('warehouses', DEFAULT_WAREHOUSES);
    } else {
        try {
            const res = await fetch('/api/inventory/warehouses/list');
            state.warehouses = await res.json();
        } catch (e) {
            state.warehouses = DEFAULT_WAREHOUSES;
        }
    }
    renderWarehouses();
}

async function loadOrders(statusFilter = null) {
    if (state.isBrowserMode) {
        let all = getStorage('orders', DEFAULT_ORDERS);
        if (statusFilter && statusFilter !== 'ALL') {
            all = all.filter(o => o.status === statusFilter);
        }
        state.orders = all;
    } else {
        try {
            let url = '/api/orders';
            if (statusFilter && statusFilter !== 'ALL') url += `?status=${statusFilter}`;
            const res = await fetch(url);
            state.orders = await res.json();
        } catch (e) {
            state.orders = getStorage('orders', DEFAULT_ORDERS);
        }
    }
    renderOrders();
}

async function loadInventory(cat = '') {
    if (state.isBrowserMode) {
        let all = getStorage('inventory', DEFAULT_INVENTORY);
        if (cat) all = all.filter(i => i.category === cat);
        state.inventory = all;
    } else {
        try {
            let url = '/api/inventory';
            if (cat) url += `?category=${encodeURIComponent(cat)}`;
            const res = await fetch(url);
            state.inventory = await res.json();
        } catch (e) {
            state.inventory = getStorage('inventory', DEFAULT_INVENTORY);
        }
    }
    renderInventory();
    populateOrderProductSelect();
}

async function loadSuppliers() {
    if (state.isBrowserMode) {
        state.suppliers = getStorage('suppliers', DEFAULT_SUPPLIERS);
    } else {
        try {
            const res = await fetch('/api/suppliers');
            state.suppliers = await res.json();
        } catch (e) {
            state.suppliers = DEFAULT_SUPPLIERS;
        }
    }
    renderSuppliers();
}

async function loadTelemetry() {
    if (state.isBrowserMode) {
        state.telemetry = getStorage('telemetry', DEFAULT_TELEMETRY);
    } else {
        try {
            const res = await fetch('/api/telemetry');
            state.telemetry = await res.json();
        } catch (e) {
            state.telemetry = getStorage('telemetry', DEFAULT_TELEMETRY);
        }
    }
    renderTelemetry();
}

async function loadAuditLogs() {
    if (state.isBrowserMode) {
        state.auditLogs = getStorage('auditLogs', DEFAULT_AUDIT);
    } else {
        try {
            const res = await fetch('/api/cloud/audit-logs');
            state.auditLogs = await res.json();
        } catch (e) {
            state.auditLogs = getStorage('auditLogs', DEFAULT_AUDIT);
        }
    }
    renderAuditLogs();
}

async function loadCloudDetails() {
    await loadCloudStatus();
    if (state.isBrowserMode) {
        state.s3Files = getStorage('s3Files', []);
        state.snsAlerts = getStorage('snsAlerts', DEFAULT_SNS);
        const inv = getStorage('inventory', DEFAULT_INVENTORY);
        const ord = getStorage('orders', DEFAULT_ORDERS);
        const sup = getStorage('suppliers', DEFAULT_SUPPLIERS);
        const tel = getStorage('telemetry', DEFAULT_TELEMETRY);
        const aud = getStorage('auditLogs', DEFAULT_AUDIT);

        document.getElementById('cnt-inv').innerText = inv.length;
        document.getElementById('cnt-ord').innerText = ord.length;
        document.getElementById('cnt-sup').innerText = sup.length;
        document.getElementById('cnt-tel').innerText = tel.length;
        document.getElementById('cnt-aud').innerText = aud.length;
        document.getElementById('cloud-s3-count').innerText = `${state.s3Files.length} Manifests`;
        document.getElementById('cloud-sns-count').innerText = `${state.snsAlerts.length} Messages`;
    } else {
        try {
            const [filesRes, alertsRes] = await Promise.all([
                fetch('/api/manifests/list'),
                fetch('/api/cloud/alerts')
            ]);
            state.s3Files = await filesRes.json();
            state.snsAlerts = await alertsRes.json();

            if (state.cloudStatus && state.cloudStatus.counts) {
                const c = state.cloudStatus.counts;
                document.getElementById('cnt-inv').innerText = c.inventory;
                document.getElementById('cnt-ord').innerText = c.orders;
                document.getElementById('cnt-sup').innerText = c.suppliers;
                document.getElementById('cnt-tel').innerText = c.telemetry;
                document.getElementById('cnt-aud').innerText = c.audit;
                document.getElementById('cloud-s3-count').innerText = `${state.s3Files.length} Manifests`;
                document.getElementById('cloud-sns-count').innerText = `${state.snsAlerts.length} Messages`;
            }
        } catch (e) {
            state.isBrowserMode = true;
            return loadCloudDetails();
        }
    }
    renderS3Files();
    renderSnsAlerts();
}

// -------------------------------------------------------------
// Render UI Components
// -------------------------------------------------------------
function renderCharts(orderMetrics, invMetrics) {
    const ctxOrder = document.getElementById('orderStatusChart').getContext('2d');
    if (orderStatusChart) orderStatusChart.destroy();
    
    orderStatusChart = new Chart(ctxOrder, {
        type: 'doughnut',
        data: {
            labels: ['Delivered', 'In Transit / Hub', 'Processing / Placed'],
            datasets: [{
                data: [
                    orderMetrics.delivered_orders || 1,
                    orderMetrics.active_shipments || 1,
                    orderMetrics.processing_orders || 1
                ],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } }
            },
            cutout: '70%'
        }
    });

    const ctxInv = document.getElementById('inventoryCategoryChart').getContext('2d');
    if (inventoryCategoryChart) inventoryCategoryChart.destroy();

    inventoryCategoryChart = new Chart(ctxInv, {
        type: 'bar',
        data: {
            labels: ['Elec', 'Pharma', 'Auto', 'Cons', 'Raw'],
            datasets: [{
                label: 'SKUs',
                data: [3, 2, 2, 1, 1],
                backgroundColor: '#6366f1',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8', precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

function renderWarehouses() {
    const grid = document.getElementById('warehouses-snapshot-grid');
    if (!grid) return;
    grid.innerHTML = state.warehouses.map(w => `
        <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div class="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>${w.name}</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">${w.region}</span>
            </div>
            <div class="mt-2 text-xs text-slate-400">${w.city}, ${w.country}</div>
            <div class="mt-3">
                <div class="flex justify-between text-[11px] mb-1">
                    <span class="text-slate-400">Capacity Utilization</span>
                    <span class="font-bold text-indigo-400">${w.current_utilization_pct}%</span>
                </div>
                <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-indigo-500 h-full rounded-full" style="width: ${w.current_utilization_pct}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    if (state.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">No shipments found.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.orders.map(o => {
        const isCold = o.requires_cold_chain;

        let statusBadge = '';
        if (o.status === 'DELIVERED') {
            statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max"><i class="fa-solid fa-circle-check"></i> Delivered</span>`;
        } else if (o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY') {
            statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-max"><i class="fa-solid fa-truck-fast"></i> ${o.status.replace('_', ' ')}</span>`;
        } else {
            statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max"><i class="fa-solid fa-clock"></i> ${o.status}</span>`;
        }

        const itemsSummary = o.items.map(i => `${i.quantity}x ${i.name.substring(0, 24)}...`).join('<br>');

        return `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="p-3.5">
                    <div class="font-bold text-slate-200">${o.id}</div>
                    <div class="text-[11px] font-mono text-slate-400">${o.tracking_number}</div>
                    ${isCold ? '<span class="text-[10px] text-cyan-400 font-bold flex items-center gap-1 mt-0.5"><i class="fa-solid fa-snowflake"></i> Cold-Chain</span>' : ''}
                </td>
                <td class="p-3.5">
                    <div class="font-medium text-slate-200">${o.customer_name}</div>
                    <div class="text-[11px] text-slate-400">${o.destination_city}, ${o.destination_country}</div>
                </td>
                <td class="p-3.5">
                    <div class="text-[11px] text-slate-300 leading-tight">${itemsSummary}</div>
                    <div class="text-xs font-bold text-emerald-400 mt-1">$${o.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </td>
                <td class="p-3.5">${statusBadge}</td>
                <td class="p-3.5">
                    <div class="text-xs text-slate-300">${o.current_location}</div>
                    <div class="text-[10px] text-slate-500 font-mono">Carrier: ${o.carrier}</div>
                </td>
                <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                    <button onclick="openJourneyModal('${o.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 text-xs font-semibold" title="View Milestone Timeline">
                        <i class="fa-solid fa-route"></i> Journey
                    </button>
                    <button onclick="generateS3Manifest('${o.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold" title="Archive Bill of Lading to Amazon S3">
                        <i class="fa-solid fa-file-invoice"></i> S3 Manifest
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    if (state.inventory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">No inventory products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.inventory.map(i => {
        const isLow = i.quantity <= i.min_threshold;
        const statusBadge = isLow
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">REORDER NEEDED</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">IN STOCK</span>`;

        return `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="p-3.5">
                    <div class="font-mono font-bold text-slate-200">${i.sku}</div>
                    <div class="text-[11px] text-slate-400">${i.name}</div>
                    ${i.requires_cold_chain ? '<span class="text-[10px] text-cyan-400 font-semibold"><i class="fa-solid fa-snowflake"></i> 2°C - 8°C</span>' : ''}
                </td>
                <td class="p-3.5 text-xs text-slate-300">${i.category}</td>
                <td class="p-3.5 font-mono text-xs text-slate-300">${i.warehouse_id}</td>
                <td class="p-3.5">
                    <div class="flex items-center gap-2">
                        <span class="font-bold ${isLow ? 'text-rose-400' : 'text-slate-200'}">${i.quantity}</span>
                        <span class="text-[10px] text-slate-500">/ min ${i.min_threshold}</span>
                    </div>
                </td>
                <td class="p-3.5 text-xs font-bold text-emerald-400">$${i.unit_price.toFixed(2)}</td>
                <td class="p-3.5">${statusBadge}</td>
                <td class="p-3.5 text-right">
                    <button onclick="quickRestock('${i.sku}', 30)" class="px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition">
                        +30 Restock
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTelemetry() {
    const grid = document.getElementById('telemetry-cards-grid');
    if (!grid) return;

    if (state.telemetry.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-center py-10 text-slate-500">No active telemetry sensors.</div>`;
        return;
    }

    grid.innerHTML = state.telemetry.map(t => {
        const isSpike = t.status === 'TEMP_BREACH_HIGH' || t.status === 'TEMP_BREACH_LOW';
        const tempColor = isSpike ? 'text-rose-400' : 'text-cyan-400';
        const cardBorder = isSpike ? 'border-rose-500/60 shadow-lg shadow-rose-900/30' : 'border-slate-800';

        return `
            <div class="glass-panel p-5 border ${cardBorder}">
                <div class="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-bold text-white">${t.order_id}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isSpike ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-cyan-500/10 text-cyan-400'}">
                                ${t.status}
                            </span>
                        </div>
                        <div class="text-[11px] text-slate-400 mt-1">IoT Node: GPS Sensor #884-AWS</div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-black ${tempColor}">${t.temperature_c}°C</div>
                        <div class="text-[10px] text-slate-500">Threshold: 2.0°C - 8.0°C</div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3 my-4 text-center">
                    <div class="bg-slate-900/60 p-2 rounded-lg">
                        <div class="text-[10px] text-slate-400">Relative Humidity</div>
                        <div class="font-bold text-slate-200 mt-0.5">${t.humidity_pct}%</div>
                    </div>
                    <div class="bg-slate-900/60 p-2 rounded-lg">
                        <div class="text-[10px] text-slate-400">Battery Level</div>
                        <div class="font-bold text-slate-200 mt-0.5">${t.battery_pct}%</div>
                    </div>
                    <div class="bg-slate-900/60 p-2 rounded-lg">
                        <div class="text-[10px] text-slate-400">Transit Speed</div>
                        <div class="font-bold text-slate-200 mt-0.5">${t.speed_kmh} km/h</div>
                    </div>
                </div>

                <div class="text-xs ${isSpike ? 'text-rose-300 font-bold' : 'text-slate-400'} bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <i class="fa-solid fa-satellite-dish mr-1"></i> ${t.message || 'Telemetry nominal'}
                </div>
            </div>
        `;
    }).join('');
}

function renderSuppliers() {
    const grid = document.getElementById('suppliers-grid');
    if (!grid) return;

    grid.innerHTML = state.suppliers.map(s => `
        <div class="glass-panel p-5">
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="font-bold text-white text-sm">${s.name}</h3>
                    <div class="text-[11px] text-slate-400 font-mono">${s.city}, ${s.country}</div>
                </div>
                <div class="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                    <i class="fa-solid fa-star"></i> ${s.rating}
                </div>
            </div>

            <div class="mt-4 space-y-1.5 text-xs text-slate-300">
                <div class="flex justify-between">
                    <span class="text-slate-400">Specialization:</span>
                    <span class="font-medium">${s.category}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Avg Lead Time:</span>
                    <span class="font-bold text-indigo-400">${s.lead_time_days} Days</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Procurement Email:</span>
                    <span class="font-mono text-[11px] text-slate-300">${s.contact_email}</span>
                </div>
            </div>

            <button onclick="promptPurchaseOrder('${s.id}', '${s.name}')" class="w-full mt-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-file-signature"></i> Issue Purchase Order
            </button>
        </div>
    `).join('');
}

function renderAuditLogs() {
    const container = document.getElementById('audit-log-container');
    if (!container) return;

    if (state.auditLogs.length === 0) {
        container.innerHTML = `<div class="text-slate-500 italic text-center py-4">No events logged.</div>`;
        return;
    }

    container.innerHTML = state.auditLogs.slice(0, 15).map(log => {
        let icon = '<i class="fa-solid fa-info text-blue-400"></i>';
        if (log.severity === 'WARNING') icon = '<i class="fa-solid fa-triangle-exclamation text-amber-400"></i>';
        if (log.severity === 'CRITICAL') icon = '<i class="fa-solid fa-circle-exclamation text-rose-400"></i>';

        const timeStr = log.timestamp.includes('T') ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : log.timestamp;

        return `
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
                <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span class="font-bold flex items-center gap-1.5">${icon} ${log.event_type}</span>
                    <span class="font-mono">${timeStr}</span>
                </div>
                <div class="text-[11px] text-slate-300 leading-snug">${log.description}</div>
            </div>
        `;
    }).join('');
}

function renderS3Files() {
    const list = document.getElementById('s3-files-list');
    if (!list) return;

    if (state.s3Files.length === 0) {
        list.innerHTML = `<div class="text-slate-500 italic text-center py-8">No S3 manifests generated yet.</div>`;
        return;
    }

    list.innerHTML = state.s3Files.map(f => `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-file-code text-emerald-400 text-sm"></i>
                <div>
                    <div class="font-mono text-slate-200 text-xs font-semibold">${f.key}</div>
                    <div class="text-[10px] text-slate-400">${(f.size / 1024).toFixed(1)} KB • AWS S3 Standard</div>
                </div>
            </div>
            <a href="${f.url}" target="_blank" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold border border-slate-700">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
            </a>
        </div>
    `).join('');
}

function renderSnsAlerts() {
    const list = document.getElementById('sns-alerts-list');
    if (!list) return;

    if (state.snsAlerts.length === 0) {
        list.innerHTML = `<div class="text-slate-500 italic text-center py-8">No alerts.</div>`;
        return;
    }

    list.innerHTML = state.snsAlerts.map(a => `
        <div class="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <div class="flex items-center justify-between text-[11px] font-bold text-rose-400">
                <span>${a.subject}</span>
                <span class="text-[10px] font-mono text-slate-500">${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="text-xs text-slate-300 mt-1">${a.message}</div>
        </div>
    `).join('');
}

function populateOrderProductSelect() {
    const sel = document.getElementById('order-product-select');
    if (!sel) return;
    sel.innerHTML = state.inventory.map(i => `
        <option value="${i.sku}" data-price="${i.unit_price}">${i.sku} - ${i.name} ($${i.unit_price})</option>
    `).join('');
}

// -------------------------------------------------------------
// Interactive Operations (Milestones, S3, Restock, Alerts)
// -------------------------------------------------------------
async function openJourneyModal(orderId) {
    state.selectedOrderId = orderId;
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('journey-order-id').innerText = `${order.id} • Tracking: ${order.tracking_number}`;
    const container = document.getElementById('journey-stepper-container');

    container.innerHTML = order.milestones.map((m, idx) => {
        const isDone = m.completed;
        const icon = isDone
            ? '<i class="fa-solid fa-check text-emerald-400"></i>'
            : '<i class="fa-solid fa-circle-notch text-slate-500"></i>';

        return `
            <div class="timeline-step ${isDone ? 'completed' : ''} flex items-start gap-3">
                <div class="w-8 h-8 rounded-full ${isDone ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-slate-800 border border-slate-700'} flex items-center justify-center shrink-0 text-xs">
                    ${icon}
                </div>
                <div>
                    <div class="text-xs font-bold ${isDone ? 'text-white' : 'text-slate-400'}">${m.title}</div>
                    <div class="text-[11px] text-slate-400">${m.location} ${m.timestamp ? '• ' + m.timestamp : ''}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">${m.description}</div>
                </div>
            </div>
        `;
    }).join('');

    const btn = document.getElementById('btn-advance-milestone');
    if (order.status === 'DELIVERED') {
        btn.disabled = true;
        btn.innerText = "Order Completed (Delivered)";
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-forward-step"></i> Advance to Next Milestone`;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    document.getElementById('modal-journey').classList.remove('hidden');
}

function closeJourneyModal() {
    document.getElementById('modal-journey').classList.add('hidden');
}

async function executeAdvanceMilestone() {
    if (!state.selectedOrderId) return;
    const order = state.orders.find(o => o.id === state.selectedOrderId);
    if (!order) return;

    if (state.isBrowserMode) {
        const progression = ['PLACED', 'PROCESSING', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        let idx = progression.indexOf(order.status);
        if (idx < progression.length - 1) {
            idx++;
            const newStatus = progression[idx];
            order.status = newStatus;
            
            // Mark next milestone as completed
            const nextMilestone = order.milestones.find(m => m.code === newStatus || (!m.completed && m.title));
            if (nextMilestone) {
                nextMilestone.completed = true;
                nextMilestone.timestamp = new Date().toLocaleTimeString();
            }

            // Save to localStorage
            const orders = getStorage('orders', DEFAULT_ORDERS);
            const foundIdx = orders.findIndex(o => o.id === order.id);
            if (foundIdx >= 0) orders[foundIdx] = order;
            setStorage('orders', orders);

            // Add audit log
            const auditLogs = getStorage('auditLogs', DEFAULT_AUDIT);
            auditLogs.unshift({
                id: `AUD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                timestamp: new Date().toISOString(),
                event_type: "SHIPMENT_MILESTONE_UPDATED",
                description: `Shipment ${order.id} advanced to milestone '${newStatus}'.`,
                severity: "INFO"
            });
            setStorage('auditLogs', auditLogs);

            await loadOrders();
            await loadDashboardData();
            openJourneyModal(state.selectedOrderId);
        }
        return;
    }

    try {
        const res = await fetch(`/api/orders/${state.selectedOrderId}/advance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        await res.json();
        await loadOrders();
        await loadDashboardData();
        openJourneyModal(state.selectedOrderId);
    } catch (e) {
        alert("Failed to advance milestone: " + e);
    }
}

async function generateS3Manifest(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    if (state.isBrowserMode) {
        // Generate manifest document locally as a downloadable Blob
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bill of Lading - ${order.id}</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
        .card { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
        h1 { color: #38bdf8; margin-bottom: 4px; }
        .badge { background: #0369a1; padding: 6px 12px; border-radius: 6px; font-weight: bold; display: inline-block; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; }
        th { background: #0f172a; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <h1>AWS CloudChain SCM - Official Bill of Lading</h1>
        <div style="color: #94a3b8;">Order ID: ${order.id} | Tracking: ${order.tracking_number}</div>
        <div class="badge">Amazon S3 Verified Freight Document</div>

        <div style="margin-top: 25px;">
            <p><strong>Shipper Origin:</strong> ${order.origin_warehouse_id} Logistics Center</p>
            <p><strong>Consignee:</strong> ${order.customer_name} (${order.destination_city}, ${order.destination_country})</p>
            <p><strong>Carrier:</strong> ${order.carrier}</p>
            <p><strong>Status:</strong> ${order.status}</p>
        </div>

        <table>
            <thead>
                <tr><th>SKU</th><th>Description</th><th>Qty</th><th>Price</th></tr>
            </thead>
            <tbody>
                ${order.items.map(i => `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.quantity}</td><td>$${i.unit_price}</td></tr>`).join('')}
            </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #38bdf8;">
            Total Valuation: $${order.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </div>
        <div style="margin-top: 30px; font-size: 11px; color: #64748b;">
            Archived in Amazon S3 Bucket: scm-manifests-global-demo | Object Key: manifests/${order.id}_manifest.html
        </div>
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const s3Files = getStorage('s3Files', []);
        s3Files.unshift({
            key: `manifests/${order.id}_manifest.html`,
            size: html.length,
            last_modified: new Date().toISOString(),
            url: url
        });
        setStorage('s3Files', s3Files);

        alert(`Document generated in Amazon S3!\nS3 Key: manifests/${order.id}_manifest.html\nBucket: scm-shipping-manifests`);
        window.open(url, '_blank');
        loadCloudDetails();
        return;
    }

    try {
        const res = await fetch(`/api/manifests/generate/${orderId}`, { method: 'POST' });
        const data = await res.json();
        alert(`Document generated in Amazon S3!\nS3 Key: ${data.s3_key}\nBucket: ${data.s3_bucket}`);
        window.open(data.download_url, '_blank');
        loadCloudDetails();
    } catch (e) {
        alert("Error generating S3 manifest: " + e);
    }
}

async function quickRestock(sku, qty) {
    if (state.isBrowserMode) {
        const inv = getStorage('inventory', DEFAULT_INVENTORY);
        const item = inv.find(i => i.sku === sku);
        if (item) {
            item.quantity += qty;
            if (item.quantity > item.min_threshold) item.reorder_status = "IN_STOCK";
            setStorage('inventory', inv);

            const auditLogs = getStorage('auditLogs', DEFAULT_AUDIT);
            auditLogs.unshift({
                id: `AUD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                timestamp: new Date().toISOString(),
                event_type: "STOCK_REPLENISHED",
                description: `Restocked ${qty} units for SKU ${sku}. New balance: ${item.quantity}.`,
                severity: "INFO"
            });
            setStorage('auditLogs', auditLogs);

            alert(`Restocked! ${sku} new stock: ${item.quantity}`);
            loadInventory();
            loadDashboardData();
        }
        return;
    }

    try {
        const res = await fetch('/api/inventory/restock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sku: sku, quantity: qty })
        });
        const data = await res.json();
        alert(`Restocked! ${sku} new stock: ${data.current_quantity}`);
        loadInventory();
        loadDashboardData();
    } catch (e) {
        alert("Restock error: " + e);
    }
}

async function simulateTelemetryBreach() {
    const coldOrder = state.orders.find(o => o.requires_cold_chain) || state.orders[0];
    if (!coldOrder) {
        alert("No suitable order found for simulation.");
        return;
    }

    if (state.isBrowserMode) {
        const telemetry = getStorage('telemetry', DEFAULT_TELEMETRY);
        const reading = telemetry.find(t => t.order_id === coldOrder.id) || telemetry[0];
        if (reading) {
            reading.temperature_c = 15.4;
            reading.status = "TEMP_BREACH_HIGH";
            reading.message = "CRITICAL: Temperature spike to 15.4°C! Cold-chain safety envelope violated.";
            setStorage('telemetry', telemetry);
        }

        const snsAlerts = getStorage('snsAlerts', DEFAULT_SNS);
        snsAlerts.unshift({
            id: `SNS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            topic: "scm-critical-alerts",
            timestamp: new Date().toISOString(),
            subject: `🚨 CRITICAL COLD-CHAIN ANOMALY: Order ${coldOrder.id}`,
            message: `IoT Sensor on shipment ${coldOrder.id} spiked to 15.4°C exceeding vaccine threshold (8.0°C).`,
            severity: "CRITICAL"
        });
        setStorage('snsAlerts', snsAlerts);

        const banner = document.getElementById('sns-emergency-banner');
        document.getElementById('sns-banner-title').innerText = `🚨 CRITICAL ANOMALY: Order ${coldOrder.id}`;
        document.getElementById('sns-banner-desc').innerText = `Sensor breached safety limits! Temperature spiked to 15.4°C. Alert published to Amazon SNS.`;
        banner.classList.remove('hidden');

        await loadTelemetry();
        await loadDashboardData();
        switchTab('telemetry');
        return;
    }

    try {
        const res = await fetch('/api/telemetry/simulate-breach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: coldOrder.id,
                spike_temperature_c: 15.4
            })
        });
        await res.json();
        
        const banner = document.getElementById('sns-emergency-banner');
        document.getElementById('sns-banner-title').innerText = `🚨 CRITICAL ANOMALY: Order ${coldOrder.id}`;
        document.getElementById('sns-banner-desc').innerText = `Sensor breached safety limits! Temperature spiked to 15.4°C. Alert published to Amazon SNS.`;
        banner.classList.remove('hidden');

        await loadTelemetry();
        await loadDashboardData();
        switchTab('telemetry');
    } catch (e) {
        alert("Breach simulation failed: " + e);
    }
}

function dismissSnsBanner() {
    document.getElementById('sns-emergency-banner').classList.add('hidden');
}

async function promptPurchaseOrder(supplierId, supplierName) {
    const sku = prompt(`Enter SKU code to order from ${supplierName}:`, "MED-VAC-001");
    if (!sku) return;
    const qtyStr = prompt(`Enter quantity to purchase from ${supplierName}:`, "50");
    if (!qtyStr) return;
    const qty = parseInt(qtyStr, 10);

    if (state.isBrowserMode) {
        quickRestock(sku, qty);
        alert(`Purchase Order approved! Replenished ${qty} units of ${sku} into warehouse.`);
        return;
    }

    try {
        const res = await fetch(`/api/suppliers/${supplierId}/purchase-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sku: sku, quantity: qty })
        });
        const data = await res.json();
        alert(`Purchase Order ${data.po_id} approved! ${qty} units replenished into warehouse.`);
        loadInventory();
        loadDashboardData();
    } catch (e) {
        alert("PO error: " + e);
    }
}

async function seedDemoData() {
    if (!confirm("Reset and reseed demo data across all DynamoDB tables?")) return;
    if (state.isBrowserMode) {
        localStorage.removeItem('cloudchain_initialized');
        initBrowserStorage();
        alert("Demonstration data reseeded successfully!");
        location.reload();
        return;
    }

    try {
        const res = await fetch('/api/cloud/seed', { method: 'POST' });
        await res.json();
        alert("Demonstration data reseeded successfully!");
        location.reload();
    } catch (e) {
        alert("Seed failed: " + e);
    }
}

// -------------------------------------------------------------
// Form Handlers (Create Order / Create Product)
// -------------------------------------------------------------
function openNewOrderModal() {
    document.getElementById('modal-create-order').classList.remove('hidden');
}
function closeNewOrderModal() {
    document.getElementById('modal-create-order').classList.add('hidden');
}

async function handleCreateOrder(e) {
    e.preventDefault();
    const sel = document.getElementById('order-product-select');
    const sku = sel.value;
    const unitPrice = parseFloat(sel.options[sel.selectedIndex].dataset.price || 100);
    const qty = parseInt(document.getElementById('order-qty').value, 10);

    const payload = {
        customer_name: document.getElementById('order-cust-name').value,
        customer_email: document.getElementById('order-cust-email').value,
        destination_city: document.getElementById('order-dest-city').value,
        destination_country: document.getElementById('order-dest-country').value,
        origin_warehouse_id: document.getElementById('order-origin-wh').value,
        items: [
            {
                sku: sku,
                name: sel.options[sel.selectedIndex].text.split(' - ')[1].split(' ($')[0],
                quantity: qty,
                unit_price: unitPrice
            }
        ]
    };

    if (state.isBrowserMode) {
        const inv = getStorage('inventory', DEFAULT_INVENTORY);
        const invItem = inv.find(i => i.sku === sku);
        if (invItem) {
            if (invItem.quantity < qty) {
                alert(`Insufficient stock! Available: ${invItem.quantity}`);
                return;
            }
            invItem.quantity -= qty;
            if (invItem.quantity <= invItem.min_threshold) {
                invItem.reorder_status = "REORDER_REQUIRED";
            }
            setStorage('inventory', inv);
        }

        const newId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        const orders = getStorage('orders', DEFAULT_ORDERS);
        orders.unshift({
            id: newId,
            customer_name: payload.customer_name,
            customer_email: payload.customer_email,
            destination_city: payload.destination_city,
            destination_country: payload.destination_country,
            origin_warehouse_id: payload.origin_warehouse_id,
            items: payload.items,
            total_amount: qty * unitPrice,
            status: "PLACED",
            tracking_number: `CC-AWS-${Math.floor(1000000 + Math.random() * 9000000)}`,
            carrier: "CloudChain Global Express",
            requires_cold_chain: invItem ? invItem.requires_cold_chain : false,
            current_location: `Warehouse ${payload.origin_warehouse_id}`,
            milestones: [
                { code: "PLACED", title: "Order Placed", location: payload.origin_warehouse_id, timestamp: "Just now", description: "Order reserved in DynamoDB.", completed: true },
                { code: "PROCESSING", title: "Warehouse Pick & Pack", location: payload.origin_warehouse_id, timestamp: "", description: "Pending dispatch.", completed: false },
                { code: "DISPATCHED", title: "Carrier Pickup", location: payload.origin_warehouse_id, timestamp: "", description: "Scheduled.", completed: false }
            ]
        });
        setStorage('orders', orders);

        closeNewOrderModal();
        alert("Order created and saved to DynamoDB!");
        await loadOrders();
        await loadDashboardData();
        switchTab('shipments');
        return;
    }

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Order submission failed");
        }
        closeNewOrderModal();
        alert("Order created and saved to Amazon DynamoDB!");
        await loadOrders();
        await loadDashboardData();
        switchTab('shipments');
    } catch (err) {
        alert("Error: " + err.message);
    }
}

function openNewProductModal() {
    document.getElementById('modal-create-product').classList.remove('hidden');
}
function closeNewProductModal() {
    document.getElementById('modal-create-product').classList.add('hidden');
}

async function handleCreateProduct(e) {
    e.preventDefault();
    const payload = {
        sku: document.getElementById('prod-sku').value,
        name: document.getElementById('prod-name').value,
        category: document.getElementById('prod-category').value,
        warehouse_id: document.getElementById('prod-warehouse').value,
        supplier_id: "SUP-101",
        quantity: parseInt(document.getElementById('prod-quantity').value, 10),
        min_threshold: parseInt(document.getElementById('prod-threshold').value, 10),
        unit_price: parseFloat(document.getElementById('prod-price').value),
        requires_cold_chain: document.getElementById('prod-coldchain').checked,
        reorder_status: "IN_STOCK"
    };

    if (state.isBrowserMode) {
        const inv = getStorage('inventory', DEFAULT_INVENTORY);
        inv.push(payload);
        setStorage('inventory', inv);
        closeNewProductModal();
        alert("Product successfully added to DynamoDB!");
        await loadInventory();
        await loadDashboardData();
        return;
    }

    try {
        const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Product creation failed");
        }
        closeNewProductModal();
        alert("Product successfully added to Amazon DynamoDB!");
        await loadInventory();
        await loadDashboardData();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

function filterOrders(type) {
    ['ALL', 'IN_TRANSIT', 'DELIVERED', 'COLD_CHAIN'].forEach(t => {
        const btn = document.getElementById(`filter-btn-${t}`);
        if (t === type) {
            btn.className = "px-3 py-1 rounded-md bg-indigo-600 text-white font-medium";
        } else {
            btn.className = "px-3 py-1 rounded-md text-slate-300 hover:text-white";
        }
    });

    if (type === 'ALL') loadOrders();
    else if (type === 'IN_TRANSIT') loadOrders('IN_TRANSIT');
    else if (type === 'DELIVERED') loadOrders('DELIVERED');
    else if (type === 'COLD_CHAIN') {
        state.orders = state.orders.filter(o => o.requires_cold_chain);
        renderOrders();
    }
}

function filterInventoryByCategory(cat) {
    loadInventory(cat);
}
