import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PRO_BENEFITS = [
  "Upload files and images",
  "Unlimited items and collections",
  "AI auto-tagging, summaries, and code explanations",
  "Data export (JSON / ZIP)",
];

interface ProUpgradePromptProps {
  typeLabel: string;
}

export function ProUpgradePrompt({ typeLabel }: ProUpgradePromptProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="items-center text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          {typeLabel} are a Pro feature
          <Badge variant="outline" className="text-[10px] uppercase">
            Pro
          </Badge>
        </CardTitle>
        <CardDescription>
          Upgrade to DevStash Pro to store and browse your {typeLabel.toLowerCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-2 text-sm">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-green-500" />
              {benefit}
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-2">
          <Button className="w-full" nativeButton={false} render={<Link href="/settings" />}>
            Upgrade to Pro
          </Button>
          <p className="text-xs text-muted-foreground">$8/month or $72/year</p>
        </div>
      </CardContent>
    </Card>
  );
}
