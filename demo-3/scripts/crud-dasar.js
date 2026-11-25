// Demo 4. CRUD dasar: INSERT, UPDATE, DELETE satu nasabah uji lewat connection pool, dengan commit eksplisit.
// Pakai: npm run crud
import oracledb from 'oracledb';
import { closePool, getConnection, initPool } from '../src/db/oracle.js';

await initPool();
const conn = await getConnection();

try {
  // TODO 4.1: INSERT satu nasabah uji (cif_no CIF-SIM-9001, segment UMKM, cabang KCP-SIM-01).
  //          Nilai lewat bind variable; branch_id diambil dengan subquery dari branch_code (:cabang).
  //          Tambahkan RETURNING customer_id INTO :id dengan bind OUT { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }.
  //          Opsi { autoCommit: false }, lalu await conn.commit(). Cetak rowsAffected dan id baru (result.outBinds.id[0]).

  // TODO 4.2: UPDATE phone dan email nasabah itu dengan bind (WHERE customer_id = :id).
  //          Commit, cetak rowsAffected, lalu SELECT baris itu dan tampilkan dengan console.table.

  // TODO 4.3: DELETE nasabah itu (WHERE customer_id = :id). Commit, cetak rowsAffected.
  //          Jalankan DELETE yang sama sekali lagi: rowsAffected harus 0.
} catch (err) {
  await conn.rollback(); // perubahan yang belum di-commit dibatalkan
  throw err;
} finally {
  await conn.close();
  await closePool();
}
