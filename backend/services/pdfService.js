import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateQuotePDF(data) {
  const { items, client } = data;
  const today = new Date().toLocaleDateString('es-AR');
  const quoteNumber = `P-${Date.now().toString().slice(-6)}`;
  
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('PRESUPUESTO', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`N°: ${quoteNumber}`, 105, 28, { align: 'center' });
  doc.text(`Fecha: ${today}`, 105, 34, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Datos del Cliente:', 14, 50);
  doc.setFontSize(10);
  doc.text(`Nombre: ${client.nombre}`, 14, 58);
  doc.text(`CUIT: ${client.cuit}`, 14, 64);
  doc.text(`Dirección: ${client.direccion}`, 14, 70);
  doc.text(`Teléfono: ${client.telefono}`, 14, 76);
  doc.text(`Email: ${client.email}`, 14, 82);
  
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
  
  doc.setFontSize(8);
  doc.text('Presupuesto válido por 30 días', 105, 280, { align: 'center' });
  
  return Buffer.from(doc.output('arraybuffer'));
}

export function generateProposalPDF(data) {
  const { project, scope, outOfScope, solution, items, totals } = data;
  const today = new Date().toLocaleDateString('es-AR');
  const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
  
  const doc = new jsPDF();
  let y = 20;
  
  doc.setFontSize(20);
  doc.text('PROPUESTA COMERCIAL', 105, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(12);
  doc.text(`N°: ${proposalNumber}`, 105, y, { align: 'center' });
  y += 6;
  doc.text(`Fecha: ${today}`, 105, y, { align: 'center' });
  y += 15;
  
  doc.setFontSize(14);
  doc.text('Datos del Proyecto', 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(`Nombre: ${project.name}`, 14, y);
  y += 6;
  if (project.description) {
    const descLines = doc.splitTextToSize(project.description, 180);
    doc.text(descLines, 14, y);
    y += descLines.length * 5 + 5;
  }
  
  doc.setFontSize(14);
  doc.text('Alcances del Proyecto', 14, y);
  y += 8;
  doc.setFontSize(10);
  if (scope) {
    const scopeLines = doc.splitTextToSize(scope, 180);
    doc.text(scopeLines, 14, y);
    y += scopeLines.length * 5 + 5;
  } else {
    doc.text('No se especificaron alcances', 14, y);
    y += 10;
  }
  
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Fuera de Alcances', 14, y);
  y += 8;
  doc.setFontSize(10);
  if (outOfScope) {
    const outLines = doc.splitTextToSize(outOfScope, 180);
    doc.text(outLines, 14, y);
    y += outLines.length * 5 + 5;
  } else {
    doc.text('No se especificaron exclusiones', 14, y);
    y += 10;
  }
  
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Solución Propuesta', 14, y);
  y += 8;
  doc.setFontSize(10);
  if (solution) {
    const solLines = doc.splitTextToSize(solution, 180);
    doc.text(solLines, 14, y);
    y += solLines.length * 5 + 10;
  } else {
    doc.text('No se especificó solución', 14, y);
    y += 10;
  }
  
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Detalle de Items', 14, y);
  y += 8;
  
  const tableData = items.map(item => [
    item.codigo,
    item.descripcion.substring(0, 25) + (item.descripcion.length > 25 ? '...' : ''),
    item.quantity,
    `$${item.precioUnit.toFixed(2)}`,
    `$${((item.precioUnit + item.ivaAmount) * item.quantity).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Código', 'Descripción', 'Cant', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    fontSize: 9
  });
  
  y = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.text('Resumen de Totales', 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(`Subtotal: ${totals.subtotal}`, 140, y);
  y += 6;
  doc.text(`IVA: ${totals.iva}`, 140, y);
  y += 8;
  doc.setFontSize(14);
  doc.text(`TOTAL: ${totals.total}`, 140, y);
  
  doc.setFontSize(8);
  doc.text('Propuesta válida por 30 días', 105, 280, { align: 'center' });
  
  return Buffer.from(doc.output('arraybuffer'));
}
