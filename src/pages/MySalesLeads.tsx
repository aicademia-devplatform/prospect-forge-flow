import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/UserMenu';

interface Assignment {
  id: string;
  lead_email: string;
  source_table: string;
  source_id: string;
  custom_table_name: string;
  custom_data: any;
  status: string;
  assigned_at: string;
}

interface CustomColumn {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required?: boolean;
}

const MySalesLeads = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'number' | 'date' | 'select'>('text');
  const [newColumnOptions, setNewColumnOptions] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAssignments();
      loadTableConfig();
    }
  }, [user]);

  const loadAssignments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sales_assignments')
        .select('*')
        .eq('sales_user_id', user.id)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos leads"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTableConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sales_table_config')
        .select('column_config')
        .eq('sales_user_id', user.id)
        .eq('table_name', 'my_leads')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.column_config) {
        setCustomColumns(Array.isArray(data.column_config) ? (data.column_config as unknown) as CustomColumn[] : []);
      }
    } catch (error) {
      console.error('Error loading table config:', error);
    }
  };

  const saveTableConfig = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('sales_table_config')
        .upsert({
          sales_user_id: user.id,
          table_name: 'my_leads',
          column_config: customColumns as any
        }, {
          onConflict: 'sales_user_id,table_name'
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration sauvegardée"
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration"
      });
    }
  };

  const addCustomColumn = () => {
    if (!newColumnName.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez saisir un nom de colonne"
      });
      return;
    }

    const newColumn: CustomColumn = {
      name: newColumnName,
      type: newColumnType,
      options: newColumnType === 'select' ? newColumnOptions.split(',').map(s => s.trim()) : undefined
    };

    setCustomColumns([...customColumns, newColumn]);
    setNewColumnName('');
    setNewColumnType('text');
    setNewColumnOptions('');
  };

  const removeCustomColumn = (index: number) => {
    setCustomColumns(customColumns.filter((_, i) => i !== index));
  };

  const updateCustomData = async (assignmentId: string, columnName: string, value: any) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      const updatedCustomData = {
        ...assignment.custom_data,
        [columnName]: value
      };

      const { error } = await supabase
        .from('sales_assignments')
        .update({ custom_data: updatedCustomData })
        .eq('id', assignmentId);

      if (error) throw error;

      setAssignments(assignments.map(a => 
        a.id === assignmentId 
          ? { ...a, custom_data: updatedCustomData }
          : a
      ));
    } catch (error) {
      console.error('Error updating custom data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour les données"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Leads</h1>
          <p className="text-muted-foreground">
            Gérez vos leads assignés avec des colonnes personnalisées
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurer les colonnes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configuration des colonnes personnalisées</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="column-name">Nom de colonne</Label>
                    <Input
                      id="column-name"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Ex: Statut prospect"
                    />
                  </div>
                  <div>
                    <Label htmlFor="column-type">Type</Label>
                    <Select value={newColumnType} onValueChange={(value: any) => setNewColumnType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte</SelectItem>
                        <SelectItem value="number">Nombre</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="select">Liste déroulante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addCustomColumn} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {newColumnType === 'select' && (
                  <div>
                    <Label htmlFor="column-options">Options (séparées par des virgules)</Label>
                    <Input
                      id="column-options"
                      value={newColumnOptions}
                      onChange={(e) => setNewColumnOptions(e.target.value)}
                      placeholder="Ex: Chaud, Tiède, Froid"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Colonnes configurées</Label>
                  {customColumns.map((column, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{column.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {column.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomColumn(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={async () => {
                    await saveTableConfig();
                    setConfigDialogOpen(false);
                  }}>
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <UserMenu />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads assignés ({assignments.length})</CardTitle>
          <CardDescription>
            Personnalisez vos colonnes pour adapter la table à votre façon de travailler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date d'assignation</TableHead>
                {customColumns.map((column) => (
                  <TableHead key={column.name}>{column.name}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.lead_email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {assignment.source_table === 'apollo_contacts' ? 'Apollo' : 'CRM'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </TableCell>
                  {customColumns.map((column) => (
                    <TableCell key={column.name}>
                      {column.type === 'select' ? (
                        <Select
                          value={assignment.custom_data?.[column.name] || ''}
                          onValueChange={(value) => updateCustomData(assignment.id, column.name, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {column.options?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                          value={assignment.custom_data?.[column.name] || ''}
                          onChange={(e) => updateCustomData(assignment.id, column.name, e.target.value)}
                          placeholder={`Saisir ${column.name.toLowerCase()}`}
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {assignments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun lead assigné pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySalesLeads;