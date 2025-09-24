import React from 'react';
import { Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Prospects',
    value: '2,847',
    change: '+12%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Qualified Leads',
    value: '342',
    change: '+8%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Pipeline Value',
    value: '$1.2M',
    change: '+23%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    title: 'This Month',
    value: '89',
    change: '-2%',
    trend: 'down',
    icon: Calendar,
  },
];

export const DashboardHeader = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground">
          Track and manage your sales prospects and pipeline
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${
                  stat.trend === 'up' ? 'text-success' : 'text-danger'
                }`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};