-- Stok opname massal: stok fisik menjadi sumber kebenaran dan seluruh
-- penyesuaian dicatat sebagai mutasi stok dalam satu transaksi.
create or replace function public.record_stock_opname(
  p_items jsonb,
  p_notes text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_variant public.product_variants%rowtype;
  v_variant_id bigint;
  v_physical_stock integer;
  v_difference integer;
  v_count integer := 0;
begin
  if coalesce(public.current_user_role(), '') not in ('OWNER', 'ADMIN') then
    raise exception 'Anda tidak memiliki akses untuk melakukan stok opname';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tidak ada selisih stok untuk diterapkan';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_variant_id := (v_item ->> 'variant_id')::bigint;
    v_physical_stock := (v_item ->> 'physical_stock')::integer;
    if v_variant_id is null or v_physical_stock is null or v_physical_stock < 0 then
      raise exception 'Data stok fisik tidak valid';
    end if;

    select * into v_variant from public.product_variants where id = v_variant_id for update;
    if not found then raise exception 'Varian tidak ditemukan'; end if;
    v_difference := v_physical_stock - v_variant.stock;
    if v_difference = 0 then continue; end if;

    update public.product_variants set stock = v_physical_stock, updated_at = now() where id = v_variant.id;
    insert into public.stock_movements (product_id, product_variant_id, tipe, jumlah, keterangan)
    values (
      v_variant.product_id,
      v_variant.id,
      case when v_difference > 0 then 'MASUK' else 'KELUAR' end,
      abs(v_difference),
      'Stok opname: sistem ' || v_variant.stock || ', fisik ' || v_physical_stock || coalesce(' · ' || nullif(trim(p_notes), ''), '')
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.record_stock_opname(jsonb, text) from public, anon;
grant execute on function public.record_stock_opname(jsonb, text) to authenticated;
