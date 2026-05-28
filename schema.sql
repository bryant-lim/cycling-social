-- ==========================================
-- CYCLING HONESTY APP — DATABASE SCHEMA SEED
-- ==========================================

-- 1. Create Public Users Table (Linked to Auth.Users)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  username text unique not null,
  email text,
  is_admin boolean default false not null,
  trust_score int default 100 not null check (trust_score >= 0 and trust_score <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on users
alter table public.users enable row level security;

create policy "Users can view all user profiles"
  on public.users for select
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Trigger to automatically create a public.users row when a new auth.users signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, email, is_admin, trust_score)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    -- Make the first user or email matching 'admin' an admin by default
    case when new.email like '%admin%' or not exists (select 1 from public.users) then true else false end,
    100
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Create Rides Table
create table if not exists public.rides (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  ride_title text not null,
  intended_intensity text not null check (intended_intensity in ('chill', 'tempo', 'hard', 'race')),
  actual_intensity text check (actual_intensity in ('chill', 'spicy', 'attacked', 'lied')),
  notes text,
  summary text,
  is_coffee_assassin_candidate boolean default false,
  result_type text check (result_type in ('trustworthy', 'liar', 'zone2_criminal', 'assassin', 'chaos', 'sandbagger', 'neutral')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable RLS on rides
alter table public.rides enable row level security;

create policy "Rides are visible to everyone"
  on public.rides for select
  using (true);

create policy "Users can insert their own rides"
  on public.rides for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own rides"
  on public.rides for update
  using (auth.uid() = user_id);

create policy "Users can delete their own rides"
  on public.rides for delete
  using (auth.uid() = user_id);

-- 3. Create Badges Table
create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null
);

-- Enable RLS on badges
alter table public.badges enable row level security;

create policy "Badges are visible to everyone"
  on public.badges for select
  using (true);

-- 4. Create User Badges Table
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  badge_id text references public.badges not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- Enable RLS on user_badges
alter table public.user_badges enable row level security;

create policy "User badges are visible to everyone"
  on public.user_badges for select
  using (true);

create policy "Users can insert their own earned badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own earned badges"
  on public.user_badges for delete
  using (auth.uid() = user_id);

-- Seed Badges Table
insert into public.badges (id, name, description, icon) values
  ('trustworthy', 'Trustworthy Cyclist', 'Declared a chill ride and actually stayed chill.', '😌'),
  ('liar', 'Certified Liar', 'Declared a chill ride but went full gas.', '🤥'),
  ('zone2_criminal', 'Zone 2 Criminal', 'Claimed a recovery spin but suffered in Zone 5.', '🚓'),
  ('assassin', 'Coffee Ride Assassin', 'Claimed a coffee ride but did 100km+ or dropped everyone.', '🥷'),
  ('chaos', 'Chaos Rider', 'Kept everyone guessing with highly erratic ride intensities.', '🌀'),
  ('sandbagger', 'Sandbagger', 'Declared a hard ride or race simulation but took it easy.', '🎒')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;
