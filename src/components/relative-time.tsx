"use client";

import { useEffect, useState } from "react";
import { agoShort } from "@/lib/format";

/**
 * Relative times differ between the server render and the client render, which
 * is a hydration mismatch. Render the stable absolute form first, then upgrade
 * to the relative form once mounted, and keep it ticking.
 */
export function Ago({
  at,
  suffix = "ago",
  fallback = "",
  uppercase = false,
}: {
  at: number | null;
  suffix?: string;
  fallback?: string;
  uppercase?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  if (at == null) return <>{fallback}</>;
  if (now == null) return <>{fallback || " "}</>;

  const text = `${agoShort(at)} ${suffix}`.trim();
  return <>{uppercase ? text.toUpperCase() : text}</>;
}
