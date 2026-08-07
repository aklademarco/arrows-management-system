import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";
import GeofenceSetup from "./geofence-setup";

export default async function GeofencePage() {
  await getAdminResource<unknown[]>("/departments");

  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <Link className="inline-flex items-center gap-2 font-bold text-violet-400" href="/admin/dashboard">
          <FiArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
        <header className="mb-7 mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">Attendance settings</p>
          <h1 className="mt-2 text-3xl font-bold">Church geofence</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Capture the center of the church compound and confirm that the attendance boundary covers its outer edges.</p>
        </header>
        <GeofenceSetup />
      </div>
    </main>
  );
}
