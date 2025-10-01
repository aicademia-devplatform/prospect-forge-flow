import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, Database, Bell, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalUsers: number;
  totalProspects: number;
  totalAssignments: number;
  totalNotifications: number;
  activeUsers: number;
  recentActivities: number;
}

interface AdminStatsTabProps {
  stats: Stats;
  loading: boolean;
  onRefresh: () => void;
}

const AdminStatsTab: React.FC<AdminStatsTabProps> = ({ stats, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vue d'ensemble</h2>
          <p className="text-muted-foreground">Statistiques globales du système</p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} avec rôle actif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProspects}</div>
            <p className="text-xs text-muted-foreground">
              Dans la base de données
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignations</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Prospects assignés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Total des notifications
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Modifications et actions des 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-3xl font-bold">{stats.recentActivities}</div>
              <p className="text-sm text-muted-foreground">Actions enregistrées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Taux d'assignation</CardTitle>
            <CardDescription>Prospects assignés / Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalProspects > 0
                ? Math.round((stats.totalAssignments / stats.totalProspects) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.totalAssignments} sur {stats.totalProspects} prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs actifs</CardTitle>
            <CardDescription>Avec rôle assigné</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalUsers > 0
                ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.activeUsers} sur {stats.totalUsers} utilisateurs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStatsTab;
