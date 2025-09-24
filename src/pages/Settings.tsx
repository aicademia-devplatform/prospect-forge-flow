import React from 'react';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { userRole } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="flex items-center space-x-4">
            {userRole && (
              <span className="text-sm text-muted-foreground">
                Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
            <UserMenu />
          </div>
        </div>
        <div className="text-center py-12">
          <h2 className="text-lg text-muted-foreground">
            Paramètres à venir
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Settings;