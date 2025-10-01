import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Users, Upload, FileText, Database, Settings, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';


const navigation = [
  { name: 'Dashboard', icon: BarChart3, key: 'dashboard', path: '/', permission: 'view_prospects' },
  { name: 'Prospects', icon: Users, key: 'prospects', path: '/prospects', permission: 'view_prospects' },
  { name: 'Import Data', icon: Upload, key: 'import', path: '/import', permission: 'create_prospects' },
  { name: 'Reports', icon: FileText, key: 'reports', path: '/reports', permission: 'view_prospects', disabled: true },
];

const adminNavigation = [
  { name: 'Data Sources', icon: Database, key: 'datasources', path: '/datasources', permission: 'manage_settings' },
  { name: 'Admin Panel', icon: ShieldCheck, key: 'admin', path: '/admin', permission: 'access_admin_panel' },
  { name: 'Settings', icon: Settings, key: 'settings', path: '/settings', permission: 'manage_settings', disabled: true },
];

export const Sidebar = () => {
  const { hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));
  const filteredAdminNavigation = adminNavigation.filter(item => hasPermission(item.permission));

  // Fonction pour vérifier si un item est actif en fonction de la route
  const isItemActive = (itemPath: string) => {
    const currentPath = location.pathname;
    
    // Pour la page d'accueil
    if (itemPath === '/') {
      return currentPath === '/';
    }
    
    // Pour le menu Prospects, inclure toutes les sous-routes
    if (itemPath === '/prospects') {
      return currentPath === '/prospects' || currentPath.startsWith('/prospects/');
    }
    
    // Pour les autres routes
    return currentPath.startsWith(itemPath);
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}>
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">CRM</span>
            </Link>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 flex-shrink-0"
            title={isCollapsed ? "Élargir la sidebar" : "Rétrécir la sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex-1 px-2 py-4">
          <nav className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);
              
              if (item.disabled) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-not-allowed opacity-60",
                          "text-sidebar-foreground",
                          isCollapsed && "justify-center"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              
              return (
                <Tooltip key={item.name} delayDuration={isCollapsed ? 0 : 9999}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isCollapsed && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  )}
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
                  const isActive = isItemActive(item.path);
                  
                  if (item.disabled) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-not-allowed opacity-60",
                              "text-sidebar-foreground",
                              isCollapsed && "justify-center"
                            )}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Coming Soon</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  
                  return (
                    <Tooltip key={item.name} delayDuration={isCollapsed ? 0 : 9999}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            isCollapsed && "justify-center"
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <p>{item.name}</p>
                        </TooltipContent>
                      )}
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