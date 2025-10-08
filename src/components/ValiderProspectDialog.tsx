import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const validationSchema = z.object({
  commentaire: z.string().min(1, 'Un commentaire est requis'),
  rdvDate: z.date().optional(),
  rdvNotes: z.string().optional(),
}).refine(data => data.rdvDate !== undefined, {
  message: 'La date du rendez-vous est requise',
  path: ['rdvDate'],
});

const rejectionSchema = z.object({
  commentaire: z.string().min(1, 'Un commentaire est requis'),
  raison: z.string().optional(),
});

interface ValiderProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: any;
  onSuccess: () => void;
}

export const ValiderProspectDialog: React.FC<ValiderProspectDialogProps> = ({
  open,
  onOpenChange,
  prospect,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'valider' | 'rejeter'>('valider');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      commentaire: '',
      rdvNotes: '',
    },
  });

  const rejectionForm = useForm<z.infer<typeof rejectionSchema>>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      commentaire: '',
      raison: '',
    },
  });

  const handleValidation = async (data: z.infer<typeof validationSchema>) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Insérer dans prospects_valides
      const { error: insertError } = await supabase
        .from('prospects_valides')
        .insert({
          original_traite_id: prospect.id,
          sales_user_id: prospect.sales_user_id,
          sdr_id: prospect.sdr_id,
          source_table: prospect.source_table,
          source_id: prospect.source_id,
          lead_email: prospect.lead_email,
          custom_table_name: prospect.custom_table_name,
          custom_data: prospect.custom_data,
          assigned_by: prospect.assigned_by,
          assigned_at: prospect.assigned_at,
          notes_sales: prospect.notes_sales,
          statut_prospect: prospect.statut_prospect,
          date_action: prospect.date_action,
          commentaire_validation: data.commentaire,
          rdv_date: data.rdvDate.toISOString(),
          rdv_notes: data.rdvNotes,
          validated_by: user.id,
        });

      if (insertError) throw insertError;

      // Supprimer de prospects_traites
      const { error: deleteError } = await supabase
        .from('prospects_traites')
        .delete()
        .eq('id', prospect.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Succès',
        description: 'Le prospect a été validé et un rendez-vous a été programmé',
      });

      onSuccess();
      onOpenChange(false);
      validationForm.reset();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de valider le prospect',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejection = async (data: z.infer<typeof rejectionSchema>) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Insérer dans prospects_archives
      const { error: insertError } = await supabase
        .from('prospects_archives')
        .insert({
          original_traite_id: prospect.id,
          sales_user_id: prospect.sales_user_id,
          sdr_id: prospect.sdr_id,
          source_table: prospect.source_table,
          source_id: prospect.source_id,
          lead_email: prospect.lead_email,
          custom_table_name: prospect.custom_table_name,
          custom_data: prospect.custom_data,
          assigned_by: prospect.assigned_by,
          assigned_at: prospect.assigned_at,
          notes_sales: prospect.notes_sales,
          statut_prospect: prospect.statut_prospect,
          date_action: prospect.date_action,
          commentaire_rejet: data.commentaire,
          raison_rejet: data.raison,
          rejected_by: user.id,
        });

      if (insertError) throw insertError;

      // Supprimer de prospects_traites
      const { error: deleteError } = await supabase
        .from('prospects_traites')
        .delete()
        .eq('id', prospect.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Succès',
        description: 'Le prospect a été rejeté et archivé',
      });

      onSuccess();
      onOpenChange(false);
      rejectionForm.reset();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le prospect',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Traiter le prospect</DialogTitle>
          <DialogDescription>
            {prospect?.lead_email}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'valider' | 'rejeter')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="valider" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Valider
            </TabsTrigger>
            <TabsTrigger value="rejeter" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Rejeter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="valider">
            <Form {...validationForm}>
              <form onSubmit={validationForm.handleSubmit(handleValidation)} className="space-y-4">
                <FormField
                  control={validationForm.control}
                  name="commentaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commentaire de validation *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Votre commentaire..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={validationForm.control}
                  name="rdvDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date du rendez-vous *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
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
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={validationForm.control}
                  name="rdvNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes sur le rendez-vous</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notes additionnelles..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    {isSubmitting ? 'Validation...' : 'Valider le prospect'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="rejeter">
            <Form {...rejectionForm}>
              <form onSubmit={rejectionForm.handleSubmit(handleRejection)} className="space-y-4">
                <FormField
                  control={rejectionForm.control}
                  name="commentaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commentaire de rejet *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Expliquez pourquoi vous rejetez ce prospect..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={rejectionForm.control}
                  name="raison"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raison du rejet</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Raison catégorisée (optionnel)..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Rejet...' : 'Rejeter le prospect'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};