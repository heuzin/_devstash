import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { consumeVerificationToken } from "@/lib/auth/verification-token";

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  const result = typeof token === "string" ? await consumeVerificationToken(token) : null;

  if (result?.success) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
          <CardTitle>Email verified</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Your email has been verified. You can now use all of DevStash.
          </p>
          <Link href="/dashboard" className={buttonVariants({ className: "w-full" })}>
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  const message =
    result?.error === "expired"
      ? "This verification link has expired."
      : "This verification link is invalid.";

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <XCircle className="size-10 text-destructive" />
        <CardTitle>Verification failed</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          {message} Sign in and use &quot;Resend verification email&quot; to request a new one.
        </p>
        <Link href="/sign-in" className={buttonVariants({ className: "w-full" })}>
          Go to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
