import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Bell,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import LogoMark from './layout/LogoMark.jsx';

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/businesses', label: 'Businesses', icon: Building2, badge: null },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const initials =
    user?.name
      ?.split(/\s+/)
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A';

  return (
    <div className="admin-canvas font-admin flex min-h-[100dvh] lg:flex">
      <aside
        className={`admin-sidebar-shell fixed inset-y-0 left-0 z-40 flex w-[280px] transform flex-col border-r border-white/[0.06] transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-1 flex-col px-4 pb-6 pt-6">
          <div className="mb-8 flex items-center gap-3 px-1">
            <LogoMark />
            <div className="min-w-0">
              <p className="truncate font-admin text-lg font-semibold tracking-tight text-white">RepeaTrack</p>
              <p className="text-xs font-medium text-emerald-500/90">Super Admin</p>
            </div>
          </div>

          <button
            type="button"
            className="mb-6 flex w-full items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2.5 text-left text-sm text-slate-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.07]"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="truncate font-medium">Production</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>

          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge != null && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-2 border-t border-white/[0.06] pt-4">
            <NavLink
              to="/admin/businesses"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
            >
              <Settings className="h-5 w-5 shrink-0" />
              Workspace settings
            </NavLink>

            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 ring-1 ring-white/[0.06]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-red-400/90 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 lg:hidden">
          <button
            type="button"
            className="btn-admin-secondary !rounded-2xl p-2"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-admin text-sm font-semibold text-slate-900 dark:text-white">Console</span>
          <button type="button" className="btn-admin-secondary !rounded-2xl p-2" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
