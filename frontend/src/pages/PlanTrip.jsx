import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Alert } from '../components/ui/Alert.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Stepper } from '../components/ui/Stepper.jsx';
import { StepStyle } from '../components/plan/StepStyle.jsx';
import { StepWho } from '../components/plan/StepWho.jsx';
import { StepWhere } from '../components/plan/StepWhere.jsx';
import { TripSummary } from '../components/plan/TripSummary.jsx';
import { useTripForm } from '../hooks/useTripForm.js';
import { STEPS } from '../lib/preferences.js';

const stepComponents = [StepWhere, StepWho, StepStyle];

export default function PlanTrip() {
  const [params] = useSearchParams();
  const form = useTripForm({ destination: params.get('destination')?.slice(0, 80) || '' });
  const { step, isLast, submitting, submitError } = form;
  const StepComponent = stepComponents[step];
  const headingRef = useRef(null);
  const firstRender = useRef(true);

  // Move focus to the step heading when the step changes (screen readers + keyboard users).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const onSubmit = (e) => {
    e.preventDefault();
    form.next();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold sm:text-5xl">Plan a trip</h1>
        <p className="mt-3 text-lg text-muted">Takes about a minute. You can reshape everything later.</p>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 sm:p-8">
          <Stepper steps={STEPS} current={step} />

          <form className="mt-8" onSubmit={onSubmit} noValidate aria-labelledby="step-title">
            <h2 id="step-title" ref={headingRef} tabIndex={-1} className="mb-6 text-2xl font-bold outline-none">
              {STEPS[step].title}
            </h2>

            <StepComponent prefs={form.prefs} update={form.update} errors={form.errors} />

            {submitError && (
              <Alert
                tone={submitError.code === 'NOT_IMPLEMENTED' ? 'info' : 'error'}
                title={submitError.code === 'NOT_IMPLEMENTED' ? 'Almost there' : "We couldn't plan this trip"}
                onRetry={submitError.retryable ? form.retry : undefined}
                className="mt-8"
              >
                {submitError.message}
              </Alert>
            )}

            <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
              <Button variant="ghost" onClick={form.back} disabled={step === 0 || submitting}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Back
              </Button>
              <Button type="submit" variant={isLast ? 'accent' : 'primary'} size={isLast ? 'lg' : 'md'} loading={submitting}>
                {isLast ? (
                  <>
                    {!submitting && <Sparkles className="size-5" aria-hidden="true" />}
                    {submitting ? 'Designing your trip…' : 'Design my trip'}
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="lg:sticky lg:top-24">
          <TripSummary prefs={form.prefs} />
        </div>
      </div>
    </div>
  );
}
