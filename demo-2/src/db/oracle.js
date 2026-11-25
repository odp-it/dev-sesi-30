// Langkah 2.1. Satu connection pool untuk seluruh aplikasi.
import oracledb from 'oracledb';
import { config } from '../config.js';

// TODO 2.1-1: atur oracledb.outFormat ke OUT_FORMAT_OBJECT
//            dan oracledb.fetchAsString supaya NUMBER diambil sebagai string.

let pool;

export async function initPool() {
  // TODO 2.1-2: buat pool dengan oracledb.createPool(...) memakai config.db
  //            (user, password, connectString, poolMin, poolMax, poolIncrement: 1).
  // TODO 2.1-3: pinjam satu koneksi lalu kembalikan (fail fast), cetak jumlah koneksi terbuka.
}

export async function closePool() {
  // TODO 2.1-4: tutup pool dengan waktu tunggu 10 detik.
}

export function poolStatus() {
  return { open: pool.connectionsOpen, inUse: pool.connectionsInUse, max: pool.poolMax };
}

// Pinjam koneksi dari pool, jalankan satu statement, kembalikan koneksi (selalu, walau error).
export async function query(sql, binds = {}, options = {}) {
  // TODO 2.1-5: pool.getConnection() -> conn.execute(sql, binds, options) -> conn.close() di blok finally.
}

// Demo 4. Pinjam satu koneksi dari pool untuk beberapa statement yang di-commit sendiri.
// Pemanggil wajib `await conn.close()` di blok `finally`.
export function getConnection() {
  return pool.getConnection();
}
