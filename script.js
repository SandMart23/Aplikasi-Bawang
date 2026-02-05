// Check authentication
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

// Handle logout
function handleLogout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Data Storage (akan menggunakan localStorage)
let items = [];
let editingIndex = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadItems();
    renderTable();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });
    
    // Close sidebar when clicking nav item on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
}

// Load items from localStorage
function loadItems() {
    const savedItems = localStorage.getItem('bawangGorenStoreItems');
    if (savedItems) {
        items = JSON.parse(savedItems);
    } else {
        // Data dummy untuk demo
        items = [
            {
                name: 'Bawang Goreng Original',
                barcode: 'BG001',
                description: 'Bawang goreng kualitas premium',
                stock: 150
            },
            {
                name: 'Bawang Goreng Pedas',
                barcode: 'BG002',
                description: 'Bawang goreng dengan rasa pedas',
                stock: 85
            },
            {
                name: 'Bawang Goreng Balado',
                barcode: 'BG003',
                description: 'Bawang goreng rasa balado',
                stock: 120
            }
        ];
        saveItems();
    }
}

// Save items to localStorage
function saveItems() {
    localStorage.setItem('bawangGorenStoreItems', JSON.stringify(items));
}

// Render table
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (items.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        tableBody.innerHTML = items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.barcode)}</td>
                <td>${escapeHtml(item.description || '-')}</td>
                <td><strong>${item.stock}</strong></td>
                <td>
                    <button class="btn-action btn-edit" onclick="editItem(${index})">Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteItem(${index})">Hapus</button>
                </td>
            </tr>
        `).join('');
    }
}

// Open modal for adding item
function openAddModal() {
    editingIndex = null;
    document.getElementById('modalTitle').textContent = 'Tambah Barang';
    document.getElementById('itemForm').reset();
    openModal();
}

// Open modal
function openModal() {
    const modal = document.getElementById('itemModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('itemModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('itemForm').reset();
    editingIndex = null;
}

// Edit item
function editItem(index) {
    editingIndex = index;
    const item = items[index];
    
    document.getElementById('modalTitle').textContent = 'Edit Barang';
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemBarcode').value = item.barcode;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemStock').value = item.stock;
    
    openModal();
}

// Delete item
function deleteItem(index) {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
        items.splice(index, 1);
        saveItems();
        renderTable();
        showNotification('Barang berhasil dihapus!', 'success');
    }
}

// Handle form submit
function handleSubmit(event) {
    event.preventDefault();
    
    const itemData = {
        name: document.getElementById('itemName').value,
        barcode: document.getElementById('itemBarcode').value,
        description: document.getElementById('itemDescription').value,
        stock: parseInt(document.getElementById('itemStock').value)
    };
    
    if (editingIndex !== null) {
        // Update existing item
        items[editingIndex] = itemData;
        showNotification('Barang berhasil diupdate!', 'success');
    } else {
        // Add new item
        items.push(itemData);
        showNotification('Barang berhasil ditambahkan!', 'success');
    }
    
    saveItems();
    renderTable();
    closeModal();
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add animation styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});