-- Add 'boucle' (closed) field to sales_assignments table
ALTER TABLE sales_assignments 
ADD COLUMN boucle boolean NOT NULL DEFAULT false;

-- Add comment to the column for clarity
COMMENT ON COLUMN sales_assignments.boucle IS 'Indicates if the prospect is closed/finished (bouclé)';