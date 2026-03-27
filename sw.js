let ayats = [];
let index = 0;

// Load Quran JSON
async function loadAyats(){
  const res = await fetch('https://ibrahimarn15-ctrl.github.io/Daily-Quran-notification/quran.json');
  ayats = await res.json();
}

self.addEventListener('install', e=>{
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(loadAyats());
});

// Default settings
let settings = {
  ayatPerDay: 1,
  langs: ["bn"],
  audio: false,
  time: "09:00"
};

// Receive settings from page
self.addEventListener('message', e=>{
  if(e.data.type === "start"){
    settings = e.data.settings;
    scheduleNext();
  }
});

// Calculate next notification time
function scheduleNext(){
  const now = new Date();
  const [h, m] = settings.time.split(":");
  let next = new Date();
  next.setHours(h, m, 0, 0);
  if(next <= now){
    next.setDate(next.getDate() + 1);
  }

  const delay = next - now;
  setTimeout(()=>{
    sendNotification();
    scheduleNext();
  }, delay);
}

// Send notification
function sendNotification(){
  for(let i=0;i<settings.ayatPerDay;i++){
    const ayat = ayats[index];

    let text = ayat.arabic + "\n";
    settings.langs.forEach(l=>{
      if(ayat.translation[l]){
        text += ayat.translation[l] + "\n";
      }
    });

    self.registration.showNotification(
      `🌙 ${ayat.surah} : ${ayat.number}`,
      {
        body: text.trim(),
        icon: "https://i.ibb.co/youricon.png",
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

    index++;
    if(index >= ayats.length) index = 0;
  }
}

// Notification click handler
self.addEventListener('notificationclick', event=>{
  event.notification.close();
  const action = event.action;
  const data = event.notification.data;

  if(action === "audio"){
    event.waitUntil(
      clients.matchAll().then(clientsArr=>{
        clientsArr.forEach(c=>{
          c.postMessage({type:"PLAY_AUDIO", url:data.audio});
        });
      })
    );
  } else {
    event.waitUntil(clients.openWindow(data.url));
  }
});
