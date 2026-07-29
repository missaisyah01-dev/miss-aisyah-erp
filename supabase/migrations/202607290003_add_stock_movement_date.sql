-- A manually entered movement date is optional; leaving it empty uses now().
create or replace function public.adjust_product_stock(
  p_brand_id uuid,
  p_product_id bigint,
  p_type text,
  p_quantity integer,
  p_notes text default null,
  p_created_at timestamptz default null
)
returns table (product_id bigint, stock integer) language plpgsql security definer set search_path=public as $$
declare v_product public.products%rowtype; v_change integer;
begin
  perform public.assert_brand_access(p_brand_id);
  if coalesce(public.current_user_role(),'') not in ('OWNER','ADMIN') then raise exception 'Anda tidak memiliki akses untuk mengubah stok'; end if;
  if p_type not in ('MASUK','KELUAR','RETUR') or p_quantity is null or p_quantity <= 0 then raise exception 'Data pergerakan stok tidak valid'; end if;
  select * into v_product from public.products where id=p_product_id and brand_id=p_brand_id for update;
  if not found then raise exception 'Produk tidak ditemukan untuk brand aktif'; end if;
  v_change := case when p_type='KELUAR' then -p_quantity else p_quantity end;
  if v_product.stok + v_change < 0 then raise exception 'Stok produk tidak mencukupi'; end if;
  update public.products set stok=stok+v_change where id=v_product.id;
  insert into public.stock_movements(brand_id,product_id,product_variant_id,tipe,jumlah,keterangan,created_at) values(p_brand_id,v_product.id,null,p_type,p_quantity,nullif(trim(p_notes),''),coalesce(p_created_at,now()));
  return query select v_product.id, v_product.stok + v_change;
end $$;

revoke all on function public.adjust_product_stock(uuid,bigint,text,integer,text,timestamptz) from public, anon;
grant execute on function public.adjust_product_stock(uuid,bigint,text,integer,text,timestamptz) to authenticated;
