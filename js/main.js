// 앱 부트스트랩 & 배선
import { loadFonts } from './fonts.js';
import { initEditor, syncBoxes, deselect } from './textbox.js';
import { initImageLoader } from './imageLoader.js';
import { initPanels } from './panels.js';
import { downloadImage } from './exporter.js';

const $ = sel => document.querySelector(sel);

async function main() {
  const overlay = $('#overlay');

  initEditor(overlay, () => window.dispatchEvent(new Event('selectionchanged')));

  initImageLoader({
    area: $('#canvas-area'),
    dropzone: $('#dropzone'),
    stage: $('#stage'),
    img: $('#stage-img'),
    input: $('#file-input'),
    loadBtn: $('#load-btn'),
  }, () => syncBoxes());

  initPanels({
    fontListEl: $('#font-list'),
    colorRowEl: $('#color-row'),
    rgbInputEl: $('#rgb-input'),
    addBtnEl: $('#add-text-btn'),
    applyBtnEl: $('#apply-btn'),
    cancelBtnEl: $('#cancel-btn'),
  });

  $('#download-btn').addEventListener('click', downloadImage);

  // 빈 영역 클릭 → 선택 해제(글자만 남김)
  overlay.addEventListener('pointerdown', e => { if (e.target === overlay) deselect(); });

  // 폰트 로드 후 미리보기가 제대로 보이도록 대기
  try { await loadFonts(); } catch (e) { console.warn('폰트 로드 일부 실패', e); }
  document.body.classList.add('fonts-ready');
}

main();
