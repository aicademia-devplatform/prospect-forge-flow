/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseTableDataParams {
  tableName: "apollo_contacts" | "crm_contacts" | "hubspot_contacts";
  page: number;
  pageSize: number;
  searchTerm: string;
  searchColumns?: string[]; // Add search columns parameter
  sectionFilter: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  visibleColumns?: string[];
  advancedFilters?: {
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    dataSection?: string | string[];
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
    // Tool filters
    systemeio_list?: string;
    systemeio_status?: string;
    brevo_tag?: string;
    brevo_status?: string;
    brevo_unsuscribe?: boolean;
    brevo_open_number_min?: number;
    brevo_click_number_min?: number;
    zoho_status?: string[];
    zoho_tag?: string;
    zoho_updated_by?: string;
    zoho_product_interest?: string;
    zoho_status_2?: string;
    hubspot_status?: string;
    hubspot_lead_status?: string;
    hubspot_life_cycle_phase?: string;
    hubspot_buy_role?: string;
    apollo_status?: string;
    apollo_list?: string;
    // Nouveaux filtres
    jobFunction?: string;
    hasValidPhone?: boolean;
    // Filtres de statut
    arlynkColdStatus?: string;
    aicademiaColdStatus?: string;
  };
}

interface TableDataResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useTableData = (params: UseTableDataParams) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create a unique query key for this table data
  const queryKey = [
    "table-data",
    params.tableName,
    params.page,
    params.pageSize,
    params.searchTerm,
    params.searchColumns,
    params.sectionFilter,
    params.sortBy,
    params.sortOrder,
    params.visibleColumns,
    params.advancedFilters,
  ];

  const {
    data: queryData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<TableDataResponse> => {
      console.log("Fetching data with params:", params);

      const { data: response, error } = await supabase.functions.invoke(
        "table-data",
        {
          body: params,
        }
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      const result: TableDataResponse = response;
      console.log("Received data:", result);

      return result;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2,
  });

  // Helper function to update a specific row in the cache
  const updateRowInCache = (rowId: string, updates: Record<string, any>) => {
    queryClient.setQueryData(
      queryKey,
      (oldData: TableDataResponse | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((row) => {
            // Flexible ID matching (string/number)
            const isMatch =
              row.id?.toString() === rowId.toString() ||
              row.id === rowId ||
              row.id === parseInt(rowId);

            return isMatch
              ? { ...row, ...updates, _lastModified: new Date().toISOString() }
              : row;
          }),
        };
      }
    );
  };

  // Helper function to perform optimistic update with database sync
  const optimisticUpdate = async (
    rowId: string,
    updates: Record<string, any>
  ) => {
    // Store original data for rollback
    const originalData = queryClient.getQueryData(queryKey) as
      | TableDataResponse
      | undefined;

    if (!originalData?.data) {
      throw new Error("No data available for update");
    }

    // Find row by ID with flexible type matching (string/number)
    const originalRow = originalData.data.find(
      (row) =>
        row.id?.toString() === rowId.toString() ||
        row.id === rowId ||
        row.id === parseInt(rowId)
    );

    if (!originalRow) {
      console.error("Row not found for update:", {
        rowId,
        availableIds: originalData.data.map((r) => r.id),
      });
      throw new Error(`Row with ID ${rowId} not found for update`);
    }

    // Apply optimistic update immediately
    updateRowInCache(rowId, updates);

    try {
      // Update in database
      const { error } = await supabase
        .from(params.tableName)
        .update(updates)
        .eq("id", rowId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      // Rollback on error
      if (originalRow) {
        queryClient.setQueryData(
          queryKey,
          (oldData: TableDataResponse | undefined) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              data: oldData.data.map((row) => {
                // Flexible ID matching for rollback
                const isMatch =
                  row.id?.toString() === rowId.toString() ||
                  row.id === rowId ||
                  row.id === parseInt(rowId);

                return isMatch
                  ? { ...originalRow, _lastModified: undefined }
                  : row;
              }),
            };
          }
        );
      }
      throw error;
    }
  };

  // Helper function to invalidate and refetch data
  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({
      queryKey: ["table-data", params.tableName],
    });
  };

  return {
    data: (queryData as TableDataResponse)?.data || [],
    totalCount: (queryData as TableDataResponse)?.count || 0,
    totalPages: (queryData as TableDataResponse)?.totalPages || 0,
    loading,
    refetch,
    updateRowInCache,
    optimisticUpdate,
    invalidateAndRefetch,
  };
};
