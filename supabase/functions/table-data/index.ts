import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryParams {
  tableName: 'apollo_contacts' | 'crm_contacts'
  page: number
  pageSize: number
  searchTerm?: string
  sectionFilter?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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

    const { 
      tableName, 
      page, 
      pageSize, 
      searchTerm, 
      sectionFilter, 
      sortBy = 'created_at', 
      sortOrder = 'desc' 
    }: QueryParams = await req.json()

    console.log('Query params:', { tableName, page, pageSize, searchTerm, sectionFilter, sortBy, sortOrder })

    // Build the query
    let query = supabase.from(tableName).select('*', { count: 'exact' })

    // Apply section filter for CRM contacts
    if (tableName === 'crm_contacts' && sectionFilter && sectionFilter !== 'all') {
      query = query.eq('data_section', sectionFilter)
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`
      
      if (tableName === 'apollo_contacts') {
        query = query.or(`email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},company.ilike.${searchPattern}`)
      } else if (tableName === 'crm_contacts') {
        query = query.or(`email.ilike.${searchPattern},firstname.ilike.${searchPattern},name.ilike.${searchPattern},company.ilike.${searchPattern}`)
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log(`Returned ${data?.length || 0} records out of ${count || 0} total`)

    return new Response(
      JSON.stringify({
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
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
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})