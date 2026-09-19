import { RequestVerificationForm } from "./request-form";

export const metadata = {
  title: "Request verification email",
  description: "Request a new Arrows account verification email.",
};

export default function RequestVerificationPage() {
  return (
    <main className="grid min-h-screen place-items-centerbg-[radial-gradient(circle_at_top_left,#eadcff,transparent_36%),linear-gradient(135deg,#f8fafc,#f7f2ff)] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl shadow-[#240046]/10 sm:p-12">
        <RequestVerificationForm />
      </section>
    </main>
  );
}
