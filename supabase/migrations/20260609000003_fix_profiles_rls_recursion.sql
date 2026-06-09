-- Fix infinite recursion in profiles RLS policies.
-- Policies on `profiles` that subquery `profiles` cause PostgreSQL error 42P17.
-- Solution: SECURITY DEFINER functions bypass RLS, breaking the recursion chain.

create or replace function public.get_my_family_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_role()
returns user_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter policy "family members view profiles"
  on public.profiles
  using (family_id = get_my_family_id());

alter policy "parents update family profiles"
  on public.profiles
  using (
    get_my_role() = 'parent'::user_role
    and family_id = get_my_family_id()
  );
