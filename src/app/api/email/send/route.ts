import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { 
      clientEmail, 
      clientName, 
      senderName, 
      invoiceNumber, 
      pdfAttachment, // base64 string
      filename, 
      amount, 
      currency 
    } = await req.json();

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required to send the invoice.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    // Elegant classic email HTML template
    const htmlContent = `
      <div style="font-family: 'Georgia', serif; max-width: 550px; margin: 0 auto; padding: 30px; background-color: #faf8f2; color: #222222; border: 3px double #333333; border-radius: 4px;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="font-size: 20px; font-weight: bold; margin: 0; letter-spacing: 2px; text-transform: uppercase; color: #111111;">INVOICE GENIE</h2>
          <div style="font-size: 8px; color: #666666; letter-spacing: 1px; margin-top: 4px;">AUTOMATED FINANCE LEDGER</div>
          <hr style="border: 0; border-top: 1px solid #333333; width: 60px; margin: 10px auto;" />
        </div>

        <p style="font-size: 13px; line-height: 1.6; margin-bottom: 15px;">Dear <strong>${clientName}</strong>,</p>
        
        <p style="font-size: 12px; line-height: 1.6; margin-bottom: 20px;">
          Please find attached invoice <strong>${invoiceNumber}</strong> issued by <strong>${senderName || 'our services'}</strong>. 
          A summary of the outstanding balance is listed below for your convenience.
        </p>

        <div style="background-color: #f4efdf; padding: 15px; border: 1px solid #333333; border-radius: 4px; margin: 20px 0;">
          <table style="width: 100%; font-size: 12px; border-collapse: collapse; line-height: 1.5;">
            <tr>
              <td style="font-weight: bold; color: #555555; text-transform: uppercase; font-size: 10px;">Ledger Reference:</td>
              <td style="text-align: right; font-weight: bold; font-family: monospace;">${invoiceNumber}</td>
            </tr>
            <tr style="border-top: 1px solid #ccc;">
              <td style="font-weight: bold; color: #555555; text-transform: uppercase; font-size: 10px; padding-top: 8px;">Outstanding Amount:</td>
              <td style="text-align: right; font-weight: bold; color: #742a2a; font-family: monospace; font-size: 14px; padding-top: 8px;">
                ${currency} ${amount.toLocaleString('en-IN')}
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 11px; line-height: 1.6; color: #555555; font-style: italic; margin-bottom: 25px;">
          The full descriptive breakdown, bank details, and payment coordinates are contained within the attached PDF document.
        </p>

        <hr style="border: 0; border-top: 1px dashed #333333; margin-bottom: 15px;" />
        
        <div style="text-align: center; font-size: 9px; color: #777777; font-style: italic;">
          Thank you for your business.<br/>
          Secured and compiled via InvoiceGenie AI.
        </div>
      </div>
    `;

    if (!apiKey) {
      // MOCK MODE LOGS
      console.log('\n================== ✉️ MOCK EMAIL DISPATCH ==================');
      console.log(`FROM: InvoiceGenie <onboarding@resend.dev>`);
      console.log(`TO: ${clientName} <${clientEmail}>`);
      console.log(`SUBJECT: Invoice ${invoiceNumber} from ${senderName || 'Freelancer'}`);
      console.log(`ATTACHMENT: ${filename} (Size: ~${Math.round(pdfAttachment.length * 0.75 / 1024)} KB)`);
      console.log('----------------------------------------------------------');
      console.log(`Outstanding Balance: ${currency} ${amount.toLocaleString('en-IN')}`);
      console.log('==========================================================\n');

      return NextResponse.json({ 
        success: true, 
        mock: true, 
        message: 'Email dispatched in mock development mode (logged to server console). Configure RESEND_API_KEY for real delivery.' 
      });
    }

    // Configure Resend
    const resend = new Resend(apiKey);
    const buffer = Buffer.from(pdfAttachment, 'base64');

    const result = await resend.emails.send({
      from: 'InvoiceGenie <onboarding@resend.dev>', // Default resend testing domain sender
      to: clientEmail,
      subject: `Invoice ${invoiceNumber} from ${senderName || 'Freelance Partner'}`,
      html: htmlContent,
      attachments: [
        {
          filename: filename,
          content: buffer,
        }
      ]
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({ 
      success: true, 
      mock: false, 
      id: result.data?.id,
      message: 'Invoice PDF has been successfully emailed to client!' 
    });

  } catch (error: any) {
    console.error('Email Sender Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch email. Please check your credentials.' },
      { status: 500 }
    );
  }
}
