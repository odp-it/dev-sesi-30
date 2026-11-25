// Langkah 1.4. Koneksi pertama: satu koneksi standalone, satu query, lalu tutup.
// Pakai: npm run cek
import oracledb from 'oracledb';

// TODO 1.4-1: buka koneksi dengan oracledb.getConnection({ user, password, connectString }).
//            Ambil nilainya dari process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_CONNECT_STRING.
const conn = null;

try {
  // TODO 1.4-2: jalankan query cek dari README (LOGIN_SEBAGAI, DATABASE_NAME, JUMLAH_NASABAH)
  //            dengan opsi { outFormat: oracledb.OUT_FORMAT_OBJECT }.

  // TODO 1.4-3: cetak mode driver (oracledb.thin), oracledb.versionString,
  //            conn.oracleServerVersionString, lalu console.table(result.rows).
} finally {
  // TODO 1.4-4: tutup koneksi.
}
