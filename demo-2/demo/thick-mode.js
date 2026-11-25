// DEMO INSTRUKTUR: Thick mode memakai Oracle Instant Client.
// Peserta tidak perlu menjalankan ini: lab memakai Thin mode (tanpa Instant Client).
// Pakai: ORACLE_CLIENT_LIB_DIR=/path/instantclient node --env-file=.env demo/thick-mode.js
// Linux: jangan isi libDir, atur lewat ldconfig / LD_LIBRARY_PATH.
import oracledb from 'oracledb';

console.log('Sebelum initOracleClient, mode:', oracledb.thin ? 'Thin' : 'Thick');

// Harus dipanggil SEBELUM koneksi atau pool pertama dibuat.
oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });

const conn = await oracledb.getConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
});
try {
  console.log('Sesudah initOracleClient, mode:', oracledb.thin ? 'Thin' : 'Thick');
  console.log('Instant Client :', oracledb.oracleClientVersionString);
  console.log('Database       :', conn.oracleServerVersionString);
  const { rows } = await conn.execute('SELECT COUNT(*) AS jumlah_nasabah FROM customers', [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.table(rows);
} finally {
  await conn.close();
}
