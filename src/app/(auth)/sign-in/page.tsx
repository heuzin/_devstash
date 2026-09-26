import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Sign in to access your DevStash.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
