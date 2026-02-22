// Stock-Sphere Application Logic
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
    const cls = status === 'In Stock' ? 'in-stock' : 'low';
    return `<span class="badge ${cls}">${status}</span>`;
}

function getPerformanceBadge(perf) {
    let cls = 'success';
    if (perf === 'Average') cls = 'warning';
    if (perf === 'Poor') cls = 'danger';
    return `<span class="badge ${cls}">${perf}</span>`;
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
        return `
            <div class="activity-item">
                <h4>${t.type}: ${item ? item.name : 'Unknown'}</h4>
                <p>${t.date} • Qty: ${t.quantity} • ${t.reason}</p>
            </div>
        `;
    }).join('');
}

// --- Inventory Logic ---
function renderInventoryTable(filter = '') {
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

    // Update stats on page
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
                <button class="btn btn-sm btn-outline" onclick="deleteItem(${item.id})" style="padding: 5px 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" style="text-align:center;">No items found</td></tr>';
}

function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const db = getDB();
    db.inventory = db.inventory.filter(item => item.id !== id);
    updateDB(db);
    renderInventoryTable();
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

    let html = `
        <div class="report-section">
            <h3><i class="fas fa-chart-pie"></i> Stock Distribution by Category</h3>
            <div style="max-width: 600px; margin: 20px auto;">
                <canvas id="categoryChart"></canvas>
            </div>
        </div>
        
        <div class="report-section" style="margin-top: 40px;">
            <h3><i class="fas fa-exclamation-circle"></i> Low Stock Summary</h3>
    `;

    const lowStock = inventory.filter(i => i.quantity < 20);
    if (lowStock.length > 0) {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Supplier</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${lowStock.map(i => `
                        <tr>
                            <td>${i.name}</td>
                            <td>${i.quantity}</td>
                            <td>${i.supplier}</td>
                            <td>${getStatusBadge(i.status)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        html += '<p style="padding: 20px; color: var(--success);">All items are adequately stocked.</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;

    // Initialize Chart
    if (window.Chart) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    label: 'Quantity in Stock',
                    data: Object.values(categories),
                    backgroundColor: 'rgba(109, 93, 252, 0.6)',
                    borderColor: 'rgba(109, 93, 252, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function printReport() {
    window.print();
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    checkAuth();

    // Determine current page and render
    if (document.getElementById('recent-activities')) updateDashboard();
    if (document.getElementById('inventory-table-body')) renderInventoryTable();
    if (document.getElementById('reports-content')) renderReports();
    if (document.getElementById('supplier-table-body')) {
        // Simple placeholder for supplier rendering if needed
        const db = getDB();
        const body = document.getElementById('supplier-table-body');
        body.innerHTML = db.suppliers.map(s => `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.contact}</td>
                <td>${s.email}</td>
                <td>${s.terms}</td>
                <td>${getPerformanceBadge(s.performance)}</td>
            </tr>
        `).join('');
    }

    // Inventory search
    const searchInput = document.getElementById('inventory-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderInventoryTable(e.target.value));
    }

    // Add item form logic (Fixes Issue 1 & 2)
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const db = getDB();
            
            const quantity = parseInt(document.getElementById('item-quantity').value);
            const newItem = {
                id: Date.now(),
                name: document.getElementById('item-name').value,
                sku: document.getElementById('item-sku').value,
                category: document.getElementById('item-category').value,
                quantity: quantity,
                price: parseFloat(document.getElementById('item-price').value),
                unit: document.getElementById('item-unit').value || 'pcs',
                supplier: db.suppliers[0]?.name || 'N/A',
                status: quantity < 20 ? 'Low Stock' : 'In Stock'
            };

            db.inventory.push(newItem);
            updateDB(db);
            
            // Close modal
            const modal = document.getElementById('addItemModal');
            if (modal) modal.classList.remove('active');
            
            addItemForm.reset();
            renderInventoryTable();
        });
    }
    
    // Print button handler (Fixes Issue 3)
    const printBtn = document.getElementById('print-report-btn');
    if (printBtn) {
        printBtn.addEventListener('click', (e) => {
            e.preventDefault();
            printReport();
        });
    }
});
