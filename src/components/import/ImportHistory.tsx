import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ImportHistory = () => {
  const { user } = useAuth();
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImports = async () => {
      if (!user) return;

      try {
        const { data, error } = await (supabase as any)
          .from('import_history')
          .select(`
            *,
            profiles!import_history_user_id_fkey (
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setImports(data || []);
      } catch (error) {
        console.error('Error fetching import history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImports();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('import_history_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'import_history' }, () => {
        fetchImports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-[hsl(var(--accent-green))] hover:bg-[hsl(var(--accent-green))]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Réussi
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Échoué
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Historique des importations
          </CardTitle>
          <CardDescription>
            Suivez l'historique de vos importations de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Table cible</TableHead>
                  <TableHead>Lignes importées</TableHead>
                  <TableHead>Échecs</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-medium">{imp.file_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{imp.target_table}</Badge>
                    </TableCell>
                    <TableCell>{imp.success_rows?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      {imp.failed_rows > 0 ? (
                        <span className="text-destructive">{imp.failed_rows}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(imp.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(imp.created_at).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {imp.profiles?.email || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune importation pour le moment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ImportHistory;
