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

// Database Helpers
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

// Dashboard Logic
function updateDashboard() {
    const db = getDB();
    if (!db) return;
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

// Inventory Logic
function renderInventory(filterText = '') {
    const list = document.getElementById('inventory-list');
    if (!list) return;

    const db = getDB();
    const filtered = db.inventory.filter(item => 
        item.name.toLowerCase().includes(filterText.toLowerCase()) || 
        item.sku.toLowerCase().includes(filterText.toLowerCase())
    );

    list.innerHTML = filtered.map(item => `
        <tr>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>₹${item.price}</td>
            <td>${item.supplier}</td>
            <td><span class="badge ${item.quantity < 20 ? 'badge-warning' : 'badge-success'}">${item.quantity < 20 ? 'Low Stock' : 'In Stock'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function saveItem(e) {
    e.preventDefault();
    const db = getDB();
    const formData = new FormData(e.target);
    const id = formData.get('item-id');

    const itemData = {
        name: formData.get('name'),
        sku: formData.get('sku'),
        category: formData.get('category'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        unit: formData.get('unit'),
        supplier: formData.get('supplier')
    };

    if (id) {
        // Edit
        const index = db.inventory.findIndex(item => item.id == id);
        db.inventory[index] = { ...db.inventory[index], ...itemData };
    } else {
        // Add
        itemData.id = Date.now();
        db.inventory.push(itemData);
        db.transactions.push({
            id: Date.now(),
            type: 'Inward',
            itemId: itemData.id,
            quantity: itemData.quantity,
            date: new Date().toISOString().split('T')[0],
            reason: 'Initial Entry'
        });
    }

    updateDB(db);
    closeModal();
    renderInventory();
}

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        const db = getDB();
        db.inventory = db.inventory.filter(item => item.id != id);
        updateDB(db);
        renderInventory();
    }
}

function editItem(id) {
    openModal('Edit Item', id);
}

// Modal Helpers
function openModal(title, itemId = null) {
    const modal = document.getElementById('item-modal');
    if (!modal) return;
    document.getElementById('modal-title').innerText = title;
    const form = document.getElementById('item-form');
    form.reset();
    document.getElementById('item-id').value = itemId || '';

    if (itemId) {
        const item = getDB().inventory.find(i => i.id == itemId);
        if (item) {
            for (const key in item) {
                const input = form.elements[key];
                if (input) input.value = item[key];
            }
        }
    }
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('item-modal');
    if (modal) modal.classList.remove('active');
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    // Auto-routing logic
    if (document.getElementById('total-items')) updateDashboard();
    if (document.getElementById('inventory-list')) renderInventory();

    // Event listeners
    const searchInput = document.getElementById('search-inventory');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderInventory(e.target.value));
    }

    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', saveItem);
    }
});
