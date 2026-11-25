# Demo 1 · Setup Project & Koneksi Pertama (±40 menit)

> Folder ini project lengkap. Isinya starter: belum ada Demo yang diisi.
> Buka folder ini langsung di VS Code, lalu lakukan persiapan di [README utama](../README.md) (mis. salin `.env`, install, atau `git init`) **di folder ini**. Semua path relatif terhadap folder ini.

Peraga 20 menit: driver, Thin dan Thick, connect string, `.env`, koneksi pertama. Ikuti 20 menit: langkah 1.1–1.4.

## 1.1 Install dependency (±3 menit)

Buka folder `demo-1` di VS Code. Kalau muncul dialog `Do you trust the authors of the files in this folder?` (Restricted Mode), pilih **Trust Folder & Continue**. Buka terminal (**Terminal → New Terminal**):

```bash
npm ci
```

Yang harus terlihat: `added ... packages` tanpa error. Peringatan `npm warn install-scripts ... oracledb@26.0.0` boleh diabaikan: skrip itu hanya mengecek binary Thick mode, Thin mode tetap jalan. Di Windows PowerShell 5.1 peringatan ini tampil merah seperti error karena ditulis ke stderr; tetap aman.

## 1.2 Buat `.env` (±4 menit)

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Buka `.env`, ganti `ISI_PASSWORD_ALP_DEV` dengan password `ALP_DEV` dari sesi 21:

```text
DB_USER=ALP_DEV
DB_PASSWORD=ISI_PASSWORD_ALP_DEV
DB_CONNECT_STRING=localhost:1521/FREEPDB1
PORT=3000
```

`.env` sudah ada di `.gitignore`: password tidak ikut ter-commit.

## 1.3 Siapkan data simulasi (±3 menit)

Perintah ini menghapus lalu membuat ulang tabel `BRANCHES`, `CUSTOMERS`, `ACCOUNTS`, `TRANSACTIONS` di `ALP_DEV` dengan data standar (data latihan sesi 22–23 di tabel itu ikut terhapus):

```bash
npm run db:reset
```

Yang harus terlihat:

```text
db/00-drop.sql: 5 statement
db/01-schema.sql: 6 statement
db/02-seed.sql: 157 statement
┌─────────┬──────────┬───────────┬──────────┬──────────────┬────────────────┐
│ (index) │ BRANCHES │ CUSTOMERS │ ACCOUNTS │ TRANSACTIONS │ TOTAL_BALANCE  │
├─────────┼──────────┼───────────┼──────────┼──────────────┼────────────────┤
│ 0       │ 3        │ 12        │ 15       │ 125          │ '218000000.00' │
└─────────┴──────────┴───────────┴──────────┴──────────────┴────────────────┘
```

`npm run db:reset` menjalankan `node --env-file=.env scripts/db-reset.js`: variabel di `.env` masuk ke `process.env` tanpa paket tambahan.

## 1.4 Koneksi pertama (±10 menit)

Lengkapi `scripts/cek-koneksi.js` (TODO 1.4-1 sampai 1.4-4):

```js
import oracledb from 'oracledb';

const conn = await oracledb.getConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
});

try {
  const result = await conn.execute(
    `SELECT USER AS login_sebagai,
            SYS_CONTEXT('USERENV', 'CON_NAME') AS database_name,
            (SELECT COUNT(*) FROM customers) AS jumlah_nasabah
       FROM dual`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT },
  );
  console.log('Mode driver  :', oracledb.thin ? 'Thin' : 'Thick');
  console.log('node-oracledb:', oracledb.versionString);
  console.log('Database     :', conn.oracleServerVersionString);
  console.table(result.rows);
} finally {
  await conn.close();
}
```

Jalankan:

```bash
npm run cek
```

Yang harus terlihat:

```text
Mode driver  : Thin
node-oracledb: 26.0.0
Database     : 23.26.4.0.0
┌─────────┬───────────────┬───────────────┬────────────────┐
│ (index) │ LOGIN_SEBAGAI │ DATABASE_NAME │ JUMLAH_NASABAH │
├─────────┼───────────────┼───────────────┼────────────────┤
│ 0       │ 'ALP_DEV'     │ 'FREEPDB1'    │ 12             │
└─────────┴───────────────┴───────────────┴────────────────┘
```

Kalau gagal, cocokkan pesan error dengan tabel Troubleshooting (password, service name, port).

## Tantangan tambahan Demo 1 (opsional)

Kerjakan di file baru `scripts/cek-koneksi-lanjut.js`, jangan mengubah `cek-koneksi.js`. Jalankan dengan `node --env-file=.env scripts/cek-koneksi-lanjut.js`.

1. Bungkus pembuatan koneksi dengan `try/catch`. Kalau gagal, cetak satu baris `Gagal terhubung: <baris pertama pesan error>` (tanpa stack trace) dan set `process.exitCode = 1`. Uji dengan password salah tanpa mengubah `.env`: variabel yang sudah ada di environment lebih diutamakan daripada `.env`. Bash/zsh: `DB_PASSWORD=salah node --env-file=.env scripts/cek-koneksi-lanjut.js`. PowerShell: `$env:DB_PASSWORD = 'salah'`, jalankan skrip, lalu `Remove-Item Env:DB_PASSWORD` (kalau lupa, password salah menempel di terminal itu).
2. Cetak waktu membuat koneksi dalam milidetik (`performance.now()`) dan jumlah nasabah per segmen (`GROUP BY segment`). Target: `INDIVIDU` 6 dan `UMKM` 6.
