
const PRODUCTS = [
 {id:'p1',brand:'MICHELIN',name:'Primacy 4+ Touring Tyre',size:'205/55 R16',price:385000,category:'touring',image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=85',transparentImage:'assets/images/tyres/p1_michelin.png',tag:'Popular',rating:'★★★★★',ratingText:'(Customer Favourite · 5.0 Rating)',fitment:'Precision Certified Fit',stock:'In Stock · Ready to Fit',warranty:'5-Year Warranty'},
 {id:'p2',brand:'BRIDGESTONE',name:'Turanza T005 Premium',size:'225/45 R17',price:420000,category:'touring',image:'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=700&q=85',transparentImage:'assets/images/tyres/p2_bridgestone.png',tag:'Premium',rating:'★★★★★',ratingText:'(Top Wet/Dry Grip · 5.0 Rating)',fitment:'Certified Fitment',stock:'In Stock · Immediate Fit',warranty:'5-Year Warranty'},
 {id:'p3',brand:'GOODYEAR',name:'EfficientGrip Performance',size:'195/65 R15',price:315000,category:'economy',image:'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=700&q=85',transparentImage:'assets/images/tyres/p3_goodyear.png',tag:'Value',rating:'★★★★☆',ratingText:'(High Fuel Efficiency · 4.8 Rating)',fitment:'Standard Fitment',stock:'In Stock',warranty:'4-Year Warranty'},
 {id:'p4',brand:'CONTINENTAL',name:'CrossContact SUV Tyre',size:'265/65 R17',price:560000,category:'suv',image:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=85',transparentImage:'assets/images/tyres/p4_continental.png',tag:'SUV',rating:'★★★★★',ratingText:'(Rugged All-Terrain · 5.0 Rating)',fitment:'All-Wheel Drive Fit',stock:'In Stock · 4x4 Certified',warranty:'5-Year Warranty'},
 {id:'p5',brand:'PIRELLI',name:'Scorpion Verde All Season',size:'235/60 R18',price:615000,category:'suv',image:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=85',transparentImage:'assets/images/tyres/p5_pirelli.png',tag:'All season',rating:'★★★★★',ratingText:'(Eco-Impact Certified · 5.0 Rating)',fitment:'SUV & Crossover Fit',stock:'In Stock',warranty:'5-Year Warranty'},
 {id:'p6',brand:'DUNLOP',name:'SP Sport Maxx Performance',size:'215/50 R17',price:398000,category:'performance',image:'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=85',transparentImage:'assets/images/tyres/p6_dunlop.png',tag:'Performance',rating:'★★★★☆',ratingText:'(High-Speed Stability · 4.9 Rating)',fitment:'Sport Tuned Fit',stock:'In Stock · Track Tested',warranty:'4-Year Warranty'}
];
function getStore(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return []}}
function setStore(k,v){localStorage.setItem(k,JSON.stringify(v))}
function money(n){return 'UGX '+Number(n).toLocaleString('en-UG')}
function toast(msg){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
function updateCounts(){const cart=getStore('sesco-cart'),wish=getStore('sesco-wishlist');const cartQty=cart.reduce((a,x)=>a+x.qty,0);document.querySelectorAll('[data-cart-count]').forEach(e=>{if(cartQty>0){e.textContent=cartQty;e.style.display=''}else{e.textContent='';e.style.display='none'}});const wishQty=wish.length;document.querySelectorAll('[data-wish-count]').forEach(e=>{if(wishQty>0){e.textContent=wishQty;e.style.display=''}else{e.textContent='';e.style.display='none'}})}
function addCart(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;let c=getStore('sesco-cart');const f=c.find(x=>x.id===id);f?f.qty++:c.push({id,qty:1});setStore('sesco-cart',c);updateCounts();toast('Added to your demo cart')}
function toggleWish(id){let w=getStore('sesco-wishlist');if(w.includes(id)){w=w.filter(x=>x!==id);toast('Removed from wishlist')}else{w.push(id);toast('Saved to wishlist')}setStore('sesco-wishlist',w);updateCounts();document.querySelectorAll('[data-wish="'+id+'"]').forEach(b=>{b.classList.toggle('is-saved',w.includes(id));const icon=b.querySelector('i');if(icon){icon.className=w.includes(id)?'fa-solid fa-heart':'fa-regular fa-heart';}});if(document.body.dataset.page==='wishlist')renderWishlist()}
function productCard(p){const saved=getStore('sesco-wishlist').includes(p.id);return `<article class="product-card" data-category="${p.category}"><div class="product-image"><span class="product-tag">${p.tag}</span><button class="wishlist-btn ${saved?'is-saved':''}" data-wish="${p.id}" aria-label="Save ${p.name}"><i class="fa-${saved?'solid':'regular'} fa-heart" aria-hidden="true"></i></button><img src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80'"></div><div class="product-info"><span class="brand">${p.brand}</span><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="spec">${p.size}</div><div class="rating">${p.rating} <span>(Customer favourite)</span></div><div class="product-bottom"><div class="price">${money(p.price)}<small> / tyre</small></div><button class="btn btn-dark" data-add="${p.id}">Add to cart</button></div></div></article>`}
function renderProducts(target,items=PRODUCTS){const el=document.querySelector(target);if(el)el.innerHTML=items.map(productCard).join('')}
function renderCart(){const el=document.querySelector('#cart-content');if(!el)return;const c=getStore('sesco-cart');if(!c.length){el.innerHTML=`<div class="empty-state"><div class="big-icon">🛒</div><h2>Your cart is empty</h2><p>Explore our tyre collection and add the products you need.</p><a class="btn btn-primary" href="shop.html">Browse tyres</a></div>`;return}let subtotal=0;const rows=c.map(item=>{const p=PRODUCTS.find(x=>x.id===item.id);if(!p)return '';subtotal+=p.price*item.qty;return `<tr><td><div class="cart-product"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><br><small>${p.size}</small></div></div></td><td>${money(p.price)}</td><td><input type="number" min="1" max="20" value="${item.qty}" data-qty="${p.id}" style="width:65px;padding:8px;border:1px solid #ddd"></td><td><strong>${money(p.price*item.qty)}</strong></td><td><button class="text-link" data-remove="${p.id}">Remove</button></td></tr>`}).join('');el.innerHTML=`<div class="cart-layout"><div style="overflow:auto"><table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><aside class="cart-summary"><h3>Cart summary</h3><div class="summary-row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="summary-row"><span>Delivery</span><span>Confirmed by team</span></div><div class="summary-row total"><span>Total</span><span>${money(subtotal)}</span></div><p style="font-size:12px">This is a frontend demo. No payment or order will be submitted.</p><button class="btn btn-primary" style="width:100%" data-demo-checkout>Request a quote</button><a class="btn btn-outline" style="width:100%;margin-top:10px" href="shop.html">Continue shopping</a></aside></div>`}
function renderWishlist(){const el=document.querySelector('#wishlist-content');if(!el)return;const w=getStore('sesco-wishlist');const items=PRODUCTS.filter(p=>w.includes(p.id));el.innerHTML=items.length?`<div class="products-grid">${items.map(productCard).join('')}</div>`:`<div class="empty-state"><div class="big-icon">♡</div><h2>Your wishlist is waiting</h2><p>Save tyres you want to compare later.</p><a class="btn btn-primary" href="shop.html">Explore tyres</a></div>`}
function renderProductDetail(){const el=document.querySelector('#product-detail');if(!el)return;const id=new URLSearchParams(location.search).get('id')||'p1';const p=PRODUCTS.find(x=>x.id===id)||PRODUCTS[0];el.innerHTML=`<div class="detail-grid"><div class="detail-image"><img src="${p.image}" alt="${p.name}"></div><div class="detail-info"><div class="eyebrow">${p.brand}</div><h1>${p.name}</h1><div class="rating">${p.rating} <span>Customer rating</span></div><div class="spec">Tyre size: <strong>${p.size}</strong></div><div class="price">${money(p.price)} <small style="font-size:12px;color:#718096">per tyre</small></div><p>Designed for dependable everyday driving, confident handling and a comfortable ride. Confirm the exact size and vehicle fitment with our team before purchase.</p><div class="notice">Availability and final pricing are confirmed by our sales team. This demo does not submit an order.</div><div class="detail-actions"><button class="btn btn-primary" data-add="${p.id}">Add to cart</button><button class="btn btn-outline" data-wish="${p.id}">♡ Save for later</button><a class="btn btn-dark" href="contact.html?product=${encodeURIComponent(p.name)}">Ask about this tyre</a></div><table class="spec-table"><tr><td>Brand</td><td>${p.brand}</td></tr><tr><td>Tyre size</td><td>${p.size}</td></tr><tr><td>Category</td><td>${p.category}</td></tr><tr><td>Fitment advice</td><td>Available from our team</td></tr></table></div></div>`}
document.addEventListener('click',e=>{const menu=e.target.closest('.menu-toggle');if(menu){document.querySelector('.nav')?.classList.toggle('open')}const add=e.target.closest('[data-add]');if(add)addCart(add.dataset.add);const wish=e.target.closest('[data-wish]');if(wish)toggleWish(wish.dataset.wish);const rem=e.target.closest('[data-remove]');if(rem){setStore('sesco-cart',getStore('sesco-cart').filter(x=>x.id!==rem.dataset.remove));renderCart();updateCounts()}const faq=e.target.closest('.faq-question');if(faq)faq.parentElement.classList.toggle('open');const checkout=e.target.closest('[data-demo-checkout]');if(checkout)toast('Demo only — connect this button to your enquiry workflow later');const filterBtn=e.target.closest('[data-mobile-filters]');if(filterBtn)document.querySelector('.shop-layout')?.classList.toggle('filters-open');const vidBtn=e.target.closest('#heroVideoToggle');if(vidBtn){const v=document.getElementById('heroVideo');if(v){if(v.paused){v.play();vidBtn.querySelector('.video-control-icon').textContent='⏸';vidBtn.querySelector('.video-control-label').textContent='Pause';vidBtn.setAttribute('aria-label','Pause background video')}else{v.pause();vidBtn.querySelector('.video-control-icon').textContent='▶';vidBtn.querySelector('.video-control-label').textContent='Play';vidBtn.setAttribute('aria-label','Play background video')}}}});
document.addEventListener('change',e=>{if(e.target.matches('[data-qty]')){let c=getStore('sesco-cart');const f=c.find(x=>x.id===e.target.dataset.qty);if(f)f.qty=Math.max(1,Math.min(20,Number(e.target.value)||1));setStore('sesco-cart',c);renderCart();updateCounts()}if(e.target.matches('[data-filter]')){const checked=[...document.querySelectorAll('[data-filter]:checked')].map(x=>x.value);const items=PRODUCTS.filter(p=>!checked.length||checked.includes(p.category));renderProducts('#shop-products',items);const count=document.querySelector('#product-count');if(count)count.textContent=items.length+' products shown'}if(e.target.matches('#sort-products')){const v=e.target.value;const arr=[...PRODUCTS];if(v==='price-low')arr.sort((a,b)=>a.price-b.price);if(v==='price-high')arr.sort((a,b)=>b.price-a.price);if(v==='name')arr.sort((a,b)=>a.name.localeCompare(b.name));renderProducts('#shop-products',arr)}});
document.addEventListener('submit',e=>{if(e.target.matches('#appointmentForm')){e.preventDefault();const name=e.target.appFullName.value.trim();const phone=e.target.appPhone.value.trim();const email=e.target.appEmail.value.trim();const service=e.target.appServices.value;const date=e.target.appDate.value;const time=e.target.appTime.value;const desc=e.target.appDescription.value.trim();const feedback=document.getElementById('appFeedback');if(!name||!phone||!email||!service){toast('Please enter your Name, Phone, Email, and select a Service.');return}const waText=encodeURIComponent(`Hello Sesco Tyres, I would like to book an appointment:\n- Name: ${name}\n- Phone: ${phone}\n- Email: ${email}\n- Service: ${service}${date?'\n- Date: '+date:''}${time?'\n- Time: '+time:''}${desc?'\n- Notes: '+desc:''}`);const waUrl=`https://wa.me/256709828766?text=${waText}`;if(feedback){feedback.style.display='block';feedback.innerHTML=`<strong><i class="fa-solid fa-circle-check"></i> Appointment Request Received for ${name}!</strong><br>We have received your booking request for <strong>${service}</strong>${date?` on <strong>${date}</strong>`:''}${time?` at <strong>${time}</strong>`:''}. Our team will contact you at <strong>${phone}</strong> or <strong>${email}</strong> to confirm your slot.<div style="margin-top:10px"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;color:#fff;background:#25D366;padding:8px 16px;border-radius:4px;font-size:12.5px;font-weight:700;text-decoration:none"><i class="fa-brands fa-whatsapp"></i><span>Confirm on WhatsApp for Instant Slot Confirmation →</span></a></div>`;}toast(`Appointment request submitted for ${name}!`);}if(e.target.matches('#quoteRequestForm')){e.preventDefault();const service=e.target.quoteService.value;const qty=e.target.quoteQuantity.value;const vehicle=e.target.quoteVehicle.value.trim();const name=e.target.quoteName.value.trim();const phone=e.target.quotePhone.value.trim();const notes=e.target.quoteNotes?e.target.quoteNotes.value.trim():'';const feedback=document.getElementById('quoteFeedback');if(!vehicle||!name||!phone){toast('Please fill in your vehicle/tyre size, name, and phone number.');return}const waText=encodeURIComponent(`Hello Sesco Tyres, I would like a quote for:\n- Service: ${service}\n- Quantity: ${qty}\n- Vehicle/Tyre: ${vehicle}\n- Name: ${name}\n- Phone: ${phone}${notes?'\n- Notes: '+notes:''}`);const waUrl=`https://wa.me/256709828766?text=${waText}`;if(feedback){feedback.style.display='block';feedback.innerHTML=`<div style="font-weight:800;font-size:14px;color:#065f46;margin-bottom:6px"><i class="fa-solid fa-circle-check"></i> Quote Request Generated for ${name}!</div><p style="margin:0 0 10px;color:#047857">We have prepared your quotation enquiry for <strong>${service}</strong> (${qty}) for <strong>${vehicle}</strong>${notes?` (<em>${notes}</em>)`:''}. Our workshop team will reach out at <strong>${phone}</strong> shortly.</p><div class="quote-feedback-actions"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background:#25D366;border-color:#25D366;color:#fff;font-size:12.5px;padding:9px 15px;display:inline-flex;align-items:center;gap:7px"><i class="fa-brands fa-whatsapp"></i><span>Send to WhatsApp for 5-Min Priority Quote →</span></a></div>`;}toast(`Quote request submitted for ${name}!`);}if(e.target.matches('[data-demo-form]')){e.preventDefault();const msg=e.target.querySelector('.form-message');if(msg){msg.style.display='block';msg.textContent='Thanks! This is a frontend preview; your information has not been sent. Connect a backend or form service to receive submissions.'}else toast('Demo form only — no information was sent.');e.target.reset()}if(e.target.matches('#tyre-finder')){e.preventDefault();location.href='shop.html?search='+encodeURIComponent([...e.target.querySelectorAll('select')].map(s=>s.value).filter(Boolean).join(' '))}});
function initShowcaseParallax(){const section=document.getElementById('shop-section');const bg=document.getElementById('showcaseParallaxBg');if(!section||!bg)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;let isTicking=false;let isVisible=false;const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{isVisible=entry.isIntersecting;if(isVisible)onScroll();});},{threshold:[0,0.1,0.5,1]});observer.observe(section);function onScroll(){if(!isVisible||isTicking)return;isTicking=true;requestAnimationFrame(()=>{if(window.innerWidth<=768){bg.style.transform='translate3d(0, 0, 0)';isTicking=false;return;}const rect=section.getBoundingClientRect();const vh=window.innerHeight;const progress=(vh-rect.top)/(vh+rect.height);const offset=(progress-0.5)*70;bg.style.transform=`translate3d(0, ${offset.toFixed(1)}px, 0)`;isTicking=false;});}window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll,{passive:true});}
function initShopCarousel(){const track=document.getElementById('shopCarouselTrack');const dotsContainer=document.getElementById('shopIndicators');const timerBar=document.getElementById('shopTimerBar');const slideCounter=document.getElementById('shopSlideCounter');const prevBtn=document.getElementById('shopPrevBtn');const nextBtn=document.getElementById('shopNextBtn');const carouselEl=document.getElementById('shopCarousel');if(!track||!PRODUCTS||!PRODUCTS.length)return;track.innerHTML=PRODUCTS.map((p,idx)=>{const saved=getStore('sesco-wishlist').includes(p.id);const tyreSrc=p.transparentImage||p.image;const starsHtml=Array.from({length:5},(_,s)=>s<((p.rating||'').match(/★/g)||[]).length?'<i class="fa-solid fa-star" aria-hidden="true"></i>':'<i class="fa-regular fa-star" aria-hidden="true"></i>').join('');return `<div class="shop-slide ${idx===0?'active':''}" data-index="${idx}" role="group" aria-roledescription="slide" aria-label="${idx+1} of ${PRODUCTS.length}: ${p.brand} ${p.name}"><div class="showcase-content-grid"><div class="showcase-tyre-column"><div class="showcase-tyre-badges"><span class="showcase-badge-pill">${p.tag}</span><span class="showcase-category-pill">${p.category.toUpperCase()} TYRE</span></div><div class="showcase-tyre-visual"><div class="showcase-glow-back" aria-hidden="true"></div><img class="showcase-tyre-img" src="${tyreSrc}" alt="${p.brand} ${p.name} - ${p.size}" loading="${idx===0?'eager':'lazy'}" onerror="this.onerror=null;this.src='${p.image}'"><div class="showcase-ground-shadow" aria-hidden="true"></div></div></div><div class="showcase-details-column"><div class="showcase-brand-header"><span class="showcase-brand-badge">${p.brand}</span><button class="wishlist-btn showcase-wish-btn ${saved?'is-saved':''}" data-wish="${p.id}" aria-label="Save ${p.name} to wishlist" title="Save to wishlist"><i class="fa-${saved?'solid':'regular'} fa-heart" aria-hidden="true"></i></button></div><h3 class="showcase-product-heading"><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="showcase-rating-line"><span class="showcase-stars" aria-label="5 star rating">${starsHtml}</span><span class="showcase-rating-label">${p.ratingText||'(Customer Favourite · 5.0 Rating)'}</span></div><div class="showcase-specs-matrix"><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-circle-dot" aria-hidden="true"></i> Size</span><strong class="spec-cell-value">${p.size}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Fitment</span><strong class="spec-cell-value">${p.fitment||'Certified Fitment'}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Stock</span><strong class="spec-cell-value is-available">${p.stock||'In Stock · Ready'}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Warranty</span><strong class="spec-cell-value">${p.warranty||'Included'}</strong></div></div><div class="showcase-commerce-footer"><div class="showcase-pricing-block"><span class="showcase-price-val">${money(p.price)}</span><span class="showcase-price-sub">per tyre · Professional fitting included</span></div><div class="showcase-action-group"><button class="btn btn-primary showcase-cart-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i><span>Add to cart</span></button><a class="btn btn-outline showcase-details-btn" href="product.html?id=${p.id}" aria-label="View details for ${p.name}"><span>View Details</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></div></div></div></div>`;}).join('');if(dotsContainer){dotsContainer.innerHTML=PRODUCTS.map((p,idx)=>`<button class="shop-dot ${idx===0?'active':''}" data-slide="${idx}" role="tab" aria-selected="${idx===0?'true':'false'}" aria-label="Slide ${idx+1}: ${p.brand} ${p.name}"></button>`).join('');}let currentIndex=0;let timerId=null;let isHovered=false;PRODUCTS.forEach(p=>{const imgUrl=p.transparentImage||p.image;if(imgUrl){const img=new Image();img.src=imgUrl;}});function resetTimerBar(){if(!timerBar)return;timerBar.classList.remove('running','paused');void timerBar.offsetWidth;timerBar.classList.add('running');}function goToSlide(newIndex){const slides=track.querySelectorAll('.shop-slide');const dots=dotsContainer?dotsContainer.querySelectorAll('.shop-dot'):[];if(!slides.length)return;const prevIndex=currentIndex;currentIndex=(newIndex+slides.length)%slides.length;slides.forEach((slide,idx)=>{if(idx===currentIndex){slide.classList.remove('exiting');slide.classList.add('active');}else if(idx===prevIndex){slide.classList.remove('active');slide.classList.add('exiting');}else{slide.classList.remove('active','exiting');}});dots.forEach((dot,idx)=>{const isActive=idx===currentIndex;dot.classList.toggle('active',isActive);dot.setAttribute('aria-selected',isActive?'true':'false');});if(slideCounter){slideCounter.textContent=`0${currentIndex+1} / 0${slides.length}`;}startAutoTimer();}function startAutoTimer(){clearTimeout(timerId);resetTimerBar();timerId=setTimeout(()=>{if(!isHovered){goToSlide(currentIndex+1);}else{startAutoTimer();}},3000);}if(prevBtn)prevBtn.addEventListener('click',()=>goToSlide(currentIndex-1));if(nextBtn)nextBtn.addEventListener('click',()=>goToSlide(currentIndex+1));if(dotsContainer){dotsContainer.addEventListener('click',e=>{const dot=e.target.closest('.shop-dot');if(dot&&dot.dataset.slide!==undefined){goToSlide(Number(dot.dataset.slide));}});}if(carouselEl){carouselEl.addEventListener('mouseenter',()=>{isHovered=true;if(timerBar)timerBar.classList.add('paused');});carouselEl.addEventListener('mouseleave',()=>{isHovered=false;if(timerBar)timerBar.classList.remove('paused');startAutoTimer();});carouselEl.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){goToSlide(currentIndex-1);e.preventDefault();}else if(e.key==='ArrowRight'){goToSlide(currentIndex+1);e.preventDefault();}});}startAutoTimer();initShowcaseParallax();}
function initServicesCarousel(){
  const wrapper=document.getElementById('servicesCarouselWrapper');
  const viewport=document.getElementById('servicesCarouselViewport');
  const track=document.getElementById('servicesCarouselTrack');
  const prevBtn=document.getElementById('servicesPrevBtn');
  const nextBtn=document.getElementById('servicesNextBtn');
  const dotsContainer=document.getElementById('servicesPagination');
  if(!wrapper||!viewport||!track)return;
  const cards=track.querySelectorAll('.service-slide-card');
  if(!cards.length)return;
  let currentIndex=0;
  let timerId=null;
  let isHovered=false;
  let startX=0;
  let currentX=0;
  let isDragging=false;
  let gap=24;

  function getCardsPerView(){
    if(window.innerWidth>1024)return 3;
    if(window.innerWidth>640)return 2;
    return 1;
  }
  function getMaxIndex(){
    const cpv=getCardsPerView();
    return Math.max(0,cards.length-cpv);
  }
  function updateDimensions(){
    const cpv=getCardsPerView();
    gap=window.innerWidth<=640?16:22;
    const vpWidth=viewport.getBoundingClientRect().width;
    const totalGaps=(cpv-1)*gap;
    const cardWidth=Math.max(200,(vpWidth-totalGaps)/cpv);
    cards.forEach((card,i)=>{
      card.style.flex=`0 0 ${cardWidth}px`;
      card.style.width=`${cardWidth}px`;
      card.style.marginRight=(i===cards.length-1)?'0px':`${gap}px`;
    });
    renderDots();
    moveToSlide(currentIndex,false);
  }
  function renderDots(){
    if(!dotsContainer)return;
    const maxIdx=getMaxIndex();
    let html='';
    for(let i=0;i<=maxIdx;i++){
      html+=`<button class="services-dot ${i===currentIndex?'active':''}" data-index="${i}" aria-label="Go to service slide ${i+1}" role="tab" aria-selected="${i===currentIndex?'true':'false'}"></button>`;
    }
    dotsContainer.innerHTML=html;
  }
  function moveToSlide(index,animate=true){
    const maxIdx=getMaxIndex();
    if(index<0)currentIndex=maxIdx;
    else if(index>maxIdx)currentIndex=0;
    else currentIndex=index;

    const cpv=getCardsPerView();
    const vpWidth=viewport.getBoundingClientRect().width;
    const totalGaps=(cpv-1)*gap;
    const cardWidth=(vpWidth-totalGaps)/cpv;
    const offset=currentIndex*(cardWidth+gap);

    track.style.transition=animate?'transform .5s cubic-bezier(.2,.8,.25,1)':'none';
    track.style.transform=`translate3d(-${offset}px,0,0)`;

    if(dotsContainer){
      const dots=dotsContainer.querySelectorAll('.services-dot');
      dots.forEach((dot,idx)=>{
        const isActive=idx===currentIndex;
        dot.classList.toggle('active',isActive);
        dot.setAttribute('aria-selected',isActive?'true':'false');
      });
    }
    startAutoplay();
  }
  function startAutoplay(){
    stopAutoplay();
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    timerId=setTimeout(()=>{
      if(!isHovered&&!isDragging){
        moveToSlide(currentIndex+1,true);
      }else{
        startAutoplay();
      }
    },4500);
  }
  function stopAutoplay(){
    if(timerId){clearTimeout(timerId);timerId=null;}
  }

  if(prevBtn)prevBtn.addEventListener('click',e=>{e.preventDefault();moveToSlide(currentIndex-1,true);});
  if(nextBtn)nextBtn.addEventListener('click',e=>{e.preventDefault();moveToSlide(currentIndex+1,true);});
  if(dotsContainer){
    dotsContainer.addEventListener('click',e=>{
      const dot=e.target.closest('.services-dot');
      if(dot&&dot.dataset.index!==undefined){
        moveToSlide(Number(dot.dataset.index),true);
      }
    });
  }

  wrapper.addEventListener('mouseenter',()=>{isHovered=true;stopAutoplay();});
  wrapper.addEventListener('mouseleave',()=>{isHovered=false;startAutoplay();});
  wrapper.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){e.preventDefault();moveToSlide(currentIndex-1,true);}
    else if(e.key==='ArrowRight'){e.preventDefault();moveToSlide(currentIndex+1,true);}
  });

  viewport.addEventListener('touchstart',e=>{
    stopAutoplay();
    isDragging=true;
    startX=e.touches[0].clientX;
    currentX=startX;
  },{passive:true});
  viewport.addEventListener('touchmove',e=>{
    if(!isDragging)return;
    currentX=e.touches[0].clientX;
  },{passive:true});
  viewport.addEventListener('touchend',()=>{
    if(!isDragging)return;
    isDragging=false;
    const diff=currentX-startX;
    if(Math.abs(diff)>40){
      if(diff<0)moveToSlide(currentIndex+1,true);
      else moveToSlide(currentIndex-1,true);
    }else{
      startAutoplay();
    }
  });

  let resizeTimer=null;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(updateDimensions,80);
  });

  updateDimensions();
  startAutoplay();
}

document.addEventListener('DOMContentLoaded',()=>{
  updateCounts();
  renderProducts('#featured-products',PRODUCTS.slice(0,4));
  renderProducts('#shop-products',PRODUCTS);
  renderCart();
  renderWishlist();
  renderProductDetail();
  initShopCarousel();
  initServicesCarousel();
  const params=new URLSearchParams(location.search);
  const productInput=document.querySelector('[name="subject"]');
  if(productInput&&params.get('product'))productInput.value='Enquiry about: '+params.get('product');
  if(document.querySelector('#shop-products')&&params.get('search')){
    const search=params.get('search').toLowerCase();
    const found=PRODUCTS.filter(p=>(p.size+' '+p.brand+' '+p.name).toLowerCase().includes(search));
    renderProducts('#shop-products',found);
    const count=document.querySelector('#product-count');
    if(count)count.textContent=found.length+' matching products (demo catalogue)';
  }
  const heroVid=document.getElementById('heroVideo');
  if(heroVid&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    heroVid.pause();
    const b=document.getElementById('heroVideoToggle');
    if(b){
      b.querySelector('.video-control-icon').textContent='▶';
      b.querySelector('.video-control-label').textContent='Play';
    }
  }
  initTestimonialsShowcase();
  initTestimonialsParallax();
  initStickyHeader();
});

function initStickyHeader() {
  const header = document.querySelector('.main-header');
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 35) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initTestimonialsShowcase() {
  const showcase = document.getElementById('testimonialsShowcase');
  if (!showcase) return;

  const mainCard = document.getElementById('testimonialMainCard');
  const track = document.getElementById('testimonialsArcTrack');
  const mainTag = document.getElementById('mainTestimonialTag');
  const mainHeading = document.getElementById('mainTestimonialHeading');
  const mainText = document.getElementById('mainTestimonialText');
  const mainAvatar = document.getElementById('mainTestimonialAvatar');
  const mainName = document.getElementById('mainTestimonialName');
  const mainVehicle = document.getElementById('mainTestimonialVehicle');
  const mainSource = document.getElementById('mainTestimonialSource');

  if (!mainCard || !track) return;

  const circleNodes = Array.from(track.querySelectorAll('.thumb-circle'));
  if (circleNodes.length < 5) return;

  const TESTIMONIALS_DATA = [
    {
      tag: "3D Alignment & Tyres",
      heading: '"Transformed my Prado\'s highway stability completely"',
      text: "I drove in after experiencing high-speed steering vibration on my Prado TX. The Sesco team didn't just push new tyres — they diagnosed uneven tread wear, performed precision computerized 3D laser alignment, and fitted Michelin Primacy 4s. The SUV glides effortlessly on the highway now. Honest technicians and zero guesswork.",
      avatar: "assets/images/testimonials/david-mukasa.jpg",
      name: 'David Mukasa <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Toyota Land Cruiser Prado · Kampala",
      source: '<i class="fa-brands fa-google" aria-hidden="true"></i> Google Verified · 4 days ago'
    },
    {
      tag: "Major Service & Brakes",
      heading: '"Transparent upfront pricing and zero mechanical jargon"',
      text: "As a woman car owner, I usually dread visiting repair garages because of unpredictable, inflated quotes. Sesco Tyres is refreshingly different! They gave me an itemized digital health sheet before touching anything, installed genuine Castrol oils, and completed the full service in 45 minutes while I worked from their clean lounge.",
      avatar: "assets/images/testimonials/sarah-nalubega.jpg",
      name: 'Sarah Nalubega <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Toyota RAV4 Hybrid · Nakasero",
      source: '<i class="fa-solid fa-certificate" style="color:#0284c7" aria-hidden="true"></i> Workshop Verified · 1 week ago'
    },
    {
      tag: "Fleet Maintenance",
      heading: '"Cut our logistics tyre blowouts to zero across 14 trucks"',
      text: "Managing a regional haulage fleet traversing the Northern Corridor requires heavy-duty reliability. We partnered with Sesco Tyres for commercial steer tyres and scheduled pressure maintenance. In 8 months, our fleet tyre life expanded by 30% and costly roadside blowouts dropped to zero. Invaluable logistics partners!",
      avatar: "assets/images/testimonials/ronald-kato.jpg",
      name: 'Eng. Ronald Kato <i class="fa-solid fa-circle-check" title="Verified Commercial Fleet" aria-hidden="true"></i>',
      vehicle: "Logistics Director, LogisAfrica Haulage",
      source: '<i class="fa-brands fa-google" aria-hidden="true"></i> Google Verified · 2 weeks ago'
    },
    {
      tag: "Suspension & Balancing",
      heading: '"Effortless steering and perfect balance on highway & marram roads"',
      text: "Living in Entebbe and commuting to Kampala daily is tough on suspension and tyres. Sesco did a complete dynamic wheel balance and suspension check. No more steering wobble, and tyre grip in wet weather is night and day. Exceptional work and welcoming staff!",
      avatar: "assets/images/testimonials/grace-tumusiime.jpg",
      name: 'Grace Tumusiime <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Subaru Forester · Entebbe",
      source: '<i class="fa-solid fa-certificate" style="color:#0284c7" aria-hidden="true"></i> Workshop Verified · 3 weeks ago'
    },
    {
      tag: "Performance Fitment",
      heading: '"Flawless alloy mounting with zero rim marks or scuffs"',
      text: "Finding technicians who know how to handle delicate low-profile tyres on European wheels is rare in Kampala. The Sesco crew used modern touchless tyre machines and calibrated balancers. Smooth ride and immaculate care of my alloys. Highly recommended for premium cars!",
      avatar: "assets/images/testimonials/brian-kigozi.jpg",
      name: 'Brian Kigozi <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Mercedes-Benz C200 · Kololo",
      source: '<i class="fa-brands fa-google" aria-hidden="true"></i> Google Verified · 1 month ago'
    }
  ];

  // 5 Slot coordinates along the semi-circle arc (Slots 0 to 4)
  const SLOTS = [
    { x: 96, y: 12,  scale: 0.86, opacity: 0.72, zIndex: 2 }, // Slot 0: Top
    { x: 44, y: 100, scale: 0.94, opacity: 0.88, zIndex: 3 }, // Slot 1: Upper-Mid
    { x: 0,  y: 188, scale: 1.22, opacity: 1,    zIndex: 5 }, // Slot 2: Middle (Apex / Active)
    { x: 44, y: 276, scale: 0.94, opacity: 0.88, zIndex: 3 }, // Slot 3: Lower-Mid
    { x: 96, y: 364, scale: 0.86, opacity: 0.72, zIndex: 2 }  // Slot 4: Bottom
  ];

  // Map review index (0..4) to its DOM button element
  const reviewNodes = [];
  for (let r = 0; r < 5; r++) {
    reviewNodes[r] = track.querySelector(`.thumb-circle[data-review="${r}"]`);
  }

  // Which review index is currently assigned to each slot [Slot0, Slot1, Slot2(Middle), Slot3, Slot4]
  // Initially:
  // Slot 0 (Top): Review 2 (Ronald Kato)
  // Slot 1 (Upper-Mid): Review 1 (Sarah Nalubega)
  // Slot 2 (Middle - Active): Review 0 (David Mukasa)
  // Slot 3 (Lower-Mid): Review 4 (Brian Kigozi)
  // Slot 4 (Bottom): Review 3 (Grace Tumusiime)
  let slotReviews = [2, 1, 0, 4, 3];
  let isAnimating = false;
  let autoTimer = null;
  let isHovered = false;

  function applySlotToNode(node, slotIdx, isInstant = false) {
    if (!node) return;
    const s = SLOTS[slotIdx];

    if (isInstant) {
      node.style.transition = 'none';
    } else {
      node.style.transition = '';
    }

    node.style.setProperty('--x', `${s.x}px`);
    node.style.setProperty('--y', `${s.y}px`);
    node.style.setProperty('--scale', s.scale);
    node.style.setProperty('--opacity', s.opacity);
    node.style.setProperty('--z-index', s.zIndex);

    const isActive = (slotIdx === 2); // Middle position
    node.classList.toggle('is-active', isActive);
    node.setAttribute('aria-selected', isActive ? 'true' : 'false');

    if (isInstant) {
      void node.offsetWidth;
      node.style.transition = '';
    }
  }

  // Initialize all 5 nodes in their initial slot positions
  slotReviews.forEach((reviewIdx, slotIdx) => {
    applySlotToNode(reviewNodes[reviewIdx], slotIdx, true);
  });

  function updateMainCard(reviewIndex, isInstant = false) {
    const data = TESTIMONIALS_DATA[reviewIndex];
    if (!data) return;

    const applyData = () => {
      if (mainTag) mainTag.textContent = data.tag;
      if (mainHeading) mainHeading.textContent = data.heading;
      if (mainText) mainText.textContent = data.text;
      if (mainAvatar) {
        mainAvatar.src = data.avatar;
        mainAvatar.alt = data.name.replace(/<[^>]*>/g, '').trim();
      }
      if (mainName) mainName.innerHTML = data.name;
      if (mainVehicle) mainVehicle.textContent = data.vehicle;
      if (mainSource) mainSource.innerHTML = data.source;
    };

    if (isInstant) {
      applyData();
      return;
    }

    mainCard.classList.add('fade-out');
    setTimeout(() => {
      applyData();
      mainCard.classList.remove('fade-out');
    }, 180);
  }

  // Initial main card content matches middle thumbnail (Review 0: David Mukasa) instantly without flash
  updateMainCard(slotReviews[2], true);

  // Advance downward: thumbnail above middle (Slot 1) moves into middle (Slot 2)!
  function stepDownward() {
    if (isAnimating) return;
    isAnimating = true;

    // Shift: review from Slot 1 moves into Slot 2
    // New slot order: [old 4, old 0, old 1, old 2, old 3]
    slotReviews = [
      slotReviews[4],
      slotReviews[0],
      slotReviews[1],
      slotReviews[2],
      slotReviews[3]
    ];

    // Apply new slots to all 5 review nodes with smooth CSS transition
    slotReviews.forEach((reviewIdx, slotIdx) => {
      applySlotToNode(reviewNodes[reviewIdx], slotIdx);
    });

    // Whichever review just took up the middle position (Slot 2) becomes the main card!
    updateMainCard(slotReviews[2]);

    setTimeout(() => {
      isAnimating = false;
    }, 720);
  }

  function goToReview(reviewIdx) {
    if (isAnimating) return;
    const currentSlot = slotReviews.indexOf(reviewIdx);
    if (currentSlot === 2) return; // Already in middle

    isAnimating = true;

    const steps = (2 - currentSlot + 5) % 5;
    for (let s = 0; s < steps; s++) {
      slotReviews = [
        slotReviews[4],
        slotReviews[0],
        slotReviews[1],
        slotReviews[2],
        slotReviews[3]
      ];
    }

    slotReviews.forEach((rIdx, slotIdx) => {
      applySlotToNode(reviewNodes[rIdx], slotIdx);
    });

    updateMainCard(slotReviews[2]);
    resetAutoTimer();

    setTimeout(() => {
      isAnimating = false;
    }, 720);
  }

  // Interactive Click handling on any circle
  reviewNodes.forEach((node, reviewIdx) => {
    if (!node) return;
    node.addEventListener('click', () => {
      goToReview(reviewIdx);
    });

    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToReview(reviewIdx);
      }
    });
  });

  // Auto Timer every 4s
  function startAutoTimer() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      if (!isAnimating) {
        stepDownward();
      }
    }, 4000);
  }

  function resetAutoTimer() {
    clearInterval(autoTimer);
    startAutoTimer();
  }

  startAutoTimer();
}

function syncSectionHeights() {
  const quote = document.getElementById('quote');
  const appointment = document.getElementById('appointment');
  const carService = document.getElementById('car-servicing');
  if (!appointment) return;
  if (window.innerWidth > 1024) {
    const appHeight = appointment.offsetHeight;
    if (appHeight > 0) {
      if (quote) quote.style.minHeight = appHeight + 'px';
      if (carService) carService.style.minHeight = appHeight + 'px';
    }
  } else {
    if (quote) quote.style.minHeight = '';
    if (carService) carService.style.minHeight = '';
  }
}

window.addEventListener('resize', syncSectionHeights);
window.addEventListener('load', syncSectionHeights);
document.addEventListener('DOMContentLoaded', syncSectionHeights);

function initTestimonialsParallax() {
  const section = document.getElementById('testimonials');
  const bg = document.getElementById('testimonialsParallaxBg');
  if (!section || !bg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let isTicking = false;
  let isVisible = false;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible) onScroll();
    });
  }, { threshold: [0, 0.1, 0.5, 1] });

  observer.observe(section);

  function onScroll() {
    if (!isVisible || isTicking) return;
    isTicking = true;
    requestAnimationFrame(() => {
      if (window.innerWidth <= 768) {
        bg.style.transform = 'translate3d(0, 0, 0)';
        isTicking = false;
        return;
      }
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh - rect.top) / (vh + rect.height);
      const offset = (progress - 0.5) * 110;
      bg.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      isTicking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}



