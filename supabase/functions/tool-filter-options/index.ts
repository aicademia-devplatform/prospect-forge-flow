import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ToolFilterOptionsRequest {
  tableName: string
  tools: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { tableName, tools }: ToolFilterOptionsRequest = await req.json()

    console.log('Fetching filter options for tools:', tools, 'from table:', tableName)

    // Définir les colonnes à interroger pour chaque outil
    const toolColumns: Record<string, string[]> = {
      systemeio: ['systemeio_list'],
      brevo: ['brevo_tag', 'brevo_unsuscribe'],
      zoho: ['zoho_status', 'zoho_tag', 'zoho_updated_by', 'zoho_product_interest', 'zoho_status_2'],
      hubspot: ['hubspot_lead_status', 'hubspot_life_cycle_phase', 'hubspot_buy_role'],
      apollo: ['apollo_status', 'apollo_list']
    }

    const options: Record<string, string[]> = {}

    // Pour chaque outil demandé, récupérer les valeurs distinctes
    for (const tool of tools) {
      const columns = toolColumns[tool]
      if (!columns) {
        console.warn(`Unknown tool: ${tool}`)
        continue
      }

      for (const column of columns) {
        try {
          // Cas spécial pour brevo_unsuscribe (boolean)
          if (column === 'brevo_unsuscribe') {
            options[column] = ['true', 'false']
            continue
          }

          // Requête pour obtenir les valeurs distinctes
          const { data, error } = await supabase
            .from(tableName)
            .select(column)
            .not(column, 'is', null)
            .limit(1000) // Limite large pour collecter toutes les valeurs

          if (error) {
            console.error(`Error fetching ${column}:`, error)
            continue
          }

          if (!data || data.length === 0) {
            options[column] = []
            continue
          }

          // Extraire et dédupliquer les valeurs
          const values = new Set<string>()
          data.forEach((row: any) => {
            const value = row[column]
            if (value !== null && value !== undefined && value !== '') {
              // Convertir en string et nettoyer
              const strValue = String(value).trim()
              if (strValue) {
                values.add(strValue)
              }
            }
          })

          // Convertir en tableau et limiter à 100 valeurs max, trier alphabétiquement
          const sortedValues = Array.from(values).sort().slice(0, 100)
          options[column] = sortedValues

          console.log(`Found ${sortedValues.length} distinct values for ${column}`)

        } catch (error) {
          console.error(`Exception fetching ${column}:`, error)
          options[column] = []
        }
      }
    }

    return new Response(
      JSON.stringify({
        options,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})


