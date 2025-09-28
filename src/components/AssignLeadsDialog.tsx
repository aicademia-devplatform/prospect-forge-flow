import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AssignLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRows: string[];
  tableName: 'apollo_contacts' | 'crm_contacts';
  onAssignmentComplete: () => void;
}

interface SalesUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

export const AssignLeadsDialog: React.FC<AssignLeadsDialogProps> = ({
  open,
  onOpenChange,
  selectedRows,
  tableName,
  onAssignmentComplete
}) => {
  const [selectedSalesId, setSelectedSalesId] = useState<string>('');
  const [customTableName, setCustomTableName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  // Charger les utilisateurs sales
  React.useEffect(() => {
    if (open) {
      loadSalesUsers();
    }
  }, [open]);

  const loadSalesUsers = async () => {
    try {
      // D'abord, récupérer les IDs des utilisateurs avec le rôle 'sales'
      const { data: salesRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'sales');

      if (rolesError) throw rolesError;

      let salesUserIds = salesRoles ? salesRoles.map(role => role.user_id) : [];
      
      // Ajouter l'utilisateur connecté s'il n'est pas déjà dans la liste
      if (user?.id && !salesUserIds.includes(user.id)) {
        salesUserIds.push(user.id);
      }

      if (salesUserIds.length === 0) {
        setSalesUsers([]);
        return;
      }

      // Ensuite, récupérer les profils de ces utilisateurs
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', salesUserIds);

      if (error) throw error;
      setSalesUsers(data || []);
    } catch (error) {
      console.error('Error loading sales users:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la liste des sales"
      });
    }
  };

  const handleAssignLeads = async () => {
    if (!selectedSalesId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un sales"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer les emails des leads sélectionnés selon la table
      const idColumn = tableName === 'apollo_contacts' ? 'id' : 'id';
      const selectFields = tableName === 'apollo_contacts' ? 'id, email' : 'id, email';
      
      const { data: leadData, error: leadError } = await supabase
        .from(tableName)
        .select(selectFields)
        .in(idColumn, selectedRows);

      if (leadError) throw leadError;

      // Obtenir l'ID de l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Créer les assignations
      const assignments = leadData?.map(lead => ({
        sales_user_id: selectedSalesId,
        lead_email: lead.email,
        source_table: tableName,
        source_id: String(lead.id),
        custom_table_name: customTableName || `${selectedSalesId}_leads`,
        assigned_by: currentUserId || null
      })) || [];

      const { error: assignError } = await supabase
        .from('sales_assignments')
        .insert(assignments);

      if (assignError) throw assignError;

      toast({
        title: "Succès",
        description: `${selectedRows.length} leads assignés avec succès`
      });

      onAssignmentComplete();
      onOpenChange(false);
      setSelectedSalesId('');
      setCustomTableName('');

    } catch (error) {
      console.error('Error assigning leads:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'assigner les leads"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner les leads</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Nombre de leads sélectionnés</Label>
            <p className="text-sm text-muted-foreground">{selectedRows.length} leads</p>
          </div>

          <div>
            <Label htmlFor="sales-select">Assigner à</Label>
            <Select value={selectedSalesId} onValueChange={setSelectedSalesId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un sales">
                  {selectedSalesId && (() => {
                    const selectedUser = salesUsers.find(user => user.id === selectedSalesId);
                    return selectedUser ? (
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedUser.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(selectedUser.first_name?.charAt(0) || '') + (selectedUser.last_name?.charAt(0) || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-sm">
                            {selectedUser.first_name} {selectedUser.last_name}
                            {selectedUser.id === user?.id && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Moi</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {selectedUser.email}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50">
                {salesUsers.map((salesUser) => (
                  <SelectItem key={salesUser.id} value={salesUser.id} className="p-3">
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={salesUser.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(salesUser.first_name?.charAt(0) || '') + (salesUser.last_name?.charAt(0) || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          {salesUser.first_name} {salesUser.last_name}
                          {salesUser.id === user?.id && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Moi</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {salesUser.email}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="table-name">Nom de table personnalisée (optionnel)</Label>
            <Input
              id="table-name"
              value={customTableName}
              onChange={(e) => setCustomTableName(e.target.value)}
              placeholder="Laissez vide pour utiliser le nom par défaut"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Par défaut: {selectedSalesId ? `${selectedSalesId}_leads` : 'user_leads'}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAssignLeads} 
              disabled={isLoading || !selectedSalesId}
            >
              {isLoading ? 'Attribution...' : 'Assigner'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};