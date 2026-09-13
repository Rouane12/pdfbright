import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, created_at")
    .eq("user_id", claims.sub)
    .maybeSingle();

  const plan = profile?.plan === "pro" ? "Pro" : "Free";
  const email = typeof claims.email === "string" ? claims.email : "Signed-in account";

  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-[1.05rem] font-bold tracking-[-0.03em]">
            PDFBright
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            Clean a PDF
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Account</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Your PDFBright account.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Your account controls plan access and billing. PDF contents and filenames are not part of your account history.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Signed in as</p>
            <p className="mt-3 break-all text-base font-semibold text-slate-950">{email}</p>
          </article>

          <article className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Current plan</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{plan}</p>
              </div>
              <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                {plan}
              </span>
            </div>
            {plan === "Free" ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Pro checkout is the next part of Milestone 9. Your free PDF workflow remains available without signing in.
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">Your Pro entitlement is active.</p>
            )}
          </article>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            View plans
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 sm:w-auto"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
