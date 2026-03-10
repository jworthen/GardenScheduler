import { ReactNode } from 'react';
import { Leaf, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import GardenSwitcher from '../GardenSwitcher';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Mobile top header */}
        <header className="md:hidden bg-white border-b border-stone-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 bg-garden-600 rounded-lg">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">Last Frost</span>
            </div>
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-garden-600 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{initials}</span>
                </div>
              )}
              <button
                onClick={signOut}
                title="Sign out"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-stone-100 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
          {/* Garden switcher row — only renders when multiple gardens exist */}
          <GardenSwitcher />
        </header>

        <div className="min-h-full">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
