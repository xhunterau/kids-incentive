-- Enable pgcrypto for bcrypt hashing
create extension if not exists pgcrypto;

-- PIN storage table: isolated from profiles so no client can ever read the hash
create table public.child_pins (
  child_id   uuid primary key references public.profiles(id) on delete cascade,
  pin_hash   text not null,
  updated_at timestamptz not null default now()
);

alter table public.child_pins enable row level security;
-- No SELECT policy = no client role can read rows (only service_role via Edge Functions)

-- DB-side PIN verification: hash never leaves the database
create or replace function public.verify_child_pin(p_child_id uuid, p_pin text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.child_pins
    where child_id = p_child_id
      and pin_hash = crypt(p_pin, pin_hash)
  )
$$;

-- Upsert PIN hash (bcrypt via pgcrypto); only callable by service_role via Edge Function
create or replace function public.upsert_child_pin(p_child_id uuid, p_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.child_pins (child_id, pin_hash, updated_at)
  values (p_child_id, crypt(p_pin, gen_salt('bf')), now())
  on conflict (child_id)
  do update set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now();
end;
$$;
