import { useEffect, useState } from 'react';
import { api } from '../api.js';

// status: 'checking' | 'online' | 'offline'
export function useHealth() {
  const [state, setState] = useState({ status: 'checking', health: null });

  useEffect(() => {
    const controller = new AbortController();
    api
      .health({ signal: controller.signal })
      .then((health) => setState({ status: 'online', health }))
      .catch(() => !controller.signal.aborted && setState({ status: 'offline', health: null }));
    return () => controller.abort();
  }, []);

  return state;
}
