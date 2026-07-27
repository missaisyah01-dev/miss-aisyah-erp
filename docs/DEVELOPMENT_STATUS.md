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
- POS: keranjang berdasarkan warna/ukuran, pembayaran tunai/QRIS/TRANSFER, transaksi atomik, dan cetak struk.
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
8. `202607260004_import_stock_movements.sql`
9. `202607270001_sync_variant_sku_and_price.sql`
10. `202607270002_add_atomic_stock_adjustment.sql`
11. `202607270003_rename_debit_to_transfer.sql`

Tidak ada migration aplikasi yang masih tertunda.

Migration varian dan piutang dicatat sebagai sudah diterapkan karena merupakan prasyarat yang diperlukan agar migration retur dan diskon dapat berjalan berhasil.

## Catatan lanjutan

- RLS `product_variants`: Owner/Admin mengelola; Kasir hanya membaca.
- Laporan produk terlaris masih dikelompokkan per produk induk, bukan per varian. Ini bisa menjadi peningkatan laporan berikutnya.
- Penyesuaian stok manual memakai fungsi database atomik agar mutasi stok dan saldo varian selalu tersimpan bersama.

## Operasional pribadi

1. Jalankan seluruh migration di atas secara berurutan pada proyek Supabase yang dipakai aplikasi.
2. Gunakan satu akun Owner dan jangan bagikan kredensial dashboard Supabase maupun file `.env.local`.
3. Buat backup database dari Supabase sebelum menjalankan migration baru dan secara berkala setelah transaksi penting.
4. Saat koneksi internet terputus, jangan lakukan penyesuaian stok atau transaksi sampai koneksi kembali normal dan halaman dapat dimuat ulang.
