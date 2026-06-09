alter table public.task_completions
  add column if not exists stars_reward       integer null,
  add column if not exists magic_stars_reward integer null;

comment on column public.task_completions.stars_reward       is 'Override reward at submission time (e.g. multiplied by match count). Null means use task base value.';
comment on column public.task_completions.magic_stars_reward is 'Override magic star reward at submission time. Null means use task base value.';
