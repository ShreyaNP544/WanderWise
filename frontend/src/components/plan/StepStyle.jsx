import { useState } from 'react';
import { ChipGroup } from '../ui/ChipGroup.jsx';
import { Field, inputClass } from '../ui/Field.jsx';
import { Fieldset } from '../ui/Fieldset.jsx';
import { OptionGroup } from '../ui/OptionGroup.jsx';
import { cn } from '../../lib/cn.js';
import { LIMITS } from '../../lib/preferences.js';
import { DIETS, INTERESTS, PACES, STAY_TIERS, TRANSPORT_MODES } from '../../lib/tripOptions.js';

const parseList = (text) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

export function StepStyle({ prefs, update, errors }) {
  // Keep the raw text so typing "a, " doesn't lose the trailing comma.
  const [avoidText, setAvoidText] = useState(prefs.avoid.join(', '));

  return (
    <div className="grid gap-8">
      <Fieldset
        legend="What do you love?"
        hint={`Pick up to ${LIMITS.interests.max}, most important first.`}
        error={errors.interests}
      >
        <ChipGroup
          name="interests"
          options={INTERESTS}
          value={prefs.interests}
          onChange={(v) => update('interests', v)}
          max={LIMITS.interests.max}
        />
      </Fieldset>

      <Fieldset legend="Travel pace">
        <OptionGroup name="pace" options={PACES} value={prefs.pace} onChange={(v) => update('pace', v)} />
      </Fieldset>

      <Fieldset legend="Where you'll stay">
        <OptionGroup name="stay" options={STAY_TIERS} value={prefs.stay} onChange={(v) => update('stay', v)} />
      </Fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Fieldset legend="Getting there">
          <OptionGroup
            name="transport"
            options={TRANSPORT_MODES}
            value={prefs.transport}
            onChange={(v) => update('transport', v)}
            columns={2}
          />
        </Fieldset>

        <Field label="Food preference">
          {(p) => (
            <select {...p} className={cn(inputClass, 'appearance-auto')} value={prefs.diet} onChange={(e) => update('diet', e.target.value)}>
              {DIETS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label="Things to avoid" optional hint="Separate with commas, e.g. long drives, crowded markets.">
        {(p) => (
          <input
            {...p}
            className={inputClass}
            value={avoidText}
            onChange={(e) => {
              setAvoidText(e.target.value);
              update('avoid', parseList(e.target.value));
            }}
            maxLength={300}
          />
        )}
      </Field>

      <Field
        label="Accessibility or family needs"
        optional
        error={errors.constraints}
        hint="e.g. “Dad can't climb many stairs”, “travelling with a 3-year-old”."
      >
        {(p) => (
          <textarea
            {...p}
            rows={3}
            className={cn(inputClass, 'h-auto py-3')}
            value={prefs.constraints}
            onChange={(e) => update('constraints', e.target.value)}
            maxLength={300}
          />
        )}
      </Field>
    </div>
  );
}
