/* =========================================================================
   product.js — product detail page (plushlings)
   Same engine as the storefront. "Size" slot is reused for Fabric (every
   plushie is a fixed 6"); "Base" slot is reused for Add-ons.
   ========================================================================= */
(function(){
  const SIZE_OPTS=[ /* fabric — every plushie is a single 6" size */
    {id:"minky",  name:"Minky fleece", sub:"Velvety soft",      delta:0},
    {id:"cotton", name:"Soft cotton",  sub:"Classic & breathable",delta:0},
    {id:"sherpa", name:"Fuzzy sherpa", sub:"Extra fluffy",       delta:4},
  ];
  const BASE_OPTS=[ /* add-ons */
    {id:"none",     name:"None",          delta:0},
    {id:"keychain", name:"Keychain loop", delta:5},
    {id:"giftbox",  name:"Gift box",      delta:6},
    {id:"squeaker", name:"Squeaker",      delta:4},
  ];

  const params=new URLSearchParams(location.search);
  const id=params.get("id")||PRODUCTS[0].id;
  const p=productById(id)||PRODUCTS[0];

  const state={size:"minky",base:"none",engrave:"",qty:1};
  const $=s=>document.querySelector(s);

  function findS(arr,id){ return arr.find(o=>o.id===id); }
  function deltaStr(d){ return d===0?"Included":(d>0?"+$"+d:"−$"+Math.abs(d)); }
  function unit(){
    let v=p.price+findS(SIZE_OPTS,state.size).delta+findS(BASE_OPTS,state.base).delta;
    if(state.engrave) v+=8;
    return v;
  }
  function total(){ return unit()*state.qty; }

  /* hydrate header info */
  document.title=p.name+" — plushlings";
  $("#pKicker").textContent=p.cat;
  $("#pName").textContent=p.name;
  $("#pBlurb").textContent=p.blurb+" Hand-sewn, embroidered, and soft-stuffed for a satisfying squish.";
  $("#crumbCat").textContent=p.cat;
  $("#crumbName").textContent=p.name;
  $("#crumbCat").href="shop.html";

  function renderOpts(){
    const sg=$("#sizeOpts"); sg.innerHTML="";
    SIZE_OPTS.forEach(o=>{
      const b=document.createElement("button");
      b.className="opt"; b.type="button";
      b.setAttribute("aria-pressed",state.size===o.id?"true":"false");
      b.innerHTML=`<span class="opt-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg></span><span class="opt-name">${o.name}</span><span class="opt-sub">${o.sub}</span><span class="opt-delta">${deltaStr(o.delta)}</span>`;
      b.addEventListener("click",()=>{ state.size=o.id; renderOpts(); sync(); });
      sg.appendChild(b);
    });
    const bg=$("#baseOpts"); bg.innerHTML="";
    BASE_OPTS.forEach(o=>{
      const b=document.createElement("button");
      b.className="opt"; b.type="button";
      b.setAttribute("aria-pressed",state.base===o.id?"true":"false");
      b.innerHTML=`<span class="opt-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg></span><span class="opt-name">${o.name}</span><span class="opt-delta">${deltaStr(o.delta)}</span>`;
      b.addEventListener("click",()=>{ state.base=o.id; renderOpts(); sync(); });
      bg.appendChild(b);
    });
  }
  function sync(){
    $("#sizePick").textContent=findS(SIZE_OPTS,state.size).name;
    $("#basePick").textContent=findS(BASE_OPTS,state.base).name;
    $("#pPrice").textContent=money(unit());
    $("#addTotal").textContent=money(total());
    $("#qVal").textContent=state.qty;
  }

  document.addEventListener("DOMContentLoaded",()=>{
    renderOpts(); sync();

    /* related */
    const rel=PRODUCTS.filter(x=>x.id!==p.id).slice(0,4);
    const rg=$("#related");
    rel.forEach(rp=>{
      const a=document.createElement("a");
      a.className="pcard rise"; a.href="product.html?id="+rp.id;
      a.innerHTML=`
        <div class="pcard-media"><image-slot id="rel-${rp.slot}" placeholder="Drop product photo"></image-slot>${rp.tag?`<span class="tag">${rp.tag}</span>`:""}</div>
        <div class="pcard-body"><div class="pcard-row"><h3>${rp.name}</h3><span class="pcard-price">${money(rp.price)}</span></div><p class="pcard-blurb">${rp.blurb}</p><span class="mono pcard-cat">${rp.cat}</span></div>`;
      rg.appendChild(a);
    });
    initReveal();

    $("#qMinus").addEventListener("click",()=>{ state.qty=Math.max(1,state.qty-1); sync(); });
    $("#qPlus").addEventListener("click",()=>{ state.qty=Math.min(10,state.qty+1); sync(); });
    $("#pEngrave").addEventListener("input",e=>{ state.engrave=e.target.value.trim(); sync(); });

    $("#addBtn").addEventListener("click",()=>{
      const fab=findS(SIZE_OPTS,state.size).name, add=findS(BASE_OPTS,state.base).name;
      let variant='6" · '+fab+(state.base==="none"?"":" · "+add);
      if(state.engrave) variant+=' · “'+state.engrave+'”';
      addToCart({ id:p.id, name:p.name, variant, price:unit(), qty:state.qty, slot:p.slot });
      toast(p.name+" added to cart");
    });
  });
})();
