-- ============================================================
-- Kid Incentive App — Row Level Security Policies
-- ============================================================

alter table public.families              enable row level security;
alter table public.profiles              enable row level security;
alter table public.tasks                 enable row level security;
alter table public.task_completions      enable row level security;
alter table public.star_conversions      enable row level security;
alter table public.shop_products         enable row level security;
alter table public.shop_purchases        enable row level security;
alter table public.bean_redemptions      enable row level security;
alter table public.currency_transactions enable row level security;

-- ====== profiles ======
create policy "family members view profiles"
  on public.profiles for select
  using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "users update own display info"
  on public.profiles for update
  using (id = auth.uid());

create policy "parents update family profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
        and p.family_id = profiles.family_id
    )
  );

-- ====== families ======
create policy "family members view family"
  on public.families for select
  using (id in (select family_id from public.profiles where id = auth.uid()));

create policy "parents update family settings"
  on public.families for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'parent' and family_id = families.id
    )
  );

-- ====== tasks ======
create policy "family members view tasks"
  on public.tasks for select
  using (
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "parents manage tasks"
  on public.tasks for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'parent' and family_id = tasks.family_id
    )
  );

-- ====== task_completions ======
create policy "view completions"
  on public.task_completions for select
  using (
    child_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      join public.tasks t on t.id = task_completions.task_id
      where p.id = auth.uid() and p.role = 'parent' and p.family_id = t.family_id
    )
  );

create policy "children submit completions"
  on public.task_completions for insert
  with check (
    child_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'child')
  );

create policy "parents review completions"
  on public.task_completions for update
  using (
    exists (
      select 1 from public.profiles p
      join public.tasks t on t.id = task_completions.task_id
      where p.id = auth.uid() and p.role = 'parent' and p.family_id = t.family_id
    )
  );

-- ====== star_conversions ======
create policy "children view own star conversions"
  on public.star_conversions for select
  using (child_id = auth.uid());

create policy "children insert star conversions"
  on public.star_conversions for insert
  with check (
    child_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'child')
  );

-- ====== shop_products ======
create policy "all users view shop products"
  on public.shop_products for select
  using (auth.uid() is not null);

-- ====== shop_purchases ======
create policy "view purchases"
  on public.shop_purchases for select
  using (
    child_id = auth.uid()
    or exists (
      select 1 from public.profiles parent_p
      join public.profiles child_p on child_p.id = shop_purchases.child_id
      where parent_p.id = auth.uid()
        and parent_p.role = 'parent'
        and parent_p.family_id = child_p.family_id
    )
  );

create policy "children purchase from shop"
  on public.shop_purchases for insert
  with check (
    child_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'child')
  );

-- ====== bean_redemptions ======
create policy "view bean redemptions"
  on public.bean_redemptions for select
  using (
    child_id = auth.uid()
    or exists (
      select 1 from public.profiles parent_p
      join public.profiles child_p on child_p.id = bean_redemptions.child_id
      where parent_p.id = auth.uid()
        and parent_p.role = 'parent'
        and parent_p.family_id = child_p.family_id
    )
  );

create policy "children spend beans"
  on public.bean_redemptions for insert
  with check (
    child_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'child')
  );

-- ====== currency_transactions ======
create policy "view transactions"
  on public.currency_transactions for select
  using (
    child_id = auth.uid()
    or exists (
      select 1 from public.profiles parent_p
      join public.profiles child_p on child_p.id = currency_transactions.child_id
      where parent_p.id = auth.uid()
        and parent_p.role = 'parent'
        and parent_p.family_id = child_p.family_id
    )
  );
