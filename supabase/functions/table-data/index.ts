import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QueryParams {
  tableName: "apollo_contacts" | "crm_contacts" | "hubspot_contacts";
  page: number;
  pageSize: number;
  searchTerm?: string;
  searchColumns?: string[]; // Add search columns parameter
  sectionFilter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  visibleColumns?: string[];
  advancedFilters?: {
    dateRange?: {
      from?: string;
      to?: string;
    };
    dataSection?: string;
    zohoStatus?: string;
    apolloStatus?: string;
    contactActive?: string;
    industrie?: string;
    company?: string;
    // Apollo specific filters
    emailStatus?: string;
    seniority?: string;
    stage?: string;
    nbEmployees?: string;
    departments?: string;
    contactOwner?: string;
    lists?: string;
    // Tool filters (only existing columns)
    systemeio_list?: string;
    brevo_tag?: string;
    brevo_unsuscribe?: boolean;
    brevo_open_number_min?: number;
    brevo_click_number_min?: number;
    zoho_status?: string[];
    zoho_tag?: string;
    zoho_updated_by?: string;
    zoho_product_interest?: string;
    zoho_status_2?: string;
    hubspot_lead_status?: string;
    hubspot_life_cycle_phase?: string;
    hubspot_buy_role?: string;
    apollo_list?: string;
    apollo_status?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      tableName,
      page,
      pageSize,
      searchTerm,
      searchColumns = [],
      sectionFilter,
      sortBy = tableName === "hubspot_contacts" ? "inserted_at" : "created_at",
      sortOrder = "desc",
      visibleColumns = [],
      advancedFilters = {},
    }: QueryParams = await req.json();

    console.log("Query params:", {
      tableName,
      page,
      pageSize,
      searchTerm,
      searchColumns,
      sectionFilter,
      sortBy,
      sortOrder,
      visibleColumns,
      advancedFilters,
    });
    console.log("🔍 Tool filters received:", {
      systemeio_list: advancedFilters.systemeio_list,
      brevo_tag: advancedFilters.brevo_tag,
      zoho_tag: advancedFilters.zoho_tag,
      hubspot_lead_status: advancedFilters.hubspot_lead_status,
      apollo_status: advancedFilters.apollo_status,
    });

    // Build the column selection
    const baseColumns = ["id", "email"];
    const allColumns = [...baseColumns, ...visibleColumns].filter(
      (col, index, arr) => arr.indexOf(col) === index
    );
    const selectColumns = allColumns.length > 0 ? allColumns.join(",") : "*";

    // Build the query
    let query = supabase
      .from(tableName)
      .select(selectColumns, { count: "exact" });

    // Apply section filter for CRM contacts
    if (
      tableName === "crm_contacts" &&
      sectionFilter &&
      sectionFilter !== "all"
    ) {
      // Handle multiple sections (comma-separated)
      const sections = sectionFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (sections.length > 0) {
        // For each section, create conditions that match the section name
        // even when it's part of a comma-separated list in data_section
        const orConditions = sections.map((section) => {
          // Use ILIKE patterns to match section names within comma-separated values
          // This handles cases like "Aicademia, Arlynk" or "Arlynk, Aicademia"
          return `data_section.ilike.%${section}%`;
        });

        query = query.or(orConditions.join(","));
      }
    }

    // Apply advanced filters
    if (Object.keys(advancedFilters).length > 0) {
      // CRM Contacts specific filters
      if (tableName === "crm_contacts") {
        // Date range filter
        if (advancedFilters.dateRange?.from) {
          query = query.gte("created_at", advancedFilters.dateRange.from);
        }
        if (advancedFilters.dateRange?.to) {
          // Add one day to include the end date
          const endDate = new Date(advancedFilters.dateRange.to);
          endDate.setDate(endDate.getDate() + 1);
          query = query.lt("created_at", endDate.toISOString());
        }

        // String filters - exact matches
        if (advancedFilters.dataSection) {
          query = query.ilike(
            "data_section",
            `%${advancedFilters.dataSection}%`
          );
        }
        if (advancedFilters.zohoStatus) {
          // Utiliser une recherche directe avec ILIKE pour matcher les statuts exacts ou partiels
          query = query.ilike("zoho_status", `%${advancedFilters.zohoStatus}%`);
        }
        if (advancedFilters.contactActive) {
          // Utiliser une recherche directe avec ILIKE pour matcher les statuts exacts
          query = query.ilike(
            "contact_active",
            `%${advancedFilters.contactActive}%`
          );
        }
      }

      // Apollo Contacts specific filters
      if (tableName === "apollo_contacts") {
        // Date range filter
        if (advancedFilters.dateRange?.from) {
          query = query.gte("created_at", advancedFilters.dateRange.from);
        }
        if (advancedFilters.dateRange?.to) {
          // Add one day to include the end date
          const endDate = new Date(advancedFilters.dateRange.to);
          endDate.setDate(endDate.getDate() + 1);
          query = query.lt("created_at", endDate.toISOString());
        }

        // Apollo specific filters
        if (advancedFilters.emailStatus) {
          query = query.eq("email_status", advancedFilters.emailStatus);
        }
        if (advancedFilters.seniority) {
          query = query.ilike("seniority", `%${advancedFilters.seniority}%`);
        }
        if (advancedFilters.stage) {
          query = query.ilike("stage", `%${advancedFilters.stage}%`);
        }
        if (advancedFilters.nbEmployees) {
          // Handle employee count ranges
          const range = advancedFilters.nbEmployees;
          if (range === "1-10") {
            query = query.gte("nb_employees", 1).lte("nb_employees", 10);
          } else if (range === "11-50") {
            query = query.gte("nb_employees", 11).lte("nb_employees", 50);
          } else if (range === "51-200") {
            query = query.gte("nb_employees", 51).lte("nb_employees", 200);
          } else if (range === "201-500") {
            query = query.gte("nb_employees", 201).lte("nb_employees", 500);
          } else if (range === "501-1000") {
            query = query.gte("nb_employees", 501).lte("nb_employees", 1000);
          } else if (range === "1001-5000") {
            query = query.gte("nb_employees", 1001).lte("nb_employees", 5000);
          } else if (range === "5000+") {
            query = query.gte("nb_employees", 5000);
          }
        }
        if (advancedFilters.departments) {
          query = query.ilike(
            "departments",
            `%${advancedFilters.departments}%`
          );
        }
        if (advancedFilters.contactOwner) {
          query = query.ilike(
            "contact_owner",
            `%${advancedFilters.contactOwner}%`
          );
        }
        if (advancedFilters.lists) {
          query = query.ilike("lists", `%${advancedFilters.lists}%`);
        }
      }

      // HubSpot Contacts specific filters
      if (tableName === "hubspot_contacts") {
        // Date range filter using inserted_at
        if (advancedFilters.dateRange?.from) {
          query = query.gte("inserted_at", advancedFilters.dateRange.from);
        }
        if (advancedFilters.dateRange?.to) {
          const endDate = new Date(advancedFilters.dateRange.to);
          endDate.setDate(endDate.getDate() + 1);
          query = query.lt("inserted_at", endDate.toISOString());
        }
      }

      // Common filters for both tables
      if (advancedFilters.apolloStatus) {
        // Utiliser une recherche directe avec ILIKE pour matcher les statuts exacts ou partiels
        query = query.ilike(
          "apollo_status",
          `%${advancedFilters.apolloStatus}%`
        );
      }
      if (advancedFilters.industrie) {
        // Utiliser une recherche directe avec ILIKE pour matcher les industries
        query = query.ilike("industry", `%${advancedFilters.industrie}%`);
      }
      if (advancedFilters.company) {
        query = query.ilike("company", `%${advancedFilters.company}%`);
      }

      // Tool-specific filters (Systeme.io, Brevo, Zoho, HubSpot, Apollo)
      // Utiliser la fonction RPC pour la logique OR si plusieurs outils sont sélectionnés
      if (tableName === "crm_contacts") {
        console.log("🛠️ Checking tool filters...");

        // Compter combien d'outils sont sélectionnés (avec le wildcard '%')
        const toolFilters = {
          systemeio: advancedFilters.systemeio_list === "%",
          brevo: advancedFilters.brevo_tag === "%",
          zoho: advancedFilters.zoho_tag === "%",
          hubspot: advancedFilters.hubspot_lead_status === "%",
          apollo:
            advancedFilters.apollo_status === "%" ||
            advancedFilters.apollo_list === "%",
        };

        const activeToolsCount =
          Object.values(toolFilters).filter(Boolean).length;
        console.log("Active tools:", toolFilters, "Count:", activeToolsCount);

        // Si plusieurs outils sont sélectionnés, utiliser la fonction RPC avec OR
        if (activeToolsCount > 1) {
          console.log(
            "⚡ Multiple tools selected, using RPC function with OR logic"
          );

          // Appeler la fonction RPC
          const rpcResult = await supabase.rpc("filter_crm_contacts_by_tools", {
            p_systemeio_filter: toolFilters.systemeio,
            p_brevo_filter: toolFilters.brevo,
            p_zoho_filter: toolFilters.zoho,
            p_hubspot_filter: toolFilters.hubspot,
            p_apollo_filter: toolFilters.apollo,
            p_search_term: searchTerm || null,
            p_section_filter: sectionFilter || null,
            p_sort_by: sortBy,
            p_sort_order: sortOrder,
            p_page: page,
            p_page_size: pageSize,
          });

          if (rpcResult.error) {
            console.error("RPC error:", rpcResult.error);
            throw rpcResult.error;
          }

          // La fonction retourne { data: [...], count: X }
          const result = rpcResult.data || { data: [], count: 0 };
          const responseData = result.data || [];
          const totalCount = result.count || 0;

          console.log(
            `RPC returned ${responseData.length} records out of ${totalCount} total`
          );

          return new Response(
            JSON.stringify({
              data: responseData,
              count: totalCount,
              page,
              pageSize,
              totalPages: Math.ceil(totalCount / pageSize),
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }

        // Si un seul outil est sélectionné, utiliser la logique normale (AND)
        if (advancedFilters.systemeio_list === "%") {
          query = query.not("systemeio_list", "is", null);
          console.log("  → systemeio_list: NOT NULL");
        }

        if (advancedFilters.brevo_tag === "%") {
          query = query.not("brevo_tag", "is", null);
          console.log("  → brevo_tag: NOT NULL");
        }

        if (advancedFilters.zoho_tag === "%") {
          query = query.not("zoho_tag", "is", null);
          console.log("  → zoho_tag: NOT NULL");
        }

        if (advancedFilters.hubspot_lead_status === "%") {
          query = query.not("hubspot_lead_status", "is", null);
          console.log("  → hubspot_lead_status: NOT NULL");
        }

        if (advancedFilters.apollo_status === "%") {
          query = query.not("apollo_status", "is", null);
          console.log("  → apollo_status: NOT NULL");
        }
        if (advancedFilters.apollo_list === "%") {
          query = query.not("apollo_list", "is", null);
          console.log("  → apollo_list: NOT NULL");
        }

        // Filtres d'outils spécifiques (non-wildcard) - appliqués avec AND
        if (
          advancedFilters.systemeio_list &&
          advancedFilters.systemeio_list !== "%"
        ) {
          query = query.ilike(
            "systemeio_list",
            `%${advancedFilters.systemeio_list}%`
          );
        }

        if (advancedFilters.brevo_tag && advancedFilters.brevo_tag !== "%") {
          query = query.ilike("brevo_tag", `%${advancedFilters.brevo_tag}%`);
        }
        if (advancedFilters.brevo_unsuscribe !== undefined) {
          query = query.eq(
            "brevo_unsuscribe",
            advancedFilters.brevo_unsuscribe
          );
        }
        if (advancedFilters.brevo_open_number_min !== undefined) {
          query = query.gte(
            "brevo_open_number",
            advancedFilters.brevo_open_number_min
          );
        }
        if (advancedFilters.brevo_click_number_min !== undefined) {
          query = query.gte(
            "brevo_click_number",
            advancedFilters.brevo_click_number_min
          );
        }

        // Note: zoho_status array filtering commented out to avoid multiple .or() conflicts
        // TODO: Implement proper grouped OR filtering if needed
        // if (advancedFilters.zoho_status && Array.isArray(advancedFilters.zoho_status) && advancedFilters.zoho_status.length > 0) {
        //   const statusConditions = advancedFilters.zoho_status.map(status => `zoho_status.ilike.%${status}%`)
        //   query = query.or(statusConditions.join(','))
        // }
        if (advancedFilters.zoho_tag && advancedFilters.zoho_tag !== "%") {
          query = query.ilike("zoho_tag", `%${advancedFilters.zoho_tag}%`);
        }
        if (advancedFilters.zoho_updated_by) {
          query = query.ilike(
            "zoho_updated_by",
            `%${advancedFilters.zoho_updated_by}%`
          );
        }
        if (advancedFilters.zoho_product_interest) {
          query = query.ilike(
            "zoho_product_interest",
            `%${advancedFilters.zoho_product_interest}%`
          );
        }
        if (advancedFilters.zoho_status_2) {
          query = query.ilike(
            "zoho_status_2",
            `%${advancedFilters.zoho_status_2}%`
          );
        }

        if (
          advancedFilters.hubspot_lead_status &&
          advancedFilters.hubspot_lead_status !== "%"
        ) {
          query = query.ilike(
            "hubspot_lead_status",
            `%${advancedFilters.hubspot_lead_status}%`
          );
        }
        if (advancedFilters.hubspot_life_cycle_phase) {
          query = query.ilike(
            "hubspot_life_cycle_phase",
            `%${advancedFilters.hubspot_life_cycle_phase}%`
          );
        }
        if (advancedFilters.hubspot_buy_role) {
          query = query.ilike(
            "hubspot_buy_role",
            `%${advancedFilters.hubspot_buy_role}%`
          );
        }

        if (
          advancedFilters.apollo_list &&
          advancedFilters.apollo_list !== "%"
        ) {
          query = query.ilike(
            "apollo_list",
            `%${advancedFilters.apollo_list}%`
          );
        }
        if (
          advancedFilters.apollo_status &&
          advancedFilters.apollo_status !== "%"
        ) {
          query = query.ilike(
            "apollo_status",
            `%${advancedFilters.apollo_status}%`
          );
        }
      }
    }

    // Apply search filter with custom search columns
    // NOTE: Temporarily disabled to avoid multiple .or() conflicts
    // TODO: Implement proper search with RPC function
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      console.log(
        "⚠️ Search filter requested but disabled to avoid .or() conflicts:",
        searchPattern
      );

      // Fallback: search only on email for now
      query = query.ilike("email", searchPattern);
    }

    // Apply sorting
    console.log("📊 Applying sorting and pagination...");
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    console.log("🔄 Executing query...");
    const { data, error, count } = await query;

    if (error) {
      console.error("❌ Database error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      throw error;
    }

    console.log(
      `Returned ${data?.length || 0} records out of ${count || 0} total`
    );

    return new Response(
      JSON.stringify({
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Function error:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    let errorMessage = "Unknown error";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    } else {
      errorMessage = String(error);
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        details: errorDetails,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
