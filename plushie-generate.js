/* =========================================================================
   plushie-generate.js — client side of the Gemini plushie generator
   Upload a photo → resize → POST /api/generate → show the plushie shot.
   Wires into the custom builder (custom.html).
   ========================================================================= */
(function () {
  const MAX_DIM = 1024;       // downscale longest edge before upload
  const JPEG_QUALITY = 0.9;

  const $ = (s) => document.querySelector(s);

  // Elements (added in custom.html)
  const input = $('#plushFile');
  const zone = $('#plushUpload');
  const srcImg = $('#srcPreview');      // shows the uploaded photo
  const hint = $('#plushHint');         // upload hint overlay
  const genImg = $('#genPlushImg');     // generated plushie image (in summary)
  const genPh = $('#genPlaceholder');   // summary placeholder
  const genStatus = $('#genStatus');    // loading/error text in summary
  const regenBtn = $('#regenBtn');
  if (!input || !zone) return;          // not on this page

  let lastFile = null;

  function setStatus(state, msg) {
    // state: 'idle' | 'loading' | 'done' | 'error'
    if (!genStatus) return;
    genStatus.dataset.state = state;
    genStatus.innerHTML = msg || '';
    genStatus.style.display = msg ? 'flex' : 'none';
  }

  function fileToResizedDataUrl(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
      img.src = url;
    });
  }

  async function generate(file) {
    lastFile = file;
    // show the source photo
    const srcUrl = URL.createObjectURL(file);
    if (srcImg) { srcImg.src = srcUrl; srcImg.style.display = 'block'; }
    if (hint) hint.style.display = 'none';

    // summary preview → loading
    if (genImg) genImg.style.display = 'none';
    if (genPh) genPh.style.display = 'none';
    if (regenBtn) regenBtn.style.display = 'none';
    setStatus('loading',
      '<span class="spinner"></span><span>Stitching your plushie…<br><small>This takes ~10–20 seconds</small></span>');

    let dataUrl;
    try {
      dataUrl = await fileToResizedDataUrl(file);
    } catch (e) {
      setStatus('error', 'Could not read that image. Try another photo.');
      return;
    }

    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType: 'image/jpeg' }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.image) {
        setStatus('error', (data.error || 'Generation failed.') + ' <button id="retryBtn" class="link-btn">Retry</button>');
        const rb = $('#retryBtn'); if (rb) rb.onclick = () => generate(lastFile);
        return;
      }
      // success
      if (genImg) { genImg.src = data.image; genImg.style.display = 'block'; }
      setStatus('idle', '');
      if (regenBtn) regenBtn.style.display = 'inline-flex';
      if (typeof window.toast === 'function') window.toast('Plushie preview ready!');
    } catch (e) {
      setStatus('error', 'Network error. <button id="retryBtn" class="link-btn">Retry</button>');
      const rb = $('#retryBtn'); if (rb) rb.onclick = () => generate(lastFile);
    }
  }

  // wire upload zone
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { const f = input.files && input.files[0]; if (f) generate(f); input.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) =>
    zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
  zone.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) generate(f);
  });
  if (regenBtn) regenBtn.addEventListener('click', () => { if (lastFile) generate(lastFile); });
})();
