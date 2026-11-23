/* Service worker: guarda o app e o motor de OCR no aparelho para funcionar sem internet.
   Páginas: busca a versão nova primeiro (rede) e usa a guardada se estiver offline.
   Motor de OCR e ícones: usa a cópia guardada (não mudam). */
const VERSAO = "precos-v3";
const ARQUIVOS = [
  "./", "index.html", "manual.html", "manifest.json",
  "icones/icone-192.png", "icones/icone-512.png", "icones/icone-maskable-512.png", "icones/apple-touch-icon.png",
  "vendor/tesseract/tesseract.min.js", "vendor/tesseract/worker.min.js",
  "vendor/tesseract/tesseract-core-lstm.wasm.js", "vendor/tesseract/tesseract-core-simd-lstm.wasm.js",
  "vendor/tesseract/lang/por.traineddata.gz"
];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const pagina = req.mode === "navigate" || /\.(html|json)$/.test(new URL(req.url).pathname);
  if (pagina) {
    ev.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
        return r;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
  } else {
    ev.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
  }
});
