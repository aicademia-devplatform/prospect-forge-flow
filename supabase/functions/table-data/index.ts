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
  visibleColumns?: string[]
  advancedFilters?: {
    dateRange?: {
      from?: string
      to?: string
    }
    dataSection?: string
    zohoStatus?: string
    apolloStatus?: string
    contactActive?: string
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

    const { 
      tableName, 
      page, 
      pageSize, 
      searchTerm, 
      sectionFilter, 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      visibleColumns = [],
      advancedFilters = {}
    }: QueryParams = await req.json()

    console.log('Query params:', { tableName, page, pageSize, searchTerm, sectionFilter, sortBy, sortOrder, visibleColumns, advancedFilters })

    // Build the column selection
    const baseColumns = ['id', 'email']
    const allColumns = [...baseColumns, ...visibleColumns].filter((col, index, arr) => arr.indexOf(col) === index)
    const selectColumns = allColumns.length > 0 ? allColumns.join(',') : '*'

    // Build the query
    let query = supabase.from(tableName).select(selectColumns, { count: 'exact' })

    // Apply section filter for CRM contacts
    if (tableName === 'crm_contacts' && sectionFilter && sectionFilter !== 'all') {
      // Handle multiple sections (comma-separated)
      const sections = sectionFilter.split(',').map(s => s.trim()).filter(Boolean)
      
      if (sections.length > 0) {
        // For each section, create conditions that match the section name
        // even when it's part of a comma-separated list in data_section
        const orConditions = sections.map(section => {
          // Use ILIKE patterns to match section names within comma-separated values
          // This handles cases like "Aicademia, Arlynk" or "Arlynk, Aicademia"
          return `data_section.ilike.%${section}%`
        })
        
        query = query.or(orConditions.join(','))
      }
    }

    // Apply advanced filters (only for crm_contacts)
    if (tableName === 'crm_contacts' && Object.keys(advancedFilters).length > 0) {
      // Date range filter
      if (advancedFilters.dateRange?.from) {
        query = query.gte('created_at', advancedFilters.dateRange.from)
      }
      if (advancedFilters.dateRange?.to) {
        // Add one day to include the end date
        const endDate = new Date(advancedFilters.dateRange.to)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt('created_at', endDate.toISOString())
      }
      
      // String filters - exact matches
      if (advancedFilters.dataSection) {
        query = query.ilike('data_section', `%${advancedFilters.dataSection}%`)
      }
      if (advancedFilters.zohoStatus) {
        query = query.eq('zoho_status', advancedFilters.zohoStatus)
      }
      if (advancedFilters.apolloStatus) {
        query = query.eq('apollo_status', advancedFilters.apolloStatus)
      }
      if (advancedFilters.contactActive) {
        query = query.eq('contact_active', advancedFilters.contactActive)
      }
      if (advancedFilters.industrie) {
        // Mapping des industries anglais-français pour une recherche plus flexible
        const industryTranslations: Record<string, string[]> = {
          'Technology': ['Technology', 'Technologie', 'Tech', 'IT', 'Informatique'],
          'Healthcare': ['Healthcare', 'Santé', 'Médical', 'Pharmaceutique', 'Pharma'],
          'Finance': ['Finance', 'Financier', 'Banque', 'Banking', 'Assurance', 'Insurance'],
          'Education': ['Education', 'Éducation', 'Enseignement', 'Formation', 'Academic'],
          'Manufacturing': ['Manufacturing', 'Industrie', 'Production', 'Fabrication', 'Manufacturier'],
          'Retail': ['Retail', 'Commerce', 'Vente', 'Distribution', 'Magasin'],
          'Real Estate': ['Real Estate', 'Immobilier', 'Property', 'Propriété', 'Foncier'],
          'Consulting': ['Consulting', 'Conseil', 'Advisory', 'Consultancy', 'Expertise'],
          'Other': ['Other', 'Autre', 'Divers', 'Various', 'Misc']
        }
        
        // Chercher les termes correspondants ou utiliser le terme direct
        const searchTerms = industryTranslations[advancedFilters.industrie] || [advancedFilters.industrie]
        
        // Créer une condition OR pour tous les termes possibles
        const industryConditions = searchTerms.map(term => `industrie.ilike.%${term}%`)
        query = query.or(industryConditions.join(','))
      }
      if (advancedFilters.company) {
        query = query.ilike('company', `%${advancedFilters.company}%`)
      }
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
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})