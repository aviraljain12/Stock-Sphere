// Stock-Sphere Application Logic
const DB_NAME = 'stock_sphere_db';

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
        { id: 1, type: 'Inward', itemId: 1, quantity: 50, date: '2026-02-15', reason: 'New Stock' }
    ]
};

function initDB() {
    if (!localStorage.getItem(DB_NAME)) {
        localStorage.setItem(DB_NAME, JSON.stringify(initialData));
    }
}

function getDB() {
    return JSON.parse(localStorage.getItem(DB_NAME)) || initialData;
}

function updateDB(data) {
    localStorage.setItem(DB_NAME, JSON.stringify(data));
}

function updateDashboard() {
    const db = getDB();
    const totalItems = db.inventory.length;
    const totalStock = db.inventory.reduce((acc, item) => acc + item.quantity, 0);
    const lowStockCount = db.inventory.filter(item => item.quantity < 20).length;
    const totalValuation = db.inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    const stats = {
        'total-items': totalItems,
        'total-stock': totalStock,
        'low-stock': lowStockCount,
        'valuation': '₹' + totalValuation.toLocaleString()
    };

    for (const [id, value] of Object.entries(stats)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    if (document.getElementById('total-items')) {
        updateDashboard();
    }
});
