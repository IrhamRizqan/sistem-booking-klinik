# Sistem Booking Klinik

Sistem Booking Klinik adalah aplikasi manajemen jadwal dan antrean pasien klinik berbasis web. Proyek ini dibangun sebagai solusi untuk mempermudah pendaftaran pasien, pengelolaan dokter, penjadwalan, serta monitoring antrean secara real-time.

## 🛠️ Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** MySQL, Prisma ORM
- **Authentication:** Express Session, bcrypt
- **Frontend:** Plain HTML, CSS, JavaScript (Fetch API), Bootstrap 5
- **Exports:** PDFKit (PDF Export), Native Array Parsing (CSV)

## 📋 Fitur Utama
1. **Pendaftaran dan Autentikasi:** Registrasi pasien, sistem login aman untuk Admin dan Pasien menggunakan sesi (`express-session`).
2. **Manajemen Dokter & Jadwal:** CRUD Dokter dan Jadwal Praktik dengan validasi otomatis (slot generation).
3. **Sistem Booking:** Pasien dapat melakukan booking berdasarkan tanggal, spesialisasi, dan dokter. Sistem menolak booking ganda dan kuota penuh.
4. **Manajemen Antrean (Real-time):** Transisi antrean dinamis (`Menunggu` -> `Dipanggil` -> `Selesai` / `Dilewati`).
5. **Dashboard Analytics:** Statistik jumlah dokter, jadwal, dan progres antrean harian untuk Admin. Pasien juga dapat memonitor status antreannya secara langsung.
6. **Riwayat & Arsip:** Pasien dapat melihat riwayat kunjungan. Admin dapat mencari, menyaring (filter), dan memantau seluruh Arsip Booking.
7. **Export Data:** Admin dapat melakukan ekspor tabel Arsip Klinik ke PDF maupun CSV secara presisi berdasarkan filter aktif (Tanpa batasan paginasi).

## 🚀 Prasyarat (Requirements)
- **Node.js** (v18 atau lebih baru)
- **MySQL** (Server berjalan secara lokal)
- **Git** (Opsional untuk kloning)

## ⚙️ Instalasi dan Konfigurasi

1. **Clone Repository**
   ```bash
   git clone <url-repo-anda>
   cd sistem-booking-klinik
   ```

2. **Install Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Ganti nama `.env.example` menjadi `.env` dan atur konfigurasi database Anda. Pastikan nama database di URL sesuai dengan MySQL Anda (misal `booking_klinik_db`):
   ```env
   PORT=3000
   DATABASE_URL="mysql://root:password@localhost:3306/booking_klinik_db"
   SESSION_SECRET="rahasia-klinik-sangat-aman-123"
   ```

4. **Siapkan Database dan Prisma**
   Jalankan migrasi untuk membangun tabel database:
   ```bash
   npx prisma migrate dev --name init
   ```
   *Perintah ini juga secara otomatis akan menjalankan seeding (akun admin awal) berdasarkan pengaturan di `package.json`.*

## 🏁 Menjalankan Aplikasi

Jalankan server dalam mode development (dengan nodemon):
```bash
npm run dev
```

Akses aplikasi di browser:
- **URL:** [http://localhost:3000](http://localhost:3000)

## 🔐 Akun Default Admin

Setelah seeding berhasil, gunakan akun berikut untuk masuk ke Portal Admin:
- **Username:** `admin`
- **Password:** `admin123`

## 📂 Struktur Proyek
- `/src/controllers` - Berisi logika untuk menangani request dan menyusun response.
- `/src/services` - Berisi business logic dan query ke database Prisma.
- `/src/routes` - Definisi routing dan penambahan middleware autentikasi.
- `/src/public/pages` - Seluruh tampilan HTML (Frontend).
- `/src/public/js` - Logika frontend (Fetch API, DOM manipulation).
- `/prisma` - Konfigurasi skema database (`schema.prisma`) dan fungsi seeding.
- `index.js` - Entry point server Node.js.

## 🧪 Testing (Pengujian Internal)
Proyek ini dilengkapi dengan skrip test fungsional internal di root directory (`test_final.js`, dll) yang melakukan simulasi request HTTP secara menyeluruh tanpa antarmuka browser.
Jalankan pengujian menggunakan:
```bash
node test_final.js
```
*(Pastikan server `npm run dev` sedang berjalan)*
