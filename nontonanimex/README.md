# ZoAnime — Web Streaming Anime (NontonAnimeX)

Project ini terdiri dari dua bagian terpisah:

```
nontonanimex/
├── backend/     ← server Express yang menjalankan scraper, jadi REST API
│   ├── scraper.js
│   ├── server.js
│   └── package.json
└── frontend/    ← halaman web HTML/CSS/JS murni yang memanggil API backend
    ├── index.html
    ├── style.css
    ├── config.js
    └── script.js
```

## 1. Jalankan backend (server scraper)

Backend membungkus scraper `NontonAnimeXScraper` menjadi endpoint JSON di `http://localhost:3000`.

```bash
cd backend
npm install
npm start
```

Jika berhasil, akan muncul:
```
NontonAnimeX API berjalan di http://localhost:3000
```

Biarkan terminal ini tetap berjalan selama Anda memakai web-nya.

### Endpoint yang tersedia
| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/home/:page?` | Daftar anime di halaman utama |
| GET | `/api/terbaru/:page?` | Rilisan episode terbaru |
| GET | `/api/jadwal-rilis` | Jadwal tayang per hari |
| GET | `/api/ongoing/:page?` | Anime yang masih tayang |
| GET | `/api/complete/:page?` | Anime yang sudah tamat |
| GET | `/api/genre/:slug/:page?` | Anime berdasarkan genre |
| GET | `/api/search/:query/:page?` | Pencarian judul |
| GET | `/api/detail/:slug` | Detail anime + daftar episode |
| GET | `/api/episode/:slug` | Link streaming & unduhan episode (`slug` format: `judul-episode-12`) |

## 2. Jalankan frontend

Frontend murni HTML/CSS/JS, tidak butuh build tool. Cukup buka `frontend/index.html` lewat server statis sederhana (jangan dobel klik file langsung, karena beberapa browser membatasi `fetch` dari `file://`):

```bash
cd frontend
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080` di browser, sementara backend tetap berjalan di port 3000.

Jika backend Anda dijalankan di alamat/port lain, ubah baris berikut di `frontend/config.js`:
```js
const API_BASE = 'http://localhost:3000/api';
```

## Catatan

- Scraper mengambil data langsung dari `nontonanimex.com`. Jika struktur HTML situs itu berubah, beberapa parsing (CSS selector di `scraper.js`) mungkin perlu disesuaikan.
- Server menonaktifkan validasi SSL (`rejectUnauthorized:false`) dan melakukan rotasi User-Agent saat mengambil halaman sumber — ini bawaan dari scraper yang diberikan, dipakai supaya permintaan menyerupai browser asli.
- Tidak ada video atau berkas yang dihosting oleh proyek ini — semua tautan diarahkan ke server pihak ketiga.
