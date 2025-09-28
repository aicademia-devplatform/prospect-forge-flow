import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: 'apollo_contacts' | 'crm_contacts';
  totalCount: number;
  currentPageCount: number;
  appliedFilters: {
    searchTerm?: string;
    sectionFilter?: string;
    dateRange?: { from?: Date; to?: Date };
    dataSection?: string | string[];
    zohoStatus?: string;
    apolloStatus?: string;
    contactActive?: string;
    industrie?: string;
    company?: string;
  };
  onExport: (options: ExportOptions) => Promise<void>;
}

export interface ExportOptions {
  scope: 'current' | 'all';
  filename: string;
  includeGoogleSheets: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  tableName,
  totalCount,
  currentPageCount,
  appliedFilters,
  onExport
}) => {
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [filename, setFilename] = useState(`export_${tableName}_${new Date().toISOString().split('T')[0]}`);
  const [includeGoogleSheets, setIncludeGoogleSheets] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.searchTerm) count++;
    if (appliedFilters.sectionFilter) count++;
    if (appliedFilters.dateRange?.from || appliedFilters.dateRange?.to) count++;
    if (appliedFilters.dataSection) count++;
    if (appliedFilters.zohoStatus) count++;
    if (appliedFilters.apolloStatus) count++;
    if (appliedFilters.contactActive) count++;
    if (appliedFilters.industrie) count++;
    if (appliedFilters.company) count++;
    return count;
  };

  const handleExport = async () => {
    if (!filename.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom de fichier",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await onExport({
        scope,
        filename: filename.trim(),
        includeGoogleSheets
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getTableDisplayName = () => {
    return tableName === 'apollo_contacts' ? 'Contacts Apollo' : 'Contacts CRM';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Exporter les données
          </DialogTitle>
          <DialogDescription>
            Configurez les options d'exportation pour {getTableDisplayName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scope Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Étendue de l'exportation</Label>
            <RadioGroup value={scope} onValueChange={(value) => setScope(value as 'current' | 'all')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" />
                <Label htmlFor="current" className="cursor-pointer">
                  Page actuelle seulement ({currentPageCount} contacts)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  Toutes les pages avec filtres appliqués ({totalCount} contacts)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Applied Filters Summary */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Filtres appliqués</Label>
            {getActiveFiltersCount() > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600" />
                  {getActiveFiltersCount()} filtre(s) actif(s)
                </div>
                <div className="flex flex-wrap gap-2">
                  {appliedFilters.searchTerm && (
                    <Badge variant="secondary">
                      Recherche: "{appliedFilters.searchTerm}"
                    </Badge>
                  )}
                  {appliedFilters.sectionFilter && (
                    <Badge variant="secondary">
                      Section: {appliedFilters.sectionFilter}
                    </Badge>
                  )}
                  {appliedFilters.dateRange?.from && (
                    <Badge variant="secondary">
                      Période: {appliedFilters.dateRange.from.toLocaleDateString()}
                      {appliedFilters.dateRange.to ? ` - ${appliedFilters.dateRange.to.toLocaleDateString()}` : ''}
                    </Badge>
                  )}
                  {appliedFilters.dataSection && (
                    <Badge variant="secondary">
                      Section données: {appliedFilters.dataSection}
                    </Badge>
                  )}
                  {appliedFilters.zohoStatus && (
                    <Badge variant="secondary">
                      Statut Zoho: {appliedFilters.zohoStatus}
                    </Badge>
                  )}
                  {appliedFilters.apolloStatus && (
                    <Badge variant="secondary">
                      Statut Apollo: {appliedFilters.apolloStatus}
                    </Badge>
                  )}
                  {appliedFilters.contactActive && (
                    <Badge variant="secondary">
                      Contact actif: {appliedFilters.contactActive}
                    </Badge>
                  )}
                  {appliedFilters.industrie && (
                    <Badge variant="secondary">
                      Industrie: {appliedFilters.industrie}
                    </Badge>
                  )}
                  {appliedFilters.company && (
                    <Badge variant="secondary">
                      Entreprise: {appliedFilters.company}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Aucun filtre appliqué - tous les contacts seront exportés
              </div>
            )}
          </div>

          <Separator />

          {/* Filename Input */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">
              Nom du fichier
            </Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Nom du fichier d'exportation"
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Le fichier sera sauvegardé au format .xlsx
            </div>
          </div>

          <Separator />

          {/* Google Sheets Integration */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-green-600" />
                Synchronisation Google Sheets
              </CardTitle>
              <CardDescription className="text-xs">
                Créer automatiquement un Google Sheet avec les données exportées
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="googleSheets"
                  checked={includeGoogleSheets}
                  onCheckedChange={(checked) => setIncludeGoogleSheets(checked === true)}
                />
                <Label htmlFor="googleSheets" className="text-sm cursor-pointer">
                  Créer un Google Sheet (fonctionnalité à venir)
                </Label>
              </div>
              {includeGoogleSheets && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700">
                    Cette fonctionnalité sera disponible prochainement. Pour l'instant, seul l'export Excel est disponible.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {scope === 'current' ? currentPageCount : totalCount} contacts seront exportés
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Annuler
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="bg-green-600 hover:bg-green-700">
              {isExporting ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-pulse" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;