import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { CallbackReminderEmail } from "./_templates/callback-reminder.tsx";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.');
    }

    // Configuration du client SMTP Gmail
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    // Récupérer la date actuelle
    const now = new Date();
    console.log('Checking for callback reminders at:', now.toISOString());

    // Récupérer les prospects à rappeler dont la date est <= maintenant
    // et qui n'ont pas déjà reçu une notification aujourd'hui
    const { data: prospectsToRemind, error: prospectsError } = await supabase
      .from('prospects_a_rappeler')
      .select('*')
      .lte('callback_date', now.toISOString())
      .is('reminder_sent_at', null);

    if (prospectsError) {
      console.error('Error fetching prospects:', prospectsError);
      throw prospectsError;
    }

    console.log(`Found ${prospectsToRemind?.length || 0} prospects to remind`);

    if (!prospectsToRemind || prospectsToRemind.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send', count: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Grouper les prospects par utilisateur
    const prospectsByUser = new Map<string, typeof prospectsToRemind>();
    
    for (const prospect of prospectsToRemind) {
      const userId = prospect.sales_user_id;
      if (!prospectsByUser.has(userId)) {
        prospectsByUser.set(userId, []);
      }
      prospectsByUser.get(userId)!.push(prospect);
    }

    // Récupérer les profils des utilisateurs
    const userIds = Array.from(prospectsByUser.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    console.log(`Sending reminders to ${prospectsByUser.size} users`);

    const results = [];
    
    // Envoyer un email à chaque utilisateur avec ses prospects à rappeler
    for (const [userId, prospects] of prospectsByUser) {
      const userProfile = profiles?.find(p => p.id === userId);
      
      if (!userProfile?.email) {
        console.warn(`No email found for user ${userId}`);
        continue;
      }

      const userName = userProfile.first_name 
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
        : userProfile.email;

      // Récupérer les données complètes des prospects depuis crm_contacts
      const prospectEmails = prospects.map(p => p.lead_email);
      const { data: crmData } = await supabase
        .from('crm_contacts')
        .select('email, company, firstname, name')
        .in('email', prospectEmails);

      // Enrichir les données des prospects
      const enrichedProspects = prospects.map(p => {
        const crmContact = crmData?.find(c => c.email === p.lead_email);
        return {
          email: p.lead_email,
          company: crmContact?.company,
          statut_prospect: p.statut_prospect,
          callback_date: p.callback_date,
          notes_sales: p.notes_sales,
        };
      });

      try {
        const html = await renderAsync(
          React.createElement(CallbackReminderEmail, {
            userName,
            prospects: enrichedProspects,
            appUrl: 'https://sales.aicademia.fr',
          })
        );

        await client.send({
          from: gmailUser,
          to: userProfile.email,
          subject: `🔔 Rappel : ${prospects.length} prospect${prospects.length > 1 ? 's' : ''} à contacter aujourd'hui`,
          html: html,
        });

        console.log(`Email sent to ${userProfile.email}`);

        // Marquer les prospects comme ayant reçu une notification
        const prospectIds = prospects.map(p => p.id);
        const { error: updateError } = await supabase
          .from('prospects_a_rappeler')
          .update({ reminder_sent_at: now.toISOString() })
          .in('id', prospectIds);

        if (updateError) {
          console.error('Error updating reminder_sent_at:', updateError);
        }

        // Créer des notifications dans la base de données
        const notifications = prospects.map(p => ({
          user_id: userId,
          type: 'callback_reminder',
          title: 'Prospect à rappeler',
          message: `Il est temps de rappeler ${p.lead_email}`,
          data: {
            prospect_id: p.id,
            lead_email: p.lead_email,
            callback_date: p.callback_date,
          },
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating notifications:', notifError);
        }

        // Créer des entrées dans l'historique pour chaque prospect
        const modifications = prospects.map(p => ({
          lead_email: p.lead_email,
          modified_by: userId,
          notes: `Rappel automatique envoyé par email - Statut: ${p.statut_prospect}`,
          modified_fields: {
            action: 'email_reminder_sent',
            callback_date: p.callback_date,
            sent_at: now.toISOString()
          }
        }));

        const { error: modifError } = await supabase
          .from('prospect_modifications')
          .insert(modifications);

        if (modifError) {
          console.error('Error creating modification history:', modifError);
        }

        results.push({
          user: userProfile.email,
          prospects: prospects.length,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to send email to ${userProfile.email}:`, error);
        results.push({
          user: userProfile.email,
          prospects: prospects.length,
          success: false,
          error: error.message,
        });
      }
    }

    await client.close();

    return new Response(
      JSON.stringify({ 
        message: 'Reminders processed',
        results,
        total_users: prospectsByUser.size,
        total_prospects: prospectsToRemind.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-callback-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
