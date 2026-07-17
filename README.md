# Sistem Booking Klinik

Sistem Booking Klinik adalah aplikasi berbasis web untuk manajemen jadwal dan antrean pasien. Proyek ini memfasilitasi pendaftaran pasien, pengelolaan dokter, penjadwalan, serta pemantauan antrean secara real-time.

## Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** MySQL, Prisma ORM
- **Authentication:** Express Session, bcrypt
- **Frontend:** HTML, CSS, JavaScript (Fetch API)
- **Exports:** PDFKit (PDF), Native Array Parsing (CSV)

## Fitur Utama
1. **Autentikasi:** Registrasi pasien dan login untuk Admin dan Pasien menggunakan session.
2. **Manajemen Dokter & Jadwal:** Pengelolaan data dokter dan jadwal praktik dengan validasi slot waktu.
3. **Sistem Booking:** Pembuatan antrean berdasarkan spesialisasi dan ketersediaan dokter, dengan perlindungan terhadap booking ganda.
4. **Manajemen Antrean:** Transisi status antrean dinamis secara real-time.
5. **Dashboard Analytics:** Pemantauan statistik klinik untuk Admin dan status antrean aktif untuk Pasien.
6. **Riwayat & Arsip:** Pencarian dan penyaringan data riwayat kunjungan.
7. **Export Data:** Pengunduhan rekap data arsip ke dalam format PDF dan CSV.

## Prasyarat
- Node.js (v18 atau lebih baru)
- MySQL (Server berjalan secara lokal)

## Instalasi dan Konfigurasi

1. **Clone Repository**
   ```bash
   git clone <url-repo>
   cd sistem-booking-klinik
   ```

2. **Install Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Salin `.env.example` menjadi `.env` dan sesuaikan kredensial database MySQL Anda.
   ```env
   PORT=3000
   DATABASE_URL="mysql://root:password@localhost:3306/booking_klinik_db"
   SESSION_SECRET="rahasia-sesi-123"
   ```

4. **Migrasi Database**
   Jalankan perintah berikut untuk membuat skema database dan memasukkan data awal (seeding).
   ```bash
   npx prisma migrate dev --name init
   ```

## Menjalankan Aplikasi

Jalankan server aplikasi:
```bash
npm run dev
```
Akses aplikasi melalui browser di `http://localhost:3000`.

## Akun Admin Default
Gunakan kredensial berikut untuk masuk sebagai Admin (dibuat secara otomatis saat migrasi):
- **Username:** admin
- **Password:** admin123

## Struktur Proyek
- `src/controllers`: Menangani request dan menyusun response.
- `src/services`: Logika bisnis dan kueri database (Prisma).
- `src/routes`: Definisi API endpoints.
- `src/middlewares`: Penengah untuk autentikasi dan otorisasi.
- `src/public`: Berkas statis frontend (HTML, CSS, JS).
- `prisma`: Skema database dan skrip seeding.
- `index.js`: Entry point utama aplikasi Node.js.
