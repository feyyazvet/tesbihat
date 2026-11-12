/* Tesbihat — service worker
   Uygulamayı çevrimdışı çalışır hâle getirir.

   ╔══════════════════════════════════════════════════════════════════╗
   ║  ÖNEMLİ — GÜNCELLEME YAPARKEN                                    ║
   ║  Dualar, zikirler, tasarım, sesler veya simgeler değiştiğinde    ║
   ║  yayınlamadan önce aşağıdaki VERSION değerini bir artırın:       ║
   ║      "tesbihat-v1"  →  "tesbihat-v2"  →  "tesbihat-v3" …         ║
   ║  Böylece telefonlardaki eski kopya silinir ve yeni sürüm iner.   ║
   ║  Yeni ses/simge dosyası eklediyseniz PRECACHE listesine de ekleyin║
   ╚══════════════════════════════════════════════════════════════════╝ */
const VERSION = "tesbihat-v7";
const FONT_CACHE = "tesbihat-fonts";
const QURAN_CACHE = "tesbihat-quran"; // okunan Kur'an sayfaları (sürümden bağımsız saklanır)
const AUDIO_CACHE = "tesbihat-tilavet"; // dinlenen âyet sesleri (sürümden bağımsız saklanır)
const AUDIO_MAX = 600; // en fazla bu kadar âyet sesi saklanır; eskiler silinir

const PRECACHE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-64.png",
  "ses/vesvese-duasi.m4a",
  "ses/uykusuzluk-duasi.m4a",
  "ses/kerb-duasi.m4a"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONT_CACHE && k !== QURAN_CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimAudio(c) {
  const keys = await c.keys();
  if (keys.length > AUDIO_MAX) await Promise.all(keys.slice(0, keys.length - AUDIO_MAX).map((k) => c.delete(k)));
}

/* Ses dosyaları "Range" isteğiyle gelir (özellikle iOS). Önbellekteki tam dosyadan 206 yanıtı üretir. */
async function rangeResponse(req, cached) {
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (!m || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "audio/mp4",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: önbellekten hızlı ver, arka planda yenile
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONT_CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // Tilavet sesleri (everyayah.com): bir kez dinlenen âyet telefona kaydedilir, sonra internetsiz çalar
  if (url.hostname === "everyayah.com") {
    e.respondWith((async () => {
      const c = await caches.open(AUDIO_CACHE);
      const key = url.origin + url.pathname;
      let hit = await c.match(key);
      if (!hit) {
        let r;
        try { r = await fetch(key, { mode: "cors" }); } catch (err) { return Response.error(); }
        if (!r.ok || r.status !== 200) return r;
        await c.put(key, r.clone());
        trimAudio(c);
        hit = r;
      }
      return req.headers.has("range") ? rangeResponse(req, hit) : hit;
    })());
    return;
  }

  // Kur'an metni (Quran.com API): önbellekte varsa hemen ver, arka planda yenile
  if (url.hostname === "api.quran.com") {
    e.respondWith(
      caches.open(QURAN_CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit || Response.error());
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Sayfa: önce ağ (güncel sürüm), yoksa önbellek
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put("index.html", copy)); return r; })
        .catch(() => caches.match("index.html", { ignoreSearch: true }))
    );
    return;
  }

  // Ses dosyaları: Range isteklerini önbellekten karşıla
  if (req.headers.has("range")) {
    e.respondWith(
      caches.match(url.origin + url.pathname, { ignoreSearch: true })
        .then((hit) => (hit ? rangeResponse(req, hit) : fetch(req)))
    );
    return;
  }

  // Diğer dosyalar: önce önbellek, yoksa ağdan alıp sakla
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) =>
      hit ||
      fetch(req).then((r) => {
        if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return r;
      })
    )
  );
});
