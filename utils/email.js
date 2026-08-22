// Resend Email Dispatch Utility with Automatic Test Account Routing
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = new Resend(resendApiKey);

// Resend Free Tier Account Owner Email (Only verified recipient in Resend test mode without custom domain)
const RESEND_TEST_OWNER_EMAIL = 'gagan.r123456789@gmail.com';

/**
 * Universal HTML Email Dispatcher via Resend SDK
 * @param {object} params - { to, subject, html }
 */
export async function sendEmail({ to, subject, html }) {
  const originalRecipient = Array.isArray(to) ? to[0] : to;
  let targetRecipient = originalRecipient;

  try {
    // 1. Attempt sending to target recipient
    let response = await resend.emails.send({
      from: 'UniCollab <onboarding@resend.dev>',
      to: [targetRecipient],
      subject: subject,
      html: html
    });

    // 2. If Resend test account restriction is triggered (sending to non-owner email on free tier),
    // automatically fallback to RESEND_TEST_OWNER_EMAIL so the email is delivered to the inbox!
    if (response.error && (
      response.error.message?.includes('testing emails to your own email address') ||
      response.error.statusCode === 403 ||
      response.error.name === 'validation_error'
    )) {
      console.warn(`⚠️ [RESEND TEST MODE RESTRICTION] Redirecting email for ${originalRecipient} to Resend owner inbox: ${RESEND_TEST_OWNER_EMAIL}`);
      
      const modifiedSubject = `[For ${originalRecipient}] ${subject}`;
      const modifiedHtml = `
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; padding: 12px 16px; border-radius: 10px; font-size: 12.5px; font-weight: 700; margin-bottom: 20px;">
          ℹ️ Resend Free Tier Test Dispatch: Originally addressed to <strong>${originalRecipient}</strong>
        </div>
        ${html}
      `;

      response = await resend.emails.send({
        from: 'UniCollab <onboarding@resend.dev>',
        to: [RESEND_TEST_OWNER_EMAIL],
        subject: modifiedSubject,
        html: modifiedHtml
      });
    }

    if (response.error) {
      console.error('❌ [RESEND API ERROR]', response.error);
      return { success: false, error: response.error };
    }

    const emailId = response.data?.id || response.id;
    console.log(`✉️ [RESEND SUCCESS] Dispatched email | Message ID: ${emailId}`);
    return { success: true, id: emailId };
  } catch (err) {
    console.error('❌ [RESEND SYSTEM EXCEPTION]', err.message);
    return { success: false, error: err.message };
  }
}

export const generateOtpEmailHtml = (code, recipientName = 'Student') => {
  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #2563eb; font-size: 24px; font-weight: 800; margin: 0;">UniCollab</h2>
        <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Designed by Code Morphicx</p>
      </div>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
        <h3 style="color: #0f172a; font-size: 18px; font-weight: 700;">Password Reset Authorization Code</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello ${recipientName},<br/>
          You requested a password reset for your UniCollab account. Use the 6-digit verification code below to authorize your password change.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 28px; border-radius: 12px; display: inline-block;">
            ${code}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">
          This code is valid for 10 minutes. If you did not request this password reset, please ignore this email.
        </p>
      </div>
    </div>
  `;
};
