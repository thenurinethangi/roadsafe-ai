import type { ReactNode } from "react";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
          Methodology
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">About RoadSafe AI</h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          A planning tool that answers “which of these routes is safest right
          now, and why?” using machine learning trained on official UK road
          collision records.
        </p>
      </header>

      <Section title="Data source and licence">
        <p>
          The model is trained on the Department for Transport STATS19
          collisions file — Road Safety Data, last 5 years. That is police-reported
          injury collisions in Great Britain: about half a million records,
          coded rather than written in words.
        </p>
        <p>
          The data is published under the Open Government Licence v3.0. We
          credit DfT in the app footer, this page, and the report. The public
          release contains no personal data.
        </p>
      </Section>

      <Section title="How the system works">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Data preparation: decode STATS19 codes, treat -1 as missing, clean the file.</li>
          <li>Feature engineering: time of day, weekend, weather/road interactions, grid risk.</li>
          <li>Model training and validation: Dummy baseline, Logistic Regression, comparison models.</li>
          <li>Unsupervised clustering: k-Means hotspot zones on the map.</li>
          <li>Trained model saved as a pipeline artifact, loaded once by the prediction service.</li>
          <li>
            At request time: OSRM routes, Open-Meteo weather, shared feature code,
            severity probabilities, then a 0–100 safety score with reasons.
          </li>
        </ol>
      </Section>

      <Section title="What the safety score means">
        <p>
          Higher is safer, on a 0–100 scale. The number is relative: 88 is safer
          than 74 under the same conditions, according to this data and this
          model. It is a length-weighted combination of segment scores. Green,
          orange and red on the map are bands on that same scale.
        </p>
        <p>
          The reasons under a red stretch come from the model’s own coefficients
          — which inputs actually pushed predicted severity up — not a hardcoded
          list of rules.
        </p>
      </Section>

      <Section title="What it does not mean">
        <p>
          A score of 88 does not mean “88% safe” or “a 12% chance of a crash”.
          The dataset only contains collisions. There is no record of the safe
          journeys on the same roads, so we cannot honestly predict likelihood.
          We predict the likely <em>severity</em> if a collision happened in
          those conditions, then turn that into a relative score.
        </p>
        <p>It is not turn-by-turn navigation, and it is not a promise that a road is safe.</p>
      </Section>

      <Section title="Limitations we want you to know">
        <ul className="list-disc space-y-2 pl-5">
          <li>No traffic volume, so a busy road can look worse than a quiet dangerous one.</li>
          <li>Slight injuries are under-reported; fatal collisions are almost always recorded.</li>
          <li>Roads change. A junction rebuilt last year still carries older history.</li>
          <li>k-Means draws round zones on long, thin roads. DBSCAN would fit the shape better.</li>
          <li>We sample a point every few kilometres, so a short nasty junction can be missed.</li>
          <li>Weather forecasts can be wrong. If the weather API is down, we still return routes.</li>
          <li>Only Great Britain. The method could transfer, but it would need that country’s data.</li>
        </ul>
      </Section>

      <DisclaimerBanner />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 text-sm leading-6 text-ink/75">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {children}
    </section>
  );
}
