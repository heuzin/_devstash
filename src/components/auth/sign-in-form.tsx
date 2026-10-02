"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GithubIcon } from "@/components/icons/github-icon";
import { signInSchema } from "@/lib/validations/auth";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(
    searchParams.get("error") ? "Something went wrong signing in with GitHub. Please try again." : null,
  );
  const [isCredentialsSubmitting, setIsCredentialsSubmitting] = useState(false);
  const [isGithubSubmitting, setIsGithubSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsCredentialsSubmitting(true);

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    setIsCredentialsSubmitting(false);

    if (result?.error) {
      const code = (result as { code?: string }).code;
      setFormError(
        code === "rate_limited"
          ? "Too many login attempts. Please try again later."
          : "Invalid email or password",
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  function handleGithubSignIn() {
    setIsGithubSubmitting(true);
    signIn("github", { callbackUrl });
  }

  return (
    <div className="space-y-4">
      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={!!fieldErrors.password}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isCredentialsSubmitting}>
          {isCredentialsSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative py-1 text-center text-xs text-muted-foreground">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <span className="relative bg-card px-2">or</span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isGithubSubmitting}
        onClick={handleGithubSignIn}
      >
        <GithubIcon className="size-4" />
        Sign in with GitHub
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Register
        </Link>
      </p>
    </div>
  );
}
