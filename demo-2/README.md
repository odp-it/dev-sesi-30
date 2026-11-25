# Demo 2 · Connection Pool dan Endpoint `/health`

[Persiapan](../README.md) · [Troubleshooting](../TROUBLESHOOTING.md)

> Hasil Demo 1 sudah terisi di folder ini. Buka folder ini langsung di VS Code dan lakukan persiapan project di sini (`.env`, install, atau `git init`).

Kerjakan 2.1–2.6: connection pool, lalu endpoint `/health`.

## 2.1 Modul pool

Lengkapi `src/db/oracle.js` (TODO 2.1-1 sampai 2.1-5):

```js
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.NUMBER];

let pool;

export async function initPool() {
  pool = await oracledb.createPool({
    user: config.db.user,
    password: config.db.password,
    connectString: config.db.connectString,
    poolMin: config.db.poolMin,
    poolMax: config.db.poolMax,
    poolIncrement: 1,
  });
  // Thin mode membuat pool tanpa langsung login. Pinjam satu koneksi supaya
  // password atau service name yang salah langsung ketahuan saat aplikasi start.
  const conn = await pool.getConnection();
  await conn.close();
  console.log(`Pool siap: ${pool.connectionsOpen} koneksi terbuka (min ${pool.poolMin}, max ${pool.poolMax})`);
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.close(10);
    console.log('Pool ditutup');
  }
}

export async function query(sql, binds = {}, options = {}) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.execute(sql, binds, options);
  } finally {
    if (conn) await conn.close();
  }
}
```

`conn.close()` pada koneksi dari pool tidak memutus koneksi ke database: koneksi dikembalikan ke pool untuk request berikutnya. Karena ada di `finally`, koneksi tetap kembali walaupun query error.

## 2.2 Buka dan tutup pool di `server.js`

```js
await initPool();
const server = app.listen(config.port, async (err) => {
  if (err) {
    // Express 5 memanggil callback ini juga saat gagal listen (mis. port sudah dipakai).
    console.error(`Server gagal start di port ${config.port}: ${err.message}`);
    await closePool();
    process.exit(1);
  }
  console.log(`API jalan di http://localhost:${config.port}`);
});

let closing = false;
async function shutdown(signal) {
  if (closing) return; // sinyal kedua (mis. dari --watch) diabaikan
  closing = true;
  console.log(`${signal} diterima, menutup server dan pool...`);
  server.close();
  await closePool();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

Express 5 memanggil callback `app.listen` juga ketika gagal listen, dengan error sebagai argumen. Tanpa cek `err`, aplikasi mencetak `API jalan` padahal port sudah dipakai proses lain, dan pool tetap terbuka.

## 2.3 Jalankan

```bash
npm run dev
```

Yang harus terlihat:

```text
Pool siap: 1 koneksi terbuka (min 1, max 5)
API jalan di http://localhost:3000
```

Tekan **Ctrl+C**. Yang harus terlihat:

```text
SIGINT diterima, menutup server dan pool...
Pool ditutup
```

## 2.4 Test konfigurasi salah

Ubah sementara `DB_PASSWORD` di `.env` menjadi `salah`, lalu `npm run dev`. Aplikasi berhenti saat start:

```text
Error: ORA-01017: invalid credential or not authorized; logon denied
```

Kembalikan password yang benar. Tanpa langkah "pinjam satu koneksi" di 2.1, aplikasi tetap start dan error baru muncul saat request pertama.

Langkah 2.5 dan 2.6 dikerjakan setelah materi health check (`/health` memakai pool dari 2.1–2.3).

## 2.5 Tulis endpoint

Di `src/app.js`, ganti TODO 2.5:

```js
app.get('/health', async (req, res) => {
  try {
    const { rows } = await query(`SELECT 'up' AS db, TO_CHAR(SYSTIMESTAMP AT TIME ZONE '+07:00', 'YYYY-MM-DD"T"HH24:MI:SS') AS db_time FROM dual`);
    res.json({ status: 'ok', db: rows[0].DB, dbTime: `${rows[0].DB_TIME}+07:00`, pool: poolStatus() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'down', message: err.message });
  }
});
```

## 2.6 Test

`npm run dev` harus masih jalan (atau jalankan lagi). Buka terminal kedua:

```bash
curl http://localhost:3000/health
```

PowerShell: ketik `curl.exe` (bukan `curl`), argumen sama.

Yang harus terlihat (waktu berbeda):

```json
{"status":"ok","db":"up","dbTime":"2026-11-22T08:11:55+07:00","pool":{"open":1,"inUse":0,"max":5}}
```

## Tantangan tambahan Demo 2 (opsional)

1. Tambahkan `latencyMs` ke respons `/health`: lama query database dalam milidetik (`performance.now()` sebelum dan sesudah `query()`), dibulatkan. Target: angka kecil (satu atau dua digit) pada laptop biasa.
2. Buktikan batas pool. Buat route sementara `GET /lambat` yang menjalankan `BEGIN DBMS_SESSION.SLEEP(2); END;` lewat `query()` dan mengembalikan lama selesainya dalam milidetik plus `poolStatus()`. Tambahkan `DB_POOL_MAX=2` di `.env`, jalankan ulang `npm run dev`, lalu kirim tiga request ke `/lambat` hampir bersamaan (tiga terminal, atau tiga tab browser). Catat waktu selesai tiap request dan tulis satu kalimat di komentar: kenapa salah satunya lebih lama? Setelah itu hapus route `/lambat` dan `DB_POOL_MAX=2`.
