import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryParams {
  tableName?: 'apollo_contacts' | 'crm_contacts'
  contactId?: string
  email?: string
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

    const { tableName, contactId, email: queryEmail }: QueryParams = await req.json()

    console.log('Getting contact:', { tableName, contactId, email: queryEmail })

    let allContactData: ContactData[] = []

    // Si on recherche par email, chercher dans toutes les tables
    if (queryEmail) {
      console.log('Searching by email:', queryEmail)
      
      // Chercher dans les deux tables
      const tables: ('apollo_contacts' | 'crm_contacts')[] = ['apollo_contacts', 'crm_contacts']
      
      for (const table of tables) {
        const { data: contacts, error } = await supabase
          .from(table)
          .select('*')
          .eq('email', queryEmail)

        if (!error && contacts && contacts.length > 0) {
          console.log(`Found ${contacts.length} contact(s) in ${table}`)
          contacts.forEach(contact => {
            allContactData.push({
              source_table: table,
              data: contact
            })
          })
        } else if (error) {
          console.error(`Error searching in ${table}:`, error)
        }
      }
    } else if (tableName && contactId) {
      // Recherche par ID (ancienne logique)
      const { data: mainContact, error: mainError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', contactId)
        .single()

      if (mainError) {
        console.error('Database error:', mainError)
        throw mainError
      }

      if (mainContact) {
        console.log(`Found main contact:`, 'Yes')
        
        // Ajouter le contact principal
        allContactData.push({
          source_table: tableName,
          data: mainContact
        })

        // Rechercher dans l'autre table si l'email existe
        const email = mainContact.email
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
      }
    }

    if (allContactData.length === 0) {
      console.log('No contacts found')
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