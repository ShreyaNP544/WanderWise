import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

/** Trip page state: load, reshape (instruction or trade-off option), undo, dismiss conflict. */
export function useTrip(id) {
  const [trip, setTrip] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [pending, setPending] = useState(null); // { kind: 'modify'|'undo'|'dismiss', label }
  const [actionError, setActionError] = useState(null);
  const [showChange, setShowChange] = useState(false);

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoadError(null);
    api
      .getTrip(id, { signal: controller.signal })
      .then(({ trip }) => setTrip(trip))
      .catch((err) => !controller.signal.aborted && setLoadError(err));
    return () => controller.abort();
  }, [id]);

  useEffect(load, [load]);

  async function run(kind, label, fn) {
    setPending({ kind, label });
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err);
    } finally {
      setPending(null);
    }
  }

  const reshape = (instruction) =>
    run('modify', instruction, async () => {
      const res = await api.modifyTrip(id, { instruction });
      setTrip(res.trip);
      setShowChange(res.kind === 'applied');
    });

  const chooseOption = (option) =>
    run('modify', option.label, async () => {
      const res = await api.modifyTrip(id, { optionId: option.id });
      setTrip(res.trip);
      setShowChange(res.kind === 'applied');
    });

  const undo = () =>
    run('undo', 'Undo', async () => {
      const res = await api.undoTrip(id);
      setTrip(res.trip);
      setShowChange(false);
    });

  const dismissConflict = () =>
    run('dismiss', 'Keep current plan', async () => {
      const res = await api.dismissConflict(id);
      setTrip(res.trip);
    });

  return {
    trip, loadError, reload: load, pending, actionError, clearActionError: () => setActionError(null),
    showChange, hideChange: () => setShowChange(false), reshape, chooseOption, undo, dismissConflict,
  };
}
