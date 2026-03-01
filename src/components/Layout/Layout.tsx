import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="min-h-full">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
