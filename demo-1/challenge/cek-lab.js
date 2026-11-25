// Sesi 30 · Lab: cek otomatis endpoint ALP tim (80 poin otomatis; 20 poin dinilai manual).
// Cara pakai (dari folder lab):
//   1. Isi challenge/lab-alp.json sesuai tabel ALP tim.
//   2. npm run cek:lab        (tanpa npm run dev; aplikasi dijalankan di port acak)
//   3. Baca tabel poin dan catatan, perbaiki, jalankan lagi.
// Jawaban endpoint dibandingkan dengan isi database. Cek ini sendiri hanya menjalankan SELECT
// dan hanya mengirim request GET, lalu menjalankan challenge/alp.test.js milik tim.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import oracledb from 'oracledb';

const CONFIG = new URL('./lab-alp.json', import.meta.url);
const TEST_FILE = fileURLToPath(new URL('./alp.test.js', import.meta.url));
const LAB_DIR = fileURLToPath(new URL('..', import.meta.url));
const NO_ID = 999999999;

const rows = []; // [nama, poin didapat, poin maksimal]
const notes = [];
const score = (name, points, max) => rows.push([name, points, max]);

function readConfig() {
  const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));
  const identifiers = {
    table: cfg.table,
    idColumn: cfg.idColumn,
    'filter.column': cfg.filter?.column,
    'child.table': cfg.child?.table,
    'child.idColumn': cfg.child?.idColumn,
    'child.fkColumn': cfg.child?.fkColumn,
  };
  const paths = { resource: cfg.resource, 'filter.param': cfg.filter?.param, 'child.resource': cfg.child?.resource };
  const bad = [];
  for (const [key, value] of Object.entries(identifiers)) {
    if (!/^[A-Za-z][A-Za-z0-9_$#]{0,127}$/.test(value ?? '') || /^ISI_/i.test(value)) bad.push(key);
  }
  for (const [key, value] of Object.entries(paths)) {
    if (!/^[A-Za-z0-9_-]+$/.test(value ?? '') || /^ISI_/.test(value)) bad.push(key);
  }
  const v = cfg.filter?.value;
  if (typeof v !== 'string' || v === '' || /^ISI_/.test(v)) bad.push('filter.value');
  return { cfg, bad };
}

let baseUrl;
async function get(path) {
  try {
    const res = await fetch(baseUrl + path, { signal: AbortSignal.timeout(10000) });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: null, error: err.message };
  }
}

const idsOf = (body) => (Array.isArray(body?.data) ? body.data.map((item) => item?.id) : null);
const sameIds = (got, want) => got !== null && got.length === want.length && got.every((id, i) => id === want[i]);
const isError = (res, status, code) => res.status === status && res.body?.error?.code === code;

async function checkEndpoints(cfg, db) {
  // outFormat ditulis di sini karena src/db/oracle.js tim mengubah pengaturan bawaan driver.
  const select = async (sql, binds = []) =>
    (await db.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_ARRAY })).rows;
  const ids = async (sql, binds = []) => (await select(sql, binds)).map((r) => Number(r[0]));
  const base = `/api/alp/${cfg.resource}`;
  const allIds = await ids(`SELECT ${cfg.idColumn} FROM ${cfg.table} ORDER BY ${cfg.idColumn}`);
  if (allIds.length === 0) notes.push(`Tabel ${cfg.table} kosong. Isi data contoh (Lab sesi 22) lalu cek lagi.`);

  // 1. Daftar
  const list = await get(base);
  const got = idsOf(list.body);
  // Kalau tim mengerjakan Bonus paging (bawaan limit 50), halaman pertama juga diterima.
  const page = allIds.length > 50 && got?.length === 50 ? allIds.slice(0, 50) : allIds;
  const listOk = allIds.length > 0 && list.status === 200 && sameIds(got, page);
  const totalOk = listOk && list.body.total === allIds.length;
  score('1. Daftar: data sesuai database', listOk ? 10 : 0, 10);
  score('2. Daftar: total sesuai database', totalOk ? 5 : 0, 5);
  if (!listOk) {
    notes.push(`1: GET ${base} -> status ${list.status}. Harus 200, data[].id berupa angka, urut, ` +
      `sama dengan ${allIds.length} baris di ${cfg.table}.`);
  } else if (!totalOk) {
    notes.push(`2: total ${JSON.stringify(list.body.total)}, di database ${allIds.length} (angka, bukan string).`);
  }

  // 3-4. Filter dan injection
  const { param, column, value } = cfg.filter;
  const filterIds = await ids(
    `SELECT ${cfg.idColumn} FROM ${cfg.table} WHERE ${column} = :v ORDER BY ${cfg.idColumn}`, [value]);
  let filterOk = false;
  if (filterIds.length === 0 || filterIds.length === allIds.length) {
    notes.push(`3: filter.value harus menyaring sebagian data. Saat ini cocok ${filterIds.length} dari ${allIds.length}.`);
  } else {
    const res = await get(`${base}?${param}=${encodeURIComponent(value)}`);
    filterOk = res.status === 200 && sameIds(idsOf(res.body), filterIds) && res.body.total === filterIds.length;
    if (!filterOk) {
      notes.push(`3: ?${param}=${value} -> status ${res.status}. Harus ${filterIds.length} baris dan total ${filterIds.length}.`);
    }
  }
  score('3. Filter lewat query string', filterOk ? 10 : 0, 10);

  let safe = false;
  if (filterOk) {
    const res = await get(`${base}?${param}=${encodeURIComponent("' OR '1'='1")}`);
    safe = isError(res, 400, 'VALIDATION_ERROR') ||
      (res.status === 200 && idsOf(res.body)?.length === 0 && res.body.total === 0);
    if (!safe) {
      notes.push(`4: input ' OR '1'='1 -> status ${res.status}, ${idsOf(res.body)?.length ?? '-'} baris. ` +
        'Nilai harus lewat bind variable.');
    }
  } else {
    notes.push('4: dicek setelah filter (kriteria 3) lulus.');
  }
  score("4. Input ' OR '1'='1 tidak tembus", safe ? 10 : 0, 10);

  // 5-7. Detail
  let detailOk = allIds.length > 0;
  for (const id of new Set([allIds[0], allIds.at(-1)])) {
    if (!detailOk) break;
    const res = await get(`${base}/${id}`);
    detailOk = res.status === 200 && res.body?.id === id;
    if (!detailOk) notes.push(`5: GET ${base}/${id} -> status ${res.status}. Harus 200 dengan id ${id} (angka).`);
  }
  score('5. Detail: 200', detailOk ? 10 : 0, 10);

  let notFound = false;
  let invalid = false;
  if (detailOk) {
    const res = await get(`${base}/${NO_ID}`);
    notFound = isError(res, 404, 'NOT_FOUND');
    if (!notFound) notes.push(`6: id ${NO_ID} -> status ${res.status}. Harus 404 dengan error.code NOT_FOUND.`);
    const failed = [];
    for (const input of ['abc', '0', '1.5']) {
      const r = await get(`${base}/${input}`);
      if (!isError(r, 400, 'VALIDATION_ERROR')) failed.push(`${input} -> ${r.status}`);
    }
    invalid = failed.length === 0;
    if (!invalid) notes.push(`7: ${failed.join(', ')}. Harus 400 dengan error.code VALIDATION_ERROR.`);
  } else {
    notes.push('6-7: dicek setelah detail 200 (kriteria 5) lulus.');
  }
  score('6. Detail: 404 NOT_FOUND', notFound ? 5 : 0, 5);
  score('7. Detail: 400 VALIDATION_ERROR', invalid ? 5 : 0, 5);

  // 8-9. Data anak
  const { resource, table, idColumn, fkColumn } = cfg.child;
  const parents = await select(
    `SELECT ${fkColumn}, COUNT(*) FROM ${table} WHERE ${fkColumn} IS NOT NULL
      GROUP BY ${fkColumn} ORDER BY COUNT(*) DESC, ${fkColumn}`);
  const childTotal = parents.reduce((sum, r) => sum + Number(r[1]), 0);
  let childOk = false;
  if (parents.length < 2) {
    notes.push(`8: data contoh di ${table} harus milik minimal 2 induk yang berbeda (saat ini ${parents.length}).`);
  } else {
    childOk = true;
    // Dua induk berbeda: yang anaknya paling banyak dan yang paling sedikit.
    for (const parent of [Number(parents[0][0]), Number(parents.at(-1)[0])]) {
      const want = await ids(
        `SELECT ${idColumn} FROM ${table} WHERE ${fkColumn} = :id ORDER BY ${idColumn}`, [parent]);
      const res = await get(`${base}/${parent}/${resource}`);
      if (res.status !== 200 || !sameIds(idsOf(res.body), want)) {
        childOk = false;
        notes.push(`8: GET ${base}/${parent}/${resource} -> status ${res.status}. ` +
          `Harus ${want.length} dari ${childTotal} baris ${table}, urut ${idColumn}.`);
        break;
      }
    }
  }
  score('8. Data anak sesuai induk', childOk ? 10 : 0, 10);

  let childNotFound = false;
  if (childOk) {
    const res = await get(`${base}/${NO_ID}/${resource}`);
    childNotFound = isError(res, 404, 'NOT_FOUND');
    if (!childNotFound) notes.push(`9: induk ${NO_ID} -> status ${res.status}. Harus 404 NOT_FOUND, bukan data kosong.`);
  } else {
    notes.push('9: dicek setelah data anak (kriteria 8) lulus.');
  }
  score('9. Data anak: induk tidak ada 404', childNotFound ? 5 : 0, 5);
}

function checkTeamTests() {
  let pass = 0;
  let fail = 0;
  if (existsSync(TEST_FILE)) {
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', TEST_FILE],
      { cwd: LAB_DIR, env: process.env, encoding: 'utf8', timeout: 60000 });
    pass = Number(/^# pass (\d+)/m.exec(run.stdout ?? '')?.[1] ?? 0);
    fail = Number(/^# fail (\d+)/m.exec(run.stdout ?? '')?.[1] ?? 0);
    if (run.status !== 0 && fail === 0) fail = 1; // test berhenti karena error atau lewat 60 detik
  }
  const points = fail > 0 ? 0 : pass >= 4 ? 10 : pass >= 2 ? 5 : 0;
  score(`10. Test tim: ${pass} lulus, ${fail} gagal`, points, 10);
  if (points < 10) notes.push('10: minimal 4 test lulus dan 0 gagal untuk 10 poin (2-3 lulus: 5). Lihat npm run test:alp.');
}

const MAX = [10, 5, 10, 10, 10, 5, 5, 10, 5, 10];
const NAMES = ['1. Daftar: data sesuai database', '2. Daftar: total sesuai database', '3. Filter lewat query string',
  "4. Input ' OR '1'='1 tidak tembus", '5. Detail: 200', '6. Detail: 404 NOT_FOUND', '7. Detail: 400 VALIDATION_ERROR',
  '8. Data anak sesuai induk', '9. Data anak: induk tidak ada 404', '10. Test tim'];

function report(title) {
  // Kriteria yang tidak sempat dicek (konfigurasi atau database gagal) tetap tampil dengan 0 poin.
  for (let i = rows.length; i < MAX.length; i++) score(NAMES[i], 0, MAX[i]);
  console.log(`\nCek Lab Sesi 30 - ${title}`);
  console.log(`${'Kriteria'.padEnd(44)}Poin`);
  console.log('-'.repeat(52));
  for (const [name, points, max] of rows) {
    console.log(`${name.padEnd(42)}${String(points).padStart(3)} / ${String(max).padStart(2)}`);
  }
  console.log('-'.repeat(52));
  const total = rows.reduce((sum, r) => sum + r[1], 0);
  console.log(`${'Subtotal otomatis'.padEnd(42)}${String(total).padStart(3)} / 80`);
  if (notes.length) console.log(`\nCatatan:\n- ${notes.join('\n- ')}`);
  console.log('\nSisa 20 poin dinilai manual (README bagian Lab).');
}

let cfg;
try {
  const result = readConfig();
  if (result.bad.length) {
    notes.push(`challenge/lab-alp.json belum diisi atau tidak valid: ${result.bad.join(', ')}.`);
    report('lab-alp.json belum siap');
    process.exit(0);
  }
  cfg = result.cfg;
} catch (err) {
  notes.push(`challenge/lab-alp.json tidak bisa dibaca: ${err.message}`);
  report('lab-alp.json belum siap');
  process.exit(0);
}

// Pesan error dari aplikasi tim disimpan, supaya tabel poin tidak tertimbun stack trace.
const appErrors = new Set();
const originalError = console.error;
console.error = (err) => appErrors.add(String(err?.message ?? err).split('\n')[0]);

let server;
let db;
try {
  const { startServer } = await import('./server-uji.js'); // di sini kode aplikasi tim ikut dimuat
  server = await startServer();
  baseUrl = server.baseUrl;
  db = await oracledb.getConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
  });
  await checkEndpoints(cfg, db);
} catch (err) {
  notes.push(`Cek berhenti: ${err.message.split('\n')[0]}`);
  process.exitCode = 1;
} finally {
  if (db) await db.close();
  if (server) await server.stop();
  console.error = originalError;
}
if (appErrors.size) notes.push(`Error dari aplikasi: ${[...appErrors].slice(0, 3).join(' | ')}`);
if (process.exitCode !== 1) checkTeamTests();
report(`/api/alp/${cfg.resource} (tabel ${cfg.table.toUpperCase()})`);
// Koneksi yang gagal bisa menahan proses tetap hidup, jadi proses diakhiri di sini.
process.exit(process.exitCode ?? 0);
