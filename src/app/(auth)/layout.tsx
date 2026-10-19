import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Logo href="/" size="lg" />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
