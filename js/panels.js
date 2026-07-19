// 오른쪽 패널: 글자(폰트 리스트 + 추가/적용) + 컬러
import { FONTS, PLACEHOLDER } from './fonts.js';
import { state, addBox, getBox, removeBox } from './state.js';
import { syncBoxes, select, deselect, editBox } from './textbox.js';

const PRESET_COLORS = ['#ffffff', '#000000'];

let currentFontId = FONTS[0].id;   // 다음에 추가될 박스의 기본 폰트(= 마지막 선택)
const fontItems = new Map();       // fontId -> button
let cancelBtnRef = null, applyBtnRef = null; // 취소/적용 버튼(미선택 시 disabled)
let editSnapshot = { id: null, text: '' }; // 선택 시점 텍스트(취소=되돌리기용)
let addCount = 0;                  // 새 박스 위치 계단식 오프셋용(삭제해도 계속 증가)

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 새 텍스트 박스를 기존 박스와 겹치지 않게 어긋난 위치에 추가 → 선택 + 편집
function addTextBox() {
  if (!state.image) { alert('먼저 사진을 불러와 주세요.'); return null; }
  const fontSize = Math.max(24, Math.round(state.stage.h * 0.09));
  const off = (addCount++ % 6) * 40;               // 계단식 오프셋
  const cx = clamp(state.stage.w / 2 - 80 + off, fontSize, state.stage.w - fontSize);
  const cy = clamp(state.stage.h / 2 - 80 + off, fontSize, state.stage.h - fontSize);
  const box = addBox({ fontId: currentFontId, cx, cy, fontSize });
  syncBoxes();
  select(box.id);
  editBox(box.id);
  return box;
}

export function initPanels({ fontListEl, colorRowEl, rgbInputEl, addBtnEl, applyBtnEl, cancelBtnEl }) {
  cancelBtnRef = cancelBtnEl; applyBtnRef = applyBtnEl;
  buildFontList(fontListEl);
  buildColorRow(colorRowEl, rgbInputEl);
  wireControls(addBtnEl, applyBtnEl, cancelBtnEl);
  // 박스가 선택되는 순간의 텍스트를 스냅샷(취소=되돌리기 기준)
  window.addEventListener('selectionchanged', () => {
    const b = getBox(state.selectedId);
    if (b) editSnapshot = { id: b.id, text: b.text };
  });
  window.addEventListener('selectionchanged', refreshActiveStates);
  refreshActiveStates();
}

function buildFontList(listEl) {
  listEl.innerHTML = '';
  fontItems.clear();
  for (const f of FONTS) {
    const item = document.createElement('button');
    item.className = 'font-item';
    item.style.fontFamily = `"${f.family}"`;
    item.innerHTML = `<span class="font-preview">${PLACEHOLDER}</span><span class="font-name">${f.label}</span>`;
    item.addEventListener('click', () => {
      currentFontId = f.id;
      const b = getBox(state.selectedId);
      if (b) { b.fontId = f.id; syncBoxes(); }   // 선택된 박스 폰트 즉시 교체
      else { addTextBox(); return; }             // 미선택 → 새 박스 추가('입력하기'와 동일)
      refreshActiveStates();
    });
    listEl.appendChild(item);
    fontItems.set(f.id, item);
  }
}

function wireControls(addBtn, applyBtn, cancelBtn) {
  // + : 새 텍스트 박스 추가 → 바로 편집(기존 박스와 어긋난 위치)
  addBtn.addEventListener('click', () => addTextBox());

  // 적용 : 편집 완료(테두리·핸들 숨기고 글자만 이미지에 남김)
  applyBtn.addEventListener('click', () => deselect());

  // 취소 : 이번 편집 취소(선택 시점 텍스트로 되돌림, 빈 박스면 삭제)
  cancelBtn.addEventListener('click', () => {
    const b = getBox(state.selectedId);
    if (b) {
      if (editSnapshot.id === b.id) b.text = editSnapshot.text; // 되돌리기
      const removeId = !b.text.trim() ? b.id : null;            // 빈(새) 박스 → 삭제
      deselect();
      if (removeId) { removeBox(removeId); syncBoxes(); }
    } else {
      deselect();
    }
  });
}

// 선택 상태에 맞춰 폰트 active 표시 + 취소/적용 바 노출
function refreshActiveStates() {
  const b = getBox(state.selectedId);
  if (b) currentFontId = b.fontId;                 // 선택된 박스의 폰트를 다음 기본값으로 기억
  const highlightId = b ? currentFontId : null;    // 박스가 선택됐을 때만 active 표시
  for (const [id, el] of fontItems) el.classList.toggle('active', id === highlightId);
  if (cancelBtnRef) cancelBtnRef.disabled = !b;    // 미선택 시 비활성
  if (applyBtnRef) applyBtnRef.disabled = !b;
}

function buildColorRow(rowEl, rgbInput) {
  rowEl.innerHTML = '';
  const swatches = [];

  const applyColor = (color) => {
    state.color = color;
    const b = getBox(state.selectedId);
    if (b) { b.color = color; syncBoxes(); }
    swatches.forEach(s => s.classList.toggle('active', s.dataset.color?.toLowerCase() === color.toLowerCase()));
    rgbInput.value = color;
  };

  for (const c of PRESET_COLORS) {
    const sw = document.createElement('button');
    sw.className = 'swatch';
    sw.dataset.color = c;
    sw.style.background = c;
    sw.addEventListener('click', () => applyColor(c));
    rowEl.appendChild(sw);
    swatches.push(sw);
  }

  // RGB 직접 선택
  const rgbWrap = document.createElement('label');
  rgbWrap.className = 'swatch rgb-swatch';
  rgbWrap.title = 'RGB 직접 선택';
  rgbWrap.appendChild(rgbInput);
  rowEl.appendChild(rgbWrap);
  rgbInput.addEventListener('input', () => applyColor(rgbInput.value));

  applyColor(state.color);

  // 선택 박스 바뀔 때 스와치/피커를 그 박스 색으로 동기화
  window.addEventListener('selectionchanged', () => {
    const b = getBox(state.selectedId);
    if (b) {
      swatches.forEach(s => s.classList.toggle('active', s.dataset.color?.toLowerCase() === b.color.toLowerCase()));
      rgbInput.value = b.color;
    }
  });
}
