-- Enable RLS on all public tables that currently have it disabled
-- This addresses the SUPA_rls_disabled_in_public security finding

-- Enable RLS on Directus tables that contain sensitive data
ALTER TABLE public.directus_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directus_migrations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other public tables
ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_directus ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies for Directus tables to prevent unauthorized access
-- Only allow access through the Directus admin interface (not through PostgREST)

-- Deny all access to directus_users (most sensitive)
CREATE POLICY "Deny all access to directus_users" ON public.directus_users AS RESTRICTIVE FOR ALL USING (false);

-- Deny all access to directus_settings
CREATE POLICY "Deny all access to directus_settings" ON public.directus_settings AS RESTRICTIVE FOR ALL USING (false);

-- Deny all access to other sensitive Directus tables
CREATE POLICY "Deny all access to directus_roles" ON public.directus_roles AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_permissions" ON public.directus_permissions AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_policies" ON public.directus_policies AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_sessions" ON public.directus_sessions AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_files" ON public.directus_files AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_folders" ON public.directus_folders AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_dashboards" ON public.directus_dashboards AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_panels" ON public.directus_panels AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_flows" ON public.directus_flows AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_operations" ON public.directus_operations AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_collections" ON public.directus_collections AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_fields" ON public.directus_fields AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_relations" ON public.directus_relations AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_presets" ON public.directus_presets AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_revisions" ON public.directus_revisions AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_comments" ON public.directus_comments AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_notifications" ON public.directus_notifications AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_shares" ON public.directus_shares AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_webhooks" ON public.directus_webhooks AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_translations" ON public.directus_translations AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_versions" ON public.directus_versions AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_extensions" ON public.directus_extensions AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to directus_migrations" ON public.directus_migrations AS RESTRICTIVE FOR ALL USING (false);

-- Deny all access to test tables  
CREATE POLICY "Deny all access to test" ON public.test AS RESTRICTIVE FOR ALL USING (false);
CREATE POLICY "Deny all access to test_directus" ON public.test_directus AS RESTRICTIVE FOR ALL USING (false);