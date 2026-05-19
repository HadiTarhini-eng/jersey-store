import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface NavItem {
  to:    string;
  label: string;
  icon:  string;
  end?:  boolean;
}

const navItems: NavItem[] = [
  { to: '/admin',              label: 'Dashboard',   icon: 'dashboard',  end: true },
  { to: '/admin/orders',       label: 'Orders',      icon: 'orders'                },
  { to: '/admin/customers',    label: 'Customers',   icon: 'customers'             },
  { to: '/admin/products',     label: 'Products',    icon: 'products'              },
  { to: '/admin/products/new', label: 'Add Product', icon: 'add'                   },
  { to: '/admin/offers',       label: 'Offers',      icon: 'offers'                },
  { to: '/admin/categories',   label: 'Categories',  icon: 'categories'            },
  { to: '/admin/settings',     label: 'Settings',    icon: 'categories'            },
];

const icons: Record<string, ReactNode> = {
  dashboard:  <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />,
  orders:     <path d="M9 2L5 6v14a2 2 0 002 2h10a2 2 0 002-2V6l-4-4H9zM9 2v4h6V2M9 13h6M9 17h4" strokeLinecap="round" strokeLinejoin="round" />,
  customers:  <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M17 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />,
  products:   <path d="M20 7L12 3 4 7l8 4 8-4zM4 7v10l8 4 8-4V7M12 11v10" strokeLinecap="round" strokeLinejoin="round" />,
  add:        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />,
  offers:     <path d="M20 12l-8 8-8-8 8-8 8 8zM12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />,
  categories: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" strokeLinecap="round" strokeLinejoin="round" />,
};

function Icon({ name }: { name: string }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      {icons[name]}
    </svg>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const SidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-white/10">
        <Link to="/" className="font-sport text-xl tracking-wide text-white block">
          JERSEYS<span className="text-accent">4</span>EVER
        </Link>
        <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Admin Console</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors',
                isActive
                  ? 'bg-white text-black'
                  : 'text-white/75 hover:text-white hover:bg-white/10',
              ].join(' ')
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">
            {user?.firstName?.[0] ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] uppercase tracking-widest text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <Link
          to="/"
          className="block px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          ← Back to Store
        </Link>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-danger hover:bg-danger/10 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-black border-r border-white/10 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/80 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full flex flex-col bg-black border-r border-white/10 animate-slide-in-left">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <PageTitle pathname={location.pathname} />
            </div>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              View store →
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PageTitle({ pathname }: { pathname: string }) {
  // Most specific match first
  const titles: { match: (p: string) => boolean; label: string }[] = [
    { match: (p) => p === '/admin',                          label: 'Dashboard' },
    { match: (p) => p === '/admin/orders',                   label: 'Orders' },
    { match: (p) => p.startsWith('/admin/orders/'),          label: 'Order Detail' },
    { match: (p) => p === '/admin/customers',                label: 'Customers' },
    { match: (p) => p === '/admin/products',                 label: 'Products' },
    { match: (p) => p === '/admin/products/new',             label: 'Add Product' },
    { match: (p) => p.startsWith('/admin/products/'),        label: 'Edit Product' },
    { match: (p) => p === '/admin/offers',                   label: 'Offers' },
    { match: (p) => p === '/admin/categories',               label: 'Categories' },
    { match: (p) => p === '/admin/settings',                 label: 'Settings'   },
  ];
  const found = titles.find((t) => t.match(pathname));
  return (
    <h1 className="font-sport text-2xl tracking-wide text-white uppercase">
      {found?.label ?? 'Admin'}
    </h1>
  );
}
