import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrevoSyncManager } from "@/components/BrevoSyncManager";
import { Database, BarChart3, Users, Mail, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const BrevoManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("sync");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Brevo</h1>
          <p className="text-muted-foreground">
            Synchronisation et analyse des données Brevo avec votre CRM
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Synchronisation
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-6">
          <BrevoSyncManager />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacts Brevo unifiés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Vue unifiée des contacts avec toutes les données Brevo
                synchronisées.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  SELECT * FROM v_brevo_crm_unified WHERE email IS NOT NULL
                  LIMIT 100;
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performances des campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Analyse des performances de vos campagnes email Brevo.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  SELECT * FROM v_brevo_campaign_performance ORDER BY sent_date
                  DESC;
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques globales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Vue d'ensemble des métriques Brevo.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  SELECT * FROM v_brevo_global_stats;
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
