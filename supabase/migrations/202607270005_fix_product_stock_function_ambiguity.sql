-- PostgreSQL perlu alias eksplisit karena nama kolom product_id sama dengan
-- nama kolom keluaran fungsi set_product_total_stock.
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

  select products.* into v_product
  from public.products as products
  where products.id = p_product_id
  for update;
  if not found then raise exception 'Produk tidak ditemukan'; end if;

  select variants.* into v_variant
  from public.product_variants as variants
  where variants.product_id = p_product_id
  order by (variants.color = 'Default' and variants.size = 'One Size') desc, variants.id
  limit 1
  for update;
  if not found then raise exception 'Varian produk tidak ditemukan'; end if;

  select coalesce(sum(variants.stock), 0) into v_other_stock
  from public.product_variants as variants
  where variants.product_id = p_product_id and variants.id <> v_variant.id;
  if p_stock < v_other_stock then
    raise exception 'Stok total tidak boleh lebih kecil dari stok varian lainnya (%)', v_other_stock;
  end if;

  update public.product_variants as variants
  set stock = p_stock - v_other_stock,
      updated_at = now()
  where variants.id = v_variant.id;

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

grant execute on function public.set_product_total_stock(bigint, integer) to authenticated;
