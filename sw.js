const CACHE = 'zauber-v11';
const FILES = ['./', 'index.html', 'style.css', 'cube.js', 'solver.js', 'twophase.js', 'solvework.js', 'solver4.js', 'i18n.js', 'lessons.js', 'thumbs.js', 'render.js', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
