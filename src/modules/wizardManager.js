import { showToast } from './uiManager.js';
import { getQuoteItems, getQuoteItemsWithMarkup, IVA_RATE } from './quoteManager.js';

let currentStep = 1;
const totalSteps = 5;

export function initWizardManager() {
  document.getElementById('btn-start-wizard').addEventListener('click', openWizard);
  
  document.getElementById('btn-wizard-next').addEventListener('click', nextStep);
  document.getElementById('btn-wizard-prev').addEventListener('click', prevStep);
  document.getElementById('btn-generate-proposal').addEventListener('click', generateProposal);
}

function openWizard() {
  document.getElementById('section-quote').classList.add('hidden');
  document.getElementById('section-wizard').classList.remove('hidden');
  currentStep = 1;
  updateWizard();
  showReviewTotals();
}

function closeWizard() {
  document.getElementById('section-wizard').classList.add('hidden');
  document.getElementById('section-quote').classList.remove('hidden');
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
  document.querySelectorAll('.wizard-step').forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove('active', 'completed');
    if (stepNum === currentStep) step.classList.add('active');
    if (stepNum < currentStep) step.classList.add('completed');
  });
  
  document.querySelectorAll('.wizard-panel').forEach(panel => {
    panel.classList.toggle('hidden', parseInt(panel.dataset.step) !== currentStep);
  });
  
  document.getElementById('btn-wizard-prev').disabled = currentStep === 1;
  document.getElementById('btn-wizard-next').classList.toggle('hidden', currentStep === 5);
  document.getElementById('btn-generate-proposal').classList.toggle('hidden', currentStep !== 5);
}

function showReviewTotals() {
  const subtotal = document.getElementById('total-subtotal').textContent;
  const iva = document.getElementById('total-iva').textContent;
  const total = document.getElementById('total-general').textContent;
  
  document.getElementById('review-totals').innerHTML = `
    <div class="review-totals-box">
      <p><strong>Subtotal:</strong> ${subtotal}</p>
      <p><strong>IVA:</strong> ${iva}</p>
      <p><strong>TOTAL:</strong> ${total}</p>
    </div>
  `;
}

async function generateProposal() {
  const confirmed = document.getElementById('confirm-totals').checked;
  if (!confirmed) {
    showToast('Debe confirmar que los totales son correctos', 'warning');
    return;
  }
  
  const quoteItems = getQuoteItemsWithMarkup();
  
  // Recalculate totals with markup
  let subtotal = 0;
  let totalIva = 0;
  quoteItems.forEach(item => {
    subtotal += item.precioUnit * item.quantity;
    totalIva += item.ivaAmount * item.quantity;
  });
  const total = subtotal + totalIva;
  
  const proposalData = {
    project: {
      name: document.getElementById('project-name').value || 'Sin nombre',
      description: document.getElementById('project-desc').value || ''
    },
    scope: document.getElementById('project-scope').value || '',
    outOfScope: document.getElementById('project-out-of-scope').value || '',
    solution: document.getElementById('project-solution').value || '',
    items: quoteItems,
    totals: {
      subtotal: `$${subtotal.toFixed(2)}`,
      iva: `$${totalIva.toFixed(2)}`,
      total: `$${total.toFixed(2)}`
    }
  };
  
  showToast('Generando propuesta con IA...', 'info');
  
  try {
    const response = await fetch('http://localhost:3001/api/proposal/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData)
    });
    
    if (!response.ok) throw new Error('Error en el servidor');
    
    const result = await response.blob();
    
    const url = URL.createObjectURL(result);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propuesta-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Propuesta generada exitosamente', 'success');
    closeWizard();
  } catch (err) {
    showToast('Error al generar propuesta: ' + err.message, 'error');
  }
}

export { closeWizard };
