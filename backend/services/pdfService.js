import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Configuración de colores IOTEC ─────────────────────
const COLOR_PRIMARY   = [17, 34, 64];    // Azul marino IOTEC
const COLOR_ACCENT    = [0, 163, 224];   // Azul eléctrico
const COLOR_IOTEC     = [0, 180, 100];   // Verde Metodología IOTEC
const COLOR_RAPIDA    = [255, 160, 0];   // Amarillo Venta Rápida
const COLOR_MUTED     = [120, 120, 130];
const COLOR_LIGHT_BG  = [245, 247, 252];

function addPageFooter(doc, pageNum, totalPages, proposalNumber) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...COLOR_ACCENT);
  doc.setLineWidth(0.5);
  doc.line(14, h - 15, w - 14, h - 15);

  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('IOTEC / 01Infinito  •  Soluciones en Seguridad, Domótica e Infraestructura Tecnológica', w / 2, h - 10, { align: 'center' });
  doc.text(`Propuesta ${proposalNumber}  •  Pág. ${pageNum} de ${totalPages}`, w - 14, h - 10, { align: 'right' });
  doc.text('⚠ Precios sujetos a variabilidad de stock y disponibilidad de distribuidores', 14, h - 10);
}

function addHeader(doc, proposalNumber, today, modalidad) {
  const w   = doc.internal.pageSize.getWidth();
  const esIOTEC = modalidad === 'IOTEC';

  // Fondo header
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, w, 38, 'F');

  // Franja de acento
  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(0, 38, w, 3, 'F');

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('PROPUESTA COMERCIAL', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 235);
  doc.text('IOTEC / 01Infinito', 14, 23);

  // Datos propuesta (derecha)
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`N°: ${proposalNumber}`, w - 14, 13, { align: 'right' });
  doc.text(`Fecha: ${today}`, w - 14, 19, { align: 'right' });
  doc.text(`Válida por 30 días`, w - 14, 25, { align: 'right' });

  // Badge de modalidad
  const col = esIOTEC ? COLOR_IOTEC : COLOR_RAPIDA;
  const label = esIOTEC ? '● Metodología IOTEC' : '● Venta Rápida';
  doc.setFillColor(...col);
  doc.roundedRect(w - 64, 28, 50, 7, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(label, w - 39, 33.2, { align: 'center' });
}

// ─────────────────────────────────────────────────────────
// PRESUPUESTO RÁPIDO (sin wizard)
// ─────────────────────────────────────────────────────────
export function generateQuotePDF(data) {
  const { items, client } = data;
  const today        = new Date().toLocaleDateString('es-AR');
  const quoteNumber  = `P-${Date.now().toString().slice(-6)}`;

  const doc = new jsPDF({ format: 'a4' });
  const w   = doc.internal.pageSize.getWidth();

  // Header simple
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, w, 28, 'F');
  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(0, 28, w, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('PRESUPUESTO', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 210, 235);
  doc.text('IOTEC / 01Infinito', 14, 21);

  doc.setTextColor(255, 255, 255);
  doc.text(`N°: ${quoteNumber}  •  Fecha: ${today}`, w - 14, 16, { align: 'right' });

  // Datos cliente
  let y = 40;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.roundedRect(10, y - 5, w - 20, 36, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('DATOS DEL CLIENTE', 14, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 60);
  doc.text(`Nombre: ${client.nombre}`,      14, y + 9);
  doc.text(`CUIT: ${client.cuit}`,          14, y + 16);
  doc.text(`Dirección: ${client.direccion}`, 14, y + 23);
  doc.text(`Tel: ${client.telefono}`,       100, y + 9);
  doc.text(`Email: ${client.email}`,        100, y + 16);

  y += 40;

  // Tabla items (SOLO precio final — sin costos internos)
  const tableData = items.map(item => [
    item.codigo,
    item.descripcion.length > 40 ? item.descripcion.substring(0, 40) + '...' : item.descripcion,
    item.marca || '-',
    item.quantity,
    `$${item.precioUnit.toFixed(2)}`,
    `$${(item.precioUnit * item.quantity).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Código', 'Descripción', 'Marca', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: COLOR_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 50] },
    alternateRowStyles: { fillColor: COLOR_LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 70 },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    margin: { left: 10, right: 10 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Totales
  let subtotal = 0, totalIva = 0;
  items.forEach(item => {
    subtotal  += item.precioUnit * item.quantity;
    totalIva  += item.ivaAmount  * item.quantity;
  });
  const total = subtotal + totalIva;

  const bx = w - 80;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.roundedRect(bx - 5, y - 3, 75, 30, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 70);
  doc.text(`Subtotal:`, bx, y + 4);
  doc.text(`$${subtotal.toFixed(2)}`, w - 14, y + 4, { align: 'right' });
  doc.text(`IVA (21%):`, bx, y + 11);
  doc.text(`$${totalIva.toFixed(2)}`, w - 14, y + 11, { align: 'right' });
  doc.setDrawColor(...COLOR_ACCENT);
  doc.setLineWidth(0.3);
  doc.line(bx - 5, y + 14, w - 14, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(`TOTAL:`, bx, y + 22);
  doc.text(`$${total.toFixed(2)}`, w - 14, y + 22, { align: 'right' });

  // Footer
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_MUTED);
  doc.text('⚠ Precios sujetos a variabilidad de stock y disponibilidad de distribuidores', w / 2, h - 10, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

// ─────────────────────────────────────────────────────────
// PROPUESTA COMERCIAL (con wizard IOTEC)
// ─────────────────────────────────────────────────────────
export function generateProposalPDF(data) {
  const { project, scope, outOfScope, solution, items, totals, aiContent, modalidad } = data;
  const today          = new Date().toLocaleDateString('es-AR');
  const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
  const esIOTEC        = modalidad === 'IOTEC';

  const doc    = new jsPDF({ format: 'a4' });
  const w      = doc.internal.pageSize.getWidth();

  // ── Página 1: Header + Datos proyecto + Items ────────
  addHeader(doc, proposalNumber, today, modalidad);

  let y = 50;

  // Datos del proyecto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(project.name || 'Proyecto sin nombre', 14, y);
  y += 7;

  if (project.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 80);
    const descLines = doc.splitTextToSize(project.description, w - 28);
    doc.text(descLines, 14, y);
    y += descLines.length * 5 + 4;
  }

  // Tabla de items — OCULTA precioPartner y precioGremio al cliente
  const tableData = items.map(item => [
    item.codigo,
    item.descripcion.length > 45 ? item.descripcion.substring(0, 45) + '...' : item.descripcion,
    item.quantity,
    `$${item.precioUnit.toFixed(2)}`,
    `$${(item.precioUnit * item.quantity).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Código', 'Descripción', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: COLOR_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 50] },
    alternateRowStyles: { fillColor: COLOR_LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right' },
      4: { halign: 'right' }
    },
    margin: { left: 10, right: 10 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Totales
  const bx = w - 85;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.roundedRect(bx - 5, y - 3, 80, 32, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 70);
  doc.text('Subtotal:', bx, y + 4);
  doc.text(totals.subtotal, w - 14, y + 4, { align: 'right' });
  doc.text('IVA (21%):', bx, y + 11);
  doc.text(totals.iva, w - 14, y + 11, { align: 'right' });
  doc.setDrawColor(...COLOR_ACCENT);
  doc.setLineWidth(0.3);
  doc.line(bx - 5, y + 14, w - 14, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('TOTAL:', bx, y + 24);
  doc.text(totals.total, w - 14, y + 24, { align: 'right' });

  y += 40;

  // ── Cláusula de Soporte según modalidad ─────────────
  if (y > 230) { doc.addPage(); addHeader(doc, proposalNumber, today, modalidad); y = 50; }

  const claColor = esIOTEC ? COLOR_IOTEC : COLOR_RAPIDA;
  const claTitle = esIOTEC ? 'METODOLOGÍA IOTEC — SOPORTE INTEGRAL' : 'VENTA RÁPIDA — SOPORTE LIMITADO';
  const claText  = esIOTEC
    ? 'Esta propuesta está enmarcada bajo la Metodología IOTEC. Incluye: instalación profesional, configuración completa de equipos, puesta en marcha, capacitación básica al usuario final, y soporte técnico post-instalación. Se entrega acta de conformidad al cierre del proyecto y se mantiene el historial del cliente para futuras ampliaciones.'
    : 'Esta propuesta corresponde a una Venta Rápida. Incluye exclusivamente el suministro de equipos. La instalación, configuración y soporte post-venta quedan a cargo del instalador contratante. Para acceder a soporte integral y garantía extendida, consultar por la Metodología IOTEC.';

  doc.setFillColor(...claColor.map(v => v * 0.12 + 235));
  doc.roundedRect(10, y, w - 20, 2, 1, 1, 'F');
  doc.setFillColor(...claColor);
  doc.roundedRect(10, y, 4, 0, 1, 1, 'F'); // solo para forzar render

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...claColor);
  doc.text(`■  ${claTitle}`, 14, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 60);
  const claLines = doc.splitTextToSize(claText, w - 28);
  doc.text(claLines, 14, y + 15);
  y += 15 + claLines.length * 5 + 10;

  // ── Alcances ─────────────────────────────────────────
  if (scope) {
    if (y > 230) { doc.addPage(); addHeader(doc, proposalNumber, today, modalidad); y = 50; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text('ALCANCES DEL PROYECTO', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 55, 65);
    const scopeLines = doc.splitTextToSize(scope, w - 28);
    doc.text(scopeLines, 14, y);
    y += scopeLines.length * 5 + 8;
  }

  // ── Fuera de alcances ────────────────────────────────
  if (outOfScope) {
    if (y > 230) { doc.addPage(); addHeader(doc, proposalNumber, today, modalidad); y = 50; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text('FUERA DE ALCANCES', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 55, 65);
    const outLines = doc.splitTextToSize(outOfScope, w - 28);
    doc.text(outLines, 14, y);
    y += outLines.length * 5 + 8;
  }

  // ── Contenido IA ─────────────────────────────────────
  if (aiContent) {
    if (y > 200) { doc.addPage(); addHeader(doc, proposalNumber, today, modalidad); y = 50; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_ACCENT);
    doc.text('PROPUESTA TÉCNICA', 14, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(45, 45, 55);

    // Render por bloques para no desbordar página
    const allLines = doc.splitTextToSize(aiContent.replace(/\*\*/g, '').replace(/#+\s/g, ''), w - 28);
    for (const line of allLines) {
      if (y > 260) {
        doc.addPage();
        addHeader(doc, proposalNumber, today, modalidad);
        addPageFooter(doc, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages(), proposalNumber);
        y = 50;
      }
      doc.text(line, 14, y);
      y += 5;
    }
  }

  // ── Footers en todas las páginas ─────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addPageFooter(doc, p, totalPages, proposalNumber);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
