# Troubleshooting

[Kembali ke README](README.md)

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
| `DPI-1047: Cannot locate a 64-bit Oracle Client library` saat menjalankan `demo/thick-mode.js` | Thick mode butuh Oracle Instant Client; skrip itu hanya contoh tambahan | Abaikan. Thin mode (semua lab) tidak butuh Instant Client |
