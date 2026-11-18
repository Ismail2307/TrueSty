-- TrueSty Clean Production Schema
create extension if not exists "uuid-ossp";

create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null
);

create table if not exists services (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(12,2) not null
);

create table if not exists masters (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  specialty text not null,
  phone text not null,
  city text not null,
  rating numeric(3,2) default 5.00,
  completed_jobs integer default 0,
  verified boolean default true
);

create table if not exists master_services (
  id uuid default uuid_generate_v4() primary key,
  master_id uuid references masters(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  price numeric(12,2) not null
);

create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id text not null,
  master_id uuid references masters(id) on delete set null,
  service_name text not null,
  quoted_price numeric(12,2) not null,
  payment_status text check (payment_status in ('pending', 'paid', 'refunded')) default 'pending',
  booking_status text check (booking_status in ('requested', 'in_progress', 'completed', 'cancelled')) default 'requested',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Verified-Payer-Only Reviews
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade unique,
  master_id uuid references masters(id) on delete cascade,
  client_id text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_master_services_price on master_services(price);
create index if not exists idx_bookings_client on bookings(client_id);
