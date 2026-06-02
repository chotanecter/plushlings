/* =========================================================================
   custom.js — plush keychain builder (plushlings)
   Two steps: 01 Photo (Gemini preview) → 02 Review (order quantity).
   Pricing: 1 piece = $100 sample fee; bulk = $4.50 / piece (default 500).
   ========================================================================= */
(function(){
  const UNIT=4.5;          // per-piece bulk price
  const SAMPLE=100;        // flat fee for a single sample
  const QTY_OPTIONS=[
    {qty:1,    name:"1 — Sample",    sub:"Quality check",  sample:true},
    {qty:250,  name:"250 pieces",   sub:"$4.50 / piece"},
    {qty:500,  name:"500 pieces",   sub:"$4.50 / piece",  popular:true},
    {qty:1000, name:"1,000 pieces", sub:"$4.50 / piece"},
    {qty:2500, name:"2,500 pieces", sub:"$4.50 / piece"},
  ];

  const state={ qty:500 };   // default 500 pieces
  let step=0;
  const TOTAL=2;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];

  const fmt=n=>"$"+Number(n).toLocaleString("en-US");
  function price(){ return state.qty===1 ? SAMPLE : state.qty*UNIT; }
  function unitLabel(){ return state.qty===1 ? "Sample fee" : "$4.50 / piece"; }
  function qtyLabel(){ return state.qty===1 ? "1 piece (sample)" : state.qty.toLocaleString("en-US")+" pieces"; }

  /* ---- quantity tiles ---- */
  function renderQty(){
    const grid=$("#qtyGrid");
    if(!grid)return;
    grid.innerHTML="";
    QTY_OPTIONS.forEach(o=>{
      const sel=state.qty===o.qty;
      const total=o.qty===1?SAMPLE:o.qty*UNIT;
      const b=document.createElement("button");
      b.className="opt"; b.type="button";
      b.setAttribute("aria-pressed",sel?"true":"false");
      b.innerHTML=`
        <span class="opt-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg></span>
        <span class="opt-name">${o.name}${o.popular?' <span class="tag" style="margin-left:4px">Popular</span>':''}</span>
        <span class="opt-sub">${o.sub}</span>
        <span class="opt-delta">${o.sample?"Sample fee · "+fmt(total):fmt(total)}</span>`;
      b.addEventListener("click",()=>{ state.qty=o.qty; renderQty(); renderSummary(); });
      grid.appendChild(b);
    });
  }

  /* ---- sticky summary ---- */
  function renderSummary(){
    const rows=[
      ["Item","Plush keychain"],
      ["Quantity",qtyLabel()],
      ["Price",unitLabel()],
    ];
    const list=$("#sumList");
    if(list) list.innerHTML=rows.map(([k,v])=>`<div class="sum-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
    const t=fmt(price());
    if($("#sumTotal")) $("#sumTotal").textContent=t;
    if($("#addPrice")) $("#addPrice").textContent=t;
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
    renderQty();
    renderSummary();

    $$("[data-next]").forEach(b=>b.addEventListener("click",()=>go(step+1)));
    $$("[data-back]").forEach(b=>b.addEventListener("click",()=>go(step-1)));
    $$("#progress .pstep").forEach(s=>s.addEventListener("click",()=>{ if(+s.dataset.step<=step) go(+s.dataset.step); }));

    $("#addCustom").addEventListener("click",()=>{
      const variant = state.qty===1
        ? "1 piece · Sample fee"
        : state.qty.toLocaleString("en-US")+" pieces · $4.50/ea";
      addToCart({
        id:"custom-"+Date.now(),
        name:"Custom plush keychain",
        variant:variant,
        price:price(),   // total order price as a single line
        qty:1,
        custom:true,
        slot:"custom-photo",
        meta:{...state}
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
