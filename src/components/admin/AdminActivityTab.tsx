import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';
import 'moment/locale/fr';

interface Activity {
  id: string;
  lead_email: string;
  modified_by: string;
  modified_at: string;
  notes: string | null;
  modified_fields: any;
  user_email?: string;
}

const AdminActivityTab = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moment.locale('fr');
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);

      // Charger les modifications
      const { data: modifications, error: modsError } = await supabase
        .from('prospect_modifications')
        .select('*')
        .order('modified_at', { ascending: false })
        .limit(50);

      if (modsError) throw modsError;

      // Charger les profils pour obtenir les emails
      const userIds = modifications?.map(m => m.modified_by) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combiner les données
      const activitiesWithUsers = (modifications || []).map(mod => ({
        ...mod,
        user_email: profiles?.find(p => p.id === mod.modified_by)?.email
      }));

      setActivities(activitiesWithUsers);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'historique',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (fields: any) => {
    if (!fields) return 'Modification';
    if (fields.action === 'email_reminder_sent') return 'Email de rappel envoyé';
    if (fields.action === 'status_update') return 'Mise à jour du statut';
    if (fields.action === 'assignment') return 'Assignation';
    return 'Modification';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal d'activité</CardTitle>
        <CardDescription>
          Historique des actions et modifications ({activities.length} entrées)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="rounded-full bg-primary/10 p-2">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getActionLabel(activity.modified_fields)}
                          </Badge>
                          <span className="text-sm font-medium">
                            {activity.lead_email}
                          </span>
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-muted-foreground">
                            {activity.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.user_email || 'Système'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {moment(activity.modified_at).fromNow()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminActivityTab;
