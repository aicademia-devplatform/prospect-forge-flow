import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, TrendingUp, CheckCircle2, Clock, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLoader from './DashboardLoader';
import { TeamStatsCard } from './TeamStatsCard';

interface ManagerStats {
  totalSDRTeam: number;
  totalAssignedProspects: number;
  completedToday: number;
  pendingCallbacks: number;
  validatedProspects: number;
  conversionRate: number;
  teamActivity: number;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ManagerStats>({
    totalSDRTeam: 0,
    totalAssignedProspects: 0,
    completedToday: 0,
    pendingCallbacks: 0,
    validatedProspects: 0,
    conversionRate: 0,
    teamActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Récupérer le nombre de SDR dans l'équipe
      const { count: sdrCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'sdr');

      // Récupérer le total des prospects assignés actifs
      const { count: assignedCount } = await supabase
        .from('sales_assignments')
        .select('*', { count: 'exact', head: true });

      // Récupérer les prospects traités aujourd'hui
      const { count: completedTodayCount } = await supabase
        .from('prospects_traites')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', todayISO);

      // Récupérer les rappels planifiés
      const { count: callbacksCount } = await supabase
        .from('prospects_a_rappeler')
        .select('*', { count: 'exact', head: true });

      // Récupérer les prospects validés par les sales
      const { count: validatedCount } = await supabase
        .from('prospects_valides')
        .select('*', { count: 'exact', head: true });

      // Récupérer l'activité totale (traitements + rappels)
      const { data: traitesData } = await supabase
        .from('prospects_traites')
        .select('id');
      
      const { data: rappelData } = await supabase
        .from('prospects_a_rappeler')
        .select('id');

      const totalActivity = (traitesData?.length || 0) + (rappelData?.length || 0);

      // Calculer le taux de conversion (validés / assignés)
      const conversionRate = assignedCount && assignedCount > 0
        ? Math.round((validatedCount || 0) / assignedCount * 100)
        : 0;

      setStats({
        totalSDRTeam: sdrCount || 0,
        totalAssignedProspects: assignedCount || 0,
        completedToday: completedTodayCount || 0,
        pendingCallbacks: callbacksCount || 0,
        validatedProspects: validatedCount || 0,
        conversionRate: conversionRate,
        teamActivity: totalActivity,
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
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className="border-l-4 border-l-[hsl(var(--accent-blue))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/team-stats?type=team')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipe SDR</CardTitle>
              <div className="bg-[hsl(var(--accent-blue-light))] p-2 rounded-lg">
                <Users className="h-5 w-5 text-[hsl(var(--accent-blue))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSDRTeam}</div>
              <p className="text-xs text-muted-foreground">
                Membres actifs
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className="border-l-4 border-l-[hsl(var(--accent-green))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/team-stats?type=assigned')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects assignés</CardTitle>
              <div className="bg-[hsl(var(--accent-green-light))] p-2 rounded-lg">
                <Target className="h-5 w-5 text-[hsl(var(--accent-green))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignedProspects}</div>
              <p className="text-xs text-muted-foreground">
                En cours de traitement
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className="border-l-4 border-l-[hsl(var(--accent-purple))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/team-stats?type=completed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Traités aujourd'hui</CardTitle>
              <div className="bg-[hsl(var(--accent-purple-light))] p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--accent-purple))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">
                Prospects contactés
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className="border-l-4 border-l-[hsl(var(--accent-orange))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/team-stats?type=callbacks')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rappels planifiés</CardTitle>
              <div className="bg-[hsl(var(--accent-orange-light))] p-2 rounded-lg">
                <Phone className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCallbacks}</div>
              <p className="text-xs text-muted-foreground">
                À effectuer
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className="border-l-4 border-l-[hsl(var(--accent-pink))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/team-stats?type=validated')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects validés</CardTitle>
              <div className="bg-[hsl(var(--accent-pink-light))] p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.validatedProspects}</div>
              <p className="text-xs text-muted-foreground">
                RDV planifiés
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className="border-l-4 border-l-[hsl(var(--accent-cyan))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/team-stats?type=conversion')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <div className="bg-[hsl(var(--accent-cyan-light))] p-2 rounded-lg">
                <Clock className="h-5 w-5 text-[hsl(var(--accent-cyan))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Assignés → Validés
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Statistiques de l'équipe SDR */}
      <motion.div variants={itemVariants}>
        <TeamStatsCard />
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
              <span className="text-sm">Activité par SDR</span>
              <span className="text-sm font-medium">
                {stats.totalSDRTeam > 0 
                  ? Math.round((stats.teamActivity / stats.totalSDRTeam) * 10) / 10
                  : 0} actions/membre
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Prospects par SDR</span>
              <span className="text-sm font-medium">
                {stats.totalSDRTeam > 0
                  ? Math.round(stats.totalAssignedProspects / stats.totalSDRTeam)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Prospects validés</span>
              <span className="text-sm font-medium text-green-600">
                {stats.validatedProspects} RDV
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Performance</span>
              <span className="text-sm font-medium">
                {stats.conversionRate >= 30 ? '🔥 Excellent' : stats.conversionRate >= 15 ? '✅ Bon' : '⚠️ À améliorer'}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ManagerDashboard;
