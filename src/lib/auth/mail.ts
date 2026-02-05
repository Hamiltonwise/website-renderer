import nodemailer from "nodemailer";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "email.hamiltonwise.com";

export async function sendOTP(email: string, code: string): Promise<boolean> {
  if (!MAILGUN_API_KEY) {
    console.error("[MAIL] MAILGUN_API_KEY not configured");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${MAILGUN_DOMAIN}`,
        pass: MAILGUN_API_KEY,
      },
    });

    await transporter.sendMail({
      from: `Website Builder Admin <admin@${MAILGUN_DOMAIN}>`,
      to: email,
      subject: "Your Login Code",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Your Login Code</h2>
          <p style="color: #4b5563; font-size: 16px;">Enter this code to access Website Builder:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log(`[MAIL] OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("[MAIL] Failed to send OTP:", error);
    return false;
  }
}
