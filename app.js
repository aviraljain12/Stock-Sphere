// Stock-Sphere Application Logic
const DB_NAME = 'stock_sphere_db';
const AUTH_KEY = 'stock_sphere_auth';

const initialData = {
    inventory: [
        { id: 1, name: 'Industrial Valve', sku: 'IV-001', category: 'Mechanical', quantity: 50, price: 1200, unit: 'pcs', supplier: 'TechCorp', status: 'In Stock' },
        { id: 2, name: 'Copper Wiring', sku: 'CW-102', category: 'Electrical', quantity: 15, price: 500, unit: 'm', supplier: 'ElectraLine', status: 'Low Stock' }
    ],
    suppliers: [
        { id: 1, name: 'TechCorp', contact: 'John Doe', email: 'john@techcorp.com', terms: 'Net 30', performance: 'Excellent' },
        { id: 2, name: 'ElectraLine', contact: 'Jane Smith', email: 'jane@electra.com', terms: 'Net 15', performance: 'Good' }
    ],
    transactions: [
        { id: 1, type: 'Inward', itemId: 1, quantity: 50, date: '2026-02-15', reason: 'New Shipment' }
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
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
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

    // Update UI elements if they exist
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
        return `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${t.type}: ${item ? item.name : 'Unknown'}</h6>
                    <small>${t.date}</small>
                </div>
                <p class="mb-1">Quantity: ${t.quantity} | Reason: ${t.reason}</p>
            </div>
        `;
    }).join('');
}

// --- Inventory Logic ---
function renderInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    const db = getDB();
    tableBody.innerHTML = db.inventory.map(item => `
        <tr>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.supplier}</td>
            <td><span class="badge ${item.quantity < 20 ? 'bg-danger' : 'bg-success'}">${item.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editItem(${item.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// --- Supplier Logic ---
function renderSupplierTable() {
    const tableBody = document.getElementById('supplier-table-body');
    if (!tableBody) return;

    const db = getDB();
    tableBody.innerHTML = db.suppliers.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.contact}</td>
            <td>${s.email}</td>
            <td>${s.terms}</td>
            <td><span class="badge bg-info text-dark">${s.performance}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// --- Reports Logic ---
function renderReports() {
    const container = document.getElementById('reports-content');
    if (!container) return;

    const db = getDB();
    const inventory = db.inventory;

    // Category breakdown
    const categories = {};
    inventory.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + item.quantity;
    });

    let html = '<h5>Stock Value by Category</h5><ul class="list-group mb-4">';
    for (const [cat, qty] of Object.entries(categories)) {
        html += `<li class="list-group-item d-flex justify-content-between align-items-center">${cat} <span class="badge bg-primary rounded-pill">${qty} units</span></li>`;
    }
    html += '</ul>';

    // Low stock report
    const lowStock = inventory.filter(i => i.quantity < 20);
    html += '<h5>Low Stock Alert</h5><table class="table table-sm"><thead><tr><th>Item</th><th>Qty</th><th>Supplier</th></tr></thead><tbody>';
    html += lowStock.map(i => `<tr><td>${i.name}</td><td class="text-danger">${i.quantity}</td><td>${i.supplier}</td></tr>`).join('');
    html += '</tbody></table>';

    container.innerHTML = html;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    checkAuth();
    
    // Page specific initializations
    if (document.getElementById('total-products')) updateDashboard();
    if (document.getElementById('inventory-table-body')) renderInventoryTable();
    if (document.getElementById('supplier-table-body')) renderSupplierTable();
    if (document.getElementById('reports-content')) renderReports();

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            if (!login(user, pass)) {
                alert('Invalid credentials!');
            }
        });
    }

    // Logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});
