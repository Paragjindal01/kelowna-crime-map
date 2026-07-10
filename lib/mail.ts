import nodemailer from "nodemailer";

// Uses real SMTP when configured via env (SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, SMTP_FROM). Without SMTP config the verification link is logged
// to the server console so the flow still works in development.
export async function sendVerificationEmail(to: string, name: string, token: string) {
  // Never fall back to localhost in production — verification links would break.
  const baseUrl =
    process.env.APP_URL ||
    (process.env.NODE_ENV === "production" ? "https://safekelowna.com" : "http://localhost:3000");
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  if (!process.env.SMTP_HOST) {
    console.log(`\n[dev] Email verification link for ${to}:\n${verifyUrl}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "SafeKelowna <no-reply@safekelowna.local>",
    to,
    subject: "Verify your SafeKelowna account",
    text: `Hi ${name},\n\nWelcome to SafeKelowna! Confirm your email address by opening this link:\n\n${verifyUrl}\n\nIf you didn't create this account, you can ignore this email.`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 24px; background:#ffffff; color:#1f2933; border:1px solid #d8d5cc; border-radius: 8px;">
        <h2 style="color:#2f5d50; margin-top:0;">SafeKelowna</h2>
        <p>Hi ${name},</p>
        <p>Welcome to the community! Confirm your email address to unlock posting lost items and contacting owners.</p>
        <p style="margin: 28px 0;">
          <a href="${verifyUrl}" style="background:#2f5d50; color:#ffffff; padding: 12px 24px; border-radius: 6px; text-decoration:none; font-weight:bold;">Verify my email</a>
        </p>
        <p style="color:#667085; font-size: 0.85em;">If you didn't create this account, you can ignore this email.</p>
      </div>
    `,
  });
}
