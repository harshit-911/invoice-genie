'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '../lib/types';
import DashboardHeader from '../components/DashboardHeader';
import InvoiceInput from '../components/InvoiceInput';
import InvoicePreview from '../components/InvoicePreview';
import InvoiceList from '../components/InvoiceList';
import ReminderCard from '../components/ReminderCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, BookOpen } from 'lucide-react';

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customApiKey, setCustomApiKey] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [selectedReminderInvoice, setSelectedReminderInvoice] = useState<Invoice | null>(null);

  // Load invoices from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('invoicegenie_invoices');
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved invoices from localStorage', err);
      }
    }
  }, []);

  // Save invoices to localStorage whenever they change
  const saveInvoicesToStorage = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    localStorage.setItem('invoicegenie_invoices', JSON.stringify(updatedInvoices));
  };

  // Handlers for Invoice Creation
  const handleParseStart = () => {
    setIsParsing(true);
    setParsedData(null);
  };

  const handleParseSuccess = (data: any) => {
    setIsParsing(false);
    setParsedData(data);
  };

  const handleParseError = () => {
    setIsParsing(false);
  };

  const handleSaveInvoice = (newInvoice: Invoice) => {
    const updated = [newInvoice, ...invoices];
    saveInvoicesToStorage(updated);
    setParsedData(null); // Clear preview editor after save
  };

  // Handlers for List Operations
  const handleUpdateStatus = (id: string, newStatus: InvoiceStatus) => {
    const updated = invoices.map((inv) => 
      inv.id === id ? { ...inv, status: newStatus } : inv
    );
    saveInvoicesToStorage(updated);
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updated = invoices.filter((inv) => inv.id !== id);
      saveInvoicesToStorage(updated);
    }
  };

  // Calculate statistics accurately
  // - Total Invoiced: sum of all invoice amounts
  // - Total Paid: full amounts of "paid" invoices + advance amounts of "pending"/"overdue" invoices
  // - Total Outstanding: remaining due balances on "pending"/"overdue" invoices
  const stats = invoices.reduce(
    (acc, inv) => {
      acc.totalInvoiced += inv.amount;
      if (inv.status === 'paid') {
        acc.totalPaid += inv.amount;
      } else {
        acc.totalPaid += inv.advancePaid;
        acc.totalOutstanding += (inv.amount - inv.advancePaid);
      }
      return acc;
    },
    { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0 }
  );

  return (
    <main className="min-h-screen grid-bg relative py-10 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-10">
      {/* Decorative colored blur balls */}
      <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[60%] left-[5%] w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Dashboard Summary */}
      <DashboardHeader 
        stats={stats} 
        currencySymbol="₹" 
        onApiKeyChange={setCustomApiKey} 
      />

      {/* Main Grid Content */}
      <div className="flex flex-col gap-10">
        
        {/* Natural Language Prompt Area */}
        <div className="w-full">
          <InvoiceInput
            onParseStart={handleParseStart}
            onParseSuccess={handleParseSuccess}
            onParseError={handleParseError}
            customApiKey={customApiKey}
          />
        </div>

        {/* AI Parse Preview Panel */}
        <AnimatePresence mode="wait">
          {parsedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <InvoicePreview
                initialData={parsedData}
                onSave={handleSaveInvoice}
                onCancel={() => setParsedData(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Invoices Section */}
        <div className="w-full">
          <InvoiceList
            invoices={invoices}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteInvoice}
            onSelectReminder={setSelectedReminderInvoice}
          />
        </div>
      </div>

      {/* AI Reminder Dialog Modal */}
      <AnimatePresence>
        {selectedReminderInvoice && (
          <ReminderCard
            invoice={selectedReminderInvoice}
            onClose={() => setSelectedReminderInvoice(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer className="w-full text-center py-6 border-t border-slate-900/60 mt-10 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>InvoiceGenie AI — Built for Developers and Freelancers</span>
        </div>
        <div>© 2026 InvoiceGenie. All rights reserved. Keep billing smart.</div>
      </footer>
    </main>
  );
}
