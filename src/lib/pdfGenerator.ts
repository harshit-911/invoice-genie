import { jsPDF } from 'jspdf';
import { Invoice } from './types';

/**
 * Generates the jsPDF instance for a classy, old-school vintage invoice.
 */
export function generateInvoicePDFInstance(invoice: Invoice): jsPDF {
  // A4 Page dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette - Old School / Ink Theme
  const colors = {
    inkBlack: [17, 17, 17],     // Off-black ink
    inkDark: [34, 34, 34],      // Deep charcoal
    inkMuted: [85, 85, 85],     // Steel/slate gray
    burgundy: [116, 42, 42],    // Classy accent burgundy
    bgCream: [245, 241, 229],   // Ledger beige/cream
    borderLine: [85, 85, 85],   // Solid dark borders
  };

  // Helper: Set text color
  const setTextColor = (color: number[]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  // Helper: Set draw color
  const setDrawColor = (color: number[]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
  };

  // Helper: Set fill color
  const setFillColor = (color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  // 1. Draw double borders around the page margins (elegant frame)
  setDrawColor(colors.borderLine);
  doc.setLineWidth(0.6);
  doc.rect(15, 15, 180, 267); // Outer border
  doc.setLineWidth(0.2);
  doc.rect(16.5, 16.5, 177, 264); // Inner border

  // 2. Centered Vintage Masthead Header
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  setTextColor(colors.inkBlack);
  doc.text('INVOICE GENIE', 105, 30, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  setTextColor(colors.inkMuted);
  doc.text('EST. 2026 • AUTOMATED BILL OF LEDGER', 105, 35, { align: 'center' });

  // Thin double line under masthead
  setDrawColor(colors.inkBlack);
  doc.setLineWidth(0.4);
  doc.line(40, 39, 170, 39);
  doc.setLineWidth(0.15);
  doc.line(40, 39.7, 170, 39.7);

  // Document Number & Sub-title
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  setTextColor(colors.burgundy);
  doc.text(`Document No. ${invoice.invoiceNumber}`, 105, 46, { align: 'center' });

  // 3. Billing details columns (Y = 56)
  let y = 56;

  // Left Side: Issuer / Sender Info
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  setTextColor(colors.inkBlack);
  doc.text('I. ISSUED BY:', 25, y);

  // Divider line for sections
  doc.setLineWidth(0.15);
  setDrawColor([180, 180, 180]);
  doc.line(25, y + 1.5, 95, y + 1.5);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  setTextColor(colors.inkDark);
  doc.text(invoice.senderName || 'Freelance Professional', 25, y + 6);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  setTextColor(colors.inkMuted);
  let senderY = y + 11;
  if (invoice.senderEmail) {
    doc.text(invoice.senderEmail, 25, senderY);
    senderY += 4.5;
  }
  if (invoice.senderAddress) {
    const addrLines = doc.splitTextToSize(invoice.senderAddress, 70);
    doc.text(addrLines, 25, senderY);
  }

  // Right Side: Client Info
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  setTextColor(colors.inkBlack);
  doc.text('II. BILLED TO:', 115, y);

  // Divider line for sections
  doc.line(115, y + 1.5, 185, y + 1.5);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  setTextColor(colors.inkDark);
  doc.text(invoice.clientName, 115, y + 6);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  setTextColor(colors.inkMuted);
  let clientY = y + 11;
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 115, clientY);
    clientY += 4.5;
  }
  if (invoice.clientAddress) {
    const addrLines = doc.splitTextToSize(invoice.clientAddress, 70);
    doc.text(addrLines, 115, clientY);
  }

  // Align vertical spacer
  y = Math.max(senderY + 10, clientY + 10, 80);

  // 4. Key Ledger Dates (Cream box)
  setFillColor(colors.bgCream);
  setDrawColor(colors.inkDark);
  doc.setLineWidth(0.25);
  doc.rect(25, y, 160, 14, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  setTextColor(colors.inkMuted);
  doc.text('DATE ISSUED:', 30, y + 5);
  doc.text('DUE DATE:', 80, y + 5);
  doc.text('STATUS:', 130, y + 5);

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  setTextColor(colors.inkBlack);
  doc.text(invoice.date, 30, y + 10);
  doc.text(invoice.dueDate, 80, y + 10);
  
  // Muted burgundy for Pending status
  setTextColor(colors.burgundy);
  doc.text(invoice.status.toUpperCase(), 130, y + 10);

  y += 24;

  // 5. Items Ledger Grid Table
  // Table Double lines for Header row
  doc.setLineWidth(0.4);
  setDrawColor(colors.inkBlack);
  doc.line(25, y, 185, y);
  doc.line(25, y + 8, 185, y + 8);
  
  // Double-border rules
  doc.setLineWidth(0.15);
  doc.line(25, y + 0.8, 185, y + 0.8);
  doc.line(25, y + 7.2, 185, y + 7.2);

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  setTextColor(colors.inkBlack);
  doc.text('DESCRIPTION OF WORK', 29, y + 5);
  doc.text('QTY', 125, y + 5, { align: 'center' });
  doc.text('RATE', 150, y + 5, { align: 'right' });
  doc.text('TOTAL', 181, y + 5, { align: 'right' });

  y += 8;

  // Draw Table body
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  setTextColor(colors.inkDark);
  doc.setLineWidth(0.15);
  setDrawColor([180, 180, 180]);

  invoice.items.forEach((item) => {
    const descLines = doc.splitTextToSize(item.description, 80);
    const rowHeight = Math.max(7.5, descLines.length * 4.5);

    // Row text cells
    doc.text(descLines, 29, y + 4.5);
    doc.text(item.quantity.toString(), 125, y + 4.5, { align: 'center' });
    doc.text(`${invoice.currency} ${item.rate.toLocaleString('en-IN')}`, 150, y + 4.5, { align: 'right' });
    doc.text(`${invoice.currency} ${item.amount.toLocaleString('en-IN')}`, 181, y + 4.5, { align: 'right' });

    // Underline divider
    doc.line(25, y + rowHeight, 185, y + rowHeight);

    y += rowHeight;
  });

  y += 8;

  // 6. Summary Block
  const summaryX = 125;
  const valX = 181;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  setTextColor(colors.inkMuted);
  
  // Subtotal row
  doc.text('Subtotal:', summaryX, y);
  setTextColor(colors.inkDark);
  doc.text(`${invoice.currency} ${invoice.amount.toLocaleString('en-IN')}`, valX, y, { align: 'right' });

  y += 5.5;

  // Advance paid row (if > 0)
  if (invoice.advancePaid > 0) {
    setTextColor(colors.inkMuted);
    doc.text('Advance Paid:', summaryX, y);
    setTextColor(colors.inkDark);
    doc.text(`- ${invoice.currency} ${invoice.advancePaid.toLocaleString('en-IN')}`, valX, y, { align: 'right' });
    y += 5.5;
  }

  // Draw elegant double-ruled divider line for Balance due
  doc.setLineWidth(0.4);
  setDrawColor(colors.inkBlack);
  doc.line(summaryX, y - 1.5, 185, y - 1.5);
  doc.line(summaryX, y - 0.7, 185, y - 0.7);

  // Balance due row
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  setTextColor(colors.inkBlack);
  doc.text('Balance Due:', summaryX, y + 3.5);
  
  const balanceDue = invoice.amount - invoice.advancePaid;
  setTextColor(colors.burgundy);
  doc.text(`${invoice.currency} ${balanceDue.toLocaleString('en-IN')}`, valX, y + 3.5, { align: 'right' });

  // Double border underline for totals
  doc.setLineWidth(0.4);
  setDrawColor(colors.inkBlack);
  doc.line(summaryX, y + 6, 185, y + 6);
  doc.line(summaryX, y + 6.8, 185, y + 6.8);

  y += 18;

  // 7. Terms / Bank Notes
  if (invoice.notes) {
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    setTextColor(colors.inkBlack);
    doc.text('TERMS & PAYMENT INSTRUCTIONS:', 25, y);

    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    setTextColor(colors.inkMuted);
    const notesLines = doc.splitTextToSize(invoice.notes, 100);
    doc.text(notesLines, 25, y + 5);
  }

  // 8. Classy footer copyright
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  setTextColor(colors.inkMuted);
  doc.text('Rendered in the old-fashioned way by InvoiceGenie AI.', 105, pageHeight - 20, { align: 'center' });

  return doc;
}

/**
 * Generates and downloads a classy, old-school vintage PDF invoice in the browser.
 */
export function downloadInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDFInstance(invoice);
  doc.save(`${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`);
}
