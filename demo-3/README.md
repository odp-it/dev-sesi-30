# Demo 3 · Query Berparameter (±40 menit)

> Folder ini project lengkap. Hasil Demo 1 sampai Demo 2 **sudah terisi** (catch-up). Kalau pekerjaanmu sendiri sudah jalan, boleh pakai punyamu.
> Buka folder ini langsung di VS Code, lalu lakukan persiapan di [README utama](../README.md) (mis. salin `.env`, install, atau `git init`) **di folder ini**. Semua path relatif terhadap folder ini.

Peraga 12 menit, ikuti 28 menit.

Semua nilai dari pemakai masuk lewat bind variable (`:segment`, `:q`, `:id`), tidak pernah disambung ke teks SQL.

## 3.1 Daftar nasabah dengan filter (±12 menit)

Di `src/routes/customers.js`, ganti TODO 3.1:

```js
router.get('/customers', async (req, res) => {
  const segment = req.query.segment ?? null;
  const q = req.query.q ?? null;
  const { rows } = await query(
    `SELECT c.customer_id, c.cif_no, c.full_name, c.segment, b.branch_code
       FROM customers c
       JOIN branches b ON b.branch_id = c.branch_id
      WHERE (:segment IS NULL OR c.segment = :segment)
        AND (:q IS NULL OR UPPER(c.full_name) LIKE '%' || UPPER(:q) || '%')
      ORDER BY c.customer_id`,
    { segment, q },
  );
  res.json({ data: rows.map(toCustomer), total: rows.length });
});
```

Test:

```bash
curl "http://localhost:3000/api/customers?segment=UMKM&q=contoh"
```

Yang harus terlihat: `"total":6`, semua `"segment":"UMKM"`, nama berakhiran `Contoh`.

## 3.2 Detail nasabah (±8 menit)

Ganti TODO 3.2:

```js
router.get('/customers/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return error(res, 400, 'VALIDATION_ERROR', 'id harus bilangan bulat positif');

  const { rows } = await query(
    `SELECT c.customer_id, c.cif_no, c.full_name, c.segment, b.branch_code
       FROM customers c
       JOIN branches b ON b.branch_id = c.branch_id
      WHERE c.customer_id = :id`,
    { id },
  );
  if (rows.length === 0) return error(res, 404, 'NOT_FOUND', `Nasabah ${id} tidak ditemukan`);
  res.json(toCustomer(rows[0]));
});
```

Test tiga kemungkinan (PowerShell: ketik `curl.exe`, bukan `curl`; `curl -i` di Windows PowerShell 5.1 memberi `Missing an argument for parameter 'InFile'`):

```bash
curl -i http://localhost:3000/api/customers/1
curl -i http://localhost:3000/api/customers/999
curl -i http://localhost:3000/api/customers/abc
```

| Request | Status | Body |
| --- | --- | --- |
| `/customers/1` | `200 OK` | `{"id":1,"cifNo":"CIF-SIM-0001","fullName":"Rina Contoh","segment":"UMKM","branchCode":"KCP-SIM-01"}` |
| `/customers/999` | `404 Not Found` | `{"error":{"code":"NOT_FOUND","message":"Nasabah 999 tidak ditemukan"}}` |
| `/customers/abc` | `400 Bad Request` | `{"error":{"code":"VALIDATION_ERROR","message":"id harus bilangan bulat positif"}}` |

## 3.3 Rekening milik nasabah (±4 menit)

Ganti TODO 3.3 dengan query `SELECT account_id, account_no, product, balance, status FROM accounts WHERE customer_id = :id ORDER BY account_id`, petakan dengan `toAccount`, kirim `{ data: [...] }`.

```bash
curl http://localhost:3000/api/customers/1/accounts
```

Yang harus terlihat: dua rekening, `SIM-1000001` (TABUNGAN) dan `SIM-1000002` (GIRO). Saldo tampil sebagai string, mis. `"balance":"14550000"`, karena `fetchAsString`. Format dua desimal dibuat di sesi 31.

## 3.4 Bandingkan dengan string disambung (±4 menit)

```bash
node --env-file=.env demo/sql-injection.js "' OR '1'='1"
```

Yang harus terlihat:

```text
1) String disambung
   SQL: SELECT cif_no, full_name FROM customers WHERE cif_no = '' OR '1'='1'
   Baris kembali: 12

2) Bind variable
   SQL: SELECT cif_no, full_name FROM customers WHERE cif_no = :cif
   Baris kembali: 0
```

Di PowerShell, apit argumen dengan kutip ganda dan kutip tunggal di dalamnya persis seperti di atas.

## Tantangan tambahan Demo 3 (opsional)

Kerjakan di route `GET /customers`. Semua nilai tetap lewat bind variable.

1. Tambahkan filter `branch` (kode cabang, mis. `KCP-SIM-01`) yang bisa digabung dengan `segment` dan `q`. Target: `?branch=KCP-SIM-01` mengembalikan `"total":4`, `?segment=UMKM&branch=KCP-SIM-01` mengembalikan `"total":2`.
2. Tambahkan paging: `limit` (1 sampai 100, bawaan 50) dan `offset` (0 atau lebih, bawaan 0) sebagai bind variable di `OFFSET ... ROWS FETCH NEXT ... ROWS ONLY`. Nilai tidak valid memberi `400 VALIDATION_ERROR`. `total` tetap jumlah seluruh nasabah yang cocok filter, bukan jumlah baris di halaman itu (petunjuk: `COUNT(*) OVER ()`). Target: `?limit=5&offset=5` memberi `"total":12` dan lima nasabah (id 6 sampai 10); `?limit=abc` memberi 400.
