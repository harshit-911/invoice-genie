import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

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
      currency,
      paymentMilestones
    } = await req.json();

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required to send the invoice.' },
        { status: 400 }
      );
    }

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

        ${paymentMilestones && paymentMilestones.length > 0 ? `
          <div style="margin-top: 15px; margin-bottom: 15px; border: 1px solid #333333; border-radius: 4px; padding: 12px; background-color: #fbfaf5;">
            <div style="font-size: 10px; font-weight: bold; color: #555555; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #333333; padding-bottom: 4px; margin-bottom: 8px; text-align: left;">Payment Schedule</div>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse; line-height: 1.5;">
              <thead>
                <tr style="border-bottom: 1.5px solid #ccc; color: #666; font-weight: bold; text-align: left;">
                  <th style="padding-bottom: 4px; text-align: left;">Milestone</th>
                  <th style="padding-bottom: 4px; text-align: center;">Due Date</th>
                  <th style="padding-bottom: 4px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${paymentMilestones.map((m: any) => `
                  <tr style="border-bottom: 1px dashed #eee;">
                    <td style="padding: 5px 0; font-weight: bold; text-align: left;">${m.name}</td>
                    <td style="padding: 5px 0; text-align: center; color: #555;">${m.dueDate}</td>
                    <td style="padding: 5px 0; text-align: right; font-family: monospace;">${currency} ${Number(m.amount).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

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

    // Priority 1: SMTP Nodemailer (Completely Free via Gmail, Brevo, Sendgrid, Outlook, etc.)
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');

    if (smtpUser && smtpPass) {
      console.log(`✉️ Dispatching invoice email via SMTP (${smtpHost}:${smtpPort}) to ${clientEmail}`);
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports e.g. 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"InvoiceGenie" <${smtpUser}>`,
        to: clientEmail,
        subject: `Invoice ${invoiceNumber} from ${senderName || 'Freelance Partner'}`,
        html: htmlContent,
        attachments: [
          {
            filename: filename,
            content: Buffer.from(pdfAttachment, 'base64'),
          }
        ]
      });

      return NextResponse.json({ 
        success: true, 
        mock: false, 
        service: 'smtp',
        message: 'Invoice PDF has been successfully emailed to client via SMTP!' 
      });
    }

    // Priority 2: Resend API Key fallback
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      console.log(`✉️ Dispatching invoice email via Resend API to ${clientEmail}`);
      const resend = new Resend(resendApiKey);
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
        service: 'resend',
        id: result.data?.id,
        message: 'Invoice PDF has been successfully emailed to client via Resend!' 
      });
    }

    // Priority 3: Mock Fallback Mode (Runs if no email settings are configured)
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
      service: 'mock',
      message: 'Email dispatched in mock development mode (logged to server console). Configure SMTP or Resend credentials for real delivery.' 
    });

  } catch (error: any) {
    console.error('Email Dispatcher Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch email. Please check your credentials.' },
      { status: 500 }
    );
  }
}
