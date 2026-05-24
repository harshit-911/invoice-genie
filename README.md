# invoice-genie

# InvoiceGenie AI

InvoiceGenie AI is a modern Next.js application that converts natural language billing instructions into structured invoices, generates polished PDF invoices, and optionally sends them to clients.

This app is built for freelancers, consultants, and small teams who want to turn a plain-language invoice description into a professional invoice quickly.

## What it does

- Accepts natural language invoice prompts like:
  - "Invoice Acme Corp for 45 hours of UI design at ₹1200/hr, 30% advance, due in 15 days."
  - "Bill Startup Ltd for website development ₹65,000, include 3 monthly installments."
- Uses Google Gemini through a Next.js API route to extract:
  - client details
  - invoice items
  - total amount
  - due date
  - advance payment and milestones
  - currency and notes
- Displays a preview for review before saving
- Saves invoices locally in the browser using `localStorage`
- Generates printable PDF invoices using `jsPDF`
- Sends invoice emails via SMTP or Resend when configured

## Key features

- AI-powered prompt parsing using Gemini
- Structured invoice creation from plain text
- Saved invoice list with status management (`pending`, `paid`, `overdue`)
- Invoice preview and manual save workflow
- PDF invoice generation with professional layout
- Optional email dispatch with attachment support
- Local persistence for invoice history

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- jsPDF
- Google Generative AI (`@google/generative-ai`)
- Nodemailer / Resend for email delivery

## Project structure

- `src/app/page.tsx` — main dashboard UI
- `src/components/` — UI components for invoice input, preview, list, reminders
- `src/lib/invoiceParser.ts` — client helper for invoice extraction API calls
- `src/lib/pdfGenerator.ts` — invoice PDF generation logic
- `src/app/api/extract/route.ts` — Gemini extraction API route
- `src/app/api/email/send/route.ts` — email dispatch API route
- `src/lib/types.ts` — invoice schema and typed interfaces

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root.

3. Add the required environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key
```

4. Optionally configure email delivery:

```env
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_HOST=smtp.example.com
SMTP_PORT=465
# or
RESEND_API_KEY=your_resend_api_key
```

## Running locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Usage

1. Enter a plain-language invoice prompt in the input area.
2. The app sends the prompt to `/api/extract` and parses invoice details.
3. Review the parsed invoice preview.
4. Save the invoice to your local invoice list.
5. From the invoice list, update invoice status or send email if configured.

## Environment variables

- `GEMINI_API_KEY` — required for AI-based invoice extraction
- `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` — optional SMTP settings for actual email delivery
- `RESEND_API_KEY` — optional Resend email delivery fallback

## Notes

- Invoice data is stored in browser `localStorage`, so it persists only on the same machine and browser.
- If email settings are not configured, the app falls back to a development mock mode and logs email content to the server console.

## Deployment

This app can be deployed to Vercel or any platform that supports Next.js 16 and Node.js serverless functions.

## License

This repository is currently private.
