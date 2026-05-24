import { ExtractionResult } from './types';

/**
 * Calls the Next.js API route to parse natural language into structured invoice data using Gemini.
 * Optionally passes a user-supplied API key in the headers if no key is configured on the server.
 */
export async function parseInvoiceWithAI(
  prompt: string,
  customApiKey?: string
): Promise<ExtractionResult> {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (customApiKey) {
    headers['x-api-key'] = customApiKey;
  }

  const response = await fetch('/api/extract', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, currentDate }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Error parsing invoice (Status ${response.status})`);
  }

  return response.json();
}
