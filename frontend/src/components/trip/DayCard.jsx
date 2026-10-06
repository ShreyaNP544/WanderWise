import { CloudRain, CloudSun, Gem, MapPinned, Snowflake, Sun } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Photo } from '../ui/Photo.jsx';
import { usePlacePhoto } from '../../hooks/usePlacePhoto.js';
import { SourceBadge } from './SourceBadge.jsx';
import { cn } from '../../lib/cn.js';
import { formatINR } from '../../lib/format.js';
import { CATEGORY, ENERGY, formatDate, mapsUrl } from '../../lib/trip.js';

function EnergyMeter({ level }) {
  const e = ENERGY[level] || ENERGY[2];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted" title={e.label}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn('h-3 w-1.5 rounded-sm', n <= level ? e.tone : 'bg-line')} />
        ))}
      </span>
      {e.label}
    </span>
  );
}

function WeatherChip({ weather }) {
  if (!weather) return null;
  const Icon = /snow/i.test(weather.summary) ? Snowflake : /rain|drizzle|thunder/i.test(weather.summary) ? CloudRain : /clear/i.test(weather.summary) ? Sun : CloudSun;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800" title="Open-Meteo forecast">
      <Icon className="size-3.5" aria-hidden="true" />
      {weather.summary} · {weather.minC}–{weather.maxC}°C
      {weather.rainChance != null && weather.rainChance >= 30 && ` · ${weather.rainChance}% rain`}
    </span>
  );
}

const NO_PHOTO = new Set(['transport', 'rest']);

function useActivityPhoto(a) {
  const known = a.placeName || a.baselineName || '';
  const name = NO_PHOTO.has(a.category) ? '' : known || a.title;
  return usePlacePhoto(name, { skipCurated: false, strict: !known });
}

function ActivityItem({ activity, mark, destination, index }) {
  const cat = CATEGORY[activity.category] || CATEGORY.sightseeing;
  const photo = useActivityPhoto(activity);
  return (
    <li
      className={cn(
        'relative grid gap-3 rounded-2xl p-3 transition-colors',
        photo ? 'grid-cols-[3.25rem_1fr] sm:grid-cols-[3.25rem_1fr_7.5rem]' : 'grid-cols-[3.25rem_1fr]',
        mark === 'added' && 'animate-remix-in bg-green-50 ring-2 ring-ok/40',
        mark === 'modified' && 'animate-remix-in bg-sunset-100/60 ring-2 ring-sunset-500/40'
      )}
      style={mark ? { animationDelay: `${index * 80}ms` } : undefined}
    >
      <div className="flex flex-col items-center gap-1.5 pt-0.5">
        <span className="text-xs font-bold tabular-nums text-muted">{activity.time || '—'}</span>
        <span className="grid size-9 place-items-center rounded-xl bg-paper text-brand-700" title={cat.label}>
          <cat.Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h4 className="font-semibold leading-snug">
            {activity.title}
            {mark && (
              <span className={cn('ml-2 align-middle text-[10px] font-bold uppercase tracking-wider', mark === 'added' ? 'text-ok' : 'text-sunset-600')}>
                {mark === 'added' ? 'New' : 'Changed'}
              </span>
            )}
          </h4>
          <span className="text-sm font-semibold tabular-nums">
            {activity.costPerPerson ? `${formatINR(activity.costPerPerson)}/person` : activity.category === 'transport' ? '' : 'Free'}
          </span>
        </div>
        {activity.place && activity.place !== activity.title && <p className="text-sm text-muted">{activity.place}</p>}
        {activity.why && <p className="mt-1 text-sm text-ink/80">{activity.why}</p>}
        {activity.note && <p className="mt-1 text-xs font-medium text-warn">Note: {activity.note}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SourceBadge activity={activity} />
          {activity.hiddenGem && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100">
              <Gem className="size-3" aria-hidden="true" /> Hidden gem
            </span>
          )}
          {activity.durationHrs > 0 && <span className="text-xs text-muted">{activity.durationHrs} h</span>}
          {activity.category !== 'transport' && (
            <a
              href={mapsUrl(activity, destination)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              <MapPinned className="size-3.5" aria-hidden="true" /> Map
            </a>
          )}
        </div>
      </div>
      {photo && (
        <Photo
          photo={photo}
          showCredit={false}
          className="col-span-2 col-start-2 h-36 rounded-xl sm:col-span-1 sm:col-start-3 sm:h-24"
          imgClassName="animate-remix-in"
        />
      )}
    </li>
  );
}

export function DayCard({ day, date, weather, marks, destination, theme }) {
  const changed = day.activities.some((a) => marks[a.id]);
  // The day's headline landmark, only if code matched it to a real place (never a guess from free text).
  const landmark = day.type !== 'travel' && day.activities.find((a) => a.placeName || a.baselineName);
  const landmarkName = landmark ? landmark.placeName || landmark.baselineName : '';
  const landmarkPhoto = usePlacePhoto(landmarkName);
  const bannerPhoto = landmarkPhoto || (theme?.themed || day.type === 'travel' ? theme?.photo : null);
  return (
    <Card as="section" className={cn('overflow-hidden', changed && 'animate-remix-glow ring-2 ring-sunset-500/30')} aria-labelledby={`day-${day.day}`}>
      {theme && bannerPhoto && (
        <Photo key={bannerPhoto?.src || 'none'} photo={bannerPhoto} className="h-32 sm:h-40" imgClassName="transition-transform duration-700 hover:scale-105">
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" aria-hidden="true" />
          <span className="absolute left-4 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow-sm sm:left-6">
            {theme.emoji} {theme.label}
          </span>
          {landmarkPhoto && (
            <span className="absolute bottom-2 left-4 text-sm font-semibold text-white drop-shadow sm:left-6">{landmarkName}</span>
          )}
        </Photo>
      )}
      <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white">
            <span className="text-center leading-none">
              <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-75">Day</span>
              <span className="font-display text-xl font-bold">{day.day}</span>
            </span>
          </span>
          <div>
            <h3 id={`day-${day.day}`} className="text-xl font-bold leading-tight">{day.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {date ? formatDate(date) : day.type === 'travel' ? 'Travel day' : ''}
              {date && day.type === 'travel' ? ' · Travel day' : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <EnergyMeter level={day.energy} />
          <WeatherChip weather={weather} />
        </div>
      </div>
      <ol className="mt-4 grid gap-1">
        {day.activities.map((a, i) => (
          <ActivityItem key={a.id} activity={a} mark={marks[a.id]} destination={destination} index={i} />
        ))}
      </ol>
      </div>
    </Card>
  );
}
