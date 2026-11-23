/* 포켓 툴 Service Worker
 * 목적: 안드로이드 크롬에서 "앱 설치"가 뜨기 위한 최소 구현.
 *       네트워크 우선 + 실패 시 캐시 폴백(5개 페이지 미리 저장).
 * 원칙: 기기 안에서만 처리하는 도구이므로 업로드·변환 데이터는 다루지 않는다.
 */
const VERSION = 'pocket-tools-v2';
const SCOPE = '/pocket-tools/';
const CORE = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'pdf-image/',
  SCOPE + 'image-compress/',
  SCOPE + 'ratio-collage/',
  SCOPE + 'shopping/'
];

/* 설치: 핵심 페이지 5개를 미리 캐시 (실패해도 설치는 계속) */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(CORE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await cache.put(url, res);
      } catch (e) {
        /* 오프라인 등으로 못 받으면 다음 접속 때 채워진다 */
      }
    }));
    await self.skipWaiting();
  })());
});

/* 활성화: 예전 버전 캐시 정리 후 즉시 제어 */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith('pocket-tools-') && k !== VERSION)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* 요청: 네트워크 우선 → 실패하면 캐시 → 페이지 탐색이면 홈으로 폴백 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // CDN 라이브러리는 그대로 네트워크
  if (!url.pathname.startsWith(SCOPE)) return;          // 이 사이트 범위 밖은 손대지 않음
  if (req.headers.has('range')) return;                 // pdf.js 부분 요청은 브라우저에 맡김

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && fresh.type === 'basic') {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const home = (await cache.match(SCOPE)) || (await cache.match(SCOPE + 'index.html'));
        if (home) return home;
      }
      throw err;
    }
  })());
});
