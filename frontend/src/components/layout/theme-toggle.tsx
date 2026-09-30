"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { setTheme, useTheme, withThemeSweep } from "@/lib";
import type { MouseEvent } from "react";

export default function ThemeToggle({ className }: { className?: string }) {
  const isDark = useTheme() === "dark";

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const { left, top, width, height } =
      event.currentTarget.getBoundingClientRect();
    const origin = { x: left + width / 2, y: top + height / 2 };

    withThemeSweep(() => setTheme(isDark ? "light" : "dark"), origin, !isDark);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`text-on-rail relative transition-colors after:absolute after:-inset-3 after:content-[''] hover:text-white focus-visible:outline-white ${className ?? ""}`}
    >
      <span className="sr-only dark:hidden">Switch to dark theme</span>
      <span className="sr-only hidden dark:inline">Switch to light theme</span>
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </button>
  );
}
