import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, Download, Eye, Database, RefreshCw, Users, GitMerge } from 'lucide-react';
import { useUnifiedProspects } from '@/hooks/useUnifiedProspects';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import UnifiedProspectDetails from '@/components/UnifiedProspectDetails';
import * as XLSX from 'xlsx';

const UnifiedProspectsView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sourceFilter, setSourceFilter] = useState<('crm' | 'hubspot' | 'apollo')[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    data,
    loading,
    error,
    totalCount,
    totalPages,
    uniqueEmails,
    multiSourceCount,
    refetch,
  } = useUnifiedProspects({
    searchTerm,
    sourceFilter,
    page,
    pageSize,
  });

  const handleSourceFilterToggle = (source: 'crm' | 'hubspot' | 'apollo') => {
    setSourceFilter(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
    setPage(1); // Reset to first page
  };

  const handleViewDetails = (prospect: any) => {
    setSelectedProspect(prospect);
    setDetailsOpen(true);
  };

  const handleExportCSV = () => {
    try {
      // Préparer les données pour l'export
      const exportData = data.map(item => ({
        'Email': item.email,
        'Prénom': item.firstname || '',
        'Nom': item.lastname || item.name || '',
        'Entreprise': item.company || '',
        'Fonction': item.title || '',
        'Mobile': item.mobile || '',
        'Téléphone': item.tel || '',
        'Ville': item.city || '',
        'Pays': item.country || '',
        'Industrie': item.industrie || '',
        'LinkedIn': item.linkedin_url || '',
        'Site Web': item.company_website || '',
        'Sources': [
          item.sources.crm ? 'CRM' : '',
          item.sources.hubspot ? 'HubSpot' : '',
          item.sources.apollo ? 'Apollo' : '',
        ].filter(Boolean).join(', '),
        'Nombre de Sources': item.sourceCount,
        'Dernière Mise à Jour': item.lastUpdated || '',
      }));

      // Créer le workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vue 360');

      // Télécharger le fichier
      XLSX.writeFile(wb, `vue_360_prospects_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Export réussi',
        description: `${exportData.length} prospects exportés avec succès.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Une erreur est survenue lors de l\'export.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  const handleExportAll = async () => {
    try {
      toast({
        title: 'Export en cours',
        description: 'Préparation de toutes les données...',
      });

      // Récupérer toutes les données sans pagination
      const { data: allData } = useUnifiedProspects({
        searchTerm: '',
        sourceFilter: [],
        page: 1,
        pageSize: 999999,
      });

      const exportData = allData.map(item => ({
        'Email': item.email,
        'Prénom': item.firstname || '',
        'Nom': item.lastname || item.name || '',
        'Entreprise': item.company || '',
        'Fonction': item.title || '',
        'Mobile': item.mobile || '',
        'Téléphone': item.tel || '',
        'Téléphone Pro': item.tel_pro || '',
        'Adresse': item.address || '',
        'Ville': item.city || '',
        'Département': item.departement || '',
        'Pays': item.country || '',
        'Industrie': item.industrie || '',
        'Nombre d\'Employés': item.nb_employees || '',
        'LinkedIn Personnel': item.linkedin_url || '',
        'LinkedIn Entreprise': item.linkedin_company_url || '',
        'Site Web': item.company_website || '',
        'Source CRM': item.sources.crm ? 'Oui' : 'Non',
        'Source HubSpot': item.sources.hubspot ? 'Oui' : 'Non',
        'Source Apollo': item.sources.apollo ? 'Oui' : 'Non',
        'Nombre de Sources': item.sourceCount,
        'Dernière Mise à Jour': item.lastUpdated || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vue 360 Complète');

      XLSX.writeFile(wb, `vue_360_complete_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Export complet réussi',
        description: `${exportData.length} prospects exportés avec succès.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Une erreur est survenue lors de l\'export complet.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur de chargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Une erreur est survenue lors du chargement des données.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/datasources')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/datasources')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Vue 360° des Prospects
            </h1>
            <p className="text-muted-foreground mt-1">
              Vue unifiée de tous vos contacts depuis CRM, HubSpot et Apollo
            </p>
          </div>
        </div>
        <Button onClick={refetch} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Contacts Uniques</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-500" />
              {uniqueEmails.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total d'emails uniques dans toutes les sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Multi-Sources</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <GitMerge className="h-6 w-6 text-green-500" />
              {multiSourceCount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Contacts présents dans plusieurs sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Résultats Affichés</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Search className="h-6 w-6 text-purple-500" />
              {totalCount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Après application des filtres
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Email, nom, prénom, entreprise..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-32">
              <Label htmlFor="pageSize">Lignes par page</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setPage(1);
                }}
              >
                <SelectTrigger id="pageSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres par source */}
          <div>
            <Label>Sources de données</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-crm"
                  checked={sourceFilter.includes('crm')}
                  onCheckedChange={() => handleSourceFilterToggle('crm')}
                />
                <Label htmlFor="filter-crm" className="cursor-pointer">
                  CRM Contacts
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-hubspot"
                  checked={sourceFilter.includes('hubspot')}
                  onCheckedChange={() => handleSourceFilterToggle('hubspot')}
                />
                <Label htmlFor="filter-hubspot" className="cursor-pointer">
                  HubSpot
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-apollo"
                  checked={sourceFilter.includes('apollo')}
                  onCheckedChange={() => handleSourceFilterToggle('apollo')}
                />
                <Label htmlFor="filter-apollo" className="cursor-pointer">
                  Apollo
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter la page
            </Button>
            <Button onClick={handleExportAll} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter tout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement des données...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Aucun prospect trouvé</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((prospect) => (
                    <TableRow key={prospect.email}>
                      <TableCell className="font-medium">{prospect.email}</TableCell>
                      <TableCell>
                        {[prospect.firstname, prospect.lastname || prospect.name]
                          .filter(Boolean)
                          .join(' ') || '-'}
                      </TableCell>
                      <TableCell>{prospect.company || '-'}</TableCell>
                      <TableCell>{prospect.title || '-'}</TableCell>
                      <TableCell>{prospect.city || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {prospect.sources.crm && (
                            <Badge variant="secondary" className="text-xs">
                              CRM
                            </Badge>
                          )}
                          {prospect.sources.hubspot && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                              HubSpot
                            </Badge>
                          )}
                          {prospect.sources.apollo && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              Apollo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(prospect)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, totalCount)} sur {totalCount} résultats
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      Page {page} sur {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sheet pour les détails */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détails du Prospect</SheetTitle>
            <SheetDescription>
              Vue complète de toutes les informations disponibles
            </SheetDescription>
          </SheetHeader>
          {selectedProspect && (
            <UnifiedProspectDetails prospect={selectedProspect} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UnifiedProspectsView;


