-- Impor pergerakan stok dari Excel berdasarkan SKU varian.
create or replace function public.import_stock_movements(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_variant public.product_variants%rowtype;
  v_type text;
  v_quantity integer;
  v_count integer := 0;
begin
  if coalesce(public.current_user_role(), '') not in ('OWNER', 'ADMIN') then raise exception 'Anda tidak memiliki akses untuk mengimpor stok'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Data impor kosong'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_type := upper(trim(coalesce(v_item->>'tipe', '')));
    v_quantity := nullif(trim(coalesce(v_item->>'jumlah', '')), '')::integer;
    if nullif(trim(coalesce(v_item->>'sku', '')), '') is null then raise exception 'SKU varian wajib diisi'; end if;
    if v_type not in ('MASUK', 'KELUAR', 'RETUR') then raise exception 'Tipe stok harus MASUK, KELUAR, atau RETUR'; end if;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Jumlah harus berupa bilangan lebih dari 0'; end if;
    select * into v_variant from public.product_variants where sku = trim(v_item->>'sku') for update;
    if not found then raise exception 'SKU % tidak ditemukan', trim(v_item->>'sku'); end if;
    if v_type = 'KELUAR' and v_variant.stock < v_quantity then raise exception 'Stok SKU % tidak mencukupi', v_variant.sku; end if;
    update public.product_variants set stock = stock + case when v_type = 'KELUAR' then -v_quantity else v_quantity end where id = v_variant.id;
    insert into public.stock_movements(product_id, product_variant_id, tipe, jumlah, keterangan)
    values (v_variant.product_id, v_variant.id, v_type, v_quantity, nullif(trim(v_item->>'keterangan'), ''));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.import_stock_movements(jsonb) from public, anon;
grant execute on function public.import_stock_movements(jsonb) to authenticated;
