import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, CheckCircle, Clock, List } from 'lucide-react';

interface TeamStats {
  sdr_id: string;
  sdr_email: string;
  sdr_name: string;
  total_assigned_prospects: number;
  prospects_contacted_today: number;
  prospects_validated: number;
  last_activity: string | null;
}

export const TeamStatsCard = () => {
  const navigate = useNavigate();
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamStats();
  }, []);

  const loadTeamStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_manager_team_stats', { manager_user_id: user.id });

      if (error) throw error;

      setTeamStats(data || []);
    } catch (error) {
      console.error('Error loading team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStats = () => {
    return {
      totalProspects: teamStats.reduce((sum, stat) => sum + Number(stat.total_assigned_prospects), 0),
      totalContactedToday: teamStats.reduce((sum, stat) => sum + Number(stat.prospects_contacted_today), 0),
      totalValidated: teamStats.reduce((sum, stat) => sum + Number(stat.prospects_validated), 0),
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totals = getTotalStats();

  return (
    <div className="space-y-4">
      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects Assignés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalProspects}</div>
            <p className="text-xs text-muted-foreground">À toute l'équipe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactés Aujourd'hui</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalContactedToday}</div>
            <p className="text-xs text-muted-foreground">Par toute l'équipe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects Validés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalValidated}</div>
            <p className="text-xs text-muted-foreground">Total convertis</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé par SDR */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performances de l'équipe</CardTitle>
              <CardDescription>
                Statistiques détaillées de vos {teamStats.length} SDR
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/all-assigned-prospects')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Voir tous les prospects
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun SDR assigné à votre équipe
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SDR</TableHead>
                    <TableHead className="text-right">Assignés</TableHead>
                    <TableHead className="text-right">Contactés aujourd'hui</TableHead>
                    <TableHead className="text-right">Validés</TableHead>
                    <TableHead className="text-right">Dernière activité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamStats.map((stat) => (
                    <TableRow key={stat.sdr_id}>
                      <TableCell className="font-medium">{stat.sdr_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{stat.total_assigned_prospects}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={Number(stat.prospects_contacted_today) > 0 ? "default" : "secondary"}>
                          {stat.prospects_contacted_today}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{stat.prospects_validated}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {stat.last_activity 
                            ? new Date(stat.last_activity).toLocaleDateString('fr-FR')
                            : 'Aucune'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
