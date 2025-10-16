import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import DashboardLoader from '@/components/dashboard/DashboardLoader';
import ExportDialog, { ExportOptions } from '@/components/ExportDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type EmailStatus = 'sent' | 'opened' | 'replied' | 'bounced';

interface ApolloContact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  email_sent: boolean;
  email_open: boolean;
  replied: boolean;
  email_bounced: boolean;
  mobile_phone?: string;
  work_direct_phone?: string;
  home_phone?: string;
  other_phone?: string;
  corporate_phone?: string;
}

const EmailLeads = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const status = searchParams.get('status') as EmailStatus;
  
  const [contacts, setContacts] = useState<ApolloContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filterWithPhone, setFilterWithPhone] = useState(false);

  const statusLabels = {
    sent: 'Envoyés',
    opened: 'Ouverts',
    replied: 'Répondus',
    bounced: 'Rebondis'
  };

  const statusColors = {
    sent: 'bg-[hsl(var(--accent-blue-light))] text-[hsl(var(--accent-blue))]',
    opened: 'bg-[hsl(var(--accent-green-light))] text-[hsl(var(--accent-green))]',
    replied: 'bg-[hsl(var(--accent-purple-light))] text-[hsl(var(--accent-purple))]',
    bounced: 'bg-[hsl(var(--accent-orange-light))] text-[hsl(var(--accent-orange))]'
  };

  useEffect(() => {
    if (!status || !['sent', 'opened', 'replied', 'bounced'].includes(status)) {
      navigate('/dashboard');
      return;
    }
    fetchContacts();
  }, [status]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('apollo_contacts').select('*');

      switch (status) {
        case 'sent':
          query = query.eq('email_sent', true);
          break;
        case 'opened':
          query = query.eq('email_open', true);
          break;
        case 'replied':
          query = query.eq('replied', true);
          break;
        case 'bounced':
          query = query.eq('email_bounced', true);
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les contacts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasValidPhone = (contact: ApolloContact) => {
    return !!(contact.mobile_phone || contact.work_direct_phone || contact.home_phone || contact.other_phone || contact.corporate_phone);
  };

  const getPhoneNumber = (contact: ApolloContact) => {
    return contact.mobile_phone || contact.work_direct_phone || contact.home_phone || contact.other_phone || contact.corporate_phone || '-';
  };

  const filteredContacts = filterWithPhone 
    ? contacts.filter(hasValidPhone)
    : contacts;

  const handleExport = async (options: ExportOptions) => {
    try {
      const dataToExport = filteredContacts.map(contact => {
        const filtered: any = {};
        options.columns.forEach(col => {
          filtered[col] = contact[col as keyof ApolloContact];
        });
        return filtered;
      });

      if (options.format === 'csv') {
        const headers = options.columns.join(options.csvOptions?.delimiter || ',');
        const rows = dataToExport.map(row => 
          options.columns.map(col => {
            const value = row[col] || '';
            if (options.csvOptions?.quoteStrings) {
              return `"${value}"`;
            }
            return value;
          }).join(options.csvOptions?.delimiter || ',')
        );
        
        const csv = options.csvOptions?.includeHeaders 
          ? [headers, ...rows].join('\n')
          : rows.join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${options.filename}.csv`;
        link.click();
      } else if (options.format === 'json') {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${options.filename}.json`;
        link.click();
      } else {
        // Excel export
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
        XLSX.writeFile(wb, `${options.filename}.xlsx`);
      }

      toast({
        title: 'Export réussi',
        description: `${dataToExport.length} contacts exportés`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'export',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Emails {statusLabels[status]}</h1>
            <p className="text-muted-foreground">{filteredContacts.length} contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="phone-filter" 
              checked={filterWithPhone}
              onCheckedChange={setFilterWithPhone}
            />
            <Label htmlFor="phone-filter" className="cursor-pointer">
              Avec numéro de téléphone
            </Label>
          </div>
          <Button onClick={() => setExportDialogOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </CardTitle>
          <CardDescription>
            Liste des contacts avec le statut "{statusLabels[status]}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Téléphone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun contact trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.first_name}</TableCell>
                    <TableCell>{contact.last_name}</TableCell>
                    <TableCell>{contact.company}</TableCell>
                    <TableCell>{contact.title}</TableCell>
                    <TableCell>{getPhoneNumber(contact)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        tableName="apollo_contacts"
        totalCount={filteredContacts.length}
        currentPageCount={filteredContacts.length}
        appliedFilters={{}}
        onExport={handleExport}
      />
    </div>
  );
};

export default EmailLeads;
