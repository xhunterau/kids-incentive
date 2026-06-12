-- Re-seed shop products that were cleared by the production reset migration.
insert into public.shop_products (id, name, description, emoji, magic_stars_cost, gold_beans_reward, sort_order, is_active)
values
  ('00000000-0000-0000-0001-000000000001',
   '小袋金豆豆', '用 1 颗魔法星换 3 个金豆豆', '🪙', 1, 3, 1, true),
  ('00000000-0000-0000-0001-000000000002',
   '中袋金豆豆', '用 10 颗魔法星换 33 个金豆豆，比小袋更划算！', '🪙🪙', 10, 33, 2, true),
  ('00000000-0000-0000-0001-000000000003',
   '大袋金豆豆', '用 27 颗魔法星换 99 个金豆豆，超级划算！', '🪙🪙🪙', 27, 99, 3, true)
on conflict (id) do nothing;
