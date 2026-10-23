"use client";

import { Switch } from "@/components/ui/switch";
import type { BillingInterval } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface BillingIntervalToggleProps {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  disabled?: boolean;
  className?: string;
}

export function BillingIntervalToggle({
  interval,
  onChange,
  disabled,
  className,
}: BillingIntervalToggleProps) {
  const yearly = interval === "yearly";

  const labelClass = (active: boolean) =>
    cn("transition-colors", active ? "text-foreground" : "text-muted-foreground");

  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <button
        type="button"
        className={labelClass(!yearly)}
        onClick={() => onChange("monthly")}
        disabled={disabled}
      >
        Monthly
      </button>
      <Switch
        checked={yearly}
        onCheckedChange={(checked) => onChange(checked ? "yearly" : "monthly")}
        disabled={disabled}
        aria-label="Yearly billing"
      />
      <button
        type="button"
        className={labelClass(yearly)}
        onClick={() => onChange("yearly")}
        disabled={disabled}
      >
        Yearly
        <span className="ml-1.5 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
          Save 25%
        </span>
      </button>
    </div>
  );
}
