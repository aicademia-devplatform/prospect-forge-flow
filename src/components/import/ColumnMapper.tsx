import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, ArrowLeft, X, Columns3 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ColumnMapperProps {
  data: {
    headers: string[];
    rows: any[];
    fileName: string;
  };
  targetTable: 'crm_contacts' | 'apollo_contacts';
  onBack: () => void;
  onNext: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({ data, targetTable, onBack, onNext, onCancel }) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Champs disponibles selon la table cible
  const targetFields: Record<string, string[]> = {
    crm_contacts: [
      'email', 'firstname', 'name', 'company', 'mobile', 'tel', 'tel_pro',
      'address', 'city', 'departement', 'country', 'linkedin_url', 
      'linkedin_company_url', 'company_website', 'industrie', 'nb_employees',
      'zoho_status', 'apollo_status', 'data_section'
    ],
    apollo_contacts: [
      'email', 'first_name', 'last_name', 'title', 'company', 'mobile_phone',
      'work_direct_phone', 'home_phone', 'city', 'state', 'country',
      'person_linkedin_url', 'company_linkedin_url', 'website', 'industry',
      'nb_employees', 'seniority', 'departments', 'stage', 'email_status'
    ]
  };

  const fields = targetFields[targetTable];

  useEffect(() => {
    // Mapping automatique basé sur les noms de colonnes
    const autoMapping: Record<string, string> = {};
    data.headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_');
      if (fields.includes(normalizedHeader)) {
        autoMapping[header] = normalizedHeader;
      }
    });
    setMapping(autoMapping);
  }, [data.headers, targetTable]);

  const handleMappingChange = (csvColumn: string, targetColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: targetColumn
    }));
  };

  const getMappedCount = () => {
    return Object.values(mapping).filter(v => v && v !== 'ignore').length;
  };

  const handleNext = () => {
    if (getMappedCount() === 0) {
      return;
    }
    onNext(mapping);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Columns3 className="h-5 w-5" />
                Mapper les colonnes
              </CardTitle>
              <CardDescription>
                Associez les colonnes du fichier CSV aux champs de la base de données
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {getMappedCount()} / {data.headers.length} colonnes mappées
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <div className="space-y-4">
              {data.headers.map((header, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{header}</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exemple: {data.rows[0]?.[index] || 'N/A'}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <Select
                      value={mapping[header] || 'ignore'}
                      onValueChange={(value) => handleMappingChange(header, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un champ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ignore">
                          <span className="text-muted-foreground">Ignorer cette colonne</span>
                        </SelectItem>
                        {fields.map(field => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleNext} disabled={getMappedCount() === 0}>
                Continuer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ColumnMapper;
