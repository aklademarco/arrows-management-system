"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const storageKey = "acms-theme";
const changeEvent = "acms-theme-change";

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function ThemeSetting() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const dark = theme === "dark";

  function toggleTheme() {
    const nextTheme: Theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event(changeEvent));
  }

  return (
    <section className="mx-4     px-2 py-2  sm:mx-6">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Dark mode</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Use dark theme
          </p>
        </div>
        <button
          aria-checked={dark}
          aria-label="Dark mode"
          className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition-colors ${dark ? "bg-[#6b21a8]" : "bg-slate-300"}`}
          onClick={toggleTheme}
          role="switch"
          type="button"
        >
          <span
            className={`block size-6 rounded-full bg-white shadow-sm transition-transform ${dark ? "translate-x-6" : "translate-x-0"}`}
          />
        </button>
      </div>
    </section>
  );
}
