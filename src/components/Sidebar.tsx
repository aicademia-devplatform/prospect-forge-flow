import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Users, Upload, FileText, Database, Settings, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';


const navigation = [
  { name: 'Dashboard', icon: BarChart3, key: 'dashboard', path: '/', permission: 'view_prospects' },
  { name: 'Prospects', icon: Users, key: 'prospects', path: '/prospects', permission: 'view_prospects' },
  { name: 'Import Data', icon: Upload, key: 'import', path: '/import', permission: 'create_prospects' },
  { name: 'Reports', icon: FileText, key: 'reports', path: '/reports', permission: 'view_prospects' },
];

const adminNavigation = [
  { name: 'Data Sources', icon: Database, key: 'datasources', path: '/datasources', permission: 'manage_settings' },
  { name: 'Admin Panel', icon: ShieldCheck, key: 'admin', path: '/admin', permission: 'access_admin_panel' },
  { name: 'Settings', icon: Settings, key: 'settings', path: '/settings', permission: 'manage_settings' },
];

export const Sidebar = ({ activeSection = 'dashboard' }: { activeSection?: string }) => {
  const { hasPermission } = useAuth();

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));
  const filteredAdminNavigation = adminNavigation.filter(item => hasPermission(item.permission));

  return (
    <TooltipProvider>
      <div className="flex h-full w-16 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex h-16 items-center justify-center px-2">
          <Link to="/">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        </div>
        
        <div className="flex-1 px-2 py-4">
          <nav className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        activeSection === item.key
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {filteredAdminNavigation.length > 0 && (
            <>
              <div className="my-6 h-px bg-sidebar-border" />

              <div className="space-y-2">
                {filteredAdminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                            activeSection === item.key
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};