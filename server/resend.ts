import { Resend } from 'resend';

const ACCOUNT_OWNER_EMAIL = 'benedictionspartagees@gmail.com';

async function getResendClient(): Promise<{ client: Resend; fromEmail: string; isTestSender: boolean }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (xReplitToken && hostname) {
    try {
      const connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
      ).then(res => res.json()).then(data => data.items?.[0]);

      if (connectionSettings?.settings?.api_key) {
        const fromEmail = connectionSettings.settings.from_email || 'onboarding@resend.dev';
        const isTestSender = fromEmail === 'onboarding@resend.dev';
        console.log(`[RESEND] Using integration connector, from=${fromEmail}, isTestSender=${isTestSender}`);
        return { client: new Resend(connectionSettings.settings.api_key), fromEmail, isTestSender };
      }
    } catch (err: any) {
      console.warn('[RESEND] Integration connector failed, trying manual key:', err.message);
    }
  }

  const manualApiKey = process.env.RESEND_API_KEY_MANUAL;
  if (manualApiKey) {
    console.log('[RESEND] Using RESEND_API_KEY_MANUAL with onboarding@resend.dev (test sender)');
    return { client: new Resend(manualApiKey), fromEmail: 'onboarding@resend.dev', isTestSender: true };
  }

  throw new Error('No Resend API key available (neither integration connector nor RESEND_API_KEY_MANUAL)');
}

export async function sendPrayerRequestEmail(name: string, email: string, message: string) {
  const { client, fromEmail, isTestSender } = await getResendClient();

  const toEmail = ACCOUNT_OWNER_EMAIL;

  if (isTestSender) {
    console.log(`[RESEND] Test sender: prayer request email will go to account owner (${toEmail})`);
  }

  console.log(`[RESEND] Sending prayer request email: from=${fromEmail}, to=${toEmail}`);

  const result = await client.emails.send({
    from: fromEmail,
    to: toEmail,
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
  const { client, fromEmail, isTestSender } = await getResendClient();

  if (isTestSender && toEmail !== ACCOUNT_OWNER_EMAIL) {
    console.error(`[RESEND] BLOCKED: Cannot send password reset to ${toEmail} using test sender (onboarding@resend.dev). Test sender can only deliver to account owner (${ACCOUNT_OWNER_EMAIL}). Verify a custom domain in Resend to enable sending to all users.`);
    throw new Error('Email delivery not available: Resend test sender cannot send to arbitrary recipients. A verified domain is required.');
  }

  console.log(`[RESEND] Sending password reset email: from=${fromEmail}, to=${toEmail}`);

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

  console.log("[RESEND] Password reset email result:", JSON.stringify(result));

  if ((result as any).error) {
    console.error("[RESEND] Password reset email error:", JSON.stringify((result as any).error));
  }

  return result;
}

export async function sendTestEmail(toEmail: string) {
  const { client, fromEmail, isTestSender } = await getResendClient();

  console.log(`[RESEND] Sending test email: from=${fromEmail}, to=${toEmail}, isTestSender=${isTestSender}`);

  const result = await client.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: 'B\u00e9n\u00e9dictions Partag\u00e9es - Test Email',
    html: `<p>This is a test email from B\u00e9n\u00e9dictions Partag\u00e9es.</p><p>If you received this, email delivery is working correctly.</p>`
  });

  console.log("[RESEND] Test email result:", JSON.stringify(result));

  if ((result as any).error) {
    console.error("[RESEND] Test email error:", JSON.stringify((result as any).error));
  }

  return { result, fromEmail, isTestSender, toEmail };
}
