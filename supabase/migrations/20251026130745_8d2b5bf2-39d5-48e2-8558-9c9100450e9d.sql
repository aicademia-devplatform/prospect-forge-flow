-- Enable Row Level Security on all Brevo tables
ALTER TABLE brevo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE brevo_campaign_link_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE brevo_campaign_list_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE brevo_contact_list_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE brevo_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brevo_email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brevo_lists ENABLE ROW LEVEL SECURITY;

-- Create policies requiring authentication for all Brevo tables
-- Only users with sales, marketing, or admin roles can access Brevo data

CREATE POLICY "Authenticated users with proper roles can access campaigns" 
ON brevo_campaigns 
FOR ALL 
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users with proper roles can access campaign link stats" 
ON brevo_campaign_link_stats 
FOR ALL 
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users with proper roles can access campaign list stats" 
ON brevo_campaign_list_stats 
FOR ALL 
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users with proper roles can access contact list memberships" 
ON brevo_contact_list_memberships 
FOR ALL 
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users with proper roles can access contacts" 
ON brevo_contacts 
FOR ALL 
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users with proper roles can access email events" 
ON brevo_email_events 
FOR ALL 
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users with proper roles can access lists" 
ON brevo_lists 
FOR ALL 
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);