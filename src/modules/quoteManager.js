import { getDom } from './uiManager.js';
import { showToast } from './uiManager.js';

const IVA_RATE = 0.21;
const API      = 'http://localhost:3001';

let quoteItems        = [];
let markupIOTEC       = 30;  // % margen IOTEC (oculto al cliente)
let markupInstalador  = 0;   // % margen instalador (editable)

// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────
export function initQuoteManager() {
  getDom(); // inicializa referencias

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });

  // Markup IOTEC (oculto — sólo admin, valor inicial en variable)
  const markupIOTECInput = document.getElementById('markup-iotec');
  if (markupIOTECInput) {
    markupIOTEC = parseFloat(markupIOTECInput.value) || 30;
    markupIOTECInput.addEventListener('input', e => {
      markupIOTEC = parseFloat(e.target.value) || 0;
      renderQuoteItems();
    });
  }

  // Markup Instalador (editable)
  const markupInput = document.getElementById('markup-percent');
  if (markupInput) {
    markupInput.addEventListener('input', e => {
      markupInstalador = parseFloat(e.target.value) || 0;
      renderQuoteItems();
    });
  }

  // Búsqueda de productos
  const searchInput   = document.getElementById('product-search');
  const searchResults = document.getElementById('search-results');
  let searchTimeout;

  searchInput.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) { searchResults.classList.add('hidden'); return; }
    searchTimeout = setTimeout(() => searchProducts(query), 300);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-input-wrapper')) {
      searchResults.classList.add('hidden');
    }
  });

  // Botones
  document.getElementById('btn-generate-pdf').addEventListener('click',   generatePDF);
  document.getElementById('btn-clear-quote').addEventListener('click',    clearQuote);
  document.getElementById('btn-add-service').addEventListener('click',    addManualService);
  document.getElementById('btn-add-extra').addEventListener('click',      addExtra);

  // Cargar catálogo de servicios desde API
  loadServicesCatalog();
}

// ─────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────
function handleTabSwitch(e) {
  const tab = e.target.dataset.tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');

  const sectionUpload = document.getElementById('section-upload');
  const sectionQuote  = document.getElementById('section-quote');

  if (tab === 'converter') {
    sectionQuote.classList.add('hidden');
    sectionUpload.classList.remove('hidden');
  } else {
    sectionUpload.classList.add('hidden');
    sectionQuote.classList.remove('hidden');
  }
}

// ─────────────────────────────────────────────────────────
// CATÁLOGO DE SERVICIOS
// ─────────────────────────────────────────────────────────
async function loadServicesCatalog() {
  try {
    const res      = await fetch(`${API}/api/services`);
    const services = await res.json();
    renderServiceCatalog(services);
  } catch (err) {
    console.warn('No se pudo cargar catálogo de servicios:', err.message);
    // Intentar seed automático la primera vez
    try {
      await fetch(`${API}/api/services/seed`, { method: 'POST' });
      const res2     = await fetch(`${API}/api/services`);
      const services = await res2.json();
      renderServiceCatalog(services);
    } catch { /* silencioso */ }
  }
}

function renderServiceCatalog(services) {
  const container = document.getElementById('services-catalog');
  if (!container) return;
  container.innerHTML = '';

  const tipos = {
    HORAS_SOPORTE:       { label: 'Soporte',      icon: '🛡️' },
    INGENIERIA:          { label: 'Ingeniería',    icon: '⚙️' },
    JORNADA_INSTALACION: { label: 'Instalación',   icon: '🔧' }
  };

  // Agrupar por tipo
  const grouped = {};
  services.forEach(s => {
    if (!grouped[s.tipo]) grouped[s.tipo] = [];
    grouped[s.tipo].push(s);
  });

  Object.entries(grouped).forEach(([tipo, items]) => {
    const info = tipos[tipo] || { label: tipo, icon: '📋' };

    const group = document.createElement('div');
    group.className = 'service-group';
    group.innerHTML = `<div class="service-group-title">${info.icon} ${info.label}</div>`;

    items.forEach(s => {
      const div = document.createElement('div');
      div.className = 'service-card';
      div.innerHTML = `
        <div class="service-card-name">${s.descripcion}</div>
        <div class="service-card-unit">${s.unidad}</div>
        <input type="number" class="service-price-input" placeholder="Precio $" min="0" step="0.01" id="svc-price-${s.id}"/>
        <button class="btn-add-svc" data-id="${s.id}" data-codigo="${s.codigo}" data-desc="${s.descripcion}" data-unidad="${s.unidad}">
          + Agregar
        </button>
      `;
      group.appendChild(div);
    });

    container.appendChild(group);
  });

  // Listeners para agregar servicios del catálogo
  container.querySelectorAll('.btn-add-svc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = btn.dataset.id;
      const precio = parseFloat(document.getElementById(`svc-price-${id}`)?.value) || 0;
      if (precio <= 0) { showToast('Ingresá el precio del servicio', 'warning'); return; }

      addItemToQuote({
        id:          `SVC-${id}`,
        codigo:      btn.dataset.codigo,
        descripcion: btn.dataset.desc,
        marca:       btn.dataset.unidad,
        precioBase:  precio,
        isService:   true,
        quantity:    1
      });
    });
  });
}

// ─────────────────────────────────────────────────────────
// BÚSQUEDA DE PRODUCTOS
// ─────────────────────────────────────────────────────────
async function searchProducts(query) {
  try {
    const res      = await fetch(`${API}/api/products/search?q=${encodeURIComponent(query)}`);
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
    searchResults.innerHTML = '<div class="search-result-item muted">Sin resultados</div>';
    searchResults.classList.remove('hidden');
    return;
  }

  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.innerHTML = `
      <div class="product-code">${p.codigo}</div>
      <div class="product-name">${p.descripcion}</div>
      <div class="product-price">Base: $${p.precioPartner?.toFixed(2) || '0.00'}</div>
    `;
    div.addEventListener('click', () => {
      addItemToQuote({
        id:          p.id,
        codigo:      p.codigo,
        descripcion: p.descripcion,
        marca:       p.marca || '-',
        precioBase:  p.precioPartner || 0,
        isService:   false,
        quantity:    1
      });
      document.getElementById('product-search').value = '';
      searchResults.classList.add('hidden');
    });
    searchResults.appendChild(div);
  });

  searchResults.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────
// AGREGAR ÍTEMS
// ─────────────────────────────────────────────────────────
function addItemToQuote(item) {
  const existing = quoteItems.find(i => i.id === item.id);
  if (existing) {
    existing.quantity++;
  } else {
    quoteItems.push({ ...item });
  }
  renderQuoteItems();
  showToast(`${item.descripcion.substring(0, 30)} agregado`, 'success');
}

// Servicio manual libre (Ferretería fina, Cableado, etc.)
function addManualService() {
  const desc  = document.getElementById('service-desc').value.trim();
  const price = parseFloat(document.getElementById('service-price').value) || 0;
  const qty   = parseInt(document.getElementById('service-qty').value)     || 1;

  if (!desc || price <= 0) { showToast('Ingresá descripción y precio válido', 'warning'); return; }

  addItemToQuote({
    id:          Date.now(),
    codigo:      'SRV',
    descripcion: desc,
    marca:       '-',
    precioBase:  price,
    isService:   true,
    quantity:    qty
  });

  document.getElementById('service-desc').value  = '';
  document.getElementById('service-price').value = '';
  document.getElementById('service-qty').value   = '1';
}

// Ítems extras (ferretería fina, cableado)
function addExtra() {
  const desc  = document.getElementById('extra-desc').value.trim();
  const price = parseFloat(document.getElementById('extra-price').value) || 0;
  const qty   = parseInt(document.getElementById('extra-qty').value)     || 1;

  if (!desc || price <= 0) { showToast('Ingresá descripción y precio válido', 'warning'); return; }

  addItemToQuote({
    id:          Date.now(),
    codigo:      'EXTRA',
    descripcion: desc,
    marca:       '-',
    precioBase:  price,
    isService:   true,
    quantity:    qty
  });

  document.getElementById('extra-desc').value  = '';
  document.getElementById('extra-price').value = '';
  document.getElementById('extra-qty').value   = '1';
}

// ─────────────────────────────────────────────────────────
// LÓGICA DE DOBLE MARKUP
// precioBase → × (1 + markupIOTEC%) → × (1 + markupInstalador%) → precioFinal
// ─────────────────────────────────────────────────────────
function calcPrecioFinal(precioBase) {
  const conIOTEC      = precioBase * (1 + markupIOTEC / 100);
  const conInstalador = conIOTEC   * (1 + markupInstalador / 100);
  return conInstalador;
}

// ─────────────────────────────────────────────────────────
// RENDER TABLA
// ─────────────────────────────────────────────────────────
function renderQuoteItems() {
  const tbody = document.getElementById('items-body');
  tbody.innerHTML = '';

  quoteItems.forEach((item, index) => {
    const precioFinal = calcPrecioFinal(item.precioBase);
    const ivaAmount   = precioFinal * IVA_RATE;
    const subtotal    = (precioFinal + ivaAmount) * item.quantity;

    const tr = document.createElement('tr');
    tr.className = item.isService ? 'service-row' : '';
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descripcion}</td>
      <td>${item.marca || '-'}</td>
      <td>$${precioFinal.toFixed(2)}</td>
      <td>$${ivaAmount.toFixed(2)}</td>
      <td><input type="number" min="1" value="${item.quantity}" data-index="${index}" class="qty-input" /></td>
      <td>$${subtotal.toFixed(2)}</td>
      <td><button class="btn-remove" data-index="${index}">&times;</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', e => {
      const idx = parseInt(e.target.dataset.index);
      quoteItems[idx].quantity = parseInt(e.target.value) || 1;
      renderQuoteItems();
    });
  });

  tbody.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.index);
      quoteItems.splice(idx, 1);
      renderQuoteItems();
    });
  });

  updateTotals();
}

function updateTotals() {
  let subtotal = 0, totalIva = 0;

  quoteItems.forEach(item => {
    const precioFinal = calcPrecioFinal(item.precioBase);
    const ivaAmount   = precioFinal * IVA_RATE;
    subtotal  += precioFinal * item.quantity;
    totalIva  += ivaAmount   * item.quantity;
  });

  const total = subtotal + totalIva;
  document.getElementById('total-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('total-iva').textContent      = `$${totalIva.toFixed(2)}`;
  document.getElementById('total-general').textContent  = `$${total.toFixed(2)}`;
}

function clearQuote() {
  quoteItems = [];
  renderQuoteItems();
  ['client-name','client-cuit','client-address','client-phone','client-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// ─────────────────────────────────────────────────────────
// GENERAR PDF PRESUPUESTO RÁPIDO
// ─────────────────────────────────────────────────────────
function generatePDF() {
  if (quoteItems.length === 0) { showToast('No hay ítems en el presupuesto', 'warning'); return; }

  const items = getQuoteItemsForExport();
  const client = {
    nombre:    document.getElementById('client-name')?.value    || '-',
    cuit:      document.getElementById('client-cuit')?.value    || '-',
    direccion: document.getElementById('client-address')?.value || '-',
    telefono:  document.getElementById('client-phone')?.value   || '-',
    email:     document.getElementById('client-email')?.value   || '-'
  };

  fetch(`${API}/api/quote/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, client })
  })
  .then(res => { if (!res.ok) throw new Error('Error al generar PDF'); return res.blob(); })
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `presupuesto-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('PDF generado exitosamente', 'success');
  })
  .catch(err => showToast('Error al generar PDF: ' + err.message, 'error'));
}

// ─────────────────────────────────────────────────────────
// EXPORTS para wizardManager
// ─────────────────────────────────────────────────────────
function getQuoteItems() {
  return quoteItems;
}

/**
 * Retorna ítems con precio final aplicando doble markup.
 * NO expone precioBase (precio de costo).
 */
function getQuoteItemsForExport() {
  return quoteItems.map(item => {
    const precioFinal = calcPrecioFinal(item.precioBase);
    const ivaAmount   = precioFinal * IVA_RATE;
    return {
      ...item,
      precioUnit: precioFinal,
      ivaAmount,
      // Eliminamos datos de costo interno
      precioBase:  undefined,
      precioPartner: undefined,
      precioGremio:  undefined,
      precioPmp:     undefined,
    };
  });
}

function getTotals() {
  let subtotal = 0, totalIva = 0;
  quoteItems.forEach(item => {
    const p = calcPrecioFinal(item.precioBase);
    subtotal += p * item.quantity;
    totalIva += p * IVA_RATE * item.quantity;
  });
  return {
    subtotal: `$${subtotal.toFixed(2)}`,
    iva:      `$${totalIva.toFixed(2)}`,
    total:    `$${(subtotal + totalIva).toFixed(2)}`
  };
}

export { quoteItems, IVA_RATE, markupIOTEC, markupInstalador, getQuoteItems, getQuoteItemsForExport, getTotals };