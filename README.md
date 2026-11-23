# pocket-tools (배포 대기 폴더)

안재연 님의 GitHub Pages에 올릴 정적 사이트입니다. 이 폴더 내용 전체가 저장소 루트에 그대로 들어가면 됩니다.

```
.
├── index.html              # 통합 홈 (📷 Photo 3종 + 🛒 Shop 1종 카드, 다크모드 대응, 설치 버튼)
├── pdf-image/index.html    # PDF ↔ 이미지 변환 (기기 내 처리)
├── image-compress/index.html  # 이미지 압축·포맷 변환
├── ratio-collage/index.html   # 비율 리사이즈 & 콜라쥬
├── shopping/index.html     # 장 볼 목록 (일괄 입력 → 카테고리 자동 정리, 태그·메모, 링크 공유)
├── manifest.webmanifest    # PWA 앱 정보 (이름·아이콘·standalone)
├── sw.js                   # 서비스 워커 (설치 조건 + 네트워크 우선 캐시)
├── icon-192.png            # 앱 아이콘 192px
└── icon-512.png            # 앱 아이콘 512px
```

## PWA 설치(안드로이드 크롬)

- `manifest.webmanifest` — name/short_name/start_url/scope `/pocket-tools/`, display `standalone`,
  theme `#4f46e5`, 아이콘 2종(`any maskable`, 안전영역 80% 안쪽으로 그림)
- `sw.js` — `install`(5개 페이지 미리 캐시) / `activate`(구버전 정리) / `fetch`(네트워크 우선 → 캐시 폴백)
- 5개 페이지 모두 manifest 링크 + 아이콘 + apple 메타 + 서비스 워커 등록 스크립트 포함
- 홈에는 `beforeinstallprompt` 를 잡아 "📲 폰에 앱으로 설치하기" 버튼을 띄움 (이미 설치·미지원이면 숨김)
- 아이콘 원본 스크립트: `../pwa-icon-src/make-icons-v2.py` (Pillow) — 다시 만들 때만 사용

세 앱 모두 단일 HTML 파일이고, 서버 전송 없이 브라우저 안에서만 동작합니다.
CDN에서 불러오는 라이브러리만 외부 의존성입니다.

- pdf-image: pdf.js 3.11.174, pdf-lib 1.17.1, jszip 3.10.1 (cdnjs)
- image-compress: 외부 의존성 없음
- ratio-collage: jszip 3.10.1 (jsdelivr)
- shopping: 외부 의존성 없음 (목록은 localStorage `pocket_tools_shopping_v1` — v2 포맷으로 품목마다 `tags`·`memo` 저장, 태그 없는 구버전 데이터도 그대로 로드. 공유 링크는 `CompressionStream` deflate-raw → base64url, 미지원 시 gzip/평문, 링크에 태그·메모 포함)

## 배포된 뒤의 주소 (repo 이름이 `pocket-tools` 일 때)

- 홈: https://wearethe2017-debug.github.io/pocket-tools/
- PDF ↔ 이미지: https://wearethe2017-debug.github.io/pocket-tools/pdf-image/
- 이미지 압축: https://wearethe2017-debug.github.io/pocket-tools/image-compress/
- 비율·콜라쥬: https://wearethe2017-debug.github.io/pocket-tools/ratio-collage/
- 장 볼 목록: https://wearethe2017-debug.github.io/pocket-tools/shopping/

## 배포 이력

- 2026-11-21: 4개 페이지 최초 배포 완료 (`main`, Pages `built`)
- 2026-11-21: PWA(manifest·sw.js·아이콘 2종·설치 버튼) 추가 배포
- 2026-11-23: 홈을 📷 Photo / 🛒 Shop 섹션으로 재구성, 장 볼 목록(장바구니) 페이지 추가
- 2026-11-23: 장 볼 목록에 태그·메모 추가 (빠른 태그 칩, `본가:`·`#태그` 입력 파싱, 태그 필터·태그별 보기, 품목별 메모, 복사·공유 링크에 태그·메모 포함) · sw `pocket-tools-v4`

## (참고) 초기 배포 때 막혔던 부분

Pickle의 GitHub 연결(`@wearethe2017-debug`)은 **기존 저장소의 파일 읽기·쓰기(contents)**만 됩니다.
아래는 모두 거부되었습니다.

| 하려던 일 | 결과 |
|---|---|
| `gh repo create pocket-tools --public` | 403 `Resource not accessible by integration (createRepository)` |
| `POST /repos/.../pages` | 403 `Resource not accessible by integration` |
| `GET /repos/.../pages` | 403 `Resource not accessible by integration` |
| `PATCH /repos/...` (공개 전환 포함) | 403 `Resource not accessible by integration` |
| `.github/workflows/*` 푸시 | `refusing to allow a GitHub App to create or update workflow ... without workflows permission` |
| `git push` (일반 파일) | ✅ 성공 |

그래서 저장소 생성과 Pages 켜기는 사용자가 github.com에서 직접 해야 하고,
그 뒤 파일 업로드·URL 검증은 Pickle이 이어서 할 수 있습니다.

## 사용자가 할 일 (약 1분)

1. https://github.com/new → Repository name `pocket-tools`, **Public**, `Add a README file` 체크 → Create
2. 같은 저장소 **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **/(root)** → Save
3. Pickle 앱 → 연결 → GitHub 에서 이 저장소가 보이도록 허용(설치가 "All repositories"면 자동)

그다음 이 폴더에서:

```bash
bash deploy.sh pocket-tools
```

스크립트가 클론 → 파일 복사 → 커밋·푸시 → Pages 빌드 폴링 → 8개 URL(4페이지 + manifest/sw/아이콘 2종) `curl` 200 확인까지 합니다.
