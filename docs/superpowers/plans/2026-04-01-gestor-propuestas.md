# Gestor de Propuestas Comerciales - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar markup global, items adicionales (servicios), wizard de propuestas, integración con Gemini AI para generar propuestas comerciales con infografías, y PDF final.

**Architecture:** Extiende el presupuesto existente con markup, servicios, wizard de 5 pasos, integración API Gemini para generar propuesta, y PDF enriquecido.

**Tech Stack:** Frontend vanilla JS, Backend Express, Gemini API, jsPDF para PDF.

---

## Estructura de Archivos

### Backend
- `backend/server.js` - Agregar endpoints
- `backend/controllers/proposalController.js` - Nuevo: lógica de propuestas
- `backend/services/geminiService.js` - Nuevo: integración Gemini API

### Frontend
- `index.html` - Agregar UI markup, servicios, wizard
- `src/main.js` - Integrar nuevo módulo
- `src/modules/proposalManager.js` - Nuevo: gestión del wizard
- `src/styles/index.css` - Nuevos estilos

---

## Tareas

### Task 1: Markup Global en Presupuesto

**Files:**
- Modify: `src/modules/quoteManager.js`
- Modify: `index.html`

- [ ] **Step 1: Agregar input markup en UI**

En la sección de presupuesto, después de los totales agregar:
```html
<div class="markup-input">
  <label for="markup-percent">Markup (%): </label>
  <input type="number" id="markup-percent" value="0" min="0" max="100" />
</div>
```

- [ ] **Step 2: Modificar quoteManager para calcular markup**

En `quoteManager.js`:
```javascript
let markupPercent = 0;

export function initQuoteManager() {
  // Existing code...
  
  // Add markup listener
  const markupInput = document.getElementById('markup-percent');
  markupInput.addEventListener('input', (e) => {
    markupPercent = parseFloat(e.target.value) || 0;
    renderQuoteItems();
  });
}

// Modify renderQuoteItems to apply markup
function renderQuoteItems() {
  // Existing code...
  
  quoteItems.forEach((item, index) => {
    const precioConMarkup = item.precioUnit * (1 + markupPercent / 100);
    const ivaAmount = precioConMarkup * IVA_RATE;
    const subtotal = (precioConMarkup + ivaAmount) * item.quantity;
    // ... render row with markup prices
  });
  
  updateTotals();
}
```

- [ ] **Step 3: Verificar cálculo**

- Markup 0%: precio sin cambio
- Markup 20%: precio aumenta 20%
- Totales se actualizan automáticamente

---

### Task 2: Items Adicionales (Servicios)

**Files:**
- Modify: `index.html`
- Modify: `src/modules/quoteManager.js`

- [ ] **Step 1: Agregar UI para servicios**

En la sección de búsqueda de productos:
```html
<div class="service-input">
  <h4>Agregar Servicio</h4>
  <div class="form-row">
    <input type="text" id="service-desc" placeholder="Descripción del servicio" />
    <input type="number" id="service-price" placeholder="Precio unit." />
    <input type="number" id="service-qty" placeholder="Cantidad" value="1" min="1" />
    <button id="btn-add-service" class="btn btn-secondary">Agregar</button>
  </div>
</div>
```

- [ ] **Step 2: Modificar quoteManager para servicios**

```javascript
// En addProductToQuote, agregar tipo:
quoteItems.push({
  ...product,
  quantity: 1,
  precioUnit: product.precioPartner || 0,
  ivaAmount: (product.precioPartner || 0) * IVA_RATE,
  isService: false
});

// Nueva función para agregar servicios
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
  
  // Limpiar inputs
  document.getElementById('service-desc').value = '';
  document.getElementById('service-price').value = '';
  document.getElementById('service-qty').value = '1';
  
  renderQuoteItems();
}
```

- [ ] **Step 3: Diferenciar servicios en la tabla**

En renderQuoteItems, marcar servicios differently:
```javascript
<tr class="${item.isService ? 'service-row' : ''}">
  ...
</tr>
```

---

### Task 3: Wizard de Propuestas

**Files:**
- Modify: `index.html`
- Create: `src/modules/wizardManager.js`

- [ ] **Step 1: Agregar UI del wizard**

```html
<!-- Nueva sección después de quote-totals -->
<section id="section-wizard" class="section-wizard hidden">
  <div class="wizard-steps">
    <div class="wizard-step active" data-step="1">1. Proyecto</div>
    <div class="wizard-step" data-step="2">2. Alcances</div>
    <div class="wizard-step" data-step="3">3. Fuera de Alcances</div>
    <div class="wizard-step" data-step="4">4. Solución</div>
    <div class="wizard-step" data-step="5">5. Revisión</div>
  </div>
  
  <div class="wizard-content">
    <!-- Step 1: Datos del proyecto -->
    <div class="wizard-panel" data-step="1">
      <h3>Datos del Proyecto</h3>
      <input type="text" id="project-name" placeholder="Nombre del proyecto" />
      <textarea id="project-desc" placeholder="Descripción breve del proyecto"></textarea>
    </div>
    
    <!-- Step 2: Alcances -->
    <div class="wizard-panel" data-step="2">
      <h3>Alcances del Proyecto</h3>
      <textarea id="project-scope" placeholder="¿Qué incluye el proyecto?"></textarea>
    </div>
    
    <!-- Step 3: Fuera de alcances -->
    <div class="wizard-panel" data-step="3">
      <h3>Fuera de Alcances</h3>
      <textarea id="project-out-of-scope" placeholder="¿Qué NO incluye el proyecto?"></textarea>
    </div>
    
    <!-- Step 4: Solución -->
    <div class="wizard-panel" data-step="4">
      <h3>Solución Técnica</h3>
      <textarea id="project-solution" placeholder="Describe la solución propuesta"></textarea>
    </div>
    
    <!-- Step 5: Revisión -->
    <div class="wizard-panel" data-step="5">
      <h3>Revisión de Totales</h3>
      <div id="review-totals"></div>
      <label>
        <input type="checkbox" id="confirm-totals" />
        Confirmo que los totales son correctos
      </label>
    </div>
  </div>
  
  <div class="wizard-nav">
    <button id="btn-wizard-prev" class="btn btn-ghost" disabled>Atrás</button>
    <button id="btn-wizard-next" class="btn btn-primary">Siguiente</button>
    <button id="btn-generate-proposal" class="btn btn-primary hidden">Generar Propuesta</button>
  </div>
</section>
```

- [ ] **Step 2: Crear wizardManager.js**

```javascript
// src/modules/wizardManager.js
import { showToast } from './uiManager.js';

let currentStep = 1;
const totalSteps = 5;

export function initWizardManager() {
  document.getElementById('btn-wizard-next').addEventListener('click', nextStep);
  document.getElementById('btn-wizard-prev').addEventListener('click', prevStep);
  document.getElementById('btn-generate-proposal').addEventListener('click', generateProposal);
}

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateWizard();
  }
  
  if (currentStep === 5) {
    showReviewTotals();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateWizard();
  }
}

function updateWizard() {
  // Update step indicators
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
  });
  
  // Show/hide panels
  document.querySelectorAll('.wizard-panel').forEach(panel => {
    panel.classList.toggle('hidden', parseInt(panel.dataset.step) !== currentStep);
  });
  
  // Update buttons
  document.getElementById('btn-wizard-prev').disabled = currentStep === 1;
  document.getElementById('btn-wizard-next').classList.toggle('hidden', currentStep === 5);
  document.getElementById('btn-generate-proposal').classList.toggle('hidden', currentStep !== 5);
}

function showReviewTotals() {
  // Get totals from quoteManager
  const subtotal = document.getElementById('total-subtotal').textContent;
  const iva = document.getElementById('total-iva').textContent;
  const total = document.getElementById('total-general').textContent;
  
  document.getElementById('review-totals').innerHTML = `
    <p><strong>Subtotal:</strong> ${subtotal}</p>
    <p><strong>IVA:</strong> ${iva}</p>
    <p><strong>TOTAL:</strong> ${total}</p>
  `;
}

async function generateProposal() {
  const confirmed = document.getElementById('confirm-totals').checked;
  if (!confirmed) {
    showToast('Debe confirmar que los totales son correctos', 'warning');
    return;
  }
  
  // Collect all data
  const proposalData = {
    project: {
      name: document.getElementById('project-name').value,
      description: document.getElementById('project-desc').value
    },
    scope: document.getElementById('project-scope').value,
    outOfScope: document.getElementById('project-out-of-scope').value,
    solution: document.getElementById('project-solution').value,
    items: window.quoteItems,
    totals: {
      subtotal: document.getElementById('total-subtotal').textContent,
      iva: document.getElementById('total-iva').textContent,
      total: document.getElementById('total-general').textContent
    }
  };
  
  // Call backend API
  showToast('Generando propuesta...', 'info');
  
  try {
    const response = await fetch('http://localhost:3001/api/proposal/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData)
    });
    
    const result = await response.blob();
    
    // Download PDF
    const url = URL.createObjectURL(result);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propuesta-${Date.now()}.pdf`;
    a.click();
    
    showToast('Propuesta generada exitosamente', 'success');
  } catch (err) {
    showToast('Error al generar propuesta: ' + err.message, 'error');
  }
}
```

- [ ] **Step 3: Integrar con main.js**

```javascript
import { initWizardManager } from './modules/wizardManager.js';

// En DOMContentLoaded
initWizardManager();
```

---

### Task 4: Backend - Gemini Service

**Files:**
- Create: `backend/services/geminiService.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Crear geminiService.js**

```javascript
// backend/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateProposalContent(data) {
  const { project, scope, outOfScope, solution, items, totals } = data;
  
  const itemsList = items.map(item => 
    `- ${item.descripcion} (${item.quantity}x): $${((item.precioUnit + item.ivaAmount) * item.quantity).toFixed(2)}`
  ).join('\n');
  
  const prompt = `
Eres un asistente comercial especializado en generar propuestas técnicas profesionales.

Genera una propuesta comercial completa y profesional con los siguientes datos:

## Datos del Proyecto
- Nombre: ${project.name || 'Sin nombre'}
- Descripción: ${project.description || 'Sin descripción'}

## Alcances
${scope || 'No especificado'}

## Fuera de Alcances
${outOfScope || 'No especificado'}

## Solución Técnica
${solution || 'No especificado'}

## Items del Presupuesto
${itemsList}

## Totales
- Subtotal: ${totals.subtotal}
- IVA: ${totals.iva}
- TOTAL: ${totals.total}

Genera:
1. Un resumen ejecutivo (2-3 oraciones)
2. Descripción de la solución propuesta
3. Beneficios principales ( lista )
4. Sugerencias de diagramas en formato Mermaid que ilustren la arquitectura de la solución

Usa un tono profesional y orientado a ventas.
`;

  const model = genAI.getModel('gemini-pro');
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  return response.text();
}
```

- [ ] **Step 2: Instalar dependencia**

```bash
cd backend && npm install @google/generative-ai
```

- [ ] **Step 3: Agregar endpoint en server.js**

```javascript
import { generateProposalContent } from './services/geminiService.js';
import { generateProposalPDF } from './services/proposalPdfService.js';

app.post('/api/proposal/generate', async (req, res) => {
  try {
    const { project, scope, outOfScope, solution, items, totals } = req.body;
    
    // Generate AI content
    const aiContent = await generateProposalContent({
      project, scope, outOfScope, solution, items, totals
    });
    
    // Generate PDF with AI content
    const pdfBlob = generateProposalPDF({
      project, scope, outOfScope, solution, items, totals, aiContent
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=propuesta.pdf');
    res.send(pdfBlob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### Task 5: PDF Propuesta Enriquecido

**Files:**
- Create: `backend/services/proposalPdfService.js`

- [ ] **Step 1: Crear proposalPdfService.js**

```javascript
// backend/services/proposalPdfService.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateProposalPDF(data) {
  const { project, scope, outOfScope, solution, items, totals, aiContent } = data;
  const today = new Date().toLocaleDateString('es-AR');
  const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('PROPUESTA COMERCIAL', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`N°: ${proposalNumber}`, 105, 28, { align: 'center' });
  doc.text(`Fecha: ${today}`, 105, 34, { align: 'center' });
  
  // Project info
  doc.setFontSize(14);
  doc.text(`Proyecto: ${project.name || 'Sin nombre'}`, 14, 50);
  doc.setFontSize(10);
  doc.text(project.description || '', 14, 58);
  
  // Items table
  doc.setFontSize(12);
  doc.text('Detalle del Presupuesto:', 14, 75);
  
  const tableData = items.map(item => [
    item.codigo,
    item.descripcion.substring(0, 35),
    item.quantity,
    `$${item.precioUnit.toFixed(2)}`,
    `$${item.ivaAmount.toFixed(2)}`,
    `$${((item.precioUnit + item.ivaAmount) * item.quantity).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [['Código', 'Descripción', 'Cant', 'Precio', 'IVA', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Subtotal: ${totals.subtotal}`, 140, finalY);
  doc.text(`IVA: ${totals.iva}`, 140, finalY + 6);
  doc.setFontSize(14);
  doc.text(`TOTAL: ${totals.total}`, 140, finalY + 14);
  
  // AI Content section
  let contentY = finalY + 30;
  
  if (scope) {
    doc.setFontSize(12);
    doc.text('Alcances:', 14, contentY);
    doc.setFontSize(10);
    const scopeLines = doc.splitTextToSize(scope, 180);
    doc.text(scopeLines, 14, contentY + 8);
    contentY += 8 + (scopeLines.length * 5);
  }
  
  if (outOfScope) {
    doc.setFontSize(12);
    doc.text('Fuera de Alcances:', 14, contentY);
    doc.setFontSize(10);
    const outLines = doc.splitTextToSize(outOfScope, 180);
    doc.text(outLines, 14, contentY + 8);
    contentY += 8 + (outLines.length * 5);
  }
  
  if (solution) {
    doc.setFontSize(12);
    doc.text('Solución Propuesta:', 14, contentY);
    doc.setFontSize(10);
    const solLines = doc.splitTextToSize(solution, 180);
    doc.text(solLines, 14, contentY + 8);
    contentY += 8 + (solLines.length * 5);
  }
  
  // AI Generated content
  if (aiContent) {
    if (contentY > 200) {
      doc.addPage();
      contentY = 20;
    }
    
    doc.setFontSize(12);
    doc.text('Propuesta Técnica:', 14, contentY);
    doc.setFontSize(9);
    const aiLines = doc.splitTextToSize(aiContent, 180);
    doc.text(aiLines, 14, contentY + 8);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.text('Propuesta válida por 30 días', 105, 280, { align: 'center' });
  
  return doc.output('blob');
}
```

---

## Verificación

- [ ] Markup se aplica correctamente a todos los items
- [ ] Items adicionales (servicios) se agregan y calculan correctamente
- [ ] Wizard navega entre los 5 pasos
- [ ] Revisión de totales muestra valores correctos
- [ ] Confirmación requerida antes de generar propuesta
- [ ] API Gemini genera contenido
- [ ] PDF incluye todos los datos + contenido IA
- [ ] Diagramas Mermaid se incluyen si el AI los genera
