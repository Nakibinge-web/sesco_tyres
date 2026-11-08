
const PRODUCTS = [
  { id: 'p1', brand: 'MICHELIN', name: 'Primacy 4+ Touring Tyre', size: '205/55 R16', price: 385000, category: 'touring', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=85', transparentImage: 'assets/images/tyres/p1_michelin.png', tag: 'Popular', rating: '★★★★★', ratingText: '(Customer Favourite · 5.0 Rating)', fitment: 'Precision Certified Fit', stock: 'In Stock · Ready to Fit', warranty: '5-Year Warranty' },
  { id: 'p2', brand: 'BRIDGESTONE', name: 'Turanza T005 Premium', size: '225/45 R17', price: 420000, category: 'touring', image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=700&q=85', transparentImage: 'assets/images/tyres/p2_bridgestone.png', tag: 'Premium', rating: '★★★★★', ratingText: '(Top Wet/Dry Grip · 5.0 Rating)', fitment: 'Certified Fitment', stock: 'In Stock · Immediate Fit', warranty: '5-Year Warranty' },
  { id: 'p3', brand: 'GOODYEAR', name: 'EfficientGrip Performance', size: '195/65 R15', price: 315000, category: 'economy', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=700&q=85', transparentImage: 'assets/images/tyres/p3_goodyear.png', tag: 'Value', rating: '★★★★☆', ratingText: '(High Fuel Efficiency · 4.8 Rating)', fitment: 'Standard Fitment', stock: 'In Stock', warranty: '4-Year Warranty' },
  { id: 'p4', brand: 'CONTINENTAL', name: 'CrossContact SUV Tyre', size: '265/65 R17', price: 560000, category: 'suv', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=85', transparentImage: 'assets/images/tyres/p4_continental.png', tag: 'SUV', rating: '★★★★★', ratingText: '(Rugged All-Terrain · 5.0 Rating)', fitment: 'All-Wheel Drive Fit', stock: 'In Stock · 4x4 Certified', warranty: '5-Year Warranty' },
  { id: 'p5', brand: 'PIRELLI', name: 'Scorpion Verde All Season', size: '235/60 R18', price: 615000, category: 'suv', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=85', transparentImage: 'assets/images/tyres/p5_pirelli.png', tag: 'All season', rating: '★★★★★', ratingText: '(Eco-Impact Certified · 5.0 Rating)', fitment: 'SUV & Crossover Fit', stock: 'In Stock', warranty: '5-Year Warranty' },
  { id: 'p6', brand: 'DUNLOP', name: 'SP Sport Maxx Performance', size: '215/50 R17', price: 398000, category: 'performance', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=85', transparentImage: 'assets/images/tyres/p6_dunlop.png', tag: 'Performance', rating: '★★★★☆', ratingText: '(High-Speed Stability · 4.9 Rating)', fitment: 'Sport Tuned Fit', stock: 'In Stock · Track Tested', warranty: '4-Year Warranty' }
];
function getStore(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch (e) { return [] } }
function setStore(k, v) { localStorage.setItem(k, JSON.stringify(v)) }
function registerDbProducts(dbItems) {
  if (!Array.isArray(dbItems)) return;
  dbItems.forEach(item => {
    if (!item || !item.id) return;
    const idx = PRODUCTS.findIndex(x => x.id === item.id);
    if (idx >= 0) PRODUCTS[idx] = { ...PRODUCTS[idx], ...item };
    else PRODUCTS.push(item);
  });
  try { setStore('sesco-db-items', dbItems); } catch (e) {}
}
window.registerDbProducts = registerDbProducts;
registerDbProducts(getStore('sesco-db-items'));
function money(n) { return 'UGX ' + Number(n).toLocaleString('en-UG') }
function toast(msg) { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t) } t.textContent = msg; t.classList.add('show'); clearTimeout(window._toastTimer); window._toastTimer = setTimeout(() => t.classList.remove('show'), 2600) }
function updateCounts() { const cart = getStore('sesco-cart'), wish = getStore('sesco-wishlist'); const cartQty = cart.reduce((a, x) => a + x.qty, 0); document.querySelectorAll('[data-cart-count]').forEach(e => { if (cartQty > 0) { e.textContent = cartQty; e.style.display = '' } else { e.textContent = ''; e.style.display = 'none' } }); const wishQty = wish.length; document.querySelectorAll('[data-wish-count]').forEach(e => { if (wishQty > 0) { e.textContent = wishQty; e.style.display = '' } else { e.textContent = ''; e.style.display = 'none' } }); window.dispatchEvent(new CustomEvent('sesco:cart-updated', { detail: { cart, cartQty } })) }
function addCart(id) { const p = PRODUCTS.find(x => x.id === id); if (!p) return; let c = getStore('sesco-cart'); const f = c.find(x => x.id === id); if (f) { f.qty++; f.name = p.name; f.price = p.price; f.size = p.size; f.image = p.image; f.brand = p.brand; f.item_id = p.item_id || 0; f.item_brand_id = p.item_brand_id || null; f.item_category_id = p.item_category_id || 1; f.item_type_id = p.item_type_id || 1; f.item_unit_id = p.item_unit_id || 1; f.item_image_id = p.item_image_id || null; } else { c.push({ id, qty: 1, item_id: p.item_id || 0, item_brand_id: p.item_brand_id || null, item_category_id: p.item_category_id || 1, item_type_id: p.item_type_id || 1, item_unit_id: p.item_unit_id || 1, item_image_id: p.item_image_id || null, name: p.name, brand: p.brand, size: p.size, price: p.price, image: p.image }) } setStore('sesco-cart', c); updateCounts(); toast(`${p.name} added to your cart`) }
function removeCartItem(id) { let c = getStore('sesco-cart').filter(x => x.id !== id); setStore('sesco-cart', c); renderCart(); updateCounts(); toast('Item removed from cart') }
function setCartItemQty(id, newQty) { let c = getStore('sesco-cart'); if (newQty <= 0) { removeCartItem(id); return; } const f = c.find(x => x.id === id); if (f) { f.qty = Math.min(50, Number(newQty) || 1); setStore('sesco-cart', c); renderCart(); updateCounts(); } }
window.addCart = addCart;
window.removeCartItem = removeCartItem;
window.setCartItemQty = setCartItemQty;
function toggleWish(id) { let w = getStore('sesco-wishlist'); if (w.includes(id)) { w = w.filter(x => x !== id); toast('Removed from wishlist') } else { w.push(id); toast('Saved to wishlist') } setStore('sesco-wishlist', w); updateCounts(); document.querySelectorAll('[data-wish="' + id + '"]').forEach(b => { b.classList.toggle('is-saved', w.includes(id)); const icon = b.querySelector('i'); if (icon) { icon.className = w.includes(id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'; } }); if (document.body.dataset.page === 'wishlist') renderWishlist() }
function productCard(p) { const saved = getStore('sesco-wishlist').includes(p.id); return `<article class="product-card" data-category="${p.category}"><div class="product-image"><span class="product-tag">${p.tag}</span><button class="wishlist-btn ${saved ? 'is-saved' : ''}" data-wish="${p.id}" aria-label="Save ${p.name}"><i class="fa-${saved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i></button><img src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80'"></div><div class="product-info"><span class="brand">${p.brand}</span><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="spec">${p.size}</div><div class="rating">${p.rating} <span>(Customer favourite)</span></div><div class="product-bottom"><div class="price">${money(p.price)}<small> / tyre</small></div><button class="btn btn-dark" data-add="${p.id}">Add to cart</button></div></div></article>` }
function renderProducts(target, items = PRODUCTS) { const el = document.querySelector(target); if (el) el.innerHTML = items.map(productCard).join('') }
function renderCart() { const el = document.querySelector('#cart-content'); if (!el) return; const prevName = document.getElementById('orderCustomerName')?.value || localStorage.getItem('sesco-client-name') || ''; const prevContact = document.getElementById('orderCustomerContact')?.value || localStorage.getItem('sesco-client-phone') || ''; const prevEmail = document.getElementById('orderCustomerEmail')?.value || localStorage.getItem('sesco-client-email') || ''; const prevLocation = document.getElementById('orderCustomerLocation')?.value || ''; const c = getStore('sesco-cart'); if (!c.length) { el.innerHTML = `<div class="empty-state"><div class="big-icon">🛒</div><h2>Your cart is empty</h2><p>Select the tyres and items you want on the Shop page and they will automatically appear here.</p><a class="btn btn-primary" href="shop.html">Browse &amp; select tyres</a></div>`; return } let subtotal = 0; const rows = c.map(item => { const p = PRODUCTS.find(x => x.id === item.id) || item; if (!p || !p.name) return ''; const unitPrice = Number(p.price || item.price || 0); subtotal += unitPrice * item.qty; return `<tr><td><div class="cart-product"><img src="${p.image || 'assets/images/tyres/p1_michelin.png'}" alt="${p.name}"><div><strong>${p.name}</strong><br><small>${p.size || ''}${p.item_id ? ` · DB ID #${p.item_id}` : ''}</small></div></div></td><td>${money(unitPrice)}</td><td><div class="cart-qty-control"><button type="button" class="cart-qty-btn" data-cart-qty-btn="${item.id}" data-delta="-1" aria-label="Decrease quantity of ${p.name}" title="Decrease quantity">−</button><input type="number" class="cart-qty-input" min="1" max="50" value="${item.qty}" data-qty="${item.id}" aria-label="Quantity of ${p.name}"><button type="button" class="cart-qty-btn" data-cart-qty-btn="${item.id}" data-delta="1" aria-label="Increase quantity of ${p.name}" title="Increase quantity">+</button></div></td><td><strong>${money(unitPrice * item.qty)}</strong></td><td><button type="button" class="text-link" data-remove="${item.id}">Remove</button></td></tr>` }).join(''); el.innerHTML = `<div class="cart-layout"><div style="overflow:auto"><table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><aside class="cart-summary"><h3>Order summary</h3><div class="summary-row"><span>Selected items</span><strong>${c.reduce((a, x) => a + x.qty, 0)} unit(s)</strong></div><div class="summary-row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="summary-row"><span>Fitment / Delivery</span><span>Confirmed by team</span></div><div class="summary-row total"><span>Total</span><span>${money(subtotal)}</span></div><form id="cartOrderRequestForm"><div class="cart-order-fields"><div><label for="orderCustomerName">Name *</label><input type="text" id="orderCustomerName" name="name" placeholder="e.g. David Mukasa" required></div><div><label for="orderCustomerContact">Contact *</label><input type="tel" id="orderCustomerContact" name="contact" placeholder="e.g. +256 700 000000" required></div><div><label for="orderCustomerEmail">Email <span style="font-weight:500;color:#64748b">(optional)</span></label><input type="email" id="orderCustomerEmail" name="email" placeholder="e.g. david@example.com"></div><div><label for="orderCustomerLocation">Location *</label><input type="text" id="orderCustomerLocation" name="location" placeholder="e.g. Kampala, Queens Way / Entebbe" required></div></div><button class="btn btn-primary" type="submit" style="width:100%" id="sendOrderRequestBtn" data-send-order-request>Send order request</button></form><div id="cartOrderFeedback" class="cart-order-feedback" style="display:none"></div><a class="btn btn-outline" style="width:100%;margin-top:10px" href="shop.html">Continue shopping</a></aside></div>`; if (prevName) { const n = document.getElementById('orderCustomerName'); if (n) n.value = prevName; } if (prevContact) { const ct = document.getElementById('orderCustomerContact'); if (ct) ct.value = prevContact; } if (prevEmail) { const em = document.getElementById('orderCustomerEmail'); if (em) em.value = prevEmail; } if (prevLocation) { const loc = document.getElementById('orderCustomerLocation'); if (loc) loc.value = prevLocation; } }
function renderWishlist() { const el = document.querySelector('#wishlist-content'); if (!el) return; const w = getStore('sesco-wishlist'); const items = PRODUCTS.filter(p => w.includes(p.id)); el.innerHTML = items.length ? `<div class="products-grid">${items.map(productCard).join('')}</div>` : `<div class="empty-state"><div class="big-icon">♡</div><h2>Your wishlist is waiting</h2><p>Save tyres you want to compare later.</p><a class="btn btn-primary" href="shop.html">Explore tyres</a></div>` }
function renderProductDetail() { const el = document.querySelector('#product-detail'); if (!el) return; const id = new URLSearchParams(location.search).get('id') || 'p1'; const p = PRODUCTS.find(x => x.id === id) || PRODUCTS[0]; el.innerHTML = `<div class="detail-grid"><div class="detail-image"><img src="${p.image}" alt="${p.name}"></div><div class="detail-info"><div class="eyebrow">${p.brand}</div><h1>${p.name}</h1><div class="rating">${p.rating} <span>Customer rating</span></div><div class="spec">Tyre size: <strong>${p.size}</strong></div><div class="price">${money(p.price)} <small style="font-size:12px;color:#718096">per tyre</small></div><p>Designed for dependable everyday driving, confident handling and a comfortable ride. Confirm the exact size and vehicle fitment with our team before purchase.</p><div class="notice">Availability and final pricing are confirmed by our sales team. This demo does not submit an order.</div><div class="detail-actions"><button class="btn btn-primary" data-add="${p.id}">Add to cart</button><button class="btn btn-outline" data-wish="${p.id}">♡ Save for later</button><a class="btn btn-dark" href="contact.html?product=${encodeURIComponent(p.name)}">Ask about this tyre</a></div><table class="spec-table"><tr><td>Brand</td><td>${p.brand}</td></tr><tr><td>Tyre size</td><td>${p.size}</td></tr><tr><td>Category</td><td>${p.category}</td></tr><tr><td>Fitment advice</td><td>Available from our team</td></tr></table></div></div>` }
document.addEventListener('click', e => { const menu = e.target.closest('.menu-toggle'); if (menu) { document.querySelector('.nav')?.classList.toggle('open'); } else if (!e.target.closest('.nav')) { document.querySelector('.nav')?.classList.remove('open'); } const navLink = e.target.closest('.nav a'); if (navLink) { document.querySelector('.nav')?.classList.remove('open'); } const add = e.target.closest('[data-add]'); if (add) addCart(add.dataset.add); const wish = e.target.closest('[data-wish]'); if (wish) toggleWish(wish.dataset.wish); const qtyBtn = e.target.closest('[data-cart-qty-btn]'); if (qtyBtn) { const id = qtyBtn.dataset.cartQtyBtn; const delta = Number(qtyBtn.dataset.delta || 0); let c = getStore('sesco-cart'); const f = c.find(x => x.id === id); if (f) { const nextQty = (Number(f.qty) || 1) + delta; if (nextQty < 1) { toast('Minimum quantity is 1 — click Remove to delete item'); return; } f.qty = Math.min(50, nextQty); setStore('sesco-cart', c); renderCart(); updateCounts(); } } const rem = e.target.closest('[data-remove]'); if (rem) { setStore('sesco-cart', getStore('sesco-cart').filter(x => x.id !== rem.dataset.remove)); renderCart(); updateCounts() } const faq = e.target.closest('.faq-question'); if (faq) faq.parentElement.classList.toggle('open'); const checkout = e.target.closest('[data-demo-checkout]'); if (checkout) toast('Demo only — connect this button to your enquiry workflow later'); const filterBtn = e.target.closest('[data-mobile-filters]'); if (filterBtn) document.querySelector('.shop-layout')?.classList.toggle('filters-open'); const logoutBtn = e.target.closest('[data-header-logout]'); if (logoutBtn) { e.preventDefault(); localStorage.removeItem('sesco-client-id'); localStorage.removeItem('sesco-client-name'); localStorage.removeItem('sesco-client-email'); localStorage.removeItem('sesco-client-phone'); sessionStorage.removeItem('sesco-client-id'); sessionStorage.removeItem('sesco-client-name'); const candidateUrls = ['backend/logout.php', 'http://localhost/sesco_tyres_frontend_redesign/backend/logout.php', 'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/logout.php']; for (const endpointUrl of candidateUrls) { try { fetch(endpointUrl, { method: 'POST' }); break; } catch (err) {} } updateHeaderAuth(); toast('Logged out successfully.'); if (document.body.dataset.page === 'cart') { renderCart(); } } const passToggle = e.target.closest('[data-toggle-password]'); if (passToggle) { const targetId = passToggle.dataset.togglePassword; const input = document.getElementById(targetId); if (input) { const isPassword = input.type === 'password'; input.type = isPassword ? 'text' : 'password'; passToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password'); passToggle.setAttribute('title', isPassword ? 'Hide password' : 'Show password'); const icon = passToggle.querySelector('i'); if (icon) { icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'; } } } const vidBtn = e.target.closest('#heroVideoToggle'); if (vidBtn) { const v = document.getElementById('heroVideo'); if (v) { if (v.paused) { v.play(); vidBtn.querySelector('.video-control-icon').textContent = '⏸'; vidBtn.querySelector('.video-control-label').textContent = 'Pause'; vidBtn.setAttribute('aria-label', 'Pause background video') } else { v.pause(); vidBtn.querySelector('.video-control-icon').textContent = '▶'; vidBtn.querySelector('.video-control-label').textContent = 'Play'; vidBtn.setAttribute('aria-label', 'Play background video') } } } });
document.addEventListener('change', e => { if (e.target.matches('[data-qty]')) { let c = getStore('sesco-cart'); const f = c.find(x => x.id === e.target.dataset.qty); if (f) f.qty = Math.max(1, Math.min(50, Number(e.target.value) || 1)); setStore('sesco-cart', c); renderCart(); updateCounts() } if (e.target.matches('[data-filter]')) { const checked = [...document.querySelectorAll('[data-filter]:checked')].map(x => x.value); const items = PRODUCTS.filter(p => !checked.length || checked.includes(p.category)); renderProducts('#shop-products', items); const count = document.querySelector('#product-count'); if (count) count.textContent = items.length + ' products shown' } if (e.target.matches('#sort-products')) { const v = e.target.value; const arr = [...PRODUCTS]; if (v === 'price-low') arr.sort((a, b) => a.price - b.price); if (v === 'price-high') arr.sort((a, b) => b.price - a.price); if (v === 'name') arr.sort((a, b) => a.name.localeCompare(b.name)); renderProducts('#shop-products', arr) } });
document.addEventListener('submit', async e => { if (e.target.matches('#cartOrderRequestForm')) { e.preventDefault(); const form = e.target; const customerName = (document.getElementById('orderCustomerName')?.value || form.elements?.namedItem('name')?.value || '').trim(); const customerContact = (document.getElementById('orderCustomerContact')?.value || form.elements?.namedItem('contact')?.value || '').trim(); const customerEmail = (document.getElementById('orderCustomerEmail')?.value || form.elements?.namedItem('email')?.value || '').trim(); const customerLocation = (document.getElementById('orderCustomerLocation')?.value || form.elements?.namedItem('location')?.value || '').trim(); const storedClientId = localStorage.getItem('sesco-client-id'); const clientId = storedClientId && Number(storedClientId) > 0 ? Number(storedClientId) : null; const cartItems = getStore('sesco-cart'); const feedback = document.getElementById('cartOrderFeedback'); const submitBtn = document.getElementById('sendOrderRequestBtn'); if (!customerName || !customerContact || !customerLocation) { toast('Please enter your Name, Contact, and Location to send your order request.'); return; } if (!cartItems.length) { toast('Your cart is empty.'); return; } if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving order to database...'; } let orderRef = 'ORD-SESCO-' + Date.now().toString().slice(-6); let totalAmount = cartItems.reduce((sum, x) => sum + (Number(x.price || 0) * Number(x.qty || 1)), 0); let savedToDb = false; let insertedOrderId = null; let savedItemsArray = []; let dbErrorMsg = ''; const payloadBody = JSON.stringify({ client_id: clientId, name: customerName, contact: customerContact, email: customerEmail || null, location: customerLocation, items: cartItems }); const candidateUrls = ['backend/send_order_request.php', 'http://localhost/sesco_tyres_frontend_redesign/backend/send_order_request.php', 'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/send_order_request.php']; for (const endpointUrl of candidateUrls) { try { const res = await fetch(endpointUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: payloadBody }); if (res.ok) { const data = await res.json(); if (data && typeof data === 'object' && 'success' in data) { if (data.order_reference) orderRef = data.order_reference; if (data.total_amount) totalAmount = data.total_amount; if (data.order_id) insertedOrderId = data.order_id; else if (Array.isArray(data.order_ids) && data.order_ids.length) insertedOrderId = data.order_ids[0]; if (Array.isArray(data.items)) savedItemsArray = data.items; if (data.saved_to_orders_table) { savedToDb = true; break; } else if (data.db_error) { dbErrorMsg = data.db_error; } } } } catch (err) { dbErrorMsg = err.message || ''; } } const itemSummaryLines = cartItems.map(x => `• ${x.qty}x ${x.name} (${x.size || 'Standard'}) @ ${money(x.price)}`).join('\n'); const waText = encodeURIComponent(`Hello Sesco Tyres, I am sending Order Request ${orderRef}:\n- Name: ${customerName}\n- Contact: ${customerContact}${customerEmail ? '\n- Email: ' + customerEmail : ''}\n- Location: ${customerLocation}\n\nSelected Items:\n${itemSummaryLines}\n\nTotal: ${money(totalAmount)}`); const waUrl = `https://wa.me/256709828766?text=${waText}`; const itemsArrayHtml = savedItemsArray.length ? `<div style="margin-top:8px;padding:8px 10px;background:#fff;border:1px solid #a7f3d0;border-radius:6px;font-size:12px"><div style="font-weight:800;color:#065f46;margin-bottom:4px">Saved <code>items</code> Array in Order #${insertedOrderId || '—'} (${savedItemsArray.length} item${savedItemsArray.length > 1 ? 's' : ''}):</div>${savedItemsArray.map((it, idx) => `<div style="padding:3px 0;border-bottom:1px dashed #e2e8f0">[${idx}] Item #${it.item_id} (${it.description || it.name || 'Tyre'}) × <strong>${it.quantity}</strong> = <strong>${money(it.total_price)}</strong></div>`).join('')}</div>` : ''; if (feedback) { feedback.style.display = 'block'; feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Order Request Saved (${orderRef})!</strong><br>Thank you, <strong>${customerName}</strong>. Your order for <strong>${cartItems.reduce((a, x) => a + x.qty, 0)} unit(s)</strong> across <strong>${cartItems.length} item(s)</strong> (${money(totalAmount)}) has been ${savedToDb ? `saved as <strong>1 single record</strong> in <code>treads.orders</code> (Order ID: <strong>#${insertedOrderId}</strong>, <code>client_id</code>: <code>${clientId === null ? 'NULL' : clientId}</code>)` : `prepared${dbErrorMsg ? ` (DB notice: ${dbErrorMsg})` : ''}`}.<br><small>Contact: <strong>${customerContact}</strong>${customerEmail ? ` · Email: <strong>${customerEmail}</strong>` : ''} · Location: <strong>${customerLocation}</strong></small>${itemsArrayHtml}<div style="margin-top:10px"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background:#25D366;border-color:#25D366;color:#fff;font-size:12.5px;padding:9px 14px;display:inline-flex;align-items:center;gap:7px"><i class="fa-brands fa-whatsapp"></i><span>Send Order Request on WhatsApp for Instant Confirmation →</span></a></div>`; } if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = savedToDb ? 'Saved to orders table ✓' : 'Order request sent ✓'; } toast(savedToDb ? `Order ${orderRef} saved as 1 record in orders table!` : `Order request ${orderRef} submitted!`); return; } if (e.target.matches('#appointmentForm')) { e.preventDefault(); const name = e.target.appFullName.value.trim(); const phone = e.target.appPhone.value.trim(); const email = e.target.appEmail.value.trim(); const service = e.target.appServices.value; const date = e.target.appDate.value; const time = e.target.appTime.value; const desc = e.target.appDescription.value.trim(); const feedback = document.getElementById('appFeedback'); if (!name || !phone || !email || !service) { toast('Please enter your Name, Phone, Email, and select a Service.'); return } const waText = encodeURIComponent(`Hello Sesco Tyres, I would like to book an appointment:\n- Name: ${name}\n- Phone: ${phone}\n- Email: ${email}\n- Service: ${service}${date ? '\n- Date: ' + date : ''}${time ? '\n- Time: ' + time : ''}${desc ? '\n- Notes: ' + desc : ''}`); const waUrl = `https://wa.me/256709828766?text=${waText}`; if (feedback) { feedback.style.display = 'block'; feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Appointment Request Received for ${name}!</strong><br>We have received your booking request for <strong>${service}</strong>${date ? ` on <strong>${date}</strong>` : ''}${time ? ` at <strong>${time}</strong>` : ''}. Our team will contact you at <strong>${phone}</strong> or <strong>${email}</strong> to confirm your slot.<div style="margin-top:10px"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;color:#fff;background:#25D366;padding:8px 16px;border-radius:4px;font-size:12.5px;font-weight:700;text-decoration:none"><i class="fa-brands fa-whatsapp"></i><span>Confirm on WhatsApp for Instant Slot Confirmation →</span></a></div>`; } toast(`Appointment request submitted for ${name}!`); } if (e.target.matches('#quoteRequestForm')) { e.preventDefault(); const service = e.target.quoteService.value; const qty = e.target.quoteQuantity.value; const vehicle = e.target.quoteVehicle.value.trim(); const name = e.target.quoteName.value.trim(); const phone = e.target.quotePhone.value.trim(); const notes = e.target.quoteNotes ? e.target.quoteNotes.value.trim() : ''; const feedback = document.getElementById('quoteFeedback'); if (!vehicle || !name || !phone) { toast('Please fill in your vehicle/tyre size, name, and phone number.'); return } const waText = encodeURIComponent(`Hello Sesco Tyres, I would like a quote for:\n- Service: ${service}\n- Quantity: ${qty}\n- Vehicle/Tyre: ${vehicle}\n- Name: ${name}\n- Phone: ${phone}${notes ? '\n- Notes: ' + notes : ''}`); const waUrl = `https://wa.me/256709828766?text=${waText}`; if (feedback) { feedback.style.display = 'block'; feedback.innerHTML = `<div style="font-weight:800;font-size:14px;color:#065f46;margin-bottom:6px"><i class="fa-solid fa-circle-check"></i> Quote Request Generated for ${name}!</div><p style="margin:0 0 10px;color:#047857">We have prepared your quotation enquiry for <strong>${service}</strong> (${qty}) for <strong>${vehicle}</strong>${notes ? ` (<em>${notes}</em>)` : ''}. Our workshop team will reach out at <strong>${phone}</strong> shortly.</p><div class="quote-feedback-actions"><a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background:#25D366;border-color:#25D366;color:#fff;font-size:12.5px;padding:9px 15px;display:inline-flex;align-items:center;gap:7px"><i class="fa-brands fa-whatsapp"></i><span>Send to WhatsApp for 5-Min Priority Quote →</span></a></div>`; } toast(`Quote request submitted for ${name}!`); } if (e.target.matches('#clientRegisterForm')) {
  e.preventDefault();
  const form = e.target;
  const name = (document.getElementById('reg-name')?.value || form.elements?.namedItem('name')?.value || '').trim();
  const email = (document.getElementById('reg-email')?.value || form.elements?.namedItem('email')?.value || '').trim();
  const phone = (document.getElementById('reg-phone')?.value || form.elements?.namedItem('phone')?.value || '').trim();
  const address = (document.getElementById('reg-address')?.value || form.elements?.namedItem('address')?.value || '').trim();
  const password = document.getElementById('reg-password')?.value || form.elements?.namedItem('password')?.value || '';
  const confirmPassword = document.getElementById('reg-confirm')?.value || form.elements?.namedItem('confirm_password')?.value || '';
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
    submitBtn.textContent = 'Saving account to database...';
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
    submitBtn.textContent = 'Create account';
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
    form.reset();
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
  return;
}

if (e.target.matches('#clientLoginForm')) {
  e.preventDefault();
  const form = e.target;
  const email = (document.getElementById('login-email')?.value || form.elements?.namedItem('email')?.value || '').trim();
  const password = document.getElementById('login-password')?.value || form.elements?.namedItem('password')?.value || '';
  const submitBtn = document.getElementById('loginSubmitBtn');
  const feedback = document.getElementById('loginFeedback');

  if (!email || !password) {
    toast('Please enter both your email and password.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
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
    submitBtn.textContent = 'Sign in';
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
      feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Signed in successfully!</strong><br>Welcome back, <strong>${client.name || 'Client'}</strong>.<div style="margin-top:10px;display:flex;gap:8px"><a href="cart.html" class="btn btn-primary" style="font-size:12px;padding:6px 12px">Go to Cart</a><a href="shop.html" class="btn btn-outline" style="font-size:12px;padding:6px 12px">Browse Tyres</a></div>`;
    }
    toast(`Welcome back, ${client.name || 'Client'}!`);
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
  return;
}

if (e.target.matches('[data-demo-form]')) { e.preventDefault(); const msg = e.target.querySelector('.form-message'); if (msg) { msg.style.display = 'block'; msg.textContent = 'Thanks! This is a frontend preview; your information has not been sent. Connect a backend or form service to receive submissions.' } else toast('Demo form only — no information was sent.'); e.target.reset() } if (e.target.matches('#tyre-finder')) { e.preventDefault(); location.href = 'shop.html?search=' + encodeURIComponent([...e.target.querySelectorAll('select')].map(s => s.value).filter(Boolean).join(' ')) } });
function initShowcaseParallax() { const section = document.getElementById('shop-section'); const bg = document.getElementById('showcaseParallaxBg'); if (!section || !bg) return; if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; let isTicking = false; let isVisible = false; const observer = new IntersectionObserver(entries => { entries.forEach(entry => { isVisible = entry.isIntersecting; if (isVisible) onScroll(); }); }, { threshold: [0, 0.1, 0.5, 1] }); observer.observe(section); function onScroll() { if (!isVisible || isTicking) return; isTicking = true; requestAnimationFrame(() => { if (window.innerWidth <= 768) { bg.style.transform = 'translate3d(0, 0, 0)'; isTicking = false; return; } const rect = section.getBoundingClientRect(); const vh = window.innerHeight; const progress = (vh - rect.top) / (vh + rect.height); const offset = (progress - 0.5) * 70; bg.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`; isTicking = false; }); } window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll, { passive: true }); }
function initShopCarousel() { const track = document.getElementById('shopCarouselTrack'); const dotsContainer = document.getElementById('shopIndicators'); const timerBar = document.getElementById('shopTimerBar'); const slideCounter = document.getElementById('shopSlideCounter'); const prevBtn = document.getElementById('shopPrevBtn'); const nextBtn = document.getElementById('shopNextBtn'); const carouselEl = document.getElementById('shopCarousel'); if (!track || !PRODUCTS || !PRODUCTS.length) return; track.innerHTML = PRODUCTS.map((p, idx) => { const saved = getStore('sesco-wishlist').includes(p.id); const tyreSrc = p.transparentImage || p.image; const starsHtml = Array.from({ length: 5 }, (_, s) => s < ((p.rating || '').match(/★/g) || []).length ? '<i class="fa-solid fa-star" aria-hidden="true"></i>' : '<i class="fa-regular fa-star" aria-hidden="true"></i>').join(''); return `<div class="shop-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}" role="group" aria-roledescription="slide" aria-label="${idx + 1} of ${PRODUCTS.length}: ${p.brand} ${p.name}"><div class="showcase-content-grid"><div class="showcase-tyre-column"><div class="showcase-tyre-visual"><div class="showcase-glow-back" aria-hidden="true"></div><img class="showcase-tyre-img" src="${tyreSrc}" alt="${p.brand} ${p.name} - ${p.size}" loading="${idx === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='${p.image}'"><div class="showcase-ground-shadow" aria-hidden="true"></div></div></div><div class="showcase-details-column"><div class="showcase-brand-header"><span class="showcase-brand-badge">${p.brand}</span><button class="wishlist-btn showcase-wish-btn ${saved ? 'is-saved' : ''}" data-wish="${p.id}" aria-label="Save ${p.name} to wishlist" title="Save to wishlist"><i class="fa-${saved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i></button></div><h3 class="showcase-product-heading"><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="showcase-rating-line"><span class="showcase-stars" aria-label="5 star rating">${starsHtml}</span><span class="showcase-rating-label">${p.ratingText || '(Customer Favourite · 5.0 Rating)'}</span></div><div class="showcase-specs-matrix"><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-circle-dot" aria-hidden="true"></i> Size</span><strong class="spec-cell-value">${p.size}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Fitment</span><strong class="spec-cell-value">${p.fitment || 'Certified Fitment'}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Stock</span><strong class="spec-cell-value is-available">${p.stock || 'In Stock · Ready'}</strong></div><div class="showcase-spec-cell"><span class="spec-cell-label"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Warranty</span><strong class="spec-cell-value">${p.warranty || 'Included'}</strong></div></div><div class="showcase-commerce-footer"><div class="showcase-pricing-block"><span class="showcase-price-val">${money(p.price)}</span><span class="showcase-price-sub">per tyre · Professional fitting included</span></div><div class="showcase-action-group"><button class="btn btn-primary showcase-cart-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i><span>Add to cart</span></button><a class="btn btn-outline showcase-details-btn" href="product.html?id=${p.id}" aria-label="View details for ${p.name}"><span>View Details</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></div></div></div></div>`; }).join(''); if (dotsContainer) { dotsContainer.innerHTML = PRODUCTS.map((p, idx) => `<button class="shop-dot ${idx === 0 ? 'active' : ''}" data-slide="${idx}" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}" aria-label="Slide ${idx + 1}: ${p.brand} ${p.name}"></button>`).join(''); } let currentIndex = 0; let timerId = null; let isHovered = false; PRODUCTS.forEach(p => { const imgUrl = p.transparentImage || p.image; if (imgUrl) { const img = new Image(); img.src = imgUrl; } }); function resetTimerBar() { if (!timerBar) return; timerBar.classList.remove('running', 'paused'); void timerBar.offsetWidth; timerBar.classList.add('running'); } function goToSlide(newIndex) { const slides = track.querySelectorAll('.shop-slide'); const dots = dotsContainer ? dotsContainer.querySelectorAll('.shop-dot') : []; if (!slides.length) return; const prevIndex = currentIndex; currentIndex = (newIndex + slides.length) % slides.length; slides.forEach((slide, idx) => { if (idx === currentIndex) { slide.classList.remove('exiting'); slide.classList.add('active'); } else if (idx === prevIndex) { slide.classList.remove('active'); slide.classList.add('exiting'); } else { slide.classList.remove('active', 'exiting'); } }); dots.forEach((dot, idx) => { const isActive = idx === currentIndex; dot.classList.toggle('active', isActive); dot.setAttribute('aria-selected', isActive ? 'true' : 'false'); }); if (slideCounter) { slideCounter.textContent = `0${currentIndex + 1} / 0${slides.length}`; } startAutoTimer(); } function startAutoTimer() { clearTimeout(timerId); resetTimerBar(); timerId = setTimeout(() => { if (!isHovered) { goToSlide(currentIndex + 1); } else { startAutoTimer(); } }, 3000); } if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1)); if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1)); if (dotsContainer) { dotsContainer.addEventListener('click', e => { const dot = e.target.closest('.shop-dot'); if (dot && dot.dataset.slide !== undefined) { goToSlide(Number(dot.dataset.slide)); } }); } if (carouselEl) { carouselEl.addEventListener('mouseenter', () => { isHovered = true; if (timerBar) timerBar.classList.add('paused'); }); carouselEl.addEventListener('mouseleave', () => { isHovered = false; if (timerBar) timerBar.classList.remove('paused'); startAutoTimer(); }); carouselEl.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { goToSlide(currentIndex - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { goToSlide(currentIndex + 1); e.preventDefault(); } }); } startAutoTimer(); initShowcaseParallax(); }
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
  renderProducts('#featured-products', PRODUCTS.slice(0, 4));
  const shopContainer = document.querySelector('#shop-products');
  if (shopContainer && !shopContainer.hasAttribute('data-db-shop')) {
    renderProducts('#shop-products', PRODUCTS);
  }
  renderCart();
  renderWishlist();
  renderProductDetail();
  initShopCarousel();
  initServicesCarousel();
  const params = new URLSearchParams(location.search);
  const productInput = document.querySelector('[name="subject"]');
  if (productInput && params.get('product')) productInput.value = 'Enquiry about: ' + params.get('product');
  if (shopContainer && !shopContainer.hasAttribute('data-db-shop') && params.get('search')) {
    const search = params.get('search').toLowerCase();
    const found = PRODUCTS.filter(p => (p.size + ' ' + p.brand + ' ' + p.name).toLowerCase().includes(search));
    renderProducts('#shop-products', found);
    const count = document.querySelector('#product-count');
    if (count) count.textContent = found.length + ' matching products (demo catalogue)';
  }
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
      source: '<i class="fa-solid fa-certificate" style="color:#38bdf8" aria-hidden="true"></i> Workshop Verified · 1 week ago'
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
      source: '<i class="fa-solid fa-certificate" style="color:#38bdf8" aria-hidden="true"></i> Workshop Verified · 3 weeks ago'
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



