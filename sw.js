// Versão do cache. Atualize o identificador quando os arquivos do app mudarem.
const CACHE_VERSION = 'ecoeletro-v7';

// Arquivos essenciais para abrir o aplicativo mesmo sem conexão.
const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

// Instala o service worker e pré-carrega os arquivos essenciais.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

// Remove versões antigas do cache e ativa esta versão nas abas abertas.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

// Para arquivos do próprio app, tenta a rede primeiro e usa o cache sem conexão.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, responseCopy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => (
        cached || caches.match('index.html')
      ))),
  );
});
