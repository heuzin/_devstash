"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema } from "@/lib/validations/auth";
import { changePassword } from "@/actions/profile";

type FieldErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmNewPassword", string>
>;

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
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
    setIsSubmitting(true);

    const result = await changePassword(
      parsed.data.currentPassword,
      parsed.data.newPassword,
      parsed.data.confirmNewPassword,
    );

    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    toast.success("Password updated", { richColors: true });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          aria-invalid={!!fieldErrors.currentPassword}
        />
        {fieldErrors.currentPassword && (
          <p className="text-xs text-destructive">{fieldErrors.currentPassword}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          aria-invalid={!!fieldErrors.newPassword}
        />
        {fieldErrors.newPassword && (
          <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmNewPassword">Confirm new password</Label>
        <Input
          id="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          value={confirmNewPassword}
          onChange={(event) => setConfirmNewPassword(event.target.value)}
          aria-invalid={!!fieldErrors.confirmNewPassword}
        />
        {fieldErrors.confirmNewPassword && (
          <p className="text-xs text-destructive">{fieldErrors.confirmNewPassword}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
