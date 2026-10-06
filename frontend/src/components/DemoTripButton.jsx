import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../api.js';
import { cn } from '../lib/cn.js';
import { Spinner } from './ui/Spinner.jsx';
import { useToast } from './ui/Toast.jsx';

/** Opens a pre-generated showcase trip instantly (no waiting on Gemma). */
export function DemoTripButton({ className, children = 'See a sample trip' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const { trip } = await api.demoTrip();
      navigate(`/trip/${trip.id}`);
    } catch (err) {
      toast({ tone: 'error', title: "Couldn't open the sample trip", body: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={open} disabled={loading} aria-busy={loading || undefined} className={cn('items-center gap-2 disabled:opacity-60', className)}>
      {loading ? <Spinner className="size-4" /> : <PlayCircle className="size-5" aria-hidden="true" />}
      {children}
    </button>
  );
}
