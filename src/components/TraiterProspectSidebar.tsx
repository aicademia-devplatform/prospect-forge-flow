import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, X, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PROSPECT_STATUSES = [
  'RDV',
  'B',
  'RÉPONDEUR',
  'MAIL À ENVOYER',
  'MAIL ENVOYÉ',
  'À RAPPELER',
  'PB NUMÉRO/N ATTRIBUÉ',
  'DÉJÀ ACCOMPAGNÉ',
  'BARRAGE/QUE PAR MAIL',
  'BESOIN DE SUIVI',
  'Client',
  'Prospect chaud',
  'Ex-client',
  'Prospect chaud IA',
  'Ne pas contacter'
];

// Statuts qui nécessitent une date de rappel
const STATUSES_NEEDING_CALLBACK = ['Prospect chaud', 'À RAPPELER', 'BESOIN DE SUIVI', 'RDV'];

const formSchema = z.object({
  salesNote: z.string().min(1, 'La note du sales est requise'),
  status: z.string().min(1, 'Le statut est requis'),
  actionDate: z.date({
    message: 'La date d\'action est requise',
  }),
  callbackDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TraiterProspectSidebarProps {
  prospectEmail: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export const TraiterProspectSidebar: React.FC<TraiterProspectSidebarProps> = ({
  prospectEmail,
  onSuccess,
  onClose,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesNote: '',
      status: '',
      actionDate: new Date(),
      callbackDate: undefined,
    },
  });

  const watchedStatus = form.watch('status');
  const needsCallbackDate = STATUSES_NEEDING_CALLBACK.includes(watchedStatus);

  const onSubmit = async (data: FormData) => {
    // Validation manuelle pour la date de rappel
    if (needsCallbackDate && !data.callbackDate) {
      form.setError('callbackDate', {
        type: 'required',
        message: 'La date de rappel est requise pour ce statut',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Mettre à jour le contact CRM
      const { error: crmError } = await supabase
        .from('crm_contacts')
        .update({
          zoho_status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('email', prospectEmail);

      if (crmError) throw crmError;

      // Créer un assignment pour le sales
      const { error: assignmentError } = await supabase
        .from('sales_assignments')
        .insert({
          sales_user_id: user.id,
          source_table: 'crm_contacts',
          source_id: prospectEmail, // Using email as source_id
          lead_email: prospectEmail,
          status: 'active',
          assigned_by: user.id,
          custom_data: {
            sales_note: data.salesNote,
            status: data.status,
            action_date: data.actionDate.toISOString(),
            callback_date: data.callbackDate?.toISOString(),
            processed_at: new Date().toISOString(),
          },
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Succès',
        description: 'Le prospect a été traité avec succès',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error processing prospect:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter le prospect',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sidebar className="w-96 border-l">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Traiter le prospect</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {prospectEmail}
        </p>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="salesNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note du sales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajoutez vos notes sur ce prospect..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut du prospect</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROSPECT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date d'action</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: fr })
                          ) : (
                            <span>Sélectionnez une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsCallbackDate && (
              <FormField
                control={form.control}
                name="callbackDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de rappel</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: fr })
                            ) : (
                              <span>Sélectionnez une date de rappel</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Traitement...' : 'Traiter'}
              </Button>
            </div>
          </form>
        </Form>
      </SidebarContent>
    </Sidebar>
  );
};