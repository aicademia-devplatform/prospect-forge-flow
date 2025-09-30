import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log('Starting migration of existing bouclé prospects for user:', user.id)

    // Find all existing assignments with boucle = true
    const { data: boucleAssignments, error: findError } = await supabase
      .from('sales_assignments')
      .select('*')
      .eq('sales_user_id', user.id)
      .eq('boucle', true)
      .eq('status', 'active')

    if (findError) {
      console.error('Error finding bouclé assignments:', findError)
      throw findError
    }

    console.log(`Found ${boucleAssignments?.length || 0} bouclé assignments to migrate`)

    let migratedCount = 0
    let errors = []

    // Migrate each bouclé assignment to prospects_traites
    for (const assignment of boucleAssignments || []) {
      try {
        // Create the processed prospect record
        const { error: insertError } = await supabase
          .from('prospects_traites')
          .insert({
            original_assignment_id: assignment.id,
            sales_user_id: assignment.sales_user_id,
            source_table: assignment.source_table,
            source_id: assignment.source_id,
            lead_email: assignment.lead_email,
            custom_table_name: assignment.custom_table_name,
            custom_data: assignment.custom_data,
            assigned_by: assignment.assigned_by,
            assigned_at: assignment.assigned_at,
            notes_sales: assignment.notes_sales,
            statut_prospect: assignment.statut_prospect,
            date_action: assignment.date_action,
          })

        if (insertError) {
          console.error(`Error inserting prospect ${assignment.lead_email}:`, insertError)
          errors.push({ email: assignment.lead_email, error: insertError.message })
          continue
        }

        // Delete the original assignment
        const { error: deleteError } = await supabase
          .from('sales_assignments')
          .delete()
          .eq('id', assignment.id)

        if (deleteError) {
          console.error(`Error deleting assignment ${assignment.id}:`, deleteError)
          errors.push({ email: assignment.lead_email, error: deleteError.message })
          continue
        }

        migratedCount++
        console.log(`Successfully migrated prospect: ${assignment.lead_email}`)
      } catch (error) {
        console.error(`Error processing assignment ${assignment.id}:`, error)
        errors.push({ email: assignment.lead_email, error: error.message })
      }
    }

    console.log(`Migration completed. Migrated: ${migratedCount}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        migrated: migratedCount,
        total: boucleAssignments?.length || 0,
        errors: errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Migration function error:', error)
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