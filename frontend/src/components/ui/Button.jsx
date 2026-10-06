import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { Spinner } from './Spinner.jsx';

const variants = {
  primary: 'bg-brand-700 text-white hover:bg-brand-900 shadow-sm',
  accent: 'bg-sunset-500 text-white hover:bg-sunset-600 shadow-sm',
  secondary: 'bg-surface text-ink ring-1 ring-line hover:bg-brand-50 hover:ring-brand-100',
  ghost: 'text-muted hover:text-ink hover:bg-ink/5',
};

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2',
};

const base =
  'inline-flex items-center justify-center rounded-full font-semibold transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
