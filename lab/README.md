# Lab · Endpoint ALP Tim dengan Test

[Persiapan](../README.md) · [Troubleshooting](../TROUBLESHOOTING.md)

> Hasil Demo 1 sampai Demo 3 sudah terisi di folder ini. Buka folder ini langsung di VS Code dan lakukan persiapan project di sini (`.env`, install, atau `git init`).

**Skenario.** Schema ALP tim sudah ada di Oracle sejak Lab sesi 22. Minggu depan tim frontend mulai menyusun layar daftar dan layar detail, jadi tim lead meminta API baca data pertama untuk aplikasi ALP: daftar yang bisa disaring, detail satu data, dan data turunannya (mis. item milik satu pesanan). API dipakai orang lain, jadi input yang salah harus dijawab dengan status yang jelas, nilai dari pemakai tidak boleh bisa mengubah SQL, dan tim menyertakan test sebagai bukti. Hasil dinilai dengan rubrik di bawah.

Satu laptop per tim, schema `ALP_DEV` milik laptop itu, tabel berawalan tim.

## L.1 Siapkan tabel

Pastikan tabel ALP tim dan data contohnya ada: jalankan DDL tim dari Lab sesi 22 (`ddl-alp-<nama-tim>.sql`) lewat SQL Developer kalau belum ada. `npm run db:reset` hanya membuat ulang 4 tabel Tabungan UMKM, tabel berawalan tim tidak tersentuh.

Pilih:

- satu **resource utama** (tabel induk) dengan minimal satu kolom teks yang bisa dipakai menyaring, mis. kolom status atau kategori;
- satu **tabel anak** yang punya FK ke resource utama, dengan data contoh milik minimal 2 induk berbeda;
- satu **nilai filter** yang cocok dengan sebagian baris saja (bukan semua, bukan nol).

Kalau data contoh belum memenuhi syarat, tambahkan baris di DDL tim (data simulasi) lalu `COMMIT`.

## L.2 Isi `challenge/lab-alp.json`

| Isian | Arti |
| --- | --- |
| `resource` | Bagian URL resource utama, jamak, huruf kecil: `/api/alp/<resource>` |
| `table`, `idColumn` | Nama tabel utama dan kolom PK-nya |
| `filter.param` | Nama query string: `?<param>=nilai` |
| `filter.column` | Kolom teks (`VARCHAR2`) yang disaring dengan `=` (sama persis) |
| `filter.value` | Nilai contoh yang cocok dengan sebagian baris |
| `child.resource` | Bagian URL data anak: `/api/alp/<resource>/:id/<child.resource>` |
| `child.table`, `child.idColumn`, `child.fkColumn` | Tabel anak, PK-nya, dan kolom FK ke tabel utama |

## L.3 Tulis endpoint di `src/routes/alp.js`

Router ini sudah dipasang di `/api/alp` (lihat `src/app.js`). Pakai `query()` dari `src/db/oracle.js`, pola route sama dengan `src/routes/customers.js`. Kontrak respons:

| Request | Respons |
| --- | --- |
| `GET /api/alp/<resource>` | `200` `{ "data": [ { "id": 1, ... } ], "total": n }`, semua baris, urut id |
| `GET /api/alp/<resource>?<param>=nilai` | `200`, hanya baris yang kolomnya sama dengan nilai; `total` mengikuti hasil saringan |
| `GET /api/alp/<resource>/:id` | `200` satu object dengan `id`; tidak ada: `404` `NOT_FOUND`; bukan bilangan bulat positif: `400` `VALIDATION_ERROR` |
| `GET /api/alp/<resource>/:id/<child>` | `200` `{ "data": [ { "id": 10, ... } ] }` milik induk itu, urut id; induk tidak ada: `404` `NOT_FOUND` |

- `id` berupa angka (`Number(...)` di mapper); field lain camelCase; uang tetap string.
- Semua nilai dari pemakai lewat bind variable. Nama kolom ditulis satu per satu (tanpa `SELECT *`).
- Format error sama dengan sesi 29: `{"error":{"code","message"}}`.
- Hanya `GET`. Endpoint yang mengubah data dibahas di sesi 31.

Test cepat sambil menulis: `npm run dev`, lalu `curl` (PowerShell: `curl.exe`) di terminal kedua.

## L.4 Tulis test di `challenge/alp.test.js`

Test memakai `node:test` dan `node:assert` bawaan Node.js. `startServer()` dari `challenge/server-uji.js` menjalankan aplikasi di port acak, tanpa `npm run dev`. Ganti setiap `test.todo` dengan test sungguhan: minimal 4 test, termasuk minimal satu kasus gagal (404 atau 400). Tiap test memeriksa status **dan** isi respons.

```bash
npm run test:alp
```

Yang harus terlihat di ringkasan akhir: `pass` minimal `4`, `fail 0`.

## L.5 Cek otomatis

```bash
npm run cek:lab
```

`cek-lab.js` menjalankan aplikasi di port acak, membandingkan jawaban endpoint dengan isi database, lalu menjalankan test tim. Skrip cek hanya menjalankan `SELECT` dan request `GET`. Output berupa tabel poin (maks. 80) dan catatan untuk kriteria yang belum lulus. Perbaiki, lalu jalankan lagi.

## Rubrik Lab (100 poin)

| No | Kriteria | Poin | Dinilai oleh | Indikator keberhasilan |
| --- | --- | --- | --- | --- |
| 1 | Daftar: data sesuai database | 10 | `cek-lab.js` | `200`, `data[].id` angka, urut, sama dengan isi tabel |
| 2 | Daftar: total sesuai database | 5 | `cek-lab.js` | `total` sama dengan jumlah baris |
| 3 | Filter lewat query string | 10 | `cek-lab.js` | Hanya baris yang cocok, `total` mengikuti |
| 4 | Input `' OR '1'='1` tidak tembus | 10 | `cek-lab.js` | 0 baris atau `400 VALIDATION_ERROR` |
| 5 | Detail: `200` | 10 | `cek-lab.js` | Object dengan `id` yang diminta |
| 6 | Detail: `404 NOT_FOUND` | 5 | `cek-lab.js` | id yang tidak ada |
| 7 | Detail: `400 VALIDATION_ERROR` | 5 | `cek-lab.js` | `abc`, `0`, `1.5` |
| 8 | Data anak sesuai induk | 10 | `cek-lab.js` | Dua induk berbeda, hasil sama dengan database |
| 9 | Data anak: induk tidak ada `404` | 5 | `cek-lab.js` | Bukan `data` kosong |
| 10 | Test tim lulus | 10 | `cek-lab.js` | Minimal 4 lulus dan 0 gagal (2–3 lulus: 5) |
| 11 | Mutu test | 8 | Review tim lain | Memeriksa status dan isi, ada kasus gagal, tidak ada assert yang selalu benar |
| 12 | Review kode | 7 | Review tim lain | Bind variable, `query()` dari pool, tanpa `SELECT *`, camelCase, format error kontrak |
| 13 | Demo dan penjelasan | 5 | Review tim lain | Satu request sukses dan satu gagal ditunjukkan; satu keputusan tim dijelaskan |
| | **Total** | **100** | | |

Kriteria 1–10 = 80 poin otomatis; kriteria 11–13 = 20 poin manual. Kriteria 4, 6–7, dan 9 baru dicek setelah kriteria dasarnya (3, 5, dan 8) lulus. Target minimal 60 poin. Cek sendiri dengan `npm run cek:lab` dan daftar rubrik di atas.

## Bonus Lab (opsional, maks. +10)

Kerjakan setelah rubrik utama terpenuhi. `npm run cek:lab` harus tetap memberi skor yang sama. Bonus dinilai manual.

1. **Paging (+5).** Tambahkan `limit` (1 sampai 100, bawaan 50) dan `offset` (0 atau lebih, bawaan 0) di daftar resource, lewat bind variable. `total` tetap jumlah seluruh baris yang cocok filter. `?limit=abc` dan `?offset=-1` memberi `400 VALIDATION_ERROR`.
2. **Ringkasan (+5).** Tambahkan `GET /api/alp/ringkasan` yang mengembalikan jumlah baris per nilai kolom filter (`GROUP BY`): `{ "data": [ { "status": "...", "jumlah": 2 } ] }`.
