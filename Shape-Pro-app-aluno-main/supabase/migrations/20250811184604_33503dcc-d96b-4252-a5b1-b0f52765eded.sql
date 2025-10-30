-- Rewards store schema
-- 1) Items available for redemption
create table if not exists public.rewards_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points_cost integer not null check (points_cost >= 0),
  image_url text,
  is_active boolean not null default true,
  stock integer,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rewards_items enable row level security;

-- Policies: creator manages; everyone authenticated can view active items
create policy "Users can view active rewards"
  on public.rewards_items for select
  using (is_active = true or auth.uid() = created_by);

create policy "Creators can insert rewards"
  on public.rewards_items for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Creators can update rewards"
  on public.rewards_items for update to authenticated
  using (auth.uid() = created_by);

create policy "Creators can delete rewards"
  on public.rewards_items for delete to authenticated
  using (auth.uid() = created_by);

-- 2) User points
create table if not exists public.user_points (
  user_id uuid primary key,
  total_points integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_points enable row level security;

create policy "Users can view own points"
  on public.user_points for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own points"
  on public.user_points for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own points"
  on public.user_points for update to authenticated
  using (auth.uid() = user_id);

-- 3) Redemptions
create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reward_id uuid not null references public.rewards_items(id) on delete restrict,
  points_spent integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.reward_redemptions enable row level security;

create policy "Users can create own redemptions"
  on public.reward_redemptions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own redemptions"
  on public.reward_redemptions for select to authenticated
  using (auth.uid() = user_id);

-- 4) Helper trigger to keep updated_at fresh on rewards_items
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger rewards_items_updated_at
before update on public.rewards_items
for each row execute function public.update_updated_at_column();

-- 5) Redeem function (transactional)
create or replace function public.redeem_reward(_reward_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  needed integer;
  stock_left integer;
  has_stock boolean := true;
  current_points integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select points_cost, coalesce(stock, -1) into needed, stock_left
  from public.rewards_items
  where id = _reward_id and is_active = true;

  if not found then
    raise exception 'Reward not found or inactive';
  end if;

  if stock_left = 0 then
    raise exception 'Out of stock';
  end if;

  select total_points into current_points
  from public.user_points
  where user_id = uid;

  if current_points is null then
    current_points := 0;
  end if;

  if current_points < needed then
    raise exception 'Insufficient points';
  end if;

  -- Deduct points (upsert if row exists)
  update public.user_points
    set total_points = total_points - needed, updated_at = now()
  where user_id = uid;

  if not found then
    -- Create points row then error for insufficient points (should not happen)
    insert into public.user_points(user_id, total_points) values (uid, 0);
    raise exception 'Insufficient points';
  end if;

  -- Create redemption record
  insert into public.reward_redemptions (user_id, reward_id, points_spent, status)
  values (uid, _reward_id, needed, 'pending');

  -- Decrease stock if controlled
  if stock_left > -1 then
    update public.rewards_items set stock = stock - 1 where id = _reward_id;
  end if;

  return 'ok';
end;
$$;