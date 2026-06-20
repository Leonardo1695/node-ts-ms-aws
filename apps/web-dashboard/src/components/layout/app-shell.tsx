import { NavLink, Outlet } from 'react-router-dom';
import { GradientText } from '../react-bits/gradient-text';
import { ShinyText } from '../react-bits/shiny-text';

const navItems: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Overview', end: true },
  { to: '/assets/asset-exc-101', label: 'Asset Detail' },
  { to: '/reports/idling', label: 'Idling Report' },
  { to: '/control', label: 'Control Panel' },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              <GradientText>Verdiron</GradientText>
            </p>
            <h1 className="text-display-sm font-semibold">
              <ShinyText text="Sustainability Module" />
            </h1>
            <p className="text-sm text-slate-400">
              Green metrics for heavy iron.
            </p>
          </div>
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-2"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-verdiron-primary text-white'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
