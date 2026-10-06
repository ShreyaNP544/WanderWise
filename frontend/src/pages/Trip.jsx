import { useMemo } from 'react';
import { MapPinOff } from 'lucide-react';
import { useParams } from 'react-router';
import { Alert } from '../components/ui/Alert.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { BudgetCard } from '../components/trip/BudgetCard.jsx';
import { ChangePanel } from '../components/trip/ChangePanel.jsx';
import { ConflictCard } from '../components/trip/ConflictCard.jsx';
import { DayCard } from '../components/trip/DayCard.jsx';
import { InsightsCard, SourcesCard } from '../components/trip/InsightsCard.jsx';
import { LoadingStory } from '../components/trip/LoadingStory.jsx';
import { ReshapeBar } from '../components/trip/ReshapeBar.jsx';
import { TripHeader } from '../components/trip/TripHeader.jsx';
import { useTrip } from '../hooks/useTrip.js';
import { addDays, changeMarks } from '../lib/trip.js';

export default function Trip() {
  const { id } = useParams();
  const t = useTrip(id);
  const { trip } = t;
  const marks = useMemo(() => (t.showChange ? changeMarks(trip?.version.diff) : {}), [t.showChange, trip]);

  if (t.loadError) {
    return t.loadError.code === 'NOT_FOUND' ? (
      <EmptyState icon={MapPinOff} title="Trip not found" action={<ButtonLink to="/plan">Plan a new trip</ButtonLink>}>
        This trip may have expired (trips are kept in memory until MongoDB is connected).
      </EmptyState>
    ) : (
      <div className="mx-auto max-w-xl px-4 py-20">
        <Alert title="We couldn't load this trip" onRetry={t.reload}>{t.loadError.message}</Alert>
      </div>
    );
  }
  if (!trip) return <LoadingStory mode="create" title="Opening your trip" />;

  const { version, preferences: p, context } = trip;
  const weatherByDay = context?.weather?.status === 'forecast' ? Object.fromEntries(context.weather.days.map((d) => [d.day, d])) : {};
  const busy = Boolean(t.pending);

  return (
    <>
      <TripHeader trip={trip} />

      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="grid min-w-0 gap-5">
          {t.actionError && (
            <Alert title="That change didn't go through" onRetry={undefined}>
              {t.actionError.message} Your current plan is unchanged.
            </Alert>
          )}
          {trip.pendingConflict && (
            <ConflictCard conflict={trip.pendingConflict} onChoose={t.chooseOption} onDismiss={t.dismissConflict} busy={busy} />
          )}
          {t.showChange && version.change && <ChangePanel version={version} onClose={t.hideChange} />}

          <h2 className="sr-only">Day-by-day plan</h2>
          {version.plan.days.map((day) => (
            <DayCard
              key={day.day}
              day={day}
              date={addDays(p.startDate, day.day - 1)}
              weather={weatherByDay[day.day]}
              marks={marks}
              destination={trip.destination.name}
            />
          ))}
        </div>

        <aside className="grid gap-5 lg:sticky lg:top-20" aria-label="Trip details">
          <BudgetCard budget={version.budget} before={t.showChange ? version.change?.budgetBefore : undefined} />
          <SourcesCard trip={trip} />
          <InsightsCard plan={version.plan} warnings={t.showChange ? [] : version.warnings} />
          {trip.versionCount > 1 && (
            <p className="text-center text-xs text-muted">
              Version {trip.current + 1} of {trip.versionCount}
            </p>
          )}
        </aside>
      </div>

      <ReshapeBar onSubmit={t.reshape} onUndo={t.undo} canUndo={trip.current > 0} busy={busy} />
      {t.pending?.kind === 'modify' && <LoadingStory mode="modify" title={`“${t.pending.label}”`} overlay />}
    </>
  );
}
