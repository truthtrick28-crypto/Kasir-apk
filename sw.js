const CACHE_NAME = 'warung-nosa-v1';
const DYNAMIC_CACHE = 'warung-nosa-dynamic-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Menyimpan file utama secara permanen di HP
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// MEMBAJAK NETWORK AGAR TIDAK MUNCUL DINOSAURUS
self.addEventListener('fetch', event => {
    // Jangan tahan komunikasi live Firebase
    if (event.request.url.includes('firebaseio.com') || event.request.method !== 'GET') {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse; // Buka seketika walau tidak ada internet!
            }
            
            return fetch(event.request).then(networkResponse => {
                if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }
                // Simpan aset baru secara diam-diam
                let responseToCache = networkResponse.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // Di sini Chrome biasanya menampilkan Dinosaurus.
                // Tapi kita menahannya (Karena index.html sudah pasti tertangkap cache di atas).
            });
        })
    );
});
