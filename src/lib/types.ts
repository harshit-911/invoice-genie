export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  senderName?: string;
  senderEmail?: string;
  senderAddress?: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: InvoiceItem[];
  amount: number; // Total amount (sum of items amount)
  advancePaid: number; // Amount paid in advance
  notes: string;
  status: InvoiceStatus;
  currency: string; // Symbol like ₹, $, €, etc.
  createdAt: string;
}

export interface ExtractionResult {
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  senderName?: string;
  senderEmail?: string;
  senderAddress?: string;
  dueDate?: string; // YYYY-MM-DD or relative terms like "next Friday" to parse
  advancePayment?: number;
  notes?: string;
  currency?: string; // symbol e.g., ₹
  items: {
    description: string;
    quantity: number;
    rate: number;
    amount?: number;
  }[];
}
