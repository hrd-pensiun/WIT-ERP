"use client";

import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage first, then system preference, default to light
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) {
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else {
      const prefDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefDark);
    }
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}
