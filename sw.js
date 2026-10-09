// 설치형 앱(PWA)으로 쓸 수 있게 해주는 최소한의 서비스 워커.
// 이 앱은 Firestore 실시간 연동이 핵심이라 오프라인 캐싱을 적극적으로 하면 오히려 옛날 버전이
// 보이거나 데이터가 꼬일 위험이 있다 — 그래서 일부러 아무것도 캐싱하지 않고 항상 네트워크로
// 그대로 흘려보내기만 한다(설치 가능 요건을 채우는 용도가 전부).
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
