import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api.js';
import {
  DEFAULT_PREFERENCES, STEPS, serverErrorsToFields, toPayload, validateAll, validateStep,
} from '../lib/preferences.js';

/** Multi-step trip form state machine: field updates, step navigation, validation, submission. */
export function useTripForm(initial = {}) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFERENCES, ...initial });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const update = useCallback((field, value) => {
    setPrefs((p) => ({ ...p, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }, []);

  const isLast = step === STEPS.length - 1;

  const back = () => setStep((s) => Math.max(0, s - 1));

  async function submit() {
    const all = validateAll(prefs);
    if (Object.keys(all).length) {
      setErrors(all);
      setStep(STEPS.findIndex((s) => s.fields.some((f) => all[f])));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { trip } = await api.createTrip(toPayload(prefs));
      navigate(`/trip/${trip.id}`);
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR' && err.details) {
        const fieldErrors = serverErrorsToFields(err.details);
        setErrors(fieldErrors);
        const firstStep = STEPS.findIndex((s) => s.fields.some((f) => fieldErrors[f]));
        if (firstStep >= 0) setStep(firstStep);
      }
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    const stepErrors = validateStep(prefs, step);
    if (Object.keys(stepErrors).length) {
      setErrors((e) => ({ ...e, ...stepErrors }));
      return false;
    }
    if (isLast) submit();
    else setStep(step + 1);
    return true;
  }

  return { prefs, update, step, setStep, isLast, next, back, errors, submitting, submitError, retry: submit };
}
