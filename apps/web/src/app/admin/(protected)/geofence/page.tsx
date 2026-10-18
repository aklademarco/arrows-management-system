import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";
import GeofenceSetup from "./geofence-setup";

export type GeofenceSettings = {
  configured: boolean;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusMeters: number;
  maximumAccuracyMeters: number;
};

export default async function GeofencePage() {
  const settings = await getAdminResource<GeofenceSettings>(
    "/events/geofence-settings",
  );

  return (
    <main className="min-h-screen bg-[#e9edee] px-5 py-8 text-[#252b2d]">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-[#527193]"
          href="/admin/dashboard"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
        <header className="mb-7 mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#527193]">
            Attendance settings
          </p>
          <h1 className="mt-2 text-3xl font-bold">Church geofence</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Capture the center of the church compound and confirm that the
            attendance boundary covers its outer edges.
          </p>
        </header>
        <GeofenceSetup initialSettings={settings} />
      </div>
    </main>
  );
}
