import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, ArrowRight, X } from 'lucide-react';

interface CSVPreviewProps {
  data: {
    headers: string[];
    rows: any[];
    fileName: string;
  };
  targetTable: string;
  onNext: () => void;
  onCancel: () => void;
}

const CSVPreview: React.FC<CSVPreviewProps> = ({ data, targetTable, onNext, onCancel }) => {
  const previewRows = data.rows.slice(0, 10);

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
                <Eye className="h-5 w-5" />
                Prévisualisation des données
              </CardTitle>
              <CardDescription>
                {data.fileName} • {data.rows.length} lignes • {data.headers.length} colonnes
              </CardDescription>
            </div>
            <Badge variant="outline">{targetTable === 'crm_contacts' ? 'CRM Contacts' : 'Apollo Contacts'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {data.headers.map((_, colIndex) => (
                      <TableCell key={colIndex} className="whitespace-nowrap">
                        {row[colIndex] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {data.rows.length > 10 && (
            <p className="text-sm text-muted-foreground text-center">
              Affichage des 10 premières lignes sur {data.rows.length} au total
            </p>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={onNext}>
              Continuer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CSVPreview;
