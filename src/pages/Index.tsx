import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ProspectTable } from '@/components/ProspectTable';

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <DashboardHeader />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Prospects</h2>
            </div>
            <ProspectTable />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
