-- ============================================================
-- Kid Incentive App — Schema Migration
-- ============================================================

-- 1. Extensions

-- 2. families
create table public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- 3. profiles
create type public.user_role as enum ('parent', 'child');

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  family_id     uuid references public.families(id) on delete set null,
  role          public.user_role not null default 'child',
  display_name  text not null,
  avatar_emoji  text not null default '🐼',
  stars         integer not null default 0 check (stars >= 0),
  magic_stars   integer not null default 0 check (magic_stars >= 0),
  gold_beans    integer not null default 0 check (gold_beans >= 0),
  total_tasks_completed integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. tasks
create type public.task_recurrence as enum ('once', 'daily', 'weekly');
create type public.task_status as enum ('active', 'archived');

create table public.tasks (
  id                   uuid primary key default gen_random_uuid(),
  family_id            uuid not null references public.families(id) on delete cascade,
  created_by           uuid not null references public.profiles(id) on delete cascade,
  assigned_to          uuid references public.profiles(id) on delete set null,
  title                text not null,
  description          text,
  emoji                text not null default '📝',
  stars_reward         integer not null default 0 check (stars_reward >= 0),
  magic_stars_reward   integer not null default 0 check (magic_stars_reward >= 0),
  recurrence           public.task_recurrence not null default 'once',
  due_date             date,
  status               public.task_status not null default 'active',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint at_least_one_reward check (stars_reward > 0 or magic_stars_reward > 0)
);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- 5. task_completions
create type public.completion_status as enum ('pending', 'approved', 'rejected');

create table public.task_completions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  child_id      uuid not null references public.profiles(id) on delete cascade,
  status        public.completion_status not null default 'pending',
  note          text,
  proof_url     text,
  reviewed_by   uuid references public.profiles(id) on delete set null,
  reviewed_at   timestamptz,
  reject_reason text,
  created_at    timestamptz not null default now()
);

-- 6. star_conversions (⭐ → 🌟)
create table public.star_conversions (
  id                 uuid primary key default gen_random_uuid(),
  child_id           uuid not null references public.profiles(id) on delete cascade,
  stars_spent        integer not null check (stars_spent > 0 and stars_spent % 5 = 0),
  magic_stars_gained integer not null check (magic_stars_gained > 0),
  created_at         timestamptz not null default now(),
  constraint correct_ratio check (magic_stars_gained = stars_spent / 5)
);

-- 7. shop_products (fixed 3 packages)
create table public.shop_products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  emoji             text not null default '🪙',
  magic_stars_cost  integer not null check (magic_stars_cost > 0),
  gold_beans_reward integer not null check (gold_beans_reward > 0),
  sort_order        integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- 8. shop_purchases
create table public.shop_purchases (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.shop_products(id) on delete restrict,
  child_id            uuid not null references public.profiles(id) on delete cascade,
  magic_stars_spent   integer not null check (magic_stars_spent > 0),
  gold_beans_received integer not null check (gold_beans_received > 0),
  created_at          timestamptz not null default now()
);

-- 9. bean_redemptions (child self-pay gold beans)
create table public.bean_redemptions (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.profiles(id) on delete cascade,
  amount     integer not null check (amount > 0),
  note       text,
  created_at timestamptz not null default now()
);

-- 10. currency_transactions (ledger)
create type public.currency_type as enum ('star', 'magic_star', 'gold_bean');
create type public.tx_direction as enum ('credit', 'debit');
create type public.tx_source as enum (
  'task_reward',
  'star_conversion',
  'shop_purchase',
  'bean_spend',
  'parent_adjustment'
);

create table public.currency_transactions (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.profiles(id) on delete cascade,
  currency   public.currency_type not null,
  direction  public.tx_direction not null,
  amount     integer not null check (amount > 0),
  source     public.tx_source not null,
  source_id  uuid,
  note       text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Triggers
-- ============================================================

-- Trigger: task approval → award points
create or replace function public.handle_task_approval()
returns trigger language plpgsql security definer as $$
declare
  v_stars integer;
  v_magic integer;
begin
  if (old.status = 'pending' and new.status = 'approved') then
    select stars_reward, magic_stars_reward
      into v_stars, v_magic
      from public.tasks where id = new.task_id;

    update public.profiles set
      stars       = stars + v_stars,
      magic_stars = magic_stars + v_magic,
      total_tasks_completed = total_tasks_completed + 1
    where id = new.child_id;

    if v_stars > 0 then
      insert into public.currency_transactions
        (child_id, currency, direction, amount, source, source_id, note)
      values
        (new.child_id, 'star', 'credit', v_stars, 'task_reward', new.id, '任务完成奖励');
    end if;

    if v_magic > 0 then
      insert into public.currency_transactions
        (child_id, currency, direction, amount, source, source_id, note)
      values
        (new.child_id, 'magic_star', 'credit', v_magic, 'task_reward', new.id, '任务完成奖励');
    end if;
  end if;
  return new;
end;
$$;

create trigger on_task_completion_approved
  after update on public.task_completions
  for each row execute function public.handle_task_approval();

-- Trigger: star conversion (5⭐ → 1🌟)
create or replace function public.handle_star_conversion()
returns trigger language plpgsql security definer as $$
declare
  v_current_stars integer;
begin
  select stars into v_current_stars
    from public.profiles where id = new.child_id;

  if v_current_stars < new.stars_spent then
    raise exception '星星不足（现有 %，需要 %）', v_current_stars, new.stars_spent;
  end if;

  update public.profiles set
    stars       = stars - new.stars_spent,
    magic_stars = magic_stars + new.magic_stars_gained
  where id = new.child_id;

  insert into public.currency_transactions
    (child_id, currency, direction, amount, source, source_id, note)
  values
    (new.child_id, 'star',       'debit',  new.stars_spent,        'star_conversion', new.id, '升级魔法星'),
    (new.child_id, 'magic_star', 'credit', new.magic_stars_gained, 'star_conversion', new.id, '由星星升级');

  return new;
end;
$$;

create trigger on_star_conversion
  before insert on public.star_conversions
  for each row execute function public.handle_star_conversion();

-- Trigger: shop purchase → deduct magic stars, credit gold beans
create or replace function public.handle_shop_purchase()
returns trigger language plpgsql security definer as $$
declare
  v_current_magic integer;
  v_product       record;
begin
  select magic_stars into v_current_magic
    from public.profiles where id = new.child_id;

  select magic_stars_cost, gold_beans_reward
    into v_product
    from public.shop_products
    where id = new.product_id and is_active = true;

  if not found then
    raise exception '商品不存在或已下架';
  end if;

  if v_current_magic < v_product.magic_stars_cost then
    raise exception '魔法星不足（现有 %，需要 %）', v_current_magic, v_product.magic_stars_cost;
  end if;

  new.magic_stars_spent   := v_product.magic_stars_cost;
  new.gold_beans_received := v_product.gold_beans_reward;

  update public.profiles set
    magic_stars = magic_stars - v_product.magic_stars_cost,
    gold_beans  = gold_beans  + v_product.gold_beans_reward
  where id = new.child_id;

  insert into public.currency_transactions
    (child_id, currency, direction, amount, source, source_id, note)
  values
    (new.child_id, 'magic_star', 'debit',  v_product.magic_stars_cost,  'shop_purchase', new.id, '商店购买金豆豆'),
    (new.child_id, 'gold_bean',  'credit', v_product.gold_beans_reward, 'shop_purchase', new.id, '购买金豆豆套餐');

  return new;
end;
$$;

create trigger on_shop_purchase
  before insert on public.shop_purchases
  for each row execute function public.handle_shop_purchase();

-- Trigger: bean spend → deduct gold beans
create or replace function public.handle_bean_spend()
returns trigger language plpgsql security definer as $$
declare
  v_current_beans integer;
begin
  select gold_beans into v_current_beans
    from public.profiles where id = new.child_id;

  if v_current_beans < new.amount then
    raise exception '金豆豆不足（现有 %，需要 %）', v_current_beans, new.amount;
  end if;

  update public.profiles set
    gold_beans = gold_beans - new.amount
  where id = new.child_id;

  insert into public.currency_transactions
    (child_id, currency, direction, amount, source, source_id, note)
  values
    (new.child_id, 'gold_bean', 'debit', new.amount, 'bean_spend', new.id,
     coalesce(new.note, '消费金豆豆'));

  return new;
end;
$$;

create trigger on_bean_spend
  before insert on public.bean_redemptions
  for each row execute function public.handle_bean_spend();

-- ============================================================
-- Seed: shop products (fixed, system-wide)
-- ============================================================
insert into public.shop_products (id, name, description, emoji, magic_stars_cost, gold_beans_reward, sort_order)
values
  ('00000000-0000-0000-0001-000000000001',
   '小袋金豆豆', '用 1 颗魔法星换 3 个金豆豆', '🪙', 1, 3, 1),
  ('00000000-0000-0000-0001-000000000002',
   '中袋金豆豆', '用 10 颗魔法星换 33 个金豆豆，比小袋更划算！', '🪙🪙', 10, 33, 2),
  ('00000000-0000-0000-0001-000000000003',
   '大袋金豆豆', '用 27 颗魔法星换 99 个金豆豆，超级划算！', '🪙🪙🪙', 27, 99, 3);
