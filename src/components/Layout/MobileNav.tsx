import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Calendar,
  CheckSquare,
  BookOpen,
  Package,
} from 'lucide-react';
import clsx from 'clsx';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/seeds', icon: Sprout, label: 'Seeds' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/inventory', icon: Package, label: 'Seed Inventory' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav md:hidden bg-white border-t border-stone-200 safe-area-inset-bottom">
      <div className="grid grid-cols-6 py-1">
        {mobileNavItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 py-2 px-1 transition-colors duration-150',
                isActive ? 'text-garden-600' : 'text-gray-400'
              )
            }
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
