'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem } from '../lib/types';
import { downloadInvoicePDF, generateInvoicePDFInstance } from '../lib/pdfGenerator';
import { 
  FileText, Download, Save, Plus, Trash2, User, Mail, MapPin, 
  Calendar, CreditCard, ChevronRight, Settings 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface InvoicePreviewProps {
  initialData: any; // Raw JSON from Gemini extract API
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

export default function InvoicePreview({ initialData, onSave, onCancel }: InvoicePreviewProps) {
  // Generate temporary invoice number and standard dates
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Populate state from Gemini AI extraction results
  useEffect(() => {
    if (initialData) {
      // Auto-assign random but realistic invoice number: e.g. INV-102
      setInvoiceNumber(`INV-${Math.floor(100 + Math.random() * 900)}`);
      
      setClientName(initialData.clientName || '');
      setClientEmail(initialData.clientEmail || '');
      setClientAddress(initialData.clientAddress || '');
      setSenderName(initialData.senderName || '');
      setSenderEmail(initialData.senderEmail || '');
      setSenderAddress(initialData.senderAddress || '');
      
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      
      setDueDate(initialData.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      // Setup currency
      setCurrency(initialData.currency || '₹');
      
      // Format items with random IDs for React rendering
      const extractedItems = (initialData.items || []).map((item: any) => {
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.rate) || 0;
        return {
          id: Math.random().toString(36).substring(2, 9),
          description: item.description || 'Consulting service',
          quantity: qty,
          rate: rate,
          amount: qty * rate,
        };
      });
      
      setItems(extractedItems.length > 0 ? extractedItems : [{
        id: Math.random().toString(36).substring(2, 9),
        description: 'Design consultation',
        quantity: 1,
        rate: 5000,
        amount: 5000,
      }]);
      
      setAdvancePaid(Number(initialData.advancePayment) || 0);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  // Recalculate totals dynamically
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = subtotal;
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Keep amount computed automatically
          if (field === 'quantity' || field === 'rate') {
            const qty = field === 'quantity' ? Number(value) : item.quantity;
            const rt = field === 'rate' ? Number(value) : item.rate;
            updatedItem.amount = qty * rt;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const getInvoicePayload = (): Invoice => {
    return {
      id: Math.random().toString(36).substring(2, 11),
      invoiceNumber,
      clientName,
      clientEmail: clientEmail.trim() || undefined,
      clientAddress: clientAddress.trim() || undefined,
      senderName: senderName.trim() || undefined,
      senderEmail: senderEmail.trim() || undefined,
      senderAddress: senderAddress.trim() || undefined,
      date,
      dueDate,
      items,
      amount: totalAmount,
      advancePaid,
      notes,
      status: 'pending',
      currency,
      createdAt: new Date().toISOString(),
    };
  };

  const handleDownloadPDF = () => {
    downloadInvoicePDF(getInvoicePayload());
  };

  const handleEmailClient = async () => {
    if (!clientEmail.trim()) {
      alert('Please specify a client email address in the billed details.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const payload = getInvoicePayload();
      const doc = generateInvoicePDFInstance(payload);
      const base64Data = doc.output('datauristring').split(',')[1];
      const filename = `${payload.invoiceNumber}_${payload.clientName.replace(/\s+/g, '_')}.pdf`;

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          clientName: clientName.trim(),
          senderName: senderName.trim(),
          invoiceNumber: payload.invoiceNumber,
          pdfAttachment: base64Data,
          filename: filename,
          amount: payload.amount,
          currency: payload.currency,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email.');
      }

      if (data.mock) {
        alert(`Email Sent (Mock Mode)!\n\nDetails:\n- Client: ${clientName}\n- Email: ${clientEmail}\n\nSince no RESEND_API_KEY is configured in your environment, the email transaction details have been printed in your local server console.`);
      } else {
        alert(`Success! Invoice ${payload.invoiceNumber} has been sent to ${clientName} (${clientEmail}).`);
      }
    } catch (err: any) {
      alert(`Email dispatch failed: ${err.message || 'Unknown error occurred.'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSave = () => {
    if (!clientName.trim()) {
      alert('Please specify a client name.');
      return;
    }
    if (items.some(item => !item.description.trim())) {
      alert('Please fill out all item descriptions.');
      return;
    }
    onSave(getInvoicePayload());
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Editing Form */}
      <div className="lg:col-span-7 flex flex-col gap-6 p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Review & Edit Invoice</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Invoice Header details */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Invoice number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500/60"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Currency Symbol</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500/60"
            >
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            <span>Issuer / Sender (Your Details)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Your Name / Company</label>
              <input
                type="text"
                placeholder="Self-Employed Freelancer"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Your Email</label>
              <input
                type="email"
                placeholder="myemail@domain.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Your Address</label>
            <input
              type="text"
              placeholder="123 Freelance St, Tech City"
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Billed Client Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Client Name / Co.</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Client Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Client Address</label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Issue Date</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Invoice items */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Line Items</label>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={item.id} className="flex gap-2 items-center bg-slate-955/50 border border-slate-850 p-2.5 rounded-xl">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div className="w-12">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-center text-white focus:outline-none"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    min="0"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-right text-white focus:outline-none"
                  />
                </div>
                <div className="w-20 text-right text-xs font-semibold text-slate-300 px-1">
                  {currency} {item.amount.toLocaleString('en-IN')}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length <= 1}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Advance Payment Amount ({currency})</label>
            <input
              type="number"
              min="0"
              max={totalAmount}
              value={advancePaid === 0 ? '' : advancePaid}
              placeholder="0"
              onChange={(e) => setAdvancePaid(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Invoice Notes / Bank details</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none resize-none"
              placeholder="Provide payment directions, bank info or special instructions..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-800/80 pt-4 mt-2">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold transition hover:scale-[1.01] active:scale-98"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
          
          <button
            onClick={handleEmailClient}
            disabled={isSendingEmail}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold transition hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSendingEmail ? (
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            <span>{isSendingEmail ? 'Sending Email...' : 'Email Client'}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition hover:scale-[1.01] shadow-lg shadow-indigo-600/20 active:scale-98"
          >
            <Save className="h-4 w-4" />
            <span>Save & Finalize</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Realistic visual mockup */}
      <div className="lg:col-span-5 flex flex-col gap-3 lg:sticky lg:top-6 select-none">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1">Live Invoice Document Mockup</span>
        <div className="w-full bg-[#fcfaf2] text-[#222222] font-serif p-7 rounded-lg shadow-2xl border-double border-4 border-[#333333] relative aspect-[1/1.4] overflow-hidden flex flex-col text-[11px] leading-relaxed select-text">
          {/* Decorative grain/ink bleed effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />

          {/* Document Header (Vintage Masthead) */}
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-[#111111] uppercase tracking-[0.2em]">INVOICE GENIE</h3>
            <div className="text-[7.5px] text-[#555555] tracking-[0.25em] uppercase mt-1">AUTOMATED BILL OF LEDGER</div>
            <div className="border-t border-[#333333] my-1 w-24 mx-auto" />
            <div className="text-[9px] italic text-[#444444] font-semibold mt-1">
              Doc. No. {invoiceNumber || 'INV-XXX'}
            </div>
          </div>

          <div className="border-b-2 border-t border-double border-[#333333] py-0.5 my-1" />

          {/* Client & Sender details grid */}
          <div className="grid grid-cols-2 gap-4 my-2 text-[9px]">
            <div>
              <div className="font-bold text-[#111111] uppercase tracking-wider mb-1 border-b border-[#333333]/30 pb-0.5">I. ISSUED BY:</div>
              <div className="font-bold text-slate-900">{senderName || 'Your Name / Co.'}</div>
              {senderEmail && <div className="text-[#555555] font-mono text-[8px]">{senderEmail}</div>}
              {senderAddress && <div className="text-[#555555] max-w-[140px] truncate">{senderAddress}</div>}
            </div>
            <div>
              <div className="font-bold text-[#111111] uppercase tracking-wider mb-1 border-b border-[#333333]/30 pb-0.5">II. BILLED TO:</div>
              <div className="font-bold text-slate-900">{clientName || 'Client Name / Co.'}</div>
              {clientEmail && <div className="text-[#555555] font-mono text-[8px]">{clientEmail}</div>}
              {clientAddress && <div className="text-[#555555] max-w-[140px] truncate">{clientAddress}</div>}
            </div>
          </div>

          {/* Dates highlight container */}
          <div className="border border-[#333333]/80 bg-[#f5f1e5] p-2.5 rounded my-2.5 grid grid-cols-3 gap-2 text-[8px] font-semibold text-[#444444]">
            <div>
              <div className="text-[7px] text-[#666666] uppercase tracking-wider">DATE ISSUED:</div>
              <div className="text-[#111111] mt-0.5 font-bold">{date || 'YYYY-MM-DD'}</div>
            </div>
            <div>
              <div className="text-[7px] text-[#666666] uppercase tracking-wider">DUE DATE:</div>
              <div className="text-[#111111] mt-0.5 font-bold">{dueDate || 'YYYY-MM-DD'}</div>
            </div>
            <div>
              <div className="text-[7px] text-[#666666] uppercase tracking-wider">STATUS:</div>
              <div className="text-[#742a2a] mt-0.5 font-bold uppercase tracking-wider">PENDING</div>
            </div>
          </div>

          {/* Items Mock Table */}
          <div className="flex-1 mt-3">
            <div className="grid grid-cols-12 border-t-2 border-b-2 border-double border-[#333333] py-1 px-2.5 font-bold text-[8px] tracking-wider mb-1.5 text-[#111111] uppercase">
              <span className="col-span-7">DESCRIPTION OF WORK</span>
              <span className="col-span-1 text-center">QTY</span>
              <span className="col-span-2 text-right">RATE</span>
              <span className="col-span-2 text-right">TOTAL</span>
            </div>

            <div className="flex flex-col text-[8.5px] max-h-40 overflow-y-auto">
              {items.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="grid grid-cols-12 py-2 px-2.5 border-b border-[#333333]/20"
                >
                  <span className="col-span-7 text-[#222222] pr-2 truncate">
                    {item.description || <span className="text-slate-400 italic">No description specified</span>}
                  </span>
                  <span className="col-span-1 text-center text-[#222222] font-semibold">{item.quantity}</span>
                  <span className="col-span-2 text-right text-[#333333] font-mono">
                    {currency} {item.rate.toLocaleString('en-IN')}
                  </span>
                  <span className="col-span-2 text-right font-bold text-[#111111] font-mono">
                    {currency} {item.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Summary columns */}
          <div className="mt-3 flex flex-col items-end gap-1.5 text-[9px] border-t border-[#333333]/20 pt-2.5">
            <div className="flex justify-between w-40 text-[#444444]">
              <span>Subtotal:</span>
              <span className="font-semibold font-mono text-[#222222]">{currency} {subtotal.toLocaleString('en-IN')}</span>
            </div>
            {advancePaid > 0 && (
              <div className="flex justify-between w-40 text-[#444444]">
                <span>Advance Paid:</span>
                <span className="font-semibold font-mono text-[#222222]">- {currency} {advancePaid.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between w-40 text-[#111111] border-t-2 border-b-2 border-double border-[#333333] py-1 font-bold text-xs mt-1">
              <span className="text-[9px] self-end mb-0.5 uppercase tracking-wider">Balance Due:</span>
              <span className="font-mono text-[#742a2a]">{currency} {balanceDue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Notes column */}
          {notes && (
            <div className="mt-3 text-[7.5px] leading-relaxed border-t border-[#333333]/20 pt-2.5">
              <div className="font-bold text-[#111111] uppercase tracking-wider mb-0.5">Notes & Terms:</div>
              <p className="text-[#444444] whitespace-pre-wrap italic">{notes}</p>
            </div>
          )}

          {/* Tiny paper mark */}
          <div className="mt-auto pt-4 text-[7px] text-center text-[#666666] border-t border-[#333333]/20 italic">
            Rendered in the old-fashioned way by InvoiceGenie AI.
          </div>
        </div>
      </div>
    </div>
  );
}
