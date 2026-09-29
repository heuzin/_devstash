import Link from "next/link";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  if (typeof token !== "string") {
    return (
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <XCircle className="size-10 text-destructive" />
          <CardTitle>Invalid reset link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid. Request a new one from the sign-in page.
          </p>
          <Link href="/forgot-password" className={buttonVariants({ className: "w-full" })}>
            Request new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
