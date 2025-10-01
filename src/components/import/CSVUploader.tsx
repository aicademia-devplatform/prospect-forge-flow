import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import CSVPreview from './CSVPreview';
import ColumnMapper from './ColumnMapper';

interface ParsedData {
  headers: string[];
  rows: any[];
  fileName: string;
}

const CSVUploader = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [targetTable, setTargetTable] = useState<'crm_contacts' | 'apollo_contacts'>('crm_contacts');
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm'>('upload');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner un fichier CSV ou Excel',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) {
          toast({
            title: 'Fichier vide',
            description: 'Le fichier ne contient aucune donnée',
            variant: 'destructive',
          });
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

        setParsedData({
          headers,
          rows,
          fileName: file.name,
        });

        setStep('preview');

        toast({
          title: 'Fichier chargé',
          description: `${rows.length} lignes détectées`,
        });
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: 'Erreur de lecture',
          description: 'Impossible de lire le fichier',
          variant: 'destructive',
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setStep('upload');
    setColumnMapping({});
  };

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importer un fichier CSV
              </CardTitle>
              <CardDescription>
                Sélectionnez un fichier CSV ou Excel à importer dans le data warehouse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target-table">Table de destination</Label>
                  <Select value={targetTable} onValueChange={(value: any) => setTargetTable(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crm_contacts">CRM Contacts</SelectItem>
                      <SelectItem value="apollo_contacts">Apollo Contacts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Fichier CSV / Excel</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format attendu :</strong> Fichier CSV ou Excel avec une ligne d'en-tête.
                  Les colonnes seront mappées automatiquement si elles correspondent aux champs de la base de données.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Glissez-déposez votre fichier ici ou utilisez le bouton ci-dessus
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 'preview' && parsedData && (
        <CSVPreview
          data={parsedData}
          targetTable={targetTable}
          onNext={() => setStep('mapping')}
          onCancel={handleReset}
        />
      )}

      {step === 'mapping' && parsedData && (
        <ColumnMapper
          data={parsedData}
          targetTable={targetTable}
          onBack={() => setStep('preview')}
          onNext={(mapping) => {
            setColumnMapping(mapping);
            setStep('confirm');
          }}
          onCancel={handleReset}
        />
      )}

      {step === 'confirm' && parsedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Confirmation d'import
              </CardTitle>
              <CardDescription>
                Vérifiez les paramètres avant l'importation finale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Fonctionnalité de confirmation à implémenter
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default CSVUploader;
