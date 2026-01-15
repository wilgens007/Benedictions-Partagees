// Resend email integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'onboarding@resend.dev'
  };
}

export async function sendPrayerRequestEmail(name: string, email: string, message: string) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const result = await client.emails.send({
    from: fromEmail || 'onboarding@resend.dev',
    to: 'benedictionspartagees@gmail.com',
    subject: `New Prayer Request from ${name}`,
    html: `
      <h2>New Prayer Request</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <hr />
      <p><strong>Prayer Request:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr />
      <p style="color: #666; font-size: 12px;">This prayer request was submitted through the Bénédictions Partagées app.</p>
    `
  });
  console.log("Resend API Response:", JSON.stringify(result));
  return result;
}
