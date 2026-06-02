/* =========================================================================
   plushie-generate.js — client side of the Gemini plush-keychain generator
   Reusable: wires any "drop zone" that has the expected child elements.
   Used on the custom builder (summary preview) AND the home hero.
   ========================================================================= */
(function () {
  const MAX_DIM = 1024;
  const JPEG_QUALITY = 0.9;

  function fileToResizedDataUrl(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('read fail')); };
      img.src = url;
    });
  }

  async function callGemini(dataUrl) {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: dataUrl, mimeType: 'image/jpeg' }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.image) throw new Error(data.error || 'Generation failed.');
    return data.image;
  }

  // Wire one mount. `els` = {zone, input, src, out, hint, placeholder, status, regen}
  function initMount(els) {
    if (!els.zone || !els.input) return;
    let lastFile = null;

    const setStatus = (state, html) => {
      if (!els.status) return;
      els.status.dataset.state = state;
      els.status.innerHTML = html || '';
      els.status.style.display = html ? 'flex' : 'none';
    };

    async function run(file) {
      lastFile = file;
      if (els.src) { els.src.src = URL.createObjectURL(file); els.src.style.display = els.out ? 'none' : 'block'; }
      if (els.hint) els.hint.style.display = 'none';
      if (els.out) els.out.style.display = 'none';
      if (els.placeholder) els.placeholder.style.display = 'none';
      if (els.regen) els.regen.style.display = 'none';
      setStatus('loading', '<span class="spinner"></span><span>Stitching your plush keychain…<br><small>~10–20 seconds</small></span>');

      let dataUrl;
      try { dataUrl = await fileToResizedDataUrl(file); }
      catch { setStatus('error', 'Could not read that image. Try another.'); return; }

      try {
        const img = await callGemini(dataUrl);
        const target = els.out || els.src;
        if (target) { target.src = img; target.style.display = 'block'; }
        if (els.src && els.out) els.src.style.display = 'none';
        setStatus('idle', '');
        if (els.regen) els.regen.style.display = 'inline-flex';
        if (typeof window.toast === 'function') window.toast('Plush keychain preview ready!');
      } catch (e) {
        setStatus('error', (e.message || 'Generation failed.') + ' <button class="link-btn" data-retry>Retry</button>');
        const rb = els.status && els.status.querySelector('[data-retry]');
        if (rb) rb.onclick = () => run(lastFile);
      }
    }

    els.zone.addEventListener('click', () => els.input.click());
    els.input.addEventListener('change', () => { const f = els.input.files && els.input.files[0]; if (f) run(f); els.input.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => els.zone.addEventListener(ev, e => { e.preventDefault(); els.zone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => els.zone.addEventListener(ev, e => { e.preventDefault(); els.zone.classList.remove('drag'); }));
    els.zone.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) run(f); });
    if (els.regen) els.regen.addEventListener('click', e => { e.stopPropagation(); if (lastFile) run(lastFile); });
  }

  const $ = (id) => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', () => {
    // Custom builder: upload on the left, generated plush in the summary preview.
    initMount({
      zone: $('plushUpload'), input: $('plushFile'),
      src: $('srcPreview'), out: $('genPlushImg'),
      hint: $('plushHint'), placeholder: $('genPlaceholder'),
      status: $('genStatus'), regen: $('regenBtn'),
    });
    // Home hero: drop a photo, the generated plush fills the hero frame.
    initMount({
      zone: $('heroUpload'), input: $('heroFile'),
      src: null, out: $('heroOut'),
      hint: $('heroHint'), placeholder: null,
      status: $('heroStatus'), regen: $('heroRegen'),
    });
  });
})();
