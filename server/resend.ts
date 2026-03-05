import { Resend } from 'resend';

async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  const manualApiKey = process.env.RESEND_API_KEY_MANUAL;

  if (manualApiKey) {
    return { client: new Resend(manualApiKey), fromEmail: 'onboarding@resend.dev' };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found for repl/depl');

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings?.settings?.api_key) throw new Error('Resend not connected');

  return {
    client: new Resend(connectionSettings.settings.api_key),
    fromEmail: connectionSettings.settings.from_email || 'onboarding@resend.dev',
  };
}

export async function sendPrayerRequestEmail(name: string, email: string, message: string) {
  const { client, fromEmail } = await getResendClient();
  const manualApiKey = process.env.RESEND_API_KEY_MANUAL;

  const result = await client.emails.send({
    from: fromEmail,
    to: manualApiKey ? 'wilgens007@gmail.com' : 'benedictionspartagees@gmail.com',
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

  console.log("Resend API Response:", JSON.stringify(result));
  return result;
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  const { client, fromEmail } = await getResendClient();

  const result = await client.emails.send({
    from: fromEmail,
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

  console.log("[RESEND] Password reset email sent:", JSON.stringify(result));
  return result;
}
