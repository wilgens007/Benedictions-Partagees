// Resend email integration
import { Resend } from 'resend';

export async function sendPrayerRequestEmail(name: string, email: string, message: string) {
  // Use manual API key if provided, otherwise fallback to system connection
  const manualApiKey = process.env.RESEND_API_KEY_MANUAL;
  let client: Resend;
  let fromEmail: string;

  if (manualApiKey) {
    console.log("[DEBUG] Using manual RESEND_API_KEY_MANUAL");
    client = new Resend(manualApiKey);
    fromEmail = 'onboarding@resend.dev'; // Default for manual keys without domain setup
  } else {
    console.log("[DEBUG] Falling back to system Resend connection");
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) {
      throw new Error('X_REPLIT_TOKEN not found for repl/depl');
    }

    const connectionSettings = await fetch(
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
    
    client = new Resend(connectionSettings.settings.api_key);
    fromEmail = connectionSettings.settings.from_email || 'onboarding@resend.dev';
  }
  
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
      <p style="color: #666; font-size: 12px;">This prayer request was submitted through the Bénédictions Partagées app.</p>
    `
  });
  
  console.log("Resend API Response:", JSON.stringify(result));
  return result;
}
