-- The public SELECT policy on business_storefronts was `using (true)`,
-- letting anyone with the (public, expected-to-be-shared) anon key read
-- every row directly via the Supabase client SDK - including storefronts
-- belonging to deactivated/suspended owners. The app hides those everywhere
-- by filtering `is_active = true` in application code, but that filtering
-- was never a database-level guarantee, so it could always be bypassed by
-- querying the table directly instead of going through the app's UI/API.
--
-- This intentionally does NOT restrict on `claimed`: unclaimed "Founding
-- Member" placeholder storefronts are meant to be public - that's the point
-- of the feature, a business's page is visible with a "Claim this business"
-- call to action before the real owner has an account. Every public read in
-- the app already filters only on is_active, never claimed, confirming this.

drop policy if exists "Business storefronts are public" on public.business_storefronts;

create policy "Active storefronts are public"
on public.business_storefronts
for select
to anon, authenticated
using (is_active = true);

-- Owners (and admins) can still see their own storefronts even when
-- inactive, so /dashboard/storefronts and /admin/storefronts keep working
-- correctly if the service-role client is ever unavailable and those reads
-- fall back to the RLS-respecting client. Postgres combines multiple
-- permissive SELECT policies with OR, so this adds to (not replaces) the
-- public policy above.
drop policy if exists "Owners and admins can view all their storefronts" on public.business_storefronts;

create policy "Owners and admins can view all their storefronts"
on public.business_storefronts
for select
to authenticated
using (owner_id = auth.uid() or public.is_admin());
