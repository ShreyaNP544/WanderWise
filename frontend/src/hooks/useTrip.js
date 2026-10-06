import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { formatINR } from '../lib/format.js';
import { rememberTrip } from '../lib/recentTrips.js';

function remixToast(trip) {
  const { change, budget, diff } = trip.version;
  const delta = budget.total - (change?.budgetBefore ?? budget.total);
  const parts = [];
  if (delta) parts.push(`${delta < 0 ? 'Saved' : 'Added'} ${formatINR(Math.abs(delta))}`);
  if (diff) parts.push(`${diff.added.length + diff.modified.length + diff.removed.length} itinerary changes`);
  return { title: 'Trip remixed', body: parts.join(' · ') || 'Spending rebalanced.' };
}

/** Trip page state: load, remix (instruction or trade-off option), undo, dismiss conflict. */
export function useTrip(id) {
  const toast = useToast();
  const [trip, setTrip] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [pending, setPending] = useState(null); // { kind: 'modify'|'undo'|'dismiss', label }
  const [showChange, setShowChange] = useState(false);

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoadError(null);
    api
      .getTrip(id, { signal: controller.signal })
      .then(({ trip }) => {
        setTrip(trip);
        rememberTrip(trip);
      })
      .catch((err) => !controller.signal.aborted && setLoadError(err));
    return () => controller.abort();
  }, [id]);

  useEffect(load, [load]);

  async function run(kind, label, fn) {
    setPending({ kind, label });
    try {
      await fn();
    } catch (err) {
      toast({ tone: 'error', title: "That change didn't go through", body: `${err.message} Your current plan is unchanged.`, duration: 8000 });
    } finally {
      setPending(null);
    }
  }

  const apply = (res) => {
    setTrip(res.trip);
    rememberTrip(res.trip);
    if (res.kind === 'applied') {
      setShowChange(true);
      toast(remixToast(res.trip));
      window.scrollTo({ top: document.getElementById('remix-anchor')?.offsetTop - 80 || 0, behavior: 'smooth' });
    } else {
      setShowChange(false);
      toast({ tone: 'info', title: 'That needs a trade-off', body: 'Pick one of the options below.' });
      window.scrollTo({ top: document.getElementById('remix-anchor')?.offsetTop - 80 || 0, behavior: 'smooth' });
    }
  };

  const reshape = (instruction) => run('modify', instruction, async () => apply(await api.modifyTrip(id, { instruction })));

  const chooseOption = (option) => run('modify', option.label, async () => apply(await api.modifyTrip(id, { optionId: option.id })));

  const undo = () =>
    run('undo', 'Undo', async () => {
      const res = await api.undoTrip(id);
      setTrip(res.trip);
      setShowChange(false);
      toast({ tone: 'info', title: 'Went back one version', body: `Total ${formatINR(res.trip.version.budget.total)}` });
    });

  const dismissConflict = () =>
    run('dismiss', 'Keep current plan', async () => {
      const res = await api.dismissConflict(id);
      setTrip(res.trip);
      toast({ tone: 'info', title: 'Kept your current plan' });
    });

  return { trip, loadError, reload: load, pending, showChange, hideChange: () => setShowChange(false), reshape, chooseOption, undo, dismissConflict };
}
