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
    <div className="fixed inset-x-3 bottom-24 z-[100] mx-auto max-w-md rounded-[1.75rem] border border-purple-100 bg-white p-5 shadow-[0_20px_60px_rgba(36,0,70,0.22)] sm:bottom-6">
      <button
        aria-label="Close install instructions"
        className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
        onClick={dismiss}
        type="button"
      >
        <FiX />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-purple-100 text-xl text-[#6b21a8]">
          <FiDownload />
        </span>

        <div>
          <h2 className="font-black text-slate-950">
            Add Arrows to your Home Screen
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Open Application like a normal app from your phone.
          </p>
        </div>
      </div>

      {installPrompt ? (
        <button
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6b21a8] font-extrabold text-white shadow-[0_5px_0_#4c1677] active:translate-y-1 active:shadow-none"
          onClick={install}
          type="button"
        >
          <FiDownload />
          Install Arrows
        </button>
      ) : isIos ? (
        <div className="mt-5 grid gap-3">
          <Instruction
            icon={<FiShare />}
            number="1"
            text="Tap the Share button in Safari."
          />

          <Instruction
            icon={<FiDownload />}
            number="2"
            text='Choose "Add to Home Screen".'
          />

          <Instruction number="3" text='Tap "Add" to finish.' />
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
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
        className="mt-5 w-full text-center text-sm font-bold text-slate-400"
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
    <div className="flex items-center gap-3 rounded-2xl bg-purple-50 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#6b21a8] text-xs font-black text-white">
        {number}
      </span>

      <p className="flex-1 text-sm font-semibold text-slate-700">{text}</p>

      {icon ? <span className="text-lg text-[#6b21a8]">{icon}</span> : null}
    </div>
  );
}
