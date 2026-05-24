import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { prompt, currentDate } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get Gemini API Key: check environment first, then check custom header
    let apiKey = process.env.GEMINI_API_KEY;
    
    // If not in env, check x-api-key header from client
    const clientApiKey = req.headers.get('x-api-key');
    if (!apiKey && clientApiKey) {
      apiKey = clientApiKey;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key not found. Please set GEMINI_API_KEY in your environment or provide it in the dashboard header.' },
        { status: 401 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-2.5-flash for structured json output
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        clientName: {
          type: SchemaType.STRING,
          description: 'Name of the client or company being billed. Ensure proper capitalization.',
        },
        clientEmail: {
          type: SchemaType.STRING,
          description: 'Email address of the client, if specified.',
        },
        clientAddress: {
          type: SchemaType.STRING,
          description: 'Physical address of the client, if specified.',
        },
        senderName: {
          type: SchemaType.STRING,
          description: 'Name of the person or company issuing the invoice. Default empty.',
        },
        senderEmail: {
          type: SchemaType.STRING,
          description: 'Email address of the sender, if specified.',
        },
        senderAddress: {
          type: SchemaType.STRING,
          description: 'Physical address of the sender, if specified.',
        },
        dueDate: {
          type: SchemaType.STRING,
          description: 'Due date in YYYY-MM-DD format. If relative (e.g. "next Friday", "in 10 days"), compute the exact date relative to the currentDate provided. If not specified, default to 14 days from currentDate.',
        },
        advancePayment: {
          type: SchemaType.NUMBER,
          description: 'Advance payment or deposit amount. If specified as percentage (e.g. "50% advance"), calculate the value relative to the calculated total (sum of items quantity * rate).',
        },
        notes: {
          type: SchemaType.STRING,
          description: 'Any extra notes, billing details, payment terms or account details mentioned.',
        },
        currency: {
          type: SchemaType.STRING,
          description: 'Currency symbol (e.g. ₹ for INR/Rupees, $ for USD, € for EUR, £ for GBP). Default is ₹ if not specified or implied.',
        },
        items: {
          type: SchemaType.ARRAY,
          description: 'List of items, services, or hourly tasks to charge for.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              description: {
                type: SchemaType.STRING,
                description: 'Brief description of the work or item.',
              },
              quantity: {
                type: SchemaType.NUMBER,
                description: 'Quantity, hours, or units. Default to 1 if not clear.',
              },
              rate: {
                type: SchemaType.NUMBER,
                description: 'Unit rate or price per quantity. If total price is specified for a service (e.g. "website development ₹25000"), quantity is 1 and rate is 25000.',
              },
              amount: {
                type: SchemaType.NUMBER,
                description: 'Total amount for this item (quantity * rate).',
              },
            },
            required: ['description', 'quantity', 'rate'],
          },
        },
      },
      required: ['clientName', 'items'],
    };

    const systemPrompt = `You are a financial AI extraction assistant. Your job is to extract structured invoice data from natural language instructions.
    
    Today's date is: ${currentDate || new Date().toISOString().split('T')[0]}.
    Use this current date to resolve relative date descriptions like "next Friday", "due by end of month", "in 15 days", or "due next week".
    
    Rules for calculations:
    1. The "amount" for each item must be equal to quantity * rate.
    2. Sum the item amounts to find the total invoice amount.
    3. If the user mentions a percentage-based advance (e.g., "50% advance", "10% deposit"), compute the absolute advance payment value based on the total. E.g., if total is 12000 and advance is "50%", advancePayment = 6000.
    4. Default to currency "₹" if not specified.
    
    Strictly conform to the provided JSON schema. Do not return any other text besides the JSON.`;

    const chatSession = model.startChat({
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const result = await chatSession.sendMessage([
      { text: systemPrompt },
      { text: `Extract from this prompt: "${prompt}"` }
    ]);

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Extraction Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to extract invoice data. Please verify your API key and prompt.' },
      { status: 500 }
    );
  }
}
