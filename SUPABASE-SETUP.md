# Setup Supabase untuk Lingkar

Panduan ini untuk kamu yang belum pernah pakai Supabase sama sekali. Semua bisa dilakukan lewat HP (browser Chrome).

## 1. Buat Akun & Project
1. Buka https://supabase.com lewat browser HP kamu, daftar/masuk (bisa pakai akun GitHub).
2. Klik **New Project**.
3. Isi nama project: `lingkar`, buat password database (simpan baik-baik), pilih region terdekat (contoh: Singapore).
4. Tunggu ± 2 menit sampai project selesai dibuat.

## 2. Ambil URL & Anon Key
1. Di dashboard project, buka **Project Settings** (ikon gerigi) > **API**.
2. Salin nilai **Project URL** dan **anon public** key.
3. Buka file `www/js/supabase.js` di Acode, ganti dua baris berikut:
   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```
   dengan nilai yang kamu salin tadi.

## 3. Buat Tabel Database
1. Di dashboard, buka menu **SQL Editor** > **New query**.
2. Salin-tempel seluruh kode SQL di bawah, lalu klik **Run**.

```sql
-- profiles
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  birth_date date,
  gender text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- circles
create table circles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  type text check (type in ('inner','close','community')) not null,
  invite_code text unique not null,
  owner_id uuid references auth.users not null,
  max_members int,
  is_public boolean default false,
  avatar_url text,
  created_at timestamptz default now()
);

-- circle_members
create table circle_members (
  id uuid default gen_random_uuid() primary key,
  circle_id uuid references circles on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text default 'member',
  status text default 'active',
  joined_at timestamptz default now(),
  unique(circle_id, user_id)
);

-- moments
create table moments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  media_url text not null,
  media_type text check (media_type in ('image','video')) not null,
  thumbnail_url text,
  caption text,
  created_at timestamptz default now()
);

-- moment_visibility
create table moment_visibility (
  id uuid default gen_random_uuid() primary key,
  moment_id uuid references moments on delete cascade,
  circle_id uuid references circles on delete cascade,
  unique(moment_id, circle_id)
);

-- comments
create table comments (
  id uuid default gen_random_uuid() primary key,
  moment_id uuid references moments on delete cascade,
  user_id uuid references auth.users on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- reactions
create table reactions (
  id uuid default gen_random_uuid() primary key,
  moment_id uuid references moments on delete cascade,
  user_id uuid references auth.users on delete cascade,
  emoji text default '❤️',
  created_at timestamptz default now(),
  unique(moment_id, user_id)
);

-- notifications
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- follows
create table follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users on delete cascade,
  following_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);
```

## 4. Aktifkan Row Level Security (RLS) — WAJIB
Tanpa ini, data semua orang bisa diakses siapa saja. Jalankan juga di SQL Editor:

```sql
alter table profiles enable row level security;
alter table circles enable row level security;
alter table circle_members enable row level security;
alter table moments enable row level security;
alter table moment_visibility enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table notifications enable row level security;
alter table follows enable row level security;

-- contoh policy dasar (silakan sesuaikan lebih ketat sesuai kebutuhan produksi)
create policy "profiles are viewable by everyone" on profiles for select using (true);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);
create policy "users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "circle members can view circles" on circles for select using (true);
create policy "authenticated users can create circles" on circles for insert with check (auth.uid() = owner_id);

create policy "members can view circle_members" on circle_members for select using (true);
create policy "users can join circles" on circle_members for insert with check (auth.uid() = user_id);
create policy "users can leave circles" on circle_members for delete using (auth.uid() = user_id);

create policy "users can view moments" on moments for select using (true);
create policy "users can create own moments" on moments for insert with check (auth.uid() = user_id);

create policy "visibility viewable" on moment_visibility for select using (true);
create policy "owner can set visibility" on moment_visibility for insert with check (
  exists (select 1 from moments where moments.id = moment_id and moments.user_id = auth.uid())
);

create policy "comments viewable" on comments for select using (true);
create policy "users can comment" on comments for insert with check (auth.uid() = user_id);

create policy "reactions viewable" on reactions for select using (true);
create policy "users can react" on reactions for insert with check (auth.uid() = user_id);
create policy "users can unreact" on reactions for delete using (auth.uid() = user_id);

create policy "users see own notifications" on notifications for select using (auth.uid() = user_id);
create policy "users can update own notifications" on notifications for update using (auth.uid() = user_id);

create policy "follows viewable" on follows for select using (true);
create policy "users can follow" on follows for insert with check (auth.uid() = follower_id);
create policy "users can unfollow" on follows for delete using (auth.uid() = follower_id);
```

## 5. Buat Storage Bucket untuk Media
1. Buka menu **Storage** > **New bucket**.
2. Nama bucket: `moments`, centang **Public bucket** (supaya foto/video bisa ditampilkan langsung).
3. Klik **Create bucket**.

## 6. Nonaktifkan Konfirmasi Email (opsional, untuk testing lebih cepat)
Di **Authentication** > **Providers** > **Email**, kamu bisa nonaktifkan "Confirm email" sementara supaya bisa langsung login setelah daftar, tanpa perlu cek email dulu. Aktifkan lagi sebelum rilis ke publik.

Selesai! Supabase kamu sudah siap dipakai oleh aplikasi Lingkar.
