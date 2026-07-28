-- Multi-brand: existing records are preserved and assigned to MISS AISYAH.
create extension if not exists pgcrypto;
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  logo_url text, primary_color text not null default '#db2777', favicon_url text,
  whatsapp text, address text, information text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.brands (slug, name) values ('miss-aisyah', 'MISS AISYAH'), ('q-lambikoe', 'Q-LAMBIKOE') on conflict (slug) do nothing;

create table if not exists public.user_brand_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  primary key (user_id, brand_id)
);

-- All current users retain access to the legacy brand. Owners can access every brand via RLS.
insert into public.user_brand_access (user_id, brand_id)
select p.id, b.id from public.profiles p cross join public.brands b where b.slug = 'miss-aisyah'
on conflict do nothing;
insert into public.user_brand_access (user_id, brand_id)
select p.id, b.id from public.profiles p cross join public.brands b where p.role = 'OWNER'
on conflict do nothing;

do $$ declare t text; legacy_brand uuid := (select id from public.brands where slug = 'miss-aisyah'); begin
  foreach t in array array['products','categories','stock_movements','product_variants','transactions','transaction_items','transaction_payments','transaction_returns'] loop
    execute format('alter table public.%I add column if not exists brand_id uuid references public.brands(id)', t);
    execute format('update public.%I set brand_id = $1 where brand_id is null', t) using legacy_brand;
    execute format('alter table public.%I alter column brand_id set not null', t);
    execute format('create index if not exists %I on public.%I (brand_id)', t || '_brand_id_idx', t);
  end loop;
end $$;

-- Products/SKU and invoices only need to be unique inside a brand.
alter table public.products drop constraint if exists products_kode_key;
create unique index if not exists products_brand_kode_key on public.products (brand_id, kode);
alter table public.product_variants drop constraint if exists product_variants_sku_key;
create unique index if not exists product_variants_brand_sku_key on public.product_variants (brand_id, sku);
alter table public.transactions drop constraint if exists transactions_invoice_number_key;
create unique index if not exists transactions_brand_invoice_key on public.transactions (brand_id, invoice_number);

create or replace function public.can_access_brand(p_brand_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_brand_access where user_id = auth.uid() and brand_id = p_brand_id);
$$;
create or replace function public.assert_brand_access(p_brand_id uuid)
returns void language plpgsql security definer set search_path = public as $$ begin
  if p_brand_id is null or not public.can_access_brand(p_brand_id) then raise exception 'Anda tidak memiliki akses ke brand ini'; end if;
end $$;

alter table public.brands enable row level security;
alter table public.user_brand_access enable row level security;
drop policy if exists "Brand access" on public.brands;
create policy "Brand access" on public.brands for select to authenticated using (public.can_access_brand(id));
drop policy if exists "Owner manages brands" on public.brands;
create policy "Owner manages brands" on public.brands for update to authenticated using (public.current_user_role() = 'OWNER') with check (public.current_user_role() = 'OWNER');
drop policy if exists "Users read brand access" on public.user_brand_access;
create policy "Users read brand access" on public.user_brand_access for select to authenticated using (user_id = auth.uid() or public.current_user_role() = 'OWNER');

do $$ declare t text; p text; begin
  foreach t in array array['products','categories','stock_movements','product_variants','transactions','transaction_items','transaction_payments','transaction_returns'] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy if exists %I on public.%I', p, t); end loop;
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Brand isolation" on public.%I for all to authenticated using (public.can_access_brand(brand_id)) with check (public.can_access_brand(brand_id))', t);
  end loop;
end $$;

-- Derived records always inherit their parent's brand, preventing accidental mixing.
create or replace function public.inherit_brand_id() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_table_name = 'product_variants' then select brand_id into new.brand_id from public.products where id = new.product_id;
  elsif tg_table_name = 'transaction_items' then select brand_id into new.brand_id from public.transactions where id = new.transaction_id;
  elsif tg_table_name = 'transaction_payments' then select brand_id into new.brand_id from public.transactions where id = new.transaction_id;
  elsif tg_table_name = 'transaction_returns' then select brand_id into new.brand_id from public.transaction_items where id = new.transaction_item_id;
  elsif tg_table_name = 'stock_movements' then select brand_id into new.brand_id from public.products where id = new.product_id;
  end if; return new;
end $$;
do $$ declare t text; begin foreach t in array array['product_variants','transaction_items','transaction_payments','transaction_returns','stock_movements'] loop execute format('drop trigger if exists inherit_%I_brand on public.%I',t,t); execute format('create trigger inherit_%I_brand before insert or update on public.%I for each row execute procedure public.inherit_brand_id()',t,t); end loop; end $$;

-- Brand-aware RPCs validate both the selected brand and every referenced row.
create or replace function public.create_sale(p_brand_id uuid, p_items jsonb, p_payment_method text, p_paid_amount numeric, p_notes text default null, p_customer_name text default null, p_discount_amount numeric default 0, p_discount_reason text default null)
returns table (transaction_id bigint, invoice_number text, total numeric, change_amount numeric) language plpgsql security definer set search_path=public as $$
declare i jsonb; v public.product_variants%rowtype; p public.products%rowtype; vid bigint; qty int; sub numeric:=0; disc numeric; tot numeric; paid numeric; ch numeric; tx bigint; inv text;
begin
 perform public.assert_brand_access(p_brand_id); if coalesce(public.current_user_role() not in ('OWNER','ADMIN','KASIR'),true) then raise exception 'Anda tidak memiliki akses'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Keranjang tidak boleh kosong'; end if;
 if p_payment_method not in ('CASH','QRIS','TRANSFER','PIUTANG') then raise exception 'Metode pembayaran tidak valid'; end if;
 for i in select value from jsonb_array_elements(p_items) loop vid:=(i->>'variant_id')::bigint; qty:=(i->>'quantity')::int; select * into v from public.product_variants where id=vid and brand_id=p_brand_id for update; if not found or qty is null or qty<=0 or v.stock<qty then raise exception 'Item atau stok tidak valid'; end if; sub:=sub+v.price*qty; end loop;
 disc:=greatest(coalesce(p_discount_amount,0),0); if disc>sub then raise exception 'Diskon melebihi subtotal'; end if; tot:=sub-disc; paid:=greatest(coalesce(p_paid_amount,0),0); if p_payment_method<>'PIUTANG' and paid<tot then raise exception 'Nominal pembayaran kurang'; end if;
 ch:=case when p_payment_method='PIUTANG' then 0 else paid-tot end; inv:='TRX-'||to_char(now(),'YYYYMMDD')||'-'||lpad(nextval('public.transaction_invoice_seq')::text,6,'0');
 insert into public.transactions(brand_id,invoice_number,subtotal,total,discount_amount,discount_reason,paid_amount,change_amount,payment_method,payment_status,customer_name,notes,cashier_id) values(p_brand_id,inv,sub,tot,disc,nullif(trim(p_discount_reason),''),paid,ch,p_payment_method,case when paid>=tot then 'LUNAS' else 'BELUM_LUNAS' end,nullif(trim(p_customer_name),''),nullif(trim(p_notes),''),auth.uid()) returning id into tx;
 if paid>0 then insert into public.transaction_payments(brand_id,transaction_id,amount,payment_method,notes,received_by) values(p_brand_id,tx,paid,case when p_payment_method='PIUTANG' then 'CASH' else p_payment_method end,'Pembayaran awal',auth.uid()); end if;
 for i in select value from jsonb_array_elements(p_items) loop vid:=(i->>'variant_id')::bigint; qty:=(i->>'quantity')::int; select * into v from public.product_variants where id=vid; select * into p from public.products where id=v.product_id; insert into public.transaction_items(brand_id,transaction_id,product_id,product_variant_id,product_name,variant_name,quantity,unit_price,subtotal) values(p_brand_id,tx,p.id,vid,p.nama,concat(v.color,' / ',v.size),qty,v.price,v.price*qty); update public.product_variants set stock=stock-qty where id=vid; insert into public.stock_movements(brand_id,product_id,product_variant_id,tipe,jumlah,keterangan) values(p_brand_id,p.id,vid,'KELUAR',qty,'Penjualan '||inv); end loop;
 return query select tx,inv,tot,ch;
end $$;

create or replace function public.get_top_selling_products(p_brand_id uuid, p_start timestamptz default null, p_limit integer default 5) returns table(product_id bigint,product_name text,total_quantity bigint,total_revenue numeric) language sql stable security invoker set search_path=public as $$ select i.product_id,max(i.product_name)::text,sum(i.quantity)::bigint,sum(i.subtotal)::numeric from public.transaction_items i join public.transactions t on t.id=i.transaction_id where t.brand_id=p_brand_id and (p_start is null or t.created_at>=p_start) group by i.product_id order by total_quantity desc,total_revenue desc limit greatest(1,least(coalesce(p_limit,5),20)) $$;

revoke all on function public.create_sale(jsonb,text,numeric,text,text,numeric,text) from authenticated;
grant execute on function public.create_sale(uuid,jsonb,text,numeric,text,text,numeric,text) to authenticated;
grant execute on function public.get_top_selling_products(uuid,timestamptz,integer) to authenticated;
