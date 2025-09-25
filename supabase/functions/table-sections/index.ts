import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { tableName }: { tableName: string } = await req.json()

    console.log('Getting sections for table:', tableName)

    if (tableName !== 'crm_contacts') {
      return new Response(
        JSON.stringify({ sections: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get all distinct sections with counts
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('data_section')
      .not('data_section', 'is', null)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Count occurrences of each section, but only for Arlynk and Aicademia
    const sectionCounts: { [key: string]: number } = {
      'Arlynk': 0,
      'Aicademia': 0
    }
    
    data?.forEach(item => {
      if (item.data_section) {
        // Split combined sections by comma and process each individually
        const individualSections = item.data_section.split(',').map((s: string) => s.trim()).filter(Boolean)
        
        individualSections.forEach((section: string) => {
          // Normalize section names and count only Arlynk and Aicademia
          const normalizedSection = section.trim().toLowerCase()
          
          if (normalizedSection === 'arlynk') {
            sectionCounts['Arlynk'] = (sectionCounts['Arlynk'] || 0) + 1
          } else if (normalizedSection === 'aicademia') {
            sectionCounts['Aicademia'] = (sectionCounts['Aicademia'] || 0) + 1
          }
        })
      }
    })

    // Convert to array with only Arlynk and Aicademia
    const sections = Object.entries(sectionCounts)
      .map(([value, count]) => ({
        value,
        label: `${value} (${count.toLocaleString('fr-FR')})`,
        count
      }))
      .sort((a, b) => b.count - a.count)

    console.log(`Found ${sections.length} sections`)

    return new Response(
      JSON.stringify({ sections }),
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
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})