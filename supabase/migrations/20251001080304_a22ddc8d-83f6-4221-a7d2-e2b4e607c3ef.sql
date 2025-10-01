-- Clean up duplicates and clarify separation between active and historical prospects

-- Step 1: Remove duplicate active assignments, keeping only the most recent one
DELETE FROM public.sales_assignments
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY lead_email, sales_user_id, status
             ORDER BY assigned_at DESC
           ) as rn
    FROM public.sales_assignments
    WHERE status = 'active'
  ) t
  WHERE t.rn > 1
);

-- Step 2: Add indexes for better performance on active assignments
CREATE INDEX IF NOT EXISTS idx_sales_assignments_sales_user_status 
ON public.sales_assignments(sales_user_id, status);

CREATE INDEX IF NOT EXISTS idx_sales_assignments_email 
ON public.sales_assignments(lead_email);

-- Step 3: Ensure prospects_traites is optimized for historical queries
CREATE INDEX IF NOT EXISTS idx_prospects_traites_sales_user 
ON public.prospects_traites(sales_user_id);

CREATE INDEX IF NOT EXISTS idx_prospects_traites_completed_at 
ON public.prospects_traites(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospects_traites_email 
ON public.prospects_traites(lead_email);

CREATE INDEX IF NOT EXISTS idx_prospects_traites_original_assignment 
ON public.prospects_traites(original_assignment_id);

-- Step 4: Add comments to clarify the purpose of each table
COMMENT ON TABLE public.sales_assignments IS 
'Active prospect assignments for sales users. Records are moved to prospects_traites when completed.';

COMMENT ON TABLE public.prospects_traites IS 
'Historical archive of processed prospects. Contains all completed/finished prospect interactions.';

-- Step 5: Now add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_assignments_unique_active_email 
ON public.sales_assignments(lead_email, sales_user_id) 
WHERE status = 'active';