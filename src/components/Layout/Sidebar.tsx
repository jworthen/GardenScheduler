import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Calendar,
  CheckSquare,
  Package,
  BookOpen,
  Wrench,
  Settings,
  Leaf,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/seeds', icon: Sprout, label: 'Seed Database' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
];

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full bg-white border-r border-stone-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-stone-100">
        <div className="flex items-center justify-center w-9 h-9 bg-garden-600 rounded-xl">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">GardenScheduler</h1>
          <p className="text-xs text-gray-500">Seed & Garden Planner</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-garden-50 text-garden-700'
                  : 'text-gray-600 hover:bg-stone-50 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={clsx(
                    'w-4.5 h-4.5 flex-shrink-0',
                    isActive ? 'text-garden-600' : 'text-gray-400'
                  )}
                  size={18}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-4 border-t border-stone-100 pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-garden-50 text-garden-700'
                : 'text-gray-600 hover:bg-stone-50 hover:text-gray-900'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                className={clsx('flex-shrink-0', isActive ? 'text-garden-600' : 'text-gray-400')}
                size={18}
              />
              Settings
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
}
