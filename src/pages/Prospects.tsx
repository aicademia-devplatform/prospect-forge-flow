import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/fr';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MySalesLeads from '@/pages/MySalesLeads';

interface CreatedTable {
  id: string;
  tableName: string;
  customTableName?: string;
  columnConfig: any[];
  tableSettings: any;
  createdAt: string;
  totalRecords: number;
}

const Prospects = () => {
  const { userRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  const [traitesList, setTraitesList] = useState<any[]>([]);
  const [traitesLoading, setTraitesLoading] = useState(false);

  // Fetch prospects traités when "traites" tab is active
  useEffect(() => {
    const fetchTraitesProspects = async () => {
      if (!user || activeTab !== 'traites') return;
      
      setTraitesLoading(true);
      try {
        // Récupérer tous les prospects avec des assignations bouclées ou avec certains statuts
        const { data: assignments, error } = await supabase
          .from('sales_assignments')
          .select(`
            *,
            apollo_contacts:apollo_contacts!inner(
              id,
              email,
              first_name,
              last_name,
              company,
              title,
              stage,
              apollo_status,
              zoho_status
            ),
            crm_contacts:crm_contacts!inner(
              id,
              email,
              firstname,
              name,
              company,
              apollo_status,
              zoho_status
            )
          `)
          .or('boucle.eq.true,apollo_contacts.apollo_status.eq.barrage,apollo_contacts.apollo_status.eq.déjà accompagné,crm_contacts.apollo_status.eq.barrage,crm_contacts.apollo_status.eq.déjà accompagné')
          .eq('sales_user_id', user.id);

        if (error) throw error;

        setTraitesList(assignments || []);
      } catch (error) {
        console.error('Error fetching prospects traités:', error);
      } finally {
        setTraitesLoading(false);
      }
    };

    fetchTraitesProspects();
  }, [user, activeTab]);

  const formatDate = (dateString: string) => {
    moment.locale('fr');
    const now = moment();
    const dateValue = moment(dateString);
    const daysDiff = now.diff(dateValue, 'days');
    
    // Si plus d'une semaine (7 jours), afficher la date formatée
    if (daysDiff > 7) {
      return dateValue.format('D MMM YYYY');
    } else {
      // Sinon, afficher la notation relative
      return dateValue.fromNow();
    }
  };

  const handleBackToMain = () => {
    // This will be handled by parent component or navigation
    window.history.back();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToMain}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Prospects</h1>
          </div>
          <div className="flex items-center space-x-4">
            {userRole && (
              <span className="text-sm text-muted-foreground">
                Rôle: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
            <UserMenu />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned">
              Prospects Assignés
            </TabsTrigger>
            <TabsTrigger value="rappeler">
              Prospects à rappeler
            </TabsTrigger>
            <TabsTrigger value="traites">
              Prospects Traités
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="space-y-4 mt-6">
            {/* Prospects assignés via MySalesLeads */}
            <MySalesLeads />
          </TabsContent>

          <TabsContent value="rappeler" className="space-y-4 mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Liste des prospects à rappeler</p>
            </div>
          </TabsContent>

          <TabsContent value="traites" className="space-y-4 mt-6">
            {traitesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Chargement des prospects traités...</p>
                </div>
              </div>
            ) : traitesList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun prospect traité pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {traitesList.length} prospect{traitesList.length > 1 ? 's' : ''} traité{traitesList.length > 1 ? 's' : ''}
                  </h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {traitesList.map((assignment) => {
                    const contact = assignment.apollo_contacts || assignment.crm_contacts;
                    if (!contact) return null;
                    
                    return (
                      <div key={assignment.id} className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">
                              {contact.first_name || contact.firstname} {contact.last_name || contact.name}
                            </h4>
                            {assignment.boucle && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Bouclé
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{contact.email}</p>
                            {contact.company && <p>{contact.company}</p>}
                            {contact.title && <p>{contact.title}</p>}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Assigné le {formatDate(assignment.assigned_at)}
                            </span>
                            {(contact.apollo_status || contact.zoho_status) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {contact.apollo_status || contact.zoho_status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Prospects;