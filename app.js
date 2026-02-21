// Stock-Sphere Application Logic
//checking PR
const DB_NAME = 'stock_sphere_db';
const AUTH_KEY = 'stock_sphere_auth';

const initialData = {
    inventory: [
        { id: 1, name: 'Industrial Valve', sku: 'IV-001', category: 'Mechanical', quantity: 50, price: 1200, unit: 'pcs', supplier: 'TechCorp', status: 'In Stock' },
        { id: 2, name: 'Copper Wiring', sku: 'CW-102', category: 'Electrical', quantity: 15, price: 500, unit: 'm', supplier: 'ElectraLine', status: 'Low Stock' },
        { id: 3, name: 'Safety Gloves', sku: 'SG-003', category: 'Tools', quantity: 200, price: 150, unit: 'pairs', supplier: 'TechCorp', status: 'In Stock' },
        { id: 4, name: 'Hydraulic Oil', sku: 'HO-004', category: 'Chemical', quantity: 8, price: 800, unit: 'L', supplier: 'ElectraLine', status: 'Low Stock' }
    ],
    suppliers: [
        { id: 1, name: 'TechCorp', contact: 'John Doe', email: 'john@techcorp.com', terms: 'Net 30', performance: 'Excellent' },
        { id: 2, name: 'ElectraLine', contact: 'Jane Smith', email: 'jane@electra.com', terms: 'Net 15', performance: 'Good' }
    ],
    transactions: [
        { id: 1, type: 'Inward', itemId: 1, quantity: 50, date: '2026-02-15', reason: 'New Shipment' },
        { id: 2, type: 'Outward', itemId: 2, quantity: 5, date: '2026-02-18', reason: 'Order Fulfillment' }
    ]
};

// --- Helper Functions ---
function initDB() {
    if (!localStorage.getItem(DB_NAME)) {
        localStorage.setItem(DB_NAME, JSON.stringify(initialData));
    }
}

function getDB() {
    const data = localStorage.getItem(DB_NAME);
    return data ? JSON.parse(data) : initialData;
}

function updateDB(data) {
    localStorage.setItem(DB_NAME, JSON.stringify(data));
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function getStatusBadge(status) {
    if (status === 'In Stock') return `<span class="badge badge-success">${status}</span>`;
    if (status === 'Low Stock') return `<span class="badge badge-warning">${status}</span>`;
    return `<span class="badge badge-danger">${status}</span>`;
}

function getPerformanceBadge(perf) {
    if (perf === 'Excellent') return `<span class="badge badge-success">${perf}</span>`;
    if (perf === 'Good') return `<span class="badge badge-warning">${perf}</span>`;
    return `<span class="badge badge-danger">${perf}</span>`;
}

// --- Auth Logic ---
function checkAuth() {
    const auth = localStorage.getItem(AUTH_KEY);
    const isLoginPage = window.location.pathname.includes('login.html');
    if (!auth && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (auth && isLoginPage) {
        window.location.href = 'index.html';
    }
}

function login(username, password) {
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem(AUTH_KEY, 'true');
        window.location.href = 'index.html';
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
}

// --- Dashboard Logic ---
function updateDashboard() {
    const db = getDB();
    const inventory = db.inventory;
    const suppliers = db.suppliers;

    const totalProducts = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity < 20).length;
    const totalSuppliers = suppliers.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const elements = {
        'total-products': totalProducts,
        'low-stock-count': lowStockItems,
        'total-suppliers': totalSuppliers,
        'inventory-value': formatCurrency(totalValue)
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    renderRecentTransactions(db);
}

function renderRecentTransactions(db) {
    const container = document.getElementById('recent-activities');
    if (!container) return;

    const recent = db.transactions.slice(-5).reverse();
    container.innerHTML = recent.map(t => {
        const item = db.inventory.find(i => i.id === t.itemId);
        const isInward = t.type === 'Inward';
        return `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${isInward ? 'rgba(0,200,151,0.1)' : 'rgba(255,77,77,0.1)'}; color: ${isInward ? 'var(--success)' : 'var(--danger)'}">
                    <i class="fas fa-${isInward ? 'arrow-down' : 'arrow-up'}"></i>
                </div>
                <div class="activity-details">
                    <h4>${t.type}: ${item ? item.name : 'Unknown'}</h4>
                    <p>${t.date} &bull; Qty: ${t.quantity} &bull; ${t.reason}</p>
                </div>
            </div>`;
    }).join('');
}

// --- Inventory Logic ---
function renderInventoryTable(filter) {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    const db = getDB();
    let items = db.inventory;

    if (filter) {
        const q = filter.toLowerCase();
        items = items.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.supplier.toLowerCase().includes(q)
        );
    }

    // Update stats on inventory page too
    const totalEl = document.getElementById('total-products');
    const valueEl = document.getElementById('inventory-value');
    const lowEl = document.getElementById('low-stock-count');
    if (totalEl) totalEl.textContent = db.inventory.length;
    if (valueEl) valueEl.textContent = formatCurrency(db.inventory.reduce((s, i) => s + (i.price * i.quantity), 0));
    if (lowEl) lowEl.textContent = db.inventory.filter(i => i.quantity < 20).length;

    tableBody.innerHTML = items.length > 0 ? items.map(item => `
        <tr>
            <td><strong>${item.sku}</strong></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit || ''}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.supplier}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`).join('') : '<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 40px;">No items found</td></tr>';
}

function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    const db = getDB();
    db.inventory = db.inventory.filter(item => item.id !== id);
    updateDB(db);
    renderInventoryTable();
}

// --- Supplier Logic ---
function renderSupplierTable() {
    const tableBody = document.getElementById('supplier-table-body');
    if (!tableBody) return;

    const db = getDB();
    tableBody.innerHTML = db.suppliers.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.contact}</td>
            <td><a href="mailto:${s.email}">${s.email}</a></td>
            <td><span class="badge badge-success">${s.terms}</span></td>
            <td>${getPerformanceBadge(s.performance)}</td>
            <td>
                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="deleteSupplier(${s.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`).join('');
}

function deleteSupplier(id) {
    if (!confirm('Delete this supplier?')) return;
    const db = getDB();
    db.suppliers = db.suppliers.filter(s => s.id !== id);
    updateDB(db);
    renderSupplierTable();
}

// --- Reports Logic ---
function renderReports() {
    const container = document.getElementById('reports-content');
    if (!container) return;

    const db = getDB();
    const inventory = db.inventory;

    const categories = {};
    inventory.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + item.quantity;
    });

    let html = '<h3 style="margin-bottom: 15px; font-size: 1rem; color: var(--text-muted);">Stock by Category</h3>';
    html += '<div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 30px;">';
    for (const [cat, qty] of Object.entries(categories)) {
        html += `<div class="stat-card primary" style="min-width: 180px; flex: 1;">
            <div class="stat-info"><h3>${cat}</h3><p>${qty}</p></div>
            <div class="stat-icon"><i class="fas fa-box"></i></div>
        </div>`;
    }
    html += '</div>';

    const lowStock = inventory.filter(i => i.quantity < 20);
    html += '<h3 style="margin: 20px 0 15px; font-size: 1rem; color: var(--danger);">Low Stock Alert</h3>';
    if (lowStock.length > 0) {
        html += '<div class="table-responsive"><table><thead><tr><th>Item</th><th>Qty</th><th>Supplier</th><th>Status</th></tr></thead><tbody>';
        html += lowStock.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.supplier}</td><td>${getStatusBadge(i.status)}</td></tr>`).join('');
        html += '</tbody></table></div>';
    } else {
        html += '<p style="color: var(--success);">All items are well stocked!</p>';
    }

    container.innerHTML = html;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    checkAuth();

    if (document.getElementById('total-products') && !document.getElementById('inventory-table-body')) updateDashboard();
    if (document.getElementById('inventory-table-body')) renderInventoryTable();
    if (document.getElementById('supplier-table-body')) renderSupplierTable();
    if (document.getElementById('reports-content')) renderReports();

    // Inventory search
    const searchInput = document.getElementById('inventory-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderInventoryTable(e.target.value));
    }

    // Add item form
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const db = getDB();
            const newItem = {
                id: Date.now(),
                name: document.getElementById('item-name').value,
                sku: document.getElementById('item-sku').value,
                category: document.getElementById('item-category').value,
                quantity: parseInt(document.getElementById('item-quantity').value),
                price: parseFloat(document.getElementById('item-price').value),
                unit: 'pcs',
                supplier: db.suppliers[0]?.name || 'N/A',
                status: parseInt(document.getElementById('item-quantity').value) < 20 ? 'Low Stock' : 'In Stock'
            };
            db.inventory.push(newItem);
            updateDB(db);
            document.getElementById('addItemModal').classList.remove('active');
            addItemForm.reset();
            renderInventoryTable();
        });
    }

    // Add supplier form
    const addSupplierForm = document.getElementById('add-supplier-form');
    if (addSupplierForm) {
        addSupplierForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const db = getDB();
            const inputs = addSupplierForm.querySelectorAll('input, select');
            const newSupplier = {
                id: Date.now(),
                name: inputs[0].value,
                contact: inputs[1].value,
                email: inputs[2].value,
                terms: inputs[3].value,
                performance: 'Good'
            };
            db.suppliers.push(newSupplier);
            updateDB(db);
            document.getElementById('addSupplierModal').classList.remove('active');
            addSupplierForm.reset();
            renderSupplierTable();
        });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            if (!login(user, pass)) alert('Invalid credentials!');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    }
});
