-- Stok produk adalah total dari seluruh varian. Ubah total secara atomik agar
-- trigger sinkronisasi varian tidak menimpa perubahan dari formulir produk.
create or replace function public.set_product_total_stock(
  p_product_id bigint,
  p_stock integer
)
returns table (product_id bigint, stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_other_stock integer;
begin
  if coalesce(public.current_user_role(), '') not in ('OWNER', 'ADMIN') then
    raise exception 'Anda tidak memiliki akses untuk mengubah stok';
  end if;
  if p_stock is null or p_stock < 0 then
    raise exception 'Stok tidak boleh negatif';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'Produk tidak ditemukan'; end if;

  select * into v_variant
  from public.product_variants
  where product_id = p_product_id
  order by (color = 'Default' and size = 'One Size') desc, id
  limit 1
  for update;
  if not found then raise exception 'Varian produk tidak ditemukan'; end if;

  select coalesce(sum(stock), 0) into v_other_stock
  from public.product_variants
  where product_id = p_product_id and id <> v_variant.id;
  if p_stock < v_other_stock then
    raise exception 'Stok total tidak boleh lebih kecil dari stok varian lainnya (%)', v_other_stock;
  end if;

  update public.product_variants
  set stock = p_stock - v_other_stock,
      updated_at = now()
  where id = v_variant.id;

  if p_stock <> v_product.stok then
    insert into public.stock_movements (product_id, product_variant_id, tipe, jumlah, keterangan)
    values (
      p_product_id,
      v_variant.id,
      case when p_stock > v_product.stok then 'MASUK' else 'KELUAR' end,
      abs(p_stock - v_product.stok),
      'Penyesuaian stok total produk'
    );
  end if;

  return query select p_product_id, p_stock;
end;
$$;

revoke all on function public.set_product_total_stock(bigint, integer) from public, anon;
grant execute on function public.set_product_total_stock(bigint, integer) to authenticated;

-- Retur menutup piutang transaksi. Riwayat pembayaran tetap tersimpan untuk audit,
-- tetapi transaksi tidak lagi masuk daftar lunas maupun belum lunas.
alter table public.transactions drop constraint if exists transactions_payment_status_check;
alter table public.transactions add constraint transactions_payment_status_check
  check (payment_status in ('LUNAS', 'BELUM_LUNAS', 'RETUR'));

update public.transactions transactions
set payment_status = 'RETUR'
where exists (
  select 1
  from public.transaction_returns returns
  join public.transaction_items items on items.id = returns.transaction_item_id
  where items.transaction_id = transactions.id
);

create or replace function public.complete_receivable(p_transaction_id bigint, p_amount numeric, p_payment_method text, p_notes text default null)
returns table (paid_amount numeric, remaining_amount numeric, payment_status text)
language plpgsql security definer set search_path = public as $$
declare v_transaction public.transactions%rowtype; v_remaining numeric(14,2); v_amount numeric(14,2); v_new_paid numeric(14,2);
begin
 select * into v_transaction from public.transactions where id=p_transaction_id for update;
 if not found then raise exception 'Transaksi tidak ditemukan'; end if;
 if v_transaction.cashier_id<>auth.uid() and coalesce(public.current_user_role() not in ('OWNER','ADMIN'),true) then raise exception 'Anda tidak memiliki akses'; end if;
 if v_transaction.payment_status = 'RETUR' then raise exception 'Transaksi yang diretur tidak dapat dilunasi'; end if;
 if v_transaction.payment_status='LUNAS' then raise exception 'Transaksi ini sudah lunas'; end if;
 if p_payment_method not in ('CASH','QRIS','TRANSFER') then raise exception 'Metode pembayaran tidak valid'; end if;
 v_remaining:=v_transaction.total-v_transaction.paid_amount; v_amount:=coalesce(p_amount,0);
 if v_amount<=0 or v_amount>v_remaining then raise exception 'Nominal pelunasan harus lebih dari 0 dan maksimal %',v_remaining; end if;
 v_new_paid:=v_transaction.paid_amount+v_amount;
 update public.transactions set paid_amount=v_new_paid,payment_status=case when v_new_paid>=total then 'LUNAS' else 'BELUM_LUNAS' end where id=p_transaction_id;
 insert into public.transaction_payments(transaction_id,amount,payment_method,notes,received_by) values(p_transaction_id,v_amount,p_payment_method,nullif(trim(p_notes),''),auth.uid());
 return query select v_new_paid,v_transaction.total-v_new_paid,case when v_new_paid>=v_transaction.total then 'LUNAS' else 'BELUM_LUNAS' end;
end;
$$;

create or replace function public.return_transaction_item(p_transaction_item_id bigint, p_quantity integer, p_refund_method text, p_reason text default null)
returns table (return_id bigint, refund_amount numeric, remaining_quantity integer)
language plpgsql security definer set search_path=public as $$
declare v_item public.transaction_items%rowtype; v_transaction public.transactions%rowtype; v_returned_quantity integer; v_refund_amount numeric(14,2); v_return_id bigint;
begin
 if p_quantity is null or p_quantity<=0 then raise exception 'Jumlah retur harus lebih dari 0'; end if;
 if p_refund_method not in ('CASH','QRIS','TRANSFER') then raise exception 'Metode pengembalian dana tidak valid'; end if;
 perform pg_advisory_xact_lock(p_transaction_item_id); select * into v_item from public.transaction_items where id=p_transaction_item_id for update;
 if not found then raise exception 'Item transaksi tidak ditemukan'; end if; select * into v_transaction from public.transactions where id=v_item.transaction_id for update;
 if v_transaction.cashier_id<>auth.uid() and coalesce(public.current_user_role() not in ('OWNER','ADMIN'),true) then raise exception 'Anda tidak memiliki akses untuk melakukan retur ini'; end if;
 if v_item.product_variant_id is null then raise exception 'Item transaksi lama tidak memiliki data varian dan tidak dapat diretur otomatis'; end if;
 select coalesce(sum(quantity),0) into v_returned_quantity from public.transaction_returns where transaction_item_id=v_item.id;
 if p_quantity>v_item.quantity-v_returned_quantity then raise exception 'Jumlah retur melebihi sisa item yang dapat diretur'; end if;
 v_refund_amount:=v_item.unit_price*p_quantity;
 insert into public.transaction_returns(transaction_item_id,quantity,refund_amount,refund_method,reason,returned_by) values(v_item.id,p_quantity,v_refund_amount,p_refund_method,nullif(trim(p_reason),''),auth.uid()) returning id into v_return_id;
 update public.product_variants set stock=stock+p_quantity where id=v_item.product_variant_id;
 update public.transactions set payment_status = 'RETUR' where id = v_transaction.id;
 insert into public.stock_movements(product_id,product_variant_id,tipe,jumlah,keterangan) values(v_item.product_id,v_item.product_variant_id,'RETUR',p_quantity,'Retur '||v_transaction.invoice_number||': '||coalesce(nullif(trim(p_reason),''),'tanpa catatan'));
 return query select v_return_id,v_refund_amount,v_item.quantity-v_returned_quantity-p_quantity;
end;
$$;

grant execute on function public.complete_receivable(bigint, numeric, text, text) to authenticated;
grant execute on function public.return_transaction_item(bigint, integer, text, text) to authenticated;
