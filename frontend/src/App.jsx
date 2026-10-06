import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <main className="landing">
      <h1>WanderWise</h1>
      <p className="tagline">Your AI travel architect.</p>
      <p className="status">
        {health === null ? 'Connecting…' : health.ok ? 'API online · powered by Gemma' : 'API offline'}
      </p>
    </main>
  );
}
