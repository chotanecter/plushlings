/* =========================================================================
   cart.js — cart page (plushlings)
   ========================================================================= */
(function(){
  const FREE_SHIP=60;
  const SHIP_COST=8;
  const PROMO_CODE="SQUISH10";
  const $=s=>document.querySelector(s);
  let promoApplied=false;

  function render(){
    const cart=getCart();
    const grid=$("#cartGrid"), empty=$("#emptyCart"), list=$("#citems");
    if(!cart.length){
      grid.style.display="none";
      empty.style.display="flex";
      return;
    }
    grid.style.display="";
    empty.style.display="none";
    list.innerHTML="";

    cart.forEach((it,idx)=>{
      const row=document.createElement("div");
      row.className="citem";
      const slotId=it.slot||("cart-"+idx);
      row.innerHTML=`
        <div class="citem-media"><image-slot id="${slotId}" placeholder=" "></image-slot></div>
        <div class="citem-info">
          <span class="nm">${it.name}</span>
          ${it.custom?'<div class="citem-tags"><span class="tag">1-of-1 custom</span></div>':""}
          ${it.variant?`<span class="vr">${it.variant}</span>`:""}
          <button class="rm" data-rm="${idx}" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>Remove</button>
        </div>
        <div class="citem-right">
          <span class="pr">${money2(it.price*it.qty)}</span>
          <div class="stepper">
            <button data-dec="${idx}" aria-label="Decrease"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>
            <span class="qv">${it.qty}</span>
            <button data-inc="${idx}" aria-label="Increase"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
          </div>
        </div>`;
      list.appendChild(row);
    });

    /* totals */
    const sub=cartSubtotal();
    const discount=promoApplied?Math.round(sub*0.1):0;
    const subAfter=sub-discount;
    const freeShip=subAfter>=FREE_SHIP;
    const ship=cart.length?(freeShip?0:SHIP_COST):0;
    const total=subAfter+ship;

    $("#subtotal").textContent=money2(sub);
    $("#shipping").innerHTML=freeShip?'<span class="v free">Free</span>':money2(ship);
    $("#total").textContent=money2(total);

    /* free-ship progress */
    const pct=Math.min(100,Math.round(subAfter/FREE_SHIP*100));
    $("#shipBar").style.width=pct+"%";
    if(freeShip){
      $("#shipHint").innerHTML='<b>Free shipping</b> unlocked — nice.';
    }else{
      $("#shipHint").innerHTML='Add <b>'+money2(FREE_SHIP-subAfter)+'</b> for free shipping.';
    }

    /* promo row */
    if(promoApplied && !$("#discountRow")){
      const r=document.createElement("div");
      r.className="osum-row"; r.id="discountRow";
      r.innerHTML='<span class="k">Promo — '+PROMO_CODE+'</span><span class="v free">−'+money2(discount)+'</span>';
      $("#subtotal").closest(".osum-rows").appendChild(r);
    }

    /* wire controls */
    list.querySelectorAll("[data-inc]").forEach(b=>b.addEventListener("click",()=>{ updateQty(+b.dataset.inc,1); }));
    list.querySelectorAll("[data-dec]").forEach(b=>b.addEventListener("click",()=>{ updateQty(+b.dataset.dec,-1); }));
    list.querySelectorAll("[data-rm]").forEach(b=>b.addEventListener("click",()=>{ removeItem(+b.dataset.rm); toast("Removed from cart"); }));
  }

  document.addEventListener("DOMContentLoaded",()=>{
    render();
    window.addEventListener("cart:change",render);

    $("#applyPromo").addEventListener("click",()=>{
      const v=$("#promo").value.trim().toUpperCase();
      if(v===PROMO_CODE && !promoApplied){
        promoApplied=true;
        toast("Promo applied — 10% off");
        render();
      }else if(promoApplied){
        toast("Promo already applied");
      }else{
        toast("Hmm, that code didn't work");
      }
    });
    $("#promo").addEventListener("keydown",e=>{ if(e.key==="Enter") $("#applyPromo").click(); });

    $("#checkout").addEventListener("click",()=>{
      if(!getCart().length){ toast("Your cart is empty"); return; }
      $("#ovl").classList.add("show");
      setCart([]); // clear after placing
    });
    $("#ovl").addEventListener("click",e=>{ if(e.target.id==="ovl") $("#ovl").classList.remove("show"); });
  });
})();
