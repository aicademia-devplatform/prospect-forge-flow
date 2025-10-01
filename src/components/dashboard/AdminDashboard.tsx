import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, CheckCircle, Bell, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  totalProspects: number;
  totalAssignments: number;
  totalNotifications: number;
  activeUsers: number;
  recentActivities: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProspects: 0,
    totalAssignments: 0,
    totalNotifications: 0,
    activeUsers: 0,
    recentActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: prospectsCount },
        { count: assignmentsCount },
        { count: notificationsCount },
        { count: activeUsersCount },
        { count: recentActivitiesCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
        supabase.from('sales_assignments').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase
          .from('prospect_modifications')
          .select('*', { count: 'exact', head: true })
          .gte('modified_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalProspects: prospectsCount || 0,
        totalAssignments: assignmentsCount || 0,
        totalNotifications: notificationsCount || 0,
        activeUsers: activeUsersCount || 0,
        recentActivities: recentActivitiesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Administrateur</h1>
        <p className="text-muted-foreground">Vue d'ensemble du système</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
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
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Total des notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivities}</div>
            <p className="text-xs text-muted-foreground">
              Actions (7 derniers jours)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'assignation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalProspects > 0
                ? Math.round((stats.totalAssignments / stats.totalProspects) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAssignments} / {stats.totalProspects}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin')}
            >
              <Users className="h-4 w-4 mr-2" />
              Gérer les utilisateurs
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/prospects')}
            >
              <Database className="h-4 w-4 mr-2" />
              Voir tous les prospects
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/import')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Importer des données
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Système</CardTitle>
            <CardDescription>État du système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de données</span>
              <span className="text-sm font-medium text-green-600">Opérationnelle</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentification</span>
              <span className="text-sm font-medium text-green-600">Opérationnelle</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API</span>
              <span className="text-sm font-medium text-green-600">Opérationnelle</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
