import { getDom } from './uiManager.js';
import { showToast } from './uiManager.js';

const IVA_RATE = 0.21;

let quoteItems = [];
let markupPercent = 0;

export function initQuoteManager() {
  const dom = getDom();
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });
  
  const markupInput = document.getElementById('markup-percent');
  if (markupInput) {
    markupInput.addEventListener('input', (e) => {
      markupPercent = parseFloat(e.target.value) || 0;
      renderQuoteItems();
    });
  }
  
  const searchInput = document.getElementById('product-search');
  const searchResults = document.getElementById('search-results');
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      searchResults.classList.add('hidden');
      return;
    }
    
    searchTimeout = setTimeout(() => searchProducts(query), 300);
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrapper')) {
      searchResults.classList.add('hidden');
    }
  });
  
  document.getElementById('btn-generate-pdf').addEventListener('click', generatePDF);
  
  document.getElementById('btn-clear-quote').addEventListener('click', clearQuote);
  
  document.getElementById('btn-add-service').addEventListener('click', addService);
}

function handleTabSwitch(e) {
  const tab = e.target.dataset.tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  
  if (tab === 'converter') {
    document.getElementById('section-quote').classList.add('hidden');
    document.getElementById('section-upload').classList.remove('hidden');
  } else {
    document.getElementById('section-upload').classList.add('hidden');
    document.getElementById('section-quote').classList.remove('hidden');
  }
}

async function searchProducts(query) {
  try {
    const res = await fetch(`http://localhost:3001/api/products/search?q=${encodeURIComponent(query)}`);
    const products = await res.json();
    renderSearchResults(products);
  } catch (err) {
    console.error('Search error:', err);
  }
}

function renderSearchResults(products) {
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';
  
  if (products.length === 0) {
    searchResults.innerHTML = '<div class="search-result-item">Sin resultados</div>';
    searchResults.classList.remove('hidden');
    return;
  }
  
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.innerHTML = `
      <div class="product-code">${p.codigo}</div>
      <div class="product-name">${p.descripcion}</div>
      <div class="product-price">$${p.precioPartner?.toFixed(2) || '0.00'}</div>
    `;
    div.addEventListener('click', () => addProductToQuote(p));
    searchResults.appendChild(div);
  });
  
  searchResults.classList.remove('hidden');
}

function addProductToQuote(product) {
  const existing = quoteItems.find(item => item.id === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    quoteItems.push({
      ...product,
      quantity: 1,
      precioUnit: product.precioPartner || 0,
      ivaAmount: (product.precioPartner || 0) * IVA_RATE
    });
  }
  
  document.getElementById('product-search').value = '';
  document.getElementById('search-results').classList.add('hidden');
  renderQuoteItems();
}

function addService() {
  const desc = document.getElementById('service-desc').value.trim();
  const price = parseFloat(document.getElementById('service-price').value) || 0;
  const qty = parseInt(document.getElementById('service-qty').value) || 1;
  
  if (!desc || price <= 0) {
    showToast('Ingrese descripción y precio válido', 'warning');
    return;
  }
  
  quoteItems.push({
    id: Date.now(),
    codigo: 'SERVICIO',
    descripcion: desc,
    marca: '-',
    quantity: qty,
    precioUnit: price,
    ivaAmount: price * IVA_RATE,
    isService: true
  });
  
  document.getElementById('service-desc').value = '';
  document.getElementById('service-price').value = '';
  document.getElementById('service-qty').value = '1';
  
  renderQuoteItems();
  showToast('Servicio agregado', 'success');
}

function renderQuoteItems() {
  const tbody = document.getElementById('items-body');
  tbody.innerHTML = '';
  
  quoteItems.forEach((item, index) => {
    const precioConMarkup = item.precioUnit * (1 + markupPercent / 100);
    const ivaAmount = precioConMarkup * IVA_RATE;
    const subtotal = (precioConMarkup + ivaAmount) * item.quantity;
    
    const tr = document.createElement('tr');
    tr.className = item.isService ? 'service-row' : '';
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descripcion}</td>
      <td>${item.marca || '-'}</td>
      <td>$${precioConMarkup.toFixed(2)}</td>
      <td>$${ivaAmount.toFixed(2)}</td>
      <td><input type="number" min="1" value="${item.quantity}" data-index="${index}" class="qty-input" /></td>
      <td>$${subtotal.toFixed(2)}</td>
      <td><button class="btn-remove" data-index="${index}">&times;</button></td>
    `;
    tbody.appendChild(tr);
  });
  
  tbody.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index);
      quoteItems[idx].quantity = parseInt(e.target.value) || 1;
      renderQuoteItems();
    });
  });
  
  tbody.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      quoteItems.splice(idx, 1);
      renderQuoteItems();
    });
  });
  
  updateTotals();
}

function updateTotals() {
  let subtotal = 0;
  let totalIva = 0;
  
  quoteItems.forEach(item => {
    const precioConMarkup = item.precioUnit * (1 + markupPercent / 100);
    const ivaAmount = precioConMarkup * IVA_RATE;
    subtotal += precioConMarkup * item.quantity;
    totalIva += ivaAmount * item.quantity;
  });
  
  const total = subtotal + totalIva;
  
  document.getElementById('total-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('total-iva').textContent = `$${totalIva.toFixed(2)}`;
  document.getElementById('total-general').textContent = `$${total.toFixed(2)}`;
}

function clearQuote() {
  quoteItems = [];
  renderQuoteItems();
  document.getElementById('client-name').value = '';
  document.getElementById('client-cuit').value = '';
  document.getElementById('client-address').value = '';
  document.getElementById('client-phone').value = '';
  document.getElementById('client-email').value = '';
}

function generatePDF() {
  if (quoteItems.length === 0) {
    showToast('No hay items en el presupuesto', 'warning');
    return;
  }
  
  const client = {
    nombre: document.getElementById('client-name').value || '-',
    cuit: document.getElementById('client-cuit').value || '-',
    direccion: document.getElementById('client-address').value || '-',
    telefono: document.getElementById('client-phone').value || '-',
    email: document.getElementById('client-email').value || '-'
  };
  
  fetch('http://localhost:3001/api/quote/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: quoteItems, client })
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al generar PDF');
    return res.blob();
  })
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presupuesto-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('PDF generado exitosamente', 'success');
  })
  .catch(err => {
    showToast('Error al generar PDF: ' + err.message, 'error');
  });
}

function getQuoteItems() {
  return quoteItems;
}

export { quoteItems, IVA_RATE, markupPercent, getQuoteItems };