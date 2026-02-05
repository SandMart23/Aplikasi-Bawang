// Generator Barcode Script

// Form elements
const barcodeForm = document.getElementById('barcodeForm');
const variantSelect = document.getElementById('variant');
const weightSelect = document.getElementById('weight');
const priceInput = document.getElementById('price');
const productionDateInput = document.getElementById('productionDate');
const expiryDaysSelect = document.getElementById('expiryDays');
const quantityInput = document.getElementById('quantity');
const generateBtn = document.getElementById('generateBtn');
const previewCard = document.getElementById('previewCard');
const pricePreview = document.getElementById('pricePreview');
const barcodeNumber = document.getElementById('barcodeNumber');
const stockAdded = document.getElementById('stockAdded');

// Set default production date to today
const today = new Date().toISOString().split('T')[0];
productionDateInput.value = today;

// Variant names mapping
const variantNames = {
    'original': 'Bawang Goreng Original',
    'pedas': 'Bawang Goreng Pedas',
    'manis': 'Bawang Goreng Manis',
    'asin': 'Bawang Goreng Asin'
};

// Check form validity and enable/disable generate button
function checkFormValidity() {
    const isValid = variantSelect.value !== '' && 
                   priceInput.value !== '' && 
                   productionDateInput.value !== '' &&
                   quantityInput.value !== '' &&
                   parseInt(quantityInput.value) > 0;
    
    generateBtn.disabled = !isValid;
    
    if (isValid) {
        generateBtn.style.opacity = '1';
        generateBtn.style.cursor = 'pointer';
    } else {
        generateBtn.style.opacity = '0.5';
        generateBtn.style.cursor = 'not-allowed';
    }
}

// Format price to Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// Format date to DD/MM/YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Calculate expiry date
function calculateExpiryDate(productionDate, daysToAdd) {
    const date = new Date(productionDate);
    date.setDate(date.getDate() + parseInt(daysToAdd));
    return date.toISOString().split('T')[0];
}

// Generate unique barcode number based on variant and weight
function generateBarcodeNumber(variant, weight) {
    // Create barcode prefix based on variant
    const prefixMap = {
        'original': '10',
        'pedas': '11',
        'manis': '12',
        'asin': '13'
    };
    
    const prefix = prefixMap[variant] || '10';
    
    // Weight codes (fixed for same weight)
    const weightCodeMap = {
        '100': '0100',
        '250': '0250',
        '500': '0500',
        '1000': '1000'
    };
    
    const weightCode = weightCodeMap[weight] || '0000';
    
    // Fixed suffix for same variant+weight combination
    const suffix = '24706'; // You can make this dynamic if needed
    
    // Generate 12 digit barcode
    const barcode = prefix + weightCode + suffix;
    
    // Calculate check digit for EAN-13
    const checkDigit = calculateEAN13CheckDigit(barcode);
    
    return barcode + checkDigit;
}

// Calculate EAN-13 check digit
function calculateEAN13CheckDigit(barcode) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcode[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
}

// Update price preview
priceInput.addEventListener('input', function() {
    const price = parseFloat(this.value);
    if (price > 0) {
        pricePreview.textContent = formatRupiah(price);
    } else {
        pricePreview.textContent = '';
    }
    checkFormValidity();
});

// Add event listeners for form validation
variantSelect.addEventListener('change', checkFormValidity);
priceInput.addEventListener('input', checkFormValidity);
productionDateInput.addEventListener('change', checkFormValidity);
quantityInput.addEventListener('input', checkFormValidity);

// Handle form submit
barcodeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!generateBtn.disabled) {
        generateBarcode();
    }
});

// Generate barcode
function generateBarcode() {
    // Get form values
    const variant = variantSelect.value;
    const weight = weightSelect.value;
    const quantity = parseInt(quantityInput.value);
    const price = parseFloat(priceInput.value);
    const productionDate = productionDateInput.value;
    const expiryDays = expiryDaysSelect.value;
    
    // Validate quantity
    if (quantity < 1 || quantity > 10000) {
        showNotification('Jumlah produk harus antara 1-10000', 'error');
        return;
    }
    
    // Calculate expiry date
    const expiryDate = calculateExpiryDate(productionDate, expiryDays);
    
    // Generate barcode number (consistent for same variant+weight)
    const barcodeNum = generateBarcodeNumber(variant, weight);
    
    // Update barcode number display
    barcodeNumber.textContent = barcodeNum;
    
    // Update stock info
    stockAdded.textContent = quantity + ' unit';
    
    // Generate barcode using JsBarcode
    try {
        JsBarcode("#barcode", barcodeNum, {
            format: "EAN13",
            width: 2,
            height: 80,
            displayValue: false,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000"
        });
        
        // Show preview card
        previewCard.style.display = 'block';
        previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Add to stock in dashboard
        addToStock(variant, weight, quantity, barcodeNum);
        
        // Save to incoming goods history
        saveIncomingGoods(variant, weight, quantity, price, barcodeNum, productionDate, expiryDate);
        
        // Show success notification
        showNotification(`Barcode berhasil di-generate! ${quantity} unit ditambahkan ke stok 🎉`, 'success');
        
    } catch (error) {
        console.error('Error generating barcode:', error);
        showNotification('Gagal generate barcode. Silakan coba lagi.', 'error');
    }
}

// Add to stock function
function addToStock(variant, weight, quantity, barcodeNum) {
    // Get current items from localStorage
    let items = [];
    const savedItems = localStorage.getItem('bawangGorenStoreItems');
    if (savedItems) {
        items = JSON.parse(savedItems);
    }
    
    // Create product name
    const productName = variantNames[variant] + ' ' + (weight >= 1000 ? (weight / 1000) + 'kg' : weight + 'g');
    
    // Check if item already exists
    const existingIndex = items.findIndex(item => 
        item.barcode === barcodeNum
    );
    
    if (existingIndex !== -1) {
        // Update existing item stock
        items[existingIndex].stock += quantity;
    } else {
        // Add new item
        const newItem = {
            name: productName,
            barcode: barcodeNum,
            description: variantNames[variant] + ' - Berat ' + (weight >= 1000 ? (weight / 1000) + 'kg' : weight + 'g'),
            stock: quantity
        };
        items.push(newItem);
    }
    
    // Save back to localStorage
    localStorage.setItem('bawangGorenStoreItems', JSON.stringify(items));
}

// Save incoming goods to localStorage
function saveIncomingGoods(variant, weight, quantity, price, barcodeNum, productionDate, expiryDate) {
    // Get current incoming goods
    let incomingGoods = [];
    const savedData = localStorage.getItem('bawangGorenStoreIncoming');
    if (savedData) {
        incomingGoods = JSON.parse(savedData);
    }
    
    // Create new entry
    const newEntry = {
        id: Date.now(),
        productName: variantNames[variant],
        variant: variant,
        weight: weight + (weight >= 1000 ? 'g' : 'g'),
        quantity: quantity,
        price: price,
        totalValue: price * quantity,
        barcode: barcodeNum,
        productionDate: productionDate,
        expiryDate: expiryDate,
        entryDate: new Date().toISOString(),
        status: 'active'
    };
    
    // Add to beginning of array (newest first)
    incomingGoods.unshift(newEntry);
    
    // Keep only last 100 entries to avoid localStorage size limit
    if (incomingGoods.length > 100) {
        incomingGoods = incomingGoods.slice(0, 100);
    }
    
    // Save to localStorage
    localStorage.setItem('bawangGorenStoreIncoming', JSON.stringify(incomingGoods));
}

// Reset form
function resetForm() {
    barcodeForm.reset();
    pricePreview.textContent = '';
    previewCard.style.display = 'none';
    productionDateInput.value = today;
    quantityInput.value = 1;
    checkFormValidity();
    
    showNotification('Form berhasil direset', 'success');
}

// Print barcode
function printBarcode() {
    // Validate that barcode has been generated
    const barcodeElement = document.getElementById('barcode');
    if (!barcodeElement || !barcodeElement.querySelector('svg')) {
        showNotification('Harap generate barcode terlebih dahulu!', 'error');
        return;
    }
    
    // Show notification
    showNotification('Membuka halaman print...', 'success');
    
    // Delay to allow notification to show
    setTimeout(() => {
        window.print();
    }, 500);
}

// Show notification function
if (typeof showNotification !== 'function') {
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
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
            max-width: 350px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize
checkFormValidity();

// Auto-calculate suggested price based on weight
weightSelect.addEventListener('change', function() {
    const weight = parseInt(this.value);
    const suggestedPrices = {
        100: 15000,
        250: 25000,
        500: 45000,
        1000: 85000
    };
    
    if (!priceInput.value) {
        priceInput.value = suggestedPrices[weight] || '';
        priceInput.dispatchEvent(new Event('input'));
    }
});