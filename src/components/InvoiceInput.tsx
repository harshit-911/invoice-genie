'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InvoiceInputProps {
  onParseStart: () => void;
  onParseSuccess: (parsedData: any) => void;
  onParseError: (err: string) => void;
  customApiKey?: string;
}

const EXAMPLES = [
  {
    label: '₹12,000 Logo Design (Advance)',
    text: 'Invoice ₹12000 to Rahul Sharma (rahul@example.com) for logo design, 50% advance, due next Friday. Address is HSR Layout, Bangalore.',
  },
  {
    label: '€4,500 Consulting (14 days due)',
    text: 'Bill Google Ireland Ltd €4500 for 30 hours of software consulting services at €150/hr. Send invoice to billing@google.ie. Payment terms are 14 days.',
  },
  {
    label: '$2,500 Web Development',
    text: 'Create an invoice for ABC Retailers Inc for Website Development and SEO setup. Total fee is $2500, due in 30 days. Note: Please deposit to bank account X.',
  },
];

const LOADING_STEPS = [
  'Initializing Gemini model...',
  'Analyzing syntax and intent...',
  'Extracting client details...',
  'Computing rates and amounts...',
  'Structuring line items...',
  'Refining invoice payload...',
];

export default function InvoiceInput({
  onParseStart,
  onParseSuccess,
  onParseError,
  customApiKey,
}: InvoiceInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle rotating loading text
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    onParseStart();

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          currentDate: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse invoice details.');
      }

      onParseSuccess(data);
    } catch (err: any) {
      const msg = err.message || 'An error occurred while parsing. Please check your connection and API key.';
      setErrorMessage(msg);
      onParseError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Input container */}
      <div className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">AI Billing Input</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              rows={4}
              placeholder="Describe your invoice in plain English or Hinglish...&#13;E.g., 'Invoice ₹15,000 to Amit for design work, 30% advance, due by 15th June'"
              className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none shadow-inner"
            />
            {prompt.trim() && !isLoading && (
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span>Press Enter to generate</span>
                <CornerDownLeft className="h-3 w-3" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Example Prompts */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-500 font-medium">Quick Templates:</span>
              {EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleExampleClick(ex.text)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[11px] text-slate-300 font-medium transition active:scale-95"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition shadow-lg shadow-indigo-600/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{isLoading ? 'Processing' : 'Generate Invoice'}</span>
              {isLoading ? (
                <div className="h-3 w-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* States (Loading and Error) */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full"
          >
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
              <div className="text-xs font-medium text-indigo-300/90 animate-pulse">
                {LOADING_STEPS[loadingStepIndex]}
              </div>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full"
          >
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <div className="text-xs font-semibold text-rose-300">AI Parsing Failed</div>
                <div className="text-xs text-rose-400/80 leading-relaxed">{errorMessage}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
