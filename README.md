# 30 - Oracle Database Integration with Node.js

Lab ini menyambungkan aplikasi Express ke Oracle dengan node-oracledb Thin mode. Hasil akhirnya: koneksi dibaca dari `.env`, satu connection pool untuk seluruh aplikasi, endpoint `/health` yang benar-benar mengecek database, tiga endpoint baca data dengan bind variable, satu skrip CRUD dasar (INSERT, UPDATE, DELETE dengan commit eksplisit), dan endpoint baca data untuk aplikasi ALP tim beserta test-nya.

## Tujuan

1. Menyimpan konfigurasi koneksi di `.env` dan membacanya dengan `node --env-file`.
2. Membedakan Thin mode dan Thick mode, lalu terhubung ke Oracle dengan Thin mode tanpa Instant Client.
3. Membuat connection pool yang dibuka saat start dan ditutup saat aplikasi berhenti.
4. Menulis endpoint `/health` dan query berparameter dengan bind variable.
5. Menjalankan INSERT, UPDATE, dan DELETE dengan bind variable dan commit eksplisit lewat connection pool.
6. Membangun endpoint baca data untuk aplikasi ALP tim dan mengujinya dengan `node:test`.

## Estimasi Waktu

Format sesi: **4 Demo + 1 Lab**. Di tiap Demo, instruktur memperagakan lalu peserta mengikuti dari file starter dan langkah bernomor. Lab adalah tugas tim berrubrik 100 poin dengan cek otomatis.

Urutan prioritas: Demo 1 dan 2 inti sesi (koneksi, pool, `/health`): wajib selesai. Demo 3 (query berparameter) penting. Demo 4 (CRUD dasar) penerapan, boleh dilanjutkan setelah kelas. Lab boleh dilanjutkan setelah kelas. Tiap Demo punya **Tantangan tambahan** dan Lab punya **Bonus Lab** untuk yang selesai lebih cepat (tidak wajib).

| Bagian | Instruktur memperagakan | Peserta mengikuti | Durasi |
| --- | --- | --- | --- |
| Demo 1 · Setup project & koneksi pertama | 20 menit | 20 menit | ±40 menit |
| Demo 2 · Connection pool dan endpoint `/health` (dua tahap) | 18 menit | 40 menit | ±58 menit |
| Demo 3 · Query berparameter | 12 menit | 28 menit | ±40 menit |
| Demo 4 · CRUD dasar | 7 menit | 15 menit | ±22 menit |
| Lab · Endpoint ALP tim dengan test | | Tim | ±35 menit |
| **Total** | | | **±195 menit** |

Sisa 15 menit dari 210 menit konten dipakai untuk pembuka (10) dan penutup (5).

## Environment & Tools

Versi dikunci, dicek 22 Nov 2026. Jangan update tool selama kelas.

| Tool | Versi | Catatan |
| --- | --- | --- |
| Node.js | 26 LTS (fallback 24 LTS) | `node --version` |
| npm | 11 (bawaan Node) | |
| Container Oracle dari sesi 21 | `oracle-alp`, image `container-registry.oracle.com/database/free:23.26.4.0-lite` | Docker Desktop (atau Rancher Desktop, CLI `docker` sama). Status `(healthy)` |
| User database | `ALP_DEV` di `FREEPDB1` | Password dari sesi 21 |
| Paket npm | `express` 5.3.0, `oracledb` 26.0.0 | Dikunci di `package-lock.json` |
| VS Code | terbaru | Terminal terintegrasi |

Thin mode tidak butuh Oracle Instant Client. Instant Client hanya dipakai di demo Thick mode di layar.

### Cek kesiapan

| Item | Cara cek | Harus terlihat |
| --- | --- | --- |
| Node | `node --version` | `v26.x` (atau `v24.x`) |
| Oracle | `docker ps` | `oracle-alp ... (healthy)` |
| Port 3000 | Tidak ada aplikasi lain di `http://localhost:3000` | Browser: tidak bisa terhubung |

Kalau container mati: `docker start oracle-alp`, tunggu `(healthy)`.

## Struktur Repo

| Folder | Isi | Sudah terisi |
| --- | --- | --- |
| [`demo-1/`](demo-1/) | Demo 1 · Setup Project & Koneksi Pertama | belum ada |
| [`demo-2/`](demo-2/) | Demo 2 · Connection Pool dan Endpoint `/health` | Demo 1 |
| [`demo-3/`](demo-3/) | Demo 3 · Query Berparameter | Demo 1–2 |
| [`demo-4/`](demo-4/) | Demo 4 · CRUD Dasar | Demo 1–3 |
| [`lab/`](lab/) | Lab · Endpoint ALP Tim dengan Test | Demo 1–3 |

Setiap folder adalah project lengkap yang berdiri sendiri. Konfigurasi lokal (`.env`), hasil install, dan repo Git dibuat per folder. Database yang dipakai tetap sama.

## Demo dan Lab

Demo 1–4 dikerjakan individu; Lab dikerjakan per tim. Tiap langkah: kerjakan, jalankan, cocokkan dengan "Yang harus terlihat".

### Target

| Bagian | Hasil |
| --- | --- |
| Demo 1 | `npm run cek` mencetak `Mode driver  : Thin` dan login `ALP_DEV` |
| Demo 2 | `npm run dev` mencetak `Pool siap: 1 koneksi terbuka`, Ctrl+C mencetak `Pool ditutup`; `GET /health` mengembalikan `"db":"up"` |
| Demo 3 | `GET /api/customers?segment=UMKM&q=contoh` mengembalikan 6 nasabah; id salah 400, id tidak ada 404 |
| Demo 4 | `npm run crud` mencetak `rowsAffected=1` untuk INSERT, UPDATE, DELETE, lalu `0` untuk DELETE kedua |
| Lab | `npm run cek:lab` mencetak skor otomatis untuk endpoint ALP tim (maks. 80) |

### Studi Kasus

Tabungan UMKM (data simulasi) sudah punya tabel cabang, nasabah, rekening, dan transaksi di Oracle sejak sesi 22. Kontrak API dari sesi 29 butuh backend yang bisa membaca tabel itu. Sesi ini membangun fondasinya: koneksi, pool, health check, query aman, dan operasi tulis dasar. Sesi 31 melanjutkan ke endpoint REST CRUD lengkap dan transfer.

### Kriteria Selesai

- [ ] `npm run cek` mencetak `Thin`, `ALP_DEV`, `FREEPDB1`, `12`
- [ ] `npm run dev` mencetak `Pool siap: 1 koneksi terbuka`; Ctrl+C mencetak `Pool ditutup`
- [ ] Password salah membuat aplikasi berhenti saat start dengan `ORA-01017`
- [ ] `GET /health` mengembalikan `"db":"up"`
- [ ] `GET /api/customers?segment=UMKM&q=contoh` mengembalikan `"total":6`
- [ ] `/api/customers/999` 404 dan `/api/customers/abc` 400
- [ ] `npm run crud` mencetak `rowsAffected=1` untuk INSERT, UPDATE, DELETE, dan `0` untuk DELETE kedua
- [ ] Setelah `npm run crud`, `GET /api/customers` tetap mengembalikan 12 nasabah
- [ ] Tidak ada nilai dari `req.query` atau `req.params` yang disambung ke teks SQL
- [ ] Lab: `npm run test:alp` `fail 0` dan `npm run cek:lab` menampilkan skor otomatis (target minimal 48 dari 80, setara 60%)

## Verifikasi & Expected Result

| Cek | Expected result |
| --- | --- |
| `npm run db:reset` | `3`, `12`, `15`, `125`, `'218000000.00'` |
| `npm run cek` | Mode `Thin`, node-oracledb `26.0.0`, database `23.26.4.0.0` |
| `GET /health` | `200`, `status`, `db`, `dbTime` berakhiran `+07:00`, `pool.open` ≥ 1 |
| `GET /api/branches` | 3 cabang `KCP-SIM-01` sampai `KCP-SIM-03` |
| `GET /api/customers` | 12 nasabah, urut `id` |
| `GET /api/customers/1/accounts` | 2 rekening, `balance` berupa string |
| `npm run crud` | `rowsAffected` 1 (INSERT), 1 (UPDATE), 1 (DELETE), 0 (DELETE kedua); nasabah tetap 12 |
| Lab | `npm run cek:lab` menampilkan 10 baris kriteria dan subtotal otomatis maks. 80 |

## Troubleshooting

| Masalah / Error | Penyebab | Solusi |
| --- | --- | --- |
| `ORA-01017: invalid credential or not authorized; logon denied` | Password `ALP_DEV` di `.env` salah | Perbaiki `DB_PASSWORD`; kalau lupa password, jalankan ulang skrip setup sesi 21 untuk mengganti password |
| `NJS-518: cannot connect to Oracle Database. Service "FREEPDB" is not registered with the listener` | Service name salah ketik | `DB_CONNECT_STRING=localhost:1521/FREEPDB1` |
| `NJS-503: connection to host 127.0.0.1 port 1521 could not be established` | Container mati atau port salah | `docker start oracle-alp`, tunggu `(healthy)`; cek port di `docker ps` |
| `node: .env: not found` | File `.env` belum dibuat | Ulangi langkah 1.2 |
| `Error: Variabel environment belum diisi: DB_USER, ...` | `node src/server.js` dijalankan tanpa `--env-file` | Pakai `npm run dev` atau `npm start` |
| `NJS-040: connection request timeout. Request exceeded "queueTimeout"` | Koneksi dipinjam tapi tidak dikembalikan (`conn.close()` lupa), pool habis | Pastikan `conn.close()` di blok `finally` (lihat `demo/lupa-close.js`) |
| `TypeError: Cannot read properties of undefined (reading 'getConnection')` | `query()` dipanggil sebelum `initPool()` | `await initPool()` sebelum `app.listen` |
| `Server gagal start di port 3000: listen EADDRINUSE: address already in use :::3000` | Aplikasi lain atau terminal lain masih jalan di port 3000 | Hentikan terminal lama (Ctrl+C) atau ganti `PORT` di `.env` |
| `ORA-00942: table or view does not exist` | Tabel belum ada di `ALP_DEV` | `npm run db:reset` |
| `ORA-00001: unique constraint (ALP_DEV.UQ_CUSTOMERS_CIF) violated` saat `npm run crud` | Run sebelumnya berhenti setelah INSERT dan sebelum DELETE, nasabah `CIF-SIM-9001` masih ada | `npm run db:reset` |
| `npm run crud` tidak error tetapi perubahan tidak terlihat di database | `await conn.commit()` terlewat; perubahan dibatalkan saat koneksi dilepas | Tambahkan `await conn.commit()` setelah tiap statement |
| `curl` di PowerShell menampilkan tabel `StatusCode`, `Content` | PowerShell 5.1 memetakan `curl` ke `Invoke-WebRequest` | Ketik `curl.exe` |
| `Invoke-WebRequest : Missing an argument for parameter 'InFile'` (PowerShell 5.1) | `curl -i` dibaca sebagai opsi `Invoke-WebRequest` (`-i` jadi `-InFile`); pesan error bergantung opsi yang dipakai | Ketik `curl.exe -i ...` |
| Dialog `Do you trust the authors of the files in this folder?` dan tombol Run belum aktif | VS Code membuka folder baru dalam Restricted Mode | Pilih **Trust Folder & Continue** |
| `customer_id` hasil `npm run crud` `21`, bukan `13` | Kolom identity memakai cache 20 nomor; nomor di cache hilang kalau pool kosong atau database restart | Bukan kesalahan; yang dicek `rowsAffected` dan jumlah nasabah tetap 12 |
| `cek:lab`: `lab-alp.json belum siap` | Masih ada isian `ISI_...`, atau nama tabel/kolom memuat spasi atau tanda baca | Isi semua baris `challenge/lab-alp.json` |
| `cek:lab`: `Cek berhenti: ORA-00942` | Nama tabel di `lab-alp.json` salah, atau DDL tim belum dijalankan di `ALP_DEV` | Samakan nama tabel, jalankan DDL tim |
| `cek:lab`: `Error dari aplikasi: ...` | Error di route tim (SQL salah, mapper salah) | Perbaiki pesan pertama yang disebut; `npm run dev` menampilkan stack trace lengkap |
| `cek:lab`: `filter.value harus menyaring sebagian data` | Nilai filter cocok dengan semua baris atau nol baris | Pilih nilai lain atau tambah data contoh |
| `cek:lab`: `data[].id berupa angka` gagal padahal data benar | `id` masih string (karena `fetchAsString`) atau memakai nama lain | `id: Number(r.KOLOM_ID)` di mapper |
| `DPI-1047: Cannot locate a 64-bit Oracle Client library` saat menjalankan `demo/thick-mode.js` | Thick mode butuh Oracle Instant Client; skrip itu hanya demo instruktur | Abaikan. Thin mode (semua lab) tidak butuh Instant Client |

## Cleanup

Hentikan aplikasi dengan **Ctrl+C**. Tabel ALP tim dibiarkan. Container `oracle-alp` dan data `ALP_DEV` tetap dipakai sesi 31–33; cukup `docker stop oracle-alp` setelah kelas kalau RAM perlu dilegakan.

Sesi 31 memakai pool dan helper `query` ini untuk membangun semua endpoint kontrak API: pagination, endpoint REST CRUD nasabah, mutasi, transfer dengan commit/rollback, dan error handler terpusat.
