// service-worker.js — v9: aplikacja Kontakty (PWA) + powiadomienia o połączeniach.
// SW_V9 marker wersji.
const CACHE_NAME = 'kontakty-v9';
const CORE_ASSETS = [
    './',
    './index.html',
    './call.html',
    './manifest.json',
    './ringtone.mp3',
    './icon-192.png',
    './icon-512.png',
    './icon-512-maskable.png',
    './apple-touch-icon.png',
    './badge-72.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.allSettled(CORE_ASSETS.map((a) => cache.add(a))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Sieć najpierw (aktualizacje plików wchodzą od razu), cache tylko awaryjnie offline.
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
    event.respondWith(
        fetch(req)
            .then((res) => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }))
    );
});

self.addEventListener('push', (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (e) { return; }

    // Anulowanie/wygaszenie dzwonienia: tylko gasimy powiadomienie o połączeniu, nic nie pokazujemy.
    if (data.type === 'call_cancelled') {
        event.waitUntil(
            self.registration.getNotifications({ tag: `incoming-call-${data.caller}` })
                .then((list) => list.forEach((n) => n.close()))
                .catch(() => {})
        );
        return;
    }

    const options = {
        body: data.body || '',
        icon: 'icon-192.png',
        badge: 'badge-72.png',
        data: data
    };

    if (data.type === 'incoming_call') {
        options.tag = `incoming-call-${data.caller}`;
        options.requireInteraction = true;
        options.renotify = true;
        options.vibrate = [300, 100, 300, 100, 300, 100, 300];
        options.actions = [
            { action: 'answer', title: '📞 Odbierz' },
            { action: 'decline', title: '📵 Odrzuć' }
        ];
    }

    event.waitUntil(self.registration.showNotification(data.title || 'Forum Głosowe', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data || {};
    const swPath = self.location.pathname;
    const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);

    if (data.type === 'incoming_call') {
        const caller = encodeURIComponent(data.caller || '');
        const media = encodeURIComponent(data.media || 'audio');
        let callUrl = `${basePath}call.html?caller=${caller}&media=${media}`;
        if (event.action === 'decline') callUrl += '&action=decline';
        else if (event.action === 'answer') callUrl += '&answer=1';
        event.waitUntil(clients.openWindow(callUrl));
        return;
    }

    const target = data.url || `${basePath}index.html`;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
            for (const w of wins) {
                if (w.url.startsWith(self.location.origin + basePath) && 'focus' in w) return w.focus();
            }
            return clients.openWindow(target);
        })
    );
});
