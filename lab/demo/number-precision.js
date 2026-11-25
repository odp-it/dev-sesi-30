// DEMO: NUMBER Oracle sebagai number JavaScript vs string.
// Pakai: node --env-file=.env demo/number-precision.js
import oracledb from 'oracledb';

const conn = await oracledb.getConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
});
const sql = `SELECT 12345678901234567.89 AS besar, 0.1 + 0.2 AS kecil,
                    (SELECT SUM(balance) FROM accounts) AS total_saldo FROM dual`;
try {
  const asNumber = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  const asString = await conn.execute(sql, [], {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    fetchInfo: { BESAR: { type: oracledb.STRING }, KECIL: { type: oracledb.STRING }, TOTAL_SALDO: { type: oracledb.STRING } },
  });
  console.log('Default (number):', asNumber.rows[0]);
  console.log('fetchAsString    :', asString.rows[0]);
  console.log('Hasil JS 0.1 + 0.2 =', 0.1 + 0.2);
} finally {
  await conn.close();
}
