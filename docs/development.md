# 儿童激励系统 — 开发文档

> 版本：v0.5.0 | 日期：2026-06-09 | 作者：Wayne

---

## 目录

1. [需求分析](#1-需求分析)
2. [货币体系设计](#2-货币体系设计)
3. [技术栈](#3-技术栈)
4. [移动端 UI 设计规范](#4-移动端-ui-设计规范)
5. [数据库设计](#5-数据库设计)
6. [SQL 建表脚本](#6-sql-建表脚本)
7. [初始账户数据](#7-初始账户数据)
8. [Row Level Security (RLS)](#8-row-level-security-rls)
9. [前端目录结构](#9-前端目录结构)
10. [路由规划](#10-路由规划)
11. [Supabase CLI 配置](#11-supabase-cli-配置)
12. [开发计划](#12-开发计划)

---

## 1. 需求分析

### 核心用户角色

| 角色 | 说明 |
|------|------|
| `parent` | 家长，创建管理任务、审批完成申请、查看孩子消费记录 |
| `child` | 孩子，完成任务赚取积分、在商店购买金豆豆包、消费金豆豆、查看排行榜 |

### 功能模块

#### 家长端（手机浏览器使用）
- **账户管理**：创建子女账号（Darren / Ricky），设置昵称与头像
- **任务管理**：创建/编辑/删除任务，为每个任务独立设置「星星」和「魔法星」奖励数量
- **审批中心**：查看子女提交的完成申请，一键通过或拒绝（含拒绝原因）
- **金豆豆记录**：查看每个孩子的金豆豆消费历史（孩子自主支付后，家长在此确认线下兑现）
- **数据看板**：家庭内孩子积分排名、任务完成率

#### 孩子端（手机浏览器使用）
- **任务大厅**：查看分配给自己的任务（待完成 / 审批中 / 已完成）
- **我的宝箱**：三种货币余额展示 + 流水记录
- **星星升级**：将 5 颗星星升级为 1 颗魔法星（自主操作）
- **金豆豆商店** 🛒：用魔法星购买金豆豆套餐（三款固定商品）
- **消费金豆豆** 💸：自主选择数量支付金豆豆，换取线下实物奖励（口头约定）
- **排行榜** 🏆：家庭内孩子实时魔法星排名
- **个人中心**：头像、昵称、成就统计

### 业务规则

- 孩子提交任务完成 → 家长审批通过 → 星星和魔法星同时到账
- **5 颗星星** 可自主升级为 **1 颗魔法星**（即时到账，无需审批）
- **魔法星** 在商店购买金豆豆套餐（消耗魔法星，获得金豆豆）
- **金豆豆** 由孩子自主选择数量「支付」，余额即时扣减，家长可查看消费记录后线下兑现
- 任务支持「一次性」「每日」「每周」「里程碑」四种周期
- **里程碑任务**：无固定时间周期，是永久存在的模板，可无限次提交完成（如：每次考试满分 / 每次比赛赢一局）；孩子端待完成 Tab 中始终显示可提交；每条申请记录独立展示在审批中/已完成 Tab；提交时可填写场次数量（1–20），奖励自动按倍数计算

---

## 2. 货币体系设计

### 命名方案

| 货币 | 图标 | Key | 获取方式 | 用途 |
|------|------|-----|----------|------|
| **星星** | ⭐ | `stars` | 完成日常任务 | 积累后升级为魔法星 |
| **魔法星** | 🌟 | `magic_stars` | 完成特殊任务 / 5星星升级 | 商店购买金豆豆套餐 |
| **金豆豆** | 🪙 | `gold_beans` | 商店购买 | 孩子自主支付消费（口头约定线下兑现） |

### 货币流转图

```
完成日常任务 ──→ ⭐⭐⭐⭐⭐ 星星
                      │
                   5个升1个（自主，即时）
                      ↓
完成特殊任务 ──→ 🌟 魔法星
                      │
                  去商店购买
                      ↓
                ┌─────────────┐
                │  金豆豆商店  │
                ├─────────────┤
                │ 1🌟 → 3🪙  │  小包
                │ 10🌟→ 33🪙 │  中包（3.3倍）
                │ 27🌟→ 99🪙 │  大包（3.67倍，最划算）
                └─────────────┘
                      │
              🪙🪙🪙 金豆豆余额
                      │
           孩子选数量「支付」→ 余额扣减（即时）
                      │
           家长查看消费记录 → 线下兑现奖励（口头约定）
```

### 金豆豆商品套餐

| 商品名 | 价格（魔法星） | 获得金豆豆 | 单价比 | 备注 |
|--------|--------------|------------|--------|------|
| 🪙 小袋金豆豆 | 1 🌟 | 3 🪙 | 3.00 | 入门款 |
| 🪙🪙 中袋金豆豆 | 10 🌟 | 33 🪙 | 3.30 | 有折扣 |
| 🪙🪙🪙 大袋金豆豆 | 27 🌟 | 99 🪙 | 3.67 | 最划算，鼓励攒大目标 |

> **设计意图**：批量购买更划算，培养孩子「攒钱后大额兑换」的延迟满足习惯。

### 操作汇总

| 操作 | 消耗 | 获得 | 谁操作 |
|------|------|------|--------|
| 星星升级 | 5 ⭐ | 1 🌟 | 孩子自主，即时 |
| 商店：小袋 | 1 🌟 | 3 🪙 | 孩子购买，即时到账 |
| 商店：中袋 | 10 🌟 | 33 🪙 | 孩子购买，即时到账 |
| 商店：大袋 | 27 🌟 | 99 🪙 | 孩子购买，即时到账 |
| 金豆豆消费 | N 🪙（自选） | 口头约定奖励 | 孩子自主支付，即时扣余额 |

### 任务积分参考

| 任务类型 | 星星奖励 | 魔法星奖励 |
|----------|----------|------------|
| 每日作业 | 5–10 ⭐ | 0 |
| 每日阅读 | 5–8 ⭐ | 0 |
| 整理房间（周） | 10–15 ⭐ | 1 🌟 |
| 主动帮忙（一次性） | 0 | 2 🌟 |
| 坚持一周无迟到 | 20 ⭐ | 2 🌟 |

---

## 3. 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS v4（Mobile-first） |
| 后端 / BaaS | Supabase（PostgreSQL + Auth + Storage + Realtime） |
| 状态管理 | Zustand |
| 路由 | React Router v7 |
| 表单验证 | React Hook Form + Zod |
| 图标 | Lucide React |
| 动画 | Framer Motion |
| 日期处理 | date-fns |
| 字体 | Nunito（Google Fonts） |

### 安装命令

```bash
npm install @supabase/supabase-js react-router-dom zustand
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react date-fns framer-motion
```

---

## 4. 移动端 UI 设计规范

### 设计原则

> 所有页面以 **375px（iPhone SE）** 为基准宽度设计，优先保证手机竖屏体验。
> 平板和桌面端自然居中展示（最大宽度 480px），无需额外适配。

### 页面布局结构（孩子端）

```
┌─────────────────────────┐  ← 375px
│  ┌───────────────────┐  │
│  │  顶部货币栏 56px  │  │  ← 固定，显示 ⭐🌟🪙 三种余额
│  └───────────────────┘  │
│                          │
│      页面内容区域        │  ← 可滚动，padding 16px
│                          │
│  ┌───────────────────┐  │
│  │  底部导航栏 64px  │  │  ← 固定，5个大图标
│  └───────────────────┘  │
└─────────────────────────┘
```

### 页面布局结构（家长端）

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │  顶部栏 56px      │  │  ← 页面标题 + 通知角标
│  └───────────────────┘  │
│                          │
│      页面内容区域        │  ← 可滚动，padding 16px
│                          │
│  ┌───────────────────┐  │
│  │  底部导航栏 64px  │  │  ← 5个图标
│  └───────────────────┘  │
└─────────────────────────┘
```

### 配色方案

```
孩子端：
  页面背景      #F0F4FF   浅蓝紫
  卡片背景      #FFFFFF
  ⭐ 星星色    #FFD700 → #FF9500  金黄渐变
  🌟 魔法星色  #A855F7 → #7C3AED  紫色渐变
  🪙 金豆豆色  #22C55E → #16A34A  绿色渐变
  商店主色      #F97316 → #EA580C  橙色（活跃感）
  主按钮        #6366F1   靛蓝
  危险/拒绝     #EF4444   红色
  成功/通过     #22C55E   绿色

家长端：
  页面背景      #F8FAFC
  主色          #334155
  强调色        #6366F1
```

### 字体

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
body { font-family: 'Nunito', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
```

### 控件尺寸规范

| 元素 | 规格 | Tailwind 类 |
|------|------|-------------|
| 底部导航高度 | 64px | `h-16` |
| 主操作按钮 | 最小 56px 高 | `min-h-14 rounded-3xl` |
| 次要按钮 | 48px | `h-12 rounded-2xl` |
| 任务/商品卡片圆角 | 20px | `rounded-[20px]` |
| 卡片内 padding | 20px | `p-5` |
| 货币徽章 | 36px 高 | `h-9 px-3 rounded-full` |
| 顶部货币栏 | 56px 高 | `h-14` |
| 列表项间距 | 12px | `gap-3` |
| 页面水平 padding | 16px | `px-4` |

### 底部导航（孩子端）5个标签

```
┌─────┬─────┬─────┬─────┬─────┐
│ 🏠  │ 🎒  │ 🛒  │ 🏆  │ 👤  │
│任务 │宝箱 │商店 │排行榜│个人 │
└─────┴─────┴─────┴─────┴─────┘
```

### 底部导航（家长端）5个标签

```
┌─────┬─────┬─────┬─────┬─────┐
│ 📊  │ 📋  │ ✅  │ 🪙  │ 👨‍👩‍👧‍👦 │
│看板 │任务 │审批 │金豆豆│家庭 │
└─────┴─────┴─────┴─────┴─────┘
```

### 商店商品卡片布局

```
┌────────────────────────────────┐
│  🪙🪙🪙  大袋金豆豆            │
│                                │
│     99 🪙 金豆豆               │
│     口头约定价值               │
│                          最划算│
├────────────────────────────────┤
│        消耗 27 🌟 魔法星       │
│  ┌──────────────────────────┐ │
│  │      立即购买 →          │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

### 动效规范

| 场景 | 动效 | 时长 |
|------|------|------|
| 任务提交成功 | 五彩纸屑 + 积分数字弹出 | 1.5s |
| 审批通过 | 🌟 放大闪光 + 飞入顶部余额栏 | 1.0s |
| 星星升级魔法星 | 5颗星星聚合粒子动画 | 0.8s |
| 商店购买成功 | 金豆豆雨 + 余额滚动更新 | 1.2s |
| 排行榜更新 | 卡片滑动重排 | 0.4s |
| 页面切换 | slide-up 进入 | 0.25s |
| 按钮点击 | scale(0.95) 弹回 | 0.15s |

### 头像系统

12 款预设动物 emoji：
`🐼` `🦊` `🐻` `🐱` `🐶` `🐸` `🦁` `🐧` `🦄` `🐨` `🐯` `🐰`

---

## 5. 数据库设计

### ER 关系概览

```
auth.users (Supabase 内置)
    │
    └─── profiles              ← 用户信息，含 role 和三种货币余额
              │
              ├─── tasks               ← 任务定义（双积分设置）
              │       │
              │       └─── task_completions   ← 完成申请 + 审批
              │
              ├─── star_conversions    ← ⭐×5 → 🌟×1 升级记录
              │
              ├─── shop_products       ← 金豆豆套餐商品（3条固定记录）
              │       │
              │       └─── shop_purchases     ← 孩子购买记录
              │
              └─── currency_transactions ← 三种货币完整流水账本
```

### 表结构说明

| 表名 | 用途 |
|------|------|
| `families` | 家庭单元 |
| `profiles` | 用户扩展信息，含 role 和三种货币余额 |
| `tasks` | 任务定义，双积分奖励 |
| `task_completions` | 完成申请，含审批状态 |
| `star_conversions` | 星星→魔法星升级记录 |
| `shop_products` | 金豆豆商品套餐（系统固定3款） |
| `shop_purchases` | 孩子的购买记录 |
| `currency_transactions` | 三种货币统一流水账本 |

---

## 6. SQL 建表脚本

### 6.1 启用扩展

```sql
create extension if not exists "uuid-ossp";
```

### 6.2 families 表

```sql
create table public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
```

### 6.3 profiles 表

```sql
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
```

### 6.4 tasks 表

```sql
create type public.task_recurrence as enum ('once', 'daily', 'weekly', 'milestone');
-- milestone：无固定周期，审批通过后立即重置为 todo，可重复完成
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
```

### 6.5 task_completions 表

```sql
create type public.completion_status as enum ('pending', 'approved', 'rejected');

create table public.task_completions (
  id                   uuid primary key default gen_random_uuid(),
  task_id              uuid not null references public.tasks(id) on delete cascade,
  child_id             uuid not null references public.profiles(id) on delete cascade,
  status               public.completion_status not null default 'pending',
  note                 text,
  proof_url            text,
  reviewed_by          uuid references public.profiles(id) on delete set null,
  reviewed_at          timestamptz,
  reject_reason        text,
  stars_reward         integer null,  -- override: set when child submits with quantity > 1 (base × count)
  magic_stars_reward   integer null,  -- override: same. null means use task base value
  created_at           timestamptz not null default now()
);
```

> **奖励覆盖规则**：`stars_reward` / `magic_stars_reward` 为可空列。非 null 时（里程碑批量提交）优先使用该值发放奖励；null 时回退到 `tasks.stars_reward` / `tasks.magic_stars_reward`。所有读取奖励的地方统一用 `completion.stars_reward ?? task.stars_reward` 模式。

### 6.6 star_conversions 表（⭐ → 🌟）

```sql
create table public.star_conversions (
  id               uuid primary key default gen_random_uuid(),
  child_id         uuid not null references public.profiles(id) on delete cascade,
  stars_spent      integer not null check (stars_spent > 0 and stars_spent % 5 = 0),
  magic_stars_gained integer not null check (magic_stars_gained > 0),
  created_at       timestamptz not null default now(),
  constraint correct_ratio check (magic_stars_gained = stars_spent / 5)
);
```

### 6.7 shop_products 表（金豆豆套餐，系统固定3款）

```sql
create table public.shop_products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  emoji        text not null default '🪙',
  magic_stars_cost integer not null check (magic_stars_cost > 0),
  gold_beans_reward integer not null check (gold_beans_reward > 0),
  sort_order   integer not null default 0,   -- 展示排序
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
```

### 6.8 shop_purchases 表（购买记录）

```sql
create table public.shop_purchases (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.shop_products(id) on delete restrict,
  child_id        uuid not null references public.profiles(id) on delete cascade,
  magic_stars_spent  integer not null check (magic_stars_spent > 0),
  gold_beans_received integer not null check (gold_beans_received > 0),
  created_at      timestamptz not null default now()
);
```

### 6.9 bean_redemptions 表（金豆豆消费记录）

```sql
create table public.bean_redemptions (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.profiles(id) on delete cascade,
  amount       integer not null check (amount > 0),
  note         text,   -- 孩子填写消费原因，如「买了冰淇淋」
  created_at   timestamptz not null default now()
);
```

> 孩子在「宝箱」页面点击「消费金豆豆」，填写数量（和可选备注），触发器即时扣减余额并写入流水。

### 6.10 currency_transactions 表（流水账本）

```sql
create type public.currency_type as enum ('star', 'magic_star', 'gold_bean');
create type public.tx_direction as enum ('credit', 'debit');
create type public.tx_source as enum (
  'task_reward',        -- 任务审批通过
  'star_conversion',    -- 星星升级魔法星
  'shop_purchase',      -- 商店购买金豆豆套餐
  'bean_spend',         -- 孩子自主消费金豆豆
  'parent_adjustment'   -- 家长手动调整
);

create table public.currency_transactions (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.profiles(id) on delete cascade,
  currency    public.currency_type not null,
  direction   public.tx_direction not null,
  amount      integer not null check (amount > 0),
  source      public.tx_source not null,
  source_id   uuid,
  note        text,
  created_at  timestamptz not null default now()
);
```

### 6.11 触发器：任务审批自动发放积分

> 使用 `coalesce(new.stars_reward, t.stars_reward)` 优先取 completion 的覆盖值，支持里程碑批量提交的场次倍增奖励。

```sql
create or replace function public.handle_task_approval()
returns trigger language plpgsql security definer as $$
declare
  v_stars integer;
  v_magic integer;
begin
  if (old.status = 'pending' and new.status = 'approved') then
    -- coalesce: prefer completion-level override (batch milestone), else use task base
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

create trigger on_task_completion_approved
  after update on public.task_completions
  for each row execute function public.handle_task_approval();
```

### 6.12 触发器：星星升级魔法星（自主，即时）

```sql
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
    (new.child_id, 'star',       'debit',  new.stars_spent,       'star_conversion', new.id, '升级魔法星'),
    (new.child_id, 'magic_star', 'credit', new.magic_stars_gained, 'star_conversion', new.id, '由星星升级');

  return new;
end;
$$;

create trigger on_star_conversion
  before insert on public.star_conversions
  for each row execute function public.handle_star_conversion();
```

### 6.13 触发器：商店购买金豆豆（即时到账）

```sql
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

  -- 确保购买数据与商品一致
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
```

### 6.14 触发器：金豆豆消费（孩子自主支付）

```sql
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
```

---

## 7. 初始账户数据

### 账户规划

| 账号 | 邮箱 | 角色 | 昵称 | 头像 |
|------|------|------|------|------|
| 家长 | wayne@xhunter.com.au | parent | 爸爸 | 👨 |
| 孩子一 | darren@qddbros.com.au | child | Darren | 🐼 |
| 孩子二 | ricky@qddbros.com.au | child | Ricky | 🦊 |

### 初始数据 SQL

```sql
-- Step 1: 家庭单元
insert into public.families (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Wayne 的家');

-- Step 2: profiles（替换 UID 为 Auth 创建后的实际 UUID）
insert into public.profiles (id, family_id, role, display_name, avatar_emoji)
values
  ('<parent_uid>', '00000000-0000-0000-0000-000000000001', 'parent', '爸爸',  '👨'),
  ('<darren_uid>', '00000000-0000-0000-0000-000000000001', 'child',  'Darren','🐼'),
  ('<ricky_uid>',  '00000000-0000-0000-0000-000000000001', 'child',  'Ricky', '🦊');

-- Step 3: 固定商品（金豆豆套餐，全系统共享，无需 family_id）
insert into public.shop_products (id, name, description, emoji, magic_stars_cost, gold_beans_reward, sort_order)
values
  ('00000000-0000-0000-0001-000000000001',
   '小袋金豆豆', '用 1 颗魔法星换 3 个金豆豆', '🪙', 1, 3, 1),

  ('00000000-0000-0000-0001-000000000002',
   '中袋金豆豆', '用 10 颗魔法星换 33 个金豆豆，比小袋更划算！', '🪙🪙', 10, 33, 2),

  ('00000000-0000-0000-0001-000000000003',
   '大袋金豆豆', '用 27 颗魔法星换 99 个金豆豆，超级划算！', '🪙🪙🪙', 27, 99, 3);

-- Step 4: 示例任务
insert into public.tasks
  (family_id, created_by, assigned_to, title, description, emoji,
   stars_reward, magic_stars_reward, recurrence)
values
  ('00000000-0000-0000-0000-000000000001', '<parent_uid>', '<darren_uid>',
   'Finish Math Homework', 'Complete today''s math exercises', '📐', 10, 0, 'daily'),

  ('00000000-0000-0000-0000-000000000001', '<parent_uid>', '<ricky_uid>',
   'Finish Chinese Writing', 'Complete today''s Chinese writing practice', '✏️', 10, 0, 'daily'),

  ('00000000-0000-0000-0000-000000000001', '<parent_uid>', null,
   'Read for 30 Minutes', 'Read any book for 30 minutes', '📚', 8, 0, 'daily'),

  ('00000000-0000-0000-0000-000000000001', '<parent_uid>', null,
   'Tidy Up Room', 'Clean desk and make bed — keep it tidy all week!', '🧹', 15, 1, 'weekly'),

  ('00000000-0000-0000-0000-000000000001', '<parent_uid>', null,
   'Help with Chores', 'Help wash dishes or mop the floor', '🫧', 0, 2, 'once');
```

---

## 8. Row Level Security (RLS)

> **注意：`profiles` 表策略不能直接子查询 `profiles` 自身，否则触发 PostgreSQL 错误 `42P17: infinite recursion`。使用 `SECURITY DEFINER` 辅助函数绕过（migration `20260609000003`）。**

```sql
alter table public.families              enable row level security;
alter table public.profiles              enable row level security;
alter table public.tasks                 enable row level security;
alter table public.task_completions      enable row level security;
alter table public.star_conversions      enable row level security;
alter table public.shop_products         enable row level security;
alter table public.shop_purchases        enable row level security;
alter table public.bean_redemptions      enable row level security;
alter table public.currency_transactions enable row level security;

-- ====== 辅助函数（SECURITY DEFINER 绕过 RLS，避免 profiles 策略递归）======
create or replace function public.get_my_family_id()
returns uuid language sql security definer set search_path = public as $$
  select family_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_role()
returns user_role language sql security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ====== profiles ======
create policy "family members view profiles"
  on public.profiles for select
  using (family_id = get_my_family_id());

create policy "users update own display info"
  on public.profiles for update
  using (id = auth.uid());

create policy "parents update family profiles"
  on public.profiles for update
  using (
    get_my_role() = 'parent'::user_role
    and family_id = get_my_family_id()
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
-- 所有登录用户可查看商品
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
```

---

## 9. 前端目录结构

```
src/
├── assets/
│   └── animations/
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx         # variant: primary/star/magic/bean/shop/danger
│   │   ├── Card.tsx
│   │   ├── CurrencyBadge.tsx  # ⭐/🌟/🪙 三种货币徽章
│   │   ├── AvatarEmoji.tsx    # 头像展示 + 选择器
│   │   ├── BottomSheet.tsx    # 手机端底部滑出弹层
│   │   └── Confetti.tsx       # 五彩纸屑动效
│   │
│   ├── layout/
│   │   ├── ChildLayout.tsx    # 顶部货币栏 + 底部5栏导航
│   │   ├── ParentLayout.tsx   # 顶部标题栏 + 底部5栏导航
│   │   └── WalletBar.tsx      # 顶部固定货币余额条（孩子端）
│   │
│   ├── tasks/
│   │   ├── TaskCard.tsx       # 展示双积分、大完成按钮
│   │   ├── TaskList.tsx
│   │   ├── TaskForm.tsx       # 创建/编辑（BottomSheet 内）
│   │   └── CompletionCard.tsx # 家长审批卡片
│   │
│   ├── shop/
│   │   ├── ProductCard.tsx    # 金豆豆套餐卡片（含划算标签）
│   │   ├── ProductGrid.tsx    # 三款商品网格
│   │   └── PurchaseConfirm.tsx # 购买确认弹层
│   │
│   ├── currency/
│   │   ├── StarConvertCard.tsx # 星星升级魔法星操作卡
│   │   └── TransactionList.tsx # 流水记录
│   │
│   └── leaderboard/
│       └── RankRow.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useTasks.ts
│   ├── useCompletions.ts
│   ├── useCurrency.ts          # 余额、流水、星星升级
│   ├── useShop.ts              # 商品列表、购买操作
│   └── useLeaderboard.ts       # Realtime 排行榜
│
├── lib/
│   ├── supabase.ts
│   ├── currency.ts             # 货币工具函数
│   └── validations.ts
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   │
│   ├── parent/
│   │   ├── DashboardPage.tsx
│   │   ├── TasksPage.tsx
│   │   ├── ApprovalsPage.tsx
│   │   ├── BeansPage.tsx       # 金豆豆消费历史（按孩子分组，家长查看）
│   │   └── FamilyPage.tsx
│   │
│   └── child/
│       ├── TasksPage.tsx       # 主页：任务大厅
│       ├── WalletPage.tsx      # 我的宝箱 + 星星升级 + 消费金豆豆入口
│       ├── ShopPage.tsx        # 金豆豆商店（三款套餐）
│       ├── LeaderboardPage.tsx
│       └── ProfilePage.tsx
│
├── store/
│   ├── authStore.ts
│   └── familyStore.ts
│
├── types/
│   ├── database.ts             # supabase gen types 自动生成
│   └── index.ts
│
├── App.tsx
├── main.tsx
└── index.css
```

---

## 10. 路由规划

```
/                    → 检测登录态 → /parent/dashboard 或 /child/tasks

/login

/parent/
  dashboard          → 家庭看板
  tasks              → 任务管理
  tasks/new
  tasks/:id/edit
  approvals          → 审批中心
  beans              → 金豆豆消费历史（家长查看）
  family             → 家庭成员

/child/
  tasks              → 任务大厅（默认首页）
  wallet             → 我的宝箱 + 星星升级
  shop               → 金豆豆商店
  leaderboard        → 排行榜
  profile            → 个人中心
```

---

## 11. Supabase CLI 配置

### 已确认的项目信息

| 信息 | 值 |
|------|-----|
| Project URL | `https://piglodngfxutxdpauooj.supabase.co` |
| Project Reference ID | `piglodngfxutxdpauooj` |
| Database Password | ✅ 已确认（不记录在文档中） |
| Access Token | ✅ 已确认（不记录在文档中，以 `sbp_` 开头） |

### CLI 工作流

```bash
# 1. 安装 Supabase CLI
npm install -g supabase

# 2. 登录
supabase login
# 粘贴 Access Token

# 3. 初始化 + 链接项目
supabase init
supabase link --project-ref piglodngfxutxdpauooj
# 输入 Database Password

# 4. 推送 migration
supabase db push

# 5. 生成 TypeScript 类型
supabase gen types typescript --linked > src/types/database.ts
```

### Migration 文件结构

```
supabase/
├── config.toml
└── migrations/
    ├── 20260609000001_schema.sql                        # 建表 + 触发器
    ├── 20260609000002_rls.sql                           # RLS 策略
    ├── 20260609000003_fix_profiles_rls_recursion.sql    # 修复 profiles 策略无限递归
    ├── 20260609000005_add_milestone_recurrence.sql      # task_recurrence 枚举加 milestone
    ├── 20260609000006_clone_milestone_task_trigger.sql  # ⚠️ 废弃（被007删除）
    ├── 20260609000007_drop_clone_milestone_trigger.sql  # 删除克隆触发器（修复重复任务 Bug）
    └── 20260609000008_completion_reward_override.sql    # task_completions 奖励覆盖列
```

> seed 数据（初始账户/商品）直接在 Supabase SQL Editor 手动执行，不入 migration。

### Storage Bucket

| Bucket | 公开 | 用途 |
|--------|------|------|
| `avatars` | 是 | 用户头像 |
| `task-proofs` | 否 | 任务完成证明图片 |

---

## 12. 开发计划

### 阶段总览

```
Phase 0 — 基础设施      ~1天   Supabase 连通 + 登录
Phase 1 — 核心任务流    ~3天   任务 → 完成 → 审批 → 积分到账
Phase 2 — 货币 + 商店   ~2天   星星升级 + 商店购买金豆豆
Phase 3 — 儿童体验打磨  ~2天   动效 + 排行榜 + 移动端细节
Phase 4 — 家长管理增强  ~1天   看板 + 周期任务 + 金豆豆发放
```

---

### Phase 0 — 基础设施

| # | 任务 |
|---|------|
| 0.1 | 安装所有依赖 |
| 0.2 | 配置 `.env.local`（SUPABASE_URL + ANON_KEY） |
| 0.3 | `supabase init` + `supabase link` |
| 0.4 | 执行 migration：schema + rls |
| 0.5 | 在 Auth → Users 创建三个账户（wayne / darren / ricky） |
| 0.6 | 执行 seed SQL（替换UID）：3个 profiles + 3个商品 + 5条任务 |
| 0.7 | 生成 TypeScript 类型 |
| 0.8 | 实现 `lib/supabase.ts` |
| 0.9 | 实现 `useAuth` + authStore |
| 0.10 | 实现登录页 |
| 0.11 | 实现路由守卫（按 role 跳转） |

---

### Phase 1 — 核心任务流

| # | 任务 |
|---|------|
| 1.1 | `ChildLayout`：顶部货币栏 + 底部5栏导航 |
| 1.2 | `WalletBar`：实时显示 ⭐ 🌟 🪙 余额 |
| 1.3 | 孩子端：任务大厅（待完成 / 审批中 / 已完成 分组） |
| 1.4 | `TaskCard`：emoji + 积分奖励 + 大完成按钮 |
| 1.5 | 孩子端：提交完成申请（BottomSheet 填备注） |
| 1.6 | `ParentLayout`：顶部标题 + 底部5栏导航 |
| 1.7 | 家长端：任务管理页 |
| 1.8 | `TaskForm`：双积分输入 + emoji 选择 + 周期设置 |
| 1.9 | 家长端：审批中心（通过/拒绝） |
| 1.10 | 验证审批触发器：余额正确到账 |

---

### Phase 1 补充 — 里程碑任务类型 + 任务大厅优化

> 新增第四种任务周期：无固定时间、可重复完成。任务大厅改为三 Tab 布局，已完成支持时间筛选与翻页。

**里程碑任务架构（最终版）**

里程碑任务是**永久存在的模板**，不克隆、不归档。孩子对同一个任务反复提交 `task_completions`，家长始终只看到 1 个任务条目。

| 层 | 文件 | 说明 |
|----|------|------|
| DB migration | `20260609000005_add_milestone_recurrence.sql` | `ALTER TYPE task_recurrence ADD VALUE 'milestone'` |
| DB migration | `20260609000006_clone_milestone_task_trigger.sql` | ⚠️ 已被废弃——创建了克隆触发器（后被 `20260609000007` 删除） |
| DB migration | `20260609000007_drop_clone_milestone_trigger.sql` | 删除克隆触发器和函数，修复家长端任务重复 Bug |
| DB migration | `20260609000008_completion_reward_override.sql` | `task_completions` 新增 `stars_reward` / `magic_stars_reward` 可空覆盖列 |
| TS 类型 | `src/types/database.ts` | `task_completions.Row/Insert/Update` 含新增两列 |
| Hook | `src/hooks/useTasks.ts` | `TaskWithStatus` 新增 `pendingCount`；`MilestoneCompletion` 接口（completion + task）；`useChildTasks` 返回 `milestoneCompletions[]`；里程碑任务 `displayStatus` 固定为 `'todo'` |
| Hook | `src/hooks/useCompletions.ts` | `useSubmitCompletion` 接受 `SubmitCompletionOptions`（`starsReward` / `magicStarsReward`），写入覆盖列 |
| 新组件 | `src/components/tasks/MilestoneCompletionCard.tsx` | 单条里程碑完成记录卡片，显示奖励用 `completion.stars_reward ?? task.stars_reward` |
| 任务表单 | `src/components/tasks/TaskForm.tsx` | 第四个周期选项「里程碑」 |
| 任务卡片 | `src/components/tasks/TaskCard.tsx` | 里程碑任务显示「审批中 N 次」和「🏆 N 次」徽章 |
| 家长审批卡 | `src/components/tasks/CompletionCard.tsx` | 奖励显示用 `completion.stars_reward ?? task.stars_reward` |
| 家长任务页 | `src/pages/parent/TasksPage.tsx` | `RECURRENCE_LABEL` 加 `milestone: '里程碑'` |

**孩子端任务大厅三 Tab 行为**

| Tab | 配色 | 非里程碑 | 里程碑 |
|-----|------|---------|--------|
| 待完成 | 紫色（默认） | displayStatus = todo | 永远显示（含场次步进器） |
| 审批中 | 橙色 | displayStatus = pending | 每条 pending completion 独立一张 `MilestoneCompletionCard` |
| 已完成 | 绿色 | displayStatus = done | 每条 approved completion 独立一张 `MilestoneCompletionCard`，含备注与批准时间 |

已完成含时间筛选（近1月 / 近3月 / 近1年 / 更早）；「更早」每页 10 条翻页；两类记录按提交时间降序合并显示。

**场次批量提交**

里程碑任务提交弹窗新增「场次数量」步进器（1–20）。quantity > 1 时：
- `stars_reward * quantity` 写入 `task_completions.stars_reward`
- `magic_stars_reward * quantity` 写入 `task_completions.magic_stars_reward`
- 弹窗实时预览计算结果（如 `⭐ +10 (5×2)`）

**审批 Bug 修复**

`src/hooks/useCompletions.ts` — join 语法指定 `child:profiles!task_completions_child_id_fkey(*)`，解决 PostgREST PGRST201 歧义错误（`task_completions` 对 `profiles` 有两条外键）。

| # | 任务 | 状态 |
|---|------|------|
| 1.11 | DB migration：`ADD VALUE 'milestone'` | ✅ |
| 1.12 | 重新生成 TypeScript 类型 | ✅ |
| 1.13 | `useTasks.ts`：`completionCount` / `pendingCount` / `milestoneCompletions` | ✅ |
| 1.14 | `TaskForm.tsx`：添加「里程碑」选项 | ✅ |
| 1.15 | `TaskCard.tsx`：里程碑徽章（审批中 N 次 / 🏆 N 次） | ✅ |
| 1.16 | `ParentTasksPage.tsx`：RECURRENCE_LABEL 添加 `milestone` | ✅ |
| 1.17 | 修复克隆触发器导致家长重复任务 Bug（drop trigger migration） | ✅ |
| 1.18 | 修复审批 PGRST201：指定外键 `!task_completions_child_id_fkey` | ✅ |
| 1.19 | 任务大厅三 Tab + 时间筛选 + 分页 | ✅ |
| 1.20 | 新建 `MilestoneCompletionCard` 组件 | ✅ |
| 1.21 | `task_completions` 新增奖励覆盖列（migration + 类型同步） | ✅ |
| 1.22 | 提交弹窗场次步进器 + 奖励预览 | ✅ |
| 1.23 | `CompletionCard` 家长审批显示实际奖励值 | ✅ |

---

### Phase 2 — 货币体系 + 商店

| # | 任务 |
|---|------|
| 2.1 | 孩子端：我的宝箱页（三种余额大数字 + 流水） |
| 2.2 | `StarConvertCard`：选择升级数量（5的倍数），确认后即时到账 |
| 2.3 | 验证星星升级触发器 |
| 2.4 | 孩子端：金豆豆商店页 |
| 2.5 | `ProductCard`：套餐展示（价格、获得量、划算标签） |
| 2.6 | `PurchaseConfirm`：确认购买弹层（余额不足时禁用） |
| 2.7 | 验证商店购买触发器：余额扣减、金豆豆到账 |
| 2.8 | 孩子端：宝箱页「消费金豆豆」功能（选数量 + 备注 + 触发器扣减） |
| 2.9 | 家长端：金豆豆消费记录页（按孩子分组，查看历史） |
| 2.9 | `TransactionList`：流水记录，图标区分来源 |

---

### Phase 3 — 儿童体验打磨

| # | 任务 |
|---|------|
| 3.1 | 全局 CSS：Nunito 字体 + 配色变量 + 圆角系统 |
| 3.2 | 移动端视口适配（防 iOS 缩放） |
| 3.3 | 任务提交动效（五彩纸屑 + 积分飞入 WalletBar） |
| 3.4 | 星星升级动效（粒子聚合） |
| 3.5 | 商店购买动效（金豆豆雨 + 余额滚动） |
| 3.6 | 排行榜页（按 magic_stars 降序，自己名次高亮） |
| 3.7 | Realtime 排行榜（订阅 profiles 变化） |
| 3.8 | 头像选择器（12款动物网格） |
| 3.9 | 空状态设计（无任务/无记录时的引导插画） |
| 3.10 | 按钮点击弹跳动效 + 页面切换动画 |

---

### Phase 4 — 家长管理增强

| # | 任务 |
|---|------|
| 4.1 | 家长看板：Darren vs Ricky 魔法星对比 + 本周完成任务数 |
| 4.2 | 审批角标：pending 时底部导航显示红点 |
| 4.3 | 任务周期自动重置（Supabase Edge Function + pg_cron） |
| 4.4 | 家庭名称设置：家庭设置页修改家庭名称 |
| 4.5 | 家长创建孩子账号（应用内流程） |

---

### 优先级汇总

| 优先级 | Phase | 孩子可用状态 |
|--------|-------|-------------|
| **P0 必须** | 0 + 1 + 2 | 完整货币闭环，最小可用版本 |
| **P1 重要** | 3 | 动效 + 排行榜，孩子愿意每天打开 |
| **P2 增强** | 4 | 家长运营更省力 |

---

### 开始前 Checklist

- [x] Supabase Project Ref：`piglodngfxutxdpauooj`
- [x] Database Password：已确认
- [x] Access Token：已确认
- [x] 孩子昵称：Darren 🐼（darren@qddbros.com.au） / Ricky 🦊（ricky@qddbros.com.au）
- [x] 货币升级规则：5⭐→1🌟（自主）
- [x] 商店套餐：1🌟→3🪙 / 10🌟→33🪙 / 27🌟→99🪙
- [x] 金豆豆价值：口头约定，无需系统汇率

### Phase 0 完成状态

| # | 任务 | 状态 |
|---|------|------|
| 0.1 | 安装所有依赖 | ✅ |
| 0.2 | 配置 `.env.local` | ✅ |
| 0.3 | `supabase init` + `supabase link` | ✅ |
| 0.4 | 执行 migration：schema + rls + rls修复 | ✅ |
| 0.5 | 在 Auth → Users 创建三个账户 | ✅ |
| 0.6 | 执行 seed SQL（profiles + 商品 + 任务） | ✅ |
| 0.7 | 生成 TypeScript 类型 | ✅ |
| 0.8 | 实现 `lib/supabase.ts` | ✅ |
| 0.9 | 实现 `useAuth` + authStore | ✅ |
| 0.10 | 实现登录页 | ✅ |
| 0.11 | 实现路由守卫（按 role 跳转） | ✅ |
