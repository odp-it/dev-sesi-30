// Demo 3. Endpoint baca data dengan query berparameter (bind variable).
import { Router } from 'express';
import { query } from '../db/oracle.js';

export const router = Router();

const toCustomer = (r) => ({
  id: Number(r.CUSTOMER_ID),
  cifNo: r.CIF_NO,
  fullName: r.FULL_NAME,
  segment: r.SEGMENT,
  branchCode: r.BRANCH_CODE,
});

const toAccount = (r) => ({
  id: Number(r.ACCOUNT_ID),
  accountNo: r.ACCOUNT_NO,
  product: r.PRODUCT,
  balance: r.BALANCE,
  status: r.STATUS,
});

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const error = (res, status, code, message) => res.status(status).json({ error: { code, message } });

// Contoh lengkap: query tanpa input dari pemakai.
router.get('/branches', async (req, res) => {
  const { rows } = await query('SELECT branch_id, branch_code, branch_name, city FROM branches ORDER BY branch_code');
  res.json({ data: rows.map((r) => ({ id: Number(r.BRANCH_ID), branchCode: r.BRANCH_CODE, branchName: r.BRANCH_NAME, city: r.CITY })) });
});

// TODO 3.1: GET /customers?segment=UMKM&q=contoh
//   filter opsional segment dan q (nama), keduanya lewat bind variable :segment dan :q.
//   respons: { data: [...toCustomer], total }

// TODO 3.2: GET /customers/:id
//   id bukan bilangan bulat positif -> 400 VALIDATION_ERROR
//   tidak ada                       -> 404 NOT_FOUND
//   ada                             -> 200 toCustomer(row)

// TODO 3.3: GET /customers/:id/accounts
//   rekening milik nasabah, urut account_id -> { data: [...toAccount] }
