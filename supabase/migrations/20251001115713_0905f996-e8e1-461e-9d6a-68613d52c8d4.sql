-- Add missing columns from Apollo CSV export to apollo_contacts table

-- Add email verification source columns
ALTER TABLE apollo_contacts 
ADD COLUMN IF NOT EXISTS primary_email_verification_source character varying,
ADD COLUMN IF NOT EXISTS secondary_email_verification_source character varying,
ADD COLUMN IF NOT EXISTS tertiary_email_verification_source character varying;

-- Add intent tracking columns
ALTER TABLE apollo_contacts 
ADD COLUMN IF NOT EXISTS primary_intent_topic text,
ADD COLUMN IF NOT EXISTS primary_intent_score numeric,
ADD COLUMN IF NOT EXISTS secondary_intent_topic text,
ADD COLUMN IF NOT EXISTS secondary_intent_score numeric;

-- Add comments for documentation
COMMENT ON COLUMN apollo_contacts.primary_email_verification_source IS 'Source of primary email verification (e.g., Apollo)';
COMMENT ON COLUMN apollo_contacts.secondary_email_verification_source IS 'Source of secondary email verification';
COMMENT ON COLUMN apollo_contacts.tertiary_email_verification_source IS 'Source of tertiary email verification';
COMMENT ON COLUMN apollo_contacts.primary_intent_topic IS 'Primary intent topic tracked by Apollo';
COMMENT ON COLUMN apollo_contacts.primary_intent_score IS 'Score for primary intent topic';
COMMENT ON COLUMN apollo_contacts.secondary_intent_topic IS 'Secondary intent topic tracked by Apollo';
COMMENT ON COLUMN apollo_contacts.secondary_intent_score IS 'Score for secondary intent topic';