// DEMO: input disambung ke string SQL vs bind variable.
// Pakai: node --env-file=.env demo/sql-injection.js "' OR '1'='1"
import oracledb from 'oracledb';

const input = process.argv[2] ?? "' OR '1'='1";
const conn = await oracledb.getConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
});
const opts = { outFormat: oracledb.OUT_FORMAT_OBJECT };

try {
  console.log(`Input pencarian CIF: ${input}\n`);

  // SALAH: input jadi bagian dari teks SQL.
  const unsafeSql = `SELECT cif_no, full_name FROM customers WHERE cif_no = '${input}'`;
  console.log('1) String disambung');
  console.log(`   SQL: ${unsafeSql}`);
  const unsafe = await conn.execute(unsafeSql, [], opts);
  console.log(`   Baris kembali: ${unsafe.rows.length}\n`);

  // BENAR: SQL tetap, input dikirim terpisah sebagai nilai.
  const safeSql = 'SELECT cif_no, full_name FROM customers WHERE cif_no = :cif';
  console.log('2) Bind variable');
  console.log(`   SQL: ${safeSql}`);
  const safe = await conn.execute(safeSql, { cif: input }, opts);
  console.log(`   Baris kembali: ${safe.rows.length}`);
} finally {
  await conn.close();
}
