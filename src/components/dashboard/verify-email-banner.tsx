"use client";

import { useState, useTransition } from "react";
import { MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/actions/auth";

export function VerifyEmailBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;

  function handleResend() {
    startTransition(async () => {
      const result = await resendVerificationEmail();
      if (result.success) {
        toast.success("Verification email sent. Check your inbox.");
      } else {
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Alert className="mb-6">
      <MailWarning />
      <AlertTitle>Verify your email</AlertTitle>
      <AlertDescription>
        Please verify your email address to unlock all DevStash features.
      </AlertDescription>
      <AlertAction className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleResend} disabled={isPending}>
          {isPending ? "Sending..." : "Resend email"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </Button>
      </AlertAction>
    </Alert>
  );
}
