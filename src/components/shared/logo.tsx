import Link from "next/link";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  href: string;
  size?: "default" | "lg";
  "aria-label"?: string;
  className?: string;
  wordmarkClassName?: string;
}

export function Logo({
  href,
  size = "default",
  className,
  wordmarkClassName,
  ...props
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={props["aria-label"]}
      className={cn(
        "flex items-center gap-2 rounded-md transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white",
          size === "lg" ? "size-8" : "size-7",
        )}
      >
        <Layers className="size-4" />
      </div>
      <span className={cn("font-semibold", size === "lg" && "text-lg", wordmarkClassName)}>
        DevStash
      </span>
    </Link>
  );
}
