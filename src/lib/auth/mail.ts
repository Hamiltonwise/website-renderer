const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "email.hamiltonwise.com";

export async function sendOTP(email: string, code: string): Promise<boolean> {
  if (!MAILGUN_API_KEY) {
    console.error("[MAIL] MAILGUN_API_KEY not configured");
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("from", `Website Builder Admin <admin@${MAILGUN_DOMAIN}>`);
    formData.append("to", email);
    formData.append("subject", "Your Login Code");
    formData.append("html", `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <h2 style="color: #11151C; margin: 0 0 16px 0; font-size: 24px;">Your Login Code</h2>
          <p style="color: #6B7280; font-size: 16px; margin: 0 0 24px 0;">
            Enter this code to access Website Builder:
          </p>
          <div style="background: #F3F4F6; border-radius: 12px; padding: 32px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #D66853; font-family: monospace;">
              ${code}
            </span>
          </div>
          <p style="color: #9CA3AF; font-size: 14px; margin: 24px 0 0 0;">
            This code expires in 10 minutes.
          </p>
          <p style="color: #9CA3AF; font-size: 14px; margin: 8px 0 0 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      </div>
    `);

    const response = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MAIL] Mailgun API error:", response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`[MAIL] OTP sent to ${email}, message ID:`, result.id);
    return true;
  } catch (error) {
    console.error("[MAIL] Failed to send OTP:", error);
    return false;
  }
}
