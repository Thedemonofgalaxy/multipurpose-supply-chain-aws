/**
 * AWS CloudChain SCM - Interactive Frontend Application Controller
 */

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
    activeTab: 'dashboard'
};

let orderStatusChart = null;
let inventoryCategoryChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    await Promise.all([
        loadCloudStatus(),
        loadDashboardData(),
        loadWarehouses(),
        loadSuppliers(),
        loadTelemetry()
    ]);
    
    // Auto-refresh telemetry and audit every 15 seconds
    setInterval(() => {
        loadTelemetry();
        loadAuditLogs();
    }, 15000);
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
// API Loaders
// -------------------------------------------------------------
async function loadCloudStatus() {
    try {
        const res = await fetch('/api/cloud/status');
        const data = await res.json();
        state.cloudStatus = data;

        const badge = document.getElementById('cloud-mode-text');
        const pill = document.getElementById('aws-mode-pill');
        if (data.is_live_aws) {
            badge.innerHTML = `<span class="text-emerald-400 font-bold">AWS Live</span>: ${data.region}`;
            if (pill) pill.innerText = `Live AWS: ${data.region}`;
        } else {
            badge.innerHTML = `<span class="text-indigo-300 font-bold">AWS Local Emulation</span>`;
            if (pill) pill.innerText = `Zero-Config Local Cloud`;
        }
    } catch (e) {
        console.error("Cloud status check failed", e);
    }
}

async function loadDashboardData() {
    try {
        const [invRes, orderRes] = await Promise.all([
            fetch('/api/inventory/metrics'),
            fetch('/api/orders/metrics/summary')
        ]);
        const invMetrics = await invRes.json();
        const orderMetrics = await orderRes.json();

        // Update metric cards
        document.getElementById('metric-valuation').innerText = `$${invMetrics.total_valuation_usd.toLocaleString()}`;
        document.getElementById('metric-skus').innerText = invMetrics.total_skus;
        document.getElementById('metric-active-shipments').innerText = orderMetrics.active_shipments;
        document.getElementById('metric-fulfillment-rate').innerText = `${orderMetrics.fulfillment_rate_pct}%`;
        document.getElementById('metric-low-stock').innerText = invMetrics.low_stock_count;

        // Render charts
        renderCharts(orderMetrics, invMetrics);
        loadAuditLogs();
        loadOrders();
        loadInventory();
    } catch (e) {
        console.error("Failed loading dashboard metrics", e);
    }
}

async function loadWarehouses() {
    try {
        const res = await fetch('/api/inventory/warehouses/list');
        state.warehouses = await res.json();
        renderWarehouses();
    } catch (e) {
        console.error("Failed loading warehouses", e);
    }
}

async function loadOrders(statusFilter = null) {
    try {
        let url = '/api/orders';
        if (statusFilter && statusFilter !== 'ALL') url += `?status=${statusFilter}`;
        const res = await fetch(url);
        state.orders = await res.json();
        renderOrders();
    } catch (e) {
        console.error("Failed loading orders", e);
    }
}

async function loadInventory(cat = '') {
    try {
        let url = '/api/inventory';
        if (cat) url += `?category=${encodeURIComponent(cat)}`;
        const res = await fetch(url);
        state.inventory = await res.json();
        renderInventory();
        populateOrderProductSelect();
    } catch (e) {
        console.error("Failed loading inventory", e);
    }
}

async function loadSuppliers() {
    try {
        const res = await fetch('/api/suppliers');
        state.suppliers = await res.json();
        renderSuppliers();
    } catch (e) {
        console.error("Failed loading suppliers", e);
    }
}

async function loadTelemetry() {
    try {
        const res = await fetch('/api/telemetry');
        state.telemetry = await res.json();
        renderTelemetry();
    } catch (e) {
        console.error("Failed loading telemetry", e);
    }
}

async function loadAuditLogs() {
    try {
        const res = await fetch('/api/cloud/audit-logs');
        state.auditLogs = await res.json();
        renderAuditLogs();
    } catch (e) {
        console.error("Failed loading audit logs", e);
    }
}

async function loadCloudDetails() {
    await loadCloudStatus();
    try {
        const [filesRes, alertsRes] = await Promise.all([
            fetch('/api/manifests/list'),
            fetch('/api/cloud/alerts')
        ]);
        state.s3Files = await filesRes.json();
        state.snsAlerts = await alertsRes.json();

        // Update counts in cloud tab
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

        renderS3Files();
        renderSnsAlerts();
    } catch (e) {
        console.error("Failed loading cloud details", e);
    }
}

// -------------------------------------------------------------
// Render UI Components
// -------------------------------------------------------------
function renderCharts(orderMetrics, invMetrics) {
    // 1. Order Status Doughnut Chart
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

    // 2. Inventory Category Bar Chart
    const ctxInv = document.getElementById('inventoryCategoryChart').getContext('2d');
    if (inventoryCategoryChart) inventoryCategoryChart.destroy();

    const categories = ['Electronics', 'Healthcare & Pharma', 'Automotive', 'Consumer', 'Raw Materials'];
    const counts = [3, 2, 2, 1, 1]; // dynamic defaults

    inventoryCategoryChart = new Chart(ctxInv, {
        type: 'bar',
        data: {
            labels: ['Elec', 'Pharma', 'Auto', 'Cons', 'Raw'],
            datasets: [{
                label: 'SKUs',
                data: counts,
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
        const isDelivered = o.status === 'DELIVERED';
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
                <td class="p-3.5">
                    ${statusBadge}
                </td>
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

        const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
// Interactive Operations
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
                    <div class="text-[11px] text-slate-400">${m.location} ${m.timestamp ? '• ' + new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</div>
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
    try {
        const res = await fetch(`/api/orders/${state.selectedOrderId}/advance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await res.json();
        await loadOrders();
        await loadDashboardData();
        openJourneyModal(state.selectedOrderId);
    } catch (e) {
        alert("Failed to advance milestone: " + e);
    }
}

async function generateS3Manifest(orderId) {
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
    // Pick first active cold chain order
    const coldOrder = state.orders.find(o => o.requires_cold_chain) || state.orders[0];
    if (!coldOrder) {
        alert("No suitable order found for simulation.");
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
        const data = await res.json();
        
        // Trigger banner
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
    try {
        const res = await fetch('/api/cloud/seed', { method: 'POST' });
        const data = await res.json();
        alert("Demonstration data reseeded successfully!");
        location.reload();
    } catch (e) {
        alert("Seed failed: " + e);
    }
}

// -------------------------------------------------------------
// Form Handlers
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
        requires_cold_chain: document.getElementById('prod-coldchain').checked
    };

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
