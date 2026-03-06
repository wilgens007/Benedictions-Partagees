import { Resend } from 'resend';

const FROM_EMAIL = 'B\u00e9n\u00e9dictions Partag\u00e9es <noreply@benedictionspartagees.org>';
const ADMIN_EMAIL = 'wilgens007@gmail.com';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY_MANUAL;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY_MANUAL is not set');
  }
  return new Resend(apiKey);
}

export async function sendPrayerRequestEmail(name: string, email: string, message: string) {
  const client = getResendClient();

  console.log(`[RESEND] Sending prayer request email: from=${FROM_EMAIL}, to=${ADMIN_EMAIL}`);

  const result = await client.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
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
  const client = getResendClient();

  console.log(`[RESEND] Sending password reset email: from=${FROM_EMAIL}, to=${toEmail}`);

  const result = await client.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'B\u00e9n\u00e9dictions Partag\u00e9es - R\u00e9initialisation du mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">R\u00e9initialisation du mot de passe</h2>
        <p>Vous avez demand\u00e9 la r\u00e9initialisation de votre mot de passe pour votre compte B\u00e9n\u00e9dictions Partag\u00e9es.</p>
        <p>Cliquez sur le bouton ci-dessous pour cr\u00e9er un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #D4AF37; color: #1a1a2e; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            R\u00e9initialiser le mot de passe
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Ce lien expirera dans 1 heure. Si vous n'avez pas demand\u00e9 cette r\u00e9initialisation, ignorez cet email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">B\u00e9n\u00e9dictions Partag\u00e9es - contact@benedictionspartagees.org</p>
      </div>
    `
  });

  console.log("[RESEND] Password reset email result:", JSON.stringify(result));

  if ((result as any).error) {
    console.error("[RESEND] Password reset email error:", JSON.stringify((result as any).error));
  }

  return result;
}

export async function sendTestEmail(toEmail: string) {
  const client = getResendClient();

  console.log(`[RESEND] Sending test email: from=${FROM_EMAIL}, to=${toEmail}`);

  const result = await client.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'B\u00e9n\u00e9dictions Partag\u00e9es - Test Email',
    html: `<p>This is a test email from B\u00e9n\u00e9dictions Partag\u00e9es.</p><p>If you received this, email delivery is working correctly.</p>`
  });

  console.log("[RESEND] Test email result:", JSON.stringify(result));

  if ((result as any).error) {
    console.error("[RESEND] Test email error:", JSON.stringify((result as any).error));
  }

  return { result, fromEmail: FROM_EMAIL, toEmail };
}
