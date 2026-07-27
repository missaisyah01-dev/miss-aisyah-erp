-- Menjadikan TRANSFER sebagai nilai metode pembayaran resmi dan mengonversi data historis.
-- Migration ini diperlukan untuk database yang telah menjalankan migration sebelumnya.
alter table public.transactions drop constraint if exists transactions_payment_method_check;
alter table public.transaction_payments drop constraint if exists transaction_payments_payment_method_check;
alter table public.transaction_returns drop constraint if exists transaction_returns_refund_method_check;

update public.transactions set payment_method = 'TRANSFER' where payment_method = 'DEBIT';
update public.transaction_payments set payment_method = 'TRANSFER' where payment_method = 'DEBIT';
update public.transaction_returns set refund_method = 'TRANSFER' where refund_method = 'DEBIT';

alter table public.transactions add constraint transactions_payment_method_check
  check (payment_method in ('CASH', 'QRIS', 'TRANSFER', 'PIUTANG'));
alter table public.transaction_payments add constraint transaction_payments_payment_method_check
  check (payment_method in ('CASH', 'QRIS', 'TRANSFER'));
alter table public.transaction_returns add constraint transaction_returns_refund_method_check
  check (refund_method in ('CASH', 'QRIS', 'TRANSFER'));

create or replace function public.create_sale(p_items jsonb, p_payment_method text, p_paid_amount numeric, p_notes text default null, p_customer_name text default null, p_discount_amount numeric default 0, p_discount_reason text default null)
returns table (transaction_id bigint, invoice_number text, total numeric, change_amount numeric)
language plpgsql security definer set search_path=public as $$
declare v_item jsonb; v_variant public.product_variants%rowtype; v_product public.products%rowtype; v_id bigint; v_qty int; v_subtotal numeric:=0; v_discount numeric; v_total numeric; v_paid numeric; v_change numeric; v_tx bigint; v_invoice text;
begin
 if coalesce(public.current_user_role() not in ('OWNER','ADMIN','KASIR'),true) then raise exception 'Anda tidak memiliki akses'; end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'Keranjang tidak boleh kosong'; end if;
 if p_payment_method not in ('CASH','QRIS','TRANSFER','PIUTANG') then raise exception 'Metode pembayaran tidak valid'; end if; if p_payment_method='PIUTANG' and nullif(trim(coalesce(p_customer_name,'')),'') is null then raise exception 'Nama pelanggan wajib untuk piutang'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop v_id:=(v_item->>'variant_id')::bigint; v_qty:=(v_item->>'quantity')::int; select * into v_variant from public.product_variants where id=v_id for update; if not found or v_qty is null or v_qty<=0 or v_variant.stock<v_qty then raise exception 'Item atau stok tidak valid'; end if; v_subtotal:=v_subtotal+v_variant.price*v_qty; end loop;
 v_discount:=greatest(coalesce(p_discount_amount,0),0); if v_discount>v_subtotal then raise exception 'Diskon melebihi subtotal'; end if; v_total:=v_subtotal-v_discount; v_paid:=greatest(coalesce(p_paid_amount,0),0); if p_payment_method<>'PIUTANG' and v_paid<v_total then raise exception 'Nominal pembayaran kurang'; end if; v_change:=case when p_payment_method='PIUTANG' then 0 else v_paid-v_total end; v_invoice:='TRX-'||to_char(now(),'YYYYMMDD')||'-'||lpad(nextval('public.transaction_invoice_seq')::text,6,'0');
 insert into public.transactions(invoice_number,subtotal,total,discount_amount,discount_reason,paid_amount,change_amount,payment_method,payment_status,customer_name,notes,cashier_id) values(v_invoice,v_subtotal,v_total,v_discount,nullif(trim(p_discount_reason),''),v_paid,v_change,p_payment_method,case when v_paid>=v_total then 'LUNAS' else 'BELUM_LUNAS' end,nullif(trim(p_customer_name),''),nullif(trim(p_notes),''),auth.uid()) returning id into v_tx; if v_paid>0 then insert into public.transaction_payments(transaction_id,amount,payment_method,notes,received_by) values(v_tx,v_paid,case when p_payment_method='PIUTANG' then 'CASH' else p_payment_method end,'Pembayaran awal',auth.uid()); end if;
 for v_item in select value from jsonb_array_elements(p_items) loop v_id:=(v_item->>'variant_id')::bigint; v_qty:=(v_item->>'quantity')::int; select * into v_variant from public.product_variants where id=v_id; select * into v_product from public.products where id=v_variant.product_id; insert into public.transaction_items(transaction_id,product_id,product_variant_id,product_name,variant_name,quantity,unit_price,subtotal) values(v_tx,v_product.id,v_id,v_product.nama,concat(v_variant.color,' / ',v_variant.size),v_qty,v_variant.price,v_variant.price*v_qty); update public.product_variants set stock=stock-v_qty where id=v_id; insert into public.stock_movements(product_id,product_variant_id,tipe,jumlah,keterangan) values(v_product.id,v_id,'KELUAR',v_qty,'Penjualan '||v_invoice); end loop;
 return query select v_tx,v_invoice,v_total,v_change;
end; $$;

create or replace function public.complete_receivable(p_transaction_id bigint, p_amount numeric, p_payment_method text, p_notes text default null)
returns table (paid_amount numeric, remaining_amount numeric, payment_status text)
language plpgsql security definer set search_path=public as $$
declare v_transaction public.transactions%rowtype; v_remaining numeric(14,2); v_amount numeric(14,2); v_new_paid numeric(14,2);
begin
 select * into v_transaction from public.transactions where id=p_transaction_id for update;
 if not found then raise exception 'Transaksi tidak ditemukan'; end if;
 if v_transaction.cashier_id<>auth.uid() and coalesce(public.current_user_role() not in ('OWNER','ADMIN'),true) then raise exception 'Anda tidak memiliki akses'; end if;
 if v_transaction.payment_status='LUNAS' then raise exception 'Transaksi ini sudah lunas'; end if;
 if p_payment_method not in ('CASH','QRIS','TRANSFER') then raise exception 'Metode pembayaran tidak valid'; end if;
 v_remaining:=v_transaction.total-v_transaction.paid_amount; v_amount:=coalesce(p_amount,0);
 if v_amount<=0 or v_amount>v_remaining then raise exception 'Nominal pelunasan harus lebih dari 0 dan maksimal %',v_remaining; end if;
 v_new_paid:=v_transaction.paid_amount+v_amount;
 update public.transactions set paid_amount=v_new_paid,payment_status=case when v_new_paid>=total then 'LUNAS' else 'BELUM_LUNAS' end where id=p_transaction_id;
 insert into public.transaction_payments(transaction_id,amount,payment_method,notes,received_by) values(p_transaction_id,v_amount,p_payment_method,nullif(trim(p_notes),''),auth.uid());
 return query select v_new_paid,v_transaction.total-v_new_paid,case when v_new_paid>=v_transaction.total then 'LUNAS' else 'BELUM_LUNAS' end;
end; $$;

create or replace function public.return_transaction_item(p_transaction_item_id bigint, p_quantity integer, p_refund_method text, p_reason text default null)
returns table (return_id bigint, refund_amount numeric, remaining_quantity integer)
language plpgsql security definer set search_path=public as $$
declare v_item public.transaction_items%rowtype; v_transaction public.transactions%rowtype; v_returned_quantity integer; v_refund_amount numeric(14,2); v_return_id bigint;
begin
 if p_quantity is null or p_quantity<=0 then raise exception 'Jumlah retur harus lebih dari 0'; end if;
 if p_refund_method not in ('CASH','QRIS','TRANSFER') then raise exception 'Metode pengembalian dana tidak valid'; end if;
 perform pg_advisory_xact_lock(p_transaction_item_id); select * into v_item from public.transaction_items where id=p_transaction_item_id for update;
 if not found then raise exception 'Item transaksi tidak ditemukan'; end if; select * into v_transaction from public.transactions where id=v_item.transaction_id;
 if v_transaction.cashier_id<>auth.uid() and coalesce(public.current_user_role() not in ('OWNER','ADMIN'),true) then raise exception 'Anda tidak memiliki akses untuk melakukan retur ini'; end if;
 if v_item.product_variant_id is null then raise exception 'Item transaksi lama tidak memiliki data varian dan tidak dapat diretur otomatis'; end if;
 select coalesce(sum(quantity),0) into v_returned_quantity from public.transaction_returns where transaction_item_id=v_item.id;
 if p_quantity>v_item.quantity-v_returned_quantity then raise exception 'Jumlah retur melebihi sisa item yang dapat diretur'; end if;
 v_refund_amount:=v_item.unit_price*p_quantity;
 insert into public.transaction_returns(transaction_item_id,quantity,refund_amount,refund_method,reason,returned_by) values(v_item.id,p_quantity,v_refund_amount,p_refund_method,nullif(trim(p_reason),''),auth.uid()) returning id into v_return_id;
 update public.product_variants set stock=stock+p_quantity where id=v_item.product_variant_id;
 insert into public.stock_movements(product_id,product_variant_id,tipe,jumlah,keterangan) values(v_item.product_id,v_item.product_variant_id,'RETUR',p_quantity,'Retur '||v_transaction.invoice_number||': '||coalesce(nullif(trim(p_reason),''),'tanpa catatan'));
 return query select v_return_id,v_refund_amount,v_item.quantity-v_returned_quantity-p_quantity;
end; $$;

revoke all on function public.create_sale(jsonb,text,numeric,text,text,numeric,text) from public,anon;
grant execute on function public.create_sale(jsonb,text,numeric,text,text,numeric,text) to authenticated;
grant execute on function public.complete_receivable(bigint,numeric,text,text) to authenticated;
grant execute on function public.return_transaction_item(bigint,integer,text,text) to authenticated;
