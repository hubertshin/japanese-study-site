// 赤ペン 번역노트 서비스 워커: 앱 셸을 캐시해 홈 화면 앱처럼 열리고 오프라인에서도 문장·해설을 볼 수 있게 함.
// AI 채점은 네트워크가 필요. 캐시 이름에 빌드 시각이 들어가 배포마다 새 캐시로 교체됨.
const CACHE = "akapen-20261006103156";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== location.origin) return; // 폰트·API 요청은 그대로 네트워크로
  // 앱 셸: 네트워크 우선, 실패하면 캐시 (새 배포가 바로 반영되도록)
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
