"use client";

import { useState, useTransition } from "react";
import { FiMapPin } from "react-icons/fi";
import { checkIn, type CheckInResult } from "./actions";

export default function CheckInButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckInResult | null>(null);

  function captureAndCheckIn() {
    if (!("geolocation" in navigator)) {
      setResult({ success: false, message: "This browser does not support location capture." });
      return;
    }
    setResult(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => startTransition(async () => setResult(await checkIn(eventId, coords.latitude, coords.longitude, coords.accuracy))),
      (error) => setResult({ success: false, message: error.code === error.PERMISSION_DENIED ? "Allow precise location to check in." : "Your location could not be determined. Move outdoors and try again." }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );
  }

  return (
    <div className="mt-5">
      <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#240046] px-5 font-bold text-white disabled:bg-slate-400" disabled={pending || result?.success} onClick={captureAndCheckIn} type="button"><FiMapPin aria-hidden="true" />{pending ? "Checking location..." : result?.success ? "Checked in" : "Check in"}</button>
      {result ? <p className={`mt-3 rounded-lg p-3 text-sm ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`} role="status">{result.message}{result.success && result.distanceMeters !== undefined ? ` ${result.status} at ${result.distanceMeters.toFixed(1)} m from the church center.` : ""}</p> : null}
    </div>
  );
}
