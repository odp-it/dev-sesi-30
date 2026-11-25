// Lab. Endpoint baca data untuk aplikasi ALP tim. Dipasang di /api/alp (lihat src/app.js).
// Kontrak respons dan rubrik ada di README bagian Lab.
import { Router } from 'express';
import { query } from '../db/oracle.js';

export const router = Router();

// TODO L1: GET /<resource>            daftar, urut id -> { data: [...], total }
// TODO L2: filter opsional di daftar  lewat bind variable
// TODO L3: GET /<resource>/:id        200, 404 NOT_FOUND, 400 VALIDATION_ERROR
// TODO L4: GET /<resource>/:id/<anak> data anak milik induk -> { data: [...] }, induk tidak ada 404
