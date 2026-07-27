-- Penyesuaian stok manual harus mencatat mutasi dan stok varian dalam satu transaksi.
create or replace function public.adjust_variant_stock(
  p_variant_id bigint,
  p_type text,
  p_quantity integer,
  p_notes text default null
)
returns table (variant_id bigint, stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant public.product_variants%rowtype;
  v_stock integer;
begin
  if coalesce(public.current_user_role(), '') not in ('OWNER', 'ADMIN') then
    raise exception 'Anda tidak memiliki akses untuk mengubah stok';
  end if;

  if p_type not in ('MASUK', 'KELUAR', 'RETUR') then
    raise exception 'Tipe stok tidak valid';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Jumlah stok harus lebih dari 0';
  end if;

  select * into v_variant
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception 'Varian tidak ditemukan';
  end if;

  v_stock := v_variant.stock + case when p_type = 'KELUAR' then -p_quantity else p_quantity end;
  if v_stock < 0 then
    raise exception 'Stok varian tidak mencukupi';
  end if;

  update public.product_variants
  set stock = v_stock,
      updated_at = now()
  where id = v_variant.id;

  insert into public.stock_movements (product_id, product_variant_id, tipe, jumlah, keterangan)
  values (v_variant.product_id, v_variant.id, p_type, p_quantity, nullif(trim(p_notes), ''));

  return query select v_variant.id, v_stock;
end;
$$;

revoke all on function public.adjust_variant_stock(bigint, text, integer, text) from public, anon;
grant execute on function public.adjust_variant_stock(bigint, text, integer, text) to authenticated;
