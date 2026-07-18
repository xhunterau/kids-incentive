-- Fix: task approval trigger ignored the per-completion reward override.
-- task_completions.stars_reward / magic_stars_reward (added in
-- 20260609000008) store the multiplied reward for batch milestone
-- submissions, but handle_task_approval() read only tasks.stars_reward,
-- so children were credited the task base value regardless of quantity.
create or replace function public.handle_task_approval()
returns trigger language plpgsql security definer as $$
declare
  v_stars integer;
  v_magic integer;
begin
  if (old.status = 'pending' and new.status = 'approved') then
    select coalesce(new.stars_reward, t.stars_reward),
           coalesce(new.magic_stars_reward, t.magic_stars_reward)
      into v_stars, v_magic
      from public.tasks t where t.id = new.task_id;

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
