# 30 - Oracle Database Integration with Node.js

Lab ini menyambungkan aplikasi Express ke Oracle dengan node-oracledb Thin mode. Hasil akhirnya: koneksi dibaca dari `.env`, satu connection pool untuk seluruh aplikasi, endpoint `/health` yang benar-benar mengecek database, tiga endpoint baca data dengan bind variable, satu skrip CRUD dasar (INSERT, UPDATE, DELETE dengan commit eksplisit), dan endpoint baca data untuk aplikasi ALP tim beserta test-nya.

## Environment & Tools

Versi dikunci, dicek 22 Nov 2026. Jangan update tool di tengah pengerjaan.

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

## Studi Kasus

Tabungan UMKM (data simulasi) sudah punya tabel cabang, nasabah, rekening, dan transaksi di Oracle sejak sesi 22. Kontrak API dari sesi 29 butuh backend yang bisa membaca tabel itu. Sesi ini membangun fondasinya: koneksi, pool, health check, query aman, dan operasi tulis dasar. Sesi 31 melanjutkan ke endpoint REST CRUD lengkap dan transfer.

## Bantuan

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md): pesan error dan cara memperbaikinya.
- [CHECKLIST.md](CHECKLIST.md): hasil yang harus terlihat dan kriteria selesai.

## Cleanup

Hentikan aplikasi dengan **Ctrl+C**. Tabel ALP tim dibiarkan. Container `oracle-alp` dan data `ALP_DEV` tetap dipakai sesi 31–33; cukup `docker stop oracle-alp` kalau sudah selesai kalau RAM perlu dilegakan.

Sesi 31 memakai pool dan helper `query` ini untuk membangun semua endpoint kontrak API: pagination, endpoint REST CRUD nasabah, mutasi, transfer dengan commit/rollback, dan error handler terpusat.
