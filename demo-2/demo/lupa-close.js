// DEMO: lupa conn.close() membuat pool kehabisan koneksi.
// Pakai: node --env-file=.env demo/lupa-close.js
import oracledb from 'oracledb';

const pool = await oracledb.createPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 0,
  poolMax: 2,
  queueTimeout: 3000, // bawaan 60000 ms; dipendekkan supaya demo cepat
});

for (let request = 1; request <= 3; request++) {
  const t = performance.now();
  try {
    const conn = await pool.getConnection();
    await conn.execute('SELECT 1 FROM dual');
    // conn.close() SENGAJA tidak dipanggil
    console.log(`Request ${request}: berhasil, koneksi dipakai ${pool.connectionsInUse}/${pool.poolMax}`);
  } catch (err) {
    console.log(`Request ${request}: gagal setelah ${Math.round(performance.now() - t)} ms -> ${err.message}`);
  }
}
await pool.close(0);
