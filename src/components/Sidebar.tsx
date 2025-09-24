import React from 'react';
import { BarChart3, Users, Settings, FileText, Upload, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navigation = [
  { name: 'Dashboard', icon: BarChart3, active: true },
  { name: 'Prospects', icon: Users, active: false },
  { name: 'Import Data', icon: Upload, active: false },
  { name: 'Reports', icon: FileText, active: false },
];

const adminNavigation = [
  { name: 'Data Sources', icon: Database, active: false },
  { name: 'Settings', icon: Settings, active: false },
];

export const Sidebar = () => {
  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">SalesCRM</span>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant={item.active ? "default" : "ghost"}
                className={`w-full justify-start ${
                  item.active 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </nav>

        <Separator className="my-6 bg-sidebar-border" />

        <div className="space-y-1">
          <p className="text-xs font-medium text-sidebar-foreground/70 px-3 pb-2">
            ADMINISTRATION
          </p>
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="p-3">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs font-medium text-sidebar-accent-foreground">
            Connect to Supabase
          </p>
          <p className="text-xs text-sidebar-accent-foreground/70 mt-1">
            Enable real-time collaboration and data sync
          </p>
          <Button size="sm" className="w-full mt-2 bg-primary hover:bg-primary-hover">
            Connect Now
          </Button>
        </div>
      </div>
    </div>
  );
};