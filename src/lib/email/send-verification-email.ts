import { resend } from "@/lib/resend";

const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";

interface SendVerificationEmailParams {
  to: string;
  name: string;
  verifyUrl: string;
}

export async function sendVerificationEmail({ to, name, verifyUrl }: SendVerificationEmailParams) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your DevStash email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Click the link below to verify your DevStash account. This link expires in 24 hours.</p>
        <p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px;">
            Verify email
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>If you didn't create a DevStash account, you can ignore this email.</p>
      </div>
    `,
  });
}
