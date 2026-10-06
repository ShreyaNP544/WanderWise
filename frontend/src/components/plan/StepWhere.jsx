import { Field, inputClass } from '../ui/Field.jsx';
import { NumberStepper } from '../ui/NumberStepper.jsx';
import { LIMITS } from '../../lib/preferences.js';
import { SUGGESTED_DESTINATIONS } from '../../lib/tripOptions.js';

export function StepWhere({ prefs, update, errors }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Field label="Starting from" error={errors.origin}>
        {(p) => (
          <input
            {...p}
            className={inputClass}
            value={prefs.origin}
            onChange={(e) => update('origin', e.target.value)}
            placeholder="e.g. Mumbai"
            autoComplete="address-level2"
            maxLength={80}
          />
        )}
      </Field>

      <Field label="Going to" error={errors.destination} hint="A place, or a vibe like “quiet hills near Pune”.">
        {(p) => (
          <>
            <input
              {...p}
              className={inputClass}
              list="destination-suggestions"
              value={prefs.destination}
              onChange={(e) => update('destination', e.target.value)}
              placeholder="e.g. Manali, Himachal"
              maxLength={80}
            />
            <datalist id="destination-suggestions">
              {SUGGESTED_DESTINATIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </>
        )}
      </Field>

      <Field label="Start date" optional error={errors.startDate} hint="Leave empty if you're flexible.">
        {(p) => (
          <input
            {...p}
            type="date"
            className={inputClass}
            value={prefs.startDate}
            onChange={(e) => update('startDate', e.target.value)}
          />
        )}
      </Field>

      <Field label="Number of days" error={errors.days} hint="Including travel days.">
        {(p) => (
          <NumberStepper
            fieldProps={p}
            value={prefs.days}
            onChange={(v) => update('days', v)}
            min={LIMITS.days.min}
            max={LIMITS.days.max}
            unit="days"
          />
        )}
      </Field>
    </div>
  );
}
