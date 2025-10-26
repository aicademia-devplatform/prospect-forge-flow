import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Valider le rôle (sdr ou sales)
    const validRoles = ['sdr', 'sales'];
    const userRole = role || 'sdr'; // Par défaut SDR
    
    if (!validRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({ error: "Rôle invalide. Doit être 'sdr' ou 'sales'" }),
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

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé - token d'authentification requis" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Non autorisé - token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller has permission to invite users
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !callerRole || !['admin', 'sales', 'marketing'].includes(callerRole.role)) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes - seuls les admin, sales ou marketing peuvent inviter des utilisateurs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use verified user.id as inviterId
    const inviterId = user.id;

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

    // Assigner le rôle avec manager_id si c'est un SDR invité par un sales
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: userRole,
        assigned_by: inviterId
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
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

    // Configurer le client SMTP Gmail
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get("GMAIL_USER") || "",
          password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
        },
      },
    });

    // Envoyer l'email d'invitation
    await client.send({
      from: Deno.env.get("GMAIL_USER") || "",
      to: email,
      subject: "Invitation à rejoindre l'équipe Sales",
      content: "text/html",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">Bienvenue !</h1>
            <p>Vous avez été invité(e) à rejoindre l'équipe Sales.</p>
            <p>Cliquez sur le bouton ci-dessous pour configurer votre compte :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
                Configurer mon compte
              </a>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${magicLink}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">Ce lien expirera dans 24 heures.</p>
          </body>
        </html>
      `,
    });

    await client.close();

    console.log("Invitation email sent successfully to:", email);

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
