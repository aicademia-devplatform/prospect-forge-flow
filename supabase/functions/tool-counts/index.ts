import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tableName } = await req.json();

    console.log("Fetching tool counts for table:", tableName);

    // Utiliser des requêtes SQL optimisées avec COUNT pour chaque outil
    // Cela évite de charger toutes les données en mémoire

    const countPromises = [
      // Systeme.io
      supabase
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .not("systemeio_list", "is", null),

      // Brevo
      supabase
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .not("brevo_tag", "is", null),

      // Zoho
      supabase
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .or("zoho_status.not.is.null,zoho_tag.not.is.null"),

      // HubSpot
      supabase
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .not("hubspot_lead_status", "is", null),

      // Apollo
      supabase
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .or("apollo_status.not.is.null,apollo_list.not.is.null"),
    ];

    const results = await Promise.all(countPromises);

    // Vérifier les erreurs
    for (let i = 0; i < results.length; i++) {
      if (results[i].error) {
        console.error(`Error counting tool ${i}:`, results[i].error);
        throw results[i].error;
      }
    }

    const counts = {
      systemeio: results[0].count || 0,
      brevo: results[1].count || 0,
      zoho: results[2].count || 0,
      hubspot: results[3].count || 0,
      apollo: results[4].count || 0,
    };

    console.log("Tool counts:", counts);

    return new Response(
      JSON.stringify({
        counts,
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
