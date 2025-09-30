import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Save, User, Building2, Phone, Mail, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Champs disponibles pour ajout (même que dans ModifierProspectSidebar)
const AVAILABLE_FIELDS = [
  { key: 'firstname', label: 'Prénom', type: 'text', icon: User },
  { key: 'name', label: 'Nom', type: 'text', icon: User },
  { key: 'company', label: 'Entreprise', type: 'text', icon: Building2 },
  { key: 'tel', label: 'Téléphone fixe', type: 'tel', icon: Phone },
  { key: 'mobile', label: 'Mobile', type: 'tel', icon: Phone },
  { key: 'mobile_2', label: 'Mobile 2', type: 'tel', icon: Phone },
  { key: 'tel_pro', label: 'Téléphone pro', type: 'tel', icon: Phone },
  { key: 'city', label: 'Ville', type: 'text', icon: MapPin },
  { key: 'country', label: 'Pays', type: 'text', icon: MapPin },
  { key: 'departement', label: 'Département', type: 'text', icon: MapPin },
  { key: 'address', label: 'Adresse', type: 'textarea', icon: MapPin },
  { key: 'industrie', label: 'Industrie', type: 'text', icon: Building2 },
  { key: 'nb_employees', label: 'Nombre d\'employés', type: 'text', icon: Building2 },
  { key: 'linkedin_url', label: 'LinkedIn URL', type: 'url', icon: Mail },
  { key: 'linkedin_company_url', label: 'LinkedIn entreprise', type: 'url', icon: Building2 },
  { key: 'company_website', label: 'Site web entreprise', type: 'url', icon: Building2 },
  { key: 'linkedin_function', label: 'Fonction LinkedIn', type: 'text', icon: User },
];

const fieldSchema = z.object({
  key: z.string().min(1, 'Clé requise'),
  value: z.string().optional(),
});

const formSchema = z.object({
  email: z.string().email('Email invalide'),
  fields: z.array(fieldSchema),
});

type FormData = z.infer<typeof formSchema>;

interface ModifierProspectFormProps {
  prospect: any;
  onSuccess?: () => void;
  onClose: () => void;
}

export const ModifierProspectForm: React.FC<ModifierProspectFormProps> = ({
  prospect,
  onSuccess,
  onClose,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableFieldsToAdd, setAvailableFieldsToAdd] = useState(AVAILABLE_FIELDS);

  // Préparer les champs existants
  const existingFields = React.useMemo(() => {
    const fields: Array<{ key: string; value: string }> = [];
    
    // Champs de base toujours présents
    if (prospect.crm_firstname || prospect.apollo_firstname || prospect.first_name) {
      fields.push({ 
        key: 'firstname', 
        value: prospect.crm_firstname || prospect.apollo_firstname || prospect.first_name || '' 
      });
    }
    if (prospect.crm_name || prospect.apollo_lastname || prospect.last_name) {
      fields.push({ 
        key: 'name', 
        value: prospect.crm_name || prospect.apollo_lastname || prospect.last_name || '' 
      });
    }
    if (prospect.crm_company || prospect.apollo_company || prospect.company) {
      fields.push({ 
        key: 'company', 
        value: prospect.crm_company || prospect.apollo_company || prospect.company || '' 
      });
    }
    if (prospect.crm_city || prospect.apollo_city || prospect.city) {
      fields.push({ 
        key: 'city', 
        value: prospect.crm_city || prospect.apollo_city || prospect.city || '' 
      });
    }
    if (prospect.crm_mobile || prospect.apollo_mobile || prospect.mobile_phone) {
      fields.push({ 
        key: 'mobile', 
        value: prospect.crm_mobile || prospect.apollo_mobile || prospect.mobile_phone || '' 
      });
    }

    return fields;
  }, [prospect]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: prospect.email,
      fields: existingFields,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  // Mettre à jour les champs disponibles quand les champs actuels changent
  useEffect(() => {
    const usedKeys = fields.map(field => field.key);
    setAvailableFieldsToAdd(AVAILABLE_FIELDS.filter(field => !usedKeys.includes(field.key)));
  }, [fields]);

  const addField = (fieldKey: string) => {
    const fieldDef = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
    if (fieldDef) {
      append({ key: fieldKey, value: '' });
    }
  };

  const removeField = (index: number) => {
    try {
      remove(index);
    } catch (error) {
      console.error('Error removing field:', error);
    }
  };

  const getFieldDefinition = (key: string) => {
    return AVAILABLE_FIELDS.find(f => f.key === key);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Construire l'objet de mise à jour
      const updateData: any = {};
      
      data.fields.forEach(field => {
        if (field.value && field.value.trim()) {
          updateData[field.key] = field.value.trim();
        }
      });

      // Mettre à jour dans crm_contacts
      const { error } = await supabase
        .from('crm_contacts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('email', prospect.email);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Le prospect a été modifié avec succès',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error updating prospect:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le prospect',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (field: any, index: number) => {
    const fieldDef = getFieldDefinition(field.key);
    
    // Si on ne trouve pas la définition du champ, on ignore ce champ
    if (!fieldDef) {
      console.warn(`Field definition not found for key: ${field.key}`);
      return null;
    }
    
    const Icon = fieldDef.icon || User;

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-2"
      >
        <FormField
          control={form.control}
          name={`fields.${index}.value`}
          render={({ field: inputField }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {fieldDef?.label || field.key}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                  className="h-6 w-6 p-0 ml-auto"
                >
                  <X className="h-3 w-3" />
                </Button>
              </FormLabel>
              <FormControl>
                {fieldDef?.type === 'textarea' ? (
                  <Textarea
                    placeholder={`Entrez ${fieldDef?.label?.toLowerCase() || field.key}`}
                    {...inputField}
                  />
                ) : (
                  <Input
                    type={fieldDef?.type || 'text'}
                    placeholder={`Entrez ${fieldDef?.label?.toLowerCase() || field.key}`}
                    {...inputField}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </motion.div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email (non modifiable) */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </FormLabel>
              <FormControl>
                <Input {...field} disabled className="bg-muted" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Champs existants */}
        <div className="space-y-4">
          <AnimatePresence>
            {fields.map((field, index) => renderFieldInput(field, index))}
          </AnimatePresence>
        </div>

        {/* Ajouter un nouveau champ */}
        {availableFieldsToAdd.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un champ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {availableFieldsToAdd.map((fieldDef) => {
                  const Icon = fieldDef.icon;
                  return (
                    <Button
                      key={fieldDef.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addField(fieldDef.key)}
                      className="justify-start h-auto p-2 text-xs"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {fieldDef.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </Form>
  );
};