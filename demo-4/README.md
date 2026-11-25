# Demo 4 · CRUD Dasar

[Persiapan](../README.md) · [Troubleshooting](../TROUBLESHOOTING.md)

> Hasil Demo 1 sampai Demo 3 sudah terisi di folder ini. Buka folder ini langsung di VS Code dan lakukan persiapan project di sini (`.env`, install, atau `git init`).

Lengkapi skrip CRUD dasar.

Sampai Demo 3 aplikasi hanya membaca data. Demo 4 mengubah data lewat satu skrip: tambah satu nasabah uji, ubah telepon dan emailnya, lalu hapus. Skrip meminjam satu koneksi dari pool dengan `getConnection()` (sudah ada di `src/db/oracle.js`) dan mengembalikannya di blok `finally`. Nilai tetap lewat bind variable. `autoCommit` di node-oracledb bawaannya `false`: perubahan baru permanen setelah `await conn.commit()`, dan transaksi yang belum di-commit dibatalkan saat koneksi dilepas. REST endpoint untuk CRUD dan transaksi beberapa statement (transfer) dibahas di sesi 31.

Skrip ini menyisakan data seperti semula: nasabah uji (`CIF-SIM-9001`) dihapus di akhir.

## 4.1 INSERT dengan RETURNING

Di `scripts/crud-dasar.js`, ganti TODO 4.1:

```js
const insert = await conn.execute(
  `INSERT INTO customers (cif_no, full_name, email, phone, segment, branch_id)
   VALUES (:cif, :nama, :email, :phone, :segment, (SELECT branch_id FROM branches WHERE branch_code = :cabang))
   RETURNING customer_id INTO :id`,
  {
    cif: 'CIF-SIM-9001',
    nama: 'Toko Uji Contoh',
    email: 'toko.uji@example.com',
    phone: '0800-0000-9001',
    segment: 'UMKM',
    cabang: 'KCP-SIM-01',
    id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  },
  { autoCommit: false },
);
const id = insert.outBinds.id[0];
await conn.commit();
console.log(`INSERT  rowsAffected=${insert.rowsAffected}  customer_id=${id}`);
```

`RETURNING customer_id INTO :id` mengembalikan id baru tanpa `SELECT` lagi. Hasilnya array, jadi diambil dengan `outBinds.id[0]`.

## 4.2 UPDATE phone dan email

Ganti TODO 4.2:

```js
const update = await conn.execute(
  'UPDATE customers SET phone = :phone, email = :email WHERE customer_id = :id',
  { phone: '0800-0000-9002', email: 'toko.uji.baru@example.com', id },
  { autoCommit: false },
);
await conn.commit();
console.log(`UPDATE  rowsAffected=${update.rowsAffected}`);
const { rows } = await conn.execute(
  'SELECT customer_id, cif_no, full_name, phone, email FROM customers WHERE customer_id = :id',
  { id },
);
console.table(rows);
```

## 4.3 DELETE nasabah uji

Ganti TODO 4.3:

```js
const hapus = await conn.execute('DELETE FROM customers WHERE customer_id = :id', { id }, { autoCommit: false });
await conn.commit();
console.log(`DELETE  rowsAffected=${hapus.rowsAffected}`);
const lagi = await conn.execute('DELETE FROM customers WHERE customer_id = :id', { id }, { autoCommit: false });
await conn.commit();
console.log(`DELETE  rowsAffected=${lagi.rowsAffected}  (sudah tidak ada)`);
```

DELETE kedua sengaja dijalankan: `rowsAffected` `0` berarti tidak ada baris yang cocok.

## 4.4 Jalankan

```bash
npm run crud
```

Yang harus terlihat (`customer_id` angka berurutan, mis. `13` pada run pertama setelah `npm run db:reset`; bisa juga `21` atau lebih karena kolom identity menyimpan cache 20 nomor yang hilang kalau pool kosong, dan naik pada run berikutnya):

```text
Pool siap: 1 koneksi terbuka (min 1, max 5)
INSERT  rowsAffected=1  customer_id=13
UPDATE  rowsAffected=1
┌─────────┬─────────────┬────────────────┬───────────────────┬──────────────────┬─────────────────────────────┐
│ (index) │ CUSTOMER_ID │ CIF_NO         │ FULL_NAME         │ PHONE            │ EMAIL                       │
├─────────┼─────────────┼────────────────┼───────────────────┼──────────────────┼─────────────────────────────┤
│ 0       │ '13'        │ 'CIF-SIM-9001' │ 'Toko Uji Contoh' │ '0800-0000-9002' │ 'toko.uji.baru@example.com' │
└─────────┴─────────────┴────────────────┴───────────────────┴──────────────────┴─────────────────────────────┘
DELETE  rowsAffected=1
DELETE  rowsAffected=0  (sudah tidak ada)
Pool ditutup
```

Cek di SQL Developer atau `curl http://localhost:3000/api/customers`: nasabah tetap 12. Kalau semua `await conn.commit()` dihapus, skrip tetap jalan tanpa error, tetapi tidak ada yang tersimpan: perubahan dibatalkan saat koneksi dikembalikan ke pool.

## Tantangan tambahan Demo 4 (opsional)

Kerjakan di file baru `scripts/crud-lanjut.js` (pola pembukaan pool dan koneksi sama seperti `crud-dasar.js`).

1. Tambahkan tiga nasabah uji sekaligus (`CIF-SIM-9101` sampai `CIF-SIM-9103`, email dan telepon berbeda, `UMKM`, `KCP-SIM-01`) dengan satu `conn.executeMany(...)` dan satu commit. Cetak `rowsAffected` (target `3`), lalu hapus ketiganya dengan satu DELETE (target `rowsAffected` `3`).
2. Coba hapus nasabah 1, yang masih punya rekening. Tangkap errornya, panggil `conn.rollback()`, cetak satu baris yang menjelaskan bahwa nasabah masih punya rekening (petunjuk: `err.errorNum`), lalu cetak jumlah nasabah. Target: tetap 12.
