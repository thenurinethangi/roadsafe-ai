export function Footer() {
  return (
    <footer className="border-t border-line bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs leading-5 text-ink/65 sm:flex-row sm:items-start sm:justify-between">
        <p>
          Contains public sector information licensed under the{" "}
          <a
            className="underline decoration-line underline-offset-2 hover:text-ink"
            href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
            target="_blank"
            rel="noreferrer"
          >
            Open Government Licence v3.0
          </a>
          . Collision data: UK Department for Transport, STATS19.
        </p>
        <p>Routing: OSRM. Weather: Open-Meteo. Academic project — not a satnav.</p>
      </div>
    </footer>
  );
}
