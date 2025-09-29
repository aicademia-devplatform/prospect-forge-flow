import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryParams {
  tableName: 'apollo_contacts' | 'crm_contacts'
  contactId: string
}

interface ContactData {
  source_table: string
  data: any
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

    const { tableName, contactId }: QueryParams = await req.json()

    console.log('Getting contact:', { tableName, contactId })

    // Récupérer le contact principal
    const { data: mainContact, error: mainError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', contactId)
      .single()

    if (mainError) {
      console.error('Database error:', mainError)
      throw mainError
    }

    if (!mainContact) {
      console.log('Contact not found')
      return new Response(
        JSON.stringify({
          data: null,
          success: false,
          error: 'Contact not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    console.log(`Found main contact:`, mainContact ? 'Yes' : 'No')

    // Rechercher le même contact dans les autres tables par email
    const email = mainContact.email
    const allContactData: ContactData[] = []

    // Ajouter le contact principal
    allContactData.push({
      source_table: tableName,
      data: mainContact
    })

    // Rechercher dans l'autre table si l'email existe
    const otherTableName = tableName === 'crm_contacts' ? 'apollo_contacts' : 'crm_contacts'
    
    if (email) {
      const { data: otherContact, error: otherError } = await supabase
        .from(otherTableName)
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (!otherError && otherContact) {
        console.log(`Found contact in ${otherTableName}:`, 'Yes')
        allContactData.push({
          source_table: otherTableName,
          data: otherContact
        })
      } else if (otherError) {
        console.error(`Error searching in ${otherTableName}:`, otherError)
      } else {
        console.log(`No contact found in ${otherTableName}`)
      }
    }

    return new Response(
      JSON.stringify({
        data: allContactData,
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