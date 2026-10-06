import { Compass } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { cn } from '../../lib/cn.js';
import { StatusBadge } from './StatusBadge.jsx';
import { DemoTripButton } from '../DemoTripButton.jsx';

export function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-lg" aria-label="WanderWise home">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-700 text-white">
        <Compass className="size-5" aria-hidden="true" />
      </span>
      <span className="font-display text-xl font-bold">WanderWise</span>
    </Link>
  );
}

const navClass = ({ isActive }) =>
  cn('rounded-full px-3 py-1.5 text-sm font-semibold', isActive ? 'bg-ink/5 text-ink' : 'text-muted hover:text-ink');

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
            <DemoTripButton className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink md:inline-flex">
              Sample trip
            </DemoTripButton>
            <NavLink to="/plan" className={({ isActive }) => cn(navClass({ isActive }), 'bg-brand-700 text-white hover:bg-brand-900 hover:text-white')}>
              Plan a trip
            </NavLink>
            <span className="hidden sm:block">
              <StatusBadge />
            </span>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>WanderWise · plans that adapt like you do</p>
          <p>Powered by open-source Gemma · Hacktoberfest × MLH</p>
        </div>
      </footer>
    </div>
  );
}
