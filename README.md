# AutoWorks - Sistem Manajemen Bengkel

AutoWorks adalah aplikasi web komprehensif yang dirancang untuk mengelola operasional bengkel secara digital dan efisien. Dibangun dengan antarmuka bertema *high-end sci-fi diagnostics* yang modern, aplikasi ini membantu pemilik bengkel, manajer, dan mekanik dalam melacak layanan dasar hingga perbaikan berat.

## 🚀 Fitur Utama

- **Manajemen Layanan Servis (Work Orders)**
  Pencatatan jenis servis (Rutin, Ringan, Berat) beserta dengan detail opsi servis, mekanik yang bertugas, dan status pengerjaan secara *real-time*.
- **Database Pelanggan & Kendaraan**
  Manajemen data pelanggan beserta riwayat kendaraan mereka dengan pencarian yang cepat.
- **Sistem Antrean & Jadwal**
  Memantau antrean kendaraan yang sedang dikerjakan dan penjadwalan servis baru.
- **Manajemen Inventaris & Suku Cadang**
  Melacak ketersediaan suku cadang dan mengingatkan jika stok menipis.
- **Kasir & Keuangan**
  Modul kasir terintegrasi untuk proses pembayaran (billing) serta laporan keuangan untuk melihat performa bengkel.
- **Otentikasi Aman**
  Sistem login menggunakan Firebase Authentication untuk memastikan bahwa hanya pegawai bengkel yang memiliki akses.
- **Tema Gelap Modern (Dark Mode)**
  Antarmuka dengan desain bernuansa gelap (*slate* dan kominasi *neon*) yang sangat responsif, dipadukan dengan efek kaca (*glassmorphism*).

## 🛠️ Teknologi yang Digunakan

- **Frontend:** React 19, TypeScript, React Router DOM, Vite
- **Styling:** Tailwind CSS (v4), efek antarmuka modern dengan warna neon
- **Ikon:** Lucide React
- **Animasi:** Motion (Framer Motion)
- **Database & Backend:** Firebase (Firestore) & Firebase Auth
- **Server Dev:** Express.js + Vite Middleware (untuk kebutuhan *full-stack local development*)

## 📂 Struktur Proyek Utama

- `src/components/Dasbor.tsx` - Layout utama aplikasi dengan navigasi *sidebar* dan *header* notifikasi.
- `src/components/LayananServis.tsx` - Modul khusus untuk mencatat Work Order baru beserta pilihan servis dan keluhan.
- `src/components/Kasir.tsx` - Modul layanan pembayaran untuk servis yang sudah selesai.
- `src/components/Keuangan.tsx` - Rekapan pendapatan bengkel.
- `src/components/Kendaraan.tsx` & `src/components/Pelanggan.tsx` - Modul pencatatan *database* CRM.
- `firestore.rules` - Berkaskan aturan keamanan yang dioptimalkan untuk membatasi akses baca/tulis berdasarkan UID dan struktur data.

## ⚙️ Jenis Service yang Didukung

Aplikasi ini mendukung klasifikasi servis kendaraan yang mendetail:
1. **Service Rutin** (Penggantian Oli Mesin, Filter Oli, Filter Udara, dll.)
2. **Service Ringan** (Tune Up, Servis Rem, Spooring & Balancing, dll.)
3. **Service Berat** (Turun Mesin, Overhaul Transmisi, Perbaikan Kelistrikan Total, dll.)
*Terdapat juga opsi untuk input layanan lainnya dan keluhan pelanggan dalam bentuk catatan.*

## 💻 Cara Menjalankan secara Lokal

1. Pastikan Anda telah menginstal dependensi dengan menjalankan perintah:
   ```bash
   npm install
   ```

2. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```

3. Buka peramban (browser) di `http://localhost:3000`. Server lokal sudah dikonfigurasi untuk menjalankan Vite secara simultan melalui Express.

## 🔒 Keamanan (Firebase)

Project ini menggunakan standar tinggi untuk keamanan integrasi Firebase Firestore dengan pemeriksaan skema yang ketat berbasis `hasOnly` dan pengecekan tipe dokumen sebelum diizinkan ditulis/diperbarui.

---

*Dibuat untuk membantu operasional bengkel menjadi lebih mudah, terstruktur, dan terekam secara digital.*
