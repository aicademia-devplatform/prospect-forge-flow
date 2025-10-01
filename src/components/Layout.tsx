import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
import UserMenu from '@/components/UserMenu';

interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  return <div className="flex h-screen bg-background">
      <Sidebar />
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