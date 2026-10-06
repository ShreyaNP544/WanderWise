import { useState } from 'react';
import { ArrowRight, BadgeCheck, CloudSun, GitCompareArrows, MapPin, Scale, Sparkles, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { DemoTripButton } from '../components/DemoTripButton.jsx';
import { formatINR } from '../lib/format.js';
import { getRecentTrips } from '../lib/recentTrips.js';
import { usePlacePhoto } from '../hooks/usePlacePhoto.js';
import { ButtonLink } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Photo } from '../components/ui/Photo.jsx';
import { cn } from '../lib/cn.js';
import { DESTINATIONS, HERO_PHOTO, MOMENTS, THEME_PHOTOS, photoFor } from '../lib/destinations.js';

const byId = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]));
const planLink = (d) => `/plan?destination=${encodeURIComponent(`${d.name}, ${d.region}`)}`;

const VIBES = [
  { emoji: '🏔️', title: 'Into the mountains', dest: byId.manali, tint: 'from-sky-900/80' },
  { emoji: '🍛', title: 'Food trails', dest: byId.jaipur, photo: THEME_PHOTOS.food, tint: 'from-amber-900/80' },
  { emoji: '🪂', title: 'Thrills & adventure', dest: byId.rishikesh, photo: THEME_PHOTOS.adventure, tint: 'from-sky-900/80' },
  { emoji: '🪔', title: 'Ghats & rituals', dest: byId.varanasi, photo: THEME_PHOTOS.spiritual, tint: 'from-orange-900/80' },
  { emoji: '🏰', title: 'Desert forts', dest: byId.jaisalmer, tint: 'from-rose-900/80' },
];

const steps = [
  { emoji: '✍️', title: 'Tell us the trip you want', body: 'Where, when, who, budget, and the things you love (or hate).' },
  { emoji: '🧭', title: 'Gemma designs it', body: 'Real places, live weather, and a day-by-day plan whose costs actually add up.' },
  { emoji: '🪄', title: 'Reshape it by talking', body: '“Make it cheaper.” “Day 2 is too tiring.” It changes only what you ask.' },
];

const pillars = [
  { Icon: GitCompareArrows, title: 'Adapts, never restarts', body: 'Every change is a careful edit to your plan, with what changed highlighted.', tone: 'bg-brand-50 text-brand-700' },
  { Icon: Wallet, title: 'Budgets that add up', body: 'Gemma plans; our engine does the maths. If it doesn’t fit, we tell you.', tone: 'bg-sunset-100 text-sunset-600' },
  { Icon: Scale, title: 'Honest trade-offs', body: 'Asked for the impossible? You get clear options, not a fake plan.', tone: 'bg-amber-50 text-amber-700' },
  { Icon: Users, title: 'Plans for your people', body: 'Parents joining? Pace, comfort and activities adjust for everyone.', tone: 'bg-violet-50 text-violet-700' },
  { Icon: BadgeCheck, title: 'Real places, real weather', body: 'Grounded in Wikipedia and live forecasts, and clear about what’s an AI estimate.', tone: 'bg-sky-50 text-sky-700' },
];

function Polaroid({ photo, caption, className, tilt }) {
  return (
    <div className={cn('animate-float rounded-xl bg-white p-2 pb-8 shadow-2xl', className)} style={{ '--tilt': tilt, transform: `rotate(${tilt})` }}>
      <Photo photo={photo} showCredit={false} className="aspect-4/3 w-full rounded-md" />
      <p className="absolute inset-x-0 bottom-2 text-center font-display text-sm font-bold text-ink">{caption}</p>
    </div>
  );
}

function Hero() {
  return (
    <section className="px-3 pt-4 sm:px-6 sm:pt-6">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-4xl shadow-2xl">
        <Photo photo={HERO_PHOTO} priority className="absolute inset-0 -z-10" imgClassName="object-[center_35%]">
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/5" aria-hidden="true" />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" aria-hidden="true" />
        </Photo>

        <div className="grid items-center gap-10 px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div className="text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.35)]">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold ring-1 ring-white/30 backdrop-blur text-shadow-none">
              <Sparkles className="size-4" aria-hidden="true" /> Your AI travel architect
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-6xl">
              Trip plans that <span className="italic text-sunset-100">adapt</span> like you do.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              Tell WanderWise the trip you want. It designs every day, explains its choices, balances your budget, and
              lets you reshape the plan just by saying what changed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-shadow-none">
              <ButtonLink to="/plan" variant="accent" size="lg">
                Plan my trip <ArrowRight className="size-5" aria-hidden="true" />
              </ButtonLink>
              <DemoTripButton className="inline-flex h-13 rounded-full bg-white/15 px-6 font-semibold text-white ring-1 ring-white/40 backdrop-blur hover:bg-white/25" />
            </div>
            <ul className="mt-8 flex flex-wrap gap-2 text-sm font-semibold text-shadow-none">
              {['🗺️ Real places', '🌦️ Live weather', '💸 Budgets that add up', '🤖 Powered by Gemma'].map((t) => (
                <li key={t} className="rounded-full bg-black/30 px-3 py-1 text-white ring-1 ring-white/20 backdrop-blur">{t}</li>
              ))}
            </ul>
          </div>

          <div className="relative hidden h-90 lg:block" aria-hidden="true">
            <Polaroid photo={byId.udaipur.photo} caption="Udaipur 🏰" tilt="-8deg" className="absolute left-0 top-6 w-56" />
            <Polaroid photo={THEME_PHOTOS.food} caption="Thali time 🍛" tilt="6deg" className="absolute right-4 top-0 w-60 [animation-delay:-2s]" />
            <Polaroid photo={byId.hampi.photo} caption="Hampi 🌅" tilt="-3deg" className="absolute bottom-0 left-24 w-64 [animation-delay:-4s]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TripThumb({ destination }) {
  const live = usePlacePhoto(destination);
  return <Photo photo={photoFor(destination, live)} showCredit={false} className="size-16 shrink-0 rounded-xl" />;
}

function ContinuePlanning() {
  const [trips] = useState(getRecentTrips);
  if (!trips.length) return null;
  return (
    <section aria-labelledby="continue-title" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <h2 id="continue-title" className="text-2xl font-bold">Continue planning</h2>
      <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {trips.map((t) => (
          <li key={t.id} className="shrink-0">
            <Link to={`/trip/${t.id}`} className="flex w-72 items-center gap-3 rounded-2xl bg-surface p-3 shadow-card ring-1 ring-line/70 transition hover:-translate-y-0.5 hover:ring-brand-500">
              <TripThumb destination={t.destination} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{t.title}</p>
                <p className="text-sm text-muted">
                  {t.days} days · {formatINR(t.total)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PhotoMarquee() {
  const photos = MOMENTS.map((m, i) => ({ photo: m.photo, name: m.label, id: `m${i}` }));
  const loop = [...photos, ...photos];
  return (
    <section aria-label="Destination photos" className="overflow-hidden py-10">
      <ul className="animate-marquee flex w-max gap-4">
        {loop.map((p, i) => (
          <li key={`${p.id}-${i}`} className={cn('shrink-0', i % 2 ? 'rotate-2' : '-rotate-2')} aria-hidden={i >= photos.length || undefined}>
            <Photo photo={p.photo} showCredit={false} className="h-40 w-60 rounded-2xl shadow-card sm:h-48 sm:w-72">
              <span className="absolute bottom-2 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-ink">
                <MapPin className="mr-1 inline size-3" aria-hidden="true" />
                {p.name}
              </span>
            </Photo>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Vibes() {
  return (
    <section id="vibes" aria-labelledby="vibes-title" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-6 sm:px-6">
      <h2 id="vibes-title" className="text-3xl font-bold sm:text-4xl">What’s your vibe? ✨</h2>
      <p className="mt-2 text-muted">Pick a mood and we’ll start the plan for you.</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        {VIBES.map((v, i) => (
          <li key={v.title} className={i === 0 ? 'col-span-2 md:col-span-1' : ''}>
            <Link to={planLink(v.dest)} className="group block overflow-hidden rounded-3xl shadow-card transition hover:-translate-y-1 hover:rotate-1 hover:shadow-xl">
              <Photo photo={v.photo || v.dest.photo} creditLink={false} className="aspect-3/4 max-h-80 w-full" imgClassName="transition-transform duration-500 group-hover:scale-110">
                <div className={cn('absolute inset-0 bg-linear-to-t via-black/10 to-transparent', v.tint)} aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-4 pb-5 text-white">
                  <span className="text-3xl" aria-hidden="true">{v.emoji}</span>
                  <p className="mt-1 font-display text-xl font-bold leading-tight">{v.title}</p>
                  <p className="text-sm text-white/85">{v.dest.name}</p>
                </div>
              </Photo>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReshapePreview() {
  return (
    <Card className="relative w-full max-w-md -rotate-1 p-5 sm:p-6" aria-label="Example of reshaping a trip">
      <span className="absolute -right-3 -top-3 rotate-6 rounded-full bg-sunset-500 px-3 py-1 text-xs font-bold text-white shadow-lg">Live edit ✨</span>
      <div className="flex items-center gap-3">
        <Photo photo={byId.manali.photo} showCredit={false} className="size-14 shrink-0 rounded-xl" />
        <div>
          <p className="text-sm font-semibold text-brand-900">Delhi → Manali · 4 days · 2 friends</p>
          <p className="text-sm">
            <s className="mr-2 text-muted">₹19,600</s>
            <strong className="text-ok">₹15,700</strong>
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper" aria-hidden="true">
        <div className="h-full w-[78%] rounded-full bg-linear-to-r from-brand-500 to-sunset-500" />
      </div>
      <p className="mt-4 rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-sm text-white">
        “Too expensive. Keep the mountains but bring it under ₹16,000.”
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex gap-2">
          <span className="rounded-md bg-sunset-100 px-1.5 text-xs font-bold leading-5 text-sunset-600">CHANGED</span>
          Volvo → state bus, hotel → homestay
        </li>
        <li className="flex gap-2">
          <span className="rounded-md bg-brand-100 px-1.5 text-xs font-bold leading-5 text-brand-700">KEPT</span>
          Sissu sunrise shoot, Jogini Falls hike
        </li>
      </ul>
    </Card>
  );
}

function HowItWorks() {
  return (
    <section aria-labelledby="how" className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
      <div className="grid items-center gap-10 overflow-hidden rounded-4xl bg-brand-900 px-6 py-12 text-white sm:px-12 lg:grid-cols-[1fr_auto]">
        <div>
          <h2 id="how" className="text-3xl font-bold sm:text-4xl">How it works</h2>
          <ol className="mt-8 grid gap-6">
            {steps.map((step) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl" aria-hidden="true">{step.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-white/75">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex justify-center text-ink">
          <ReshapePreview />
        </div>
      </div>
    </section>
  );
}

function DestinationGrid() {
  return (
    <section id="destinations" aria-labelledby="destinations-title" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
      <h2 id="destinations-title" className="text-3xl font-bold sm:text-4xl">Where to next? 🧳</h2>
      <p className="mt-2 text-muted">Destinations with curated prices and routes. Or type anywhere in India.</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {DESTINATIONS.map((d) => (
          <li key={d.id}>
            <Link to={planLink(d)} className="group block overflow-hidden rounded-3xl shadow-card transition hover:-translate-y-1 hover:shadow-xl" aria-label={`Plan a trip to ${d.name}`}>
              <Photo photo={d.photo} creditLink={false} className="aspect-4/3" imgClassName="transition-transform duration-500 group-hover:scale-110">
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/5 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-4 pb-5 text-white">
                  <p className="font-display text-xl font-bold">{d.name}</p>
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

function Pillars() {
  return (
    <section aria-labelledby="why" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <h2 id="why" className="text-3xl font-bold sm:text-4xl">Not another itinerary generator</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {pillars.map(({ Icon, title, body, tone }) => (
          <li key={title}>
            <Card className="h-full p-6 transition hover:-translate-y-1">
              <span className={cn('grid size-11 place-items-center rounded-2xl', tone)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold leading-snug">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </Card>
          </li>
        ))}
      </ul>
      <div className="relative mt-14 overflow-hidden rounded-4xl shadow-xl">
        <Photo photo={byId.goa.photo} className="h-64 sm:h-72">
          <div className="absolute inset-0 bg-linear-to-r from-black/70 to-black/10" aria-hidden="true" />
          <div className="absolute inset-0 flex flex-col items-start justify-center gap-4 px-6 text-white sm:px-12">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/85">
              <CloudSun className="size-4" aria-hidden="true" /> Live weather · real places · honest prices
            </p>
            <p className="max-w-lg font-display text-3xl font-bold sm:text-4xl">Your next trip is one sentence away.</p>
            <ButtonLink to="/plan" variant="accent" size="lg">
              Start planning <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Photo>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Hero />
      <ContinuePlanning />
      <PhotoMarquee />
      <Vibes />
      <HowItWorks />
      <DestinationGrid />
      <Pillars />
    </>
  );
}
