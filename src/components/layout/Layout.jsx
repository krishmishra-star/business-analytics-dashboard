import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Handshake, Package, CreditCard, UserCog, Activity,
  PanelLeftClose, PanelLeftOpen, Menu, X, Database, RotateCcw, Zap,
} from 'lucide-react';
import { KEYS, loadJSON, saveJSON } from '../../lib/storage.js';
import { useData } from '../../context/DataContext.jsx';
import { useFilters } from '../../context/FilterContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/deals', label: 'Deals', icon: Handshake },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/team', label: 'Team Performance', icon: UserCog },
  { to: '/activity', label: 'Recent Activity', icon: Activity },
];

function NavItems({ collapsed, onNavigate }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-2">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to} to={to} end={end} onClick={onNavigate} title={collapsed ? label : undefined}
          className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-surface hover:text-ink-900'} ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand({ collapsed }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-4 ${collapsed ? 'justify-center px-2' : ''}`}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-white"><Zap size={17} /></span>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-ink-900">PulseMetrics</div>
          <div className="text-[11px] text-ink-400">Business analytics</div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => loadJSON(KEYS.sidebar, false));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { resetData } = useData();
  const { reset: resetFilters } = useFilters();
  const toast = useToast();

  useEffect(() => { saveJSON(KEYS.sidebar, collapsed); }, [collapsed]);
  useEffect(() => { setMobileOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  const onResetDemo = () => {
    if (window.confirm('Reset all demo data to the original dataset? Your edits to deals, orders and payments will be lost.')) {
      resetData();
      resetFilters();
      toast.success('Demo data restored to the original dataset.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-surface-line bg-white transition-[width] duration-200 lg:flex ${collapsed ? 'w-[68px]' : 'w-60'}`}>
        <Brand collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto py-2"><NavItems collapsed={collapsed} /></div>
        <div className="border-t border-surface-line p-2">
          <button onClick={() => setCollapsed((c) => !c)} className={`btn w-full ${collapsed ? 'justify-center !px-0' : ''}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-3"><Brand /><button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="btn !p-2"><X size={16} /></button></div>
            <div className="flex-1 overflow-y-auto py-2"><NavItems onNavigate={() => setMobileOpen(false)} /></div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-surface-line bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="btn !p-2 lg:hidden" aria-label="Open menu"><Menu size={18} /></button>
          <div className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700" title="The seeded demo dataset ends on this date, so it's treated as “today”.">
            <Database size={13} /> Demo data · as of 17 Oct 2026
          </div>
          <button onClick={onResetDemo} className="btn ml-auto" title="Restore the original seeded dataset"><RotateCcw size={14} /><span className="hidden sm:inline"> Reset demo data</span></button>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
