const EMAIL_VERIFICATION_ENABLED = process.env.EMAIL_VERIFICATION_ENABLED !== "false";

export function isEmailVerificationEnabled() {
  return EMAIL_VERIFICATION_ENABLED;
}
