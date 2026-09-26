import Link from "next/link";
import { Layers } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white">
          <Layers className="size-4" />
        </div>
        <span className="text-lg font-semibold">DevStash</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
