import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryParams {
  page: number
  pageSize: number
  searchTerm?: string
  searchColumns?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  visibleColumns?: string[]
  filterMode?: 'assigned' | 'traites' | 'rappeler'
  advancedFilters?: {
    dateRange?: {
      from?: string
      to?: string
    }
    apolloStatus?: string
    industrie?: string
    company?: string
  }
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
      page, 
      pageSize, 
      searchTerm, 
      searchColumns = [],
      sortBy = 'assigned_at', 
      sortOrder = 'desc',
      visibleColumns = [],
      filterMode = 'assigned',
      advancedFilters = {}
    }: QueryParams = await req.json()

    console.log('Query params:', { page, pageSize, searchTerm, searchColumns, sortBy, sortOrder, visibleColumns, filterMode, advancedFilters })

    // Build query based on filter mode - get only the most recent assignment per email
    let assignmentsQuery = supabase
      .from('sales_assignments')
      .select('*')
      .eq('sales_user_id', user.id)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false })

    const { data: allAssignments, error: assignError } = await assignmentsQuery

    if (assignError) throw assignError

    // Group by email and take the most recent assignment for each email
    const latestAssignmentsByEmail = new Map()
    for (const assignment of allAssignments || []) {
      const email = assignment.lead_email
      if (!latestAssignmentsByEmail.has(email) || 
          new Date(assignment.assigned_at) > new Date(latestAssignmentsByEmail.get(email).assigned_at)) {
        latestAssignmentsByEmail.set(email, assignment)
      }
    }

    // Filter based on mode using the latest assignments
    let assignments = Array.from(latestAssignmentsByEmail.values())
    if (filterMode === 'traites') {
      // Filter for closed prospects: bouclé
      assignments = assignments.filter(assignment => assignment.boucle === true)
    } else if (filterMode === 'rappeler') {
      // Filter for prospects to call back
      assignments = assignments.filter(assignment => assignment.boucle === false)
    } else {
      // Default: active prospects (not bouclé) - exclude closed prospects from assigned view
      assignments = assignments.filter(assignment => assignment.boucle === false)
    }

    if (assignError) throw assignError

    let allProspects: any[] = []

    // Fetch prospect data from each assignment
    for (const assignment of assignments || []) {
      let prospectData: any = null
      
      if (assignment.source_table === 'apollo_contacts') {
        const { data } = await supabase
          .from('apollo_contacts')
          .select('*')
          .eq('id', assignment.source_id)
          .maybeSingle()
        prospectData = data
      } else if (assignment.source_table === 'crm_contacts') {
        const { data } = await supabase
          .from('crm_contacts')
          .select('*')
          .eq('id', parseInt(assignment.source_id))
          .maybeSingle()
        prospectData = data
      }

      if (prospectData) {
        // For "traites" mode, also check if contact has "barrage" or "déjà accompagné" status
        const isTraiteByStatus = filterMode === 'traites' && (
          prospectData.apollo_status === 'barrage' || 
          prospectData.apollo_status === 'déjà accompagné' ||
          prospectData.zoho_status === 'barrage' ||
          prospectData.zoho_status === 'déjà accompagné'
        )

        // Skip if filterMode is "traites" but assignment is not bouclé and doesn't have special status
        if (filterMode === 'traites' && !assignment.boucle && !isTraiteByStatus) {
          continue
        }

        // Normalize the data to match expected table format
        const normalizedProspect = {
          id: assignment.id,
          assignment_id: assignment.id,
          source_id: assignment.source_id,
          source_table: assignment.source_table,
          assigned_at: assignment.assigned_at,
          boucle: assignment.boucle,
          notes_sales: assignment.notes_sales,
          statut_prospect: assignment.statut_prospect,
          date_action: assignment.date_action,
          
          // Normalize field names to match table expectations
          email: prospectData.email,
          first_name: prospectData.first_name || prospectData.firstname || '',
          last_name: prospectData.last_name || prospectData.name || '',
          company: prospectData.company || '',
          title: prospectData.title || prospectData.linkedin_function || '',
          
          // Phone fields
          mobile_phone: prospectData.mobile_phone || prospectData.mobile || '',
          work_direct_phone: prospectData.work_direct_phone || prospectData.tel_pro || '',
          home_phone: prospectData.home_phone || prospectData.tel || '',
          
          // Status and other fields
          apollo_status: prospectData.apollo_status || prospectData.zoho_status || 'new',
          zoho_status: prospectData.zoho_status || '',
          industry: prospectData.industry || prospectData.industrie || '',
          seniority: prospectData.seniority || '',
          departments: prospectData.departments || '',
          stage: prospectData.stage || '',
          nb_employees: prospectData.nb_employees || prospectData.num_employees || null,
          
          // URLs
          person_linkedin_url: prospectData.person_linkedin_url || prospectData.linkedin_url || '',
          website: prospectData.website || prospectData.company_website || '',
          
          // Dates
          last_contacted: prospectData.last_contacted || prospectData.created_at,
          created_at: prospectData.created_at,
          updated_at: prospectData.updated_at,
          
          // Additional fields for display
          data_section: assignment.source_table === 'apollo_contacts' ? 'Apollo' : 'CRM',
          contact_active: 'Oui', // Since they're assigned
          data_source: assignment.source_table,
          
          // Include all original data in case needed
          _original_data: prospectData,
          _assignment_data: assignment
        }

        allProspects.push(normalizedProspect)
      }
    }

    // Apply search filter
    let filteredProspects = allProspects
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = searchTerm.toLowerCase()
      
      if (searchColumns && searchColumns.length > 0) {
        filteredProspects = filteredProspects.filter(prospect => 
          searchColumns.some(column => 
            prospect[column]?.toString().toLowerCase().includes(searchPattern)
          )
        )
      } else {
        // Default search columns
        filteredProspects = filteredProspects.filter(prospect => 
          (prospect.email?.toLowerCase().includes(searchPattern)) ||
          (prospect.first_name?.toLowerCase().includes(searchPattern)) ||
          (prospect.last_name?.toLowerCase().includes(searchPattern)) ||
          (prospect.company?.toLowerCase().includes(searchPattern))
        )
      }
    }

    // Apply advanced filters
    if (Object.keys(advancedFilters).length > 0) {
      if (advancedFilters.dateRange?.from) {
        filteredProspects = filteredProspects.filter(prospect => 
          new Date(prospect.assigned_at) >= new Date(advancedFilters.dateRange!.from!)
        )
      }
      if (advancedFilters.dateRange?.to) {
        const endDate = new Date(advancedFilters.dateRange.to)
        endDate.setDate(endDate.getDate() + 1)
        filteredProspects = filteredProspects.filter(prospect => 
          new Date(prospect.assigned_at) < endDate
        )
      }
      if (advancedFilters.apolloStatus) {
        filteredProspects = filteredProspects.filter(prospect => 
          prospect.apollo_status === advancedFilters.apolloStatus
        )
      }
      if (advancedFilters.industrie) {
        filteredProspects = filteredProspects.filter(prospect => 
          prospect.industry?.toLowerCase().includes(advancedFilters.industrie!.toLowerCase())
        )
      }
      if (advancedFilters.company) {
        filteredProspects = filteredProspects.filter(prospect => 
          prospect.company?.toLowerCase().includes(advancedFilters.company!.toLowerCase())
        )
      }
    }

    // Apply sorting
    filteredProspects.sort((a, b) => {
      const aVal = a[sortBy] || ''
      const bVal = b[sortBy] || ''
      
      let comparison = 0
      if (aVal < bVal) comparison = -1
      if (aVal > bVal) comparison = 1
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Apply pagination
    const totalCount = filteredProspects.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = filteredProspects.slice(startIndex, endIndex)

    console.log(`Returned ${paginatedData.length} records out of ${totalCount} total assigned prospects`)

    return new Response(
      JSON.stringify({
        data: paginatedData,
        count: totalCount,
        page,
        pageSize,
        totalPages
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