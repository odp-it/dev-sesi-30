import express from 'express';
import { poolStatus, query } from './db/oracle.js';
import { router } from './routes/customers.js';

export const app = express();
app.use(express.json());

// TODO 2.5: endpoint GET /health
//   - query SELECT 'up' AS db, waktu database (WIB) FROM dual
//   - sukses: 200 { status: 'ok', db: 'up', dbTime, pool: poolStatus() }
//   - gagal : 503 { status: 'error', db: 'down', message }

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
