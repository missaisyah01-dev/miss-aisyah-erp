-- SKU dan harga varian mengikuti data utama produk.
create or replace function public.sync_variant_sku_and_price_from_product()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants
  set price = new.harga,
      sku = case
        when color = 'Default' and size = 'One Size' then new.kode
        else new.kode || '-' || id::text
      end
  where product_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_product_updated_sync_variant_defaults on public.products;
create trigger on_product_updated_sync_variant_defaults
after update of kode, harga on public.products
for each row execute procedure public.sync_variant_sku_and_price_from_product();
