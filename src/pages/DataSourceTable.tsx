import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TableView from '@/components/TableView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DataSourceTable = () => {
  const { tableName } = useParams<{ tableName: string }>();
  const navigate = useNavigate();

  if (!tableName || (tableName !== 'apollo_contacts' && tableName !== 'crm_contacts' && tableName !== 'hubspot_contacts')) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Table non trouvée</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La table demandée n'existe pas ou n'est pas accessible.
            </p>
            <Button onClick={() => navigate('/datasources')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux sources de données
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TableView 
      tableName={tableName as 'apollo_contacts' | 'crm_contacts' | 'hubspot_contacts'} 
      onBack={() => navigate('/datasources')} 
    />
  );
};

export default DataSourceTable;