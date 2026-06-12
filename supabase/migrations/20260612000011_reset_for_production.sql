-- Production reset: clear all test data, keep user accounts (profiles, families, child_pins)
-- Order matters: child tables first, then parent tables

-- Transaction data
truncate table public.bean_redemptions  restart identity cascade;
truncate table public.star_conversions   restart identity cascade;
truncate table public.currency_transactions restart identity cascade;

-- Shop data
truncate table public.shop_purchases     restart identity cascade;
truncate table public.shop_products      restart identity cascade;

-- Task data
truncate table public.task_completions   restart identity cascade;
truncate table public.tasks              restart identity cascade;

-- Reset all children's balances and counters to zero
update public.profiles
set
  stars                 = 0,
  magic_stars           = 0,
  gold_beans            = 0,
  total_tasks_completed = 0
where role = 'child';
