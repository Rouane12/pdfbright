import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] px-5 py-20 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-7 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Sign-in issue</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">That sign-in link didn&apos;t work.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The link may have expired or already been used. Request a fresh one and try again.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Request a new link
        </Link>
      </div>
    </main>
  );
}
