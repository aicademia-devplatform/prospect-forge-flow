import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeSection={getActiveSection()} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;