import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, Phone, Building, Globe, Linkedin, User, Calendar, Tag, Briefcase, MapPin, UserPlus, Edit, Save, X } from 'lucide-react';
import { useContact } from '@/hooks/useContact';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Fonction de traduction des noms de colonnes (importée depuis TableView)
const translateColumnName = (columnName: string): string => {
  const translations: Record<string, string> = {
    'id': 'ID',
    'email': 'Email',
    'created_at': 'Date de création',
    'updated_at': 'Date de mise à jour',
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'company': 'Entreprise',
    'title': 'Titre',
    'seniority': 'Ancienneté',
    'departments': 'Départements',
    'activity': 'Activité',
    'lifecycle_stage': 'Étape du cycle de vie',
    'categorie_fonction': 'Catégorie fonction',
    'stage': 'Étape',
    'technologies': 'Technologies',
    'secteur_activite': 'Secteur d\'activité',
    'company_phone': 'Téléphone entreprise',
    'company_country': 'Pays entreprise',
    'company_state': 'État entreprise',
    'company_city': 'Ville entreprise',
    'company_address': 'Adresse entreprise',
    'country': 'Pays',
    'state': 'État',
    'city': 'Ville',
    'twitter_url': 'URL Twitter',
    'facebook_url': 'URL Facebook',
    'company_linkedin_url': 'URL LinkedIn entreprise',
    'website': 'Site web',
    'person_linkedin_url': 'URL LinkedIn personne',
    'subsidiary_of': 'Filiale de',
    'statut': 'Statut',
    'contact_owner': 'Propriétaire contact',
    'account_owner': 'Propriétaire compte',
    'work_direct_phone': 'Téléphone professionnel direct',
    'home_phone': 'Téléphone domicile',
    'mobile_phone': 'Téléphone portable',
    'corporate_phone': 'Téléphone corporate',
    'other_phone': 'Autre téléphone',
    'region': 'Région',
    'industry': 'Industrie',
    'keywords': 'Mots-clés',
    'secondary_email': 'Email secondaire',
    'tertiary_email': 'Email tertiaire',
    'num_employees': 'Nombre d\'employés',
    'nb_employees': 'Nombre d\'employés',
    'annual_revenue': 'Chiffre d\'affaires annuel',
    'total_funding': 'Financement total',
    'latest_funding': 'Dernier financement',
    'email_sent': 'Email envoyé',
    'email_open': 'Email ouvert',
    'email_bounced': 'Email rejeté',
    'replied': 'Répondu',
    'demoed': 'Démo effectuée',
    'apollo_account_id': 'ID compte Apollo',
    'apollo_contact_id': 'ID contact Apollo',
    'email_status': 'Statut email',
    'primary_email_source': 'Source email principal',
    'email_confidence': 'Confiance email',
    'last_sync_at': 'Dernière synchronisation',
    'primary_email_last_verified_at': 'Dernière vérification email principal',
    'last_raised_at': 'Dernière levée de fonds',
    'last_contacted': 'Dernier contact',
    'firstname': 'Prénom',
    'name': 'Nom',
    'data_section': 'Section de données',
    'full_name': 'Nom complet',
    'email_domain': 'Domaine email',
    'contact_active': 'Contact actif',
    'tel': 'Téléphone',
    'mobile': 'Mobile',
    'mobile_2': 'Mobile 2',
    'tel_pro': 'Téléphone professionnel',
    'address': 'Adresse',
    'departement': 'Département',
    'linkedin_function': 'Fonction LinkedIn',
    'industrie': 'Industrie',
    'linkedin_url': 'URL LinkedIn',
    'linkedin_company_url': 'URL LinkedIn entreprise',
    'company_website': 'Site web entreprise',
    'systemeio_list': 'Liste Systeme.io',
    'apollo_list': 'Liste Apollo',
    'brevo_tag': 'Tag Brevo',
    'zoho_tag': 'Tag Zoho',
    'zoho_status': 'Statut Zoho',
    'apollo_status': 'Statut Apollo',
    'brevo_status': 'Statut Brevo',
    'hubspot_status': 'Statut HubSpot',
    'systemeio_status': 'Statut Systeme.io'
  };
  
  return translations[columnName] || columnName;
};

const generateSectionColor = (sectionName: string) => {
  const normalizedName = sectionName.toLowerCase().trim();
  const finalName = normalizedName === 'arlynk' || normalizedName === 'arlynk' ? 'arlynk' : normalizedName;

  if (finalName === 'arlynk') {
    return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300';
  } else if (finalName === 'aicademia') {
    return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-300';
  }

  return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-300';
};

const ContactDetails: React.FC = () => {
  const { tableName, contactId } = useParams<{ tableName: 'apollo_contacts' | 'crm_contacts'; contactId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les données du contact spécifique
  const { data: contact, loading } = useContact({
    tableName: tableName!,
    contactId: contactId!
  });

  const handleAssignContact = async (salesEmail: string) => {
    setIsAssigning(true);
    try {
      // TODO: Implémenter la logique d'assignation
      toast({
        title: "Contact assigné",
        description: `Contact assigné à ${salesEmail} avec succès.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'assigner le contact."
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...contact });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from(tableName!)
        .update(editedData)
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Contact mis à jour",
        description: "Les modifications ont été sauvegardées avec succès."
      });
      
      setIsEditing(false);
      setEditedData({});
      
      // Refresh the contact data
      window.location.reload();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des détails du contact...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Contact non trouvé</h2>
          <p className="text-muted-foreground mb-4">Le contact demandé n'existe pas ou n'est plus disponible.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const formatValue = (value: any, columnName: string) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Non renseigné</span>;
    }
    
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Oui' : 'Non'}</Badge>;
    }

    if (columnName === 'data_section' && value) {
      if (value.includes(',')) {
        const sections = value.split(',').map((section: string) => section.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {sections.map((section: string, index: number) => {
              const colorClass = generateSectionColor(section);
              return (
                <span key={index} className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colorClass}`}>
                  {section}
                </span>
              );
            })}
          </div>
        );
      } else {
        const colorClass = generateSectionColor(value);
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colorClass}`}>
            {value}
          </span>
        );
      }
    }

    if (columnName.includes('date') || columnName.includes('_at')) {
      try {
        const date = new Date(value);
        return <span>{date.toLocaleString('fr-FR')}</span>;
      } catch {
        return <span>{value}</span>;
      }
    }

    if (columnName.includes('url') && value) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {value}
        </a>
      );
    }

    if (columnName.includes('email') && value) {
      return (
        <a href={`mailto:${value}`} className="text-primary hover:underline flex items-center gap-1">
          <Mail className="h-3 w-3" />
          {value}
        </a>
      );
    }

    if (columnName.includes('phone') && value) {
      return (
        <a href={`tel:${value}`} className="text-primary hover:underline flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {value}
        </a>
      );
    }

    return <span>{value}</span>;
  };

  const getDisplayName = () => {
    if (tableName === 'apollo_contacts') {
      const firstName = contact.first_name || '';
      const lastName = contact.last_name || '';
      return `${firstName} ${lastName}`.trim() || contact.email;
    } else {
      const firstName = contact.firstname || '';
      const lastName = contact.name || '';
      return contact.full_name || `${firstName} ${lastName}`.trim() || contact.email;
    }
  };

  // Organiser tous les champs disponibles par catégories
  const getAllAvailableFields = () => {
    if (!contact) return [];
    return Object.keys(contact).filter(field => 
      contact[field] !== null && 
      contact[field] !== undefined && 
      contact[field] !== '' &&
      field !== 'id' // Exclure l'ID car déjà affiché
    );
  };

  const categorizeFields = (fields: string[]) => {
    const personalFields = fields.filter(field => 
      ['firstname', 'name', 'full_name', 'first_name', 'last_name', 'email', 'title', 'linkedin_function', 'seniority', 'person_linkedin_url', 'linkedin_url'].includes(field)
    );

    const companyFields = fields.filter(field => 
      ['company', 'company_website', 'website', 'linkedin_company_url', 'company_linkedin_url', 'industrie', 'industry', 'nb_employees', 'num_employees', 'company_phone', 'company_address', 'company_city', 'company_country', 'company_state', 'subsidiary_of', 'annual_revenue', 'total_funding', 'latest_funding'].includes(field)
    );

    const contactFields = fields.filter(field => 
      ['tel', 'tel_pro', 'mobile', 'mobile_2', 'work_direct_phone', 'mobile_phone', 'home_phone', 'corporate_phone', 'other_phone', 'address', 'city', 'country', 'state', 'departement', 'region'].includes(field)
    );

    const statusFields = fields.filter(field => 
      ['data_section', 'contact_active', 'statut', 'lifecycle_stage', 'stage', 'email_status', 'email_confidence', 'zoho_status', 'apollo_status', 'brevo_status', 'hubspot_status', 'systemeio_status', 'arlynk_status', 'aicademia_high_status', 'aicademia_low_status'].includes(field)
    );

    const scoresFields = fields.filter(field => 
      ['total_score', 'zoho_ma_score', 'zoho_crm_notation_score', 'arlynk_score', 'aicademia_score', 'email_confidence'].includes(field)
    );

    const platformFields = fields.filter(field => 
      ['apollo_account_id', 'apollo_contact_id', 'apollo_list', 'apollo_description', 'apollo_owner', 'apollo_last_contact', 'apollo_email_verification', 'systemeio_list', 'brevo_tag', 'zoho_tag', 'hubspot_lead_status', 'hubspot_contact_owner', 'hubspot_life_cycle_phase'].includes(field)
    );

    const activityFields = fields.filter(field => 
      ['email_sent', 'email_open', 'email_bounced', 'replied', 'demoed', 'last_contacted', 'zoho_last_activity', 'hubspot_last_activity', 'brevo_last_mail_campain', 'brevo_last_sms_campain', 'apollo_last_contact'].includes(field)
    );

    const sequenceFields = fields.filter(field => 
      ['apollo_arlynk_sequence', 'apollo_open_number_arlynk_sequence', 'apollo_click_number_arlynk_sequence', 'apollo_reply_number_arlynk_sequence', 'apollo_aicademia_sequence', 'apollo_open_number_aicademia_sequence', 'apollo_click_number_aicademia_sequence', 'apollo_reply_number_aicademia_sequence'].includes(field)
    );

    const coldOutreachFields = fields.filter(field => 
      ['arlynk_cold_status', 'arlynk_cold_note', 'arlynk_cold_action_date', 'arlynk_cold_relance2', 'arlynk_cold_relance3', 'aicademia_cold_status', 'aicademia_cold_note', 'aicademia_cold_action_date', 'aicademia_cold_relance2', 'aicademia_cold_relance3'].includes(field)
    );

    const technicalFields = fields.filter(field => 
      ['technologies', 'keywords', 'departments', 'categorie_fonction', 'activity', 'lists', 'secteur_activite'].includes(field)
    );

    const otherFields = fields.filter(field => 
      !personalFields.includes(field) &&
      !companyFields.includes(field) &&
      !contactFields.includes(field) &&
      !statusFields.includes(field) &&
      !scoresFields.includes(field) &&
      !platformFields.includes(field) &&
      !activityFields.includes(field) &&
      !sequenceFields.includes(field) &&
      !coldOutreachFields.includes(field) &&
      !technicalFields.includes(field) &&
      !['created_at', 'updated_at', 'last_sync_at', 'last_contacted', 'last_raised_at'].includes(field)
    );

    return {
      personalFields,
      companyFields,
      contactFields,
      statusFields,
      scoresFields,
      platformFields,
      activityFields,
      sequenceFields,
      coldOutreachFields,
      technicalFields,
      otherFields
    };
  };

  const allFields = getAllAvailableFields();
  const categorizedFields = categorizeFields(allFields);

  const renderFieldGroup = (title: string, fields: string[], icon: React.ReactNode) => {
    if (fields.length === 0) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map(field => {
            const value = isEditing ? editedData[field] : contact[field];
            
            return (
              <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground min-w-[200px]">
                  {translateColumnName(field)}:
                </span>
                <div className="flex-1">
                  {isEditing ? renderEditableField(field, value) : formatValue(value, field)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderEditableField = (fieldName: string, value: any) => {
    // Handle data_section as a select
    if (fieldName === 'data_section') {
      return (
        <Select value={value || ''} onValueChange={(newValue) => handleFieldChange(fieldName, newValue)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arlynk">Arlynk</SelectItem>
            <SelectItem value="Aicademia">Aicademia</SelectItem>
            <SelectItem value="Arlynk, Aicademia">Arlynk, Aicademia</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Handle boolean fields
    if (typeof contact[fieldName] === 'boolean') {
      return (
        <Select value={value?.toString() || 'false'} onValueChange={(newValue) => handleFieldChange(fieldName, newValue === 'true')}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Oui</SelectItem>
            <SelectItem value="false">Non</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Handle long text fields with textarea
    if (fieldName.includes('description') || fieldName.includes('note') || fieldName.includes('comment')) {
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          className="w-full"
          rows={3}
        />
      );
    }

    // Handle number fields
    if (typeof contact[fieldName] === 'number' || fieldName.includes('score') || fieldName.includes('employees') || fieldName.includes('revenue') || fieldName.includes('funding')) {
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleFieldChange(fieldName, e.target.value ? parseFloat(e.target.value) : null)}
          className="w-full"
        />
      );
    }

    // Default: text input
    return (
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
        className="w-full"
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section - Informations de résumé */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b shadow-sm">
        <div className="max-w-6xl mx-auto p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{getDisplayName()}</h1>
                <p className="text-muted-foreground">
                  {tableName === 'apollo_contacts' ? 'Contact Apollo' : 'Contact CRM'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleEdit}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Select onValueChange={handleAssignContact} disabled={isAssigning}>
                    <SelectTrigger className="w-[240px] h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 font-medium">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Assigner à un commercial</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="w-[240px]">
                      <SelectItem value="sales1@company.com" className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">John Doe</div>
                            <div className="text-sm text-gray-500">Commercial Senior</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="sales2@company.com" className="flex items-center gap-3 p-3 hover:bg-green-50 cursor-pointer">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Jane Smith</div>
                            <div className="text-sm text-gray-500">Responsable Ventes</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="sales3@company.com" className="flex items-center gap-3 p-3 hover:bg-purple-50 cursor-pointer">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Mike Johnson</div>
                            <div className="text-sm text-gray-500">Commercial Junior</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Contact Overview Card */}
          <Card className="bg-white/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{getDisplayName()}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    {contact.company && (
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {contact.company}
                      </div>
                    )}
                    {(contact.title || contact.linkedin_function) && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {contact.title || contact.linkedin_function}
                      </div>
                    )}
                    {(contact.city || contact.company_city) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {contact.city || contact.company_city}
                      </div>
                    )}
                  </div>
                  
                  {/* Data Section Badges */}
                  {contact.data_section && (
                    <div className="flex flex-wrap gap-2">
                      {contact.data_section.includes(',') ? (
                        contact.data_section.split(',').map((section: string) => section.trim()).filter(Boolean).map((section: string, index: number) => {
                          const colorClass = generateSectionColor(section);
                          return (
                            <span key={index} className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colorClass}`}>
                              {section}
                            </span>
                          );
                        })
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${generateSectionColor(contact.data_section)}`}>
                          {contact.data_section}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Body Section - Informations détaillées */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {renderFieldGroup('Informations personnelles', categorizedFields.personalFields, <User className="h-5 w-5" />)}
          {renderFieldGroup('Entreprise', categorizedFields.companyFields, <Building className="h-5 w-5" />)}
          {renderFieldGroup('Contact', categorizedFields.contactFields, <Phone className="h-5 w-5" />)}
          {renderFieldGroup('Statut & Suivi', categorizedFields.statusFields, <Tag className="h-5 w-5" />)}
          {renderFieldGroup('Scores & Évaluations', categorizedFields.scoresFields, <User className="h-5 w-5" />)}
          {renderFieldGroup('Plateformes & Intégrations', categorizedFields.platformFields, <Building className="h-5 w-5" />)}
          {renderFieldGroup('Activité & Engagement', categorizedFields.activityFields, <Phone className="h-5 w-5" />)}
          {renderFieldGroup('Séquences Marketing', categorizedFields.sequenceFields, <Tag className="h-5 w-5" />)}
          {renderFieldGroup('Cold Outreach', categorizedFields.coldOutreachFields, <User className="h-5 w-5" />)}
          {renderFieldGroup('Informations techniques', categorizedFields.technicalFields, <Building className="h-5 w-5" />)}
          {renderFieldGroup('Autres informations', categorizedFields.otherFields, <Tag className="h-5 w-5" />)}
        </div>

        {/* Dates importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {['created_at', 'updated_at', 'last_sync_at', 'last_contacted', 'last_raised_at'].map(field => {
                const value = contact[field];
                if (!value) return null;
                
                return (
                  <div key={field} className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{translateColumnName(field)}</p>
                    <p className="font-medium">{formatValue(value, field)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactDetails;