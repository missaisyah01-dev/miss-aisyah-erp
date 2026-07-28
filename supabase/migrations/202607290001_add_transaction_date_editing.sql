-- Allows a sale date to be selected at checkout and corrected later without
-- changing transaction totals, items, payments, or inventory.
create or replace function public.create_sale(
  p_brand_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_paid_amount numeric,
  p_notes text,
  p_customer_name text,
  p_discount_amount numeric,
  p_discount_reason text,
  p_created_at timestamptz
)
returns table (transaction_id bigint, invoice_number text, total numeric, change_amount numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_sale record;
begin
  select * into v_sale
  from public.create_sale(
    p_brand_id, p_items, p_payment_method, p_paid_amount, p_notes,
    p_customer_name, p_discount_amount, p_discount_reason
  );

  if p_created_at is not null then
    update public.transactions
    set created_at = p_created_at
    where id = v_sale.transaction_id and brand_id = p_brand_id;
  end if;

  return query select v_sale.transaction_id, v_sale.invoice_number, v_sale.total, v_sale.change_amount;
end;
$$;

create or replace function public.update_transaction_date(
  p_brand_id uuid,
  p_transaction_id bigint,
  p_created_at timestamptz
)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_brand_access(p_brand_id);
  if coalesce(public.current_user_role(), '') not in ('OWNER', 'ADMIN') then
    raise exception 'Anda tidak memiliki akses untuk mengubah tanggal transaksi';
  end if;
  if p_created_at is null then
    raise exception 'Tanggal transaksi wajib diisi';
  end if;

  update public.transactions
  set created_at = p_created_at
  where id = p_transaction_id and brand_id = p_brand_id;

  if not found then
    raise exception 'Transaksi tidak ditemukan untuk brand aktif';
  end if;
end;
$$;

grant execute on function public.create_sale(uuid, jsonb, text, numeric, text, text, numeric, text, timestamptz) to authenticated;
grant execute on function public.update_transaction_date(uuid, bigint, timestamptz) to authenticated;
