import { resend } from "@/lib/resend";

const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: SendPasswordResetEmailParams) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your DevStash password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${name},</p>
        <p>Click the link below to choose a new DevStash password. This link expires in 24 hours.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px;">
            Reset password
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
}
