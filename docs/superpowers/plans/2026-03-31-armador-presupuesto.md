# Armador de Presupuesto - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar funcionalidad para crear presupuestos desde la base de datos de productos, con búsqueda autocomplete, carga de datos de cliente, cálculo de IVA y generación de PDF.

**Architecture:** Nueva vista de presupuesto integrada al frontend existente. API endpoints en backend para búsqueda de productos y generación de PDF. Uso de jspdf para generar documentos.

**Tech Stack:** Frontend: vanilla JS, CSS existente. Backend: Express, Prisma (SQLite). PDF: jspdf + jspdf-autotable.

---

## Estructura de Archivos

### Backend (API)
- `backend/server.js` - Agregar endpoints de presupuesto
- `backend/controllers/quoteController.js` - Nuevo controlador
- `backend/services/pdfService.js` - Nuevo servicio para PDF

### Frontend (UI)
- `index.html` - Agregar tabs/navegación y sección presupuesto
- `src/main.js` - Routing entre vistas
- `src/modules/quoteManager.js` - Nuevo módulo para gestión de presupuesto
- `src/styles/index.css` - Estilos para nueva UI

---

## Tareas

### Task 1: Endpoint API para búsqueda de productos

**Files:**
- Modify: `backend/server.js`
- Create: `backend/controllers/quoteController.js`

- [ ] **Step 1: Crear quoteController.js con función de búsqueda**

```javascript
// backend/controllers/quoteController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function searchProducts(query) {
  if (!query || query.length < 2) return [];
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { descripcion: { contains: query } },
        { codigo: { contains: query } },
        { marca: { contains: query } }
      ]
    },
    take: 10,
    select: {
      id: true,
      codigo: true,
      descripcion: true,
      marca: true,
      precioPartner: true,
      iva: true
    }
  });
  
  return products;
}
```

- [ ] **Step 2: Agregar endpoint en server.js**

```javascript
// Después de app.post('/api/upload'...)
app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    const products = await searchProducts(q);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 3: Probar endpoint**

Run: `curl http://localhost:3001/api/products/search?q=camera`
Expected: JSON array con productos

---

### Task 2: UI - Agregar navegación y sección presupuesto

**Files:**
- Modify: `index.html`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Agregar tabs en index.html**

```html
<!-- Después del header-content, agregar nav-tabs -->
<div class="nav-tabs">
  <button class="tab-btn active" data-tab="converter">Conversor</button>
  <button class="tab-btn" data-tab="quote">Presupuesto</button>
</div>
```

- [ ] **Step 2: Agregar sección presupuesto**

```html
<!-- Después de section-results -->
<section id="section-quote" class="section section-quote hidden">
  <!-- Cliente -->
  <div class="quote-client">
    <h3>Datos del Cliente</h3>
    <div class="form-row">
      <input type="text" id="client-name" placeholder="Nombre" />
      <input type="text" id="client-cuit" placeholder="CUIT" />
      <input type="text" id="client-address" placeholder="Dirección" />
    </div>
    <div class="form-row">
      <input type="text" id="client-phone" placeholder="Teléfono" />
      <input type="email" id="client-email" placeholder="Email" />
    </div>
  </div>
  
  <!-- Buscador productos -->
  <div class="quote-search">
    <h3>Agregar Productos</h3>
    <div class="search-input-wrapper">
      <input type="text" id="product-search" placeholder="Buscar producto..." autocomplete="off" />
      <div id="search-results" class="search-results hidden"></div>
    </div>
  </div>
  
  <!-- Items table -->
  <div class="quote-items">
    <table id="items-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Descripción</th>
          <th>Marca</th>
          <th>Precio Unit.</th>
          <th>IVA</th>
          <th>Cantidad</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="items-body"></tbody>
    </table>
  </div>
  
  <!-- Totales -->
  <div class="quote-totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span id="total-subtotal">$0.00</span>
    </div>
    <div class="total-row">
      <span>IVA (21%):</span>
      <span id="total-iva">$0.00</span>
    </div>
    <div class="total-row total-final">
      <span>Total:</span>
      <span id="total-general">$0.00</span>
    </div>
  </div>
  
  <!-- Actions -->
  <div class="quote-actions">
    <button id="btn-generate-pdf" class="btn btn-primary">Generar PDF</button>
    <button id="btn-clear-quote" class="btn btn-ghost">Limpiar</button>
  </div>
</section>
```

- [ ] **Step 3: Agregar estilos CSS para quote**

```css
/* Agregar en index.css */
.nav-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab-btn { padding: 0.75rem 1.5rem; border: none; background: var(--color-bg-secondary); cursor: pointer; border-radius: 8px 8px 0 0; }
.tab-btn.active { background: var(--color-bg); border-bottom: 2px solid var(--color-primary); }

.quote-client, .quote-search { margin-bottom: 1.5rem; }
.form-row { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
.form-row input { flex: 1; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 6px; }

.search-input-wrapper { position: relative; }
.search-results { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid var(--color-border); border-radius: 6px; max-height: 300px; overflow-y: auto; z-index: 100; }
.search-result-item { padding: 0.75rem; cursor: pointer; border-bottom: 1px solid var(--color-border); }
.search-result-item:hover { background: var(--color-bg-secondary); }
.search-result-item .product-code { font-size: 0.8rem; color: var(--color-text-secondary); }
.search-result-item .product-name { font-weight: 500; }
.search-result-item .product-price { color: var(--color-primary); font-weight: 600; }

.quote-items table { width: 100%; border-collapse: collapse; }
.quote-items th, .quote-items td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--color-border); }
.quote-items th { background: var(--color-bg-secondary); font-weight: 600; }
.quote-items input[type="number"] { width: 60px; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px; }
.quote-items .btn-remove { background: none; border: none; color: var(--color-error); cursor: pointer; font-size: 1.2rem; }

.quote-totals { margin-top: 1.5rem; padding: 1rem; background: var(--color-bg-secondary); border-radius: 8px; max-width: 300px; margin-left: auto; }
.total-row { display: flex; justify-content: space-between; padding: 0.5rem 0; }
.total-row.total-final { font-size: 1.25rem; font-weight: 700; border-top: 2px solid var(--color-border); margin-top: 0.5rem; padding-top: 0.75rem; }

.quote-actions { margin-top: 1.5rem; display: flex; gap: 1rem; }
```

---

### Task 3: Lógica frontend - quoteManager

**Files:**
- Create: `src/modules/quoteManager.js`

- [ ] **Step 1: Crear quoteManager.js**

```javascript
// src/modules/quoteManager.js
import { getDom } from './uiManager.js';
import { showToast } from './uiManager.js';

const IVA_RATE = 0.21;

let quoteItems = [];

export function initQuoteManager() {
  const dom = getDom();
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });
  
  // Product search
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
  
  // Hide results on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrapper')) {
      searchResults.classList.add('hidden');
    }
  });
  
  // Generate PDF
  document.getElementById('btn-generate-pdf').addEventListener('click', generatePDF);
  
  // Clear quote
  document.getElementById('btn-clear-quote').addEventListener('click', clearQuote);
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

function renderQuoteItems() {
  const tbody = document.getElementById('items-body');
  tbody.innerHTML = '';
  
  quoteItems.forEach((item, index) => {
    const subtotal = (item.precioUnit + item.ivaAmount) * item.quantity;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descripcion}</td>
      <td>${item.marca || '-'}</td>
      <td>$${item.precioUnit.toFixed(2)}</td>
      <td>$${item.ivaAmount.toFixed(2)}</td>
      <td><input type="number" min="1" value="${item.quantity}" data-index="${index}" class="qty-input" /></td>
      <td>$${subtotal.toFixed(2)}</td>
      <td><button class="btn-remove" data-index="${index}">&times;</button></td>
    `;
    tbody.appendChild(tr);
  });
  
  // Quantity change listeners
  tbody.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index);
      quoteItems[idx].quantity = parseInt(e.target.value) || 1;
      renderQuoteItems();
    });
  });
  
  // Remove button listeners
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
    const itemSubtotal = (item.precioUnit + item.ivaAmount) * item.quantity;
    subtotal += item.precioUnit * item.quantity;
    totalIva += item.ivaAmount * item.quantity;
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
  
  // Get client data
  const client = {
    nombre: document.getElementById('client-name').value || '-',
    cuit: document.getElementById('client-cuit').value || '-',
    direccion: document.getElementById('client-address').value || '-',
    telefono: document.getElementById('client-phone').value || '-',
    email: document.getElementById('client-email').value || '-'
  };
  
  // This will be implemented in Task 4
  window.generatePDFData = { items: quoteItems, client, ivaRate: IVA_RATE };
  
  // Dispatch event or call backend
  fetch('http://localhost:3001/api/quote/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: quoteItems, client })
  })
  .then(res => res.blob())
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
```

- [ ] **Step 2: Integrar en main.js**

```javascript
// En main.js, después de imports
import { initQuoteManager } from './modules/quoteManager.js';

// En DOMContentLoaded
initQuoteManager();
```

---

### Task 4: Backend - Generación de PDF

**Files:**
- Create: `backend/services/pdfService.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Instalar dependencias**

```bash
cd backend && npm install jspdf jspdf-autotable
```

- [ ] **Step 2: Crear pdfService.js**

```javascript
// backend/services/pdfService.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateQuotePDF(data) {
  const { items, client } = data;
  const ivaRate = 0.21;
  const today = new Date().toLocaleDateString('es-AR');
  const quoteNumber = `P-${Date.now().toString().slice(-6)}`;
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('PRESUPUESTO', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`N°: ${quoteNumber}`, 105, 28, { align: 'center' });
  doc.text(`Fecha: ${today}`, 105, 34, { align: 'center' });
  
  // Client info
  doc.setFontSize(12);
  doc.text('Datos del Cliente:', 14, 50);
  doc.setFontSize(10);
  doc.text(`Nombre: ${client.nombre}`, 14, 58);
  doc.text(`CUIT: ${client.cuit}`, 14, 64);
  doc.text(`Dirección: ${client.direccion}`, 14, 70);
  doc.text(`Teléfono: ${client.telefono}`, 14, 76);
  doc.text(`Email: ${client.email}`, 14, 82);
  
  // Items table
  const tableData = items.map(item => [
    item.codigo,
    item.descripcion.substring(0, 30) + (item.descripcion.length > 30 ? '...' : ''),
    item.marca || '-',
    item.quantity,
    `$${item.precioUnit.toFixed(2)}`,
    `$${item.ivaAmount.toFixed(2)}`,
    `$${((item.precioUnit + item.ivaAmount) * item.quantity).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 95,
    head: [['Código', 'Descripción', 'Marca', 'Cant', 'Precio', 'IVA', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  let subtotal = 0;
  let totalIva = 0;
  
  items.forEach(item => {
    subtotal += item.precioUnit * item.quantity;
    totalIva += item.ivaAmount * item.quantity;
  });
  
  const total = subtotal + totalIva;
  
  doc.setFontSize(11);
  doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
  doc.text(`IVA (21%): $${totalIva.toFixed(2)}`, 140, finalY + 6);
  doc.setFontSize(14);
  doc.text(`TOTAL: $${total.toFixed(2)}`, 140, finalY + 14);
  
  // Footer
  doc.setFontSize(8);
  doc.text('Presupuesto válido por 30 días', 105, 280, { align: 'center' });
  
  return doc.output('blob');
}
```

- [ ] **Step 3: Agregar endpoint en server.js**

```javascript
import { generateQuotePDF } from './services/pdfService.js';

// Después del endpoint de búsqueda
app.post('/api/quote/generate-pdf', async (req, res) => {
  try {
    const { items, client } = req.body;
    const pdfBlob = generateQuotePDF({ items, client });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=presupuesto.pdf');
    res.send(pdfBlob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 4: Probar flujo completo**

1. Ir a tab "Presupuesto"
2. Buscar producto
3. Agregar al quote
4. Completar datos cliente
5. Generar PDF
6. Verificar PDF descargado

---

## Verificación

- [ ] Búsqueda de productos funciona correctamente
- [ ] Autocomplete muestra hasta 10 resultados
- [ ] Items se agregan correctamente a la tabla
- [ ] Cantidad es editable y actualiza totales
- [ ] IVA se calcula correctamente (21%)
- [ ] Totales se actualizan en tiempo real
- [ ] PDF se genera con todos los datos
- [ ] Datos del cliente aparecen en el PDF

