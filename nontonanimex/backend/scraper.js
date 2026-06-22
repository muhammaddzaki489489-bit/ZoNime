const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const BASE_URL = 'https://nontonanimex.com';
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.104 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/112.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
];

let uaIndex = 0;

function getHeaders(ref) {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  const isMobile = ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android');
  const platform = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'Unknown';
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': ref || 'https://nontonanimex.com/',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'DNT': '1',
    'Sec-Ch-Ua': `"${ua.includes('Chrome') ? 'Google Chrome' : 'Chromium'}"`,
    'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
    'Sec-Ch-Ua-Platform': `"${platform}"`,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Connection': 'keep-alive'
  };
}

function randomDelay(min = 500, max = 2000) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
}

async function get(url, retries = 5, ref = null) {
  for (let i = 0; i < retries; i++) {
    try {
      await randomDelay(300, 800);
      const res = await axios({
        url,
        method: 'GET',
        headers: getHeaders(ref || url),
        timeout: 30000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true,
          keepAliveMsecs: 1000,
          maxSockets: 10,
          maxFreeSockets: 5
        }),
        maxRedirects: 0,
        decompress: true,
        validateStatus: status => status >= 200 && status < 400
      });
      return res;
    } catch (e) {
      if (e.response && e.response.status >= 300 && e.response.status < 400) return e.response;
      if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT') {
        await randomDelay(1000, 3000);
        continue;
      }
      if (i < retries - 1) await randomDelay(1500, 4000);
      else throw e;
    }
  }
}

function decodeToken(tok) {
  try {
    const r = tok.split('').reverse().join('');
    let d = '';
    for (let i = 0; i < r.length; i += 2) {
      const c = parseInt(r.substr(i, 2), 36) - ((i / 2) % 7 + 5);
      d += String.fromCharCode(c);
    }
    return decodeURIComponent(d);
  } catch (e) { return null; }
}

function toEmbed(u) {
  if (!u) return null;
  if (u.includes('mega.nz/file/')) return u.replace('mega.nz/file/', 'mega.nz/embed/');
  if (u.includes('mega.nz/#!')) return u.replace('mega.nz/#!', 'mega.nz/embed/#!');
  const a = u.match(/acefile\.co\/f\/(\d+)/);
  if (a) return 'https://acefile.co/player/' + a[1];
  const k = u.match(/krakenfiles\.com\/view\/([^/]+)/);
  if (k) return 'https://krakenfiles.com/embed-video/' + k[1];
  return u;
}

function isEmbed(n) {
  const x = n.toLowerCase();
  return x === 'acefile' || x === 'mega' || x === 'kfiles';
}

async function resolveRedirect(url) {
  try {
    const res = await axios.get(url, {
      maxRedirects: 10,
      validateStatus: status => status >= 200 && status < 400,
      headers: {
        'User-Agent': USER_AGENTS[0],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Referer': 'https://nontonanimex.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Connection': 'keep-alive'
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 15000
    });
    return res.request.res.responseUrl || res.config.url;
  } catch (e) { return null; }
}

class NontonAnimeXScraper {
  constructor() {
    this.creator = 'rynaqrtz';
    this.base = BASE_URL;
    this._last = null;
  }

  _clean(o) {
    if (o === null || o === undefined) return undefined;
    if (Array.isArray(o)) {
      const c = o.map(i => this._clean(i)).filter(i => i !== undefined);
      return c.length ? c : undefined;
    }
    if (typeof o === 'object') {
      const r = {};
      for (const k of Object.keys(o)) {
        const v = this._clean(o[k]);
        if (v !== undefined) r[k] = v;
      }
      return Object.keys(r).length ? r : undefined;
    }
    return o;
  }

  _parseList(html) {
    const $ = cheerio.load(html);
    const items = [];
    $('div.xrelated').each((i, el) => {
      const link = $(el).find('a.rt').attr('href') || $(el).find('a').attr('href');
      const img = $(el).find('img').attr('src');
      const title = $(el).find('div.titlelist').text().trim();
      const eps = $(el).find('div.eplist').text().trim();
      const score = $(el).find('div.starlist').text().replace('★', '').trim();
      if (title && link) {
        items.push({
          title,
          link: link.startsWith('http') ? link : this.base + link,
          img: img || null,
          eps: eps || null,
          score: score || null
        });
      }
    });
    return items;
  }

  _parsePagination($) {
    const p = { current: 1, next: null, total: null, hasNext: false };
    const links = [];
    $('.pagination a, .pagination span').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href) links.push({ text, href });
    });
    const nums = links.filter(l => /^\d+$/.test(l.text)).map(l => parseInt(l.text));
    if (nums.length) p.total = Math.max(...nums);
    const cur = $('.pagination span.bg-gdark');
    if (cur.length) {
      const t = cur.text().trim();
      if (/^\d+$/.test(t)) p.current = parseInt(t);
    } else {
      const m = (this._last || '').match(/\/page\/(\d+)/);
      if (m) p.current = parseInt(m[1]);
    }
    if (p.total && p.current < p.total) {
      p.hasNext = true;
      const nxt = links.find(l => l.text === '»' || l.text === '>' || l.text.toLowerCase().includes('next'));
      if (nxt && nxt.href) {
        p.next = nxt.href.startsWith('http') ? nxt.href : this.base + nxt.href;
      } else {
        let base = this._last.replace(/\/page\/\d+$/, '').replace(/\/$/, '');
        p.next = base + '/page/' + (p.current + 1);
      }
    }
    return p;
  }

  async home(page = 1) {
    try {
      const url = page === 1 ? this.base + '/' : this.base + `/page/${page}/`;
      this._last = url;
      const html = (await get(url)).data;
      const items = this._parseList(html);
      const $ = cheerio.load(html);
      const pagination = this._parsePagination($);
      return this._clean({ creator: this.creator, page: 'home', data: { url, pagination, items } });
    } catch (e) {
      return this._clean({ creator: this.creator, page: 'home', data: { url: this.base + (page === 1 ? '/' : `/page/${page}/`), pagination: { current: page, hasNext: false }, items: [] } });
    }
  }

  async terbaru(page = 1) {
    const url = page === 1 ? this.base + '/terbaru' : this.base + `/terbaru/page/${page}`;
    this._last = url;
    const html = (await get(url)).data;
    const items = this._parseList(html);
    const $ = cheerio.load(html);
    const pagination = this._parsePagination($);
    return this._clean({ creator: this.creator, page: 'terbaru', data: { url, pagination, items } });
  }

  async jadwalRilis() {
    const url = this.base + '/jadwal-rilis';
    this._last = url;
    const html = (await get(url)).data;
    const $ = cheerio.load(html);
    const schedule = {};
    $('.jdlist div').each((i, el) => {
      const day = $(el).find('h2').text().trim();
      const items = [];
      $(el).find('ul li a').each((j, a) => {
        const title = $(a).text().trim();
        const link = $(a).attr('href');
        if (title && link) items.push({ title, link: link.startsWith('http') ? link : this.base + link });
      });
      if (day && items.length) schedule[day] = items;
    });
    return this._clean({ creator: this.creator, page: 'jadwal-rilis', data: { url, schedule } });
  }

  async ongoing(page = 1) {
    const url = page === 1 ? this.base + '/ongoing' : this.base + `/ongoing/page/${page}`;
    this._last = url;
    const html = (await get(url)).data;
    const items = this._parseList(html);
    const $ = cheerio.load(html);
    const pagination = this._parsePagination($);
    return this._clean({ creator: this.creator, page: 'ongoing', data: { url, pagination, items } });
  }

  async complete(page = 1) {
    const url = page === 1 ? this.base + '/complete' : this.base + `/complete/page/${page}`;
    this._last = url;
    const html = (await get(url)).data;
    const items = this._parseList(html);
    const $ = cheerio.load(html);
    const pagination = this._parsePagination($);
    return this._clean({ creator: this.creator, page: 'complete', data: { url, pagination, items } });
  }

  async genre(slug, page = 1) {
    const url = page === 1 ? this.base + `/genre/${slug}/` : this.base + `/genre/${slug}/page/${page}`;
    this._last = url;
    const html = (await get(url)).data;
    const items = this._parseList(html);
    const $ = cheerio.load(html);
    const pagination = this._parsePagination($);
    return this._clean({ creator: this.creator, page: 'genre', data: { url, slug, pagination, items } });
  }

  async search(query, page = 1) {
    const url = page === 1
      ? this.base + `/search/?q=${encodeURIComponent(query)}`
      : this.base + `/search/page/${page}/?q=${encodeURIComponent(query)}`;
    this._last = url;
    const html = (await get(url)).data;
    const items = this._parseList(html);
    const $ = cheerio.load(html);
    const pagination = this._parsePagination($);
    return this._clean({ creator: this.creator, page: 'search', data: { url, query, pagination, items } });
  }

  async detail(slug) {
    const url = this.base + `/${slug}/`;
    this._last = url;
    const html = (await get(url)).data;
    const $ = cheerio.load(html);
    const title = $('div.htitle h1').text().trim() || $('h1').first().text().trim();
    const score = $('div.htitle span').text().trim() || null;
    const info = {};
    $('ul.infol li').each((i, el) => {
      const txt = $(el).text().trim();
      const parts = txt.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        if (key && val) info[key] = val;
      }
    });
    const eps = [];
    $('#ctlist li').each((i, el) => {
      const link = $(el).find('a').attr('href');
      const title = $(el).find('a').text().trim();
      const date = $(el).find('span').last().text().trim();
      if (link) {
        const num = parseInt(link.match(/episode-(\d+)-/)?.[1]);
        eps.push({ episode: num, title, url: link.startsWith('http') ? link : this.base + link, releaseDate: date || null });
      }
    });
    return this._clean({ creator: this.creator, page: 'detail', slug, data: { url, title, score, info, episodes: eps } });
  }

  async _getEpisodeList(slug) {
    try {
      const detailUrl = this.base + `/${slug}/`;
      const html = (await get(detailUrl)).data;
      const $ = cheerio.load(html);
      const eps = [];
      $('#ctlist li').each((i, el) => {
        const link = $(el).find('a').attr('href');
        const title = $(el).find('a').text().trim();
        if (link) {
          const num = parseInt(link.match(/episode-(\d+)-/)?.[1]);
          if (num) {
            eps.push({
              episode: num,
              title: title || `Episode ${num}`,
              url: link.startsWith('http') ? link : this.base + link
            });
          }
        }
      });
      return eps.sort((a, b) => a.episode - b.episode);
    } catch (e) {
      return [];
    }
  }

  async episode(input, follow = true) {
    let slug, num;
    if (input.includes('http')) {
      const match = input.match(/\/episode\/([^-]+)-episode-(\d+)-/);
      if (!match) throw new Error('Invalid episode URL');
      slug = match[1];
      num = parseInt(match[2]);
    } else {
      const parts = input.split('-episode-');
      if (parts.length === 2) {
        slug = parts[0];
        num = parseInt(parts[1]);
      } else {
        const m = input.match(/^(.+?)-(\d+)$/);
        if (!m) throw new Error('Invalid slug format. Use "slug-episode-number" or "slug-number"');
        slug = m[1];
        num = parseInt(m[2]);
      }
    }

    const url = this.base + `/episode/${slug}-episode-${num}-sub-indo/`;
    this._last = url;
    const html = (await get(url)).data;
    const $ = cheerio.load(html);

    let title = $('.tlpost').text().trim() || $('h1').first().text().trim();
    let poster = $('.imgrpv').attr('src') || null;
    const defaultPlayer = $('#mediaplayer').attr('src') || null;

    const isEnd = title.includes('(End)');

    const embedMap = {};
    const downloadMap = {};
    const promises = [];

    $('.dlist ul li').each((i, el) => {
      const $li = $(el);
      const quality = $li.find('strong').text().trim();
      if (!quality) return;
      const emb = {};
      const dls = {};
      $li.find('a').each((j, a) => {
        const name = $(a).text().trim();
        const href = $(a).attr('href') || '';
        const token = href.split('/go/')[1];
        if (token) {
          const decoded = decodeToken(token);
          if (decoded) {
            if (isEmbed(name)) {
              emb[name] = decoded;
            } else {
              dls[name] = decoded;
            }
          }
        }
      });
      if (Object.keys(emb).length) {
        if (follow) {
          const resolvePromises = Object.entries(emb).map(async ([key, val]) => {
            if (val.includes('link.desustream.com')) {
              const resolved = await resolveRedirect(val);
              return [key, toEmbed(resolved) || resolved || val];
            }
            return [key, toEmbed(val) || val];
          });
          promises.push(Promise.all(resolvePromises).then(results => {
            const resolvedEmb = {};
            results.forEach(([k, v]) => { resolvedEmb[k] = v; });
            if (Object.keys(resolvedEmb).length) embedMap[quality] = resolvedEmb;
          }));
        } else {
          const noFollowEmb = {};
          Object.entries(emb).forEach(([k, v]) => {
            noFollowEmb[k] = toEmbed(v) || v;
          });
          if (Object.keys(noFollowEmb).length) embedMap[quality] = noFollowEmb;
        }
      }
      if (Object.keys(dls).length) {
        if (follow) {
          const resolvePromises = Object.entries(dls).map(async ([key, val]) => {
            if (val.includes('link.desustream.com')) {
              const resolved = await resolveRedirect(val);
              return [key, resolved || val];
            }
            return [key, val];
          });
          promises.push(Promise.all(resolvePromises).then(results => {
            const resolvedDls = {};
            results.forEach(([k, v]) => { resolvedDls[k] = v; });
            if (Object.keys(resolvedDls).length) downloadMap[quality] = resolvedDls;
          }));
        } else {
          if (Object.keys(dls).length) downloadMap[quality] = dls;
        }
      }
    });

    await Promise.all(promises);

    let prev = null, next = null;
    const pLink = $('#prev a').attr('href');
    const nLink = $('#next a').attr('href');

    if (pLink) prev = pLink.startsWith('http') ? pLink : this.base + pLink;
    if (nLink) {
      next = nLink.startsWith('http') ? nLink : this.base + nLink;
      if (isEnd) {
        const nextNum = parseInt(next.match(/episode-(\d+)-/)?.[1]);
        if (nextNum && nextNum > num) {
          const detailUrl = this.base + `/${slug}/`;
          try {
            const detailHtml = (await get(detailUrl)).data;
            const $d = cheerio.load(detailHtml);
            const maxEp = $d('#ctlist li').length;
            if (num >= maxEp) {
              next = null;
            }
          } catch (e) {
            next = null;
          }
        }
      }
    }

    if (!prev && num > 1) prev = this.base + `/episode/${slug}-episode-${num-1}-sub-indo/`;

    const episodeList = await this._getEpisodeList(slug);

    if (!poster || (poster.includes('.jpg') && !poster.includes(slug))) {
      poster = `https://i2.wp.com/nontonanimex.com/assets/images/${slug}.jpg`;
    }

    if (!title || title === '' || title === 'Episode 12') {
      const found = episodeList.find(e => e.episode === num);
      title = found ? found.title : `Episode ${num}`;
    }

    return this._clean({
      creator: this.creator,
      page: 'episode',
      slug,
      data: { url, episode: num, title, poster, defaultPlayer },
      embed: embedMap,
      download: downloadMap,
      prevEpisode: prev,
      nextEpisode: next,
      episodeList: episodeList
    });
  }
}

module.exports = { NontonAnimeXScraper };
