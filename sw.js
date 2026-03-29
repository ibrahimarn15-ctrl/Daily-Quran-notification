// -------------------------
// sw.js (FINAL VERSION)
// Daily Quran Notification (API Based)
// -------------------------

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

let settings = {
  ayatPerDay: 1,
  langs: ['bn'],
  audio: false
};

let isActive = false;

// 🔥 Receive settings from main JS
self.addEventListener('message', event => {
  if(event.data.type === "start"){
    settings = event.data.settings;
    isActive = true;
    sendNotification(); // start immediately
  }

  if(event.data.type === "stop"){
    isActive = false;
  }
});

// 🔥 Get random ayat (API)
async function getAyat(){
  const randomSurah = Math.floor(Math.random()*114)+1;
  const randomAyah = Math.floor(Math.random()*286)+1;

  try{
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomSurah}:${randomAyah}/editions/quran-uthmani,bn.bengali,en.sahih`);
    const data = await res.json();

    return {
      surah: randomSurah,
      ayah: randomAyah,
      arabic: data.data[0].text,
      bn: data.data[1].text,
      en: data.data[2].text,
      audio: `https://everyayah.com/data/Alafasy_64kbps/${String(randomSurah).padStart(3,'0')}${String(randomAyah).padStart(3,'0')}.mp3`
    };
  }catch(e){
    console.log("API error", e);
    return null;
  }
}

// 🔥 Show notification
async function sendNotification(){

  if(!isActive) return;

  for(let i=0; i<settings.ayatPerDay; i++){

    const ayat = await getAyat();
    if(!ayat) continue;

    let bodyText = ayat.arabic + "\n\n";

    settings.langs.forEach(l=>{
      if(l === "bn") bodyText += ayat.bn + "\n\n";
      if(l === "en") bodyText += ayat.en + "\n\n";
    });

    self.registration.showNotification(
      `🌙 Surah ${ayat.surah} : Ayah ${ayat.ayah}`,
      {
        body: bodyText.trim(),
        icon: "https://cdn-icons-png.flaticon.com/512/833/833314.png",
        vibrate: [200,100,200],
        actions: [
          { action: "audio", title: "🔊 Listen Audio" },
          { action: "open", title: "🌐 Open Site" }
        ],
        data: {
          url: "https://ibrahimarn15-ctrl.github.io/Daily-Quran-notification/",
          audio: ayat.audio
        }
      }
    );

    // 🔊 Auto audio
    if(settings.audio){
      const clientsArr = await clients.matchAll();
      clientsArr.forEach(client=>{
        client.postMessage({type:'PLAY_AUDIO', url: ayat.audio});
      });
    }
  }

  // ⏰ Schedule next (24h)
  setTimeout(sendNotification, 24*60*60*1000);
}

// 🔥 Notification click
self.addEventListener('notificationclick', function(event){
  event.notification.close();

  if(event.action === "audio"){
    const audio = event.notification.data.audio;
    clients.matchAll().then(clientsArr=>{
      clientsArr.forEach(client=>{
        client.postMessage({type:'PLAY_AUDIO', url: audio});
      });
    });
    return;
  }

  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients=>{
      for(let client of windowClients){
        if(client.url === url && "focus" in client) return client.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
