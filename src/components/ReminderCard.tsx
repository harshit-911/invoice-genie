'use client';

import React, { useState, useEffect } from 'react';
import { Invoice } from '../lib/types';
import { 
  X, Copy, Check, Send, Mail, MessageCircle, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReminderCardProps {
  invoice: Invoice | null;
  onClose: () => void;
}

type ReminderTone = 'friendly' | 'firm' | 'urgent';

export default function ReminderCard({ invoice, onClose }: ReminderCardProps) {
  const [tone, setTone] = useState<ReminderTone>('friendly');
  const [copied, setCopied] = useState(false);
  const [reminderText, setReminderText] = useState('');

  // Generate reminder texts depending on the invoice and selected tone
  useEffect(() => {
    if (!invoice) return;

    const balanceDue = invoice.amount - invoice.advancePaid;
    const clientName = invoice.clientName;
    const invNumber = invoice.invoiceNumber;
    const dueDate = invoice.dueDate;
    const currency = invoice.currency;
    const sender = invoice.senderName || 'Freelance Partner';
    const firstItem = invoice.items[0]?.description || 'services rendered';

    let draft = '';

    if (tone === 'friendly') {
      draft = `Hi ${clientName},\n\nI hope you are doing well! This is just a friendly reminder regarding Invoice ${invNumber} for "${firstItem}" that was issued on ${invoice.date}.\n\nThe total outstanding balance is ${currency}${balanceDue.toLocaleString('en-IN')}, and it is due by ${dueDate}.\n\nYou can review and download the detailed invoice PDF attached. Please let me know if you have any questions or if you've already initiated the payment.\n\nThank you so much!\n\nBest regards,\n${sender}`;
    } else if (tone === 'firm') {
      draft = `Dear ${clientName},\n\nThis message is a professional request for payment of Invoice ${invNumber} which was due on ${dueDate}.\n\nThe outstanding balance is ${currency}${balanceDue.toLocaleString('en-IN')} for the completed work on "${firstItem}".\n\nPlease process this payment at your earliest convenience to keep our account up to date. Let me know if you need our bank coordinates or payment options again.\n\nThank you for your cooperation.\n\nSincerely,\n${sender}`;
    } else if (tone === 'urgent') {
      draft = `URGENT: Outstanding Balance on Invoice ${invNumber}\n\nDear ${clientName},\n\nOur records show that we have not yet received payment for Invoice ${invNumber} for "${firstItem}" which is now overdue. The due date was ${dueDate}.\n\nThe total outstanding amount is ${currency}${balanceDue.toLocaleString('en-IN')}.\n\nPlease arrange for immediate settlement of this invoice. If payment is not received shortly, we may have to temporarily halt active services or apply standard late fee adjustments as per our agreement.\n\nIf you have already paid this invoice, please share the transaction confirmation details immediately.\n\nThank you,\n${sender}`;
    }

    setReminderText(draft);
  }, [invoice, tone]);

  if (!invoice) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reminderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const balanceDue = invoice.amount - invoice.advancePaid;

  const mailtoUrl = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(
    `Payment Reminder: Invoice ${invoice.invoiceNumber}`
  )}&body=${encodeURIComponent(reminderText)}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(reminderText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col gap-5 overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reminder Agent</h3>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Drafting reminder for {invoice.invoiceNumber} • {invoice.clientName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tone Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reminder Urgency Tone</label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
            {(['friendly', 'firm', 'urgent'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  tone === t
                    ? t === 'urgent'
                      ? 'bg-rose-600 text-white shadow'
                      : t === 'firm'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-indigo-605 bg-indigo-650 bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Textbox */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Message Draft</label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <textarea
              readOnly
              value={reminderText}
              rows={10}
              className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap select-text focus:outline-none shadow-inner"
            />
          </div>
        </div>

        {/* Share Action Row */}
        <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-800 pt-4">
          <a
            href={mailtoUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-705 text-slate-200 text-xs font-semibold transition"
          >
            <Mail className="h-4 w-4" />
            <span>Send Email</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Send WhatsApp</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
