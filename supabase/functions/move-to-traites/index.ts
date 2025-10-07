import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MoveToTraitesRequest {
  assignmentId: string
  notes_sales?: string
  statut_prospect?: string
  date_action?: string
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

    const { 
      assignmentId, 
      notes_sales, 
      statut_prospect, 
      date_action 
    }: MoveToTraitesRequest = await req.json()

    console.log('Moving assignment to traités:', { assignmentId, user: user.id })

    // Get the original assignment
    const { data: assignment, error: getError } = await supabase
      .from('sales_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('sales_user_id', user.id)
      .single()

    if (getError || !assignment) {
      throw new Error('Assignment not found or not authorized')
    }

    // Create the processed prospect record
    const { data: processedProspect, error: insertError } = await supabase
      .from('prospects_traites')
      .insert({
        original_assignment_id: assignment.id,
        sales_user_id: assignment.sales_user_id,
        sdr_id: user.id, // Enregistrer l'ID du SDR qui a traité le prospect
        source_table: assignment.source_table,
        source_id: assignment.source_id,
        lead_email: assignment.lead_email,
        custom_table_name: assignment.custom_table_name,
        custom_data: assignment.custom_data,
        assigned_by: assignment.assigned_by,
        assigned_at: assignment.assigned_at,
        notes_sales: notes_sales || assignment.notes_sales,
        statut_prospect: statut_prospect || assignment.statut_prospect,
        date_action: date_action ? new Date(date_action).toISOString() : assignment.date_action,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting processed prospect:', insertError)
      throw insertError
    }

    // Delete the original assignment
    const { error: deleteError } = await supabase
      .from('sales_assignments')
      .delete()
      .eq('id', assignmentId)
      .eq('sales_user_id', user.id)

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError)
      throw deleteError
    }

    console.log('Successfully moved prospect to traités')

    return new Response(
      JSON.stringify({
        success: true,
        processedProspect
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
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})