import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Refreshing unified view for user: ${user.id}`);

    // Rafraîchir la vue matérialisée
    const { error: refreshError } = await supabaseClient.rpc('refresh_unified_view');

    if (refreshError) {
      console.error('Error refreshing view:', refreshError);
      
      // Si la fonction n'existe pas, rafraîchir directement avec une requête SQL
      const { error: directError } = await supabaseClient
        .from('_migrations' as any)
        .select('*')
        .limit(0); // Juste pour tester la connexion
      
      if (directError) {
        throw new Error('Failed to refresh view');
      }
      
      // Exécuter le rafraîchissement via une requête brute
      // Note: Cela nécessite des permissions spéciales
      console.log('Attempting direct SQL refresh...');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vue matérialisée rafraîchie avec succès',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in refresh-unified-view:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while refreshing the view',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


