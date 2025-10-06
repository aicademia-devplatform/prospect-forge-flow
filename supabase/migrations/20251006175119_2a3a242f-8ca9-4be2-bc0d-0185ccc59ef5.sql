-- Step 1: Drop all public schema policies
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Step 2: Alter to text, update values
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
UPDATE public.user_roles SET role = CASE 
  WHEN role = 'sales' THEN 'sdr'
  WHEN role = 'manager' THEN 'sales'
  WHEN role = 'admin' THEN 'admin'
  WHEN role = 'marketing' THEN 'marketing'
  ELSE role
END;

-- Step 3: Drop and recreate enum
DROP TYPE public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('sdr', 'sales', 'marketing', 'admin');

-- Step 4: Restore column type
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;
ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;

-- Step 5: Recreate functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY CASE role WHEN 'admin' THEN 4 WHEN 'sales' THEN 3 WHEN 'marketing' THEN 2 WHEN 'sdr' THEN 1 END DESC LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name', NEW.raw_user_meta_data ->> 'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'sdr');
  RETURN NEW;
END;
$function$;

-- Step 6: Create basic RLS policies (common tables only)
CREATE POLICY "All roles view apollo" ON public.apollo_contacts FOR SELECT USING (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "All roles insert apollo" ON public.apollo_contacts FOR INSERT WITH CHECK (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "All roles update apollo" ON public.apollo_contacts FOR UPDATE USING (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete apollo" ON public.apollo_contacts FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All roles view crm" ON public.crm_contacts FOR SELECT USING (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "All roles insert crm" ON public.crm_contacts FOR INSERT WITH CHECK (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "All roles update crm" ON public.crm_contacts FOR UPDATE USING (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete crm" ON public.crm_contacts FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "View own or higher roles assignments" ON public.sales_assignments FOR SELECT USING (sales_user_id = auth.uid() OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Update own or higher roles assignments" ON public.sales_assignments FOR UPDATE USING (sales_user_id = auth.uid() OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales and above create assignments" ON public.sales_assignments FOR INSERT WITH CHECK (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales and above delete assignments" ON public.sales_assignments FOR DELETE USING (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own profiles or higher" ON public.profiles FOR SELECT USING (id = auth.uid() OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profiles or higher" ON public.profiles FOR UPDATE USING (id = auth.uid() OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin')) WITH CHECK (id = auth.uid() OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "View own or higher roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales and above create roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales and above update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'sales') OR has_role(auth.uid(), 'marketing') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Directus tables deny all
CREATE POLICY "Deny directus_collections" ON public.directus_collections FOR ALL USING (false);
CREATE POLICY "Deny directus_comments" ON public.directus_comments FOR ALL USING (false);
CREATE POLICY "Deny directus_dashboards" ON public.directus_dashboards FOR ALL USING (false);
CREATE POLICY "Deny directus_extensions" ON public.directus_extensions FOR ALL USING (false);
CREATE POLICY "Deny directus_fields" ON public.directus_fields FOR ALL USING (false);
CREATE POLICY "Deny directus_files" ON public.directus_files FOR ALL USING (false);
CREATE POLICY "Deny directus_flows" ON public.directus_flows FOR ALL USING (false);
CREATE POLICY "Deny directus_folders" ON public.directus_folders FOR ALL USING (false);
CREATE POLICY "Deny directus_migrations" ON public.directus_migrations FOR ALL USING (false);
CREATE POLICY "Deny directus_notifications" ON public.directus_notifications FOR ALL USING (false);
CREATE POLICY "Deny directus_operations" ON public.directus_operations FOR ALL USING (false);
CREATE POLICY "Deny directus_panels" ON public.directus_panels FOR ALL USING (false);
CREATE POLICY "Deny directus_permissions" ON public.directus_permissions FOR ALL USING (false);
CREATE POLICY "Deny directus_policies" ON public.directus_policies FOR ALL USING (false);
CREATE POLICY "Deny directus_presets" ON public.directus_presets FOR ALL USING (false);
CREATE POLICY "Deny directus_relations" ON public.directus_relations FOR ALL USING (false);
CREATE POLICY "Deny directus_revisions" ON public.directus_revisions FOR ALL USING (false);
CREATE POLICY "Deny directus_roles" ON public.directus_roles FOR ALL USING (false);
CREATE POLICY "Deny directus_sessions" ON public.directus_sessions FOR ALL USING (false);
CREATE POLICY "Deny directus_settings" ON public.directus_settings FOR ALL USING (false);
CREATE POLICY "Deny directus_shares" ON public.directus_shares FOR ALL USING (false);
CREATE POLICY "Deny directus_translations" ON public.directus_translations FOR ALL USING (false);
CREATE POLICY "Deny directus_users" ON public.directus_users FOR ALL USING (false);
CREATE POLICY "Deny directus_versions" ON public.directus_versions FOR ALL USING (false);
CREATE POLICY "Deny directus_webhooks" ON public.directus_webhooks FOR ALL USING (false);