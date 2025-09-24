import React from 'react';
import { ProspectTable } from '@/components/ProspectTable';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';

const Prospects = () => {
  const { userRole } = useAuth();

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
};

export default Prospects;