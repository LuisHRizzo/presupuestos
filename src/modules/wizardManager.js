import { showToast } from './uiManager.js';
import { getQuoteItems, getQuoteItemsForExport, getTotals } from './quoteManager.js';
import { authFetch } from './authManager.js';

const API        = import.meta.env.VITE_API_URL ?? '';
let currentStep  = 1;
const totalSteps = 5;
let modalidad    = 'IOTEC'; // default

export function initWizardManager() {
  document.getElementById('btn-start-wizard').addEventListener('click',      openWizard);
  document.getElementById('btn-wizard-next').addEventListener('click',       nextStep);
  document.getElementById('btn-wizard-prev').addEventListener('click',       prevStep);
  document.getElementById('btn-generate-proposal').addEventListener('click', generateProposal);

  // Toggle de modalidad
  const toggleBtns = document.querySelectorAll('.modalidad-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modalidad = btn.dataset.modalidad;
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateModalidadUI();
    });
  });
}

function openWizard() {
  if (getQuoteItems().length === 0) {
    showToast('Agregá al menos un ítem al presupuesto antes de generar la propuesta', 'warning');
    return;
  }
  document.getElementById('section-quote').classList.add('hidden');
  document.getElementById('section-wizard').classList.remove('hidden');
  currentStep = 1;
  updateWizard();
  refreshReviewStep();
}

function closeWizard() {
  document.getElementById('section-wizard').classList.add('hidden');
  document.getElementById('section-quote').classList.remove('hidden');
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) {
    currentStep++;
    updateWizard();
  }
  if (currentStep === 4 || currentStep === 5) refreshReviewStep();
}

function prevStep() {
  if (currentStep > 1) { currentStep--; updateWizard(); }
}

function validateStep(step) {
  if (step === 1) {
    const name = document.getElementById('project-name')?.value?.trim();
    if (!name) { showToast('Ingresá el nombre del proyecto para continuar', 'warning'); return false; }
  }
  return true;
}

function updateWizard() {
  document.querySelectorAll('.wizard-step').forEach(step => {
    const n = parseInt(step.dataset.step);
    step.classList.remove('active', 'completed');
    if (n === currentStep) step.classList.add('active');
    if (n < currentStep)   step.classList.add('completed');
  });

  document.querySelectorAll('.wizard-panel').forEach(panel => {
    panel.classList.toggle('hidden', parseInt(panel.dataset.step) !== currentStep);
  });

  document.getElementById('btn-wizard-prev').disabled = currentStep === 1;
  document.getElementById('btn-wizard-next').classList.toggle('hidden', currentStep === totalSteps);
  document.getElementById('btn-generate-proposal').classList.toggle('hidden', currentStep !== totalSteps);

  document.getElementById('wizard-step-indicator').textContent = `Paso ${currentStep} de ${totalSteps}`;
}

function updateModalidadUI() {
  const iotecInfo  = document.getElementById('modalidad-iotec-info');
  const rapidaInfo = document.getElementById('modalidad-rapida-info');
  if (iotecInfo)  iotecInfo.classList.toggle('hidden',  modalidad !== 'IOTEC');
  if (rapidaInfo) rapidaInfo.classList.toggle('hidden', modalidad !== 'VENTA_RAPIDA');
}

function refreshReviewStep() {
  const totals = getTotals();

  const reviewEl = document.getElementById('review-totals');
  if (reviewEl) {
    reviewEl.innerHTML = `
      <div class="review-totals-box">
        <p><span>Subtotal:</span> <strong>${totals.subtotal}</strong></p>
        <p><span>IVA (21%):</span> <strong>${totals.iva}</strong></p>
        <hr/>
        <p class="total-line"><span>TOTAL:</span> <strong>${totals.total}</strong></p>
      </div>
    `;
  }

  // Render resumen de items en paso 3
  const itemsReview = document.getElementById('review-items');
  if (itemsReview) {
    const items = getQuoteItemsForExport();
    itemsReview.innerHTML = items.length === 0
      ? '<p class="muted">No hay ítems en el presupuesto.</p>'
      : items.map(item => `
          <div class="review-item">
            <span class="review-item-desc">${item.descripcion}</span>
            <span class="review-item-qty">×${item.quantity}</span>
            <span class="review-item-price">$${(item.precioUnit * item.quantity).toFixed(2)}</span>
          </div>
        `).join('');
  }
}

async function generateProposal() {
  const confirmed = document.getElementById('confirm-totals')?.checked;
  if (!confirmed) { showToast('Confirmá que los totales son correctos para continuar', 'warning'); return; }

  const items  = getQuoteItemsForExport();
  const totals = getTotals();

  const proposalData = {
    project: {
      name:        document.getElementById('project-name')?.value  || 'Sin nombre',
      description: document.getElementById('project-desc')?.value  || ''
    },
    scope:       document.getElementById('project-scope')?.value        || '',
    outOfScope:  document.getElementById('project-out-of-scope')?.value || '',
    solution:    document.getElementById('project-solution')?.value     || '',
    items,
    totals,
    modalidad
  };

  const btn = document.getElementById('btn-generate-proposal');
  btn.disabled     = true;
  btn.textContent  = '⏳ Generando con IA...';

  showToast('Generando propuesta con IA…', 'info');

  try {
    const response = await authFetch(`${API}/api/proposal/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(proposalData)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(err.error || 'Error en el servidor');
    }

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `propuesta-IOTEC-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('¡Propuesta generada exitosamente!', 'success');
    closeWizard();
  } catch (err) {
    showToast('Error al generar propuesta: ' + err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '🚀 Generar Propuesta';
  }
}

export { closeWizard };
