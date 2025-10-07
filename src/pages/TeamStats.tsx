import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Target, CheckCircle2, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface SDRStats {
  sdr_id: string;
  sdr_email: string;
  sdr_name: string;
  total_assigned_prospects: number;
  prospects_contacted_today: number;
  prospects_validated: number;
  last_activity: string;
}

const TeamStats = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const statType = searchParams.get('type') || 'conversion';
  const [stats, setStats] = useState<SDRStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase.rpc('get_manager_team_stats', {
        manager_user_id: user.id
      });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour les graphiques
  const chartData = stats.map(sdr => ({
    name: sdr.sdr_name.split(' ')[0], // Premier prénom
    assigned: sdr.total_assigned_prospects,
    contacted: sdr.prospects_contacted_today,
    validated: sdr.prospects_validated,
    conversion: sdr.total_assigned_prospects > 0 
      ? Math.round((sdr.prospects_validated / sdr.total_assigned_prospects) * 100) 
      : 0
  }));

  const totalStats = {
    totalAssigned: stats.reduce((sum, s) => sum + s.total_assigned_prospects, 0),
    totalContacted: stats.reduce((sum, s) => sum + s.prospects_contacted_today, 0),
    totalValidated: stats.reduce((sum, s) => sum + s.prospects_validated, 0),
  };

  const pieData = [
    { name: 'Validés', value: totalStats.totalValidated, color: 'hsl(var(--accent-green))' },
    { name: 'Contactés', value: totalStats.totalContacted, color: 'hsl(var(--accent-blue))' },
    { name: 'En attente', value: totalStats.totalAssigned - totalStats.totalValidated - totalStats.totalContacted, color: 'hsl(var(--accent-orange))' }
  ];

  const conversionRate = totalStats.totalAssigned > 0 
    ? Math.round((totalStats.totalValidated / totalStats.totalAssigned) * 100) 
    : 0;

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
        duration: 0.5
      }
    }
  };

  const getStatTitle = () => {
    switch(statType) {
      case 'conversion': return 'Taux de conversion';
      case 'team': return 'Équipe commerciale';
      case 'assigned': return 'Prospects assignés';
      case 'completed': return 'Traités cette semaine';
      case 'callbacks': return 'Rappels planifiés';
      case 'activity': return 'Activité équipe';
      default: return 'Statistiques détaillées';
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{getStatTitle()}</h1>
          <p className="text-muted-foreground">Analyse détaillée de la performance</p>
        </div>
      </motion.div>

      {/* Résumé des KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-l-4 border-l-[hsl(var(--accent-pink))]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalStats.totalValidated} / {totalStats.totalAssigned} prospects
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-l-4 border-l-[hsl(var(--accent-blue))]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
              <Users className="h-5 w-5 text-[hsl(var(--accent-blue))]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.length}</div>
              <p className="text-xs text-muted-foreground">SDR dans l'équipe</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-l-4 border-l-[hsl(var(--accent-green))]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects assignés</CardTitle>
              <Target className="h-5 w-5 text-[hsl(var(--accent-green))]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStats.totalAssigned}</div>
              <p className="text-xs text-muted-foreground">Total assignés</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-l-4 border-l-[hsl(var(--accent-purple))]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects validés</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--accent-purple))]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStats.totalValidated}</div>
              <p className="text-xs text-muted-foreground">Succès</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Performance par SDR</CardTitle>
              <CardDescription>Comparaison des prospects assignés et validés</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="assigned" 
                    name="Assignés" 
                    fill="hsl(var(--accent-blue))"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="validated" 
                    name="Validés" 
                    fill="hsl(var(--accent-green))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Taux de conversion par SDR</CardTitle>
              <CardDescription>Pourcentage de prospects validés</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent-pink))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--accent-pink))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="conversion" 
                    name="Conversion (%)"
                    stroke="hsl(var(--accent-pink))" 
                    fillOpacity={1} 
                    fill="url(#colorConversion)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Distribution des prospects</CardTitle>
              <CardDescription>Répartition globale de l'équipe</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Activité aujourd'hui</CardTitle>
              <CardDescription>Prospects contactés par SDR</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="contacted" 
                    name="Contactés aujourd'hui"
                    stroke="hsl(var(--accent-orange))" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: "hsl(var(--accent-orange))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TeamStats;
