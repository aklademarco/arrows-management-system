import { StatusForm } from "./status-form";

export default function AccountStatusPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#f3e8ff,#f8f7fb_48%)] px-5 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-purple-100 bg-white p-7 shadow-[0_24px_70px_rgba(76,22,119,0.12)] sm:p-10">
        <StatusForm />
      </section>
    </main>
  );
}
