/* ===================================================================
   ZoAnime — script.js
   Router hash sederhana (vanilla JS) + fetch ke backend Express lokal.
   Lihat config.js untuk API_BASE.
   =================================================================== */

const app = document.getElementById('app');
const mainNav = document.getElementById('mainNav');
const navToggle = document.getElementById('navToggle');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const apiStatus = document.getElementById('apiStatus');

/* ---------- util ---------- */
function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;');
}

// scraper.detail()/episode() butuh "slug" (path tanpa domain & tanpa slash awal/akhir)
// sedangkan listing (home/ongoing/dst) memberi "link" berupa URL penuh.
function slugFromLink(link){
  if(!link) return '';
  try{
    const u = new URL(link);
    return u.pathname.replace(/^\/+|\/+$/g, '');
  }catch(e){
    return String(link).replace(/^\/+|\/+$/g, '');
  }
}

// scraper.episode() menerima slug berformat "judul-episode-12" (tanpa "-sub-indo")
function episodeSlugFromLink(link){
  const slug = slugFromLink(link); // contoh: episode/judul-episode-12-sub-indo
  const m = slug.match(/^episode\/(.+?)-sub-indo$/);
  return m ? m[1] : slug.replace(/^episode\//,'');
}

async function fetchJSON(url){
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if(!res.ok || (data && data.error)){
    throw new Error((data && data.message) || `HTTP ${res.status}`);
  }
  return data;
}

function setApiStatus(state, msg){
  apiStatus.className = 'ticker ' + state;
  apiStatus.innerHTML = `<span class="ticker-dot"></span> ${escapeHtml(msg)}`;
}

function setLoading(){
  app.innerHTML = `
    <div class="loader-wrap">
      <div class="rec-badge">● REC</div>
      <p>MENYETEL SALURAN…</p>
    </div>`;
}

function setError(msg, retryHash){
  setApiStatus('error', 'gagal menghubungi server lokal');
  app.innerHTML = `
    <div class="state-msg">
      <span class="state-signal">[ SINYAL HILANG ]</span>
      <h3>Tidak bisa memuat data</h3>
      <p>${escapeHtml(msg || 'Server backend tidak merespons. Pastikan "node server.js" sedang berjalan di port 3000.')}</p>
      <button id="retryBtn">Coba Lagi</button>
    </div>`;
  document.getElementById('retryBtn').addEventListener('click', () => {
    if(retryHash) location.hash = retryHash;
    router();
  });
}

function setEmpty(msg){
  app.innerHTML = `
    <div class="state-msg">
      <span class="state-signal">[ TIDAK ADA SIARAN ]</span>
      <h3>Kosong</h3>
      <p>${escapeHtml(msg || 'Tidak ditemukan hasil untuk pencarian ini.')}</p>
    </div>`;
}

/* ---------- komponen kartu ---------- */
let cardCounter = 0;

function cardHTML(item){
  cardCounter++;
  const title = item.title || 'Tanpa judul';
  const slug = slugFromLink(item.link);
  const poster = item.img || '';
  const eps = item.eps || '';
  const score = item.score || '';
  const chNum = String(cardCounter).padStart(2,'0');
  return `
    <a class="scroll-card" href="#/detail/${encodeURIComponent(slug)}" data-link>
      <div class="poster-wrap">
        <img src="${escapeHtml(poster)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='https://placehold.co/300x450/0d0f12/ff4d2e?text=ZoAnime'">
        <span class="ch-tag">CH.${chNum}</span>
        ${eps ? `<span class="eps-tag">${escapeHtml(eps)}</span>` : ''}
        ${score ? `<span class="score-tag">★${escapeHtml(score)}</span>` : ''}
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHtml(title)}</div>
      </div>
    </a>`;
}

function gridHTML(items){
  cardCounter = 0;
  if(!items || !items.length) return '<p style="opacity:.7;font-family:var(--font-display);font-size:13px;">Tidak ada data untuk ditampilkan.</p>';
  return `<div class="card-grid">${items.map(cardHTML).join('')}</div>`;
}

function paginationHTML(pagination){
  const current = (pagination && pagination.current) || 1;
  const hasNext = pagination ? !!pagination.hasNext : false;
  return `
    <div class="pagination">
      <button id="prevPageBtn" ${current<=1?'disabled':''}>← SEBELUMNYA</button>
      <span class="page-indicator">HAL. ${current}</span>
      <button id="nextPageBtn" ${hasNext?'':'disabled'}>BERIKUTNYA →</button>
    </div>`;
}

function bindPagination(current, baseHashFn){
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if(prevBtn) prevBtn.addEventListener('click', () => { location.hash = baseHashFn(Math.max(1,current-1)); });
  if(nextBtn) nextBtn.addEventListener('click', () => { location.hash = baseHashFn(current+1); });
}

/* ===================================================================
   ROUTES
   =================================================================== */

const routes = {
  home: renderHome,
  ongoing: renderOngoing,
  complete: renderComplete,
  terbaru: renderTerbaru,
  jadwal: renderJadwal,
  search: renderSearch,
  detail: renderDetail,
  episode: renderEpisode,
};

async function router(){
  const hash = location.hash.replace(/^#\//,'') || 'home/1';
  const parts = hash.split('/').filter(Boolean);
  const route = parts[0] || 'home';
  const args = parts.slice(1);

  highlightNav(route);
  closeMobileNav();
  window.scrollTo({top:0});

  const handler = routes[route];
  if(!handler){
    setEmpty('Halaman tidak ditemukan.');
    return;
  }
  try{
    await handler(...args);
    setApiStatus('live', 'tersambung ke server lokal · localhost:3000');
  }catch(err){
    console.error(err);
    setError(err.message);
  }
}

function highlightNav(route){
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
  let navKey = route;
  if(route === 'detail' || route === 'episode' || route === 'search') navKey = null;
  if(navKey){
    const el = document.querySelector(`.main-nav a[data-nav="${navKey}"]`);
    if(el) el.classList.add('active');
  }
}

function closeMobileNav(){ mainNav.classList.remove('open'); }

/* ---------- HOME ---------- */
async function renderHome(page = '1'){
  setLoading();
  const res = await fetchJSON(`${API_BASE}/home/${page}`);
  const { items = [], pagination } = res.data || {};

  app.innerHTML = `
    <section class="hero-banner">
      <h1>SIARAN LANGSUNG · ANIME SUB INDO</h1>
      <p>Jelajahi ratusan judul anime subtitle Indonesia. Pantau saluran yang sedang on air, telusuri arsip yang sudah tamat, atau cari judul favoritmu.</p>
    </section>

    <div class="section-head">
      <h2><span class="ch-num">01</span> Beranda</h2>
    </div>
    ${gridHTML(items)}
    ${paginationHTML(pagination)}
  `;
  bindPagination((pagination && pagination.current) || parseInt(page,10) || 1, p => `/home/${p}`);
}

/* ---------- ONGOING ---------- */
async function renderOngoing(page = '1'){
  setLoading();
  const res = await fetchJSON(`${API_BASE}/ongoing/${page}`);
  const { items = [], pagination } = res.data || {};
  app.innerHTML = `
    <div class="section-head">
      <h2><span class="ch-num">ON</span> Sedang Tayang</h2>
    </div>
    ${gridHTML(items)}
    ${paginationHTML(pagination)}
  `;
  bindPagination((pagination && pagination.current) || parseInt(page,10) || 1, p => `/ongoing/${p}`);
}

/* ---------- COMPLETE ---------- */
async function renderComplete(page = '1'){
  setLoading();
  const res = await fetchJSON(`${API_BASE}/complete/${page}`);
  const { items = [], pagination } = res.data || {};
  app.innerHTML = `
    <div class="section-head">
      <h2><span class="ch-num">END</span> Sudah Tamat</h2>
    </div>
    ${gridHTML(items)}
    ${paginationHTML(pagination)}
  `;
  bindPagination((pagination && pagination.current) || parseInt(page,10) || 1, p => `/complete/${p}`);
}

/* ---------- TERBARU ---------- */
async function renderTerbaru(page = '1'){
  setLoading();
  const res = await fetchJSON(`${API_BASE}/terbaru/${page}`);
  const { items = [], pagination } = res.data || {};
  app.innerHTML = `
    <div class="section-head">
      <h2><span class="ch-num">NEW</span> Rilisan Terbaru</h2>
    </div>
    ${gridHTML(items)}
    ${paginationHTML(pagination)}
  `;
  bindPagination((pagination && pagination.current) || parseInt(page,10) || 1, p => `/terbaru/${p}`);
}

/* ---------- JADWAL ---------- */
async function renderJadwal(){
  setLoading();
  const res = await fetchJSON(`${API_BASE}/jadwal-rilis`);
  const schedule = (res.data && res.data.schedule) || {};
  const days = Object.entries(schedule);

  let html = `<div class="section-head"><h2><span class="ch-num">TV</span> Jadwal Rilis</h2></div>`;

  if(!days.length){
    setEmpty('Jadwal tidak tersedia saat ini.');
    return;
  }

  for(const [day, items] of days){
    html += `
      <div class="schedule-day">
        <h3>${escapeHtml(day)}</h3>
        <div class="schedule-list">
          ${items.map(it => `
            <a class="schedule-row" href="#/detail/${encodeURIComponent(slugFromLink(it.link))}" data-link>${escapeHtml(it.title)}</a>
          `).join('')}
        </div>
      </div>`;
  }

  app.innerHTML = html;
}

/* ---------- SEARCH ---------- */
async function renderSearch(keyword = '', page = '1'){
  setLoading();
  const kw = decodeURIComponent(keyword);
  searchInput.value = kw;
  const res = await fetchJSON(`${API_BASE}/search/${encodeURIComponent(kw)}/${page}`);
  const { items = [], pagination } = res.data || {};

  app.innerHTML = `
    <div class="section-head">
      <h2><span class="ch-num">Q</span> Hasil: "${escapeHtml(kw)}"</h2>
    </div>
    ${items.length ? gridHTML(items) : `
      <div class="state-msg">
        <span class="state-signal">[ TIDAK ADA SIARAN ]</span>
        <h3>Tidak ditemukan</h3>
        <p>Tidak ada anime yang cocok dengan "${escapeHtml(kw)}".</p>
      </div>`}
    ${items.length ? paginationHTML(pagination) : ''}
  `;
  bindPagination((pagination && pagination.current) || parseInt(page,10) || 1, p => `/search/${encodeURIComponent(kw)}/${p}`);
}

/* ---------- DETAIL ---------- */
async function renderDetail(slug){
  setLoading();
  const res = await fetchJSON(`${API_BASE}/detail/${slug}`);
  const d = res.data || {};
  const info = d.info || {};
  const episodes = d.episodes || [];

  app.innerHTML = `
    <div class="detail-hero">
      <div class="detail-poster">
        <img src="${escapeHtml(info['Poster'] || '')}" alt="${escapeHtml(d.title||'')}" onerror="this.src='https://placehold.co/300x450/0d0f12/ff4d2e?text=ZoAnime'">
      </div>
      <div class="detail-body">
        <h1>${escapeHtml(d.title || 'Tanpa judul')}</h1>
        ${d.score ? `<p style="font-family:var(--font-display);color:var(--signal);margin:0 0 14px;">★ ${escapeHtml(d.score)}</p>` : ''}

        ${Object.keys(info).length ? `
          <div class="detail-stats">
            ${Object.entries(info).map(([k,v]) => `
              <div><span class="stat-label">${escapeHtml(k)}</span>${escapeHtml(v)}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>

    <section class="episode-section">
      <h3>▸ DAFTAR EPISODE (${episodes.length})</h3>
      ${episodes.length ? `
        <div class="episode-grid">
          ${episodes.map(ep => `
            <a class="episode-item" href="#/episode/${encodeURIComponent(episodeSlugFromLink(ep.url))}" data-link>
              <span class="ep-name">${escapeHtml(ep.title || ('Episode ' + ep.episode))}</span>
              ${ep.releaseDate ? `<span class="ep-date">${escapeHtml(ep.releaseDate)}</span>` : ''}
              <span class="ep-arrow">▶</span>
            </a>`).join('')}
        </div>
      ` : '<p style="opacity:.7;font-family:var(--font-display);font-size:13px;">Episode belum tersedia.</p>'}
    </section>
  `;
}

/* ---------- EPISODE / WATCH ---------- */
async function renderEpisode(slug){
  setLoading();
  const res = await fetchJSON(`${API_BASE}/episode/${slug}`);
  const d = res.data || {};
  const embed = res.embed || {};
  const download = res.download || {};
  const prevEpisode = res.prevEpisode;
  const nextEpisode = res.nextEpisode;
  const episodeList = res.episodeList || [];

  // ambil semua server dari semua kualitas embed jadi satu daftar tombol
  const allServers = [];
  Object.entries(embed).forEach(([quality, servers]) => {
    Object.entries(servers).forEach(([name, url]) => {
      allServers.push({ label: `${name} · ${quality}`, url });
    });
  });
  const mainUrl = d.defaultPlayer || (allServers[0] && allServers[0].url) || '';

  app.innerHTML = `
    <h1 class="watch-title">${escapeHtml(d.title || ('Episode ' + d.episode))}</h1>

    <div class="watch-layout">
      <div>
        <div class="player-frame" id="playerFrame">
          ${mainUrl ? `<iframe src="${escapeHtml(mainUrl)}" allowfullscreen referrerpolicy="no-referrer" loading="lazy"></iframe>` :
          `<div class="player-placeholder">[ SERVER TIDAK TERSEDIA ]</div>`}
        </div>

        ${allServers.length ? `
          <div class="server-block">
            <h4>Pilih Server</h4>
            <div class="server-row" id="serverRow">
              ${allServers.map((s,i) => `<button class="server-btn ${s.url===mainUrl?'active':''}" data-url="${escapeHtml(s.url)}">${escapeHtml(s.label)}</button>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="ep-nav-row">
          ${prevEpisode ? `<a href="#/episode/${encodeURIComponent(episodeSlugFromLink(prevEpisode))}" data-link>← SEBELUMNYA</a>` : `<span class="disabled">← SEBELUMNYA</span>`}
          ${nextEpisode ? `<a href="#/episode/${encodeURIComponent(episodeSlugFromLink(nextEpisode))}" data-link>BERIKUTNYA →</a>` : `<span class="disabled">BERIKUTNYA →</span>`}
        </div>

        ${Object.keys(download).length ? `
          <details class="download-block" open>
            <summary>⬇ UNDUH EPISODE</summary>
            ${Object.entries(download).map(([quality, mirrors]) => `
              <div class="dl-quality">
                <h4>${escapeHtml(quality)}</h4>
                <div class="dl-links">
                  ${Object.entries(mirrors).map(([host,url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(host)}</a>`).join('')}
                </div>
              </div>`).join('')}
          </details>
        ` : ''}
      </div>

      <aside>
        <div class="sidebar-box">
          <h3>Daftar Episode</h3>
          <div class="sidebar-eps">
            ${episodeList.map(ep => {
              const epSlug = episodeSlugFromLink(ep.url);
              const isCurrent = String(ep.episode) === String(d.episode);
              return `<a class="${isCurrent ? 'current' : ''}" href="#/episode/${encodeURIComponent(epSlug)}" data-link>${escapeHtml(ep.title || ('Episode ' + ep.episode))}</a>`;
            }).join('')}
          </div>
        </div>
      </aside>
    </div>
  `;

  const serverRow = document.getElementById('serverRow');
  if(serverRow){
    serverRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.server-btn');
      if(!btn) return;
      serverRow.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const url = btn.dataset.url;
      const frame = document.getElementById('playerFrame');
      frame.innerHTML = `<iframe src="${escapeHtml(url)}" allowfullscreen referrerpolicy="no-referrer" loading="lazy"></iframe>`;
    });
  }
}

/* ===================================================================
   EVENT WIRING
   =================================================================== */

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link]');
  if(link) closeMobileNav();
});

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const kw = searchInput.value.trim();
  if(!kw) return;
  location.hash = `/search/${encodeURIComponent(kw)}/1`;
});

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  if(!location.hash) location.hash = '/home/1';
  router();
});

if(document.readyState !== 'loading'){
  if(!location.hash) location.hash = '/home/1';
  router();
}
