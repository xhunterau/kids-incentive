create or replace function public.clone_milestone_task_on_submit()
returns trigger as $$
declare
  v_task public.tasks%rowtype;
begin
  select * into v_task from public.tasks where id = NEW.task_id;

  if v_task.recurrence <> 'milestone' then
    return NEW;
  end if;

  insert into public.tasks (
    family_id, created_by, assigned_to,
    title, description, emoji,
    stars_reward, magic_stars_reward,
    recurrence, status
  ) values (
    v_task.family_id, v_task.created_by, v_task.assigned_to,
    v_task.title, v_task.description, v_task.emoji,
    v_task.stars_reward, v_task.magic_stars_reward,
    'milestone', 'active'
  );

  return NEW;
end;
$$ language plpgsql security definer;

create trigger clone_milestone_task_on_submit
  after insert on public.task_completions
  for each row execute function public.clone_milestone_task_on_submit();
