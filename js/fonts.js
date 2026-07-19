// 번들된 큐레이션 폰트 정의 (모두 OFL, 상업적 사용 가능)
export const FONTS = [
  { id: 'gowundodum',    label: '고운돋움', family: 'Gowun Dodum',      file: 'fonts/GowunDodum-Regular.woff2' },
  { id: 'notoserif',     label: '노토명조', family: 'Noto Serif KR',    file: 'fonts/NotoSerifKR.woff2' },
  { id: 'nanummyeongjo', label: '나눔명조', family: 'Nanum Myeongjo',   file: 'fonts/NanumMyeongjo-Bold.woff2' },
  { id: 'gamja',         label: '감자꽃',   family: 'Gamja Flower',     file: 'fonts/GamjaFlower-Regular.woff2' },
  { id: 'nanumpen',      label: '나눔펜',   family: 'Nanum Pen Script', file: 'fonts/NanumPenScript-Regular.woff2' },
  { id: 'gaegu',         label: '개구',     family: 'Gaegu',            file: 'fonts/Gaegu-Regular.woff2' },
];

// 날짜 플레이스홀더 (미리보기 & 새 박스 기본 텍스트)
export const PLACEHOLDER = '2026.07.19';

export function fontById(id) {
  return FONTS.find(f => f.id === id) || FONTS[0];
}

// @font-face를 동적으로 등록하고 로드 완료를 보장
export async function loadFonts() {
  await Promise.all(FONTS.map(async f => {
    const face = new FontFace(f.family, `url("${f.file}")`);
    await face.load();
    document.fonts.add(face);
  }));
  await document.fonts.ready;
}
