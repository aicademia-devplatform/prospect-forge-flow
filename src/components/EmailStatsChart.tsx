import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface EmailStatsChartProps {
  stats: {
    total_sent: number;
    total_opens: number;
    total_clicks: number;
    total_hard_bounces: number;
    total_soft_bounces: number;
    total_unsubscribes: number;
    total_replies: number;
  };
  onViewAllContacts?: () => void;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  label: string;
}

export const EmailStatsChart: React.FC<EmailStatsChartProps> = ({
  stats,
  onViewAllContacts,
}) => {
  const totalBounces = stats.total_hard_bounces + stats.total_soft_bounces;

  // Si pas de données, afficher un message
  if (!stats || stats.total_sent === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📧</span>
            Email Statistics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            État des campagnes d'emailing par plateforme
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée de campagne disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartData[] = [
    {
      name: "Sent",
      value: stats.total_sent,
      color: "#3b82f6", // blue
      label: "Envoyés",
    },
    {
      name: "Opens",
      value: stats.total_opens,
      color: "#10b981", // green
      label: "Ouverts",
    },
    {
      name: "Clicks",
      value: stats.total_clicks,
      color: "#8b5cf6", // purple
      label: "Cliqués",
    },
    {
      name: "Bounces",
      value: totalBounces,
      color: "#f59e0b", // orange
      label: "Rebondis",
    },
  ];

  // Calculer les pourcentages basés sur le total envoyé (pas sur la somme des segments)
  const totalSent = stats.total_sent;
  const dataWithPercentages = chartData.map((item) => ({
    ...item,
    percentage: totalSent > 0 ? Math.round((item.value / totalSent) * 100) : 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.label}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} emails ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium">{entry.payload.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📧</span>
              Email Statistics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              État des campagnes d'emailing par plateforme
            </p>
          </div>
          {onViewAllContacts && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAllContacts}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Voir tous les contacts
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithPercentages}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dataWithPercentages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_sent}
              </div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.total_opens}
              </div>
              <div className="text-sm text-muted-foreground">Opens</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.total_clicks}
              </div>
              <div className="text-sm text-muted-foreground">Clicks</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalBounces}
              </div>
              <div className="text-sm text-muted-foreground">Bounces</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="gap-1">
              <span className="font-medium">Replies:</span>
              {stats.total_replies}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <span className="font-medium">Unsubscribes:</span>
              {stats.total_unsubscribes}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <span className="font-medium">Delivered:</span>
              {stats.total_sent - totalBounces}
            </Badge>
          </div>

          {/* Performance Rates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {Math.round((stats.total_opens / stats.total_sent) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Open Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {Math.round((stats.total_clicks / stats.total_sent) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Click Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {Math.round((totalBounces / stats.total_sent) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Bounce Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(
                  ((stats.total_sent - totalBounces) / stats.total_sent) * 100
                )}
                %
              </div>
              <div className="text-xs text-muted-foreground">Delivery Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
