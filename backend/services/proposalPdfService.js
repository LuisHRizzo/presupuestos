import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateProposalPDF(data) {
  const { project, scope, outOfScope, solution, items, totals, aiContent } = data;
  const today = new Date().toLocaleDateString('es-AR');
  const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
  
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('PROPUESTA COMERCIAL', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`N°: ${proposalNumber}`, 105, 28, { align: 'center' });
  doc.text(`Fecha: ${today}`, 105, 34, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`Proyecto: ${project.name || 'Sin nombre'}`, 14, 50);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const descLines = doc.splitTextToSize(project.description || '', 180);
  doc.text(descLines, 14, 58);
  
  let contentY = 58 + (descLines.length * 5) + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Detalle del Presupuesto:', 14, contentY);
  contentY += 8;
  
  const tableData = items.map(item => [
    item.codigo,
    item.descripcion.substring(0, 30) + (item.descripcion.length > 30 ? '...' : ''),
    item.quantity.toString(),
    `$${item.precioUnit.toFixed(2)}`,
    `$${item.ivaAmount.toFixed(2)}`,
    `$${((item.precioUnit + item.ivaAmount) * item.quantity).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: contentY,
    head: [['Código', 'Descripción', 'Cant', 'Precio', 'IVA', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }
  });
  
  contentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Subtotal: ${totals.subtotal}`, 140, contentY);
  doc.text(`IVA: ${totals.iva}`, 140, contentY + 6);
  doc.setFontSize(14);
  doc.text(`TOTAL: ${totals.total}`, 140, contentY + 14);
  
  contentY += 30;
  
  if (scope) {
    doc.setFontSize(12);
    doc.text('Alcances:', 14, contentY);
    doc.setFontSize(9);
    const scopeLines = doc.splitTextToSize(scope, 180);
    doc.text(scopeLines, 14, contentY + 6);
    contentY += 6 + (scopeLines.length * 4) + 8;
  }
  
  if (outOfScope) {
    doc.setFontSize(12);
    doc.text('Fuera de Alcances:', 14, contentY);
    doc.setFontSize(9);
    const outLines = doc.splitTextToSize(outOfScope, 180);
    doc.text(outLines, 14, contentY + 6);
    contentY += 6 + (outLines.length * 4) + 8;
  }
  
  if (solution) {
    doc.setFontSize(12);
    doc.text('Solución Propuesta:', 14, contentY);
    doc.setFontSize(9);
    const solLines = doc.splitTextToSize(solution, 180);
    doc.text(solLines, 14, contentY + 6);
    contentY += 6 + (solLines.length * 4) + 8;
  }
  
  if (aiContent) {
    if (contentY > 200) {
      doc.addPage();
      contentY = 20;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(99, 102, 241);
    doc.text('Propuesta Técnica Generada por IA:', 14, contentY);
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const aiLines = doc.splitTextToSize(aiContent, 180);
    doc.text(aiLines, 14, contentY + 8);
  }
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Propuesta válida por 30 días', 105, 280, { align: 'center' });
  
  return doc.output('blob');
}
