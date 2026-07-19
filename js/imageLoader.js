// 사진 불러오기(빈 상태 드롭존) + stage 크기 계산/리사이즈
import { state } from './state.js';

let areaEl, dropzoneEl, stageEl, imgEl, fileInput;
let onReady = () => {};

export function initImageLoader({ area, dropzone, stage, img, input, loadBtn }, ready) {
  areaEl = area; dropzoneEl = dropzone; stageEl = stage; imgEl = img; fileInput = input;
  onReady = ready || (() => {});

  dropzoneEl.addEventListener('click', () => fileInput.click());
  if (loadBtn) loadBtn.addEventListener('click', () => fileInput.click()); // 상단 툴바 불러오기
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadFile(fileInput.files[0]);
    fileInput.value = ''; // 같은 파일 다시 선택해도 change 발생하도록
  });

  // 드래그 앤 드롭 (빈 상태 영역)
  ['dragover', 'dragenter'].forEach(ev => areaEl.addEventListener(ev, e => {
    if (!state.image) { e.preventDefault(); dropzoneEl.classList.add('drag'); }
  }));
  ['dragleave', 'drop'].forEach(ev => areaEl.addEventListener(ev, e => {
    e.preventDefault(); dropzoneEl.classList.remove('drag');
  }));
  areaEl.addEventListener('drop', e => {
    if (state.image) return;
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  });

  window.addEventListener('resize', () => { if (state.image) layoutStage(); });
}

function loadFile(file) {
  if (!file.type.startsWith('image/')) { alert('이미지 파일만 불러올 수 있어요.'); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.image = img;
    imgEl.src = url;
    state.boxes = [];        // 새 이미지 → 텍스트 전체 리셋
    state.selectedId = null;
    dropzoneEl.hidden = true;
    stageEl.hidden = false;
    layoutStage(true);
    onReady();               // syncBoxes → 기존 박스 DOM 제거
    window.dispatchEvent(new Event('selectionchanged')); // 패널 상태 갱신
  };
  img.onerror = () => { alert('이미지를 불러오지 못했어요.'); URL.revokeObjectURL(url); };
  img.src = url;
}

// 표시 영역에 맞춰 stage 크기 계산. 리사이즈 시 박스 좌표를 비율에 맞춰 스케일.
function layoutStage(first = false) {
  const avail = availableSize();
  // 편집 영역이 아직 크기를 못 가진 경우(창 최소화/렌더 전) → 다음 프레임에 재시도
  if (avail.w <= 0 || avail.h <= 0) { requestAnimationFrame(() => layoutStage(first)); return; }
  const s = Math.min(avail.w / state.image.naturalWidth, avail.h / state.image.naturalHeight);
  const w = Math.round(state.image.naturalWidth * s);
  const h = Math.round(state.image.naturalHeight * s);

  if (!first && state.stage.w > 0) {
    const k = w / state.stage.w; // 종횡비 유지 → 단일 배율
    for (const b of state.boxes) { b.cx *= k; b.cy *= k; b.fontSize *= k; }
  }
  state.stage = { w, h };
  stageEl.style.width = `${w}px`;
  stageEl.style.height = `${h}px`;
  onReady();
}

function availableSize() {
  const cs = getComputedStyle(areaEl);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  return { w: areaEl.clientWidth - padX, h: areaEl.clientHeight - padY };
}
