"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FiMapPin, FiZap } from "react-icons/fi";
import type { CheckInAction, CheckInResult } from "@/lib/check-in";

const MINIMUM_VERIFICATION_TIME_MS = 1500;
const AUTOMATIC_LOCATION_TIMEOUT_MS = 8000;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export default function CheckInButton({
  eventId,
  onCheckIn,
}: {
  eventId: string;
  onCheckIn: CheckInAction;
}) {
  const router = useRouter();

  // Tracking each geolocation attempt so old Safari responses
  // cannot interfere with a newer retry.
  const locationAttemptId = useRef(0);

  // Preventing the automatic check-in effect from running more than once.
  const automaticAttemptStarted = useRef(false);

  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [locating, setLocating] = useState(false);

  const captureAndCheckIn = useCallback(
    (automatic = false) => {
      const verificationStartedAt = Date.now();

      // Checking whether the browser supports geolocation.
      if (!("geolocation" in navigator)) {
        setResult({
          success: false,
          message: "This browser does not support location capture.",
        });

        return;
      }

      setResult(null);
      setLocating(true);

      // Creating a unique ID for this location request.
      const attemptId = ++locationAttemptId.current;

      // Automatic check-in should not leave the button disabled forever.
      // After 8 seconds, release the UI and allow a manual retry.
      const automaticTimeout = automatic
        ? window.setTimeout(() => {
            if (locationAttemptId.current !== attemptId) {
              return;
            }

            // Invalidating this attempt so a late Safari callback is ignored.
            locationAttemptId.current++;

            setLocating(false);

            setResult({
              success: false,
              message:
                "Automatic check-in is taking longer than expected. Tap below to try again.",
            });
          }, AUTOMATIC_LOCATION_TIMEOUT_MS)
        : null;

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          // Ignoring responses from expired or older location requests.
          if (locationAttemptId.current !== attemptId) {
            return;
          }

          if (automaticTimeout !== null) {
            window.clearTimeout(automaticTimeout);
          }

          setLocating(false);

          startTransition(async () => {
            const elapsed = Date.now() - verificationStartedAt;

            const [response] = await Promise.all([
              onCheckIn(
                eventId,
                coords.latitude,
                coords.longitude,
                coords.accuracy,
              ),

              wait(Math.max(0, MINIMUM_VERIFICATION_TIME_MS - elapsed)),
            ]);

            setResult(response);

            if (response.success) {
              router.refresh();
            }
          });
        },

        (error) => {
          // Ignoring errors from expired or older attempts.
          if (locationAttemptId.current !== attemptId) {
            return;
          }

          if (automaticTimeout !== null) {
            window.clearTimeout(automaticTimeout);
          }

          setLocating(false);

          let message =
            "Your location could not be determined. Please try again.";

          if (error.code === error.PERMISSION_DENIED) {
            message =
              "Location permission is blocked. Allow precise location access for Arrows, then try again.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message =
              "Your phone could not determine your location. Make sure Location Services are enabled and try again.";
          } else if (error.code === error.TIMEOUT) {
            message = automatic
              ? "Automatic check-in could not get your location in time. Tap below to try again."
              : "Getting your location took too long. Move to an open area and try again.";
          }

          setResult({
            success: false,
            message,
          });
        },

        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 20000,
        },
      );
    },
    [eventId, onCheckIn, router],
  );

  useEffect(() => {
    // Starting automatic check-in only once when this component loads.
    if (automaticAttemptStarted.current) {
      return;
    }

    automaticAttemptStarted.current = true;

    captureAndCheckIn(true);

    return () => {
      // Invalidating any pending location callback if the component unmounts.
      locationAttemptId.current++;
    };
  }, [captureAndCheckIn]);

  const busy = locating || pending;

  return (
    <div className="mt-5">
      {busy && !result ? (
        <p
          className="mb-3 inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm font-extrabold text-[#6b21a8]"
          role="status"
        >
          <FiZap aria-hidden="true" />

          {locating
            ? "Getting your precise location…"
            : "Checking your attendance…"}
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
          className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${
            result.success
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {result.message}

          {result.success && result.distanceMeters !== undefined
            ? ` ${result.status} at ${result.distanceMeters.toFixed(
                1,
              )} m from the church center.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
