-- SeePay initial schema. All monetary columns are GH₵ with 2 decimals; APIs use pesewas.
create extension if not exists pgcrypto;

do $$ begin create type public.user_role as enum ('vendor','agent','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.momo_network as enum ('MTN','VODAFONE','AIRTELTIGO'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('PENDING','SUCCESS','FAILED','ABANDONED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payout_status as enum ('PENDING','PAID','REJECTED'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text not null unique check (phone ~ '^0[0-9]{9}$'),
  contact_email text,
  created_at timestamptz not null default now()
);
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  referral_code text not null unique check (referral_code ~ '^[A-Z0-9]{5,12}$'),
  momo_number text not null check (momo_number ~ '^0[0-9]{9}$'),
  momo_network public.momo_network not null,
  created_at timestamptz not null default now()
);
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 60),
  slug text not null unique check (
    slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
    and slug <> all (array['www','app','api','admin','agent','register','login','dashboard','store','support','help','mail','seepay','terms','privacy'])),
  category text,
  about text check (char_length(about) <= 300),
  address text,
  logo_path text,
  banner_path text,
  whatsapp_number text not null check (whatsapp_number ~ '^0[0-9]{9}$'),
  momo_number text not null check (momo_number ~ '^0[0-9]{9}$'),
  momo_network public.momo_network not null,
  paystack_subaccount_code text unique,
  agent_id uuid references public.agents(id) on delete set null,
  is_active boolean not null default false,
  accepting_orders boolean not null default true,
  activation_reference text unique,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 200),
  category text,
  price numeric(10,2) not null check (price >= 0.50 and price <= 50000),
  image_path text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists products_updated on public.products;
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  reference text not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 60),
  customer_phone text not null check (customer_phone ~ '^0[0-9]{9}$'),
  fulfilment text not null default 'DELIVERY' check (fulfilment in ('DELIVERY','PICKUP')),
  delivery_address text,
  note text check (char_length(note) <= 200),
  subtotal numeric(10,2) not null check (subtotal >= 1),
  total_amount numeric(10,2) not null check (total_amount >= 1),
  platform_fee numeric(10,2) not null default 0.20 check (platform_fee >= 0),
  paystack_fee numeric(10,2),
  vendor_amount numeric(10,2),
  payment_status public.payment_status not null default 'PENDING',
  pay_network public.momo_network,
  fulfilment_status text not null default 'NEW' check (fulfilment_status in ('NEW','PREPARING','READY','COMPLETED','CANCELLED')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.orders replica identity full;
create index if not exists orders_vendor_created_idx on public.orders (vendor_id, created_at desc);
create index if not exists orders_vendor_status_idx on public.orders (vendor_id, payment_status);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_snapshot text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity between 1 and 20),
  line_total numeric(10,2) not null check (line_total >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  vendor_id uuid not null unique references public.vendors(id) on delete cascade,
  amount numeric(10,2) not null default 50.00 check (amount > 0),
  created_at timestamptz not null default now()
);
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 50),
  momo_number text not null check (momo_number ~ '^0[0-9]{9}$'),
  momo_network public.momo_network not null,
  status public.payout_status not null default 'PENDING',
  momo_reference text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id),
  rejection_reason text check (char_length(rejection_reason) <= 300)
);
create table if not exists public.webhook_events (
  event_key text primary key,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
create table if not exists public.sms_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  recipient text not null,
  message text not null,
  ok boolean not null,
  provider_response jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 1 check (hits > 0),
  primary key (key, window_start)
);
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null references public.profiles(id),
  action text not null check (char_length(action) between 2 and 80),
  target text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.agent_balances with (security_invoker = true) as
select a.id as agent_id,
  coalesce((select sum(c.amount) from public.commissions c where c.agent_id = a.id),0)
  - coalesce((select sum(p.amount) from public.payouts p where p.agent_id = a.id and p.status in ('PENDING','PAID')),0) as available,
  coalesce((select sum(c.amount) from public.commissions c where c.agent_id = a.id),0) as total_earned
from public.agents a;

-- Privileged functions are callable only through the service role.
create or replace function public.activate_vendor(p_vendor uuid, p_reference text, p_amount_pesewas int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_agent uuid; v_active boolean; v_reference text;
begin
  if p_amount_pesewas < 15000 then return false; end if;
  select agent_id,is_active,activation_reference into v_agent,v_active,v_reference
  from public.vendors where id=p_vendor for update;
  if not found or v_active then return false; end if;
  if v_reference is not null and v_reference <> p_reference then return false; end if;
  update public.vendors set is_active=true,activated_at=now(),activation_reference=p_reference where id=p_vendor;
  if v_agent is not null then
    insert into public.commissions(agent_id,vendor_id,amount) values(v_agent,p_vendor,50.00)
    on conflict (vendor_id) do nothing;
  end if;
  return true;
end; $$;
revoke all on function public.activate_vendor(uuid,text,int) from public, anon, authenticated;
grant execute on function public.activate_vendor(uuid,text,int) to service_role;

create or replace function public.mark_order_paid(p_reference text, p_amount_pesewas int, p_fees_pesewas int, p_network text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_order public.orders%rowtype; v_network public.momo_network; v_id uuid; v_fee numeric(10,2);
begin
  if p_amount_pesewas < 0 or p_fees_pesewas < 0 then return null; end if;
  select * into v_order from public.orders where reference=p_reference for update;
  if not found or v_order.payment_status='SUCCESS' then return null; end if;
  if round(v_order.total_amount*100)::int <> p_amount_pesewas then return null; end if;
  v_network := case lower(coalesce(p_network,'')) when 'mtn' then 'MTN'::public.momo_network when 'vod' then 'VODAFONE'::public.momo_network when 'atl' then 'AIRTELTIGO'::public.momo_network else null end;
  v_fee := round(p_fees_pesewas::numeric / 100, 2);
  update public.orders set payment_status='SUCCESS',paid_at=now(),paystack_fee=v_fee,
    vendor_amount=round(total_amount-platform_fee-v_fee,2),pay_network=coalesce(v_network,pay_network)
  where id=v_order.id returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.mark_order_paid(text,int,int,text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text,int,int,text) to service_role;

create or replace function public.request_payout(p_agent uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_earned numeric(10,2); v_committed numeric(10,2); v_available numeric(10,2); v_number text; v_network public.momo_network; v_id uuid;
begin
  perform 1 from public.agents where id=p_agent for update;
  if not found then raise exception 'Agent not found'; end if;
  select coalesce(sum(amount),0) into v_earned from public.commissions where agent_id=p_agent;
  select coalesce(sum(amount),0) into v_committed from public.payouts where agent_id=p_agent and status in ('PENDING','PAID');
  v_available := round(v_earned-v_committed,2);
  if v_available < 50 then raise exception 'Available balance must be at least GH₵ 50'; end if;
  select momo_number,momo_network into v_number,v_network from public.agents where id=p_agent;
  insert into public.payouts(agent_id,amount,momo_number,momo_network,status)
  values(p_agent,v_available,v_number,v_network,'PENDING') returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.request_payout(uuid) from public, anon, authenticated;
grant execute on function public.request_payout(uuid) to service_role;

create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_start timestamptz; v_hits int;
begin
  if p_max < 1 or p_window_seconds < 1 or length(p_key)>200 then return false; end if;
  v_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits(key,window_start,hits) values(p_key,v_start,1)
  on conflict (key,window_start) do update set hits=public.rate_limits.hits+1 returning hits into v_hits;
  return v_hits <= p_max;
end; $$;
revoke all on function public.check_rate_limit(text,int,int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text,int,int) to service_role;

create or replace function public.public_storefront(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when v.id is null then null else jsonb_build_object(
    'business_name',v.business_name,'slug',v.slug,'about',v.about,'address',v.address,'category',v.category,
    'banner_path',v.banner_path,'logo_path',v.logo_path,'whatsapp_number',v.whatsapp_number,
    'is_active',v.is_active,'accepting_orders',v.accepting_orders,
    'products',case when v.is_active then coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'description',p.description,'category',p.category,'price',p.price,'image_path',p.image_path,'is_available',p.is_available,'sort_order',p.sort_order) order by p.sort_order,p.created_at) from public.products p where p.vendor_id=v.id and p.is_available=true),'[]'::jsonb) else '[]'::jsonb end
  ) end from (select * from public.vendors where slug=p_slug limit 1) v;
$$;
revoke all on function public.public_storefront(text) from public;
grant execute on function public.public_storefront(text) to anon, authenticated;

-- Row-level security and deny-by-default table privileges.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.agents, public.vendors, public.products, public.orders, public.order_items, public.commissions, public.payouts, public.agent_balances to authenticated;
grant update (full_name, contact_email) on public.profiles to authenticated;
grant update (business_name,category,about,address,logo_path,banner_path,whatsapp_number,accepting_orders) on public.vendors to authenticated;
grant insert,update,delete on public.products to authenticated;
grant update (fulfilment_status) on public.orders to authenticated;

do $$ declare t text; begin
  foreach t in array array['profiles','agents','vendors','products','orders','order_items','commissions','payouts','webhook_events','sms_log','rate_limits','admin_audit'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

create policy profiles_select_own on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy agents_select_own on public.agents for select to authenticated using (profile_id=(select auth.uid()));
create policy vendors_select_own on public.vendors for select to authenticated using (owner_id=(select auth.uid()));
create policy vendors_update_own on public.vendors for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy products_select_own_active on public.products for select to authenticated using (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid()) and v.is_active));
create policy products_insert_own_active on public.products for insert to authenticated with check (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid()) and v.is_active));
create policy products_update_own_active on public.products for update to authenticated using (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid()) and v.is_active)) with check (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid()) and v.is_active));
create policy products_delete_own_active on public.products for delete to authenticated using (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid()) and v.is_active));
create policy orders_select_own_vendor on public.orders for select to authenticated using (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
create policy orders_update_own_fulfilment on public.orders for update to authenticated using (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid()))) with check (exists(select 1 from public.vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
create policy order_items_select_own_vendor on public.order_items for select to authenticated using (exists(select 1 from public.orders o join public.vendors v on v.id=o.vendor_id where o.id=order_id and v.owner_id=(select auth.uid())));
create policy commissions_select_own_agent on public.commissions for select to authenticated using (exists(select 1 from public.agents a where a.id=agent_id and a.profile_id=(select auth.uid())));
create policy payouts_select_own_agent on public.payouts for select to authenticated using (exists(select 1 from public.agents a where a.id=agent_id and a.profile_id=(select auth.uid())));
-- The agent_balances view is security_invoker; its source table policies limit rows to the session owner.

-- No client policies are granted on webhook, SMS, rate-limit or admin-audit records.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('shop-media','shop-media',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy shop_media_read_public on storage.objects for select to public using (bucket_id='shop-media');
create policy shop_media_insert_own on storage.objects for insert to authenticated with check (
 bucket_id='shop-media' and (storage.foldername(name))[1]=(select v.id::text from public.vendors v where v.owner_id=(select auth.uid()) limit 1)
);
create policy shop_media_update_own on storage.objects for update to authenticated using (
 bucket_id='shop-media' and (storage.foldername(name))[1]=(select v.id::text from public.vendors v where v.owner_id=(select auth.uid()) limit 1)
) with check (
 bucket_id='shop-media' and (storage.foldername(name))[1]=(select v.id::text from public.vendors v where v.owner_id=(select auth.uid()) limit 1)
);
create policy shop_media_delete_own on storage.objects for delete to authenticated using (
 bucket_id='shop-media' and (storage.foldername(name))[1]=(select v.id::text from public.vendors v where v.owner_id=(select auth.uid()) limit 1)
);

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- Deliberately do not insert sample vendors, users, products or orders.
