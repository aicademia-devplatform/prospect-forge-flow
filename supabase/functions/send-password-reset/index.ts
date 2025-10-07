import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  userId: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the user making the request is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || userRole?.role !== "admin") {
      throw new Error("Only admins can reset passwords");
    }

    const { userId, userEmail }: PasswordResetRequest = await req.json();

    console.log("Generating password reset link for user:", userId);

    // Generate password reset link using Supabase Admin API
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: userEmail,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace("/v1", "")}/auth/v1/verify`,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      throw resetError;
    }

    console.log("Reset link generated, sending email to:", userEmail);

    // Configure SMTP client
    const smtpClient = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: true,
        auth: {
          username: Deno.env.get("GMAIL_USER") || "",
          password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
        },
      },
    });

    // Send email with reset link
    await smtpClient.send({
      from: Deno.env.get("GMAIL_USER") || "",
      to: userEmail,
      subject: "Réinitialisation de votre mot de passe",
      content: "auto",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Réinitialisation de mot de passe</h1>
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetData.properties.action_link}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
          <p style="color: #666; font-size: 14px;">Ce lien expirera dans 1 heure.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">Cordialement,<br>L'équipe Admin</p>
        </div>
      `,
    });

    await smtpClient.close();

    console.log("Email sent successfully via SMTP");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de réinitialisation envoyé avec succès" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
