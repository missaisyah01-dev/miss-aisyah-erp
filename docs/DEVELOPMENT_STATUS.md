# Status Development — miss aisyah

Terakhir diperbarui: 25 Juli 2026

## Identitas aplikasi

- Nama resmi di interface: `miss aisyah`
- Bisnis: fashion, bukan F&B
- Stack: Next.js 16, TypeScript, Tailwind CSS, App Router, Supabase
- Project: `C:\Users\user\miss-aisyah`

## Fitur yang sudah selesai

- Dashboard dasar, produk, kategori, inventori/stok.
- POS/Kasir: keranjang, pembayaran, transaksi atomik, pengurangan stok produk, riwayat penjualan.
- Laporan penjualan: omzet, tren, metode pembayaran, produk terlaris.
- Supabase Auth dan role `OWNER`, `ADMIN`, `KASIR`.
- RLS role-based; transaksi menyimpan `cashier_id` dan kasir hanya membaca transaksinya sendiri.
- Perbaikan kontras global untuk dashboard, produk, kartu statistik, grafik, dan modal.

## Migration Supabase

Migration berikut **sudah dijalankan** oleh user:

1. `202607250001_create_pos_transactions.sql`
2. `202607250002_add_top_selling_products_report.sql`
3. `202607250003_add_auth_roles_and_rls.sql`

Migration berikut **BELUM boleh dijalankan**:

4. `202607250004_add_product_variants.sql`

Alasannya: POS dan pergerakan stok saat ini masih memakai stok pada tabel `products`. Migration 004 membuat stok per varian; menjalankannya sebelum integrasi POS dan inventori selesai dapat membuat stok produk dan varian tidak sinkron.

## Sprint aktif — Varian Produk Fashion

Tahap fondasi di kode sudah dibuat:

- `product_variants` (migration 004)
- Modal pengelolaan warna, ukuran, SKU, harga, dan stok: `src/components/products/VariantModal.tsx`
- Tombol `Varian` di tabel produk
- Produk lama direncanakan mendapat varian awal `Default / One Size`

### Pekerjaan wajib berikutnya sebelum menjalankan migration 004

1. Ubah fungsi Supabase `create_sale` agar menerima `variant_id`, mengunci stok varian, dan menyimpan varian pada `transaction_items`.
2. Ubah POS (`src/components/sales/PosTerminal.tsx`) agar kasir memilih warna/ukuran.
3. Ubah `StockModal` agar pergerakan stok dilakukan per varian.
4. Sesuaikan riwayat transaksi dan laporan agar menampilkan varian.
5. Verifikasi RLS `product_variants`; Owner/Admin mengelola, Kasir hanya membaca.
6. Baru jalankan migration 004 di Supabase SQL Editor dan uji transaksi dengan lebih dari satu varian.

## Catatan Git

Perubahan tahap fondasi varian yang belum perlu di-deploy database:

- `src/app/products/page.tsx`
- `src/components/products/ProductTable.tsx`
- `src/components/products/VariantModal.tsx`
- `supabase/migrations/202607250004_add_product_variants.sql`

Selalu cek `git status` sebelum commit karena user mungkin sudah melakukan commit pada sprint sebelumnya.
