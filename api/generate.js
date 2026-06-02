/* =========================================================================
   plushlings.com — /api/generate  (Vercel serverless function)
   Same Gemini engine as boppleheads, NO Meshy 3D step.
   Photo in → Gemini "plushie product shot on white background" → image out.
   ========================================================================= */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Primary model + fallback (mirrors boppleheads' Ghost-429 fallback)
const IMAGE_MODELS = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview'];

// Plushie equivalent of the bobblehead prompt — same design language
// (cute, collectible, recognizable, clean white background), but a soft
// stuffed toy rendered as a simple commercial product shot.
const PLUSHIE_PROMPT = `Transform this photo into a cute, soft plush KEYCHAIN CHARM of the subject. The subject may be a person OR an animal/pet. Produce a simple commercial PRODUCT SHOT. Requirements:
- A small, huggable plush doll (about 4-6 inches tall) in a friendly front-facing standing or sitting pose
- A KEYCHAIN AT THE TOP IS MANDATORY: a small silver/metal split-ring keyring attached to the very top of the plush's head by a short fabric strap or loop, so it clearly reads as a collectible plush keychain charm. The metal ring must be fully visible above the head and must never be cropped or omitted
- Soft fabric look: minky/fleece/felt textures, visible seams and stitching, slightly fuzzy surface
- Chibi/cute proportions: rounded soft body and a gently oversized head, like a high-quality collectible plush
- EYES ARE CRITICAL: large, cute, clearly visible embroidered or glossy felt eyes with catchlights. Eyes are the most prominent facial feature — never omit or minimize them
- Embroidered/stitched facial features (nose, mouth) and a sewn-on look for clothing details
- For people: keep clothing, hairstyle, hair color, and skin tone recognizable but rendered as plush fabric and yarn hair
- For animals/pets: keep the breed, fur color, and distinctive markings recognizable, rendered as soft plush fur
- Clean pure white studio background, soft even lighting, subtle natural contact shadow under the plush
- Full body visible and centered, including the keychain ring at the top, like a catalog/e-commerce product photo
- No text, no watermarks, no extra props, no packaging`;

module.exports = async (req, res) => {
  // Basic CORS (same-origin in prod, permissive for safety)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured on this project.' });
    return;
  }

  // Parse body (Vercel usually parses JSON, but guard for string bodies)
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body) body = {};

  let imageBase64 = body.imageBase64 || '';
  const mimeType = body.mimeType || 'image/jpeg';
  if (!imageBase64) { res.status(400).json({ error: 'Missing imageBase64.' }); return; }
  if (imageBase64.includes('base64,')) imageBase64 = imageBase64.split('base64,')[1];

  const payload = {
    contents: [{
      parts: [
        { text: PLUSHIE_PROMPT },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };
  const reqBody = JSON.stringify(payload);
  let lastError = '';

  for (const model of IMAGE_MODELS) {
    const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reqBody,
      });
    } catch (e) {
      lastError = 'Network error calling Gemini: ' + e.message;
      continue;
    }

    if (response.ok) {
      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (!parts) { lastError = `${model} returned no candidates`; continue; }
      for (const part of parts) {
        if (part.inlineData) {
          res.status(200).json({ image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, model });
          return;
        }
      }
      lastError = `${model} did not return an image`;
      continue;
    }

    let msg = response.statusText;
    try { const err = await response.json(); msg = err.error?.message || msg; } catch {}
    if (response.status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(msg)) {
      lastError = msg; // quota/Ghost-429 → try fallback model
      continue;
    }
    // Hard error — surface it
    res.status(502).json({ error: `Gemini API error (${model}): ${msg}` });
    return;
  }

  res.status(503).json({ error: `Plushie generation is temporarily unavailable. Last: ${lastError}` });
};
