'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Key, CheckCircle2, Clock, DollarSign, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  stats: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  currencySymbol: string;
  onApiKeyChange: (key: string) => void;
}

export default function DashboardHeader({ stats, currencySymbol, onApiKeyChange }: DashboardHeaderProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [isKeyInputOpen, setIsKeyInputOpen] = useState(false);

  // Check if API key is in environment or localStorage
  useEffect(() => {
    // 1. Fetch server key configuration status
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setHasEnvKey(data.hasEnvKey);
      })
      .catch((err) => console.error('Failed to fetch config status', err));

    // 2. Load custom key from local storage if existing
    const savedKey = localStorage.getItem('invoicegenie_custom_gemini_key') || '';
    setApiKey(savedKey);
    if (savedKey) {
      onApiKeyChange(savedKey);
    }
  }, [onApiKeyChange]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('invoicegenie_custom_gemini_key', apiKey.trim());
    onApiKeyChange(apiKey.trim());
    setIsKeyInputOpen(false);
  };

  const handleClearKey = () => {
    setApiKey('');
    localStorage.removeItem('invoicegenie_custom_gemini_key');
    onApiKeyChange('');
  };

  const formatAmount = (val: number) => {
    return `${currencySymbol} ${val.toLocaleString('en-IN')}`;
  };

  const isConnected = hasEnvKey || !!apiKey;

  return (
    <header className="w-full flex flex-col gap-6 select-none">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        
        {/* Branding */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              InvoiceGenie <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">AI</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">AI Billing Assistant</p>
          </div>
        </div>

        {/* Action Controls / API Key Config */}
        <div className="flex items-center gap-4 relative z-10 self-end md:self-auto">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs text-slate-300 font-medium">
              {isConnected ? (hasEnvKey ? 'Connected (System Key)' : 'Connected (Custom Key)') : 'Action Required: Set API Key'}
            </span>
          </div>

          {/* Key Button */}
          {!hasEnvKey && (
            <div className="relative">
              <button
                onClick={() => setIsKeyInputOpen(!isKeyInputOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isConnected 
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200' 
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                }`}
              >
                <Key className="h-3.5 w-3.5" />
                {isConnected ? 'Update Key' : 'Add Gemini Key'}
              </button>

              {isKeyInputOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-80 p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl z-50 flex flex-col gap-3"
                >
                  <div className="text-xs font-semibold text-slate-300">Enter Custom Gemini API Key</div>
                  <form onSubmit={handleSaveKey} className="flex flex-col gap-2">
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        placeholder="AIzaSy..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-1.5 pr-9 text-xs rounded bg-slate-900 border border-slate-850 text-white placeholder-slate-655 focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                      >
                        Save Key
                      </button>
                      {apiKey && (
                        <button
                          type="button"
                          onClick={handleClearKey}
                          className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </form>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    This key is saved locally in your browser cache and is only sent to the local `/api/extract` server handler.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Financial Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Invoiced */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-900/20 backdrop-blur-xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Total Invoiced</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-2xl font-bold text-white tracking-tight">
            {formatAmount(stats.totalInvoiced)}
          </div>
          <p className="text-[10px] text-indigo-400/80 mt-1 font-medium">Accumulated across all invoices</p>
        </div>

        {/* Card 2: Total Paid */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-900/20 backdrop-blur-xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Collected Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-2xl font-bold text-white tracking-tight">
            {formatAmount(stats.totalPaid)}
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-1 font-medium">Successfully paid in full / advance</p>
        </div>

        {/* Card 3: Total Outstanding */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-900/20 backdrop-blur-xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Outstanding Balance</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-2xl font-bold text-white tracking-tight">
            {formatAmount(stats.totalOutstanding)}
          </div>
          <p className="text-[10px] text-amber-400/80 mt-1 font-medium">Unpaid amounts currently pending/overdue</p>
        </div>
      </div>
    </header>
  );
}
