import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { CallbackReminderEmail } from "./_templates/callback-reminder.tsx";

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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

    // Récupérer la date actuelle
    const now = new Date();
    console.log('Checking for callback reminders at:', now.toISOString());

    // Récupérer les prospects à rappeler dont la date est <= maintenant
    // et qui n'ont pas déjà reçu une notification aujourd'hui
    const { data: prospectsToRemind, error: prospectsError } = await supabase
      .from('prospects_a_rappeler')
      .select(`
        *,
        profiles!prospects_a_rappeler_sales_user_id_fkey (
          email,
          first_name,
          last_name
        )
      `)
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

    console.log(`Sending reminders to ${prospectsByUser.size} users`);

    const results = [];
    
    // Envoyer un email à chaque utilisateur avec ses prospects à rappeler
    for (const [userId, prospects] of prospectsByUser) {
      const userProfile = prospects[0].profiles;
      
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
            appUrl: Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://app.lovable.dev',
          })
        );

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'CRM Prospects <onboarding@resend.dev>',
          to: [userProfile.email],
          subject: `🔔 Rappel : ${prospects.length} prospect${prospects.length > 1 ? 's' : ''} à contacter aujourd'hui`,
          html,
        });

        if (emailError) {
          console.error(`Error sending email to ${userProfile.email}:`, emailError);
          throw emailError;
        }

        console.log(`Email sent to ${userProfile.email}:`, emailData);

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
