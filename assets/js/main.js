let PRODUCTS = [];
let DB_PRODUCTS_CONNECTED = false;
function getStore(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch (e) { return [] } }
function setStore(k, v) { localStorage.setItem(k, JSON.stringify(v)) }
try { localStorage.removeItem('sesco-db-items'); } catch (e) {}

function registerDbProducts(dbItems, isConnected = true) {
  if (!isConnected) {
    DB_PRODUCTS_CONNECTED = false;
    PRODUCTS.length = 0;
    try { localStorage.removeItem('sesco-db-items'); } catch (e) {}
    return;
  }
  DB_PRODUCTS_CONNECTED = true;
  if (!Array.isArray(dbItems)) return;
  dbItems.forEach(item => {
    if (!item || !item.id) return;
    const idx = PRODUCTS.findIndex(x => x.id === item.id);
    if (idx >= 0) PRODUCTS[idx] = { ...PRODUCTS[idx], ...item };
    else PRODUCTS.push(item);
  });
}
window.registerDbProducts = registerDbProducts;

async function fetchShopDbItems(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      qs.set(key, String(val));
    }
  });
  qs.set('_t', String(Date.now()));
  const queryStr = qs.toString();
  const candidateUrls = [
    `backend/get_items.php?${queryStr}`,
    `http://localhost/sesco_tyres_frontend_redesign/backend/get_items.php?${queryStr}`,
    `http://127.0.0.1/sesco_tyres_frontend_redesign/backend/get_items.php?${queryStr}`
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        const parsed = await response.json();
        if (parsed && typeof parsed === 'object' && ('connected' in parsed || Array.isArray(parsed.items))) {
          const isConnected = parsed.connected === true;
          return {
            ...parsed,
            connected: isConnected,
            items: isConnected && Array.isArray(parsed.items) ? parsed.items : []
          };
        }
      }
    } catch (innerErr) {}
  }

  return {
    connected: false,
    source: 'database-disconnected',
    db_name: 'treads',
    table: 'item',
    count: 0,
    stats: { total_items: 0, total_brands: 0, total_categories: 0, total_units: 0 },
    items: []
  };
}
window.fetchShopDbItems = fetchShopDbItems;
function money(n) { return 'UGX ' + Number(n).toLocaleString('en-UG') }
function toast(msg) { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t) } t.textContent = msg; t.classList.add('show'); clearTimeout(window._toastTimer); window._toastTimer = setTimeout(() => t.classList.remove('show'), 2600) }
function updateCounts() { const cart = getStore('sesco-cart'), wish = getStore('sesco-wishlist'); const cartQty = cart.reduce((a, x) => a + x.qty, 0); document.querySelectorAll('[data-cart-count]').forEach(e => { if (cartQty > 0) { e.textContent = cartQty; e.style.display = '' } else { e.textContent = ''; e.style.display = 'none' } }); const wishQty = wish.length; document.querySelectorAll('[data-wish-count]').forEach(e => { if (wishQty > 0) { e.textContent = wishQty; e.style.display = '' } else { e.textContent = ''; e.style.display = 'none' } }); window.dispatchEvent(new CustomEvent('sesco:cart-updated', { detail: { cart, cartQty } })) }
let _swalAddToCartTimer = null;
let _swalRemoveTimer = null;
let _swalWishlistTimer = null;
let _swalLoginTimer = null;

function showSweetAlertAddToCart(productName) {
  const existing = document.getElementById('sweetAlertAddToCartModal');
  if (existing) existing.remove();
  const existingRem = document.getElementById('sweetAlertRemoveModal');
  if (existingRem) existingRem.remove();
  const existingWish = document.getElementById('sweetAlertWishlistModal');
  if (existingWish) existingWish.remove();
  const existingLogin = document.getElementById('sweetAlertLoginModal');
  if (existingLogin) existingLogin.remove();
  clearTimeout(_swalAddToCartTimer);
  clearTimeout(_swalRemoveTimer);
  clearTimeout(_swalWishlistTimer);
  clearTimeout(_swalLoginTimer);
  const overlay = document.createElement('div');
  overlay.id = 'sweetAlertAddToCartModal';
  overlay.className = 'swal-flat-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.innerHTML = `<div class="swal-flat-card"><div class="swal-flat-icon"><i class="fa-solid fa-check" aria-hidden="true"></i></div><h3 class="swal-flat-title">Added to Cart!</h3><p class="swal-flat-sub">${productName || 'Item added successfully'}</p></div>`;
  document.body.appendChild(overlay);
  _swalAddToCartTimer = setTimeout(() => {
    overlay.classList.add('is-closing');
    setTimeout(() => { overlay.remove(); }, 150);
  }, 700);
}
window.showSweetAlertAddToCart = showSweetAlertAddToCart;
window.showWishlistSweetAlert = showSweetAlertAddToCart;

function showSweetAlertRemoveFromCart(productName, customTitle) {
  const existing = document.getElementById('sweetAlertAddToCartModal');
  if (existing) existing.remove();
  const existingRem = document.getElementById('sweetAlertRemoveModal');
  if (existingRem) existingRem.remove();
  const existingWish = document.getElementById('sweetAlertWishlistModal');
  if (existingWish) existingWish.remove();
  const existingLogin = document.getElementById('sweetAlertLoginModal');
  if (existingLogin) existingLogin.remove();
  clearTimeout(_swalAddToCartTimer);
  clearTimeout(_swalRemoveTimer);
  clearTimeout(_swalWishlistTimer);
  clearTimeout(_swalLoginTimer);
  const titleText = customTitle || 'Removed from cart';
  const defaultSub = customTitle ? (customTitle === 'Removed from wishlist' ? 'Item removed from your wishlist' : 'Item removed') : 'Item removed from your cart';
  const overlay = document.createElement('div');
  overlay.id = 'sweetAlertRemoveModal';
  overlay.className = 'swal-flat-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.innerHTML = `<div class="swal-flat-card swal-flat-card-remove"><div class="swal-flat-icon swal-flat-icon-remove"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></div><h3 class="swal-flat-title">${titleText}</h3><p class="swal-flat-sub">${productName || defaultSub}</p></div>`;
  document.body.appendChild(overlay);
  _swalRemoveTimer = setTimeout(() => {
    overlay.classList.add('is-closing');
    setTimeout(() => { overlay.remove(); }, 150);
  }, 700);
}
window.showSweetAlertRemoveFromCart = showSweetAlertRemoveFromCart;
window.showSweetAlertRemoveFromWishlist = function(productName) {
  showSweetAlertRemoveFromCart(productName, 'Removed from wishlist');
};

function showSweetAlertSaveToWishlist(productName) {
  const existing = document.getElementById('sweetAlertAddToCartModal');
  if (existing) existing.remove();
  const existingRem = document.getElementById('sweetAlertRemoveModal');
  if (existingRem) existingRem.remove();
  const existingWish = document.getElementById('sweetAlertWishlistModal');
  if (existingWish) existingWish.remove();
  const existingLogin = document.getElementById('sweetAlertLoginModal');
  if (existingLogin) existingLogin.remove();
  clearTimeout(_swalAddToCartTimer);
  clearTimeout(_swalRemoveTimer);
  clearTimeout(_swalWishlistTimer);
  clearTimeout(_swalLoginTimer);
  const overlay = document.createElement('div');
  overlay.id = 'sweetAlertWishlistModal';
  overlay.className = 'swal-flat-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.innerHTML = `<div class="swal-flat-card swal-flat-card-wishlist"><div class="swal-flat-icon swal-flat-icon-wishlist"><i class="fa-solid fa-heart" aria-hidden="true"></i></div><h3 class="swal-flat-title">Saved to Wishlist!</h3><p class="swal-flat-sub">${productName || 'Item saved to your wishlist'}</p></div>`;
  document.body.appendChild(overlay);
  _swalWishlistTimer = setTimeout(() => {
    overlay.classList.add('is-closing');
    setTimeout(() => { overlay.remove(); }, 150);
  }, 700);
}
window.showSweetAlertSaveToWishlist = showSweetAlertSaveToWishlist;

function showSweetAlertLogin(username, onDismiss) {
  const existingAdd = document.getElementById('sweetAlertAddToCartModal');
  if (existingAdd) existingAdd.remove();
  const existingRem = document.getElementById('sweetAlertRemoveModal');
  if (existingRem) existingRem.remove();
  const existingWish = document.getElementById('sweetAlertWishlistModal');
  if (existingWish) existingWish.remove();
  const existingLogin = document.getElementById('sweetAlertLoginModal');
  if (existingLogin) existingLogin.remove();
  clearTimeout(_swalAddToCartTimer);
  clearTimeout(_swalRemoveTimer);
  clearTimeout(_swalWishlistTimer);
  clearTimeout(_swalLoginTimer);

  const rawName = (username || '').trim();
  const displayName = rawName ? rawName : 'User';
  const overlay = document.createElement('div');
  overlay.id = 'sweetAlertLoginModal';
  overlay.className = 'swal-flat-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.innerHTML = `<div class="swal-flat-card swal-flat-card-login"><div class="swal-flat-icon swal-flat-icon-login"><i class="fa-solid fa-circle-user" aria-hidden="true"></i></div><h3 class="swal-flat-title">Welcome ${displayName}</h3><p class="swal-flat-sub">Signed in successfully</p></div>`;
  document.body.appendChild(overlay);

  _swalLoginTimer = setTimeout(() => {
    overlay.classList.add('is-closing');
    setTimeout(() => {
      overlay.remove();
      if (typeof onDismiss === 'function') onDismiss();
    }, 150);
  }, 1000);
}
window.showSweetAlertLogin = showSweetAlertLogin;

function addCart(id) {
  if (!DB_PRODUCTS_CONNECTED) {
    toast('Database not connected. Connect to the database to add tyres.');
    return;
  }
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  let c = getStore('sesco-cart');
  const f = c.find(x => x.id === id);
  if (f) {
    f.qty++;
    f.name = p.name;
    f.price = p.price;
    f.size = p.size;
    f.image = p.image;
    f.brand = p.brand;
    f.item_id = p.item_id || 0;
    f.item_brand_id = p.item_brand_id || null;
    f.item_category_id = p.item_category_id || 1;
    f.item_type_id = p.item_type_id || 1;
    f.item_unit_id = p.item_unit_id || 1;
    f.item_image_id = p.item_image_id || null;
  } else {
    c.push({
      id,
      qty: 1,
      item_id: p.item_id || 0,
      item_brand_id: p.item_brand_id || null,
      item_category_id: p.item_category_id || 1,
      item_type_id: p.item_type_id || 1,
      item_unit_id: p.item_unit_id || 1,
      item_image_id: p.item_image_id || null,
      name: p.name,
      brand: p.brand,
      size: p.size,
      price: p.price,
      image: p.image
    });
  }
  setStore('sesco-cart', c);
  updateCounts();
  if (document.body.dataset.page === 'wishlist' || document.body.dataset.page === 'shop') {
    showSweetAlertAddToCart(p.name);
  } else {
    toast(`${p.name} added to your cart`);
  }
}
function removeCartItem(id) {
  let cart = getStore('sesco-cart');
  const removedItem = cart.find(x => x.id === id);
  const p = PRODUCTS.find(x => x.id === id);
  const itemObj = p || removedItem;
  const itemName = itemObj?.name || 'Item';

  let c = cart.filter(x => x.id !== id);
  setStore('sesco-cart', c);
  renderCart();
  updateCounts();

  if (document.body.dataset.page === 'shop' || document.body.dataset.page === 'cart' || document.body.dataset.page === 'wishlist') {
    showSweetAlertRemoveFromCart(itemName);
  } else {
    toast('Item removed from cart');
  }
}
function setCartItemQty(id, newQty) {
  let c = getStore('sesco-cart');
  if (newQty <= 0) {
    removeCartItem(id);
    return;
  }
  const f = c.find(x => x.id === id);
  if (f) {
    const isIncrease = newQty > f.qty;
    f.qty = Math.min(50, Number(newQty) || 1);
    setStore('sesco-cart', c);
    renderCart();
    updateCounts();
    if (isIncrease && (document.body.dataset.page === 'shop' || document.body.dataset.page === 'wishlist')) {
      const p = PRODUCTS.find(x => x.id === id) || f;
      showSweetAlertAddToCart(p.name);
    }
  }
}
window.addCart = addCart;
window.removeCartItem = removeCartItem;
window.setCartItemQty = setCartItemQty;
function toggleWish(id) {
  let w = getStore('sesco-wishlist');
  const p = PRODUCTS.find(x => x.id === id);
  const isSaved = w.includes(id);
  if (!isSaved && (!DB_PRODUCTS_CONNECTED || !p)) {
    toast('Database not connected. Connect to the database to save tyres.');
    return;
  }
  const itemName = p?.name || 'Item';

  if (isSaved) {
    w = w.filter(x => x !== id);
    if (document.body.dataset.page === 'wishlist' || document.body.dataset.page === 'shop') {
      showSweetAlertRemoveFromCart(itemName, 'Removed from wishlist');
    } else {
      toast('Removed from wishlist');
    }
  } else {
    w.push(id);
    showSweetAlertSaveToWishlist(itemName);
  }
  setStore('sesco-wishlist', w);
  updateCounts();
  document.querySelectorAll('[data-wish="' + id + '"]').forEach(b => {
    b.classList.toggle('is-saved', w.includes(id));
    const icon = b.querySelector('i');
    if (icon) {
      icon.className = w.includes(id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    }
    const labelSpan = b.querySelector('span');
    if (labelSpan && b.classList.contains('btn')) {
      labelSpan.textContent = w.includes(id) ? 'Saved to wishlist' : 'Save for later';
    }
  });
  if (document.body.dataset.page === 'wishlist') renderWishlist(DB_PRODUCTS_CONNECTED);
}
function productCard(p) { const saved = getStore('sesco-wishlist').includes(p.id); return `<article class="product-card" data-category="${p.category}"><div class="product-image"><span class="product-tag">${p.tag}</span><button class="wishlist-btn ${saved ? 'is-saved' : ''}" data-wish="${p.id}" aria-label="Save ${p.name}"><i class="fa-${saved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i></button><img src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80'"></div><div class="product-info"><span class="brand">${p.brand}</span><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="spec">${p.size}</div><div class="rating">${p.rating} <span>(Customer favourite)</span></div><div class="product-bottom"><div class="price">${money(p.price)}<small> / tyre</small></div><button class="btn btn-dark" data-add="${p.id}">Add to cart</button></div></div></article>` }
function renderProducts(target, items = PRODUCTS) { const el = document.querySelector(target); if (el) el.innerHTML = DB_PRODUCTS_CONNECTED && Array.isArray(items) ? items.map(productCard).join('') : '' }
function renderCart(isConnected = DB_PRODUCTS_CONNECTED) {
  const el = document.querySelector('#cart-content');
  if (!el) return;
  const prevName = document.getElementById('orderCustomerName')?.value || localStorage.getItem('sesco-client-name') || '';
  const prevContact = document.getElementById('orderCustomerContact')?.value || localStorage.getItem('sesco-client-phone') || '';
  const prevEmail = document.getElementById('orderCustomerEmail')?.value || localStorage.getItem('sesco-client-email') || '';
  const prevLocation = document.getElementById('orderCustomerLocation')?.value || '';
  const c = getStore('sesco-cart');

  if (!isConnected) {
    el.innerHTML = `<div class="empty-state"><div class="big-icon" style="color:#dc2626"><i class="fa-solid fa-database" aria-hidden="true"></i></div><h2>Database Not Connected</h2><p>No tyres are displayed because cart items are fetched directly from the live <code>treads</code> database.${c.length ? ' Your saved cart selection is preserved until the connection is restored.' : ''}</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn btn-primary hero-btn-main" id="retryCartDbBtn"><span>Retry Database Connection</span></button><a class="btn btn-outline" href="shop.html">Open Shop</a></div></div>`;
    const retryBtn = document.getElementById('retryCartDbBtn');
    if (retryBtn) retryBtn.addEventListener('click', loadCartPage);
    return;
  }

  const dbCartItems = c.filter(item => PRODUCTS.some(x => x.id === item.id));
  if (!dbCartItems.length) {
    el.innerHTML = `<div class="empty-state"><div class="big-icon"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i></div><h2>Your cart is empty</h2><p>Select the tyres and items you want on the Shop page and they will automatically appear here.</p><a class="btn btn-primary hero-btn-main cart-browse-btn" href="shop.html"><span>Browse &amp; select tyres</span> <span>→</span></a></div>`;
    return;
  }

  let subtotal = 0;
  const rows = dbCartItems.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p || !p.name) return '';
    const unitPrice = Number(p.price || 0);
    subtotal += unitPrice * item.qty;
    return `<tr><td><div class="cart-product"><img src="${p.image || 'assets/images/tyres/p1_michelin.png'}" alt="${p.name}"><div><strong>${p.name}</strong><br><small>${p.size || ''}${p.item_id ? ` · DB ID #${p.item_id}` : ''}</small></div></div></td><td>${money(unitPrice)}</td><td><div class="cart-qty-control"><button type="button" class="cart-qty-btn" data-cart-qty-btn="${item.id}" data-delta="-1" aria-label="Decrease quantity of ${p.name}" title="Decrease quantity">−</button><input type="number" class="cart-qty-input" min="1" max="50" value="${item.qty}" data-qty="${item.id}" aria-label="Quantity of ${p.name}"><button type="button" class="cart-qty-btn" data-cart-qty-btn="${item.id}" data-delta="1" aria-label="Increase quantity of ${p.name}" title="Increase quantity">+</button></div></td><td><strong>${money(unitPrice * item.qty)}</strong></td><td><button type="button" class="text-link" data-remove="${item.id}">Remove</button></td></tr>`;
  }).join('');

  el.innerHTML = `<div class="cart-layout"><div style="overflow:auto"><table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><aside class="cart-summary"><h3>Order summary</h3><div class="summary-row"><span>Selected items</span><strong>${dbCartItems.reduce((a, x) => a + x.qty, 0)} unit(s)</strong></div><div class="summary-row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="summary-row"><span>Fitment / Delivery</span><span>Confirmed by team</span></div><div class="summary-row total"><span>Total</span><span>${money(subtotal)}</span></div><form id="cartOrderRequestForm" novalidate><div class="cart-order-fields"><div class="cart-form-group"><label for="orderCustomerName">Name *</label><input type="text" id="orderCustomerName" name="name" placeholder="e.g. David Mukasa" required></div><div class="cart-form-group"><label for="orderCustomerContact">Contact *</label><input type="tel" id="orderCustomerContact" name="contact" placeholder="e.g. +256 700 000000" required></div><div class="cart-form-group"><label for="orderCustomerEmail">Email <span style="font-weight:500;color:#64748b">(optional)</span></label><input type="email" id="orderCustomerEmail" name="email" placeholder="e.g. david@example.com"></div><div class="cart-form-group"><label for="orderCustomerLocation">Location *</label><input type="text" id="orderCustomerLocation" name="location" placeholder="e.g. Kampala, Queens Way / Entebbe" required></div></div><button class="btn btn-primary hero-btn-main cart-order-submit-btn" type="submit" style="width:100%" id="sendOrderRequestBtn" data-send-order-request><span>Send order request</span> <span>→</span></button></form><div id="cartOrderFeedback" class="cart-order-feedback" style="display:none"></div><a class="btn btn-outline cart-continue-shopping-btn" style="width:100%;margin-top:10px" href="shop.html">Continue shopping</a></aside></div>`;
  if (prevName) { const n = document.getElementById('orderCustomerName'); if (n) n.value = prevName; }
  if (prevContact) { const ct = document.getElementById('orderCustomerContact'); if (ct) ct.value = prevContact; }
  if (prevEmail) { const em = document.getElementById('orderCustomerEmail'); if (em) em.value = prevEmail; }
  if (prevLocation) { const loc = document.getElementById('orderCustomerLocation'); if (loc) loc.value = prevLocation; }
  initCartOrderValidation();
}
async function loadCartPage() {
  const el = document.querySelector('#cart-content');
  if (!el) return;
  const c = getStore('sesco-cart');
  el.innerHTML = `<div class="empty-state"><div class="big-icon"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></div><h2>Connecting to database…</h2><p>Verifying cart tyres against the live <code>treads.item</code> database.</p></div>`;
  const payload = c.length
    ? await fetchShopDbItems({ ids: c.map(x => x.id).join(',') })
    : await fetchShopDbItems({ limit: 1, mode: 'first10' });
  if (!payload.connected) {
    registerDbProducts([], false);
    renderCart(false);
    return;
  }
  registerDbProducts(payload.items, true);
  if (c.length) {
    const synced = [];
    c.forEach(item => {
      const dbP = PRODUCTS.find(x => x.id === item.id || (x.item_id && item.item_id && Number(x.item_id) === Number(item.item_id)));
      if (dbP) {
        synced.push({
          ...item,
          id: dbP.id,
          item_id: dbP.item_id || 0,
          item_brand_id: dbP.item_brand_id || null,
          item_category_id: dbP.item_category_id || 1,
          item_type_id: dbP.item_type_id || 1,
          item_unit_id: dbP.item_unit_id || 1,
          item_image_id: dbP.item_image_id || null,
          name: dbP.name,
          brand: dbP.brand,
          size: dbP.size,
          price: dbP.price,
          image: dbP.image
        });
      }
    });
    setStore('sesco-cart', synced);
    if (synced.length !== c.length) updateCounts();
  }
  renderCart(true);
}
function wishlistProductCard(p) { const saved = getStore('sesco-wishlist').includes(p.id); const formattedPrice = 'UGX\u00A0' + Number(p.price || 0).toLocaleString('en-UG'); return `<article class="product-card wishlist-card" data-category="${p.category}"><div class="product-image"><button class="wishlist-btn ${saved ? 'is-saved' : ''}" data-wish="${p.id}" aria-label="Remove ${p.name} from wishlist" title="Remove from wishlist"><i class="fa-${saved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i></button><img src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80'"></div><div class="product-info"><span class="brand">${p.brand}</span><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="spec">${p.size}</div><div class="product-bottom"><div class="price"><span class="price-val">${formattedPrice}</span><small class="price-unit">&nbsp;/tyre</small></div><button class="btn btn-primary hero-btn-main wishlist-card-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart"><span>Add to cart</span> <span>→</span></button></div></div></article>` }
function renderWishlist(isConnected = DB_PRODUCTS_CONNECTED) {
  const el = document.querySelector('#wishlist-content');
  if (!el) return;
  const w = getStore('sesco-wishlist');
  if (!isConnected) {
    el.innerHTML = `<div class="empty-state"><div class="big-icon" style="color:#dc2626"><i class="fa-solid fa-database" aria-hidden="true"></i></div><h2>Database Not Connected</h2><p>No tyres are displayed because saved products are fetched directly from the live <code>treads</code> database.${w.length ? ' Your saved wishlist selection is preserved until the connection is restored.' : ''}</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn btn-primary hero-btn-main" id="retryWishlistDbBtn"><span>Retry Database Connection</span></button><a class="btn btn-outline" href="shop.html">Open Shop</a></div></div>`;
    const retryBtn = document.getElementById('retryWishlistDbBtn');
    if (retryBtn) retryBtn.addEventListener('click', loadWishlistPage);
    return;
  }
  const items = PRODUCTS.filter(p => w.includes(p.id));
  el.innerHTML = items.length
    ? `<div class="products-grid">${items.map(wishlistProductCard).join('')}</div>`
    : `<div class="empty-state"><div class="big-icon"><i class="fa-solid fa-heart" aria-hidden="true"></i></div><h2>Your wishlist is waiting</h2><p>Save tyres you want to compare later.</p><a class="btn btn-primary hero-btn-main wishlist-explore-btn" href="shop.html"><span>Explore tyres</span> <span>→</span></a></div>`;
}
async function loadWishlistPage() {
  const el = document.querySelector('#wishlist-content');
  if (!el) return;
  const w = getStore('sesco-wishlist');
  el.innerHTML = `<div class="empty-state"><div class="big-icon"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></div><h2>Connecting to database…</h2><p>Loading your saved tyres from <code>treads.item</code>.</p></div>`;
  const payload = w.length
    ? await fetchShopDbItems({ ids: w.join(',') })
    : await fetchShopDbItems({ limit: 1, mode: 'first10' });
  if (!payload.connected) {
    registerDbProducts([], false);
    renderWishlist(false);
    return;
  }
  registerDbProducts(payload.items, true);
  renderWishlist(true);
}
function renderProductDetail(product = null, status = 'disconnected') {
  const el = document.querySelector('#product-detail');
  if (!el) return;
  if (status === 'disconnected') {
    el.innerHTML = `<div class="empty-state" style="margin:24px 0"><div class="big-icon" style="color:#dc2626"><i class="fa-solid fa-database" aria-hidden="true"></i></div><h2>Database Not Connected</h2><p>No tyres are displayed because product details are fetched directly from the live <code>treads</code> database.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn btn-primary hero-btn-main" id="retryProductDbBtn"><span>Retry Database Connection</span></button><a class="btn btn-outline" href="shop.html">Back to Shop</a></div></div>`;
    const retryBtn = document.getElementById('retryProductDbBtn');
    if (retryBtn) retryBtn.addEventListener('click', loadProductPage);
    return;
  }
  if (!product) {
    el.innerHTML = `<div class="empty-state" style="margin:24px 0"><div class="big-icon"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></div><h2>Tyre Not Found in Database</h2><p>The requested tyre record was not found in <code>treads.item</code>.</p><a class="btn btn-primary hero-btn-main" href="shop.html"><span>Browse Shop Tyres</span> <span>→</span></a></div>`;
    return;
  }
  const p = product;
  const saved = getStore('sesco-wishlist').includes(p.id);
  el.innerHTML = `<div class="detail-grid"><div class="detail-image"><img src="${p.image}" alt="${p.name}"></div><div class="detail-info"><div class="eyebrow">${p.brand}</div><h1>${p.name}</h1><div class="rating">${p.rating} <span>Customer rating</span></div><div class="spec">Tyre size: <strong>${p.size}</strong></div><div class="price">${money(p.price)} <small style="font-size:12px;color:#718096">per tyre</small></div><p>${p.description ? `${p.description} — ` : ''}Designed for dependable everyday driving, confident handling and a comfortable ride. Confirm the exact size and vehicle fitment with our team before purchase.</p><div class="notice">Availability and final pricing are confirmed directly from <code>treads.item</code> (DB ID #${p.item_id}).</div><div class="detail-actions"><button class="btn btn-primary" data-add="${p.id}">Add to cart</button><button class="btn btn-outline ${saved ? 'is-saved' : ''}" data-wish="${p.id}"><i class="fa-${saved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i> <span>${saved ? 'Saved to wishlist' : 'Save for later'}</span></button><a class="btn btn-dark" href="contact.html?product=${encodeURIComponent(p.name)}">Ask about this tyre</a></div><table class="spec-table"><tr><td>Brand</td><td>${p.brand}</td></tr><tr><td>Tyre size</td><td>${p.size}</td></tr><tr><td>Category</td><td>${p.category_label || p.category}</td></tr><tr><td>Database ID</td><td>#${p.item_id}</td></tr><tr><td>Fitment advice</td><td>Available from our team</td></tr></table></div></div>`;
}
async function loadProductPage() {
  const detailEl = document.querySelector('#product-detail');
  const featuredEl = document.querySelector('#featured-products');
  if (!detailEl && !featuredEl) return;

  const featuredSection = featuredEl ? featuredEl.closest('section') : null;
  if (featuredEl) featuredEl.innerHTML = '';
  if (detailEl) {
    detailEl.innerHTML = `<div class="empty-state" style="margin:24px 0"><div class="big-icon"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></div><h2>Connecting to database…</h2><p>Loading product details from <code>treads.item</code>.</p></div>`;
  }

  const requestedId = detailEl ? new URLSearchParams(location.search).get('id') : null;
  const [detailPayload, featuredPayload] = await Promise.all([
    requestedId ? fetchShopDbItems({ id: requestedId }) : Promise.resolve(null),
    fetchShopDbItems({ limit: 6, mode: 'featured' })
  ]);

  const isConnected = Boolean((detailPayload && detailPayload.connected) || (featuredPayload && featuredPayload.connected));
  if (!isConnected) {
    registerDbProducts([], false);
    if (detailEl) renderProductDetail(null, 'disconnected');
    if (featuredEl) featuredEl.innerHTML = '';
    if (featuredSection) featuredSection.style.display = 'none';
    return;
  }

  const allFetched = [];
  if (detailPayload && Array.isArray(detailPayload.items)) allFetched.push(...detailPayload.items);
  if (featuredPayload && Array.isArray(featuredPayload.items)) allFetched.push(...featuredPayload.items);
  registerDbProducts(allFetched, true);

  let mainProduct = null;
  if (detailEl) {
    if (requestedId) {
      mainProduct = detailPayload && detailPayload.items && detailPayload.items[0] ? detailPayload.items[0] : null;
    } else {
      mainProduct = featuredPayload && featuredPayload.items && featuredPayload.items[0] ? featuredPayload.items[0] : null;
    }
    renderProductDetail(mainProduct, mainProduct ? 'ok' : 'not-found');
  }

  if (featuredEl) {
    const otherFeatured = (featuredPayload?.items || [])
      .filter(item => !mainProduct || item.id !== mainProduct.id)
      .slice(0, 4);
    if (otherFeatured.length > 0) {
      if (featuredSection) featuredSection.style.display = '';
      renderProducts('#featured-products', otherFeatured);
    } else {
      featuredEl.innerHTML = '';
      if (featuredSection) featuredSection.style.display = 'none';
    }
  }
}
document.addEventListener('click', e => { const menu = e.target.closest('.menu-toggle'); if (menu) { document.querySelector('.nav')?.classList.toggle('open'); } else if (!e.target.closest('.nav')) { document.querySelector('.nav')?.classList.remove('open'); } const navLink = e.target.closest('.nav a'); if (navLink) { document.querySelector('.nav')?.classList.remove('open'); } const add = e.target.closest('[data-add]'); if (add) addCart(add.dataset.add); const wish = e.target.closest('[data-wish]'); if (wish) toggleWish(wish.dataset.wish); const qtyBtn = e.target.closest('[data-cart-qty-btn]'); if (qtyBtn) { const id = qtyBtn.dataset.cartQtyBtn; const delta = Number(qtyBtn.dataset.delta || 0); let c = getStore('sesco-cart'); const f = c.find(x => x.id === id); if (f) { const nextQty = (Number(f.qty) || 1) + delta; if (nextQty < 1) { toast('Minimum quantity is 1 — click Remove to delete item'); return; } f.qty = Math.min(50, nextQty); setStore('sesco-cart', c); renderCart(); updateCounts(); } } const rem = e.target.closest('[data-remove]'); if (rem) { removeCartItem(rem.dataset.remove); } const faq = e.target.closest('.faq-question'); if (faq) faq.parentElement.classList.toggle('open'); const checkout = e.target.closest('[data-demo-checkout]'); if (checkout) toast('Demo only — connect this button to your enquiry workflow later'); const filterBtn = e.target.closest('[data-mobile-filters]'); if (filterBtn) document.querySelector('.shop-layout')?.classList.toggle('filters-open'); const logoutBtn = e.target.closest('[data-header-logout]'); if (logoutBtn) { e.preventDefault(); localStorage.removeItem('sesco-client-id'); localStorage.removeItem('sesco-client-name'); localStorage.removeItem('sesco-client-email'); localStorage.removeItem('sesco-client-phone'); sessionStorage.removeItem('sesco-client-id'); sessionStorage.removeItem('sesco-client-name'); const candidateUrls = ['backend/logout.php', 'http://localhost/sesco_tyres_frontend_redesign/backend/logout.php', 'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/logout.php']; for (const endpointUrl of candidateUrls) { try { fetch(endpointUrl, { method: 'POST' }); break; } catch (err) {} } updateHeaderAuth(); toast('Logged out successfully.'); if (document.body.dataset.page === 'cart') { renderCart(); } } const passToggle = e.target.closest('[data-toggle-password]'); if (passToggle) { const targetId = passToggle.dataset.togglePassword; const input = document.getElementById(targetId); if (input) { const isPassword = input.type === 'password'; input.type = isPassword ? 'text' : 'password'; passToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password'); passToggle.setAttribute('title', isPassword ? 'Hide password' : 'Show password'); const icon = passToggle.querySelector('i'); if (icon) { icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'; } } } const vidBtn = e.target.closest('#heroVideoToggle'); if (vidBtn) { const v = document.getElementById('heroVideo'); if (v) { if (v.paused) { v.play(); vidBtn.querySelector('.video-control-icon').textContent = '⏸'; vidBtn.querySelector('.video-control-label').textContent = 'Pause'; vidBtn.setAttribute('aria-label', 'Pause background video') } else { v.pause(); vidBtn.querySelector('.video-control-icon').textContent = '▶'; vidBtn.querySelector('.video-control-label').textContent = 'Play'; vidBtn.setAttribute('aria-label', 'Play background video') } } } });
document.addEventListener('change', e => { if (e.target.matches('[data-qty]')) { let c = getStore('sesco-cart'); const f = c.find(x => x.id === e.target.dataset.qty); if (f) { const val = Number(e.target.value); if (val <= 0 || isNaN(val)) { removeCartItem(e.target.dataset.qty); } else { f.qty = Math.max(1, Math.min(50, val)); setStore('sesco-cart', c); renderCart(); updateCounts(); } } } if (e.target.matches('[data-filter]')) { const shopContainer = document.querySelector('#shop-products'); if (!shopContainer || shopContainer.hasAttribute('data-db-shop') || !DB_PRODUCTS_CONNECTED) return; const checked = [...document.querySelectorAll('[data-filter]:checked')].map(x => x.value); const items = PRODUCTS.filter(p => !checked.length || checked.includes(p.category)); renderProducts('#shop-products', items); const count = document.querySelector('#product-count'); if (count) count.textContent = items.length + ' products shown' } if (e.target.matches('#sort-products')) { const shopContainer = document.querySelector('#shop-products'); if (!shopContainer || shopContainer.hasAttribute('data-db-shop') || !DB_PRODUCTS_CONNECTED) return; const v = e.target.value; const arr = [...PRODUCTS]; if (v === 'price-low') arr.sort((a, b) => a.price - b.price); if (v === 'price-high') arr.sort((a, b) => b.price - a.price); if (v === 'name') arr.sort((a, b) => a.name.localeCompare(b.name)); renderProducts('#shop-products', arr) } });
function isValidSescoContactNumber(value) {
  const cleaned = String(value || '').trim().replace(/[\s\-\(\)]/g, '');
  return cleaned.length >= 7 && /^[+]?[0-9]{7,15}$/.test(cleaned);
}
window.isValidSescoContactNumber = isValidSescoContactNumber;

function registerSescoContactMethod($) {
  if ($ && $.validator && !$.validator.methods.sescoContact) {
    $.validator.addMethod('sescoContact', function(value, element) {
      if (this.optional(element)) return true;
      return isValidSescoContactNumber(value);
    }, 'Please enter a valid phone number (at least 7 digits).');
  }
}
window.registerSescoContactMethod = registerSescoContactMethod;

function initCartOrderValidation() {
  if (typeof window.jQuery === 'undefined' || typeof window.jQuery.fn.validate === 'undefined') {
    return;
  }
  const $ = window.jQuery;
  const $form = $('#cartOrderRequestForm');
  if (!$form.length) return;

  registerSescoContactMethod($);

  $form.validate({
    errorElement: 'span',
    errorClass: 'cart-field-error',
    validClass: 'is-valid',
    ignore: [],
    rules: {
      name: {
        required: true,
        minlength: 2,
        normalizer: function(val) { return $.trim(val); }
      },
      contact: {
        required: true,
        sescoContact: true,
        normalizer: function(val) { return $.trim(val); }
      },
      email: {
        required: false,
        email: true,
        normalizer: function(val) { return $.trim(val); }
      },
      location: {
        required: true,
        minlength: 3,
        normalizer: function(val) { return $.trim(val); }
      }
    },
    messages: {
      name: {
        required: 'Please enter your name.',
        minlength: 'Name must be at least 2 characters.'
      },
      contact: {
        required: 'Please enter your contact phone number.',
        sescoContact: 'Please enter a valid phone number (at least 7 digits).'
      },
      email: {
        email: 'Please enter a valid email address.'
      },
      location: {
        required: 'Please enter your delivery or fitment location.',
        minlength: 'Location must be at least 3 characters.'
      }
    },
    highlight: function(element, errorClass, validClass) {
      $(element).addClass('is-invalid error').removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).removeClass('is-invalid error').addClass(validClass);
    },
    errorPlacement: function(error, element) {
      error.addClass('cart-error-message');
      const $parent = $(element).closest('.cart-form-group, div');
      if ($parent.length) {
        $parent.append(error);
      } else {
        error.insertAfter(element);
      }
    },
    submitHandler: function(form, event) {
      if (event) event.preventDefault();
      handleCartOrderSubmit(form);
      return false;
    }
  });
}
window.initCartOrderValidation = initCartOrderValidation;

function initAuthFormsValidation() {
  if (typeof window.jQuery === 'undefined' || typeof window.jQuery.fn.validate === 'undefined') {
    return;
  }
  const $ = window.jQuery;

  registerSescoContactMethod($);

  const $loginForm = $('#clientLoginForm');
  if ($loginForm.length && !$loginForm.data('validator')) {
    $loginForm.validate({
      errorElement: 'span',
      errorClass: 'auth-field-error',
      validClass: 'valid',
      ignore: [],
      rules: {
        email: {
          required: true,
          email: true,
          normalizer: function(val) { return $.trim(val); }
        },
        password: {
          required: true,
          minlength: 6,
          normalizer: function(val) { return $.trim(val); }
        }
      },
      messages: {
        email: {
          required: 'Please enter your email address.',
          email: 'Please enter a valid email address.'
        },
        password: {
          required: 'Please enter your password.',
          minlength: 'Password must be at least 6 characters.'
        }
      },
      highlight: function(element, errorClass, validClass) {
        $(element).addClass('is-invalid error').removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        $(element).removeClass('is-invalid error').addClass(validClass);
      },
      errorPlacement: function(error, element) {
        error.addClass('auth-field-error');
        const $pwdWrapper = $(element).closest('.password-field-wrapper');
        if ($pwdWrapper.length) {
          error.insertAfter($pwdWrapper);
        } else {
          const $field = $(element).closest('.field');
          if ($field.length) {
            $field.append(error);
          } else {
            error.insertAfter(element);
          }
        }
      },
      submitHandler: function(form, event) {
        if (event) event.preventDefault();
        handleClientLoginSubmit(form);
        return false;
      }
    });
  }

  const $registerForm = $('#clientRegisterForm');
  if ($registerForm.length && !$registerForm.data('validator')) {
    $registerForm.validate({
      errorElement: 'span',
      errorClass: 'auth-field-error',
      validClass: 'valid',
      ignore: [],
      rules: {
        name: {
          required: true,
          minlength: 2,
          normalizer: function(val) { return $.trim(val); }
        },
        email: {
          required: true,
          email: true,
          normalizer: function(val) { return $.trim(val); }
        },
        phone: {
          required: true,
          sescoContact: true,
          normalizer: function(val) { return $.trim(val); }
        },
        address: {
          required: false,
          minlength: 2,
          normalizer: function(val) { return $.trim(val); }
        },
        password: {
          required: true,
          minlength: 6,
          normalizer: function(val) { return $.trim(val); }
        },
        confirm_password: {
          required: true,
          equalTo: '#reg-password',
          normalizer: function(val) { return $.trim(val); }
        }
      },
      messages: {
        name: {
          required: 'Please enter your full name.',
          minlength: 'Name must be at least 2 characters.'
        },
        email: {
          required: 'Please enter your email address.',
          email: 'Please enter a valid email address.'
        },
        phone: {
          required: 'Please enter your contact phone number.',
          sescoContact: 'Please enter a valid phone number (at least 7 digits).'
        },
        password: {
          required: 'Please create a password.',
          minlength: 'Password must be at least 6 characters.'
        },
        confirm_password: {
          required: 'Please confirm your password.',
          equalTo: 'Passwords do not match. Please re-enter your password.'
        }
      },
      highlight: function(element, errorClass, validClass) {
        $(element).addClass('is-invalid error').removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        $(element).removeClass('is-invalid error').addClass(validClass);
      },
      errorPlacement: function(error, element) {
        error.addClass('auth-field-error');
        const $pwdWrapper = $(element).closest('.password-field-wrapper');
        if ($pwdWrapper.length) {
          error.insertAfter($pwdWrapper);
        } else {
          const $field = $(element).closest('.field');
          if ($field.length) {
            $field.append(error);
          } else {
            error.insertAfter(element);
          }
        }
      },
      submitHandler: function(form, event) {
        if (event) event.preventDefault();
        handleClientRegisterSubmit(form);
        return false;
      }
    });
  }
}
window.initAuthFormsValidation = initAuthFormsValidation;


async function handleCartOrderSubmit(form) {
  const customerName = (document.getElementById('orderCustomerName')?.value || form?.elements?.namedItem('name')?.value || '').trim();
  const customerContact = (document.getElementById('orderCustomerContact')?.value || form?.elements?.namedItem('contact')?.value || '').trim();
  const customerEmail = (document.getElementById('orderCustomerEmail')?.value || form?.elements?.namedItem('email')?.value || '').trim();
  const customerLocation = (document.getElementById('orderCustomerLocation')?.value || form?.elements?.namedItem('location')?.value || '').trim();
  const storedClientId = localStorage.getItem('sesco-client-id');
  const clientId = storedClientId && Number(storedClientId) > 0 ? Number(storedClientId) : null;
  const cartItems = getStore('sesco-cart');
  const feedback = document.getElementById('cartOrderFeedback');
  const submitBtn = document.getElementById('sendOrderRequestBtn');
  if (!customerName || !customerContact || !customerLocation) {
    toast('Please enter your Name, Contact, and Location to send your order request.');
    return;
  }
  if (!cartItems.length) {
    toast('Your cart is empty.');
    return;
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Saving order to database...</span>';
  }
  let orderRef = 'ORD-SESCO-' + Date.now().toString().slice(-6);
  let totalAmount = cartItems.reduce((sum, x) => sum + (Number(x.price || 0) * Number(x.qty || 1)), 0);
  let savedToDb = false;
  let insertedOrderId = null;
  let savedItemsArray = [];
  let dbErrorMsg = '';
  const payloadBody = JSON.stringify({
    client_id: clientId,
    name: customerName,
    contact: customerContact,
    email: customerEmail || null,
    location: customerLocation,
    items: cartItems
  });
  const candidateUrls = [
    'backend/send_order_request.php',
    'http://localhost/sesco_tyres_frontend_redesign/backend/send_order_request.php',
    'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/send_order_request.php'
  ];
  for (const endpointUrl of candidateUrls) {
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: payloadBody
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && 'success' in data) {
          if (data.order_reference) orderRef = data.order_reference;
          if (data.total_amount) totalAmount = data.total_amount;
          if (data.order_id) insertedOrderId = data.order_id;
          else if (Array.isArray(data.order_ids) && data.order_ids.length) insertedOrderId = data.order_ids[0];
          if (Array.isArray(data.items)) savedItemsArray = data.items;
          if (data.saved_to_orders_table) {
            savedToDb = true;
            break;
          } else if (data.db_error) {
            dbErrorMsg = data.db_error;
          }
        }
      }
    } catch (err) {
      dbErrorMsg = err.message || '';
    }
  }
  const itemSummaryLines = cartItems.map(x => `• ${x.qty}x ${x.name} (${x.size || 'Standard'}) @ ${money(x.price)}`).join('\n');
  const waText = encodeURIComponent(`Hello Sesco Tyres, I am sending Order Request ${orderRef}:\n- Name: ${customerName}\n- Contact: ${customerContact}${customerEmail ? '\n- Email: ' + customerEmail : ''}\n- Location: ${customerLocation}\n\nSelected Items:\n${itemSummaryLines}\n\nTotal: ${money(totalAmount)}`);
  const waUrl = `https://wa.me/256709828766?text=${waText}`;
  const itemsArrayHtml = savedItemsArray.length ? `<div style="margin-top:8px;padding:8px 10px;background:#fff;border:1px solid #a7f3d0;border-radius:6px;font-size:12px"><div style="font-weight:800;color:#065f46;margin-bottom:4px">Saved <code>items</code> Array in Order #${insertedOrderId || '—'} (${savedItemsArray.length} item${savedItemsArray.length > 1 ? 's' : ''}):</div>${savedItemsArray.map((it, idx) => `<div style="padding:3px 0;border-bottom:1px dashed #e2e8f0">[${idx}] Item #${it.item_id} (${it.description || it.name || 'Tyre'}) × <strong>${it.quantity}</strong> = <strong>${money(it.total_price)}</strong></div>`).join('')}</div>` : '';
  if (feedback) {
    feedback.style.display = 'block';
    feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Order Request Saved (${orderRef})!</strong><br>Thank you, <strong>${customerName}</strong>. Your order for <strong>${cartItems.reduce((a, x) => a + x.qty, 0)} unit(s)</strong> across <strong>${cartItems.length} item(s)</strong> (${money(totalAmount)}) has been ${savedToDb ? `saved as <strong>1 single record</strong> in <code>treads.orders</code> (Order ID: <strong>#${insertedOrderId}</strong>, <code>client_id</code>: <code>${clientId === null ? 'NULL' : clientId}</code>)` : `prepared${dbErrorMsg ? ` (DB notice: ${dbErrorMsg})` : ''}`}.<br><small>Contact: <strong>${customerContact}</strong>${customerEmail ? ` · Email: <strong>${customerEmail}</strong>` : ''} · Location: <strong>${customerLocation}</strong></small>${itemsArrayHtml}<div style="margin-top:10px"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background:#25D366;border-color:#25D366;color:#fff;font-size:12.5px;padding:9px 14px;display:inline-flex;align-items:center;gap:7px"><i class="fa-brands fa-whatsapp"></i><span>Send Order Request on WhatsApp for Instant Confirmation →</span></a></div>`;
  }
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = savedToDb ? '<span>Saved to orders table ✓</span>' : '<span>Order request sent ✓</span>';
  }
  toast(savedToDb ? `Order ${orderRef} saved as 1 record in orders table!` : `Order request ${orderRef} submitted!`);
}
window.handleCartOrderSubmit = handleCartOrderSubmit;

async function handleClientRegisterSubmit(form) {
  const name = (document.getElementById('reg-name')?.value || form?.elements?.namedItem('name')?.value || '').trim();
  const email = (document.getElementById('reg-email')?.value || form?.elements?.namedItem('email')?.value || '').trim();
  const phone = (document.getElementById('reg-phone')?.value || form?.elements?.namedItem('phone')?.value || '').trim();
  const address = (document.getElementById('reg-address')?.value || form?.elements?.namedItem('address')?.value || '').trim();
  const password = document.getElementById('reg-password')?.value || form?.elements?.namedItem('password')?.value || '';
  const confirmPassword = document.getElementById('reg-confirm')?.value || form?.elements?.namedItem('confirm_password')?.value || '';
  const submitBtn = document.getElementById('regSubmitBtn');
  const feedback = document.getElementById('regFeedback');

  if (!name || !email || !password) {
    toast('Please fill in your name, email, and password.');
    return;
  }
  if (password.length < 6) {
    toast('Password must be at least 6 characters.');
    return;
  }
  if (confirmPassword && password !== confirmPassword) {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.color = '#991b1b';
      feedback.style.border = '1px solid #fecaca';
      feedback.style.padding = '10px 14px';
      feedback.style.borderRadius = '6px';
      feedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Passwords do not match. Please re-enter your password.';
    }
    toast('Passwords do not match.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Saving account to database...</span>';
  }

  const payload = {
    name,
    email,
    phone,
    address,
    password,
    confirm_password: confirmPassword
  };

  const candidateUrls = [
    'backend/register.php',
    'http://localhost/sesco_tyres_frontend_redesign/backend/register.php',
    'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/register.php'
  ];

  let successData = null;
  let errorMsg = '';

  for (const endpointUrl of candidateUrls) {
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data && data.success) {
        successData = data;
        break;
      } else if (data && data.message) {
        errorMsg = data.message;
      }
    } catch (err) {
      errorMsg = err.message || '';
    }
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Create account</span> <span>→</span>';
  }

  if (successData) {
    const client = successData.client || {};
    const clientId = successData.client_id || client.client_id;
    if (clientId) localStorage.setItem('sesco-client-id', String(clientId));
    if (client.name) localStorage.setItem('sesco-client-name', client.name);
    if (client.email) localStorage.setItem('sesco-client-email', client.email);
    if (client.telephone && client.telephone !== 'Na') localStorage.setItem('sesco-client-phone', client.telephone);

    updateHeaderAuth();

    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#ecfdf5';
      feedback.style.color = '#065f46';
      feedback.style.border = '1px solid #a7f3d0';
      feedback.style.padding = '12px 14px';
      feedback.style.borderRadius = '6px';
      feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Registration Successful!</strong><br>Welcome, <strong>${client.name || name}</strong>! Your account has been saved in the <code>client</code> table (Client ID: <strong>#${clientId}</strong>).<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><a href="cart.html" class="btn btn-primary" style="font-size:12px;padding:6px 12px">View Cart &amp; Place Order</a><a href="shop.html" class="btn btn-outline" style="font-size:12px;padding:6px 12px">Browse Tyres</a></div>`;
    }
    toast(`Account created! Welcome, ${client.name || name}`);
    if (form && typeof form.reset === 'function') {
      form.reset();
    }
  } else {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.color = '#991b1b';
      feedback.style.border = '1px solid #fecaca';
      feedback.style.padding = '10px 14px';
      feedback.style.borderRadius = '6px';
      feedback.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${errorMsg || 'Could not complete registration. Please try again.'}`;
    }
    toast(errorMsg || 'Registration failed.');
  }
}
window.handleClientRegisterSubmit = handleClientRegisterSubmit;

async function handleClientLoginSubmit(form) {
  const email = (document.getElementById('login-email')?.value || form?.elements?.namedItem('email')?.value || '').trim();
  const password = document.getElementById('login-password')?.value || form?.elements?.namedItem('password')?.value || '';
  const submitBtn = document.getElementById('loginSubmitBtn');
  const feedback = document.getElementById('loginFeedback');

  if (!email || !password) {
    toast('Please enter both your email and password.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Signing in...</span>';
  }

  const payload = { email, password };
  const candidateUrls = [
    'backend/login.php',
    'http://localhost/sesco_tyres_frontend_redesign/backend/login.php',
    'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/login.php'
  ];

  let successData = null;
  let errorMsg = '';

  for (const endpointUrl of candidateUrls) {
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data && data.success) {
        successData = data;
        break;
      } else if (data && data.message) {
        errorMsg = data.message;
      }
    } catch (err) {
      errorMsg = err.message || '';
    }
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Sign in</span> <span>→</span>';
  }

  if (successData) {
    const client = successData.client || {};
    const clientId = successData.client_id || client.client_id;
    if (clientId) localStorage.setItem('sesco-client-id', String(clientId));
    if (client.name) localStorage.setItem('sesco-client-name', client.name);
    if (client.email) localStorage.setItem('sesco-client-email', client.email);
    if (client.telephone && client.telephone !== 'Na') localStorage.setItem('sesco-client-phone', client.telephone);

    updateHeaderAuth();

    const username = (client.name || client.username || (client.email ? client.email.split('@')[0] : '') || 'User').trim();
    showSweetAlertLogin(username, () => {
      const redirectUrl = new URLSearchParams(location.search).get('redirect');
      if (redirectUrl) {
        location.href = redirectUrl;
      }
    });

    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#ecfdf5';
      feedback.style.color = '#065f46';
      feedback.style.border = '1px solid #a7f3d0';
      feedback.style.padding = '12px 14px';
      feedback.style.borderRadius = '0';
      feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Signed in successfully!</strong><br>Welcome back, <strong>${client.name || 'Client'}</strong>.<div style="margin-top:10px;display:flex;gap:8px"><a href="cart.html" class="btn btn-primary" style="font-size:12px;padding:6px 12px">Go to Cart</a><a href="shop.html" class="btn btn-outline" style="font-size:12px;padding:6px 12px">Browse Tyres</a></div>`;
    }
  } else {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.color = '#991b1b';
      feedback.style.border = '1px solid #fecaca';
      feedback.style.padding = '10px 14px';
      feedback.style.borderRadius = '6px';
      feedback.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${errorMsg || 'Invalid email or password.'}`;
    }
    toast(errorMsg || 'Sign in failed.');
  }
}
window.handleClientLoginSubmit = handleClientLoginSubmit;

document.addEventListener('submit', async e => {
  if (e.target.matches('#cartOrderRequestForm')) {
    e.preventDefault();
    if (window.jQuery && window.jQuery(e.target).data('validator')) {
      return;
    }
    handleCartOrderSubmit(e.target);
    return;
  } if (e.target.matches('#appointmentForm')) { e.preventDefault(); const name = e.target.appFullName.value.trim(); const phone = e.target.appPhone.value.trim(); const email = e.target.appEmail.value.trim(); const service = e.target.appServices.value; const date = e.target.appDate.value; const time = e.target.appTime.value; const desc = e.target.appDescription.value.trim(); const feedback = document.getElementById('appFeedback'); if (!name || !phone || !email || !service) { toast('Please enter your Name, Phone, Email, and select a Service.'); return } const waText = encodeURIComponent(`Hello Sesco Tyres, I would like to book an appointment:\n- Name: ${name}\n- Phone: ${phone}\n- Email: ${email}\n- Service: ${service}${date ? '\n- Date: ' + date : ''}${time ? '\n- Time: ' + time : ''}${desc ? '\n- Notes: ' + desc : ''}`); const waUrl = `https://wa.me/256709828766?text=${waText}`; if (feedback) { feedback.style.display = 'block'; feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Appointment Request Received for ${name}!</strong><br>We have received your booking request for <strong>${service}</strong>${date ? ` on <strong>${date}</strong>` : ''}${time ? ` at <strong>${time}</strong>` : ''}. Our team will contact you at <strong>${phone}</strong> or <strong>${email}</strong> to confirm your slot.<div style="margin-top:10px"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;color:#fff;background:#25D366;padding:8px 16px;border-radius:4px;font-size:12.5px;font-weight:700;text-decoration:none"><i class="fa-brands fa-whatsapp"></i><span>Confirm on WhatsApp for Instant Slot Confirmation →</span></a></div>`; } toast(`Appointment request submitted for ${name}!`); } if (e.target.matches('#quoteRequestForm')) { e.preventDefault(); const service = e.target.quoteService.value; const qty = e.target.quoteQuantity.value; const vehicle = e.target.quoteVehicle.value.trim(); const name = e.target.quoteName.value.trim(); const phone = e.target.quotePhone.value.trim(); const notes = e.target.quoteNotes ? e.target.quoteNotes.value.trim() : ''; const feedback = document.getElementById('quoteFeedback'); if (!vehicle || !name || !phone) { toast('Please fill in your vehicle/tyre size, name, and phone number.'); return } const waText = encodeURIComponent(`Hello Sesco Tyres, I would like a quote for:\n- Service: ${service}\n- Quantity: ${qty}\n- Vehicle/Tyre: ${vehicle}\n- Name: ${name}\n- Phone: ${phone}${notes ? '\n- Notes: ' + notes : ''}`); const waUrl = `https://wa.me/256709828766?text=${waText}`; if (feedback) { feedback.style.display = 'block'; feedback.innerHTML = `<div style="font-weight:800;font-size:14px;color:#065f46;margin-bottom:6px"><i class="fa-solid fa-circle-check"></i> Quote Request Generated for ${name}!</div><p style="margin:0 0 10px;color:#047857">We have prepared your quotation enquiry for <strong>${service}</strong> (${qty}) for <strong>${vehicle}</strong>${notes ? ` (<em>${notes}</em>)` : ''}. Our workshop team will reach out at <strong>${phone}</strong> shortly.</p><div class="quote-feedback-actions"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background:#25D366;border-color:#25D366;color:#fff;font-size:12.5px;padding:9px 15px;display:inline-flex;align-items:center;gap:7px"><i class="fa-brands fa-whatsapp"></i><span>Send to WhatsApp for 5-Min Priority Quote →</span></a></div>`; } toast(`Quote request submitted for ${name}!`); } if (e.target.matches('#clientRegisterForm')) {
    e.preventDefault();
    if (window.jQuery && window.jQuery(e.target).data('validator')) {
      return;
    }
    handleClientRegisterSubmit(e.target);
    return;
  }

  if (e.target.matches('#clientLoginForm')) {
    e.preventDefault();
    if (window.jQuery && window.jQuery(e.target).data('validator')) {
      return;
    }
    handleClientLoginSubmit(e.target);
    return;
  }

if (e.target.matches('[data-demo-form]')) { e.preventDefault(); if ((window.jQuery && window.jQuery(e.target).data('validator')) || e.target.dataset.advancedHandled === 'true') { return; } const msg = e.target.querySelector('.form-message'); if (msg) { msg.style.display = 'block'; msg.textContent = 'Thanks! This is a frontend preview; your information has not been sent. Connect a backend or form service to receive submissions.' } else toast('Demo form only — no information was sent.'); e.target.reset() } if (e.target.matches('#tyre-finder')) { e.preventDefault(); location.href = 'shop.html?search=' + encodeURIComponent([...e.target.querySelectorAll('select')].map(s => s.value).filter(Boolean).join(' ')) } });
function initShowcaseParallax() { const section = document.getElementById('shop-section'); const bg = document.getElementById('showcaseParallaxBg'); if (!section || !bg || section.dataset.parallaxBound === 'true') return; section.dataset.parallaxBound = 'true'; if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; let isTicking = false; let isVisible = false; const observer = new IntersectionObserver(entries => { entries.forEach(entry => { isVisible = entry.isIntersecting; if (isVisible) onScroll(); }); }, { threshold: [0, 0.1, 0.5, 1] }); observer.observe(section); function onScroll() { if (!isVisible || isTicking) return; isTicking = true; requestAnimationFrame(() => { if (window.innerWidth <= 768) { bg.style.transform = 'translate3d(0, 0, 0)'; isTicking = false; return; } const rect = section.getBoundingClientRect(); const vh = window.innerHeight; const progress = (vh - rect.top) / (vh + rect.height); const offset = (progress - 0.5) * 70; bg.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`; isTicking = false; }); } window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll, { passive: true }); }
const shopCarouselState = {
  currentIndex: 0,
  timerId: null,
  isHovered: false,
  eventsBound: false
};
async function initShopCarousel() {
  const track = document.getElementById('shopCarouselTrack');
  const dotsContainer = document.getElementById('shopIndicators');
  const timerBar = document.getElementById('shopTimerBar');
  const slideCounter = document.getElementById('shopSlideCounter');
  const prevBtn = document.getElementById('shopPrevBtn');
  const nextBtn = document.getElementById('shopNextBtn');
  const carouselEl = document.getElementById('shopCarousel');
  if (!track) return;

  initShowcaseParallax();
  clearTimeout(shopCarouselState.timerId);
  shopCarouselState.currentIndex = 0;

  carouselEl?.classList.add('is-empty');
  track.classList.add('is-empty');
  if (prevBtn) prevBtn.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'none';
  if (dotsContainer) dotsContainer.innerHTML = '';
  if (timerBar) {
    timerBar.classList.remove('running', 'paused');
    timerBar.style.display = 'none';
  }
  if (slideCounter) slideCounter.textContent = '-- / --';

  track.innerHTML = `<div class="shop-carousel-empty"><div class="shop-carousel-empty-icon"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></div><h3>Connecting to tyre catalogue…</h3><p>Loading live tyres directly from <code>treads.item</code>.</p></div>`;

  const payload = await fetchShopDbItems({ limit: 10, mode: 'featured' });
  const showcaseItems = payload.connected && Array.isArray(payload.items) ? payload.items : [];

  if (!payload.connected || showcaseItems.length === 0) {
    registerDbProducts([], payload.connected === true);
    if (slideCounter) slideCounter.textContent = '00 / 00';
    track.innerHTML = !payload.connected
      ? `<div class="shop-carousel-empty"><div class="shop-carousel-empty-icon is-disconnected"><i class="fa-solid fa-database" aria-hidden="true"></i></div><h3>Database Not Connected</h3><p>No tyres are displayed because all products in the shop are loaded directly from the live <code>treads</code> database.</p><div class="shop-carousel-empty-actions"><button type="button" class="btn btn-primary" id="carouselRetryDbBtn">Retry Database Connection</button><a class="btn btn-outline" href="shop.html">Open Shop</a></div></div>`
      : `<div class="shop-carousel-empty"><div class="shop-carousel-empty-icon"><i class="fa-solid fa-box-open" aria-hidden="true"></i></div><h3>No Tyres Available</h3><p>The live <code>treads.item</code> table currently has 0 products to display.</p><div class="shop-carousel-empty-actions"><button type="button" class="btn btn-primary" id="carouselRetryDbBtn">Refresh from Database</button></div></div>`;
    const retryBtn = document.getElementById('carouselRetryDbBtn');
    if (retryBtn) retryBtn.addEventListener('click', initShopCarousel);
    return;
  }

  registerDbProducts(showcaseItems, true);
  carouselEl?.classList.remove('is-empty');
  track.classList.remove('is-empty');
  if (prevBtn) prevBtn.style.display = '';
  if (nextBtn) nextBtn.style.display = '';
  if (timerBar) timerBar.style.display = '';

  const fmtSlideNum = n => String(n).padStart(2, '0');
  if (slideCounter) {
    slideCounter.textContent = `${fmtSlideNum(1)} / ${fmtSlideNum(showcaseItems.length)}`;
  }

  track.innerHTML = showcaseItems.map((p, idx) => {
    const saved = getStore('sesco-wishlist').includes(p.id);
    const tyreSrc = p.transparentImage || p.image;
    const starsHtml = Array.from({ length: 5 }, (_, s) => s < ((p.rating || '').match(/★/g) || []).length ? '<i class="fa-solid fa-star" aria-hidden="true"></i>' : '<i class="fa-regular fa-star" aria-hidden="true"></i>').join('');
    return `<div class="shop-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}" role="group" aria-roledescription="slide" aria-label="${idx + 1} of ${showcaseItems.length}: ${p.brand} ${p.name}"><div class="showcase-content-grid"><div class="showcase-tyre-column"><div class="showcase-tyre-visual"><div class="showcase-glow-back" aria-hidden="true"></div><img class="showcase-tyre-img" src="${tyreSrc}" alt="${p.brand} ${p.name} - ${p.size}" loading="${idx === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='${p.image}'"><div class="showcase-ground-shadow" aria-hidden="true"></div></div></div><div class="showcase-details-column"><div class="showcase-brand-header"><span class="showcase-brand-badge">${p.brand}</span><button class="wishlist-btn showcase-wish-btn ${saved ? 'is-saved' : ''}" data-wish="${p.id}" aria-label="Save ${p.name} to wishlist" title="Save to wishlist"><i class="fa-${saved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i></button></div><h3 class="showcase-product-heading"><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="showcase-rating-line"><span class="showcase-stars" aria-label="5 star rating">${starsHtml}</span><span class="showcase-rating-label">${p.ratingText || '(Customer Favourite · 5.0 Rating)'}</span></div><div class="showcase-specs-matrix"><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-circle-dot" aria-hidden="true"></i> Size</span><strong class="spec-cell-value">${p.size}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Fitment</span><strong class="spec-cell-value">${p.fitment || 'Certified Fitment'}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Stock</span><strong class="spec-cell-value is-available">${p.stock || 'In Stock · Ready'}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Warranty</span><strong class="spec-cell-value">${p.warranty || 'Included'}</strong></div></div><div class="showcase-commerce-footer"><div class="showcase-pricing-block"><span class="showcase-price-val">${money(p.price)}</span><span class="showcase-price-sub">per tyre · Professional fitting included</span></div><div class="showcase-action-group"><button class="btn btn-primary showcase-cart-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i><span>Add to cart</span></button><a class="btn btn-outline showcase-details-btn" href="product.html?id=${p.id}" aria-label="View details for ${p.name}"><span>View Details</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></div></div></div></div>`;
  }).join('');

  if (dotsContainer) {
    dotsContainer.innerHTML = showcaseItems.map((p, idx) => `<button class="shop-dot ${idx === 0 ? 'active' : ''}" data-slide="${idx}" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}" aria-label="Slide ${idx + 1}: ${p.brand} ${p.name}"></button>`).join('');
  }

  showcaseItems.forEach(p => {
    const imgUrl = p.transparentImage || p.image;
    if (imgUrl) {
      const img = new Image();
      img.src = imgUrl;
    }
  });

  function resetTimerBar() {
    if (!timerBar) return;
    timerBar.classList.remove('running', 'paused');
    void timerBar.offsetWidth;
    timerBar.classList.add('running');
  }

  function startAutoTimer() {
    clearTimeout(shopCarouselState.timerId);
    const slides = track.querySelectorAll('.shop-slide');
    if (slides.length <= 1) return;
    resetTimerBar();
    shopCarouselState.timerId = setTimeout(() => {
      if (!shopCarouselState.isHovered) {
        goToSlide(shopCarouselState.currentIndex + 1);
      } else {
        startAutoTimer();
      }
    }, 3000);
  }

  function goToSlide(newIndex) {
    const slides = track.querySelectorAll('.shop-slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.shop-dot') : [];
    if (!slides.length) return;
    const prevIndex = shopCarouselState.currentIndex;
    shopCarouselState.currentIndex = (newIndex + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      if (idx === shopCarouselState.currentIndex) {
        slide.classList.remove('exiting');
        slide.classList.add('active');
      } else if (idx === prevIndex) {
        slide.classList.remove('active');
        slide.classList.add('exiting');
      } else {
        slide.classList.remove('active', 'exiting');
      }
    });
    dots.forEach((dot, idx) => {
      const isActive = idx === shopCarouselState.currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    if (slideCounter) {
      slideCounter.textContent = `${fmtSlideNum(shopCarouselState.currentIndex + 1)} / ${fmtSlideNum(slides.length)}`;
    }
    startAutoTimer();
  }

  if (!shopCarouselState.eventsBound) {
    shopCarouselState.eventsBound = true;
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(shopCarouselState.currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(shopCarouselState.currentIndex + 1));
    if (dotsContainer) {
      dotsContainer.addEventListener('click', e => {
        const dot = e.target.closest('.shop-dot');
        if (dot && dot.dataset.slide !== undefined) {
          goToSlide(Number(dot.dataset.slide));
        }
      });
    }
    if (carouselEl) {
      carouselEl.addEventListener('mouseenter', () => {
        shopCarouselState.isHovered = true;
        if (timerBar) timerBar.classList.add('paused');
      });
      carouselEl.addEventListener('mouseleave', () => {
        shopCarouselState.isHovered = false;
        if (timerBar) timerBar.classList.remove('paused');
        startAutoTimer();
      });
      carouselEl.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') {
          goToSlide(shopCarouselState.currentIndex - 1);
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          goToSlide(shopCarouselState.currentIndex + 1);
          e.preventDefault();
        }
      });
    }
  }

  startAutoTimer();
}
function initServicesCarousel() {
  const wrapper = document.getElementById('servicesCarouselWrapper');
  const viewport = document.getElementById('servicesCarouselViewport');
  const track = document.getElementById('servicesCarouselTrack');
  const prevBtn = document.getElementById('servicesPrevBtn');
  const nextBtn = document.getElementById('servicesNextBtn');
  const dotsContainer = document.getElementById('servicesPagination');
  if (!wrapper || !viewport || !track) return;
  const cards = track.querySelectorAll('.service-slide-card');
  if (!cards.length) return;
  let currentIndex = 0;
  let timerId = null;
  let isHovered = false;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let gap = 24;

  function getCardsPerView() {
    if (window.innerWidth > 1024) return 3;
    if (window.innerWidth > 640) return 2;
    return 1;
  }
  function getMaxIndex() {
    const cpv = getCardsPerView();
    return Math.max(0, cards.length - cpv);
  }
  function updateDimensions() {
    const cpv = getCardsPerView();
    gap = window.innerWidth <= 640 ? 16 : 22;
    const vpWidth = viewport.getBoundingClientRect().width;
    const totalGaps = (cpv - 1) * gap;
    const cardWidth = Math.max(200, (vpWidth - totalGaps) / cpv);
    cards.forEach((card, i) => {
      card.style.flex = `0 0 ${cardWidth}px`;
      card.style.width = `${cardWidth}px`;
      card.style.marginRight = (i === cards.length - 1) ? '0px' : `${gap}px`;
    });
    renderDots();
    moveToSlide(currentIndex, false);
  }
  function renderDots() {
    if (!dotsContainer) return;
    const maxIdx = getMaxIndex();
    let html = '';
    for (let i = 0; i <= maxIdx; i++) {
      html += `<button class="services-dot ${i === currentIndex ? 'active' : ''}" data-index="${i}" aria-label="Go to service slide ${i + 1}" role="tab" aria-selected="${i === currentIndex ? 'true' : 'false'}"></button>`;
    }
    dotsContainer.innerHTML = html;
  }
  function moveToSlide(index, animate = true) {
    const maxIdx = getMaxIndex();
    if (index < 0) currentIndex = maxIdx;
    else if (index > maxIdx) currentIndex = 0;
    else currentIndex = index;

    const cpv = getCardsPerView();
    const vpWidth = viewport.getBoundingClientRect().width;
    const totalGaps = (cpv - 1) * gap;
    const cardWidth = (vpWidth - totalGaps) / cpv;
    const offset = currentIndex * (cardWidth + gap);

    track.style.transition = animate ? 'transform .5s cubic-bezier(.2,.8,.25,1)' : 'none';
    track.style.transform = `translate3d(-${offset}px,0,0)`;

    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.services-dot');
      dots.forEach((dot, idx) => {
        const isActive = idx === currentIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }
    startAutoplay();
  }
  function startAutoplay() {
    stopAutoplay();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timerId = setTimeout(() => {
      if (!isHovered && !isDragging) {
        moveToSlide(currentIndex + 1, true);
      } else {
        startAutoplay();
      }
    }, 4500);
  }
  function stopAutoplay() {
    if (timerId) { clearTimeout(timerId); timerId = null; }
  }

  if (prevBtn) prevBtn.addEventListener('click', e => { e.preventDefault(); moveToSlide(currentIndex - 1, true); });
  if (nextBtn) nextBtn.addEventListener('click', e => { e.preventDefault(); moveToSlide(currentIndex + 1, true); });
  if (dotsContainer) {
    dotsContainer.addEventListener('click', e => {
      const dot = e.target.closest('.services-dot');
      if (dot && dot.dataset.index !== undefined) {
        moveToSlide(Number(dot.dataset.index), true);
      }
    });
  }

  wrapper.addEventListener('mouseenter', () => { isHovered = true; stopAutoplay(); });
  wrapper.addEventListener('mouseleave', () => { isHovered = false; startAutoplay(); });
  wrapper.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); moveToSlide(currentIndex - 1, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); moveToSlide(currentIndex + 1, true); }
  });

  viewport.addEventListener('touchstart', e => {
    stopAutoplay();
    isDragging = true;
    startX = e.touches[0].clientX;
    currentX = startX;
  }, { passive: true });
  viewport.addEventListener('touchmove', e => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
  }, { passive: true });
  viewport.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const diff = currentX - startX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) moveToSlide(currentIndex + 1, true);
      else moveToSlide(currentIndex - 1, true);
    } else {
      startAutoplay();
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateDimensions, 80);
  });

  updateDimensions();
  startAutoplay();
}

function updateHeaderAuth() {
  const clientName = localStorage.getItem('sesco-client-name');
  const clientId = localStorage.getItem('sesco-client-id');
  const isLoggedIn = Boolean(clientId && clientName);

  document.body.classList.toggle('user-logged-in', isLoggedIn);
  document.querySelectorAll('.main-header').forEach(header => {
    header.classList.toggle('is-logged-in', isLoggedIn);
  });

  document.querySelectorAll('.header-actions').forEach(actionsContainer => {
    actionsContainer.classList.toggle('is-logged-in', isLoggedIn);
    const loginBtn = actionsContainer.querySelector('.header-action-login');
    let userWrapper = actionsContainer.querySelector('.header-user-wrapper');

    if (isLoggedIn) {
      if (loginBtn) loginBtn.style.display = 'none';

      const displayName = clientName.trim();
      const userHtml = `
        <div class="header-user-badge" title="Logged in as ${displayName} (Client #${clientId})">
          <i class="fa-solid fa-circle-user header-user-icon" aria-hidden="true"></i>
          <span class="header-user-name">${displayName}</span>
        </div>
        <button type="button" class="header-logout-btn" data-header-logout aria-label="Log out of account" title="Log out">
          <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
        </button>
      `;

      if (userWrapper) {
        userWrapper.innerHTML = userHtml;
        userWrapper.style.display = 'inline-flex';
      } else {
        userWrapper = document.createElement('div');
        userWrapper.className = 'header-user-wrapper';
        userWrapper.innerHTML = userHtml;
        if (loginBtn && loginBtn.parentNode === actionsContainer) {
          loginBtn.insertAdjacentElement('afterend', userWrapper);
        } else {
          actionsContainer.appendChild(userWrapper);
        }
      }

      // Move wishlist icon, cart icon, username container and logout icon to the right when logged in
      const applyLoggedInShift = () => {
        if (window.innerWidth > 900) {
          actionsContainer.style.setProperty('position', 'relative', 'important');
          actionsContainer.style.setProperty('left', 'var(--header-logged-in-shift, clamp(35px, 3.8vw, 60px))', 'important');
          actionsContainer.style.removeProperty('transform');
        } else {
          actionsContainer.style.removeProperty('position');
          actionsContainer.style.removeProperty('left');
          actionsContainer.style.removeProperty('transform');
        }
      };
      requestAnimationFrame(applyLoggedInShift);
    } else {
      if (userWrapper) {
        userWrapper.remove();
      }
      actionsContainer.style.removeProperty('position');
      actionsContainer.style.removeProperty('left');
      actionsContainer.style.removeProperty('transform');
      actionsContainer.style.marginRight = '';
      if (loginBtn) {
        loginBtn.style.display = '';
        const span = loginBtn.querySelector('span');
        if (span) span.textContent = 'Login';
        loginBtn.title = 'Account / Sign In';
        loginBtn.classList.remove('is-logged-in');
      }
    }
  });
}
window.updateHeaderAuth = updateHeaderAuth;

window.addEventListener('resize', () => {
  const isLoggedIn = Boolean(localStorage.getItem('sesco-client-id') && localStorage.getItem('sesco-client-name'));
  document.querySelectorAll('.header-actions').forEach(actionsContainer => {
    if (isLoggedIn && window.innerWidth > 900) {
      actionsContainer.style.setProperty('position', 'relative', 'important');
      actionsContainer.style.setProperty('left', 'var(--header-logged-in-shift, clamp(35px, 3.8vw, 60px))', 'important');
      actionsContainer.style.removeProperty('transform');
    } else {
      actionsContainer.style.removeProperty('position');
      actionsContainer.style.removeProperty('left');
      actionsContainer.style.removeProperty('transform');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  updateCounts();
  updateHeaderAuth();
  loadCartPage();
  loadWishlistPage();
  loadProductPage();
  initAuthFormsValidation();
  initAOSGlobal();
  initShopCarousel();
  initServicesCarousel();
  const params = new URLSearchParams(location.search);
  const productInput = document.querySelector('[name="subject"]');
  if (productInput && params.get('product')) productInput.value = 'Enquiry about: ' + params.get('product');
  const heroVid = document.getElementById('heroVideo');
  if (heroVid && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVid.pause();
    const b = document.getElementById('heroVideoToggle');
    if (b) {
      b.querySelector('.video-control-icon').textContent = '▶';
      b.querySelector('.video-control-label').textContent = 'Play';
    }
  }
  initTestimonialsShowcase();
  initTestimonialsParallax();
  initStickyHeader();
  initBackToTop();
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

function initBackToTop() {
  let btn = document.getElementById('backToTopBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top-btn';
    btn.id = 'backToTopBtn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.setAttribute('title', 'Back to top');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    document.body.appendChild(btn);
  }

  let isTicking = false;
  const toggleVisibility = () => {
    if (window.scrollY > 350) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
    isTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      requestAnimationFrame(toggleVisibility);
      isTicking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  toggleVisibility();
}

if (document.readyState !== 'loading') {
  initBackToTop();
}

function initTestimonialsShowcase() {
  const showcase = document.getElementById('testimonialsShowcase');
  if (!showcase) return;

  const mainCard = document.getElementById('testimonialMainCard');
  const track = document.getElementById('testimonialsArcTrack');
  const mainStars = document.getElementById('mainTestimonialStars');
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

  const escapeSafe = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const buildFallbackAvatar = name => {
    const parts = String(name || 'DR').trim().split(/\s+/).filter(Boolean);
    const initials = (
      (parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || '')
    ).toUpperCase() || 'ST';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#163687"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Nunito Sans, Arial, sans-serif" font-size="34" font-weight="800">${escapeSafe(initials)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const formatQuoteHeading = headline => {
    const clean = String(headline || '').trim();
    if (!clean) return '""';
    return (clean.startsWith('"') && clean.endsWith('"')) ? clean : `"${clean}"`;
  };

  const mapDbRow = row => {
    const rawName = String(row.reviewer_name || 'Verified Driver').trim();
    const sourceLabel = String(row.source_label || 'Website Feedback').trim();
    const relTime = String(row.relative_time || 'Recently').trim();
    const isGoogle = sourceLabel.toLowerCase().includes('google');
    const sourceIcon = isGoogle
      ? '<i class="fa-brands fa-google" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-certificate" style="color:#38bdf8" aria-hidden="true"></i>';

    return {
      tag: String(row.subject_reviewed || row.review_type || 'Workshop Review'),
      rating: Math.max(1, Math.min(5, Number(row.rating) || 5)),
      heading: formatQuoteHeading(row.headline),
      text: String(row.review_text || ''),
      avatar: row.avatar_url || buildFallbackAvatar(rawName),
      plainName: rawName,
      name: `${escapeSafe(rawName)}${row.is_verified ? ' <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>' : ''}`,
      vehicle: String(row.vehicle || row.review_type || 'Sesco Tyres Customer'),
      source: `${sourceIcon} ${escapeSafe(sourceLabel)} · ${escapeSafe(relTime)}`
    };
  };

  let TESTIMONIALS_DATA = [
    {
      tag: "3D Alignment & Tyres",
      rating: 5,
      heading: '"Transformed my Prado\'s highway stability completely"',
      text: "I drove in after experiencing high-speed steering vibration on my Prado TX. The Sesco team didn't just push new tyres — they diagnosed uneven tread wear, performed precision computerized 3D laser alignment, and fitted Michelin Primacy 4s. The SUV glides effortlessly on the highway now. Honest technicians and zero guesswork.",
      avatar: "assets/images/testimonials/david-mukasa.jpg",
      plainName: "David Mukasa",
      name: 'David Mukasa <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Toyota Land Cruiser Prado · Kampala",
      source: '<i class="fa-brands fa-google" aria-hidden="true"></i> Google Verified · 4 days ago'
    },
    {
      tag: "Major Service & Brakes",
      rating: 5,
      heading: '"Transparent upfront pricing and zero mechanical jargon"',
      text: "As a woman car owner, I usually dread visiting repair garages because of unpredictable, inflated quotes. Sesco Tyres is refreshingly different! They gave me an itemized digital health sheet before touching anything, installed genuine Castrol oils, and completed the full service in 45 minutes while I worked from their clean lounge.",
      avatar: "assets/images/testimonials/sarah-nalubega.jpg",
      plainName: "Sarah Nalubega",
      name: 'Sarah Nalubega <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Toyota RAV4 Hybrid · Nakasero",
      source: '<i class="fa-solid fa-certificate" style="color:#38bdf8" aria-hidden="true"></i> Workshop Verified · 1 week ago'
    },
    {
      tag: "Fleet Maintenance",
      rating: 5,
      heading: '"Cut our logistics tyre blowouts to zero across 14 trucks"',
      text: "Managing a regional haulage fleet traversing the Northern Corridor requires heavy-duty reliability. We partnered with Sesco Tyres for commercial steer tyres and scheduled pressure maintenance. In 8 months, our fleet tyre life expanded by 30% and costly roadside blowouts dropped to zero. Invaluable logistics partners!",
      avatar: "assets/images/testimonials/ronald-kato.jpg",
      plainName: "Eng. Ronald Kato",
      name: 'Eng. Ronald Kato <i class="fa-solid fa-circle-check" title="Verified Commercial Fleet" aria-hidden="true"></i>',
      vehicle: "Logistics Director, LogisAfrica Haulage",
      source: '<i class="fa-brands fa-google" aria-hidden="true"></i> Google Verified · 2 weeks ago'
    },
    {
      tag: "Suspension & Balancing",
      rating: 5,
      heading: '"Effortless steering and perfect balance on highway & marram roads"',
      text: "Living in Entebbe and commuting to Kampala daily is tough on suspension and tyres. Sesco did a complete dynamic wheel balance and suspension check. No more steering wobble, and tyre grip in wet weather is night and day. Exceptional work and welcoming staff!",
      avatar: "assets/images/testimonials/grace-tumusiime.jpg",
      plainName: "Grace Tumusiime",
      name: 'Grace Tumusiime <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Subaru Forester · Entebbe",
      source: '<i class="fa-solid fa-certificate" style="color:#38bdf8" aria-hidden="true"></i> Workshop Verified · 3 weeks ago'
    },
    {
      tag: "Performance Fitment",
      rating: 5,
      heading: '"Flawless alloy mounting with zero rim marks or scuffs"',
      text: "Finding technicians who know how to handle delicate low-profile tyres on European wheels is rare in Kampala. The Sesco crew used modern touchless tyre machines and calibrated balancers. Smooth ride and immaculate care of my alloys. Highly recommended for premium cars!",
      avatar: "assets/images/testimonials/brian-kigozi.jpg",
      plainName: "Brian Kigozi",
      name: 'Brian Kigozi <i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>',
      vehicle: "Mercedes-Benz C200 · Kololo",
      source: '<i class="fa-brands fa-google" aria-hidden="true"></i> Google Verified · 1 month ago'
    }
  ];

  // 5 Slot coordinates along the semi-circle arc (Slots 0 to 4) - larger radius semi-circle
  const SLOTS = [
    { x: 126, y: 12, scale: 0.86, opacity: 0.72, zIndex: 2 }, // Slot 0: Top
    { x: 44, y: 100, scale: 0.94, opacity: 0.88, zIndex: 3 }, // Slot 1: Upper-Mid
    { x: 0, y: 188, scale: 1.22, opacity: 1, zIndex: 5 }, // Slot 2: Middle (Apex / Active)
    { x: 44, y: 276, scale: 0.94, opacity: 0.88, zIndex: 3 }, // Slot 3: Lower-Mid
    { x: 126, y: 364, scale: 0.86, opacity: 0.72, zIndex: 2 }  // Slot 4: Bottom
  ];

  // Map review index (0..4) to its DOM button element
  const reviewNodes = [];
  for (let r = 0; r < 5; r++) {
    reviewNodes[r] = track.querySelector(`.thumb-circle[data-review="${r}"]`);
  }

  let slotReviews = [2, 1, 0, 4, 3];
  let isAnimating = false;
  let autoTimer = null;

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

  function syncAvatarThumbnails() {
    for (let r = 0; r < 5; r++) {
      const node = reviewNodes[r];
      const item = TESTIMONIALS_DATA[r % TESTIMONIALS_DATA.length];
      if (!node || !item) continue;
      const img = node.querySelector('.thumb-circle-img');
      const tip = node.querySelector('.thumb-circle-tooltip');
      const plainName = item.plainName || item.name.replace(/<[^>]*>/g, '').trim();
      node.setAttribute('aria-label', `Review by ${plainName}`);
      if (img) {
        img.src = item.avatar;
        img.alt = plainName;
      }
      if (tip) {
        tip.textContent = plainName;
      }
    }
  }

  // Initialize all 5 nodes in their initial slot positions
  slotReviews.forEach((reviewIdx, slotIdx) => {
    applySlotToNode(reviewNodes[reviewIdx], slotIdx, true);
  });

  function updateMainCard(reviewIndex, isInstant = false) {
    const data = TESTIMONIALS_DATA[reviewIndex % TESTIMONIALS_DATA.length];
    if (!data) return;

    const applyData = () => {
      if (mainStars) {
        const score = Math.max(1, Math.min(5, Number(data.rating) || 5));
        let starsHtml = '';
        for (let s = 1; s <= 5; s++) {
          starsHtml += s <= score
            ? '<i class="fa-solid fa-star" aria-hidden="true"></i>'
            : '<i class="fa-regular fa-star" style="opacity:0.45" aria-hidden="true"></i>';
        }
        mainStars.innerHTML = starsHtml;
        mainStars.setAttribute('aria-label', `Rated ${score} stars out of 5`);
      }
      if (mainTag) mainTag.textContent = data.tag;
      if (mainHeading) mainHeading.textContent = data.heading;
      if (mainText) mainText.textContent = data.text;
      if (mainAvatar) {
        mainAvatar.src = data.avatar;
        mainAvatar.alt = data.plainName || data.name.replace(/<[^>]*>/g, '').trim();
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

  // Initial main card content matches middle thumbnail instantly without flash
  updateMainCard(slotReviews[2], true);

  // Hydrate testimonials dynamically from `treads.testimonials`
  (async () => {
    const candidateUrls = [
      'backend/testimonials.php?limit=5',
      'http://localhost/sesco_tyres_frontend_redesign/backend/testimonials.php?limit=5',
      'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/testimonials.php?limit=5'
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!res.ok) continue;
        const json = await res.json();
        if (json && json.success && Array.isArray(json.testimonials) && json.testimonials.length > 0) {
          TESTIMONIALS_DATA = json.testimonials.slice(0, 5).map(mapDbRow);
          syncAvatarThumbnails();
          slotReviews = [2, 1, 0, 4, 3];
          slotReviews.forEach((reviewIdx, slotIdx) => {
            applySlotToNode(reviewNodes[reviewIdx], slotIdx, true);
          });
          updateMainCard(slotReviews[2], true);
          resetAutoTimer();
          break;
        }
      } catch {
        // Try next candidate endpoint
      }
    }
  })();

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

/* ==========================================================================
   Interactive Scroll-Over Stacking Depth Effect (Quote -> Appointment -> Car Service)
   ========================================================================== */
function initStickyStackDepthEffect() {
  const quote = document.getElementById('quote');
  const appointment = document.getElementById('appointment');
  const carService = document.getElementById('car-servicing');

  if (!quote || !appointment) return;

  let ticking = false;

  function updateDepth() {
    ticking = false;
    const isDesktop = window.innerWidth > 1024;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isDesktop || prefersReducedMotion) {
      quote.style.transform = '';
      appointment.style.transform = '';
      return;
    }

    const headerHeight = 72;
    const vh = window.innerHeight;
    const appRect = appointment.getBoundingClientRect();

    // 1. Progress of Appointment overlaying Quote
    // Subtly push quote slightly back in scale while keeping 100% solid opacity
    if (appRect.top < vh && appRect.top >= headerHeight) {
      const progress = Math.min(1, Math.max(0, (vh - appRect.top) / (vh - headerHeight)));
      const scale = 1 - progress * 0.035;
      const translateY = -progress * 12;

      quote.style.transform = `scale(${scale.toFixed(4)}) translateY(${translateY.toFixed(1)}px)`;
    } else if (appRect.top < headerHeight) {
      quote.style.transform = 'scale(0.965) translateY(-12px)';
    } else {
      quote.style.transform = '';
    }

    // 2. Progress of Car Service overlaying Appointment
    if (carService) {
      const carRect = carService.getBoundingClientRect();
      if (carRect.top < vh && carRect.top >= headerHeight) {
        const progress2 = Math.min(1, Math.max(0, (vh - carRect.top) / (vh - headerHeight)));
        const scale2 = 1 - progress2 * 0.035;
        const translateY2 = -progress2 * 12;

        appointment.style.transform = `scale(${scale2.toFixed(4)}) translateY(${translateY2.toFixed(1)}px)`;
      } else if (carRect.top < headerHeight) {
        appointment.style.transform = 'scale(0.965) translateY(-12px)';
      } else if (appRect.top <= headerHeight) {
        appointment.style.transform = '';
      }
    }
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateDepth);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateDepth();
}

window.addEventListener('load', initStickyStackDepthEffect);
document.addEventListener('DOMContentLoaded', initStickyStackDepthEffect);

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

function initAOSGlobal() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      offset: 35
    });
  }
}
window.initAOSGlobal = initAOSGlobal;

/* ==========================================================================
   Auto-Updating Footer Year (Initial Load, Focus/Visibility & Midnight Rollover)
   ========================================================================== */
function initFooterYear() {
  if (typeof document === 'undefined') return;

  function syncYear() {
    const currentYear = String(new Date().getFullYear());
    const targets = document.querySelectorAll('#year, [data-current-year]');
    targets.forEach((el) => {
      if (el.textContent !== currentYear) {
        el.textContent = currentYear;
      }
    });
  }

  function scheduleNextMidnightSync() {
    if (typeof window === 'undefined') return;
    clearTimeout(window.__sescoFooterYearTimer);
    const now = new Date();
    // Target 100ms past next local midnight so setTimeout stays under the 32-bit limit
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 100);
    const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());
    window.__sescoFooterYearTimer = setTimeout(() => {
      syncYear();
      scheduleNextMidnightSync();
    }, delay);
  }

  window.updateFooterYear = syncYear;
  syncYear();
  scheduleNextMidnightSync();

  if (typeof window !== 'undefined' && !window.__sescoFooterYearBound) {
    window.__sescoFooterYearBound = true;
    window.addEventListener('pageshow', () => {
      syncYear();
      scheduleNextMidnightSync();
    });
    window.addEventListener('focus', () => {
      syncYear();
      scheduleNextMidnightSync();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        syncYear();
        scheduleNextMidnightSync();
      }
    });
  }
}

if (typeof document !== 'undefined') {
  initFooterYear();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initFooterYear();
      initAuthFormsValidation();
      initAOSGlobal();
    });
  } else {
    initAuthFormsValidation();
    initAOSGlobal();
  }
  window.addEventListener('load', () => {
    initFooterYear();
    initAuthFormsValidation();
    initAOSGlobal();
  });
}





