# plushlings.com — storefront + custom-plushie order flow

A parallel build of the boppleheads storefront, **using the same engine**, retargeted for
custom 6-inch plushies sewn from a photo. Five pages share one design system, one cart store,
and the `<image-slot>` web component — identical architecture to the bobblehead bundle.

## What's the same (the engine)
- **`image-slot.js`** — unchanged drag/drop image-placeholder web component.
- **Cart store + helpers** in `app.js` (`getCart`/`addToCart`/`updateQty`/…), the scroll-reveal,
  header active-state, mobile menu, money formatting, and toast — same code, new catalog.
- **Design system** `styles.css` — same tokens, components, and patterns. Only the accent color
  changed: orange `#FF5A1F` → rosy pink `#FF5C8A` (with matching tint/glow), so the brand reads
  as its own thing.
- **Same option-tile → recompute-price → re-render-summary pattern** in `custom.js` and
  `product.js`, and the same multi-page routing.

## What's different (the product)
- **Brand**: plushlings. Copy swaps bobblehead-isms (sculpt, nod, wobble) for plushie-isms
  (sew, stitch, squish, hug).
- **Fixed size**: every plushie is **6"**. The builder's old "Size" step is reused for **Fabric**
  (Minky / Cotton / Sherpa); "Pose" → **Expression**; "Base" → **Accessory**. The product page's
  "Size" tiles became **Fabric**, "Base" became **Add-on**.
- **Catalog** (`PRODUCTS` in `app.js`): plushie styles across Pets / Couples / Kids / Pop / Holiday.
- **Pricing**: base from $36; custom builder base $36. Promo code **`SQUISH10`** (10% off),
  free shipping over $60.

## Files
`index.html` (home) · `shop.html` (catalog, inline script) · `product.html` + `product.js`
(detail) · `custom.html` + `custom.js` (builder) · `cart.html` + `cart.js` (cart/checkout) ·
`styles.css` (design system) · `app.js` (cart + catalog) · `image-slot.js` (placeholder component).

As in the original, `<image-slot>` is a prototype-only placeholder — replace each with a real
`<img>` fed by product/customer data before shipping to production.
