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

// --- Database Helpers ---
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

// --- Authentication Logic ---
function checkAuth() {
    const isLoggedIn = localStorage.getItem(AUTH_KEY);
    const currentPage = window.location.pathname;
    
    // Simple path check for GitHub Pages or local
    const isLoginPage = currentPage.endsWith('login.html');
    
    if (!isLoggedIn && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (isLoggedIn && isLoginPage) {
        window.location.href = 'index.html';
    }
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
}

// --- UI Logic ---
function updateDashboard() {
    const db = getDB();
    const totalItems = db.inventory.length;
    const lowStockItems = db.inventory.filter(item => item.quantity < 20).length;
    const totalValue = db.inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const elements = {
        'total-items': totalItems,
        'low-stock-count': lowStockItems,
        'total-value': `$${totalValue.toLocaleString()}`,
        'active-suppliers': db.suppliers.length
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

function renderInventory() {
    const inventoryTable = document.getElementById('inventory-table-body');
    if (!inventoryTable) return;

    const db = getDB();
    inventoryTable.innerHTML = db.inventory.map(item => `
        <tr>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="${item.quantity < 20 ? 'text-danger fw-bold' : ''}">${item.quantity} ${item.unit}</td>
            <td>$${item.price}</td>
            <td><span class="badge ${item.quantity < 20 ? 'bg-warning' : 'bg-success'}">${item.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="window.editItem(${item.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.deleteItem(${item.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// --- Event Handlers ---
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    checkAuth();

    // Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            if (user === 'admin' && pass === 'admin123') {
                localStorage.setItem(AUTH_KEY, 'true');
                window.location.href = 'index.html';
            } else {
                alert('Invalid credentials! Use admin / admin123');
            }
        });
    }

    // Inventory Form Handler
    const inventoryForm = document.getElementById('inventory-form');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', (e) => {
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
                supplier: 'Manual Entry',
                status: parseInt(document.getElementById('item-quantity').value) < 20 ? 'Low Stock' : 'In Stock'
            };
            db.inventory.push(newItem);
            updateDB(db);
            renderInventory();
            inventoryForm.reset();
            
            // Close modal using bootstrap API if available
            const modalEl = document.getElementById('addItemModal');
            if (window.bootstrap && modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            }
        });
    }

    // Logout Button handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Initialize Page Content
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/Stock-Sphere/')) {
        updateDashboard();
    }
    if (window.location.pathname.includes('inventory.html')) {
        renderInventory();
    }
});

// Global functions for inline onclick handlers
window.deleteItem = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
        const db = getDB();
        db.inventory = db.inventory.filter(item => item.id !== id);
        updateDB(db);
        renderInventory();
    }
};

window.editItem = (id) => {
    alert('Edit functionality coming soon! ID: ' + id);
};
