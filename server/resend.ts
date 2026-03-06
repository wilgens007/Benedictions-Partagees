import { Resend } from 'resend';

const RESEND_OWNER_EMAIL = 'wilgens007@gmail.com';

function getResendClient(): { client: Resend; fromEmail: string } {
  const apiKey = process.env.RESEND_API_KEY_MANUAL;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY_MANUAL is not set');
  }
  return { client: new Resend(apiKey), fromEmail: 'onboarding@resend.dev' };
}

export async function sendPrayerRequestEmail(name: string, email: string, message: string) {
  const { client, fromEmail } = getResendClient();

  console.log(`[RESEND] Sending prayer request email: from=${fromEmail}, to=${RESEND_OWNER_EMAIL}`);

  const result = await client.emails.send({
    from: fromEmail,
    to: RESEND_OWNER_EMAIL,
    subject: `New Prayer Request from ${name}`,
    html: `
      <h2>New Prayer Request</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <hr />
      <p><strong>Prayer Request:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr />
      <p style="color: #666; font-size: 12px;">This prayer request was submitted through the B\u00e9n\u00e9dictions Partag\u00e9es app.</p>
    `
  });

  console.log("[RESEND] Prayer request email result:", JSON.stringify(result));

  if ((result as any).error) {
    console.error("[RESEND] Prayer request email error:", JSON.stringify((result as any).error));
  }

  return result;
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  const { client, fromEmail } = getResendClient();

  console.log(`[RESEND] Sending password reset notification to account owner for: ${toEmail}`);

  const result = await client.emails.send({
    from: fromEmail,
    to: RESEND_OWNER_EMAIL,
    subject: `B\u00e9n\u00e9dictions Partag\u00e9es - Password Reset Request for ${toEmail}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">Password Reset Requested</h2>
        <p>A user has requested a password reset:</p>
        <p><strong>Email:</strong> ${toEmail}</p>
        <p><strong>Reset Link:</strong></p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #D4AF37; color: #1a1a2e; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. Forward this email to the user or use the admin endpoint to reset their password directly.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">B\u00e9n\u00e9dictions Partag\u00e9es - contact@benedictionspartagees.org</p>
      </div>
    `
  });

  console.log("[RESEND] Password reset notification result:", JSON.stringify(result));

  if ((result as any).error) {
    console.error("[RESEND] Password reset notification error:", JSON.stringify((result as any).error));
  }

  return result;
}

export async function sendTestEmail(toEmail: string) {
  const { client, fromEmail } = getResendClient();

  const actualTo = RESEND_OWNER_EMAIL;
  console.log(`[RESEND] Sending test email: from=${fromEmail}, to=${actualTo} (requested: ${toEmail})`);

  const result = await client.emails.send({
    from: fromEmail,
    to: actualTo,
    subject: 'B\u00e9n\u00e9dictions Partag\u00e9es - Test Email',
    html: `<p>This is a test email from B\u00e9n\u00e9dictions Partag\u00e9es.</p><p>Requested recipient was: ${toEmail}</p><p>If you received this, email delivery is working correctly.</p>`
  });

  console.log("[RESEND] Test email result:", JSON.stringify(result));

  if ((result as any).error) {
    console.error("[RESEND] Test email error:", JSON.stringify((result as any).error));
  }

  return { result, fromEmail, actualTo, requestedTo: toEmail };
}
