import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, TrendingUp, CheckCircle2, Clock, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLoader from './DashboardLoader';

interface ManagerStats {
  totalSalesTeam: number;
  totalAssignedProspects: number;
  completedThisWeek: number;
  pendingCallbacks: number;
  conversionRate: number;
  teamActivity: number;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ManagerStats>({
    totalSalesTeam: 0,
    totalAssignedProspects: 0,
    completedThisWeek: 0,
    pendingCallbacks: 0,
    conversionRate: 0,
    teamActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const salesResult = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'sales');

      const activityResult = await supabase
        .from('prospect_modifications')
        .select('*', { count: 'exact', head: true })
        .gte('modified_at', weekAgo);

      const salesCount = salesResult.count || 0;
      const assignedCount = 0; // À implémenter avec la table d'assignations
      const activityCount = activityResult.count || 0;
      const callbacksCount = 0; // À implémenter avec la table prospects_a_rappeler
      const completedCount = activityCount;

      setStats({
        totalSalesTeam: salesCount || 0,
        totalAssignedProspects: assignedCount || 0,
        completedThisWeek: completedCount || 0,
        pendingCallbacks: callbacksCount || 0,
        conversionRate: assignedCount ? Math.round(((completedCount || 0) / assignedCount) * 100) : 0,
        teamActivity: activityCount || 0,
      });
    } catch (error) {
      console.error('Error fetching manager stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardLoader />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Tableau de bord Manager</h1>
        <p className="text-muted-foreground">Suivi de l'équipe commerciale</p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe commerciale</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSalesTeam}</div>
            <p className="text-xs text-muted-foreground">
              Membres actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects assignés</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignedProspects}</div>
            <p className="text-xs text-muted-foreground">
              En cours de traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traités cette semaine</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              7 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rappels planifiés</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCallbacks}</div>
            <p className="text-xs text-muted-foreground">
              À effectuer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité équipe</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamActivity}</div>
            <p className="text-xs text-muted-foreground">
              Actions (7 derniers jours)
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Gestion de l'équipe et des prospects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/prospects')}
            >
              <Target className="h-4 w-4 mr-2" />
              Assigner des prospects
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/reports')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Voir les rapports
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/prospects/assigned')}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Suivre les prospects assignés
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance de l'équipe</CardTitle>
            <CardDescription>Indicateurs clés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Taux d'activité</span>
              <span className="text-sm font-medium">
                {stats.totalSalesTeam > 0 
                  ? Math.round((stats.teamActivity / stats.totalSalesTeam) * 10) / 10
                  : 0} actions/membre
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Prospects par membre</span>
              <span className="text-sm font-medium">
                {stats.totalSalesTeam > 0
                  ? Math.round(stats.totalAssignedProspects / stats.totalSalesTeam)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Objectif hebdomadaire</span>
              <span className="text-sm font-medium text-green-600">
                {stats.completedThisWeek >= 50 ? 'Atteint' : 'En cours'}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ManagerDashboard;
