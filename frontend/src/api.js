export class ApiError extends Error {
  constructor({ code, message, retryable = false, details, status }) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    this.status = status;
  }
}

// Gemma calls can take 40–90 s plus a repair or fallback; never hang forever, but don't give up early.
const TIMEOUT_MS = 30_000;
const AI_TIMEOUT_MS = 240_000;

async function request(path, { method = 'GET', body, signal, ai = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ai ? AI_TIMEOUT_MS : TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort());

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError({
      code: controller.signal.aborted ? 'TIMEOUT' : 'NETWORK',
      message: controller.signal.aborted
        ? 'This is taking longer than expected. Please try again.'
        : "Can't reach the WanderWise server. Is it running?",
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError({
      status: res.status,
      code: data?.error?.code || 'HTTP_ERROR',
      message: data?.error?.message || `Request failed (${res.status}).`,
      retryable: data?.error?.retryable ?? res.status >= 500,
      details: data?.error?.details,
    });
  }
  return data;
}

export const api = {
  health: (opts) => request('/health', opts),
  createTrip: (preferences, opts) => request('/trips', { method: 'POST', body: { preferences }, ai: true, ...opts }),
  placePhoto: (place, { strict, ...opts } = {}) => request(`/photo?place=${encodeURIComponent(place)}${strict ? '&strict=1' : ''}`, opts),
  demoTrip: () => request('/trips/demo', { method: 'POST', body: {} }),
  getTrip: (id, opts) => request(`/trips/${encodeURIComponent(id)}`, opts),
  modifyTrip: (id, body, opts) => request(`/trips/${encodeURIComponent(id)}/modify`, { method: 'POST', body, ai: true, ...opts }),
  undoTrip: (id) => request(`/trips/${encodeURIComponent(id)}/undo`, { method: 'POST', body: {} }),
  dismissConflict: (id) => request(`/trips/${encodeURIComponent(id)}/dismiss-conflict`, { method: 'POST', body: {} }),
};
