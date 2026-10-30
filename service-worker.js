const CACHE_NAME = "biblia-online-shell-v1";
const APP_SHELL = ["/","/index.html","/styles.css","/app.js","/layout-home.js","/audio-fallback.js","/account-client.js","/conta.html","/infantil.html","/estudos.html","/esbocos.html","/pregacoes.html","/mensagens.html","/devocionais.html","/ferramentas.html","/sobre.html","/privacidade.html","/termos.html","/contato.html","/manifest.webmanifest","/assets/pwa-icon-192.svg","/assets/pwa-icon-512.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin)return;
 if(req.mode==="navigate"){event.respondWith(fetch(req).then(res=>{if(res.ok)caches.open(CACHE_NAME).then(c=>c.put(req,res.clone()));return res;}).catch(async()=> (await caches.match(req))||(await caches.match("/index.html"))));return;}
 event.respondWith(caches.match(req).then(hit=>{if(hit)return hit;return fetch(req).then(res=>{if(res.ok&&/\.(css|js|svg|webmanifest)$/.test(url.pathname)){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy));}return res;});}));
});
