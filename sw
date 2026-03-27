const ayats = [
  {
    "surah": "Al-Fatihah",
    "number": 1,
    "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "translation": {
        "bn": "পরম করুণাময়, দয়ালু আল্লাহর নামে।",
        "en": "In the name of Allah, the Most Gracious, the Most Merciful."
    },
    "audio": "https://example.com/audio/ayat1.mp3"
  },
  {
    "surah": "Al-Fatihah",
    "number": 2,
    "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "translation": {
        "bn": "সমস্ত প্রশংসা আল্লাহর যিনি সকল জগতের প্রভু।",
        "en": "All praise is due to Allah, Lord of the worlds."
    },
    "audio": "https://example.com/audio/ayat2.mp3"
  }
  // এখানে সব Quran ayat add করুন
];

self.addEventListener('install', e=>self.skipWaiting());
self.addEventListener('activate', e=>e.waitUntil(self.clients.claim()));

self.addEventListener('message', event=>{
    if(event.data.type==='schedule'){
        sendNotification();
    }
});

function sendNotification(){
    caches.open('ayat-cache').then(cache=>{
        cache.match('lastIndex').then(res=>{
            res?.json().then(lastIndex=>{
                showAyat(lastIndex||0);
            }).catch(()=>showAyat(0));
        }).catch(()=>showAyat(0));
    });
}

function showAyat(lastIndex){
    const ayatPerDay = parseInt(localStorage.getItem('ayatPerDay')) || 1;
    const langs = JSON.parse(localStorage.getItem('selectedLangs') || '["bn"]');
    const audioEnabled = localStorage.getItem('audioEnable')==='true';

    for(let i=0;i<ayatPerDay;i++){
        const index = (lastIndex+i) % ayats.length;
        const ayat = ayats[index];

        let bodyText = ayat.arabic + "\n";
        langs.forEach(l=>{
            if(ayat.translation[l]) bodyText += ayat.translation[l] + "\n";
        });

        self.registration.showNotification(`🌙 ${ayat.surah} : ${ayat.number}`,{
            body: bodyText.trim(),
            icon:"https://i.ibb.co/youricon.png",
            vibrate:[200,100,200]
        });

        if(audioEnabled){
            clients.matchAll().then(clientsArr=>{
                clientsArr.forEach(client=>{
                    client.postMessage({type:'playAudio', url:ayat.audio});
                });
            });
        }
    }

    caches.open('ayat-cache').then(cache=>{
        cache.put('lastIndex', new Response(JSON.stringify((lastIndex+ayatPerDay)%ayats.length)));
    });

    setTimeout(sendNotification, 24*60*60*1000); // next day
}
