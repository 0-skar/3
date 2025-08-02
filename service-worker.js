// Plik: service-worker.js

self.addEventListener('push', event => {
    console.log('[Service Worker] Otrzymano powiadomienie push.');

    let notificationData = {};
    try {
        // Próbujemy sparsować dane jako JSON
        notificationData = event.data.json();
    } catch (e) {
        // Jeśli się nie uda, traktujemy dane jako zwykły tekst
        notificationData.title = "Nowa wiadomość";
        notificationData.body = event.data.text();
        notificationData.url = '/'; // Domyślny URL
    }
    
    const title = notificationData.title || 'Nowa wiadomość';
    const options = {
        body: notificationData.body || 'Otrzymałeś nową wiadomość.',
        icon: '/icon-192.png', // Opcjonalnie: dodaj ikonę do folderu
        badge: '/badge-72.png', // Opcjonalnie: dodaj mniejszą ikonę
        data: {
            url: notificationData.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Kliknięto w powiadomienie.');

    // Zamyka powiadomienie
    event.notification.close();

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    // Sprawdza, czy karta z czatem jest już otwarta
    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clientList => {
        // Jeśli jakaś karta jest już otwarta, skupia się na niej
        for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        // Jeśli żadna karta nie jest otwarta, otwiera nową
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});```

### Podsumowanie i dalsze kroki

1.  **Zastąp klucz VAPID:** W pliku `index.html` znajdź linię `const VAPID_PUBLIC_KEY = "TUTAJ_WKLEJ_SWOJ_PUBLICZNY_KLUCZ_VAPID";` i wklej tam swój **publiczny** klucz VAPID.
2.  **Dodaj ikony (opcjonalnie):** W pliku `service-worker.js` znajdują się ścieżki do ikon (`/icon-192.png`, `/badge-72.png`). Możesz stworzyć te pliki graficzne i umieścić je w głównym folderze projektu, aby powiadomienia wyglądały lepiej.
3.  **Wdróż zmiany:** Wrzuć oba pliki (`index.html` i `service-worker.js`) na swój serwer.
4.  **Testowanie:**
    *   Otwórz stronę na nowo.
    *   Zaloguj się. W konsoli przeglądarki powinieneś zobaczyć prośbę o zgodę na powiadomienia. Zaakceptuj ją.
    *   Zaloguj się na drugim koncie w innej przeglądarce/urządzeniu.
    *   Wyślij wiadomość prywatną na pierwsze konto, gdy jego karta z czatem jest **zamknięta**. Po kilku sekundach powinieneś otrzymać powiadomienie push.
