interface PlaceholderPageProps {
  title: string;
  description: string;
  highlights?: string[];
}

export function PlaceholderPage({
  title,
  description,
  highlights = [],
}: PlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-black/20">
        <p className="text-sm font-medium uppercase tracking-wide text-verdiron-accent">
          Placeholder
        </p>
        <h2 className="mt-2 text-display font-semibold text-slate-50">{title}</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          {description}
        </p>
      </div>

      {highlights.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <article
              key={item}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
            >
              <p className="text-sm text-slate-400">Coming soon</p>
              <p className="mt-2 text-lg font-medium text-slate-100">{item}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
