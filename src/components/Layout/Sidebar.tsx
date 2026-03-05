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
  LogOut,
  User,
  Grid3X3,
  Images,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/seeds', icon: Sprout, label: 'Seed Database' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/inventory', icon: Package, label: 'Seed Inventory' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/gallery', icon: Images, label: 'Gallery' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
  { to: '/cell-planner', icon: Grid3X3, label: 'Cell Planner' },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="flex flex-col h-full bg-white border-r border-stone-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-stone-100">
        <div className="flex items-center justify-center w-9 h-9 bg-garden-600 rounded-xl">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">Last Frost</h1>
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

      {/* Settings + Profile at bottom */}
      <div className="px-3 pb-2 border-t border-stone-100 pt-3 space-y-1">
        {[{ to: '/profile', icon: User, label: 'Profile' }, { to: '/settings', icon: Settings, label: 'Settings' }].map(
          ({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
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
                    className={clsx('flex-shrink-0', isActive ? 'text-garden-600' : 'text-gray-400')}
                    size={18}
                  />
                  {label}
                </>
              )}
            </NavLink>
          )
        )}
      </div>

      {/* User profile */}
      <div className="px-3 pb-4 pt-2 border-t border-stone-100">
        <div className="flex items-center gap-2 px-2 py-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-garden-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName ?? 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-stone-100 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
