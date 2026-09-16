import Link from "next/link";

export const scannedPdfSearchCluster = [
  {
    href: "/clean-scanned-pdf",
    title: "Clean scanned PDF",
    description: "Diagnose several scan problems and fix the ones that apply in one workflow.",
  },
  {
    href: "/make-pdf-searchable",
    title: "Make PDF searchable",
    description: "Use OCR on supported image-only pages so text can be searched and selected.",
  },
  {
    href: "/straighten-pdf",
    title: "Straighten PDF",
    description: "Detect crooked scanned pages and apply conservative deskewing where it is safe.",
  },
  {
    href: "/remove-blank-pages",
    title: "Remove blank pages",
    description: "Find likely scanner blanks, review them, and remove only the pages you approve.",
  },
  {
    href: "/compress-scanned-pdf",
    title: "Compress scanned PDF",
    description: "Reduce unnecessary scan weight while protecting ordinary document readability.",
  },
  {
    href: "/improve-scanned-pdf",
    title: "Improve scanned PDF",
    description: "Apply conservative readability cleanup to supported scan pages that need it.",
  },
] as const;

export function SeoClusterLinks({ currentPath }: { currentPath: string }) {
  const links = scannedPdfSearchCluster.filter((item) => item.href !== currentPath);

  return (
    <section className="border-y border-slate-200/80 bg-white/70" aria-labelledby="related-pdf-fixes-heading">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Related scanned PDF fixes</p>
          <h2 id="related-pdf-fixes-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            Different symptom, same PDFBright cleanup engine.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            These pages explain distinct problems people run into with scanned PDFs. They all lead into the same diagnose-first workflow rather than a maze of disconnected tools.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <h3 className="font-semibold tracking-tight text-slate-950 group-hover:text-indigo-700">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-4 inline-flex text-sm font-bold text-indigo-700">Open guide →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
