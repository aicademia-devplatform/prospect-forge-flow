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

    // Count occurrences of each section, normalizing and splitting combined sections
    const sectionCounts: { [key: string]: number } = {}
    
    data?.forEach(item => {
      if (item.data_section) {
        // Split combined sections by comma and process each individually
        const individualSections = item.data_section.split(',').map(s => s.trim()).filter(Boolean)
        
        individualSections.forEach(section => {
          // Normalize section names (case-insensitive, handle ARlynk/Arlynk)
          let normalizedSection = section.trim()
          
          // Normalize ARlynk to Arlynk
          if (normalizedSection.toLowerCase() === 'arlynk') {
            normalizedSection = 'Arlynk'
          } else if (normalizedSection.toLowerCase() === 'aicademia') {
            normalizedSection = 'Aicademia'
          }
          
          sectionCounts[normalizedSection] = (sectionCounts[normalizedSection] || 0) + 1
        })
      }
    })

    // Convert to array and sort by count
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
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})