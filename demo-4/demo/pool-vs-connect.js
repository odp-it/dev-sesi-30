// DEMO: buka-tutup koneksi tiap request vs pinjam dari pool.
// Pakai: node --env-file=.env demo/pool-vs-connect.js 50
import oracledb from 'oracledb';

const N = Number(process.argv[2] ?? 50);
const cfg = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
};
const sql = 'SELECT COUNT(*) FROM customers';

let t = performance.now();
for (let i = 0; i < N; i++) {
  const conn = await oracledb.getConnection(cfg);
  await conn.execute(sql);
  await conn.close();
}
const standalone = performance.now() - t;

const pool = await oracledb.createPool({ ...cfg, poolMin: 2, poolMax: 2 });
t = performance.now();
for (let i = 0; i < N; i++) {
  const conn = await pool.getConnection();
  await conn.execute(sql);
  await conn.close(); // kembali ke pool, tidak benar-benar ditutup
}
const pooled = performance.now() - t;
await pool.close(0);

console.table([
  { cara: 'getConnection() tiap query', query: N, totalMs: Math.round(standalone), rataRataMs: +(standalone / N).toFixed(1) },
  { cara: 'pool.getConnection()', query: N, totalMs: Math.round(pooled), rataRataMs: +(pooled / N).toFixed(1) },
]);
