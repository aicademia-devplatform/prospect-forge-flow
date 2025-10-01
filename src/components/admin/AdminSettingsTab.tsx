import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Mail, Bell, Database, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSettingsTab = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoAssignment, setAutoAssignment] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  const handleSaveSettings = () => {
    toast({
      title: 'Paramètres sauvegardés',
      description: 'Vos modifications ont été enregistrées'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications Email
          </CardTitle>
          <CardDescription>
            Configuration des notifications par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Activer les notifications</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications par email pour les événements importants
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="smtp-server">Serveur SMTP</Label>
            <Input id="smtp-server" placeholder="smtp.gmail.com" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Port</Label>
              <Input id="smtp-port" placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-user">Utilisateur</Label>
              <Input id="smtp-user" placeholder="email@example.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Assignations
          </CardTitle>
          <CardDescription>
            Paramètres d'assignation des prospects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-assignment">Assignation automatique</Label>
              <p className="text-sm text-muted-foreground">
                Assigner automatiquement les nouveaux prospects
              </p>
            </div>
            <Switch
              id="auto-assignment"
              checked={autoAssignment}
              onCheckedChange={setAutoAssignment}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="max-assignments">Nombre maximum d'assignations par utilisateur</Label>
            <Input 
              id="max-assignments" 
              type="number" 
              placeholder="100" 
              defaultValue="100"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Paramètres de sécurité et permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-approval">Approbation requise</Label>
              <p className="text-sm text-muted-foreground">
                Nécessite l'approbation d'un admin pour les nouvelles inscriptions
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Durée de session (minutes)</Label>
            <Input 
              id="session-timeout" 
              type="number" 
              placeholder="60" 
              defaultValue="60"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          <SettingsIcon className="h-4 w-4 mr-2" />
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
