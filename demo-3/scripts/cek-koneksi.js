// Koneksi pertama: satu koneksi standalone, satu query, lalu tutup.
// Pakai: npm run cek
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
