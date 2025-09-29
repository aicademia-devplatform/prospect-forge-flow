import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryParams {
  tableName: 'apollo_contacts' | 'crm_contacts'
  page: number
  pageSize: number
  searchTerm?: string
  searchColumns?: string[] // Add search columns parameter
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
    // Apollo specific filters
    emailStatus?: string
    seniority?: string
    stage?: string
    nbEmployees?: string
    departments?: string
    contactOwner?: string
    lists?: string
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
      searchColumns = [],
      sectionFilter, 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      visibleColumns = [],
      advancedFilters = {}
    }: QueryParams = await req.json()

    console.log('Query params:', { tableName, page, pageSize, searchTerm, searchColumns, sectionFilter, sortBy, sortOrder, visibleColumns, advancedFilters })

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

    // Apply advanced filters
    if (Object.keys(advancedFilters).length > 0) {
      // CRM Contacts specific filters
      if (tableName === 'crm_contacts') {
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
          // Mapping des statuts Zoho anglais-français
          const zohoStatusTranslations: Record<string, string[]> = {
            'Lead': ['Lead', 'Prospect', 'Piste'],
            'Prospect': ['Prospect', 'Lead', 'Piste', 'Potentiel'],
            'Customer': ['Customer', 'Client', 'Clientèle'],
            'Partner': ['Partner', 'Partenaire', 'Associé'],
            'Inactive': ['Inactive', 'Inactif', 'Désactivé'],
            'Cold Lead': ['Cold Lead', 'Lead Froid', 'Piste Froide'],
            'Warm Lead': ['Warm Lead', 'Lead Tiède', 'Piste Tiède'],
            'Hot Lead': ['Hot Lead', 'Lead Chaud', 'Piste Chaude']
          }
          
          const searchTerms = zohoStatusTranslations[advancedFilters.zohoStatus] || [advancedFilters.zohoStatus]
          const zohoConditions = searchTerms.map(term => `zoho_status.ilike.%${term}%`)
          query = query.or(zohoConditions.join(','))
        }
        if (advancedFilters.contactActive) {
          // Mapping des statuts de contact actif français-français et variantes
          const contactActiveTranslations: Record<string, string[]> = {
            'Oui': ['Oui', 'Yes', 'True', 'Actif', 'Active', '1'],
            'Non': ['Non', 'No', 'False', 'Inactif', 'Inactive', '0'],
            'En cours': ['En cours', 'In Progress', 'Pending', 'En attente', 'Processing']
          }
          
          const searchTerms = contactActiveTranslations[advancedFilters.contactActive] || [advancedFilters.contactActive]
          const contactConditions = searchTerms.map(term => `contact_active.ilike.%${term}%`)
          query = query.or(contactConditions.join(','))
        }
      }

      // Apollo Contacts specific filters
      if (tableName === 'apollo_contacts') {
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

        // Apollo specific filters
        if (advancedFilters.emailStatus) {
          query = query.eq('email_status', advancedFilters.emailStatus)
        }
        if (advancedFilters.seniority) {
          query = query.ilike('seniority', `%${advancedFilters.seniority}%`)
        }
        if (advancedFilters.stage) {
          query = query.ilike('stage', `%${advancedFilters.stage}%`)
        }
        if (advancedFilters.nbEmployees) {
          // Handle employee count ranges
          const range = advancedFilters.nbEmployees
          if (range === '1-10') {
            query = query.gte('nb_employees', 1).lte('nb_employees', 10)
          } else if (range === '11-50') {
            query = query.gte('nb_employees', 11).lte('nb_employees', 50)
          } else if (range === '51-200') {
            query = query.gte('nb_employees', 51).lte('nb_employees', 200)
          } else if (range === '201-500') {
            query = query.gte('nb_employees', 201).lte('nb_employees', 500)
          } else if (range === '501-1000') {
            query = query.gte('nb_employees', 501).lte('nb_employees', 1000)
          } else if (range === '1001-5000') {
            query = query.gte('nb_employees', 1001).lte('nb_employees', 5000)
          } else if (range === '5000+') {
            query = query.gte('nb_employees', 5000)
          }
        }
        if (advancedFilters.departments) {
          query = query.ilike('departments', `%${advancedFilters.departments}%`)
        }
        if (advancedFilters.contactOwner) {
          query = query.ilike('contact_owner', `%${advancedFilters.contactOwner}%`)
        }
        if (advancedFilters.lists) {
          query = query.ilike('lists', `%${advancedFilters.lists}%`)
        }
      }

      // Common filters for both tables
      if (advancedFilters.apolloStatus) {
        // Mapping des statuts Apollo anglais-français
        const apolloStatusTranslations: Record<string, string[]> = {
          'Active': ['Active', 'Actif', 'En cours'],
          'Inactive': ['Inactive', 'Inactif', 'Désactivé'],
          'Engaged': ['Engaged', 'Engagé', 'Impliqué', 'Actif'],
          'Not Contacted': ['Not Contacted', 'Non Contacté', 'Pas Contacté'],
          'Replied': ['Replied', 'Répondu', 'A Répondu'],
          'Bounced': ['Bounced', 'Rejeté', 'Bounce', 'Echec'],
          'Unsubscribed': ['Unsubscribed', 'Désabonné', 'Désinscrit']
        }
        
        const searchTerms = apolloStatusTranslations[advancedFilters.apolloStatus] || [advancedFilters.apolloStatus]
        const apolloConditions = searchTerms.map(term => `apollo_status.ilike.%${term}%`)
        query = query.or(apolloConditions.join(','))
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
        const industryConditions = searchTerms.map(term => `industry.ilike.%${term}%`)
        query = query.or(industryConditions.join(','))
      }
      if (advancedFilters.company) {
        query = query.ilike('company', `%${advancedFilters.company}%`)
      }
    }

    // Apply search filter with custom search columns
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`
      
      // Use custom search columns if provided, otherwise fall back to defaults
      if (searchColumns && searchColumns.length > 0) {
        const searchConditions = searchColumns.map(column => `${column}.ilike.${searchPattern}`)
        query = query.or(searchConditions.join(','))
      } else {
        // Default search columns for backwards compatibility
        if (tableName === 'apollo_contacts') {
          query = query.or(`email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},company.ilike.${searchPattern}`)
        } else if (tableName === 'crm_contacts') {
          query = query.or(`email.ilike.${searchPattern},firstname.ilike.${searchPattern},name.ilike.${searchPattern},company.ilike.${searchPattern}`)
        }
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