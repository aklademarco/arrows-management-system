"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiMoreVertical, FiShare, FiX } from "react-icons/fi";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_KEY = "acms-install-prompt-dismissed";

export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (
          window.navigator as Navigator & {
            standalone?: boolean;
          }
        ).standalone,
      );

    if (standalone) {
      return;
    }

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "true";

    if (dismissed) {
      return;
    }

    const timer = window.setTimeout(() => {
      const userAgent = window.navigator.userAgent;

      const ios =
        /iPad|iPhone|iPod/.test(userAgent) ||
        (window.navigator.platform === "MacIntel" &&
          window.navigator.maxTouchPoints > 1);

      setIsIos(ios);
      setVisible(true);
    }, 1500);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setVisible(false);
      window.localStorage.setItem(DISMISS_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(timer);

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "true");

    setVisible(false);
  }

  async function install() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();

    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      window.localStorage.setItem(DISMISS_KEY, "true");

      setVisible(false);
    }

    setInstallPrompt(null);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-3 z-[100] w-[calc(100vw-1.5rem)] max-w-xs rounded-2xl border border-purple-100 bg-white p-4 shadow-[0_16px_45px_rgba(36,0,70,0.18)] sm:bottom-4 sm:left-4">
      <button
        aria-label="Close install instructions"
        className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-slate-100 text-xs text-slate-500 transition hover:bg-slate-200"
        onClick={dismiss}
        type="button"
      >
        <FiX />
      </button>

      <div className="flex items-start gap-3 pr-7">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-100 text-base text-[#6b21a8]">
          <FiDownload />
        </span>

        <div>
          <h2 className="text-sm font-black text-slate-950">
            Add Arrows to Home Screen
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Open Arrows quickly like a normal app.
          </p>
        </div>
      </div>

      {installPrompt ? (
        <button
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#6b21a8] text-xs font-extrabold text-white shadow-[0_3px_0_#4c1677] active:translate-y-0.5 active:shadow-none"
          onClick={install}
          type="button"
        >
          <FiDownload />
          Install Arrows
        </button>
      ) : isIos ? (
        <div className="mt-3 grid gap-2">
          <Instruction
            icon={<FiShare />}
            number="1"
            text="Tap Share in Safari."
          />

          <Instruction
            icon={<FiDownload />}
            number="2"
            text='Choose "Add to Home Screen".'
          />

          <Instruction number="3" text='Tap "Add" to finish.' />
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          <Instruction
            icon={<FiMoreVertical />}
            number="1"
            text="Open your browser menu."
          />

          <Instruction
            icon={<FiDownload />}
            number="2"
            text='Choose "Install app" or "Add to Home screen".'
          />

          <Instruction number="3" text="Confirm to add Arrows." />
        </div>
      )}

      <button
        className="mt-3 w-full text-center text-xs font-bold text-slate-400"
        onClick={dismiss}
        type="button"
      >
        Not now
      </button>
    </div>
  );
}

function Instruction({
  number,
  text,
  icon,
}: {
  number: string;
  text: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-2.5 py-2">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#6b21a8] text-[10px] font-black text-white">
        {number}
      </span>

      <p className="flex-1 text-xs font-semibold leading-4 text-slate-700">
        {text}
      </p>

      {icon ? <span className="text-sm text-[#6b21a8]">{icon}</span> : null}
    </div>
  );
}