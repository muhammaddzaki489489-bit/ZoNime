const express = require('express');
const cors = require('cors');
const { NontonAnimeXScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const scraper = new NontonAnimeXScraper();

app.use(cors());
app.use(express.json());

// logging sederhana
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

function ok(res, result) {
  res.json(result);
}

function fail(res, err, status = 500) {
  console.error(err);
  res.status(status).json({
    creator: 'rynaqrtz',
    error: true,
    message: err.message || 'Terjadi kesalahan pada server.'
  });
}

/* ---------- ROUTES ---------- */

app.get('/', (req, res) => {
  res.json({
    name: 'NontonAnimeX Scraper API',
    creator: 'rynaqrtz',
    endpoints: [
      'GET /api/home/:page?',
      'GET /api/terbaru/:page?',
      'GET /api/jadwal-rilis',
      'GET /api/ongoing/:page?',
      'GET /api/complete/:page?',
      'GET /api/genre/:slug/:page?',
      'GET /api/search/:query/:page?',
      'GET /api/detail/:slug',
      'GET /api/episode/:slug'
    ]
  });
});

app.get('/api/home/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    ok(res, await scraper.home(page));
  } catch (e) { fail(res, e); }
});

app.get('/api/terbaru/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    ok(res, await scraper.terbaru(page));
  } catch (e) { fail(res, e); }
});

app.get('/api/jadwal-rilis', async (req, res) => {
  try {
    ok(res, await scraper.jadwalRilis());
  } catch (e) { fail(res, e); }
});

app.get('/api/ongoing/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    ok(res, await scraper.ongoing(page));
  } catch (e) { fail(res, e); }
});

app.get('/api/complete/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    ok(res, await scraper.complete(page));
  } catch (e) { fail(res, e); }
});

app.get('/api/genre/:slug/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    ok(res, await scraper.genre(req.params.slug, page));
  } catch (e) { fail(res, e); }
});

app.get('/api/search/:query/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    ok(res, await scraper.search(req.params.query, page));
  } catch (e) { fail(res, e); }
});

app.get('/api/detail/:slug', async (req, res) => {
  try {
    ok(res, await scraper.detail(req.params.slug));
  } catch (e) { fail(res, e); }
});

// :slug menampung format "judul-episode-12" yang dipakai scraper.episode()
app.get('/api/episode/:slug', async (req, res) => {
  try {
    const follow = req.query.follow !== 'false'; // default true
    ok(res, await scraper.episode(req.params.slug, follow));
  } catch (e) { fail(res, e); }
});

app.use((req, res) => {
  res.status(404).json({ creator: 'rynaqrtz', error: true, message: 'Endpoint tidak ditemukan.' });
});

app.listen(PORT, () => {
  console.log(`NontonAnimeX API berjalan di http://localhost:${PORT}`);
});
