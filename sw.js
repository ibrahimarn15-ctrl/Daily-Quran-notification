// -------------------------
// sw.js
// Daily Quran Notification Service Worker
// -------------------------

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Listen to messages from main page
self.addEventListener('message', event => {
    if(event.data === "start"){
        initNotifications();
    }
});

// Main function: fetch JSON & schedule notification
function initNotifications(){
    const ayatPerDay = parseInt(localStorage.getItem('ayatPerDay')) || 1;
    const langs = JSON.parse(localStorage.getItem('selectedLangs') || '["bn"]');
    const audioEnabled = localStorage.getItem('audioEnable') === 'true';
    const jsonURL = 'https://ibrahimarn15-ctrl.github.io/Daily-Quran-notification/quran.json';

    caches.open('ayat-cache').then(cache => {
        cache.match('lastIndex').then(res => {
            res?.json().then(lastIndex => {
                fetchAndNotify(jsonURL, lastIndex || 0, ayatPerDay, langs, audioEnabled);
            }).catch(()=> fetchAndNotify(jsonURL, 0, ayatPerDay, langs, audioEnabled));
        }).catch(()=> fetchAndNotify(jsonURL, 0, ayatPerDay, langs, audioEnabled));
    });
}

// Fetch JSON & show notification
function fetchAndNotify(url, lastIndex, ayatPerDay, langs, audioEnabled){
    fetch(url)
      .then(res => res.json())
      .then(ayats => {
          let index = lastIndex;

          for(let i=0; i<ayatPerDay; i++){
              const ayat = ayats[index];

              let bodyText = ayat.arabic + "\n";
              langs.forEach(l=>{
                  if(ayat.translation[l]) bodyText += ayat.translation[l] + "\n";
              });

              self.registration.showNotification(`${ayat.surah} : ${ayat.ayah}`, {
                  body: bodyText.trim(),
                  icon: "https://i.ibb.co/youricon.png", // <-- Update your icon if needed
                  vibrate: [200,100,200],
                  actions: [
                      { action: "audio", title: "🔊 Listen Audio" },
                      { action: "open", title: "🌐 Open Site" }
                  ],
                  data: {
                      url: "https://ibrahimarn15-ctrl.github.io/Daily-Quran-notification/",
                      audio: ayat.audio
                  }
              });

              if(audioEnabled){
                  clients.matchAll().then(clientsArr=>{
                      clientsArr.forEach(client=>{
                          client.postMessage({type:'PLAY_AUDIO', url: ayat.audio});
                      });
                  });
              }

              index++;
              if(index >= ayats.length) index = 0;
          }

          // Save lastIndex
          caches.open('ayat-cache').then(cache=>{
              cache.put('lastIndex', new Response(JSON.stringify(index)));
          });

          // Schedule next day
          setTimeout(()=> fetchAndNotify(url, index, ayatPerDay, langs, audioEnabled), 24*60*60*1000);
      });
}

// Notification click handler
self.addEventListener('notificationclick', function(event){
    event.notification.close();
    const url = event.notification.data?.url;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients=>{
            for(let client of windowClients){
                if(client.url === url && "focus" in client) return client.focus();
            }
            if(clients.openWindow) return clients.openWindow(url);
        })
    );
});
