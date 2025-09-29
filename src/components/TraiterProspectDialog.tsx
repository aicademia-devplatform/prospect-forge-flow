import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
  salesNote: z.string().min(1, 'La note du sales est requise'),
  status: z.string().min(1, 'Le statut est requis'),
  actionDate: z.date({
    message: 'La date d\'action est requise',
  }),
  callbackDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TraiterProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectEmail: string;
  onSuccess?: () => void;
}

export const TraiterProspectDialog: React.FC<TraiterProspectDialogProps> = ({
  open,
  onOpenChange,
  prospectEmail,
  onSuccess,
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

  // Mettre à jour le schéma de validation dynamiquement
  React.useEffect(() => {
    if (needsCallbackDate) {
      const schemaWithCallback = formSchema.extend({
        callbackDate: z.date({
          message: 'La date de rappel est requise pour ce statut',
        }),
      });
      // Note: react-hook-form ne permet pas de changer le schema dynamiquement
      // On va gérer cette validation manuellement dans onSubmit
    }
  }, [needsCallbackDate]);

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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Traiter le prospect</DialogTitle>
          <DialogDescription>
            Renseignez les informations de traitement pour {prospectEmail}
          </DialogDescription>
        </DialogHeader>

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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Traitement...' : 'Traiter'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};