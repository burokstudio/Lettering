# 레터링

사진 위에 손글씨/레터링 폰트로 텍스트를 얹어 원본 해상도로 저장하는 웹앱.
정적 파일만으로 동작(서버·빌드 없음). Chrome / Edge 권장.

## 실행 (로컬)

> ⚠️ **`index.html`을 더블클릭해서 열면 동작하지 않습니다.**
> 브라우저 보안 정책상 `file://`에서는 JS 모듈·폰트가 로드되지 않아 화면만 뜨고 아무 기능도 안 됩니다.
> 아래처럼 **작은 로컬 서버로** 실행하세요. (버그가 아니라 모든 웹앱 공통 규칙)

**가장 쉬운 방법 — 더블클릭:**
- **macOS**: Finder에서 **`serve.command`** 더블클릭 → 터미널이 뜨고 브라우저가 자동으로 열림.
  (처음 실행 시 "확인되지 않은 개발자" 경고가 뜨면: 우클릭 → 열기)
- **Windows**: 탐색기에서 **`serve.bat`** 더블클릭.

**터미널에서 실행:**
```bash
# macOS / Linux
./serve.sh            # 기본 8123 포트
./serve.sh 9000       # 포트 지정

# Windows
serve.bat
```

스크립트는 `python`(우선) 또는 `npx serve`를 자동으로 사용하고 브라우저를 열어줌.
주소: `http://127.0.0.1:8123`. 종료는 그 터미널 창에서 `Ctrl+C`.
수동 실행: `python3 -m http.server 8123` (Windows는 `python -m http.server 8123`).

## 배포 (GitHub Pages)

1. 이 폴더를 GitHub 저장소로 push.
2. 저장소 **Settings → Pages → Source: `main` 브랜치 / root** 선택.
3. 몇 분 뒤 `https://<사용자>.github.io/<저장소>/` 로 접속. (서버비 0원)

## 사용법

1. 가운데 영역에 사진을 클릭 또는 드래그해서 불러온다.
2. 오른쪽 **글자** 목록에서 폰트를 고르면 사진 위에 텍스트 박스가 생긴다.
   - 박스를 잡고 드래그 → 이동 / 좌상단 **×** → 삭제 / 우상단 → 회전 / 우하단 → 크기.
   - 박스를 클릭 → 글자 입력(기본값 `2026.07.19`은 전체선택되어 바로 교체됨).
   - 다른 곳 클릭 → 박스 테두리가 사라지고 글자만 남는다. 글자를 다시 클릭 → 재편집.
3. **컬러**에서 화이트/블랙 또는 RGB 직접 선택 → 선택된 박스에 적용.
4. 상단 **다운로드** → PNG/JPG로 원본 해상도 저장.

## 구조

```
index.html
css/style.css
js/
  fonts.js       번들 폰트 정의 & 로드
  state.js       전역 상태 & 텍스트 박스 데이터
  textbox.js     박스 오버레이 렌더 & 이동/회전/크기/편집/선택
  imageLoader.js 사진 불러오기 & stage 크기 계산
  panels.js      글자(폰트)·컬러 패널
  exporter.js    원본 해상도 렌더 & 다운로드
  main.js        부트스트랩/배선
fonts/           번들 폰트(OFL, 상업적 사용 가능)
assets/          로고 등(로고는 추후 추가)
```

## 폰트 라이선스

번들 폰트는 모두 SIL Open Font License(OFL): Gaegu(개구), Nanum Pen Script(나눔펜),
Gamja Flower(감자꽃), Nanum Myeongjo(나눔명조), Noto Serif KR(노토명조), Gowun Dodum(고운돋움)
— 한글 6종. 상업적 사용 가능.

## 폰트 최적화 메모

번들 폰트는 **한글 전체 음절(U+AC00–D7A3, 11,172자)을 유지한 채** `woff2`로 서브셋 완료.
원본 TTF 합계 ~24MB → **woff2 합계 ~2.7MB** (약 89% 감소). 어떤 한글 입력도 깨지지 않음.
재생성이 필요하면 `fonttools`의 `pyftsubset --flavor=woff2 --unicodes=...`로 동일하게 처리.

## 알려진 개선점 (MVP 이후)

- 로고 이미지: 상단 좌측 `#logo`는 현재 텍스트 placeholder. 이미지로 교체 예정.
- 배경 기반 색상 추천 팔레트: 현재 제외(화이트/블랙/RGB만).
- File System Access API 미지원 브라우저(Safari 등)에서는 다운로드 폴더로 저장됨.
