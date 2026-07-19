// 앱 전역 상태
import { fontById } from './fonts.js';

export const state = {
  image: null,        // HTMLImageElement (원본)
  stage: { w: 0, h: 0 }, // 화면 표시 크기(px)
  boxes: [],          // TextBox 데이터 배열
  selectedId: null,   // 현재 선택된 박스 id
  color: '#ffffff',   // 현재 컬러(선택 박스 & 새 박스 기본)
  _seq: 1,
};

export function addBox({ fontId, cx, cy, fontSize }) {
  const box = {
    id: state._seq++,
    fontId,
    text: '',            // 빈 상태로 시작 → 힌트 플레이스홀더 표시, 맨 앞 커서
    color: state.color,
    cx, cy,
    fontSize,
    rotation: 0,
  };
  state.boxes.push(box);
  state.selectedId = box.id;
  return box;
}

export function getBox(id) {
  return state.boxes.find(b => b.id === id);
}

export function removeBox(id) {
  state.boxes = state.boxes.filter(b => b.id !== id);
  if (state.selectedId === id) state.selectedId = null;
}

export function fontFamilyOf(box) {
  return fontById(box.fontId).family;
}
