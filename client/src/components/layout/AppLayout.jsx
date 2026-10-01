import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../hooks/useDarkMode'
import {
  HomeIcon, DocumentTextIcon, UserGroupIcon, ChartBarIcon,
  CreditCardIcon, CogIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon, MoonIcon, SunIcon,
  ShieldCheckIcon, UsersIcon, SparklesIcon, BellIcon,
  UserCircleIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline'

const NAV_USER = [
  { to: '/dashboard',   icon: HomeIcon,          label: 'Dashboard' },
  { to: '/invoices',    icon: DocumentTextIcon,  label: 'Invoices' },
  { to: '/clients',     icon: UserGroupIcon,     label: 'Clients' },
  { to: '/reports',     icon: ChartBarIcon,      label: 'Reports' },
  { to: '/subscription',icon: CreditCardIcon,    label: 'Subscription' },
]

const NAV_ADMIN = [
  { to: '/admin/dashboard',  icon: ShieldCheckIcon, label: 'Admin Panel' },
  { to: '/admin/users',      icon: UsersIcon,       label: 'Users' },
  { to: '/admin/analytics',  icon: ChartBarIcon,    label: 'Analytics' },
]

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth()
  const [dark, toggleDark] = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = isAdmin ? NAV_ADMIN : NAV_USER

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const Sidebar = ({ mobile = false }) => (
    <aside className={`flex flex-col h-full ${mobile ? '' : 'w-[260px]'} bg-white dark:bg-surface-900 border-r border-slate-100 dark:border-slate-800`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow">
          <SparklesIcon className="w-4 h-4 text-white" />
        </div>
        <span className="font-display text-lg font-bold text-slate-900 dark:text-white">InvoiceFlow</span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Plan badge */}
      {!isAdmin && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 capitalize">{user?.subscriptionPlan} Plan</span>
            {user?.subscriptionPlan === 'free' && (
              <button onClick={() => navigate('/subscription')} className="text-xs font-bold text-brand-600 hover:text-brand-700">Upgrade →</button>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
        <NavLink to="/profile" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <CogIcon className="w-5 h-5" /> Profile & Settings
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
          <ArrowRightOnRectangleIcon className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-72 animate-slide-in">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 shrink-0 bg-white dark:bg-surface-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Page title breadcrumb */}
          <div className="hidden sm:block text-sm text-slate-400 dark:text-slate-500 font-medium capitalize">
            {location.pathname.split('/').filter(Boolean).join(' › ')}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            {/* Notifications (placeholder) */}
            <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">{user?.name}</p>
                  <p className="text-xs text-slate-400 leading-none mt-0.5 capitalize">{user?.subscriptionPlan}</p>
                </div>
                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-52 card shadow-card-hover z-50 animate-fade-in overflow-hidden">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button onClick={() => { navigate('/profile'); setUserMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                      <UserCircleIcon className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => { navigate('/subscription'); setUserMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                      <CreditCardIcon className="w-4 h-4" /> Subscription
                    </button>
                    <hr className="my-1 border-slate-100 dark:border-slate-800" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                      <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
