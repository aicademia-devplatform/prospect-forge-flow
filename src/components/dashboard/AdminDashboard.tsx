import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, CheckCircle, Bell, TrendingUp, Activity, GripVertical, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DashboardLoader from './DashboardLoader';
import { useDashboardLayout, DashboardCard } from '@/hooks/useDashboardLayout';

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

  const initialCards: DashboardCard[] = [
    { id: 'users', type: 'users', row: 1 },
    { id: 'assignments', type: 'assignments', row: 1 },
    { id: 'notifications', type: 'notifications', row: 1 },
    { id: 'prospects', type: 'prospects', row: 2 },
    { id: 'activity', type: 'activity', row: 3 },
    { id: 'rate', type: 'rate', row: 3 },
  ];

  const { cards, reorderCards, resetLayout } = useDashboardLayout(
    initialCards,
    'admin-dashboard-layout'
  );

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderCards(result.source.index, result.destination.index);
  };

  const renderCard = (card: DashboardCard, index: number) => {
    const cardConfig: Record<string, { title: string; icon: any; value: number | string; subtitle: string }> = {
      users: {
        title: 'Utilisateurs',
        icon: Users,
        value: stats.totalUsers,
        subtitle: `${stats.activeUsers} avec rôle actif`
      },
      assignments: {
        title: 'Assignations',
        icon: CheckCircle,
        value: stats.totalAssignments,
        subtitle: 'Prospects assignés'
      },
      notifications: {
        title: 'Notifications',
        icon: Bell,
        value: stats.totalNotifications,
        subtitle: 'Total des notifications'
      },
      prospects: {
        title: 'Prospects',
        icon: Database,
        value: stats.totalProspects,
        subtitle: 'Dans la base de données'
      },
      activity: {
        title: 'Activité récente',
        icon: Activity,
        value: stats.recentActivities,
        subtitle: 'Actions (7 derniers jours)'
      },
      rate: {
        title: 'Taux d\'assignation',
        icon: TrendingUp,
        value: `${stats.totalProspects > 0 ? Math.round((stats.totalAssignments / stats.totalProspects) * 100) : 0}%`,
        subtitle: `${stats.totalAssignments} / ${stats.totalProspects}`
      }
    };

    const config = cardConfig[card.type];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Draggable key={card.id} draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={snapshot.isDragging ? 'opacity-50' : ''}
          >
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card className="relative group">
                <div
                  {...provided.dragHandleProps}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{config.value}</div>
                  <p className="text-xs text-muted-foreground">{config.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </Draggable>
    );
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-6 space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord Administrateur</h1>
            <p className="text-muted-foreground">Vue d'ensemble du système</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetLayout}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </motion.div>

        <Droppable droppableId="dashboard-cards">
          {(provided) => (
            <motion.div
              variants={itemVariants}
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid gap-4 grid-cols-1 md:grid-cols-3"
            >
              {cards.map((card, index) => renderCard(card, index))}
              {provided.placeholder}
            </motion.div>
          )}
        </Droppable>

        <motion.div
          variants={itemVariants}
          className="grid gap-4 md:grid-cols-2"
        >
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
        </motion.div>
      </motion.div>
    </DragDropContext>
  );
};

export default AdminDashboard;
