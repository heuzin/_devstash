"use client";

import { useState } from "react";

const REVERT_DELAY_MS = 1500;

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), REVERT_DELAY_MS);
  }

  return { copied, copy };
}
