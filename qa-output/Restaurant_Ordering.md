# Product Requirements Document: MajuRasa
Version: 1.0, Status: Draft, Tanggal: 24 Oktober 2023

## 1. Overview
- **Problem Statement**: Pelanggan restoran MajuRasa sering mengalami antrean panjang saat memesan makanan secara langsung, terutama pada jam makan siang (12:00 - 13:30). Di sisi lain, staf dapur kesulitan melacak antrean pesanan kertas yang sering hilang atau basah, menyebabkan kesalahan pembuatan makanan sebesar 8% dari total pesanan harian.
- **Solution**: MajuRasa adalah aplikasi pemesanan online berbasis web responsif yang memungkinkan pelanggan memesan makanan dari mana saja untuk diambil sendiri (*pickup*) atau dikirim (*delivery*). Aplikasi ini dilengkapi dengan sistem pembayaran transfer/e-wallet otomatis, dasbor dapur real-time untuk meminimalisasi kertas, serta pelacakan status pesanan langsung oleh pelanggan.
- **Goals**:
  - Mengurangi waktu tunggu antrean pelanggan di outlet fisik sebesar 50% (dari rata-rata 15 menit menjadi di bawah 7 menit).
  - Menurunkan tingkat kesalahan pembuatan pesanan oleh dapur hingga < 0.5% dari total pesanan harian.
  - Memastikan p95 waktu respons pembaruan status pesanan real-time ke layar dapur dan pelanggan < 500ms.
  - Mencapai kapasitas sistem untuk menangani minimal 200 pesanan aktif secara bersamaan (*concurrent orders*).
- **Non-Goals**:
  - Integrasi dengan armada kurir pihak ketiga otomatis (seperti GoSend/GrabExpress API) pada Fase 1. Pengiriman *delivery* dilakukan oleh kurir internal restoran dengan radius maksimal 5 km.
  - Sistem manajemen inventaris bahan baku mentah (stok dihitung per porsi menu siap saji).
  - Fitur multi-cabang (aplikasi hanya melayani 1 outlet tunggal MajuRasa).
- **Target Users**:
  - Pelanggan Restoran MajuRasa (Pekerja kantoran, mahasiswa, keluarga di sekitar outlet).
  - Staf Dapur MajuRasa (Koki dan asisten dapur).
  - Admin/Kasir Restoran MajuRasa.
- **Personas**:
  - **Nama**: Budi Santoso
    - **Peran**: Pelanggan (Pekerja Kantoran)
    - **Kebutuhan**: Memesan makan siang dengan cepat tanpa perlu mengantre lama di kasir.
    - **Pain Points**: Waktu istirahat makan siang hanya 60 menit; sering kehabisan waktu karena antrean kasir MajuRasa yang mengular.
    - **Konteks**: Memesan dari meja kantor pada pukul 11:45 melalui ponsel untuk diambil (*pickup*) pada pukul 12:15.
  - **Nama**: Siti Aminah
    - **Peran**: Staf Dapur (Koki Utama)
    - **Kebutuhan**: Melihat daftar antrean pesanan masuk secara berurutan dan jelas tanpa kertas fisik.
    - **Pain Points**: Struk kertas pesanan sering basah terkena minyak/air, tertukar urutan, atau hilang saat kondisi dapur sibuk.
    - **Konteks**: Memantau tablet layar sentuh 10 inci yang dipasang di dinding area masak dapur.
  - **Nama**: Hendra Wijaya
    - **Peran**: Admin / Kasir
    - **Kebutuhan**: Memverifikasi pembayaran manual transfer bank dan memantau status operasional restoran.
    - **Pain Points**: Harus mencocokkan mutasi rekening secara manual di aplikasi m-banking pribadi yang memakan waktu.
    - **Konteks**: Bekerja di meja kasir depan menggunakan komputer desktop/tablet POS.
- **User Stories**:
  - **US-01**: Sebagai Pelanggan, saya ingin melihat menu restoran lengkap dengan harga dan status ketersediaan agar saya bisa memilih makanan yang ingin dibeli.
  - **US-02**: Sebagai Pelanggan, saya ingin menambahkan menu ke keranjang dan memilih opsi *pickup* atau *delivery* agar saya bisa menentukan cara menerima makanan.
  - **US-03**: Sebagai Pelanggan, saya ingin membayar pesanan menggunakan e-wallet (OVO, GoPay) atau transfer bank agar saya tidak perlu menyiapkan uang tunai.
  - **US-04**: Sebagai Staf Dapur, saya ingin menerima notifikasi pesanan baru secara real-time di layar dapur agar saya bisa segera memasak pesanan sesuai urutan masuk.
  - **US-05**: Sebagai Staf Dapur, saya ingin mengubah status pesanan menjadi "Sedang Dimasak" dan "Siap Diambil/Dikirim" agar pelanggan dan kasir mengetahui perkembangan pesanan.
  - **US-06**: Sebagai Pelanggan, saya ingin melacak status persiapan makanan saya secara real-time agar saya tahu kapan harus datang ke restoran atau menunggu kurir datang.
  - **US-07**: Sebagai Admin, saya ingin mengubah status ketersediaan menu (tersedia/habis) agar pelanggan tidak memesan menu yang bahannya sudah kosong.

## 2. Scope
- **In-Scope**:
  - Otentikasi pengguna (Registrasi, Login, Reset Password) menggunakan email dan nomor WhatsApp.
  - Manajemen Katalog Menu (Kategori, Detail Menu, Gambar, Harga, Status Stok).
  - Sistem Keranjang Belanja & Checkout (Opsi Layanan: Pickup / Delivery).
  - Integrasi Midtrans Payment Gateway untuk pembayaran e-wallet (GoPay, OVO, ShopeePay) dan Virtual Account (VA) Bank Mandiri, BCA, BNI.
  - Layar Dapur Real-time menggunakan WebSockets (Socket.io) untuk sinkronisasi tanpa refresh halaman.
  - Dasbor Admin untuk mengelola pesanan, mengonfirmasi pembayaran manual (jika ada), dan memperbarui status menu.
  - Halaman Pelacakan Pesanan (Status: Menunggu Pembayaran, Dibayar, Diproses Dapur, Siap Diambil/Dikirim, Selesai, Dibatalkan).
- **Out-of-Scope (with reason)**:
  - Fitur promo/diskon dan kode kupon kompleks (ditunda ke Fase 2 untuk mempercepat *time-to-market*).
  - Aplikasi mobile native Android/iOS (fokus awal pada Web App responsif yang dapat diakses via browser ponsel/desktop).
  - Integrasi peta rute pengiriman (jarak *delivery* dihitung manual berdasarkan alamat kecamatan/kelurahan yang dipilih dari dropdown).
- **Assumptions**:
  - Pelanggan memiliki koneksi internet yang stabil saat melakukan pembayaran.
  - Staf dapur menggunakan perangkat tablet dengan layar minimal 10 inci yang terhubung secara konstan ke stopkontak listrik dan Wi-Fi restoran.
- **Dependencies**:
  - Layanan Payment Gateway Midtrans (Sandbox & Production API) untuk memproses transaksi secara aman.
  - Layanan pengiriman email (SendGrid/Mailgun) untuk verifikasi akun dan struk digital.
  - Layanan WhatsApp API (Fonnte/Waba) untuk mengirimkan notifikasi status pesanan langsung ke nomor pelanggan.

## 3. Functional Requirements

| ID | Fitur | Deskripsi Detail | Prioritas | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Registrasi & Login Pelanggan | Pelanggan dapat mendaftar menggunakan Nama Lengkap, Email, Nomor WhatsApp, dan Password. Login menggunakan Email dan Password dengan validasi JWT token yang disimpan di HTTP-only cookie. | P0 | - Given: Pelanggan berada di halaman registrasi.<br>- When: Mengisi semua field dengan valid dan menekan tombol "Daftar".<br>- Then: Sistem mengirimkan email verifikasi dan mengarahkan ke halaman login. |
| **FR-02** | Manajemen Menu (Admin) | Admin dapat menambah, mengubah, menghapus, dan mengubah status ketersediaan menu (Tersedia / Habis). Setiap menu memiliki Nama, Deskripsi, Harga, Kategori, dan Foto Menu (maksimal 2MB). | P0 | - Given: Admin berada di dasbor manajemen menu.<br>- When: Admin mengubah status menu "Nasi Goreng" menjadi "Habis".<br>- Then: Menu "Nasi Goreng" langsung menampilkan label "Habis" di sisi pelanggan dan tidak bisa dimasukkan ke keranjang. |
| **FR-03** | Keranjang Belanja | Pelanggan dapat memasukkan beberapa menu ke keranjang, menambah/mengurangi jumlah porsi, serta menambahkan catatan khusus per menu (misal: "tidak pakai kol"). | P0 | - Given: Pelanggan telah memilih menu.<br>- When: Menekan tombol "Tambah ke Keranjang".<br>- Then: Jumlah item di ikon keranjang bertambah secara real-time dan total harga dihitung ulang dengan benar. |
| **FR-04** | Checkout & Pilihan Layanan | Pelanggan memilih metode layanan: "Ambil Sendiri" (Pickup) atau "Antar ke Rumah" (Delivery). Jika Delivery, pelanggan wajib mengisi detail alamat dan nomor kontak penerima. | P0 | - Given: Pelanggan berada di halaman checkout.<br>- When: Memilih "Delivery" dan memasukkan alamat.<br>- Then: Sistem menambahkan biaya pengiriman tetap Rp 10.000 ke total tagihan pesanan. |
| **FR-05** | Integrasi Pembayaran | Sistem menghasilkan kode bayar (Virtual Account / QRIS) via Midtrans. Status pesanan diubah otomatis dari "Menunggu Pembayaran" menjadi "Dibayar" saat webhook pembayaran sukses diterima dari Midtrans. | P0 | - Given: Pelanggan menyelesaikan checkout.<br>- When: Pelanggan melakukan pembayaran QRIS menggunakan aplikasi e-wallet.<br>- Then: Midtrans mengirim webhook ke API backend, dan status pesanan berubah menjadi "Dibayar" dalam waktu < 2 detik. |
| **FR-06** | Layar Dapur Real-time | Menampilkan semua pesanan dengan status "Dibayar" secara urut berdasarkan waktu pembayaran tertua. Layar dapur otomatis memperbarui daftar pesanan tanpa perlu refresh browser. | P0 | - Given: Staf dapur membuka layar dapur.<br>- When: Ada pesanan baru yang berstatus "Dibayar" masuk ke sistem.<br>- Then: Pesanan baru muncul di daftar paling bawah dengan efek highlight kuning dan berbunyi "bip" singkat. |
| **FR-07** | Pembaruan Status Pesanan | Koki dapat menekan tombol "Mulai Masak" (mengubah status menjadi "Diproses") dan tombol "Selesai Masak" (mengubah status menjadi "Siap Diambil" atau "Sedang Diantar"). | P0 | - Given: Pesanan berstatus "Dibayar" di layar dapur.<br>- When: Koki menekan tombol "Mulai Masak".<br>- Then: Status pesanan berubah menjadi "Diproses" dan status ini langsung terupdate di halaman pelacakan pelanggan. |
| **FR-08** | Pelacakan Pesanan Pelanggan | Pelanggan dapat melihat halaman status pesanan secara real-time yang menunjukkan tahapan: Menunggu Pembayaran -> Dibayar -> Diproses Dapur -> Siap Diambil/Dikirim -> Selesai. | P0 | - Given: Pelanggan membuka link pelacakan pesanan.<br>- When: Koki mengubah status pesanan di dapur.<br>- Then: Halaman pelacakan pelanggan memperbarui progress bar status secara otomatis via koneksi WebSocket/SSE. |
| **FR-09** | Notifikasi WhatsApp Otomatis | Sistem mengirimkan pesan WhatsApp otomatis ke nomor pelanggan saat status pesanan berubah menjadi "Siap Diambil" (untuk pickup) atau "Sedang Diantar" (untuk delivery). | P1 | - Given: Pesanan selesai dimasak oleh dapur.<br>- When: Status diubah menjadi "Siap Diambil".<br>- Then: API mengirimkan template pesan WhatsApp berisi nomor pesanan dan instruksi pengambilan ke nomor HP pelanggan. |
| **FR-10** | Riwayat Pesanan | Pelanggan dapat melihat daftar pesanan masa lalu lengkap dengan detail menu yang dibeli, total harga, tanggal transaksi, dan status akhir pesanan. | P1 | - Given: Pelanggan masuk ke menu profil.<br>- When: Mengklik sub-menu "Riwayat Pesanan".<br>- Then: Sistem memuat daftar seluruh pesanan yang pernah dibuat oleh akun tersebut secara paginasi (10 item per halaman). |

## 4. Non-Functional Requirements
- **Performance**:
  - Waktu muat halaman pertama (*First Contentful Paint*) harus < 1.5 detik pada jaringan 4G.
  - Response time API backend untuk p95 harus < 200ms (tidak termasuk panggilan API eksternal Midtrans).
  - Pembaruan status real-time melalui WebSocket/SSE harus terkirim ke klien dalam waktu < 500ms dari perubahan database.
- **Security**:
  - Otentikasi menggunakan JSON Web Token (JWT) yang disimpan di HTTP-Only, Secure, dan SameSite=Strict cookie untuk mencegah serangan XSS dan CSRF.
  - Semua komunikasi data wajib menggunakan protokol HTTPS (TLS 1.3).
  - Pembatasan laju permintaan (*Rate Limiting*) maksimal 100 request per menit per alamat IP untuk mencegah serangan brute-force dan DDoS pada endpoint publik.
  - Enkripsi data sensitif (password pengguna) menggunakan algoritma bcrypt dengan salt round minimal 10.
  - Sanitasi semua input data string untuk mencegah SQL Injection dan Cross-Site Scripting (XSS).
- **Scalability**:
  - Sistem harus mampu melayani minimal 1.000 pengguna aktif terdaftar secara bersamaan tanpa penurunan kinerja.
  - Database PostgreSQL dikonfigurasi dengan pooling koneksi (misal menggunakan PgBouncer) untuk menangani hingga 500 koneksi database simultan.
- **Reliability/Availability**:
  - Ketersediaan sistem (*Uptime*) minimal 99.9% setiap bulan (maksimal waktu henti tidak terencana sekitar 43 menit per bulan).
  - Pencadangan database (*database backup*) otomatis dilakukan setiap hari pukul 02:00 WIB dan disimpan di cloud storage terpisah dengan retensi data selama 30 hari.
- **Usability**:
  - Desain antarmuka pengguna harus responsif (*mobile-first*) dan dapat diakses dengan nyaman pada layar ponsel ukuran minimal 360px lebar.
  - Ukuran file aset frontend (JS/CSS) harus dikompresi (Gzip/Brotli) dengan ukuran bundle awal < 250KB.
- **Accessibility**:
  - Memenuhi standar WCAG 2.1 Level AA.
  - Kontras warna teks dengan latar belakang minimal 4.5:1.
  - Semua elemen interaktif (tombol, input) dapat difokuskan menggunakan navigasi keyboard.
- **Compliance**:
  - Kepatuhan terhadap regulasi perlindungan data pribadi (UU PDP Indonesia) dengan tidak menyebarkan nomor telepon dan email pelanggan ke pihak ketiga.
  - Retensi data transaksi keuangan disimpan minimal selama 5 tahun sesuai dengan peraturan perpajakan di Indonesia.

## 5. BR (Business Rules)
- **BR-01**: Batas waktu pembayaran pesanan adalah 15 menit sejak pesanan dibuat. Jika dalam waktu 15 menit pembayaran belum diverifikasi oleh Midtrans, sistem akan mengubah status pesanan menjadi "Dibatalkan" secara otomatis dan mengembalikan stok menu yang dipesan.
- **BR-02**: Minimum nominal pemesanan untuk opsi layanan "Delivery" adalah Rp 50.000 (tidak termasuk biaya pengiriman). Tidak ada batas minimum nominal untuk opsi layanan "Pickup".
- **BR-03**: Biaya pengiriman flat ditetapkan sebesar Rp 10.000 untuk semua area pengiriman yang masuk dalam jangkauan (radius maksimal 5 km dari outlet).
- **BR-04**: Pesanan tidak dapat dibatalkan oleh pelanggan secara mandiri jika status pesanan sudah berubah menjadi "Diproses" (sedang dimasak dapur) atau setelahnya.
- **BR-05**: Pengurangan stok menu dilakukan segera setelah status pesanan berubah menjadi "Dibayar". Jika stok suatu menu mencapai 0, menu tersebut otomatis berstatus "Habis" di katalog.
- **BR-06**: Akses ke dasbor dapur terbatas hanya untuk pengguna dengan role "Dapur" dan "Admin". Pengguna dengan role "Pelanggan" tidak diizinkan mengakses endpoint atau halaman dapur.
- **BR-07**: Waktu operasional pemesanan online dibatasi dari pukul 09:00 WIB hingga 21:00 WIB. Di luar jam tersebut, pelanggan tidak dapat melakukan proses checkout (tombol bayar dinonaktifkan).

## 6. Edge Cases

| Skenario | Perilaku Diharapkan |
| :--- | :--- |
| **Stok Habis saat Checkout Bersamaan** | Jika dua pelanggan menekan tombol checkout pada detik yang sama untuk menu terakhir yang tersisa, sistem akan melakukan pengecekan stok menggunakan *database transaction (pessimistic locking)*. Pelanggan pertama yang transaksinya diproses akan berhasil, sedangkan pelanggan kedua akan menerima pesan error: "Maaf, stok Nasi Goreng baru saja habis. Silakan periksa keranjang Anda." |
| **Koneksi Terputus saat Pembayaran** | Jika koneksi internet pelanggan terputus saat proses pembayaran di Midtrans, sistem tetap akan mendengarkan webhook dari Midtrans. Begitu pembayaran sukses dideteksi di sisi Midtrans, status pesanan di database backend akan terupdate menjadi "Dibayar". Saat pelanggan terhubung kembali dan membuka aplikasi, status pesanan akan langsung sinkron menjadi "Dibayar". |
| **Pembayaran Kurang/Lebih (Manual Transfer)** | Jika pelanggan menggunakan metode transfer manual dan nominal yang ditransfer tidak sesuai dengan nominal unik tagihan, status pesanan tetap "Menunggu Pembayaran". Admin akan menerima notifikasi di dasbor admin untuk melakukan verifikasi manual dan memaksa status berubah menjadi "Dibayar" jika uang telah masuk ke rekening. |
| **Perubahan Status saat Layar Terbuka** | Jika pelanggan sedang melihat halaman pelacakan pesanan dan admin/koki mengubah status pesanan di backend, halaman pelacakan pelanggan harus langsung memperbarui UI progress bar tanpa perlu memuat ulang halaman (menggunakan koneksi WebSocket/SSE yang aktif). |
| **Pemesanan di Luar Jam Operasional** | Jika pelanggan memuat halaman checkout pada pukul 20:59 WIB dan baru menekan tombol bayar pada pukul 21:01 WIB, sistem akan menolak transaksi saat tombol ditekan dengan memvalidasi waktu server saat request diterima dan menampilkan pesan: "Pemesanan online telah tutup. Jam operasional kami adalah 09:00 - 21:00 WIB." |
| **Kegagalan Webhook Midtrans** | Jika server backend sedang down saat Midtrans mengirimkan webhook sukses pembayaran, Midtrans akan mencoba mengirim ulang webhook secara berkala. Selain itu, sistem menyediakan tombol "Cek Status Pembayaran" di halaman pelacakan pelanggan yang akan memicu API backend untuk melakukan *pulling* langsung status transaksi ke API Midtrans secara real-time. |
| **Pengguna Dihapus saat Sesi Aktif** | Jika admin menghapus akun pelanggan dari sistem saat pelanggan tersebut sedang login dan menjelajah menu, request API berikutnya dari pelanggan tersebut akan menghasilkan error 401 Unauthorized karena token JWT divalidasi ulang ke database (atau menggunakan blacklist token di Redis), memaksa pelanggan logout otomatis. |
| **Perubahan Harga Menu di Tengah Pemesanan** | Jika admin mengubah harga menu saat pelanggan sudah memasukkan menu tersebut ke dalam keranjang belanja tetapi belum melakukan checkout, sistem akan memvalidasi harga terbaru saat tombol checkout ditekan. Jika ada perbedaan harga, sistem akan memperbarui isi keranjang dan menampilkan pesan: "Harga beberapa menu di keranjang Anda telah berubah. Mohon tinjau kembali pesanan Anda." |

## 7. User Flow & Screen List
### Primary Flow (Happy Path - Pemesanan & Pembayaran)
1. Pelanggan membuka aplikasi web MajuRasa.
2. Pelanggan melihat katalog menu, memilih menu "Nasi Goreng Spesial" dan "Es Teh Manis", lalu menambahkannya ke keranjang.
3. Pelanggan membuka halaman Keranjang Belanja, memeriksa daftar belanjaan, lalu menekan tombol "Lanjut ke Checkout".
4. Pelanggan memilih opsi layanan "Ambil Sendiri" (Pickup) dan memilih waktu pengambilan pukul 12:30 WIB.
5. Pelanggan memilih metode pembayaran "GoPay" dan menekan tombol "Bayar Sekarang".
6. Sistem menampilkan QR Code GoPay yang dihasilkan oleh Midtrans.
7. Pelanggan memindai QR Code dan menyelesaikan pembayaran di aplikasi GoPay ponselnya.
8. Sistem menerima webhook sukses dari Midtrans, mengubah status pesanan menjadi "Dibayar", dan mengirimkan notifikasi ke layar dapur secara real-time.
9. Staf dapur melihat pesanan baru masuk, menekan tombol "Mulai Masak" (status: Diproses), lalu setelah selesai memasak menekan tombol "Siap Diambil" (status: Siap Diambil).
10. Pelanggan menerima notifikasi WhatsApp bahwa pesanan siap diambil, kemudian datang ke restoran menunjukkan nomor pesanan, mengambil makanan, dan kasir mengubah status menjadi "Selesai".

### Alternative/Error Flows
- **Pembayaran Kedaluwarsa (Alternative)**: Pada langkah 6, jika pelanggan tidak membayar dalam waktu 15 menit, sistem CRON job backend akan memicu pembatalan pesanan, status berubah menjadi "Dibatalkan", stok dikembalikan, dan QR Code tidak lagi dapat digunakan.
- **Dapur Menolak Pesanan karena Bahan Habis (Error)**: Jika setelah status berubah menjadi "Dibayar", staf dapur menyadari bahan baku rusak/habis, admin akan menekan tombol "Batalkan & Refund" di dasbor admin. Status pesanan berubah menjadi "Dibatalkan", dan sistem memicu API refund Midtrans untuk mengembalikan dana ke e-wallet pelanggan.

### Screen List
| Nama Layar | Destinasi | Elemen Utama | Navigasi |
| :--- | :--- | :--- | :--- |
| **Halaman Beranda & Menu** | `/menu` | Banner promo, daftar kategori menu (tab horizontal), daftar kartu menu (gambar, nama, harga, tombol tambah), tombol melayang keranjang belanja. | Mengklik kartu menu mengarah ke detail menu modal. Mengklik tombol keranjang mengarah ke `/keranjang`. |
| **Halaman Keranjang** | `/keranjang` | Daftar item belanjaan (foto, nama, harga, tombol +/- jumlah, catatan khusus), ringkasan harga (Subtotal, Pajak), tombol "Lanjut ke Checkout". | Tombol "Kembali Belanja" mengarah ke `/menu`. Tombol "Lanjut ke Checkout" mengarah ke `/checkout` (wajib login). |
| **Halaman Checkout** | `/checkout` | Pilihan metode (Pickup/Delivery), form alamat pengiriman (jika Delivery), pilihan waktu pengambilan (jika Pickup), ringkasan biaya (Subtotal, Biaya Kirim, Total Akhir), tombol "Pilih Pembayaran". | Tombol "Kembali ke Keranjang" mengarah ke `/keranjang`. Tombol "Pilih Pembayaran" membuka modal instruksi pembayaran Midtrans. |
| **Halaman Pelacakan Pesanan** | `/orders/:order_id` | Status visual (stepper progress bar), detail pesanan (nomor pesanan, waktu pesan, item), QR code pembayaran (jika belum bayar), tombol "Cek Status Pembayaran". | Tombol "Hubungi Restoran" mengarah ke tautan WhatsApp admin. Tombol "Kembali ke Menu" mengarah ke `/menu`. |
| **Dasbor Dapur** | `/dapur` | Kolom antrean pesanan berdasarkan status ("Dibayar" dan "Diproses"), kartu pesanan berisi daftar item menu + catatan khusus, tombol aksi ("Mulai Masak", "Siap Diambil"). | Akses terbatas hanya untuk role Dapur/Admin. Tidak ada navigasi luar selain tombol logout. |
| **Dasbor Admin** | `/admin` | Menu navigasi samping (Pesanan, Menu, Laporan Keuangan, Pengguna), tabel daftar pesanan dengan filter status, form tambah/edit menu. | Akses terbatas hanya untuk role Admin. |

## 8. API Requirements
Semua endpoint API memiliki prefix `/api/v1/` dan mengembalikan response dalam format JSON.

### Standard Error Codes
- `400 Bad Request`: Parameter input tidak valid atau tidak lengkap.
- `401 Unauthorized`: Token JWT tidak ada, kedaluwarsa, atau tidak valid.
- `403 Forbidden`: Pengguna tidak memiliki hak akses untuk resource tersebut.
- `404 Not Found`: Resource yang dicari tidak ditemukan di database.
- `409 Conflict`: Konflik data (misalnya mendaftarkan email yang sudah terdaftar).
- `422 Unprocessable Entity`: Validasi bisnis gagal (misalnya checkout dengan stok kosong).
- `500 Internal Server Error`: Kesalahan internal pada server.

### Auth Model
Otentikasi menggunakan JWT Token yang dikirim via HTTP-only Cookie bernama `token`. Endpoint publik bertanda `Public` pada tabel di bawah.

### API Endpoints Table
| Method | Endpoint | Auth | Destinasi | Request Body / Params | Response (Success 200/201) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Public | Mendaftarkan akun pelanggan baru | `{"name": "Budi", "email": "budi@email.com", "phone": "08123456789", "password": "password123"}` | `{"status": "success", "message": "User registered successfully"}` |
| **POST** | `/api/v1/auth/login` | Public | Autentikasi user dan set cookie | `{"email": "budi@email.com", "password": "password123"}` | `{"status": "success", "user": {"id": "usr-1", "name": "Budi", "role": "customer"}}` |
| **GET** | `/api/v1/menus` | Public | Mengambil daftar menu aktif | Query params: `category`, `search` | `{"status": "success", "data": [{"id": "men-1", "name": "Nasi Goreng", "price": 25000, "status": "available"}]}` |
| **POST** | `/api/v1/orders` | Customer | Membuat pesanan baru (checkout) | `{"service_type": "pickup", "pickup_time": "2023-10-25T12:30:00Z", "items": [{"menu_id": "men-1", "quantity": 2, "notes": "pedas"}]}` | `{"status": "success", "order_id": "ord-9988", "payment_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."}` |
| **GET** | `/api/v1/orders/:order_id` | Customer/Admin | Mengambil detail status pesanan | Path param: `order_id` | `{"status": "success", "data": {"id": "ord-9988", "status": "paid", "total_price": 50000}}` |
| **PATCH** | `/api/v1/orders/:order_id/status` | Dapur/Admin | Memperbarui status pesanan | Path param: `order_id`, Body: `{"status": "processing"}` | `{"status": "success", "message": "Order status updated to processing"}` |
| **POST** | `/api/v1/payments/webhook` | Public | Menerima notifikasi dari Midtrans | Body JSON dari Midtrans (signature key validasi wajib) | `{"status": "ok"}` |

## 9. Database Schema
Sistem menggunakan database relasional PostgreSQL untuk menjamin integritas data (ACID compliance) dengan skema ternormalisasi (3NF).

### Table: `users`
| Kolom | Tipe | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID unik user |
| `name` | VARCHAR(100) | NOT NULL | Nama lengkap user |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Email untuk login |
| `phone` | VARCHAR(20) | UNIQUE, NOT NULL | Nomor telepon/WhatsApp |
| `password_hash` | VARCHAR(255) | NOT NULL | Password terenkripsi bcrypt |
| `role` | VARCHAR(20) | NOT NULL, CHECK (role IN ('customer', 'kitchen', 'admin')) | Peran pengguna |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan akun |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembaruan akun |
| `deleted_at` | TIMESTAMP | NULL | Soft delete flag |

### Table: `categories`
| Kolom | Tipe | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID unik kategori |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Nama kategori (makanan, minuman, dll) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

### Table: `menus`
| Kolom | Tipe | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID unik menu |
| `category_id` | UUID | REFERENCES categories(id) ON DELETE RESTRICT | Kategori menu |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Nama menu makanan/minuman |
| `description` | TEXT | NOT NULL | Deskripsi detail menu |
| `price` | NUMERIC(12, 2) | NOT NULL, CHECK (price >= 0) | Harga menu |
| `stock` | INT | NOT NULL, DEFAULT 0, CHECK (stock >= 0) | Jumlah porsi tersedia |
| `image_url` | VARCHAR(255) | NOT NULL | Link gambar menu |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'available', CHECK (status IN ('available', 'empty')) | Status menu |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembaruan |

### Table: `orders`
| Kolom | Tipe | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID unik pesanan |
| `user_id` | UUID | REFERENCES users(id) ON DELETE RESTRICT | ID pembeli |
| `order_number` | VARCHAR(20) | UNIQUE, NOT NULL | Kode pesanan (misal: MR-20231024-001) |
| `service_type` | VARCHAR(15) | NOT NULL, CHECK (service_type IN ('pickup', 'delivery')) | Metode layanan |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending_payment', CHECK (status IN ('pending_payment', 'paid', 'processing', 'ready', 'shipping', 'completed', 'cancelled')) | Status pesanan |
| `total_price` | NUMERIC(12, 2) | NOT NULL | Total harga makanan |
| `delivery_fee` | NUMERIC(12, 2) | NOT NULL, DEFAULT 0 | Ongkos kirim |
| `grand_total` | NUMERIC(12, 2) | NOT NULL | Total bayar (total_price + delivery_fee) |
| `delivery_address`| TEXT | NULL | Alamat kirim (jika delivery) |
| `pickup_time` | TIMESTAMP | NULL | Waktu estimasi ambil (jika pickup) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pesanan dibuat |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembaruan status |

### Table: `order_items`
| Kolom | Tipe | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID item |
| `order_id` | UUID | REFERENCES orders(id) ON DELETE CASCADE | ID pesanan induk |
| `menu_id` | UUID | REFERENCES menus(id) ON DELETE RESTRICT | ID menu yang dipesan |
| `quantity` | INT | NOT NULL, CHECK (quantity > 0) | Jumlah porsi dipesan |
| `unit_price` | NUMERIC(12, 2) | NOT NULL | Harga satuan saat dipesan |
| `notes` | VARCHAR(255) | NULL | Catatan khusus pesanan |

### Table: `payments`
| Kolom | Tipe | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID transaksi |
| `order_id` | UUID | UNIQUE, REFERENCES orders(id) ON DELETE RESTRICT | ID pesanan terkait |
| `transaction_id` | VARCHAR(100) | UNIQUE, NULL | ID transaksi dari Midtrans |
| `payment_type` | VARCHAR(50) | NOT NULL | Metode (gopay, bca_va, mandiri_va, dll) |
| `amount` | NUMERIC(12, 2) | NOT NULL | Jumlah yang dibayarkan |
| `status` | VARCHAR(20) | NOT NULL, CHECK (status IN ('pending', 'settlement', 'expire', 'deny', 'cancel')) | Status bayar |
| `paid_at` | TIMESTAMP | NULL | Waktu pembayaran diverifikasi |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu transaksi dibuat |

### Database Indexes
- `idx_users_email` ON `users(email)` (untuk proses login cepat)
- `idx_orders_status` ON `orders(status)` (untuk query antrean layar dapur & pelacakan status)
- `idx_orders_user_id` ON `orders(user_id)` (untuk memuat riwayat pesanan pelanggan)
- `idx_menus_status` ON `menus(status)` (untuk filter menu aktif di katalog)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places"
    CATEGORIES ||--o{ MENUS : "contains"
    ORDERS ||--|{ ORDER_ITEMS : "has"
    MENUS ||--o{ ORDER_ITEMS : "ordered_in"
    ORDERS ||--|| PAYMENTS : "paid_by"

    USERS {
        uuid id PK
        string name
        string email UK
        string phone UK
        string password_hash
        string role
        timestamp created_at
    }

    CATEGORIES {
        uuid id PK
        string name UK
    }

    MENUS {
        uuid id PK
        uuid category_id FK
        string name UK
        text description
        numeric price
        int stock
        string status
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        string order_number UK
        string service_type
        string status
        numeric total_price
        numeric delivery_fee
        numeric grand_total
        text delivery_address
        timestamp pickup_time
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid menu_id FK
        int quantity
        numeric unit_price
        string notes
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK UK
        string transaction_id UK
        string payment_type
        numeric amount
        string status
        timestamp paid_at
    }
```

## 10. Roles & Permissions

| Role | Modul | Hak (CRUD) | Keterangan |
| :--- | :--- | :--- | :--- |
| **Pelanggan** | Menu | R | Hanya dapat melihat daftar menu yang tersedia. |
| **Pelanggan** | Pesanan | CR | Dapat membuat pesanan baru (C) dan melihat status pesanannya sendiri (R). |
| **Pelanggan** | Profil | RU | Dapat melihat dan memperbarui data profil/kontak pribadi. |
| **Dapur** | Pesanan | RU | Dapat melihat antrean pesanan (R) dan memperbarui status pesanan menjadi "Diproses" dan "Siap Diambil/Dikirim" (U). |
| **Admin** | Menu | CRUD | Memiliki kontrol penuh atas katalog menu (tambah, edit, hapus, kelola stok). |
| **Admin** | Pesanan | CRUD | Memiliki kontrol penuh atas semua pesanan, termasuk melakukan pembatalan manual atau konfirmasi pembayaran. |
| **Admin** | Laporan | R | Dapat melihat dasbor laporan keuangan dan statistik penjualan. |

## 11. Validation Rules

| Field | Aturan Validasi | Pesan Error |
| :--- | :--- | :--- |
| `users.email` | Format email valid (`^[^\s@]+@[^\s@]+\.[^\s@]+$`), Wajib diisi, Unik. | "Format email tidak valid atau email sudah digunakan." |
| `users.phone` | Format nomor telepon Indonesia (`^08[0-9]{8,11}$`), Wajib diisi, Unik. | "Nomor telepon harus diawali '08' dengan panjang 10-13 karakter." |
| `users.password` | Minimal 8 karakter, wajib mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka. | "Password minimal 8 karakter dan harus mengandung kombinasi huruf besar, kecil, serta angka." |
| `menus.price` | Wajib diisi, tipe data numerik, nilai minimum Rp 1.000. | "Harga menu tidak boleh kurang dari Rp 1.000." |
| `menus.stock` | Wajib diisi, tipe data integer, nilai minimum 0. | "Stok menu tidak boleh negatif." |
| `orders.pickup_time` | Format ISO 8601, minimal 15 menit ke depan dari waktu sekarang, maksimal 2 jam ke depan dari waktu sekarang. | "Waktu pengambilan minimal 15 menit dan maksimal 2 jam dari waktu pemesanan." |
| `orders.delivery_address`| Wajib diisi jika `service_type` bernilai `'delivery'`, minimal 20 karakter. | "Alamat pengiriman wajib diisi dengan detail minimal 20 karakter jika memilih layanan Delivery." |
| `order_items.quantity`| Wajib diisi, tipe data integer, nilai minimum 1, nilai maksimum 50 per menu. | "Jumlah pesanan per menu minimal 1 dan maksimal 50 porsi." |

## 12. Error Handling
- **Strategy**:
  - **Toast Notifications**: Digunakan untuk kesalahan kecil yang bersifat sementara di sisi klien (misal: gagal menambahkan menu karena koneksi lambat, validasi form tidak lengkap). Toast otomatis hilang dalam 3 detik.
  - **Inline Validation Message**: Ditampilkan langsung di bawah input field yang bermasalah saat pengisian form (misal: email salah format, password kurang panjang).
  - **Banner Error**: Digunakan untuk error kritis di halaman checkout atau pelacakan (misal: pembayaran ditolak, server down). Banner menetap hingga user melakukan tindakan tertentu.
  - **Idempotency Key**: Setiap transaksi pembayaran menggunakan `Idempotency-Key` berupa UUID di header request untuk mencegah proses double-charging jika terjadi kegagalan jaringan saat request dikirim ulang (*retry*).
  - **Retry Policy**: Untuk panggilan API external (Midtrans & WhatsApp Gateway), sistem menerapkan mekanisme *automatic retry* menggunakan *exponential backoff* sebanyak maksimal 3 kali percobaan.

| Skenario Error | Code | Pesan ke User | Aksi Sistem |
| :--- | :--- | :--- | :--- |
| **Koneksi Database Putus** | `500` | "Terjadi gangguan pada sistem kami. Mohon coba kembali beberapa saat lagi." | Mengirim log error detail ke sistem monitoring (Sentry) dan mengembalikan respons 500 tanpa mengekspos stack trace database ke user. |
| **Token JWT Kedaluwarsa** | `401` | "Sesi Anda telah berakhir. Silakan login kembali." | Menghapus cookie token di browser pengguna dan mengarahkan paksa pengguna ke halaman `/login`. |
| **Stok Menu Tidak Cukup** | `422` | "Maaf, stok [Nama Menu] tidak mencukupi untuk jumlah yang Anda minta." | Membatalkan pembuatan pesanan, mengembalikan status 422, dan memicu pembaruan stok menu terbaru di halaman keranjang belanja user. |
| **Pembayaran Ditolak Midtrans** | `402` | "Pembayaran Anda ditolak oleh penyedia layanan keuangan. Silakan gunakan metode pembayaran lain." | Mengubah status transaksi pembayaran menjadi `deny`, status pesanan tetap `pending_payment`, dan menampilkan tombol "Ganti Metode Pembayaran". |
| **Akses Halaman Dapur Ditolak** | `403` | "Anda tidak memiliki izin untuk mengakses halaman ini." | Mengarahkan pengguna kembali ke halaman utama `/menu`. |

## 13. Analytics & Monitoring
### Events Table
| Nama Event | Deskripsi | Properti yang Dikirim |
| :--- | :--- | :--- |
| `user_signup_completed` | Pelanggan berhasil mendaftar akun | `user_id`, `signup_method (email/whatsapp)`, `timestamp` |
| `menu_viewed` | Pelanggan melihat detail menu | `menu_id`, `menu_name`, `category_name`, `price` |
| `cart_item_added` | Pelanggan memasukkan menu ke keranjang | `menu_id`, `quantity`, `current_cart_total` |
| `checkout_initiated` | Pelanggan menekan tombol lanjut ke checkout | `cart_total_price`, `service_type (pickup/delivery)` |
| `payment_completed` | Pembayaran berhasil diverifikasi | `order_id`, `payment_method`, `grand_total`, `processing_time_seconds` |
| `order_completed` | Pesanan selesai diserahkan ke pelanggan | `order_id`, `total_duration_minutes`, `service_type` |

### Monitoring Strategy
- **Health Checks**: Menyediakan endpoint `/health` yang mengembalikan status kesehatan sistem (konektivitas Database, Redis, dan API Midtrans) dengan respons HTTP 200 OK jika semua sistem berjalan normal.
- **Error Tracking**: Integrasi dengan Sentry untuk menangkap unhandled exceptions di backend dan frontend secara real-time. Setiap error di atas level `warning` akan mengirimkan alert ke grup chat Telegram tim developer.
- **Business Metrics**: Dasbor internal Grafana untuk memantau metrik bisnis utama:
  - Jumlah pesanan masuk per jam.
  - Rata-rata waktu pemrosesan makanan di dapur (dari status "Dibayar" ke "Siap Diambil").
  - Tingkat kegagalan/pembatalan transaksi pembayaran.

## 14. Tech Stack

| Layer | Pilihan | Alasan |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) | Mendukung Server-Side Rendering (SSR) untuk memuat katalog menu dengan cepat demi SEO yang baik, serta React Client Components untuk interaksi keranjang belanja yang dinamis. |
| **Styling** | Tailwind CSS | Mempercepat proses pembuatan antarmuka responsif dengan utility classes tanpa perlu menulis file CSS terpisah. |
| **Backend API** | Node.js dengan Express (TypeScript) | Ekosistem yang matang, performa I/O non-blocking yang sangat baik untuk menangani koneksi real-time, serta dukungan TypeScript untuk type safety. |
| **Real-time Engine** | Socket.io (WebSockets) | Memungkinkan komunikasi dua arah real-time yang andal dengan mekanisme fallback otomatis ke long-polling jika koneksi WebSocket murni diblokir oleh firewall klien. |
| **Database** | PostgreSQL (v15) | Database relasional tangguh yang mendukung transaksi ACID kompleks untuk memastikan konsistensi data stok menu dan transaksi pembayaran. |
| **Caching & Session** | Redis | Digunakan untuk menyimpan session caching, rate-limiting counters, dan sebagai Message Broker (Pub/Sub) untuk sinkronisasi event WebSocket jika server backend diskalakan horizontal. |
| **ORM** | Prisma ORM | Mempermudah migrasi database dan penulisan query PostgreSQL secara type-safe di lingkungan Node.js. |
| **Payment Gateway** | Midtrans API | Gateway pembayaran lokal Indonesia paling populer dengan dokumentasi lengkap, mendukung integrasi QRIS, e-wallet, dan Virtual Account bank lokal secara aman. |

## 15. Future Improvements

### Fase 1 (MVP - Rilis Saat Ini)
- Fitur pemesanan dasar untuk satu restoran (katalog, keranjang, checkout pickup/delivery).
- Pembayaran transfer VA bank & QRIS (Midtrans).
- Layar dapur real-time berbasis web.
- Notifikasi status pesanan via WhatsApp.

### Fase 2 (Optimalisasi & Loyalitas)
- Integrasi API pihak ketiga (GoSend/GrabExpress) untuk pengantaran otomatis tanpa kurir internal restoran.
- Sistem kupon promo, diskon persentase, dan poin reward pelanggan (*Loyalty Program*).
- Dasbor analisis penjualan mendalam untuk melihat menu terlaris dan jam sibuk restoran harian.

### Fase 3 (Ekspansi Skala)
- Dukungan untuk multi-outlet (pelanggan dapat memilih outlet cabang MajuRasa terdekat).
- Aplikasi mobile native (Android & iOS) menggunakan React Native dengan fitur push notifications bawaan.
- Sistem rekomendasi menu berbasis kecerdasan buatan (AI) berdasarkan riwayat pembelian pelanggan sebelumnya.