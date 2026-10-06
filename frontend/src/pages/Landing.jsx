import { ArrowRight, BadgeCheck, GitCompareArrows, Scale, Sparkles, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { ButtonLink } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Photo } from '../components/ui/Photo.jsx';
import { DESTINATIONS, HERO_PHOTO } from '../lib/destinations.js';

const steps = [
  { title: 'Tell us the trip you want', body: 'Where, when, who, budget and the things you love (or hate).' },
  { title: 'Gemma designs it', body: 'A day-by-day plan with costs that add up and a reason for every stop.' },
  { title: 'Reshape it by talking', body: '"Make it cheaper." "Day 2 is too tiring." It changes only what you ask.' },
];

const pillars = [
  { Icon: GitCompareArrows, title: 'Adapts, never restarts', body: 'Every change is a careful edit to your plan, with what changed highlighted.' },
  { Icon: Wallet, title: 'Budgets that add up', body: 'Gemma plans; our engine does the maths. If it doesn’t fit, we tell you.' },
  { Icon: Scale, title: 'Honest trade-offs', body: 'Asked for the impossible? You get clear options, not a fake plan.' },
  { Icon: Users, title: 'Plans for your people', body: 'Parents joining? Pace, comfort and activities adjust for everyone.' },
  { Icon: BadgeCheck, title: 'Verified vs estimated', body: 'Grounded in real travel data, and clear about what’s an AI estimate.' },
];

function ReshapePreview() {
  return (
    <Card className="relative w-full max-w-md p-5 sm:p-6" aria-label="Example of reshaping a trip">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Example</p>
      <div className="mt-3 rounded-2xl bg-brand-50 p-4">
        <p className="text-sm font-semibold text-brand-900">Mumbai → Manali · 5 days · 2 friends</p>
        <div className="mt-3 flex items-baseline justify-between text-sm">
          <span className="text-muted">Total</span>
          <span>
            <s className="mr-2 text-muted">₹19,600</s>
            <strong className="text-ok">₹14,700</strong>
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" aria-hidden="true">
          <div className="h-full w-[74%] rounded-full bg-brand-500" />
        </div>
      </div>

      <p className="mt-4 rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-sm text-white">
        “Too expensive. Keep the mountains but bring it under ₹15,000.”
      </p>

      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex gap-2">
          <span className="rounded-md bg-sunset-100 px-1.5 text-xs font-bold leading-5 text-sunset-600">CHANGED</span>
          AC train → sleeper, hotel → homestay
        </li>
        <li className="flex gap-2">
          <span className="rounded-md bg-brand-100 px-1.5 text-xs font-bold leading-5 text-brand-700">KEPT</span>
          Solang sunrise shoot, Hampta day hike
        </li>
      </ul>
    </Card>
  );
}

function DestinationGrid() {
  return (
    <section aria-labelledby="destinations" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="destinations" className="text-3xl font-bold">Where to next?</h2>
          <p className="mt-2 text-muted">Destinations with curated cost and route data. Or type anywhere you like.</p>
        </div>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {DESTINATIONS.map((d, i) => (
          <li key={d.id} className={i === 0 ? 'col-span-2 row-span-2' : ''}>
            <Link
              to={`/plan?destination=${encodeURIComponent(`${d.name}, ${d.region}`)}`}
              className="group block h-full overflow-hidden rounded-card shadow-card"
              aria-label={`Plan a trip to ${d.name}`}
            >
              <Photo
                photo={d.photo}
                className={i === 0 ? 'aspect-square h-full' : 'aspect-4/3 h-full'}
                imgClassName="transition-transform duration-500 group-hover:scale-105"
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-4 pb-5 text-white">
                  <p className={i === 0 ? 'font-display text-3xl font-bold' : 'font-display text-xl font-bold'}>{d.name}</p>
                  <p className="text-sm text-white/85">{d.blurb}</p>
                </div>
              </Photo>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <Photo photo={HERO_PHOTO} priority className="absolute inset-0 -z-10" imgClassName="object-[center_60%]">
          <div className="absolute inset-0 bg-linear-to-r from-brand-900/90 via-brand-900/60 to-brand-900/10" aria-hidden="true" />
        </Photo>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="text-white">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold ring-1 ring-white/25 backdrop-blur">
              <Sparkles className="size-4" aria-hidden="true" /> Your AI travel architect
            </p>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] sm:text-6xl">
              Trip plans that <span className="text-sunset-100 italic">adapt</span> like you do.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Tell WanderWise the trip you want. It designs every day, explains its choices, balances your budget, and
              lets you reshape the plan just by saying what changed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/plan" variant="accent" size="lg">
                Plan my trip <ArrowRight className="size-5" aria-hidden="true" />
              </ButtonLink>
              <a href="#destinations" className="inline-flex h-13 items-center rounded-full px-6 font-semibold text-white ring-1 ring-white/40 hover:bg-white/10">
                Explore destinations
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ReshapePreview />
          </div>
        </div>
      </section>

      <DestinationGrid />

      <section aria-labelledby="how" className="border-y border-line/70 bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="how" className="text-3xl font-bold">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 font-display text-lg font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="why" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="why" className="text-3xl font-bold">Not another itinerary generator</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ Icon, title, body }) => (
            <li key={title}>
              <Card className="h-full p-6">
                <Icon className="size-6 text-brand-700" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1 text-muted">{body}</p>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <ButtonLink to="/plan" variant="accent" size="lg">
            Start planning <ArrowRight className="size-5" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
