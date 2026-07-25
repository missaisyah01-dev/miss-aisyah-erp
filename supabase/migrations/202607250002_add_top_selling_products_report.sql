-- Analitik produk terlaris untuk laporan owner.
-- Fungsi menggunakan security invoker sehingga tetap mengikuti RLS tabel sumber.
create or replace function public.get_top_selling_products(
  p_start timestamptz default null,
  p_limit integer default 5
)
returns table (
  product_id bigint,
  product_name text,
  total_quantity bigint,
  total_revenue numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    transaction_items.product_id,
    max(transaction_items.product_name)::text as product_name,
    sum(transaction_items.quantity)::bigint as total_quantity,
    sum(transaction_items.subtotal)::numeric as total_revenue
  from public.transaction_items
  inner join public.transactions on transactions.id = transaction_items.transaction_id
  where p_start is null or transactions.created_at >= p_start
  group by transaction_items.product_id
  order by total_quantity desc, total_revenue desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

grant execute on function public.get_top_selling_products(timestamptz, integer) to anon, authenticated;
