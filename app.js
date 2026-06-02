/* =========================================================================
   plushlings.com — shared app logic
   Cart (localStorage) · catalog data · scroll-reveal · helpers
   Same engine as the storefront; plushie catalog + copy.
   ========================================================================= */

/* ---------------- catalog ---------------- */
const PRODUCTS = [
  { id:"cuddlepup", name:"The Cuddle Pup",      cat:"Pets",    price:39, tag:"Bestseller", blurb:"Floppy ears, stitched smile, permanently mid-tail-wag. Your dog as a six-inch squish.", slot:"p-cuddlepup" },
  { id:"napcat",    name:"Professional Napper", cat:"Pets",    price:39, tag:"",           blurb:"Eyes closed, paws tucked, zero intention of moving. A cat plush that finally sits still.", slot:"p-napcat" },
  { id:"twosome",   name:"The Twosome",         cat:"Couples", price:72, tag:"2-pack",     blurb:"Two plushies, matching outfits, hand-in-felt-hand. Anniversary-grade cuddle.", slot:"p-twosome" },
  { id:"minime",    name:"Mini-Me",             cat:"Kids",    price:36, tag:"New",        blurb:"Your kid, shrunk to six soft inches. Embroidered freckles included.", slot:"p-minime" },
  { id:"deskbuddy", name:"Desk Buddy",          cat:"Pop",     price:38, tag:"",           blurb:"Tiny lanyard, tinier coffee, big supportive energy. The coworker plush that gets it.", slot:"p-deskbuddy" },
  { id:"superhug",  name:"Captain Cuddles",     cat:"Kids",    price:42, tag:"",           blurb:"Cape, mask, and a stitched-on grin. Saves the day, then naps on the shelf.", slot:"p-superhug" },
  { id:"santaplush",name:"Lil' Santa",          cat:"Holiday", price:40, tag:"Seasonal",   blurb:"Red felt suit, cotton-ball beard. Ships in a window-box, ready to be squeezed under the tree.", slot:"p-santaplush" },
  { id:"bandplush", name:"Garage Band Buddy",   cat:"Pop",     price:38, tag:"",           blurb:"Felt guitar, yarn hair, power stance. Rocks softly, forever.", slot:"p-bandplush" },
];
const CATS = ["All","Pets","Couples","Kids","Pop","Holiday"];
/* every plushie is a single huggable size */
const PLUSH_SIZE = '6" Pocket Plush';
const FABRICS = [
  { id:"minky",  label:"Minky fleece",  delta:0  },
  { id:"cotton", label:"Soft cotton",   delta:0  },
  { id:"sherpa", label:"Fuzzy sherpa",  delta:4  },
];

function productById(id){ return PRODUCTS.find(p=>p.id===id); }
function money(n){ return "$"+Number(n).toFixed(0); }
function money2(n){ return "$"+Number(n).toFixed(2); }

/* ---------------- cart (localStorage) ---------------- */
const CART_KEY="plush.cart.v1";
function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||[]; }catch(e){ return []; } }
function setCart(items){ localStorage.setItem(CART_KEY,JSON.stringify(items)); updateCartCount(); window.dispatchEvent(new CustomEvent("cart:change")); }
function cartCount(){ return getCart().reduce((n,i)=>n+i.qty,0); }
function cartSubtotal(){ return getCart().reduce((s,i)=>s+i.price*i.qty,0); }
function addToCart(item){
  const cart=getCart();
  const key=item.id+"|"+(item.variant||"");
  const found=cart.find(i=>(i.id+"|"+(i.variant||""))===key);
  if(found){ found.qty+=item.qty||1; }
  else { cart.push({ ...item, qty:item.qty||1 }); }
  setCart(cart);
}
function updateQty(idx,delta){
  const cart=getCart();
  if(!cart[idx])return;
  cart[idx].qty=Math.max(1,cart[idx].qty+delta);
  setCart(cart);
}
function removeItem(idx){
  const cart=getCart();
  cart.splice(idx,1);
  setCart(cart);
}
function updateCartCount(){
  const n=cartCount();
  document.querySelectorAll(".cart-count").forEach(el=>{
    el.textContent=n;
    el.setAttribute("data-empty", n===0 ? "true":"false");
  });
}

/* ---------------- toast ---------------- */
function toast(msg){
  let t=document.querySelector(".toast");
  if(!t){
    t=document.createElement("div");
    t.className="toast";
    document.body.appendChild(t);
  }
  t.innerHTML='<span class="toast-dot"></span>'+msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove("show"),2400);
}

/* ---------------- scroll reveal ---------------- */
function initReveal(){
  const els=document.querySelectorAll(".rise:not(.in)");
  if(!els.length)return;
  const reveal=el=>el.classList.add("in");
  const vh=window.innerHeight||800;
  els.forEach((e,i)=>{
    const r=e.getBoundingClientRect();
    if(r.top<vh*0.92){ e.style.transitionDelay=(Math.min(i,6)*55)+"ms"; reveal(e); }
  });
  if(!("IntersectionObserver" in window)){ els.forEach(reveal); return; }
  const io=new IntersectionObserver((ents)=>{
    ents.forEach(e=>{ if(e.isIntersecting){ reveal(e.target); io.unobserve(e.target); } });
  },{ threshold:.08, rootMargin:"0px 0px -6% 0px" });
  els.forEach(e=>{ if(!e.classList.contains("in")) io.observe(e); });
  setTimeout(()=>document.querySelectorAll(".rise:not(.in)").forEach(reveal),1200);
}

/* ---------------- header active state + boot ---------------- */
function initHeader(){
  const path=location.pathname.split("/").pop()||"index.html";
  document.querySelectorAll(".nav a").forEach(a=>{
    const href=a.getAttribute("href");
    if(href===path || (path===""&&href==="index.html")) a.classList.add("is-current");
  });
}

/* ---------------- mobile menu ---------------- */
function initMobileMenu(){
  const btn=document.querySelector(".menu-btn");
  const head=document.querySelector(".site-head");
  if(!btn||!head)return;
  let panel=null;
  btn.addEventListener("click",()=>{
    if(!panel){
      panel=document.createElement("div");
      panel.className="mobile-menu";
      const links=[...document.querySelectorAll(".nav a")].map(a=>`<a href="${a.getAttribute("href")}">${a.textContent}</a>`).join("");
      panel.innerHTML=links+`<a class="btn btn--primary" href="custom.html">Make your plushie</a>`;
      head.appendChild(panel);
    }
    panel.classList.toggle("open");
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  updateCartCount();
  initReveal();
  initHeader();
  initMobileMenu();
});
window.addEventListener("storage",updateCartCount);
