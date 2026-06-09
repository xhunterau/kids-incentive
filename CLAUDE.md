# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server with HMR
npm run build     # type-check then build for production (tsc -b && vite build)
npm run lint      # run ESLint
npm run preview   # preview the production build locally
npx supabase db push   # apply pending migrations to remote Supabase
```

## Stack

- React 19 + TypeScript, bundled with Vite 8
- Tailwind CSS v4 (PostCSS-based, no `tailwind.config.js` — config lives in CSS via `@import "tailwindcss"`)
- Supabase (Postgres + Auth + RLS)
- Entry: `src/main.tsx` → `src/App.tsx`

## Project purpose

Kid incentive app — parents create tasks with star/magic-star rewards; children complete them and submit for parent approval; rewards are credited on approval.

## Architecture

### Roles
- `parent` — manages tasks, approves/rejects completions
- `child` — views assigned tasks, submits completions

### Key data model

**`tasks`** — task templates created by parents
- `recurrence`: `once | daily | weekly | milestone`
- `status`: `active | archived`
- `assigned_to`: nullable profile id (null = all children in family)

**`task_completions`** — one record per submission
- `status`: `pending | approved | rejected`
- `stars_reward` / `magic_stars_reward`: nullable override columns — when set (e.g. for milestone batch submissions), these take precedence over the task's base reward values at approval time
- `note`: child's free-text note for that submission

### Milestone task behaviour
- A milestone task is a **persistent template** — it never gets cloned or archived on submission.
- Children can submit multiple completions against the same milestone task (e.g. multiple competition wins).
- On the child's task page:
  - **待完成 tab** — milestone task always appears here (always submittable).
  - **审批中 tab** — each pending `task_completion` record shown as a separate `MilestoneCompletionCard`.
  - **已完成 tab** — each approved `task_completion` shown as a separate `MilestoneCompletionCard` with note + approval time.
- When submitting a milestone task, the child can set a **场次数量** (1–20). If quantity > 1, the submission stores `stars_reward * quantity` and `magic_stars_reward * quantity` on the completion record.
- `MilestoneCompletionCard` and `CompletionCard` (parent approval) both render `completion.stars_reward ?? task.stars_reward` so the multiplied value is displayed and approved correctly.

### Source layout
```
src/
  hooks/
    useAuth.ts
    useTasks.ts          # useChildTasks (returns tasks + milestoneCompletions), useParentTasks
    useCompletions.ts    # useSubmitCompletion, usePendingCompletions
    useProfile.ts
  components/tasks/
    TaskCard.tsx                 # child task card (non-milestone + milestone todo)
    MilestoneCompletionCard.tsx  # individual milestone completion record card
    CompletionCard.tsx           # parent approval card
    TaskForm.tsx
  pages/
    child/   TasksPage, WalletPage, ShopPage, LeaderboardPage, ProfilePage
    parent/  TasksPage, ApprovalsPage, DashboardPage, FamilyPage, BeansPage
    auth/    LoginPage
supabase/migrations/   # numbered SQL migrations, push with: npx supabase db push
```

### Adding reward columns to task_completions
`stars_reward` and `magic_stars_reward` are **nullable** on `task_completions`. Null means "use the task's base value". Non-null means an override was set at submission time (batch milestone). Any code that reads reward values should use the pattern `completion.stars_reward ?? task.stars_reward`.
