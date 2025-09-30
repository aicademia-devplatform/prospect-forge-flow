-- Add treatment information columns to sales_assignments table
ALTER TABLE sales_assignments 
ADD COLUMN notes_sales TEXT,
ADD COLUMN statut_prospect CHARACTER VARYING(100),
ADD COLUMN date_action TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN sales_assignments.notes_sales IS 'Notes du commercial lors du traitement du prospect';
COMMENT ON COLUMN sales_assignments.statut_prospect IS 'Statut actuel du prospect (ex: contacté, qualifié, rdv prévu, etc.)';
COMMENT ON COLUMN sales_assignments.date_action IS 'Date de la prochaine action ou du dernier contact';

-- Add index for better performance on status and date queries
CREATE INDEX idx_sales_assignments_statut_prospect ON sales_assignments(statut_prospect);
CREATE INDEX idx_sales_assignments_date_action ON sales_assignments(date_action);
CREATE INDEX idx_sales_assignments_boucle ON sales_assignments(boucle);