// Satu connection pool untuk seluruh aplikasi.
import oracledb from 'oracledb';
import { config } from '../config.js';

// Baris hasil query berupa object { KOLOM: nilai }.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// NUMBER diambil sebagai string supaya uang NUMBER(15,2) tidak berubah jadi float JavaScript.
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

export function poolStatus() {
  return { open: pool.connectionsOpen, inUse: pool.connectionsInUse, max: pool.poolMax };
}

// Pinjam koneksi dari pool, jalankan satu statement, kembalikan koneksi (selalu, walau error).
export async function query(sql, binds = {}, options = {}) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.execute(sql, binds, options);
  } finally {
    if (conn) await conn.close();
  }
}

// Demo 4. Pinjam satu koneksi dari pool untuk beberapa statement yang di-commit sendiri.
// Pemanggil wajib `await conn.close()` di blok `finally`.
export function getConnection() {
  return pool.getConnection();
}
