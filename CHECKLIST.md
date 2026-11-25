# Checklist

[Kembali ke README](README.md)

## Kriteria Selesai

- [ ] `npm run cek` mencetak `Thin`, `ALP_DEV`, `FREEPDB1`, `12`
- [ ] `npm run dev` mencetak `Pool siap: 1 koneksi terbuka`; Ctrl+C mencetak `Pool ditutup`
- [ ] Password salah membuat aplikasi berhenti saat start dengan `ORA-01017`
- [ ] `GET /health` mengembalikan `"db":"up"`
- [ ] `GET /api/customers?segment=UMKM&q=contoh` mengembalikan `"total":6`
- [ ] `/api/customers/999` 404 dan `/api/customers/abc` 400
- [ ] `npm run crud` mencetak `rowsAffected=1` untuk INSERT, UPDATE, DELETE, dan `0` untuk DELETE kedua
- [ ] Setelah `npm run crud`, `GET /api/customers` tetap mengembalikan 12 nasabah
- [ ] Tidak ada nilai dari `req.query` atau `req.params` yang disambung ke teks SQL
- [ ] Lab: `npm run test:alp` `fail 0` dan `npm run cek:lab` menampilkan skor otomatis (target minimal 48 dari 80, setara 60%)

## Verifikasi & Expected Result

| Cek | Expected result |
| --- | --- |
| `npm run db:reset` | `3`, `12`, `15`, `125`, `'218000000.00'` |
| `npm run cek` | Mode `Thin`, node-oracledb `26.0.0`, database `23.26.4.0.0` |
| `GET /health` | `200`, `status`, `db`, `dbTime` berakhiran `+07:00`, `pool.open` ≥ 1 |
| `GET /api/branches` | 3 cabang `KCP-SIM-01` sampai `KCP-SIM-03` |
| `GET /api/customers` | 12 nasabah, urut `id` |
| `GET /api/customers/1/accounts` | 2 rekening, `balance` berupa string |
| `npm run crud` | `rowsAffected` 1 (INSERT), 1 (UPDATE), 1 (DELETE), 0 (DELETE kedua); nasabah tetap 12 |
| Lab | `npm run cek:lab` menampilkan 10 baris kriteria dan subtotal otomatis maks. 80 |
