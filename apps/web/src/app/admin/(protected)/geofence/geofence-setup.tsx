"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { FiCrosshair, FiRefreshCw } from "react-icons/fi";
import {
  distanceInMeters,
  isWithinGeofence,
  type Coordinates,
} from "../../../../lib/geofence";

const GeofenceMap = dynamic(() => import("./geofence-map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Loading map...</div>,
});

type LocationReading = Coordinates & {
  accuracyMeters: number;
  capturedAt: number;
};

const MAXIMUM_ACCURACY_METERS = 50;
const CHURCH_COMPOUND_CENTER: Coordinates = {
  latitude: 5.576584,
  longitude: -0.23444,
};

function locationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return "Location permission was denied. Allow precise location and try again.";
  if (error.code === error.POSITION_UNAVAILABLE) return "Your device could not determine its location. Move outdoors and try again.";
  return "The location request timed out. Keep location enabled and try again.";
}

export default function GeofenceSetup() {
  const [readings, setReadings] = useState<LocationReading[]>([]);
  const [center, setCenter] = useState<Coordinates>(CHURCH_COMPOUND_CENTER);
  const [mapMode, setMapMode] = useState<"center" | "test">("center");
  const [testPoint, setTestPoint] = useState<Coordinates | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(50);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isWatching) return;

    const captureTimeout = window.setTimeout(() => {
      setIsWatching(false);
    }, 30000);
    const watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        setReadings((current) => [
          ...current,
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracyMeters: coords.accuracy,
            capturedAt: timestamp,
          },
        ].slice(-12));
        setError(null);
        if (coords.accuracy <= MAXIMUM_ACCURACY_METERS) {
          setIsWatching(false);
        }
      },
      (locationError) => {
        setError(locationErrorMessage(locationError));
        setIsWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );

    return () => {
      window.clearTimeout(captureTimeout);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isWatching]);

  const bestReading = useMemo(
    () => readings.reduce<LocationReading | null>(
      (best, reading) => !best || reading.accuracyMeters < best.accuracyMeters ? reading : best,
      null,
    ),
    [readings],
  );
  const distanceFromCenter = bestReading
    ? distanceInMeters(bestReading, center)
    : null;
  const testDistance = testPoint
    ? distanceInMeters(testPoint, center)
    : null;
  const testIsInside = testPoint
    ? isWithinGeofence(testPoint, center, radiusMeters)
    : null;

  function handleMapClick(coordinates: Coordinates) {
    if (mapMode === "center") {
      setCenter(coordinates);
      setTestPoint(null);
      return;
    }
    setTestPoint(coordinates);
  }

  function startCapture() {
    if (!("geolocation" in navigator)) {
      setError("This browser does not support location capture.");
      return;
    }
    setReadings([]);
    setError(null);
    setIsWatching(true);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-[min(62vh,42rem)] min-h-[28rem] bg-slate-100">
          <GeofenceMap
            center={center}
            onMapClick={handleMapClick}
            radiusMeters={radiusMeters}
            reading={bestReading}
            testPoint={testPoint}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
          <span className="flex items-center gap-2"><span className="size-3 border-2 border-green-700 bg-green-100" />Draft center and boundary</span>
          <span className="flex items-center gap-2"><span className="size-3 border-2 border-sky-700 bg-sky-100" />Live reading and GPS accuracy</span>
          <span>{mapMode === "center" ? "Click the map to move the draft center" : "Click the map to test a location"}</span>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Location reading</h2>
              <p className="mt-1 text-sm text-slate-600">Best of {readings.length} captured reading{readings.length === 1 ? "" : "s"}</p>
            </div>
            <span className={`mt-1 size-3 rounded-full ${isWatching ? "animate-pulse bg-green-500" : "bg-slate-300"}`} aria-label={isWatching ? "Capture active" : "Capture stopped"} />
          </div>

          {bestReading ? (
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Latitude</dt><dd className="mt-1 font-mono font-bold">{bestReading.latitude.toFixed(7)}</dd></div>
              <div><dt className="text-slate-500">Longitude</dt><dd className="mt-1 font-mono font-bold">{bestReading.longitude.toFixed(7)}</dd></div>
              <div><dt className="text-slate-500">Accuracy</dt><dd className={`mt-1 font-bold ${bestReading.accuracyMeters <= MAXIMUM_ACCURACY_METERS ? "text-green-700" : "text-amber-700"}`}>{bestReading.accuracyMeters.toFixed(1)} m</dd></div>
              <div><dt className="text-slate-500">Captured</dt><dd className="mt-1 font-bold">{new Date(bestReading.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Distance from draft center</dt><dd className="mt-1 font-bold">{distanceFromCenter?.toFixed(1)} m</dd></div>
            </dl>
          ) : (
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Latitude</dt><dd className="mt-1 font-mono font-bold">{center.latitude.toFixed(6)}</dd></div>
              <div><dt className="text-slate-500">Longitude</dt><dd className="mt-1 font-mono font-bold">{center.longitude.toFixed(6)}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Source</dt><dd className="mt-1 font-bold">Map-selected compound center</dd></div>
            </dl>
          )}

          {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
          {bestReading && bestReading.accuracyMeters > MAXIMUM_ACCURACY_METERS ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{bestReading.accuracyMeters > 1000 ? "This computer is using an approximate network location. Place the center by clicking the map or capture from a GPS-enabled phone." : "Accuracy is above the 50 m acceptance limit. Move outdoors or place the center by clicking the map."}</p> : null}

          <button
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#240046] px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isWatching}
            onClick={startCapture}
            type="button"
          >
            {readings.length > 0 ? <FiRefreshCw aria-hidden="true" /> : <FiCrosshair aria-hidden="true" />}
            {isWatching ? "Capturing for up to 30 seconds..." : readings.length > 0 ? "Capture again" : "Start location capture"}
          </button>
          {isWatching ? <button className="mt-2 h-10 w-full font-bold text-slate-700" onClick={() => setIsWatching(false)} type="button">Stop capture</button> : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Map interaction</h2>
          <div className="mt-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            <button
              className={`h-9 rounded-md text-sm font-bold ${mapMode === "center" ? "bg-white text-[#240046] shadow-sm" : "text-slate-600"}`}
              onClick={() => setMapMode("center")}
              type="button"
            >
              Set center
            </button>
            <button
              className={`h-9 rounded-md text-sm font-bold ${mapMode === "test" ? "bg-white text-[#240046] shadow-sm" : "text-slate-600"}`}
              onClick={() => setMapMode("test")}
              type="button"
            >
              Test boundary
            </button>
          </div>
          {testPoint && testDistance !== null ? (
            <div className={`mt-4 rounded-md p-3 text-sm ${testIsInside ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`} role="status">
              <p className="font-bold">{testIsInside ? "Inside attendance area" : "Outside attendance area"}</p>
              <p className="mt-1">{testDistance.toFixed(1)} m from the center</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-4">
            <label className="font-bold" htmlFor="radius">Compound radius</label>
            <output className="font-mono text-lg font-bold text-[#6b21a8]" htmlFor="radius">{radiusMeters} m</output>
          </div>
          <input
            className="mt-4 w-full accent-[#6b21a8]"
            id="radius"
            max="300"
            min="25"
            onChange={(event) => setRadiusMeters(Number(event.target.value))}
            step="5"
            type="range"
            value={radiusMeters}
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500"><span>25 m</span><span>300 m</span></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
            <div><dt className="text-slate-500">Center latitude</dt><dd className="mt-1 font-mono font-bold text-slate-900">{center.latitude.toFixed(7)}</dd></div>
            <div><dt className="text-slate-500">Center longitude</dt><dd className="mt-1 font-mono font-bold text-slate-900">{center.longitude.toFixed(7)}</dd></div>
          </dl>
          <button
            className="mt-4 h-10 w-full rounded-lg border border-slate-300 font-bold text-slate-700"
            onClick={() => setCenter(CHURCH_COMPOUND_CENTER)}
            type="button"
          >
            Reset center
          </button>
        </section>
      </aside>
    </div>
  );
}
