import { jsPDF } from 'jspdf';
import { Invoice } from './types';

/**
 * Helper to load an image asynchronously in the browser.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null as any);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null as any);
    img.src = src;
  });
}

/**
 * Generates the jsPDF instance for a modern, professional standard invoice.
 */
export function generateInvoicePDFInstance(invoice: Invoice, logoImg?: HTMLImageElement): jsPDF {
  // A4 Page dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette - Standard Modern Corporate
  const colors = {
    primary: [9, 13, 22],      // Deep Navy / Dark slate
    secondary: [99, 102, 241], // Indigo
    textDark: [31, 41, 55],    // Dark Gray
    textLight: [107, 114, 128],// Cool Gray
    bgLight: [243, 244, 246],  // Off-white / light gray
    line: [229, 231, 235],     // Light gray borders
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

  // 1. Header & Brand Info
  // Left: Invoice Genie logo indicator & Brand Name
  if (logoImg) {
    try {
      // Draw winking genie logo: x=20, y=17, w=11, h=11
      doc.addImage(logoImg, 'JPEG', 20, 17, 11, 11);
    } catch (e) {
      console.error('Failed to embed logo image in PDF', e);
    }
    
    // Draw "invoice" text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    setTextColor(colors.primary);
    doc.text('invoice', 33, 24);

    const wordWidth = doc.getTextWidth('invoice');

    // Draw "genie" text
    doc.setFont('helvetica', 'bold');
    setTextColor(colors.secondary);
    doc.text('genie', 33 + wordWidth + 0.5, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setTextColor(colors.textLight);
    doc.text('AI-Powered Invoicing', 33, 29);
  } else {
    // Draw "invoice" text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(21);
    setTextColor(colors.primary);
    doc.text('invoice', 20, 25);

    const wordWidth = doc.getTextWidth('invoice');

    // Draw "genie" text
    doc.setFont('helvetica', 'bold');
    setTextColor(colors.secondary);
    doc.text('genie', 20 + wordWidth + 0.5, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setTextColor(colors.textLight);
    doc.text('AI-Powered Invoicing', 20, 31);
  }

  // Right: INVOICE title and numbers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  setTextColor(colors.secondary);
  doc.text('INVOICE', 190, 25, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setTextColor(colors.textDark);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 190, 31, { align: 'right' });

  // Divider
  setDrawColor(colors.line);
  doc.setLineWidth(0.5);
  doc.line(20, 36, 190, 36);

  // 2. Billing Details Row (Y = 44)
  let y = 44;

  // Left Side: Sender / Vendor Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setTextColor(colors.secondary);
  doc.text('FROM:', 20, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColor(colors.primary);
  doc.text(invoice.senderName || 'Self-Employed Freelancer', 20, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextColor(colors.textLight);
  let senderY = y + 10;
  if (invoice.senderEmail) {
    doc.text(invoice.senderEmail, 20, senderY);
    senderY += 4.5;
  }
  if (invoice.senderAddress) {
    const addrLines = doc.splitTextToSize(invoice.senderAddress, 75);
    doc.text(addrLines, 20, senderY);
  }

  // Right Side: Client Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setTextColor(colors.secondary);
  doc.text('BILLED TO:', 110, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColor(colors.primary);
  doc.text(invoice.clientName, 110, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextColor(colors.textLight);
  let clientY = y + 10;
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 110, clientY);
    clientY += 4.5;
  }
  if (invoice.clientAddress) {
    const addrLines = doc.splitTextToSize(invoice.clientAddress, 75);
    doc.text(addrLines, 110, clientY);
  }

  // Wait, let's find the max Y of client/sender info to avoid overlapping
  y = Math.max(senderY + 12, clientY + 12, 70);

  // 3. Dates & Key Details Section (Gray panel)
  setFillColor(colors.bgLight);
  doc.rect(20, y, 170, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setTextColor(colors.textLight);
  doc.text('DATE OF ISSUE', 25, y + 5);
  doc.text('DUE DATE', 75, y + 5);
  doc.text('PAYMENT STATUS', 125, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setTextColor(colors.primary);
  doc.text(invoice.date, 25, y + 10);
  doc.text(invoice.dueDate, 75, y + 10);

  // Color-coded status badge in PDF
  const statusColors: Record<string, number[]> = {
    paid: [16, 185, 129],    // Green
    pending: [245, 158, 11], // Orange/Yellow
    overdue: [239, 68, 68],  // Red
  };
  const statusColor = statusColors[invoice.status] || colors.textDark;
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(invoice.status.toUpperCase(), 125, y + 10);

  y += 24;

  // 4. Items Table
  // Headers
  setFillColor(colors.primary);
  doc.rect(20, y, 170, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION', 24, y + 5.5);
  doc.text('QTY', 120, y + 5.5, { align: 'center' });
  doc.text('RATE', 150, y + 5.5, { align: 'right' });
  doc.text('TOTAL', 186, y + 5.5, { align: 'right' });

  y += 8;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  
  invoice.items.forEach((item, index) => {
    // Determine height needed for wrapped description
    const descLines = doc.splitTextToSize(item.description, 85);
    const rowHeight = Math.max(8, descLines.length * 5);

    // Zebra striping background
    if (index % 2 === 1) {
      setFillColor(colors.bgLight);
      doc.rect(20, y, 170, rowHeight, 'F');
    }

    // Row borders
    setDrawColor(colors.line);
    doc.line(20, y + rowHeight, 190, y + rowHeight);

    // Text cells
    setTextColor(colors.textDark);
    doc.text(descLines, 24, y + 5);
    doc.text(item.quantity.toString(), 120, y + 5, { align: 'center' });
    doc.text(`${invoice.currency} ${item.rate.toLocaleString('en-IN')}`, 150, y + 5, { align: 'right' });
    doc.text(`${invoice.currency} ${item.amount.toLocaleString('en-IN')}`, 186, y + 5, { align: 'right' });

    y += rowHeight;
  });

  y += 8;

  // 5. Total and Balance Panel
  const rightColumnX = 130;
  const rightColumnValX = 186;
  const totalsStartY = y;

  // Subtotal Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setTextColor(colors.textLight);
  doc.text('Subtotal:', rightColumnX, y);
  setTextColor(colors.textDark);
  doc.text(`${invoice.currency} ${invoice.amount.toLocaleString('en-IN')}`, rightColumnValX, y, { align: 'right' });

  y += 6;

  // Advance Paid Row (if > 0)
  if (invoice.advancePaid > 0) {
    setTextColor(colors.textLight);
    doc.text('Advance Paid:', rightColumnX, y);
    setTextColor(colors.textDark);
    doc.text(`- ${invoice.currency} ${invoice.advancePaid.toLocaleString('en-IN')}`, rightColumnValX, y, { align: 'right' });
    y += 6;
  }

  // Divider for total
  doc.line(rightColumnX - 5, y - 2, 190, y - 2);

  // Balance Due Row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColor(colors.primary);
  doc.text('Balance Due:', rightColumnX, y + 3);
  const balanceDue = invoice.amount - invoice.advancePaid;
  setTextColor(colors.secondary);
  doc.text(`${invoice.currency} ${balanceDue.toLocaleString('en-IN')}`, rightColumnValX, y + 3, { align: 'right' });

  // Update y to the max of current y (totals block end) or milestones block end
  let milestonesEndY = totalsStartY;

  // Draw payment milestones table if they exist
  if (invoice.paymentMilestones && invoice.paymentMilestones.length > 0) {
    let mY = totalsStartY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setTextColor(colors.secondary);
    doc.text('PAYMENT SCHEDULE', 20, mY);
    mY += 5;

    // Draw small table headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTextColor(colors.textLight);
    doc.text('Milestone / Installment', 20, mY);
    doc.text('Due Date', 65, mY);
    doc.text('Amount', 105, mY, { align: 'right' });
    
    // Draw thin line
    setDrawColor(colors.line);
    doc.line(20, mY + 1.5, 105, mY + 1.5);
    mY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    invoice.paymentMilestones.forEach((m) => {
      setTextColor(colors.textDark);
      doc.text(m.name, 20, mY);
      doc.text(m.dueDate, 65, mY);
      doc.text(`${invoice.currency} ${m.amount.toLocaleString('en-IN')}`, 105, mY, { align: 'right' });
      mY += 4.5;
    });

    milestonesEndY = mY;
  }

  // Adjust Y for Notes / Footer
  y = Math.max(y + 8, milestonesEndY + 5);

  // 6. Notes & Terms
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(colors.secondary);
    doc.text('NOTES / PAYMENT INSTRUCTIONS:', 20, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setTextColor(colors.textLight);
    const notesLines = doc.splitTextToSize(invoice.notes, 100);
    doc.text(notesLines, 20, y + 5.5);
  }

  // 7. Thank you footer (bottom of the page)
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  setTextColor(colors.textLight);
  doc.text('Thank you for choosing InvoiceGenie AI. For payment details, please check the notes.', 105, pageHeight - 15, { align: 'center' });

  return doc;
}

/**
 * Generates and downloads a modern, professional PDF invoice in the browser.
 */
export async function downloadInvoicePDF(invoice: Invoice) {
  const logoImg = await loadImage('/logo.jpg');
  const doc = generateInvoicePDFInstance(invoice, logoImg);
  doc.save(`${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`);
}
