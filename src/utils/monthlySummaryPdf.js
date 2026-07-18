import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { COMPANY } from '../config/appConfig';
import { BILLING_AREAS } from '../config/billingRules';
import { resolveBillingArea } from './billingClassification';

const money = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function buildMonthlySummaryModel(rows, days, advisorConfig = []) {
  const resolveArea = (row) => resolveBillingArea(row, advisorConfig);
  const present = new Set(rows.map(resolveArea));
  present.add(BILLING_AREAS.trujilloPending);
  const fixed = [...BILLING_AREAS.lima, BILLING_AREAS.trujilloPending];
  const trujilloDynamic = [...present]
    .filter((area) => !fixed.includes(area) && area !== BILLING_AREAS.unclassified)
    .sort((a, b) => a.localeCompare(b, 'es'));
  const areas = [...fixed, ...trujilloDynamic, BILLING_AREAS.unclassified];
  const limaAreas = areas.filter((area) => BILLING_AREAS.lima.includes(area));
  const trujilloAreas = areas.filter((area) => area !== BILLING_AREAS.unclassified && !limaAreas.includes(area));
  const visibleAreas = [...limaAreas, ...trujilloAreas];
  const values = new Map();

  rows.forEach((row) => {
    const key = `${String(row.fecha).slice(0, 10)}|${resolveArea(row)}`;
    values.set(key, (values.get(key) || 0) + Number(row.sin_igv || 0));
  });

  const totals = new Map(areas.map((area) => [
    area,
    days.reduce((sum, day) => sum + (values.get(`${day.key}|${area}`) || 0), 0),
  ]));
  const grandTotal = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const visibleDates = new Set(days.map((day) => day.key));
  // Los totales por sede incluyen también sus documentos sin clasificar.
  const totalsByLocal = rows.reduce((accumulator, row) => {
    if (!visibleDates.has(String(row.fecha).slice(0, 10))) return accumulator;
    const amount = Number(row.sin_igv || 0);
    if (String(row.local_nombre || '').toUpperCase().includes('TRUJILLO')) {
      accumulator.trujillo += amount;
    } else {
      accumulator.lima += amount;
    }
    return accumulator;
  }, { lima: 0, trujillo: 0 });

  const areaLabels = new Map(advisorConfig.map((advisor) => [
    advisor.area_codigo,
    advisor.nombre_mostrar || advisor.area_codigo,
  ]));
  BILLING_AREAS.lima.forEach((area) => areaLabels.set(area, area));
  areaLabels.set(BILLING_AREAS.trujilloPending, BILLING_AREAS.trujilloPending);

  return {
    areas,
    limaAreas,
    trujilloAreas,
    visibleAreas,
    values,
    totals,
    grandTotal,
    limaTotal: totalsByLocal.lima,
    trujilloTotal: totalsByLocal.trujillo,
    areaLabels,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

// Construye y descarga el PDF sin abrir la ventana de impresión del navegador.
export async function downloadMonthlySummaryPdf({ model, days, month }) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();

  try {
    const logo = await loadImage(COMPANY.logoUrl);
    pdf.addImage(logo, 'JPEG', 12, 8, 25, 16);
  } catch {
    // El reporte sigue siendo válido si el navegador no logra cargar el logo.
  }

  pdf.setTextColor(153, 27, 27);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(COMPANY.legalName, 42, 14);
  pdf.setTextColor(51, 65, 85);
  pdf.setFontSize(9);
  pdf.text(`RUC: ${COMPANY.ruc}`, 42, 20);
  pdf.setDrawColor(185, 28, 28);
  pdf.setLineWidth(0.8);
  pdf.line(12, 27, pageWidth - 12, 27);
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(13);
  pdf.text(`AVANCE DIARIO - ${month || ''}`, 12, 35);

  const head = [[
    { content: 'Fecha', rowSpan: 2 },
    { content: 'Lima', colSpan: model.limaAreas.length, styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175] } },
    { content: 'Trujillo', colSpan: model.trujilloAreas.length, styles: { fillColor: [209, 250, 229], textColor: [6, 95, 70] } },
    { content: 'Total día', rowSpan: 2 },
  ], [
    ...model.visibleAreas.map((area) => model.areaLabels.get(area) || area),
  ]];

  const body = days.map((day) => {
    const dayTotal = model.areas.reduce(
      (sum, area) => sum + (model.values.get(`${day.key}|${area}`) || 0),
      0,
    );
    return [
      `${String(day.day).padStart(2, '0')}/${day.key.slice(5, 7)}`,
      ...model.visibleAreas.map((area) => {
        const value = model.values.get(`${day.key}|${area}`) || 0;
        return value > 0 ? `S/ ${money.format(value)}` : '—';
      }),
      dayTotal ? `S/ ${money.format(dayTotal)}` : '—',
    ];
  });
  body.push([
    'TOTAL',
    ...model.visibleAreas.map((area) => `S/ ${money.format(model.totals.get(area) || 0)}`),
    `S/ ${money.format(model.grandTotal)}`,
  ]);

  autoTable(pdf, {
    startY: 39,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 7.2, cellPadding: 1.5, halign: 'right', valign: 'middle' },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [153, 27, 27];
        data.cell.styles.textColor = 255;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  let totalsY = pdf.lastAutoTable.finalY + 8;
  if (totalsY > pdf.internal.pageSize.getHeight() - 32) {
    pdf.addPage();
    totalsY = 15;
  }
  autoTable(pdf, {
    startY: totalsY,
    margin: { left: 12 },
    tableWidth: 78,
    body: [
      ['TOTAL LIMA', `S/ ${money.format(model.limaTotal)}`],
      ['TOTAL TRUJILLO', `S/ ${money.format(model.trujilloTotal)}`],
      ['TOTAL', `S/ ${money.format(model.grandTotal)}`],
    ],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold', cellPadding: 2 },
    columnStyles: { 1: { halign: 'right' } },
    didParseCell: (data) => {
      const isGrandTotal = data.row.index === 2;
      data.cell.styles.fillColor = isGrandTotal ? [190, 0, 35] : [254, 226, 148];
      data.cell.styles.textColor = isGrandTotal ? 255 : [15, 23, 42];
    },
  });

  pdf.save(`avance_diario_${month || 'mensual'}.pdf`);
}
