/** Layout-matching placeholder while a saved trip loads. */
export function TripSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading trip">
      <div className="skeleton h-72 w-full sm:h-80" />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-card bg-surface p-6 ring-1 ring-line/70">
              <div className="flex gap-3">
                <div className="skeleton size-12 rounded-2xl" />
                <div className="grid flex-1 gap-2">
                  <div className="skeleton h-5 w-1/2 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
              {[0, 1, 2].map((j) => (
                <div key={j} className="skeleton mt-4 h-14 rounded-2xl" />
              ))}
            </div>
          ))}
        </div>
        <div className="grid h-fit gap-5">
          <div className="skeleton h-72 rounded-card" />
          <div className="skeleton h-48 rounded-card" />
        </div>
      </div>
    </div>
  );
}
