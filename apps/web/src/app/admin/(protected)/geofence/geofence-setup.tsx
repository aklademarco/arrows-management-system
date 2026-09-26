"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiCrosshair,
  FiLoader,
  FiMapPin,
  FiRefreshCw,
} from "react-icons/fi";

import {
  distanceInMeters,
  isWithinGeofence,
  type Coordinates,
} from "../../../../lib/geofence";

import type { GeofenceSettings } from "./page";
import { saveGeofence, type GeofenceSaveState } from "./actions";

const GeofenceMap = dynamic(() => import("./geofence-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-slate-400">
      Loading map...
    </div>
  ),
});

type LocationReading = Coordinates & {
  accuracyMeters: number;
  capturedAt: number;
};

const MAXIMUM_ACCURACY_METERS = 50;

const initialSaveState: GeofenceSaveState = {
  status: "idle",
  message: "",
};

function locationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Allow precise location and try again.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your device could not determine its location. Move outdoors and try again.";
  }

  return "The location request timed out. Keep location enabled and try again.";
}

export default function GeofenceSetup({
  initialSettings,
}: {
  initialSettings: GeofenceSettings;
}) {
  const [saveState, saveAction, saving] = useActionState(
    saveGeofence,
    initialSaveState,
  );

  const [readings, setReadings] = useState<LocationReading[]>([]);

  const [center, setCenter] = useState<Coordinates | null>(() => {
    if (
      initialSettings.latitude === null ||
      initialSettings.longitude === null
    ) {
      return null;
    }

    return {
      latitude: initialSettings.latitude,
      longitude: initialSettings.longitude,
    };
  });

  const [mapMode, setMapMode] = useState<"center" | "test">("center");

  const [testPoint, setTestPoint] = useState<Coordinates | null>(null);

  const [radiusMeters, setRadiusMeters] = useState(
    initialSettings.geofenceRadiusMeters,
  );

  const [isWatching, setIsWatching] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isWatching) return;

    const captureTimeout = window.setTimeout(() => {
      setIsWatching(false);
    }, 30000);

    const watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const reading: LocationReading = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
          capturedAt: timestamp,
        };

        setReadings((current) => [...current, reading].slice(-12));

        /*
         * On a brand-new installation there is no
         * saved church center yet.
         *
         * The first GPS reading gives the map a
         * starting position automatically.
         */
        setCenter(
          (current) =>
            current ?? {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
        );

        setError(null);

        if (coords.accuracy <= MAXIMUM_ACCURACY_METERS) {
          setIsWatching(false);
        }
      },
      (locationError) => {
        setError(locationErrorMessage(locationError));
        setIsWatching(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,
      },
    );

    return () => {
      window.clearTimeout(captureTimeout);

      navigator.geolocation.clearWatch(watchId);
    };
  }, [isWatching]);

  const bestReading = useMemo(
    () =>
      readings.reduce<LocationReading | null>(
        (best, reading) =>
          !best || reading.accuracyMeters < best.accuracyMeters
            ? reading
            : best,
        null,
      ),
    [readings],
  );

  const distanceFromCenter =
    bestReading && center ? distanceInMeters(bestReading, center) : null;

  const testDistance =
    testPoint && center ? distanceInMeters(testPoint, center) : null;

  const testIsInside =
    testPoint && center
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
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#111318] shadow-sm">
        <div className="h-[min(62vh,42rem)] min-h-[28rem] bg-white/[0.07]">
          {center ? (
            <GeofenceMap
              center={center}
              onMapClick={handleMapClick}
              radiusMeters={radiusMeters}
              reading={bestReading}
              testPoint={testPoint}
            />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-violet-500/10 text-2xl text-violet-400">
                  <FiMapPin />
                </span>

                <h2 className="mt-5 text-xl font-bold">
                  Set the church location
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  No church geofence has been configured yet. Capture your
                  current location to position the map.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 px-4 py-3 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="size-3 border-2 border-green-700 bg-green-100" />
            Church center and boundary
          </span>

          <span className="flex items-center gap-2">
            <span className="size-3 border-2 border-sky-700 bg-sky-100" />
            Live GPS reading
          </span>

          {center ? (
            <span>
              {mapMode === "center"
                ? "Click the map to move the church center"
                : "Click the map to test a location"}
            </span>
          ) : (
            <span>Capture a location to initialise the map</span>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        {!initialSettings.configured && (
          <section className="rounded-lg border border-violet-400/20 bg-violet-500/10 p-4">
            <p className="font-bold text-violet-300">First-time setup</p>

            <p className="mt-1 text-sm leading-6 text-slate-300">
              Capture the church location and save it before members use
              geofence attendance.
            </p>
          </section>
        )}

        <section className="rounded-lg border border-white/10 bg-[#111318] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Location reading</h2>

              <p className="mt-1 text-sm text-slate-400">
                Best of {readings.length} captured reading
                {readings.length === 1 ? "" : "s"}
              </p>
            </div>

            <span
              aria-label={isWatching ? "Capture active" : "Capture stopped"}
              className={`mt-1 size-3 rounded-full ${
                isWatching ? "animate-pulse bg-green-500" : "bg-slate-500"
              }`}
            />
          </div>

          {bestReading ? (
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-400">Latitude</dt>

                <dd className="mt-1 font-mono font-bold">
                  {bestReading.latitude.toFixed(7)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400">Longitude</dt>

                <dd className="mt-1 font-mono font-bold">
                  {bestReading.longitude.toFixed(7)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400">Accuracy</dt>

                <dd
                  className={`mt-1 font-bold ${
                    bestReading.accuracyMeters <= MAXIMUM_ACCURACY_METERS
                      ? "text-green-400"
                      : "text-amber-400"
                  }`}
                >
                  {bestReading.accuracyMeters.toFixed(1)} m
                </dd>
              </div>

              <div>
                <dt className="text-slate-400">Captured</dt>

                <dd className="mt-1 font-bold">
                  {new Date(bestReading.capturedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </dd>
              </div>

              {distanceFromCenter !== null && (
                <div className="col-span-2">
                  <dt className="text-slate-400">
                    Distance from church center
                  </dt>

                  <dd className="mt-1 font-bold">
                    {distanceFromCenter.toFixed(1)} m
                  </dd>
                </div>
              )}
            </dl>
          ) : center ? (
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-400">Latitude</dt>

                <dd className="mt-1 font-mono font-bold">
                  {center.latitude.toFixed(6)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400">Longitude</dt>

                <dd className="mt-1 font-mono font-bold">
                  {center.longitude.toFixed(6)}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-slate-400">Source</dt>

                <dd className="mt-1 font-bold">Saved church center</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-400">
              No location has been captured yet.
            </p>
          )}

          {error && (
            <p
              className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}

          {bestReading &&
            bestReading.accuracyMeters > MAXIMUM_ACCURACY_METERS && (
              <p className="mt-4 rounded-md bg-amber-500/10 p-3 text-sm text-amber-300">
                {bestReading.accuracyMeters > 1000
                  ? "This device is using an approximate network location. Capture from a GPS-enabled phone or select the center on the map."
                  : "Accuracy is above the 50 m acceptance limit. Move outdoors and capture again."}
              </p>
            )}

          <button
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={isWatching}
            onClick={startCapture}
            type="button"
          >
            {readings.length > 0 ? <FiRefreshCw /> : <FiCrosshair />}

            {isWatching
              ? "Capturing for up to 30 seconds..."
              : readings.length > 0
                ? "Capture again"
                : "Start location capture"}
          </button>

          {bestReading && (
            <button
              className="mt-2 h-11 w-full rounded-lg border border-violet-400/40 font-bold text-violet-300"
              onClick={() =>
                setCenter({
                  latitude: bestReading.latitude,
                  longitude: bestReading.longitude,
                })
              }
              type="button"
            >
              Use this reading as church center
            </button>
          )}

          {isWatching && (
            <button
              className="mt-2 h-10 w-full font-bold text-slate-300"
              onClick={() => setIsWatching(false)}
              type="button"
            >
              Stop capture
            </button>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-[#111318] p-5 shadow-sm">
          <h2 className="font-bold">Map interaction</h2>

          <div className="mt-3 grid grid-cols-2 rounded-lg bg-white/[0.07] p-1">
            <button
              className={`h-9 rounded-md text-sm font-bold ${
                mapMode === "center"
                  ? "bg-[#111318] text-violet-300 shadow-sm"
                  : "text-slate-400"
              }`}
              disabled={!center}
              onClick={() => setMapMode("center")}
              type="button"
            >
              Set center
            </button>

            <button
              className={`h-9 rounded-md text-sm font-bold ${
                mapMode === "test"
                  ? "bg-[#111318] text-violet-300 shadow-sm"
                  : "text-slate-400"
              }`}
              disabled={!center}
              onClick={() => setMapMode("test")}
              type="button"
            >
              Test boundary
            </button>
          </div>

          {testPoint && testDistance !== null ? (
            <div
              className={`mt-4 rounded-md p-3 text-sm ${
                testIsInside
                  ? "bg-green-500/10 text-green-300"
                  : "bg-red-500/10 text-red-300"
              }`}
              role="status"
            >
              <p className="font-bold">
                {testIsInside
                  ? "Inside attendance area"
                  : "Outside attendance area"}
              </p>

              <p className="mt-1">
                {testDistance.toFixed(1)} m from the center
              </p>
            </div>
          ) : null}
        </section>

        <form
          action={saveAction}
          className="rounded-lg border border-white/10 bg-[#111318] p-5 shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-4">
            <label className="font-bold" htmlFor="radius">
              Compound radius
            </label>

            <output
              className="font-mono text-lg font-bold text-violet-400"
              htmlFor="radius"
            >
              {radiusMeters} m
            </output>
          </div>

          <input
            className="mt-4 w-full accent-violet-500"
            id="radius"
            max="300"
            min="25"
            onChange={(event) => setRadiusMeters(Number(event.target.value))}
            step="5"
            type="range"
            value={radiusMeters}
          />

          {center && (
            <>
              <input name="latitude" type="hidden" value={center.latitude} />

              <input name="longitude" type="hidden" value={center.longitude} />
            </>
          )}

          <input
            name="geofenceRadiusMeters"
            type="hidden"
            value={radiusMeters}
          />

          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>25 m</span>
            <span>300 m</span>
          </div>

          {center && (
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4 text-xs">
              <div>
                <dt className="text-slate-400">Center latitude</dt>

                <dd className="mt-1 font-mono font-bold text-slate-200">
                  {center.latitude.toFixed(7)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400">Center longitude</dt>

                <dd className="mt-1 font-mono font-bold text-slate-200">
                  {center.longitude.toFixed(7)}
                </dd>
              </div>
            </dl>
          )}

          <label className="mt-4 grid gap-1 text-sm font-bold">
            Location name
            <input
              className="h-10 rounded-lg border border-white/15 bg-transparent px-3 font-normal"
              defaultValue={initialSettings.locationName}
              name="locationName"
              placeholder="Church auditorium"
            />
          </label>

          <label className="mt-3 grid gap-1 text-sm font-bold">
            Maximum GPS error
            <div className="flex items-center gap-2">
              <input
                className="h-10 min-w-0 flex-1 rounded-lg border border-white/15 bg-transparent px-3 font-normal"
                defaultValue={initialSettings.maximumAccuracyMeters}
                max="1000"
                min="1"
                name="maximumAccuracyMeters"
                type="number"
              />

              <span className="text-sm text-slate-400">metres</span>
            </div>
          </label>

          <button
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            disabled={saving || !center}
            type="submit"
          >
            {saving ? (
              <FiLoader className="animate-spin" aria-hidden="true" />
            ) : (
              <FiCheckCircle aria-hidden="true" />
            )}

            {saving ? "Saving church location…" : "Save church location"}
          </button>

          {!center && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Capture the church location before saving.
            </p>
          )}

          {saveState.status !== "idle" && (
            <p
              aria-live="polite"
              className={`mt-3 rounded-lg p-3 text-sm font-semibold ${
                saveState.status === "success"
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-red-400/10 text-red-300"
              }`}
              role={saveState.status === "error" ? "alert" : "status"}
            >
              {saveState.message}
            </p>
          )}
        </form>
      </aside>
    </div>
  );
}
