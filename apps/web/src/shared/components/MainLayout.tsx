import {
  CreditCard,
  Cpu,
  LogOut,
  MapPin,
  Radio,
  Users,
  Car,
} from 'lucide-react'
import { useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { PaymentWarningBanner } from '@/features/billing/components/PaymentWarningBanner'
import { ThemeToggle } from '@/components/atoms/ThemeToggle'
import { cn } from '@/lib/utils'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/vehicles', label: 'Veículos', icon: Car },
  { to: '/trackers', label: 'Rastreadores', icon: MapPin },
  { to: '/chips', label: 'Chips', icon: Radio },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  )

export function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-60 flex-col border-r border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Cpu size={20} className="text-primary" />
          <span className="font-semibold">Tracker Hub</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {user?.role === 'ADMIN' && (
            <>
              <NavLink to="/team" className={navLinkClass}>
                <Users size={16} />
                Equipe
              </NavLink>
              <NavLink to="/billing" className={navLinkClass}>
                <CreditCard size={16} />
                Cobrança
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 px-3 py-1 text-xs text-muted-foreground">
            {user?.email}
            <span className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-border px-6 py-3">
          <ThemeToggle />
        </header>
        <PaymentWarningBanner />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
