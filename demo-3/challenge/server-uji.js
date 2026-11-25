// Menjalankan aplikasi di port acak untuk test dan cek otomatis. File ini sudah lengkap: tidak perlu diubah.
import { once } from 'node:events';
import { app } from '../src/app.js';
import { closePool, initPool } from '../src/db/oracle.js';

export async function startServer() {
  try {
    await initPool();
  } catch (err) {
    // Pool yang gagal login harus ditutup. Kalau dibiarkan, percobaan login berulang bisa mengunci user database.
    await closePool().catch(() => {});
    throw err;
  }
  const server = app.listen(0, '127.0.0.1'); // port 0: dipilih sistem, tidak bentrok dengan npm run dev
  try {
    await once(server, 'listening'); // event 'error' membuat baris ini melempar error
  } catch (err) {
    await closePool();
    throw err;
  }
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async stop() {
      server.closeAllConnections();
      server.close();
      await closePool();
    },
  };
}
