import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Megaphone,
  Globe,
  TrendingUp,
  Building2,
  GitBranch,
  Users,
  Leaf,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone, end: false },
  { to: '/dashboard/sources', label: 'Sources', icon: Globe, end: false },
  { to: '/dashboard/funnel', label: 'Funnel', icon: TrendingUp, end: false },
  { to: '/dashboard/branches', label: 'Branches', icon: Building2, end: false },
  { to: '/dashboard/pipeline', label: 'Pipeline', icon: GitBranch, end: false },
  { to: '/dashboard/sales', label: 'Sales', icon: Users, end: false },
]

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center h-16 gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center shadow-sm shadow-green-500/30">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                Energreen
              </span>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                      isActive
                        ? 'text-green-700 bg-green-50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-green-600' : 'text-slate-400'
                        )}
                      />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-green-500" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Live indicator */}
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Live</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
