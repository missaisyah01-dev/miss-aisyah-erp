-- SPRINT 3: Auth, role user, dan RLS MISS AISYAH.
-- Jalankan sekali di Supabase SQL Editor setelah migration POS sebelumnya.

do $$ begin
  create type public.app_role as enum ('OWNER', 'ADMIN', 'KASIR');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'KASIR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions add column if not exists cashier_id uuid references auth.users(id) on delete set null;
create index if not exists transactions_cashier_id_idx on public.transactions (cashier_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Mengisi profil untuk akun Auth yang mungkin sudah dibuat sebelum migration ini.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', email)
from auth.users
on conflict (id) do nothing;

-- Membaca role dengan aman dari policy maupun fungsi database.
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid();
$$;

-- Bersihkan policy lama agar akses anonymous dari versi awal aplikasi tidak tertinggal.
do $$
declare
  target_table text;
  target_policy text;
begin
  foreach target_table in array array['profiles', 'products', 'categories', 'stock_movements', 'transactions', 'transaction_items']
  loop
    for target_policy in select policyname from pg_policies where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', target_policy, target_table);
    end loop;
    execute format('alter table public.%I enable row level security', target_table);
  end loop;
end;
$$;

create policy "Users read their profile" on public.profiles
for select to authenticated using (id = auth.uid());
create policy "Owner reads all profiles" on public.profiles
for select to authenticated using (public.current_user_role() = 'OWNER');
create policy "Owner manages profiles" on public.profiles
for update to authenticated using (public.current_user_role() = 'OWNER') with check (public.current_user_role() = 'OWNER');

create policy "Authenticated read products" on public.products
for select to authenticated using (true);
create policy "Owner admin manage products" on public.products
for all to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN')) with check (public.current_user_role() in ('OWNER', 'ADMIN'));

create policy "Authenticated read categories" on public.categories
for select to authenticated using (true);
create policy "Owner admin manage categories" on public.categories
for all to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN')) with check (public.current_user_role() in ('OWNER', 'ADMIN'));

create policy "Owner admin manage stock movements" on public.stock_movements
for all to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN')) with check (public.current_user_role() in ('OWNER', 'ADMIN'));

create policy "Owner admin read all transactions" on public.transactions
for select to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN'));
create policy "Cashier reads own transactions" on public.transactions
for select to authenticated using (cashier_id = auth.uid());
create policy "Owner admin read all transaction items" on public.transaction_items
for select to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN'));
create policy "Cashier reads own transaction items" on public.transaction_items
for select to authenticated using (exists (
  select 1 from public.transactions
  where transactions.id = transaction_items.transaction_id
    and transactions.cashier_id = auth.uid()
));

-- POS harus lewat fungsi atomik, bukan insert langsung ke tabel.
create or replace function public.create_sale(p_items jsonb, p_payment_method text, p_paid_amount numeric, p_notes text default null)
returns table (transaction_id bigint, invoice_number text, total numeric, change_amount numeric)
language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb; v_product public.products%rowtype; v_product_id bigint; v_quantity integer;
  v_subtotal numeric(14, 2) := 0; v_total numeric(14, 2); v_paid_amount numeric(14, 2);
  v_change_amount numeric(14, 2); v_transaction_id bigint; v_invoice_number text;
begin
  if coalesce(public.current_user_role() not in ('OWNER', 'ADMIN', 'KASIR'), true) then
    raise exception 'Anda tidak memiliki akses untuk membuat transaksi';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Keranjang tidak boleh kosong'; end if;
  if p_payment_method not in ('CASH', 'QRIS', 'DEBIT') then raise exception 'Metode pembayaran tidak valid'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item ->> 'product_id')::bigint; v_quantity := (v_item ->> 'quantity')::integer;
    if v_product_id is null or v_quantity is null or v_quantity <= 0 then raise exception 'Item transaksi tidak valid'; end if;
    select * into v_product from public.products where id = v_product_id for update;
    if not found then raise exception 'Produk dengan ID % tidak ditemukan', v_product_id; end if;
    if v_product.stok < v_quantity then raise exception 'Stok % tidak mencukupi', v_product.nama; end if;
    v_subtotal := v_subtotal + (v_product.harga * v_quantity);
  end loop;
  v_total := v_subtotal; v_paid_amount := coalesce(p_paid_amount, v_total);
  if v_paid_amount < v_total then raise exception 'Nominal pembayaran kurang'; end if;
  v_change_amount := v_paid_amount - v_total;
  v_invoice_number := 'TRX-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.transaction_invoice_seq')::text, 6, '0');
  insert into public.transactions (invoice_number, subtotal, total, paid_amount, change_amount, payment_method, notes, cashier_id)
  values (v_invoice_number, v_subtotal, v_total, v_paid_amount, v_change_amount, p_payment_method, nullif(trim(p_notes), ''), auth.uid()) returning id into v_transaction_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item ->> 'product_id')::bigint; v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product from public.products where id = v_product_id;
    insert into public.transaction_items (transaction_id, product_id, product_name, quantity, unit_price, subtotal)
    values (v_transaction_id, v_product.id, v_product.nama, v_quantity, v_product.harga, v_product.harga * v_quantity);
    update public.products set stok = stok - v_quantity where id = v_product.id;
    insert into public.stock_movements (product_id, tipe, jumlah, keterangan)
    values (v_product.id, 'KELUAR', v_quantity, 'Penjualan ' || v_invoice_number);
  end loop;
  return query select v_transaction_id, v_invoice_number, v_total, v_change_amount;
end;
$$;

revoke all on function public.create_sale(jsonb, text, numeric, text) from public, anon;
grant execute on function public.create_sale(jsonb, text, numeric, text) to authenticated;
revoke all on function public.get_top_selling_products(timestamptz, integer) from public, anon;
grant execute on function public.get_top_selling_products(timestamptz, integer) to authenticated;
