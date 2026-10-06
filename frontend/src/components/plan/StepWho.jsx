import { Field, inputClass } from '../ui/Field.jsx';
import { Fieldset } from '../ui/Fieldset.jsx';
import { NumberStepper } from '../ui/NumberStepper.jsx';
import { OptionGroup } from '../ui/OptionGroup.jsx';
import { cn } from '../../lib/cn.js';
import { formatINR } from '../../lib/format.js';
import { LIMITS } from '../../lib/preferences.js';
import { BUDGET_PRESETS, TRAVELLER_TYPES } from '../../lib/tripOptions.js';

export function StepWho({ prefs, update, errors }) {
  const perPersonPerDay =
    prefs.budget > 0 && prefs.travellers > 0 && prefs.days > 0
      ? Math.round(prefs.budget / prefs.travellers / prefs.days)
      : null;

  return (
    <div className="grid gap-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Travellers" error={errors.travellers}>
          {(p) => (
            <NumberStepper
              fieldProps={p}
              value={prefs.travellers}
              onChange={(v) => update('travellers', v)}
              min={LIMITS.travellers.min}
              max={LIMITS.travellers.max}
              unit={prefs.travellers === 1 ? 'person' : 'people'}
            />
          )}
        </Field>

        <Field
          label="Total budget"
          error={errors.budget}
          hint={perPersonPerDay ? `≈ ${formatINR(perPersonPerDay)} per person per day, everything included.` : 'For the whole group, including travel.'}
        >
          {(p) => (
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">₹</span>
              <input
                {...p}
                type="number"
                inputMode="numeric"
                min={LIMITS.budget.min}
                max={LIMITS.budget.max}
                step={500}
                className={cn(inputClass, 'pl-9 font-semibold')}
                value={Number.isNaN(prefs.budget) ? '' : prefs.budget}
                onChange={(e) => update('budget', e.target.value === '' ? NaN : Math.round(Number(e.target.value)))}
              />
            </div>
          )}
        </Field>
      </div>

      <div className="-mt-3 flex flex-wrap gap-2" aria-label="Budget presets">
        {BUDGET_PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => update('budget', amount)}
            aria-pressed={prefs.budget === amount}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium ring-1',
              prefs.budget === amount ? 'bg-ink text-white ring-ink' : 'bg-surface ring-line hover:ring-brand-500'
            )}
          >
            {formatINR(amount)}
          </button>
        ))}
      </div>

      <Fieldset legend="Who's travelling?" hint="This changes pace, comfort and the kind of activities we pick.">
        <OptionGroup
          name="travellerType"
          options={TRAVELLER_TYPES}
          value={prefs.travellerType}
          onChange={(v) => update('travellerType', v)}
          columns={5}
        />
      </Fieldset>
    </div>
  );
}
