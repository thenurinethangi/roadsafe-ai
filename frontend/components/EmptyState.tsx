export function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-line bg-cream/60 px-5 py-10">
      <h2 className="font-serif text-2xl text-ink">Choose a safer way there</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
        Enter a journey in Great Britain. We find a few driving routes, look up
        the weather and darkness for that time, then score each stretch with a
        model trained on five years of official collision records.
      </p>
      <ol className="mt-6 grid gap-3 text-sm text-ink/75 sm:grid-cols-3">
        <li className="rounded-xl bg-paper px-4 py-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-moss">1</span>
          Compare safety scores, not only travel time.
        </li>
        <li className="rounded-xl bg-paper px-4 py-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-moss">2</span>
          See higher-risk sections in orange and red.
        </li>
        <li className="rounded-xl bg-paper px-4 py-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-moss">3</span>
          Click a section to read why the model flagged it.
        </li>
      </ol>
    </section>
  );
}
