// Endpoint baca data dengan query berparameter (bind variable).
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

router.get('/branches', async (req, res) => {
  const { rows } = await query('SELECT branch_id, branch_code, branch_name, city FROM branches ORDER BY branch_code');
  res.json({ data: rows.map((r) => ({ id: Number(r.BRANCH_ID), branchCode: r.BRANCH_CODE, branchName: r.BRANCH_NAME, city: r.CITY })) });
});

// GET /api/customers?segment=UMKM&q=contoh
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

// GET /api/customers/1
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

// GET /api/customers/1/accounts
router.get('/customers/:id/accounts', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return error(res, 400, 'VALIDATION_ERROR', 'id harus bilangan bulat positif');

  const { rows } = await query(
    `SELECT account_id, account_no, product, balance, status
       FROM accounts
      WHERE customer_id = :id
      ORDER BY account_id`,
    { id },
  );
  res.json({ data: rows.map(toAccount) });
});
