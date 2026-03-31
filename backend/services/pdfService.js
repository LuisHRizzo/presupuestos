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
