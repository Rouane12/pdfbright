import Link from "next/link";
import { redirect } from "next/navigation";
import { requestMagicLink } from "./actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/account");
  }

  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-[1.05rem] font-bold tracking-[-0.03em]">
            PDFBright
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            Back to PDFBright
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl justify-center px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Your PDFBright account</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">Sign in without a password.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter your email and we&apos;ll send you a secure sign-in link. You never need an account just to clean a PDF.
          </p>

          {params.sent === "1" ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
              Check your inbox for your PDFBright sign-in link.
            </div>
          ) : null}

          {params.error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
              {params.error === "invalid-email"
                ? "Enter a valid email address."
                : "We couldn&apos;t send the sign-in link. Please try again."}
            </div>
          ) : null}

          <form action={requestMagicLink} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-800">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Email me a sign-in link
            </button>
          </form>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            Accounts are for Pro access, billing and usage allowances. Your PDF contents are not stored in your account.
          </p>
        </div>
      </section>
    </main>
  );
}
