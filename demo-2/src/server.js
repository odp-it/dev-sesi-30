// Langkah 2.2. Titik masuk aplikasi.
import { config } from './config.js';
import { closePool, initPool } from './db/oracle.js';
import { app } from './app.js';

// TODO 2.2-1: buka pool SEBELUM app.listen.

const server = app.listen(config.port, (err) => {
  if (err) {
    // Express 5 memanggil callback ini juga saat gagal listen (mis. port sudah dipakai).
    console.error(`Server gagal start di port ${config.port}: ${err.message}`);
    process.exit(1); // setelah 2.2: tutup pool dulu, lihat README
  }
  console.log(`API jalan di http://localhost:${config.port}`);
});

// TODO 2.2-2: tangani SIGINT dan SIGTERM: server.close(), await closePool(), process.exit(0).
