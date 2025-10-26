import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Database,
  Users,
  Mail,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SyncStatus {
  last_sync: string | null;
  brevo_contacts: number;
  crm_brevo_contacts: number;
  matching_contacts: number;
  active_lists: number;
  total_campaigns: number;
  email_events: number;
}

interface SyncResult {
  timestamp: string;
  contacts: {
    updated: number;
    inserted: number;
    errors: number;
  };
  lists: {
    processed: number;
  };
  stats: {
    updated: number;
  };
  summary: {
    total_brevo_contacts: number;
    total_crm_contacts: number;
    active_lists: number;
    total_campaigns: number;
  };
}

export const BrevoSyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  // Charger le statut initial
  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc("get_brevo_sync_status");

      if (error) throw error;

      setSyncStatus(data as unknown as SyncStatus);
    } catch (error) {
      console.error("Erreur lors du chargement du statut:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le statut de synchronisation.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async (
    syncType: "all" | "contacts" | "lists" | "stats" = "all"
  ) => {
    try {
      setIsSyncing(true);

      // Appeler la fonction de synchronisation
      const { data, error } = await supabase.rpc("trigger_brevo_sync");

      if (error) throw error;

      setLastSyncResult(data as unknown as SyncResult);

      // Recharger le statut
      await loadSyncStatus();

      toast({
        title: "Synchronisation terminée",
        description: `Synchronisation Brevo effectuée avec succès.`,
      });
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    return new Date(dateString).toLocaleString("fr-FR");
  };

  const getSyncStatusColor = () => {
    if (!syncStatus) return "secondary";
    const lastSync = syncStatus.last_sync;
    if (!lastSync) return "destructive";

    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const diffHours =
      (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return "default";
    if (diffHours < 24) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement du statut de synchronisation...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statut de synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statut de synchronisation Brevo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Dernière synchronisation :
                </span>
                <Badge variant={getSyncStatusColor()}>
                  {formatDate(syncStatus.last_sync)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Contacts</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {syncStatus.brevo_contacts}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {syncStatus.matching_contacts} correspondances
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Mail className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Listes</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {syncStatus.active_lists}
                  </div>
                  <div className="text-xs text-muted-foreground">actives</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Campagnes</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {syncStatus.total_campaigns}
                  </div>
                  <div className="text-xs text-muted-foreground">total</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Database className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Événements</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {syncStatus.email_events}
                  </div>
                  <div className="text-xs text-muted-foreground">trackés</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions de synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => triggerSync("all")}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Synchronisation complète
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerSync("contacts")}
              disabled={isSyncing}
            >
              Contacts uniquement
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerSync("lists")}
              disabled={isSyncing}
            >
              Listes uniquement
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerSync("stats")}
              disabled={isSyncing}
            >
              Statistiques uniquement
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadSyncStatus}
            disabled={isLoading}
          >
            Actualiser le statut
          </Button>
        </CardContent>
      </Card>

      {/* Résultat de la dernière synchronisation */}
      {lastSyncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Dernière synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {formatDate(lastSyncResult.timestamp)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Contacts</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Mis à jour :</span>
                      <Badge variant="default">
                        {lastSyncResult.contacts.updated}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Insérés :</span>
                      <Badge variant="secondary">
                        {lastSyncResult.contacts.inserted}
                      </Badge>
                    </div>
                    {lastSyncResult.contacts.errors > 0 && (
                      <div className="flex justify-between">
                        <span>Erreurs :</span>
                        <Badge variant="destructive">
                          {lastSyncResult.contacts.errors}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Listes</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Traitées :</span>
                      <Badge variant="default">
                        {lastSyncResult.lists.processed}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Statistiques</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Mises à jour :</span>
                      <Badge variant="default">
                        {lastSyncResult.stats.updated}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur les vues disponibles */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Vues disponibles :</strong> Utilisez les vues{" "}
          <code>v_brevo_crm_unified</code>,<code>v_brevo_global_stats</code> et{" "}
          <code>v_brevo_campaign_performance</code>
          pour analyser vos données Brevo synchronisées.
        </AlertDescription>
      </Alert>
    </div>
  );
};
