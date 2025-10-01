import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Database, Activity, Settings as SettingsIcon, TrendingUp, UserCheck, FileText, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminStatsTab from '@/components/admin/AdminStatsTab';
import AdminProspectsTab from '@/components/admin/AdminProspectsTab';
import AdminActivityTab from '@/components/admin/AdminActivityTab';
import AdminSettingsTab from '@/components/admin/AdminSettingsTab';

interface Stats {
  totalUsers: number;
  totalProspects: number;
  totalAssignments: number;
  totalNotifications: number;
  activeUsers: number;
  recentActivities: number;
}

const AdminPanel = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProspects: 0,
    totalAssignments: 0,
    totalNotifications: 0,
    activeUsers: 0,
    recentActivities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Count users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Count prospects
      const { count: prospectsCount } = await supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: true });

      // Count assignments
      const { count: assignmentsCount } = await supabase
        .from('sales_assignments')
        .select('*', { count: 'exact', head: true });

      // Count notifications
      const { count: notificationsCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      // Count active users (with role)
      const { count: activeUsersCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      // Count recent activities (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentActivitiesCount } = await supabase
        .from('prospect_modifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      setStats({
        totalUsers: usersCount || 0,
        totalProspects: prospectsCount || 0,
        totalAssignments: assignmentsCount || 0,
        totalNotifications: notificationsCount || 0,
        activeUsers: activeUsersCount || 0,
        recentActivities: recentActivitiesCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administration</h1>
            <p className="text-muted-foreground">Gestion complète du système CRM</p>
          </div>
          {userRole && (
            <Badge variant="default" className="text-sm">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} actifs
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
                {stats.totalAssignments} assignés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activité</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivities}</div>
              <p className="text-xs text-muted-foreground">
                7 derniers jours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="users">
              <UserCheck className="h-4 w-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="prospects">
              <Database className="h-4 w-4 mr-2" />
              Prospects
            </TabsTrigger>
            <TabsTrigger value="activity">
              <FileText className="h-4 w-4 mr-2" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminStatsTab stats={stats} loading={loading} onRefresh={loadStats} />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="prospects">
            <AdminProspectsTab />
          </TabsContent>

          <TabsContent value="activity">
            <AdminActivityTab />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
