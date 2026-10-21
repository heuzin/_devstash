"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const TOAST_ID = "checkout-status";
const ACTIVATION_POLL_MS = 2500;
const MAX_ACTIVATION_POLLS = 4;

// Reacts to Stripe Checkout's return URL (?checkout=success|canceled). The
// webhook can land after the redirect, so on success it re-refreshes a few
// times until the server reports Pro.
export function CheckoutStatusToast({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const status = useSearchParams().get("checkout");
  const awaitingProRef = useRef(false);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (status !== "success" && status !== "canceled") return;

    if (status === "success") {
      // A fixed toast id keeps Strict Mode's double effect from stacking toasts.
      toast.success("Welcome to Pro! It may take a few seconds to activate.", { id: TOAST_ID });
      awaitingProRef.current = true;
    } else {
      toast("Checkout canceled.", { id: TOAST_ID });
    }

    router.replace("/settings");
    router.refresh();
  }, [status, router]);

  useEffect(() => {
    if (isPro) {
      awaitingProRef.current = false;
      return;
    }
    if (!awaitingProRef.current) return;

    const timer = window.setInterval(() => {
      if (pollsRef.current >= MAX_ACTIVATION_POLLS) {
        window.clearInterval(timer);
        awaitingProRef.current = false;
        return;
      }
      pollsRef.current += 1;
      router.refresh();
    }, ACTIVATION_POLL_MS);

    return () => window.clearInterval(timer);
  }, [isPro, status, router]);

  return null;
}
