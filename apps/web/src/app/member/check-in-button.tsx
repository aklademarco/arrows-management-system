"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FiMapPin, FiZap } from "react-icons/fi";
import { checkIn, type CheckInResult } from "./actions";

export default function CheckInButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [locating, setLocating] = useState(false);
  const automaticAttemptStarted = useRef(false);

  const captureAndCheckIn = useCallback(
    (automatic = false) => {
      if (!("geolocation" in navigator)) {
        setResult({
          success: false,
          message: "This browser does not support location capture.",
        });
        return;
      }
      setResult(null);
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setLocating(false);
          startTransition(async () => {
            const response = await checkIn(
              eventId,
              coords.latitude,
              coords.longitude,
              coords.accuracy,
            );
            setResult(response);
            if (response.success) router.refresh();
          });
        },
        (error) => {
          setLocating(false);
          setResult({
            success: false,
            message:
              error.code === error.PERMISSION_DENIED
                ? "Automatic check-in needs precise location permission. Allow it, then use the button below."
                : automatic
                  ? "Automatic check-in could not confirm your location. Move to an open area, then use the button below."
                  : "Your location could not be determined. Move outdoors and try again.",
          });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
      );
    },
    [eventId, router],
  );

  useEffect(() => {
    if (automaticAttemptStarted.current) return;
    automaticAttemptStarted.current = true;
    captureAndCheckIn(true);
  }, [captureAndCheckIn]);

  const busy = locating || pending;

  return (
    <div className="mt-5">
      {busy && !result ? (
        <p
          className="mb-3 inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm font-extrabold text-[#6b21a8]"
          role="status"
        >
          <FiZap aria-hidden="true" /> Checking you in automatically…
        </p>
      ) : null}
      <div>
        <button
          className="member-primary-action"
          disabled={busy || result?.success}
          onClick={() => captureAndCheckIn(false)}
          type="button"
        >
          <FiMapPin aria-hidden="true" />
          {busy
            ? "Verifying location..."
            : result?.success
              ? "Checked in"
              : result
                ? "Try check-in again"
                : "Check in with button"}
        </button>
      </div>
      {result ? (
        <p
          className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${result.success ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"}`}
          role="status"
        >
          {result.message}
          {result.success && result.distanceMeters !== undefined
            ? ` ${result.status} at ${result.distanceMeters.toFixed(1)} m from the church center.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
