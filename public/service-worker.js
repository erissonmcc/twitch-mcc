const CACHE_VERSION = 'v0.1.3';
const CACHE_NAME = `cache_${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  'styles/index.css',
  'scripts/index.min.js',
  'assets/images/icon.png'
];

// Instala o Service Worker e faz o cache dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Arquivos em cache durante a instalação');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativa o Service Worker e limpa caches antigos, se necessário
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);  // Limpa caches antigos
          }
        })
      );
    })
  );
});

// Intercepta requisições e serve conteúdo a partir do cache, se possível
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Retorna a resposta do cache, ou faz a requisição à rede
        return cachedResponse || fetch(event.request);
      })
  );
});