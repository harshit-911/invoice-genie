'use client';

import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../lib/types';
import { downloadInvoicePDF, generateInvoicePDFInstance } from '../lib/pdfGenerator';
import { 
  History, Calendar, ToggleLeft, ToggleRight, MessageSquare, 
  Trash2, Download, Check, AlertTriangle, Clock, RefreshCw, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InvoiceListProps {
  invoices: Invoice[];
  onUpdateStatus: (id: string, newStatus: InvoiceStatus) => void;
  onDelete: (id: string) => void;
  onSelectReminder: (invoice: Invoice) => void;
}

export default function InvoiceList({
  invoices,
  onUpdateStatus,
  onDelete,
  onSelectReminder,
}: InvoiceListProps) {
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  const handleEmailInvoice = async (invoice: Invoice) => {
    if (!invoice.clientEmail) {
      alert('This invoice does not have a client email address configured.');
      return;
    }

    setSendingInvoiceId(invoice.id);
    try {
      const doc = generateInvoicePDFInstance(invoice);
      const base64Data = doc.output('datauristring').split(',')[1];
      const filename = `${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`;

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: invoice.clientEmail.trim(),
          clientName: invoice.clientName.trim(),
          senderName: invoice.senderName || 'Freelancer',
          invoiceNumber: invoice.invoiceNumber,
          pdfAttachment: base64Data,
          filename: filename,
          amount: invoice.amount,
          currency: invoice.currency,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email.');
      }

      if (data.mock) {
        alert(`Email Sent (Mock Mode)!\n\nDetails:\n- Client: ${invoice.clientName}\n- Email: ${invoice.clientEmail}\n\nSince no RESEND_API_KEY is configured in your environment, the email transaction details have been printed in your local server console.`);
      } else {
        alert(`Success! Invoice ${invoice.invoiceNumber} has been sent to ${invoice.clientName} (${invoice.clientEmail}).`);
      }
    } catch (err: any) {
      alert(`Email dispatch failed: ${err.message || 'Unknown error occurred.'}`);
    } finally {
      setSendingInvoiceId(null);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  // Cycle status: pending -> paid -> overdue -> pending
  const handleCycleStatus = (id: string, currentStatus: InvoiceStatus) => {
    const statusCycle: Record<InvoiceStatus, InvoiceStatus> = {
      pending: 'paid',
      paid: 'overdue',
      overdue: 'pending',
    };
    onUpdateStatus(id, statusCycle[currentStatus]);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const styles: Record<InvoiceStatus, string> = {
      paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    const icons: Record<InvoiceStatus, React.ReactNode> = {
      paid: <Check className="h-3 w-3 shrink-0" />,
      pending: <Clock className="h-3 w-3 shrink-0" />,
      overdue: <AlertTriangle className="h-3 w-3 shrink-0" />,
    };

    return (
      <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles[status]}`}>
        {icons[status]}
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-2xl relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Invoice History</h2>
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold border border-slate-700">
            {invoices.length}
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-0.5 self-start md:self-auto">
          {(['all', 'pending', 'paid', 'overdue'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list table / grid */}
      <div className="w-full">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 text-center">
            <Clock className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Invoices Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
              {filter === 'all' 
                ? "Describe your billing details above in natural language to create your very first AI invoice!" 
                : `There are currently no invoices matching the "${filter}" filter status.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredInvoices.map((invoice) => {
                const balanceDue = invoice.amount - invoice.advancePaid;
                return (
                  <motion.div
                    key={invoice.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl bg-slate-950/40 hover:bg-slate-955/70 border border-slate-850 hover:border-slate-800 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Primary client/invoice info */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white tracking-tight">{invoice.invoiceNumber}</span>
                        <span className="text-xs font-medium text-slate-400">to</span>
                        <span className="text-xs font-bold text-indigo-400">{invoice.clientName}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>Due: {invoice.dueDate}</span>
                        </span>
                        {invoice.items.length > 0 && (
                          <span className="truncate max-w-[240px] text-slate-655">
                            {invoice.items[0].description}
                            {invoice.items.length > 1 && ` (+${invoice.items.length - 1} more items)`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="flex flex-col items-start md:items-end justify-center">
                      <div className="text-sm font-extrabold text-white tracking-tight">
                        {invoice.currency} {invoice.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        {invoice.advancePaid > 0 ? (
                          <span>
                            {invoice.currency} {invoice.advancePaid.toLocaleString('en-IN')} advance /{' '}
                            <span className="text-indigo-400/80">
                              {invoice.currency} {balanceDue.toLocaleString('en-IN')} due
                            </span>
                          </span>
                        ) : (
                          <span>No advance / Full amount outstanding</span>
                        )}
                      </div>
                    </div>

                    {/* Control / action buttons */}
                    <div className="flex items-center gap-2 border-t border-slate-800/60 md:border-t-0 pt-3 md:pt-0 shrink-0 self-end md:self-auto">
                      {/* Cycle Status */}
                      <button
                        title="Change Status"
                        onClick={() => handleCycleStatus(invoice.id, invoice.status)}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition active:scale-95"
                      >
                        <RefreshCw className="h-4 w-4 shrink-0" />
                      </button>

                      {/* Reminder Agent trigger */}
                      {invoice.status !== 'paid' && (
                        <button
                          title="Generate Reminder Text"
                          onClick={() => onSelectReminder(invoice)}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-semibold text-xs transition active:scale-95"
                        >
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="hidden sm:inline">Remind</span>
                        </button>
                      )}

                      {/* Email to Client */}
                      <button
                        title="Email to Client"
                        onClick={() => handleEmailInvoice(invoice)}
                        disabled={sendingInvoiceId === invoice.id}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-white transition active:scale-95 disabled:opacity-50"
                      >
                        {sendingInvoiceId === invoice.id ? (
                          <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0" />
                        ) : (
                          <Mail className="h-4 w-4 shrink-0" />
                        )}
                      </button>

                      {/* Download PDF */}
                      <button
                        title="Export to PDF"
                        onClick={() => downloadInvoicePDF(invoice)}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95"
                      >
                        <Download className="h-4 w-4 shrink-0" />
                      </button>

                      {/* Delete */}
                      <button
                        title="Delete Invoice"
                        onClick={() => onDelete(invoice.id)}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-rose-500/10 border border-slate-805 text-slate-500 hover:text-rose-400 transition active:scale-95"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
