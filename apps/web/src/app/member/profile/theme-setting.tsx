"use client";

import { useSyncExternalStore } from "react";
import { FiMoon } from "react-icons/fi";

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
    <section className="mx-4 mt-5 rounded-3xl border border-purple-100 bg-white px-5 py-4 shadow-sm sm:mx-6">
      <div className="flex items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-purple-50 text-lg text-[#6b21a8]">
          <FiMoon aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Dark mode</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Use a darker appearance throughout the app.
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
            className={`block size-6 rounded-full bg-[#fff] shadow-sm transition-transform ${dark ? "translate-x-6" : "translate-x-0"}`}
          />
        </button>
      </div>
    </section>
  );
}
