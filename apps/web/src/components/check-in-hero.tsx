"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

const checkInPhotos = [
  "m11",
  "m13",
  "m14",
  "m15",
  "m16",
  "m17",
  "m18",
  "m19",
  ...Array.from({ length: 51 }, (_, index) => `m${index + 110}`),
].map((name) => `/assets/check-in-photos/${name}.jpg`);

export function CheckInHero({ children }: { children: ReactNode }) {
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setPhotoIndex((current) => (current + 1) % checkInPhotos.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <article className="relative isolate overflow-hidden rounded-[2rem] text-white shadow-[0_24px_60px_rgba(76,22,119,0.3)]">
      <Image
        alt=""
        aria-hidden="true"
        className="check-in-photo object-cover object-center"
        fill
        key={checkInPhotos[photoIndex]}
        priority={photoIndex === 0}
        sizes="(min-width: 1024px) 55vw, 100vw"
        src={checkInPhotos[photoIndex]}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(70,18,110,0.8)_0%,rgba(107,33,168,0.7)_52%,rgba(147,51,234,0.6)_100%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/5" />
      <div className="relative z-10 h-full p-6 sm:p-8">{children}</div>
    </article>
  );
}
