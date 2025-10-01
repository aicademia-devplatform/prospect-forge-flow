import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2, Clock, Phone, TrendingUp, ListTodo } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLoader from './DashboardLoader';

interface SalesStats {
  assignedToMe: number;
  completedThisWeek: number;
  pendingCallbacks: number;
  toProcess: number;
  completionRate: number;
  myActivity: number;
}

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<SalesStats>({
    assignedToMe: 0,
    completedThisWeek: 0,
    pendingCallbacks: 0,
    toProcess: 0,
    completionRate: 0,
    myActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const activityResult = await supabase
        .from('prospect_modifications')
        .select('*', { count: 'exact', head: true })
        .eq('modified_by', user.id)
        .gte('modified_at', weekAgo);

      const assignedCount = 0; // À implémenter avec la table d'assignations
      const activityCount = activityResult.count || 0;
      const callbacksCount = 0; // À implémenter avec la table prospects_a_rappeler
      const completedCount = activityCount;
      const toProcessCount = Math.max(0, assignedCount - completedCount);

      const totalAssigned = assignedCount || 0;
      const completed = completedCount || 0;

      setStats({
        assignedToMe: totalAssigned,
        completedThisWeek: completed,
        pendingCallbacks: callbacksCount || 0,
        toProcess: toProcessCount || 0,
        completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0,
        myActivity: activityCount || 0,
      });
    } catch (error) {
      console.error('Error fetching sales stats:', error);
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
        <h1 className="text-3xl font-bold">Tableau de bord Commercial</h1>
        <p className="text-muted-foreground">Suivez vos prospects et objectifs</p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes prospects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedToMe}</div>
            <p className="text-xs text-muted-foreground">
              Assignés au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À traiter</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.toProcess}</div>
            <p className="text-xs text-muted-foreground">
              En attente d'action
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
            <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mon activité</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myActivity}</div>
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
            <CardDescription>Accédez rapidement à vos tâches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/prospects/assigned')}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Voir mes prospects assignés
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/prospects')}
            >
              <Target className="h-4 w-4 mr-2" />
              Explorer tous les prospects
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/reports')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Consulter mes rapports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectifs personnels</CardTitle>
            <CardDescription>Votre progression</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Objectif hebdomadaire</span>
              <span className="text-sm font-medium">
                {stats.completedThisWeek} / 20
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Progression</span>
              <span className="text-sm font-medium">
                {Math.min(Math.round((stats.completedThisWeek / 20) * 100), 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Statut</span>
              <span className={`text-sm font-medium ${
                stats.completedThisWeek >= 20 
                  ? 'text-green-600' 
                  : stats.completedThisWeek >= 10 
                  ? 'text-orange-600' 
                  : 'text-muted-foreground'
              }`}>
                {stats.completedThisWeek >= 20 
                  ? 'Objectif atteint !' 
                  : stats.completedThisWeek >= 10 
                  ? 'En bonne voie' 
                  : 'Continuez !'}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SalesDashboard;
