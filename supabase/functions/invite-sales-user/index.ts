import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Format d'email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer un client Supabase avec la clé service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);

    if (userExists) {
      return new Response(
        JSON.stringify({ error: "Un utilisateur avec cet email existe déjà" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer l'utilisateur avec un mot de passe temporaire
    const tempPassword = crypto.randomUUID();
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        role: 'sales'
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Générer un lien de réinitialisation de mot de passe
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
    }

    const magicLink = resetData?.properties?.action_link || `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify`;

    // Envoyer l'email d'invitation via Resend
    const emailResponse = await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: [email],
      subject: "Invitation à rejoindre l'équipe Sales",
      html: `
        <h1>Bienvenue !</h1>
        <p>Vous avez été invité(e) à rejoindre l'équipe Sales.</p>
        <p>Cliquez sur le lien ci-dessous pour configurer votre compte :</p>
        <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Configurer mon compte
        </a>
        <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
        <p>${magicLink}</p>
        <p>Ce lien expirera dans 24 heures.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser.user,
        message: "Invitation envoyée avec succès"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in invite-sales-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
