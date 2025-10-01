import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
import UserMenu from '@/components/UserMenu';
import { useLocation } from 'react-router-dom';
interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const location = useLocation();

  // Déterminer la section active basée sur l'URL
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path === '/prospects') return 'prospects';
    if (path === '/import') return 'import';
    if (path === '/reports') return 'reports';
    if (path === '/datasources') return 'datasources';
    if (path === '/admin') return 'admin';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };
  return <div className="flex h-screen bg-background">
      <Sidebar activeSection={getActiveSection()} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-background px-6 py-3 flex items-center justify-end gap-4">
          <NotificationBell />
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto p-10">
          {children}
        </main>
      </div>
    </div>;
};
export default Layout;