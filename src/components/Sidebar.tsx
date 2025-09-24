import React from 'react';
import { BarChart3, Users, Upload, FileText, Database, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Dashboard', icon: BarChart3, active: false },
  { name: 'Prospects', icon: Users, active: true },
  { name: 'Import Data', icon: Upload, active: false },
  { name: 'Reports', icon: FileText, active: false },
];

const adminNavigation = [
  { name: 'Data Sources', icon: Database, active: false },
  { name: 'Settings', icon: Settings, active: false },
];

export const Sidebar = () => {
  return (
    <TooltipProvider>
      <div className="flex h-full w-16 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex h-16 items-center justify-center px-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        
        <div className="flex-1 px-2 py-4">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <button
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        item.active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="my-6 h-px bg-sidebar-border" />

          <div className="space-y-2">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <button
                      className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};