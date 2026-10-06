export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      {Icon && (
        <span className="mb-5 grid size-16 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon className="size-7" aria-hidden="true" />
        </span>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
      {children && <div className="mt-3 text-muted">{children}</div>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
