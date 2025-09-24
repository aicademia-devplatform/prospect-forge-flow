import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ProspectTable } from '@/components/ProspectTable';
import UserMenu from '@/components/UserMenu';
import DataSources from './DataSources';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { userRole } = useAuth();
  const [activeSection, setActiveSection] = useState('prospects');

  const renderContent = () => {
    switch (activeSection) {
      case 'datasources':
        return <DataSources />;
      case 'prospects':
      default:
        return (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Prospects</h1>
                <div className="flex items-center space-x-4">
                  {userRole && (
                    <span className="text-sm text-muted-foreground">
                      Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </span>
                  )}
                  <UserMenu />
                </div>
              </div>
              <ProspectTable />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
