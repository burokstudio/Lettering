// 원본 해상도로 렌더 후 다운로드 (File System Access API, 미지원 시 <a download> 폴백)
import { state, fontFamilyOf } from './state.js';

export async function downloadImage() {
  if (!state.image) { alert('먼저 사진을 불러와 주세요.'); return; }
  const canvas = renderFullRes();

  if (window.showSaveFilePicker) {
    let handle;
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: 'lettering.png',
        types: [
          { description: 'PNG 이미지', accept: { 'image/png': ['.png'] } },
          { description: 'JPG 이미지', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } },
        ],
      });
    } catch (e) { if (e.name === 'AbortError') return; throw e; }
    const ext = handle.name.split('.').pop().toLowerCase();
    const type = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
    const blob = await toBlob(canvas, type, 0.95);
    const w = await handle.createWritable();
    await w.write(blob); await w.close();
  } else {
    const blob = await toBlob(canvas, 'image/png');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lettering.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}

function renderFullRes() {
  const natW = state.image.naturalWidth, natH = state.image.naturalHeight;
  const ratio = natW / state.stage.w; // stage → 원본 배율
  const canvas = document.createElement('canvas');
  canvas.width = natW; canvas.height = natH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(state.image, 0, 0, natW, natH);

  for (const box of state.boxes) {
    const text = box.text.replace(/ /g, ' ');
    if (!text.trim()) continue;
    const fs = box.fontSize * ratio;
    ctx.save();
    ctx.translate(box.cx * ratio, box.cy * ratio);
    ctx.rotate(box.rotation * Math.PI / 180);
    ctx.font = `${fs}px "${fontFamilyOf(box)}"`;
    ctx.fillStyle = box.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    const lineH = fs * 1.2;
    const startY = -((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => ctx.fillText(line, 0, startY + i * lineH));
    ctx.restore();
  }
  return canvas;
}

function toBlob(canvas, type, quality) {
  return new Promise(res => canvas.toBlob(res, type, quality));
}
