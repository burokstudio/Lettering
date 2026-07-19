// 텍스트 박스 오버레이 렌더링 & 상호작용 (이동/회전/크기/삭제/편집/선택)
import { state, getBox, removeBox, fontFamilyOf } from './state.js';
import { PLACEHOLDER } from './fonts.js';

let overlayEl = null;
let onSelectCb = () => {};
const els = new Map(); // boxId -> wrapper element

// 사방 화살표 이동 아이콘
const MOVE_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>';

export function initEditor(overlay, onSelect) {
  overlayEl = overlay;
  onSelectCb = onSelect || (() => {});
}

// state.boxes 기준으로 DOM 재조정
export function syncBoxes() {
  // 제거된 박스 정리
  for (const [id, el] of els) {
    if (!getBox(id)) { el.remove(); els.delete(id); }
  }
  // 추가/갱신
  for (const box of state.boxes) {
    let el = els.get(box.id);
    if (!el) { el = buildBoxEl(box); overlayEl.appendChild(el); els.set(box.id, el); }
    applyBox(el, box);
  }
}

function applyBox(el, box) {
  el.style.left = `${box.cx}px`;
  el.style.top = `${box.cy}px`;
  el.style.transform = `translate(-50%, -50%) rotate(${box.rotation}deg)`;
  el.style.color = box.color;
  el.style.fontFamily = `"${fontFamilyOf(box)}"`;
  el.style.fontSize = `${box.fontSize}px`;
  el.classList.toggle('selected', box.id === state.selectedId);
  const textEl = el.querySelector('.tb-text');
  if (textEl.innerText !== box.text) textEl.innerText = box.text;
  textEl.classList.toggle('empty', !box.text.trim()); // 빈 경우 힌트 플레이스홀더
}

function buildBoxEl(box) {
  const wrap = document.createElement('div');
  wrap.className = 'text-box';
  wrap.dataset.id = box.id;

  const text = document.createElement('div');
  text.className = 'tb-text';
  text.contentEditable = 'true';
  text.spellcheck = false;
  text.dataset.placeholder = PLACEHOLDER; // 힌트로 보일 날짜
  wrap.appendChild(text);

  const del = document.createElement('button');    del.className = 'tb-handle tb-del';    del.title = '삭제'; del.textContent = '×';
  const mov = document.createElement('button');    mov.className = 'tb-handle tb-move';   mov.title = '이동'; mov.innerHTML = MOVE_ICON;
  const size = document.createElement('button');   size.className = 'tb-handle tb-resize'; size.title = '크기';
  wrap.append(del, mov, size);

  wireInteractions(wrap, text, del, mov, size);
  return wrap;
}

function wireInteractions(wrap, text, del, mov, size) {
  const id = Number(wrap.dataset.id);

  // 삭제
  del.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault();
    removeBox(id); syncBoxes(); onSelectCb();
  });

  // 텍스트 입력 반영
  text.addEventListener('input', () => {
    const b = getBox(id); if (b) b.text = text.innerText;
    text.classList.toggle('empty', !text.innerText.trim());
  });
  // 편집 중(포커스 상태)일 때만 전파 차단 → 커서/텍스트 선택 허용.
  // 편집 중이 아니면 wrap으로 전파시켜 글자 위를 잡아도 이동되게 함.
  text.addEventListener('pointerdown', e => { if (document.activeElement === text) e.stopPropagation(); });

  // 몸통: 선택 / 드래그 이동 / 클릭 시 편집
  wrap.addEventListener('pointerdown', e => {
    if (e.target.classList.contains('tb-handle')) return;
    e.preventDefault();
    const b = getBox(id); if (!b) return;
    select(id);

    const rect = overlayEl.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const startCx = b.cx, startCy = b.cy;
    let moved = false;
    try { wrap.setPointerCapture(e.pointerId); } catch {}

    const move = ev => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 4) { moved = true; blurText(text); }
      if (moved) {
        b.cx = clamp(startCx + dx, 0, rect.width);
        b.cy = clamp(startCy + dy, 0, rect.height);
        applyBox(wrap, b);
      }
    };
    const up = () => {
      wrap.removeEventListener('pointermove', move);
      wrap.removeEventListener('pointerup', up);
      if (!moved) focusAtPoint(text, startX, startY); // 한 번 클릭으로 바로 편집(클릭 위치에 커서)
    };
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
  });

  // 이동 (우상단 핸들 드래그)
  mov.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault();
    const b = getBox(id); if (!b) return; select(id);
    const rect = overlayEl.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY, startCx = b.cx, startCy = b.cy;
    try { mov.setPointerCapture(e.pointerId); } catch {}
    const move = ev => {
      b.cx = clamp(startCx + (ev.clientX - startX), 0, rect.width);
      b.cy = clamp(startCy + (ev.clientY - startY), 0, rect.height);
      applyBox(wrap, b);
    };
    const up = () => { mov.removeEventListener('pointermove', move); mov.removeEventListener('pointerup', up); };
    mov.addEventListener('pointermove', move);
    mov.addEventListener('pointerup', up);
  });

  // 크기 (폰트 크기)
  size.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault();
    const b = getBox(id); if (!b) return; select(id);
    const rect = overlayEl.getBoundingClientRect();
    const cx = rect.left + b.cx, cy = rect.top + b.cy;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const startSize = b.fontSize;
    try { size.setPointerCapture(e.pointerId); } catch {}
    const move = ev => {
      const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
      b.fontSize = clamp(startSize * (d / startDist), 8, 600);
      applyBox(wrap, b);
    };
    const up = () => { size.removeEventListener('pointermove', move); size.removeEventListener('pointerup', up); };
    size.addEventListener('pointermove', move);
    size.addEventListener('pointerup', up);
  });
}

// 텍스트 blur + 남아있는 전체선택 하이라이트 제거(해당 요소 내부 선택일 때만)
function blurText(textEl) {
  textEl.blur();
  const sel = window.getSelection();
  if (sel && sel.anchorNode && textEl.contains(sel.anchorNode)) sel.removeAllRanges();
}

// 맨 앞에 커서(생성 직후 힌트용)
function focusAtStart(textEl) {
  textEl.focus();
  const range = document.createRange();
  range.selectNodeContents(textEl);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(range);
}

// 클릭한 위치에 커서(한 번 클릭 편집). 실패 시 맨 뒤.
function focusAtPoint(textEl, x, y) {
  textEl.focus();
  let range = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
  if (!range || !textEl.contains(range.startContainer)) {
    range = document.createRange();
    range.selectNodeContents(textEl);
    range.collapse(false);
  }
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(range);
}

export function select(id) {
  state.selectedId = id;
  syncBoxes();
  onSelectCb();
}

export function deselect() {
  if (state.selectedId == null) return;
  const el = els.get(state.selectedId);
  if (el) blurText(el.querySelector('.tb-text'));
  state.selectedId = null;
  syncBoxes();
  onSelectCb();
}

// 지정한 박스를 바로 편집 상태로(커서 깜빡, 전체선택)
export function editBox(id) {
  const el = els.get(id);
  if (el) focusAtStart(el.querySelector('.tb-text')); // 생성 직후 맨 앞 커서
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
