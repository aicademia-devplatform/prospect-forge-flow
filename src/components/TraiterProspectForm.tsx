import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  salesNote: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Veuillez sélectionner un statut'),
  actionDate: z.date({
    message: 'Veuillez sélectionner une date valide',
  }),
  callbackDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TraiterProspectFormProps {
  prospectEmail: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export const TraiterProspectForm: React.FC<TraiterProspectFormProps> = ({
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
        message: 'La date de rappel est obligatoire pour ce statut',
      });
      toast({
        title: 'Validation échouée',
        description: 'La date de rappel est obligatoire pour le statut sélectionné',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Validation supplémentaire
      if (!data.status) {
        form.setError('status', {
          type: 'required',
          message: 'Le statut est obligatoire',
        });
        toast({
          title: 'Validation échouée',
          description: 'Veuillez sélectionner un statut',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      if (!data.actionDate) {
        form.setError('actionDate', {
          type: 'required',
          message: 'La date d\'action est obligatoire',
        });
        toast({
          title: 'Validation échouée',
          description: 'Veuillez sélectionner une date d\'action',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

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
          // Ajouter les champs de traitement
          zoho_last_activity: new Date().toISOString(),
          apollo_status: data.status, // Synchroniser avec apollo_status aussi
        })
        .eq('email', prospectEmail);

      // Validation supplémentaire
      if (!data.status) {
        form.setError('status', {
          type: 'required',
          message: 'Le statut est obligatoire',
        });
        toast({
          title: 'Validation échouée',
          description: 'Veuillez sélectionner un statut',
          variant: 'destructive',
        });
        return;
      }

      if (!data.actionDate) {
        form.setError('actionDate', {
          type: 'required',
          message: 'La date d\'action est obligatoire',
        });
        toast({
          title: 'Validation échouée',
          description: 'Veuillez sélectionner une date d\'action',
          variant: 'destructive',
        });
        return;
      }

      // Mettre à jour aussi apollo_contacts si le contact existe
      const { error: apolloError } = await supabase
        .from('apollo_contacts')
        .update({
          stage: data.status,
          last_contacted: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        })
        .eq('email', prospectEmail);

      // Ne pas lever d'erreur si le contact n'existe pas dans apollo_contacts
      if (apolloError && !apolloError.message.includes('No rows')) {
        console.warn('Apollo update error (non-critical):', apolloError);
      }

      // Créer un assignment pour le sales avec plus de détails
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
            sales_note: data.salesNote || '',
            status: data.status,
            action_date: data.actionDate.toISOString(),
            callback_date: data.callbackDate?.toISOString(),
            processed_at: new Date().toISOString(),
            processed_by: user.email || user.id,
            requires_callback: needsCallbackDate,
          },
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Succès',
        description: 'Le prospect a été traité avec succès dans CRM et Apollo',
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="salesNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note du sales (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ajoutez vos notes sur ce prospect (optionnel)..."
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
              <FormLabel className="flex items-center gap-1">
                Statut du prospect
                <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={form.formState.errors.status ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionnez un statut *" />
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
              <FormLabel className="flex items-center gap-1">
                Date d'action
                <span className="text-destructive">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground',
                        form.formState.errors.actionDate && 'border-destructive'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: fr })
                      ) : (
                        <span>Sélectionnez une date *</span>
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
                <FormLabel className="flex items-center gap-1">
                  Date de rappel
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                            form.formState.errors.callbackDate && 'border-destructive'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: fr })
                          ) : (
                            <span>Sélectionnez une date de rappel *</span>
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
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Traitement...' : 'Traiter'}
          </Button>
        </div>
      </form>
    </Form>
  );
};