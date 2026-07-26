# Status Development — miss aisyah

Terakhir diperbarui: 26 Juli 2026

## Identitas aplikasi

- Nama resmi di interface: `miss aisyah`
- Bisnis: fashion, bukan F&B
- Stack: Next.js 16, TypeScript, Tailwind CSS, App Router, Supabase
- Project: `C:\Users\user\miss-aisyah`

## Fitur yang tersedia di kode

- Dashboard, produk, kategori, inventori/stok, dan laporan penjualan.
- Dashboard memberi daftar restock berdasarkan batas stok rendah dari Pengaturan perangkat.
- POS: keranjang berdasarkan warna/ukuran, pembayaran tunai/QRIS/debit, transaksi atomik, dan cetak struk.
- Varian fashion: warna, ukuran, SKU, harga, dan stok per varian.
- Riwayat stok, detail transaksi, dan struk menampilkan varian yang terkait.
- Piutang: pembayaran awal, pelunasan bertahap, riwayat pembayaran, serta edit informasi struk.
- Retur per item: alasan dan metode refund tercatat, lalu stok varian dikembalikan otomatis.
- Supabase Auth dan role `OWNER`, `ADMIN`, `KASIR`, dengan RLS role-based.

## Migration Supabase

Migration yang telah dikonfirmasi dijalankan user:

1. `202607250001_create_pos_transactions.sql`
2. `202607250002_add_top_selling_products_report.sql`
3. `202607250003_add_auth_roles_and_rls.sql`
4. `202607250004_add_product_variants.sql`
5. `202607260001_add_receivables_and_receipt_tools.sql`
6. `202607260002_add_transaction_returns.sql`
7. `202607260003_add_transaction_discounts.sql`

Tidak ada migration aplikasi yang masih tertunda.

Migration varian dan piutang dicatat sebagai sudah diterapkan karena merupakan prasyarat yang diperlukan agar migration retur dan diskon dapat berjalan berhasil.

## Catatan lanjutan

- RLS `product_variants`: Owner/Admin mengelola; Kasir hanya membaca.
- Laporan produk terlaris masih dikelompokkan per produk induk, bukan per varian. Ini bisa menjadi peningkatan laporan berikutnya.
