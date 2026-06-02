/* =========================================================================
   custom.js — plushie builder flow (plushlings)
   Same engine as the storefront. Every plushie is a fixed 6"; the old
   "size" group is reused for Fabric, "pose" for Expression, "base" for
   Accessory.
   ========================================================================= */
(function(){
  const BASE=36;
  const OPT={
    people:[
      {id:1,name:"Just one",sub:"1 plushie",delta:0},
      {id:2,name:"A duo",sub:"2 plushies",delta:33},
      {id:3,name:"The trio",sub:"3 plushies",delta:66},
    ],
    size:[ /* fabric — all 6" */
      {id:"minky", name:"Minky fleece",sub:"Velvety soft",  delta:0},
      {id:"cotton",name:"Soft cotton", sub:"Breathable",    delta:0},
      {id:"sherpa",name:"Fuzzy sherpa",sub:"Extra fluffy",  delta:4},
    ],
    style:[
      {id:"everyday",name:"Everyday",sub:"As they dress",delta:0},
      {id:"formal",name:"Formal / Suit",sub:"Dressed up",delta:0},
      {id:"pro",name:"Work / Pro",sub:"On the clock",delta:0},
      {id:"athlete",name:"Athlete",sub:"Game day kit",delta:6},
      {id:"hero",name:"Superhero",sub:"Cape included",delta:8},
      {id:"holiday",name:"Holiday",sub:"Seasonal fit",delta:6},
    ],
    pose:[ /* expression */
      {id:"smiley",name:"Smiley",delta:0},
      {id:"sleepy",name:"Sleepy",delta:0},
      {id:"surprised",name:"Surprised",delta:0},
      {id:"derpy",name:"Derpy",delta:0},
    ],
    base:[ /* accessory */
      {id:"none",name:"None",delta:0},
      {id:"bow",name:"Bow",delta:4},
      {id:"scarf",name:"Scarf",delta:5},
      {id:"hat",name:"Tiny hat",delta:6},
    ],
    addons:[
      {id:"engrave",name:"Embroidered name",sub:"On a tag",delta:8},
      {id:"giftbox",name:"Gift box",sub:"Ready to give",delta:6},
      {id:"rush",name:"Rush — 7 days",sub:"Skip the queue",delta:20},
    ],
  };
  const LABELS={people:"People",size:"Fabric",style:"Style",pose:"Expression",base:"Accessory"};

  const state={people:1,size:"minky",style:"everyday",pose:"smiley",base:"none",addons:[],engrave:"",occasion:"",notes:""};
  let step=0;
  const TOTAL=4;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];

  function find(group,id){ return OPT[group].find(o=>String(o.id)===String(id)); }
  function deltaStr(d){ return d===0?"Included":(d>0?"+$"+d:"−$"+Math.abs(d)); }

  /* ---- render option groups ---- */
  function renderGroups(){
    $$("[data-group]").forEach(grid=>{
      const g=grid.dataset.group;
      const multi=grid.dataset.multi==="1";
      grid.innerHTML="";
      OPT[g].forEach(o=>{
        const sel = multi ? state.addons.includes(o.id) : String(state[g])===String(o.id);
        const b=document.createElement("button");
        b.className="opt";
        b.type="button";
        b.setAttribute("aria-pressed",sel?"true":"false");
        b.innerHTML=`
          <span class="opt-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg></span>
          <span class="opt-name">${o.name}</span>
          ${o.sub?`<span class="opt-sub">${o.sub}</span>`:""}
          <span class="opt-delta">${deltaStr(o.delta)}</span>`;
        b.addEventListener("click",()=>{
          if(multi){
            state.addons=state.addons.includes(o.id)?state.addons.filter(x=>x!==o.id):[...state.addons,o.id];
          }else{
            state[g]=o.id;
          }
          renderGroups(); renderSummary();
        });
        grid.appendChild(b);
      });
    });
  }

  /* ---- price ---- */
  function price(){
    let p=BASE;
    p+=find("people",state.people).delta;
    p+=find("size",state.size).delta;
    p+=find("style",state.style).delta;
    p+=find("base",state.base).delta;
    state.addons.forEach(a=>{ const o=OPT.addons.find(x=>x.id===a); if(o)p+=o.delta; });
    return p;
  }

  /* ---- summary ---- */
  function summaryRows(){
    const rows=[
      ["People",find("people",state.people).name],
      ["Fabric",find("size",state.size).name+' · 6"'],
      ["Style",find("style",state.style).name],
      ["Expression",find("pose",state.pose).name],
      ["Accessory",find("base",state.base).name],
    ];
    if(state.addons.length) rows.push(["Extras",state.addons.map(a=>OPT.addons.find(x=>x.id===a).name).join(", ")]);
    if(state.engrave) rows.push(["Embroidery","“"+state.engrave+"”"]);
    if(state.occasion) rows.push(["Occasion",state.occasion]);
    return rows;
  }
  function renderSummary(){
    const list=$("#sumList");
    list.innerHTML=summaryRows().map(([k,v])=>`<div class="sum-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
    $("#sumTotal").textContent=money(price());
    $("#addPrice").textContent=money(price());
  }
  function renderReview(){
    const rows=summaryRows();
    rows.push(["Proof","Free · within 48h"]);
    $("#reviewList").innerHTML=rows.map(([k,v])=>`<div class="sum-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("")
      +`<div class="sum-row" style="padding-top:12px;border-top:1px solid var(--line);margin-top:4px"><span class="k">Total</span><span class="v" style="font-family:var(--display);font-size:18px">${money(price())}</span></div>`;
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
    if(step===3) renderReview();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  /* ---- photo slot fill detection ---- */
  function watchSlot(){
    const slot=$("#upSlot");
    const check=()=>{
      const img=document.querySelector("#custom-photo");
      const filled = !!(img && img.hasAttribute("data-filled"));
      slot.classList.toggle("filled",filled);
    };
    check();
    setInterval(check,500);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    renderGroups();
    renderSummary();
    watchSlot();

    $$("[data-next]").forEach(b=>b.addEventListener("click",()=>go(step+1)));
    $$("[data-back]").forEach(b=>b.addEventListener("click",()=>go(step-1)));
    $$("#progress .pstep").forEach(s=>s.addEventListener("click",()=>{ if(+s.dataset.step<=step) go(+s.dataset.step); }));

    $("#engraveText").addEventListener("input",e=>{ state.engrave=e.target.value.trim(); renderSummary(); });
    $("#occasion").addEventListener("change",e=>{ state.occasion=e.target.value; renderSummary(); });
    $("#notes").addEventListener("input",e=>{ state.notes=e.target.value; });

    $("#addCustom").addEventListener("click",()=>{
      const variant=summaryRows().map(([k,v])=>v).slice(0,5).join(" · ");
      addToCart({
        id:"custom-"+Date.now(),
        name:"Custom plushie",
        variant:variant,
        price:price(),
        qty:1,
        custom:true,
        slot:"custom-photo",
        meta:{...state}
      });
      $$("[data-panel]").forEach(p=>p.classList.remove("is-active"));
      $("#success").classList.add("is-active");
      $$("#progress .pstep").forEach(s=>s.classList.add("is-done"));
      toast("Added to cart — proof on the way");
      window.scrollTo({top:0,behavior:"smooth"});
    });

    $("#makeAnother").addEventListener("click",()=>{
      $("#success").classList.remove("is-active");
      go(0);
    });
  });
})();
