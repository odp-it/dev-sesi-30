import express from 'express';
import { poolStatus, query } from './db/oracle.js';
import { router } from './routes/customers.js';

export const app = express();
app.use(express.json());

// Cek kesehatan: API hidup DAN database bisa di-query.
app.get('/health', async (req, res) => {
  try {
    const { rows } = await query(`SELECT 'up' AS db, TO_CHAR(SYSTIMESTAMP AT TIME ZONE '+07:00', 'YYYY-MM-DD"T"HH24:MI:SS') AS db_time FROM dual`);
    res.json({ status: 'ok', db: rows[0].DB, dbTime: `${rows[0].DB_TIME}+07:00`, pool: poolStatus() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'down', message: err.message });
  }
});

app.use('/api', router);

// Lab: endpoint ALP tim ada di src/routes/alp.js.
import { router as alpRouter } from './routes/alp.js';
app.use('/api/alp', alpRouter);

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Endpoint ${req.method} ${req.path} tidak ada` } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan di server' } });
});
