import { VerificationForm } from "./verification-form";

export const metadata = {
  title: "Verify email",
  description: "Verify your Arrows member account email address.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const value = (await searchParams).token;
  const token = typeof value === "string" ? value : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,_#eadcff,_transparent_36%),linear-gradient(135deg,#f8fafc,#f7f2ff)] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl shadow-[#240046]/10 sm:p-12">
        <VerificationForm token={token} />
      </section>
    </main>
  );
}
