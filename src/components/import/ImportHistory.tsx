import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, CheckCircle2, XCircle, Clock } from 'lucide-react';

const ImportHistory = () => {
  // Mock data - à remplacer par des vraies données de la DB
  const imports = [
    {
      id: 1,
      fileName: 'contacts_export_2025.csv',
      targetTable: 'crm_contacts',
      rowsImported: 1250,
      rowsFailed: 5,
      status: 'success',
      importedAt: '2025-09-28 14:32:00',
      importedBy: 'admin@example.com'
    },
    {
      id: 2,
      fileName: 'apollo_data.xlsx',
      targetTable: 'apollo_contacts',
      rowsImported: 890,
      rowsFailed: 0,
      status: 'success',
      importedAt: '2025-09-25 09:15:00',
      importedBy: 'manager@example.com'
    },
    {
      id: 3,
      fileName: 'prospects_q3.csv',
      targetTable: 'crm_contacts',
      rowsImported: 0,
      rowsFailed: 450,
      status: 'failed',
      importedAt: '2025-09-20 16:45:00',
      importedBy: 'admin@example.com'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-[hsl(var(--accent-green))] hover:bg-[hsl(var(--accent-green))]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Réussi
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Échoué
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Historique des importations
          </CardTitle>
          <CardDescription>
            Suivez l'historique de vos importations de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Table cible</TableHead>
                  <TableHead>Lignes importées</TableHead>
                  <TableHead>Échecs</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-medium">{imp.fileName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{imp.targetTable}</Badge>
                    </TableCell>
                    <TableCell>{imp.rowsImported.toLocaleString()}</TableCell>
                    <TableCell>
                      {imp.rowsFailed > 0 ? (
                        <span className="text-destructive">{imp.rowsFailed}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(imp.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {imp.importedAt}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {imp.importedBy}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune importation pour le moment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ImportHistory;
