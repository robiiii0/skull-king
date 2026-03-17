-- Run this in your Supabase SQL editor

-- Players profile table (linked to auth.users)
create table public.players (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  elo integer not null default 1000,
  games_played integer not null default 0,
  games_won integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.players enable row level security;

-- Anyone can read player profiles
create policy "Players are viewable by everyone"
  on public.players for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.players for update
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.players for insert
  with check (auth.uid() = id);

-- Matches history
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  room_code text not null,
  played_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "Matches are viewable by everyone"
  on public.matches for select
  using (true);

create policy "Authenticated users can insert matches"
  on public.matches for insert
  with check (auth.role() = 'authenticated');

-- Match results per player
create table public.match_players (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches on delete cascade not null,
  player_id uuid references public.players on delete cascade not null,
  position integer not null,
  score integer not null,
  elo_before integer not null,
  elo_after integer not null,
  elo_change integer not null
);

alter table public.match_players enable row level security;

create policy "Match results are viewable by everyone"
  on public.match_players for select
  using (true);

create policy "Authenticated users can insert match results"
  on public.match_players for insert
  with check (auth.role() = 'authenticated');

-- Leaderboard view
create or replace view public.leaderboard as
  select
    id,
    username,
    avatar_url,
    elo,
    games_played,
    games_won,
    created_at
  from public.players
  order by elo desc;

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Storage policies
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
