/* =========================================================================
   custom.js — plush keychain builder (plushlings)
   Three steps: 01 Upload → 02 Preview → 03 Review (quantity + volume pricing).
   Pricing tiers (per unit):
     1–100 = $200 · 101–500 = $4.50 · 501–1,000 = $4.00
     1,001–10,000 = $3.50 · 10,001+ = $3.00
   ========================================================================= */
(function(){
  const MAXQ=20000;
  // display tiers (ranges shown in the table; price is per-unit)
  const TIERS=[
    {label:"3 units",            lo:1,     hi:100,      price:200, sample:true},
    {label:"101–500 units",      lo:101,   hi:500,      price:4.5},
    {label:"501–1,000 units",    lo:501,   hi:1000,     price:4.0},
    {label:"1,001–10,000 units", lo:1001,  hi:10000,    price:3.5},
    {label:"10,001+ units",      lo:10001, hi:Infinity, price:3.0},
  ];

  const state={ qty:500 };
  let step=0;
  const TOTAL=3;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];

  const fmt=n=>"$"+Number(n).toLocaleString("en-US");
  const unitFmt=p=> p<10 ? "$"+p.toFixed(2) : "$"+p;
  function tierFor(q){ return TIERS.find(t=>q>=t.lo&&q<=t.hi) || TIERS[TIERS.length-1]; }
  function unitPrice(q){ return tierFor(q).price; }
  function total(){ return state.qty*unitPrice(state.qty); }

  /* ---- tier reference table ---- */
  function renderTierTable(){
    const el=$("#tierTable");
    if(!el)return;
    const active=tierFor(state.qty);
    el.innerHTML=TIERS.map(t=>`
      <div class="tier-row${t===active?' is-active':''}">
        <span>${t.label}</span>
        <span class="tier-price">${t.sample ? "Samples" : unitFmt(t.price)+" / unit"}</span>
      </div>`).join("");
  }

  /* ---- sticky summary ---- */
  function unitText(q){ return tierFor(q).sample ? "Samples" : unitFmt(unitPrice(q))+" / unit"; }
  function renderSummary(){
    const u=unitPrice(state.qty);
    const rows=[
      ["Item","Plush keychain"],
      ["Quantity",state.qty.toLocaleString("en-US")+" units"],
      ["Unit price",tierFor(state.qty).sample ? "Samples" : unitFmt(u)],
    ];
    const list=$("#sumList");
    if(list) list.innerHTML=rows.map(([k,v])=>`<div class="sum-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
    const t=fmt(total());
    if($("#sumTotal")) $("#sumTotal").textContent=t;
    if($("#addPrice")) $("#addPrice").textContent=t;
    if($("#unitLabel")) $("#unitLabel").textContent=unitText(state.qty);
  }

  function clampQ(v){ v=Math.round(+v||1); return Math.max(1,Math.min(MAXQ,v)); }
  function setQty(v,from){
    state.qty=clampQ(v);
    if(from!=="input" && $("#qtyInput")) $("#qtyInput").value=state.qty;
    if(from!=="slider" && $("#qtySlider")) $("#qtySlider").value=state.qty;
    renderTierTable(); renderSummary();
  }

  /* ---- steps ---- */
  function go(n){
    step=Math.max(0,Math.min(TOTAL-1,n));
    $$("[data-panel]").forEach(p=>p.classList.toggle("is-active",+p.dataset.panel===step));
    $$("#progress .pstep").forEach(s=>{
      const i=+s.dataset.step;
      s.classList.toggle("is-active",i===step);
      s.classList.toggle("is-done",i<step);
    });
    window.scrollTo({top:0,behavior:"smooth"});
  }

  document.addEventListener("DOMContentLoaded",()=>{
    setQty(state.qty);
    renderTierTable();
    renderSummary();

    // quantity controls
    const input=$("#qtyInput"), slider=$("#qtySlider");
    if(input){
      input.addEventListener("input",()=>setQty(input.value,"input"));
      input.addEventListener("blur",()=>{ input.value=state.qty; });
    }
    if(slider) slider.addEventListener("input",()=>setQty(slider.value,"slider"));

    // step nav
    $$("[data-next]").forEach(b=>b.addEventListener("click",()=>{ if(!b.disabled) go(step+1); }));
    $$("[data-back]").forEach(b=>b.addEventListener("click",()=>go(step-1)));
    $$("#progress .pstep").forEach(s=>s.addEventListener("click",()=>{ if(+s.dataset.step<=step) go(+s.dataset.step); }));

    // when a preview is generated: fill the Preview + Review images, then jump to Preview
    window.addEventListener("plush:generated",(e)=>{
      const src=e.detail && e.detail.image;
      const btn=$("#toPreview"); if(btn) btn.disabled=false;
      [["#previewImg","#previewPh"],["#reviewImg","#reviewPh"]].forEach(([imgId,phId])=>{
        const img=$(imgId), ph=$(phId);
        if(img && src){ img.src=src; img.style.display="block"; }
        if(ph) ph.style.display="none";
      });
      if(step===0) go(1);  // auto-advance from Upload → Preview
    });
    // regenerate from the Preview step
    const rb=$("#regenBtn2");
    if(rb) rb.addEventListener("click",()=>{ if(typeof window.plushRegen==="function") window.plushRegen(); });

    // add to cart
    $("#addCustom").addEventListener("click",()=>{
      const u=unitPrice(state.qty);
      const variant=state.qty.toLocaleString("en-US")+" units · "+unitFmt(u)+"/ea";
      addToCart({
        id:"custom-"+Date.now(),
        name:"Custom plush keychain",
        variant:variant,
        price:total(),
        qty:1,
        custom:true,
        slot:"custom-photo",
        meta:{qty:state.qty, unit:u}
      });
      $$("[data-panel]").forEach(p=>p.classList.remove("is-active"));
      $("#success").classList.add("is-active");
      $$("#progress .pstep").forEach(s=>s.classList.add("is-done"));
      if(typeof toast==="function") toast("Added to cart — proof on the way");
      window.scrollTo({top:0,behavior:"smooth"});
    });

    const ma=$("#makeAnother");
    if(ma) ma.addEventListener("click",()=>{ $("#success").classList.remove("is-active"); go(0); });
  });
})();
