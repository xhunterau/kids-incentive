-- Fix: include extensions schema so pgcrypto crypt() is resolvable
create or replace function public.verify_child_pin(p_child_id uuid, p_pin text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.child_pins
    where child_id = p_child_id
      and pin_hash = crypt(p_pin, pin_hash)
  )
$$;

create or replace function public.upsert_child_pin(p_child_id uuid, p_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.child_pins (child_id, pin_hash, updated_at)
  values (p_child_id, crypt(p_pin, gen_salt('bf')), now())
  on conflict (child_id)
  do update set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now();
end;
$$;
