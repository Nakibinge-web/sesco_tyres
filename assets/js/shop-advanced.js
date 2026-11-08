/**
 * Sesco Tyres — Advanced Shop Controller & Bidirectional Animate-on-Scroll (AOS) Engine
 * Connects to `backend/get_items.php` (PHP 8.5.12) to fetch 10 sampled items from `treads.item`
 */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Built-in fallback of the exact first 10 rows of `treads.item` in case page is opened via file:// protocol
  const CLIENT_FALLBACK_ITEMS = [
    { id: 'item_1',  item_id: 1,  name: 'RODEO 185/70R13/86H/RP113',    description: 'RODEO 185/70R13/86H/RP113',    brand: 'RODEO',     item_brand_id: 3,  item_type: 'SERVICE', item_type_id: 41, item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '185/70 R13',  load_speed: '86H',      pattern: 'RP113',          price: 150000, price_source: 'price_list', restock_point: 1, category: 'economy',     category_label: 'Everyday Value',  tag: 'Everyday Value',  image: 'assets/images/tyres/p1_michelin.png',    transparentImage: 'assets/images/tyres/p1_michelin.png',    date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #1)' },
    { id: 'item_2',  item_id: 2,  name: 'RODEO 185/70R14/86H RP101',    description: 'RODEO 185/70R14/86H RP101',    brand: 'RODEO',     item_brand_id: 3,  item_type: 'SERVICE', item_type_id: 41, item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '185/70 R14',  load_speed: '86H',      pattern: 'RP101',          price: 160000, price_source: 'price_list', restock_point: 8, category: 'economy',     category_label: 'Everyday Value',  tag: 'Everyday Value',  image: 'assets/images/tyres/p2_bridgestone.png', transparentImage: 'assets/images/tyres/p2_bridgestone.png', date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #2)' },
    { id: 'item_3',  item_id: 3,  name: 'COMFORSER 195/65R15/91H',      description: 'COMFORSER 195/65R15/91H',      brand: 'COMFORSER', item_brand_id: 34, item_type: 'SERVICE', item_type_id: 41, item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '195/65 R15',  load_speed: '91H',      pattern: 'Standard Tread', price: 210000, price_source: 'price_list', restock_point: 1, category: 'economy',     category_label: 'Everyday Value',  tag: 'Everyday Value',  image: 'assets/images/tyres/p3_goodyear.png',    transparentImage: 'assets/images/tyres/p3_goodyear.png',    date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #3)' },
    { id: 'item_4',  item_id: 4,  name: 'RODEO 205/65R16/95H',          description: 'RODEO 205/65R16/95H',          brand: 'RODEO',     item_brand_id: 3,  item_type: 'TYRE',    item_type_id: 1,  item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '205/65 R16',  load_speed: '95H',      pattern: 'Standard Tread', price: 240000, price_source: 'price_list', restock_point: 1, category: 'touring',     category_label: 'Touring Comfort', tag: 'Touring Comfort', image: 'assets/images/tyres/p4_continental.png', transparentImage: 'assets/images/tyres/p4_continental.png', date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #4)' },
    { id: 'item_5',  item_id: 5,  name: 'COUGAR 205/60R16/92H',         description: 'COUGAR 205/60R16/92H',         brand: 'COUGAR',    item_brand_id: 7,  item_type: 'TYRE',    item_type_id: 1,  item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '205/60 R16',  load_speed: '92H',      pattern: 'Standard Tread', price: 240000, price_source: 'price_list', restock_point: 1, category: 'touring',     category_label: 'Touring Comfort', tag: 'Touring Comfort', image: 'assets/images/tyres/p5_pirelli.png',     transparentImage: 'assets/images/tyres/p5_pirelli.png',     date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #5)' },
    { id: 'item_6',  item_id: 6,  name: 'RODEO 205/70R15/95T/RP101',    description: 'RODEO 205/70R15/95T/RP101',    brand: 'RODEO',     item_brand_id: 3,  item_type: 'TYRE',    item_type_id: 1,  item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '205/70 R15',  load_speed: '95T',      pattern: 'RP101',          price: 250000, price_source: 'price_list', restock_point: 1, category: 'touring',     category_label: 'Touring Comfort', tag: 'Touring Comfort', image: 'assets/images/tyres/p6_dunlop.png',      transparentImage: 'assets/images/tyres/p6_dunlop.png',      date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #6)' },
    { id: 'item_7',  item_id: 7,  name: 'RODEO 215/60R16/95H/RP101',    description: 'RODEO 215/60R16/95H/RP101',    brand: 'RODEO',     item_brand_id: 3,  item_type: 'TYRE',    item_type_id: 1,  item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '215/60 R16',  load_speed: '95H',      pattern: 'RP101',          price: 260000, price_source: 'price_list', restock_point: 4, category: 'touring',     category_label: 'Touring Comfort', tag: 'Touring Comfort', image: 'assets/images/tyres/p2_bridgestone.png', transparentImage: 'assets/images/tyres/p2_bridgestone.png', date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #7)' },
    { id: 'item_9',  item_id: 9,  name: 'HABILEAD 255/70R15C/112/110S', description: 'HABILEAD 255/70R15C/112/110S', brand: 'HABILEAD',  item_brand_id: 5,  item_type: 'TYRE',    item_type_id: 1,  item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '255/70 R15C', load_speed: '112/110S', pattern: 'Standard Tread', price: 490000, price_source: 'price_list', restock_point: 8, category: 'commercial',  category_label: 'Commercial / LT', tag: 'Commercial / LT', image: 'assets/images/tyres/p5_pirelli.png',     transparentImage: 'assets/images/tyres/p5_pirelli.png',     date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #9)' },
    { id: 'item_10', item_id: 10, name: 'HABILEAD 255/70R16/111H/RS21', description: 'HABILEAD 255/70R16/111H/RS21', brand: 'HABILEAD',  item_brand_id: 5,  item_type: 'TYRE',    item_type_id: 1,  item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '255/70 R16',  load_speed: '111H',     pattern: 'RS21',           price: 480000, price_source: 'price_list', restock_point: 8, category: 'suv',         category_label: 'SUV & 4x4 Terrain', tag: 'SUV & 4x4 Terrain', image: 'assets/images/tyres/p1_michelin.png', transparentImage: 'assets/images/tyres/p1_michelin.png',    date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #10)' },
    { id: 'item_11', item_id: 11, name: 'HABILEAD 245/70R16/111H/XL',   description: 'HABILEAD 245/70R16/111H/XL',   brand: 'HABILEAD',  item_brand_id: 5,  item_type: 'TYRE',    item_type_id: 1,  item_category: 'Sales', unit: 'Pc(s)', unit_name: 'Pieces', size: '245/70 R16',  load_speed: '111H',     pattern: 'Standard Tread', price: 460000, price_source: 'price_list', restock_point: 2, category: 'performance', category_label: 'Performance XL',  tag: 'Performance XL',  image: 'assets/images/tyres/p3_goodyear.png',    transparentImage: 'assets/images/tyres/p3_goodyear.png',    date_added: '2020-09-22', rating: '★★★★★', ratingText: '(Verified DB Item #11)' }
  ];

  // State
  const state = {
    allSampledItems: [],
    filteredItems: [],
    sampleMode: 'first10',
    category: 'all',
    selectedBrands: new Set(),
    selectedRim: '',
    maxPrice: 1000000,
    searchQuery: '',
    sortBy: 'id-asc',
    viewMode: 'grid'
  };

  // DOM Elements
  const els = {
    grid: document.getElementById('shop-products'),
    countText: document.getElementById('product-count'),
    searchInput: document.getElementById('shopSearchInput'),
    searchClear: document.getElementById('shopSearchClear'),
    sortSelect: document.getElementById('sort-products'),
    brandList: document.getElementById('brandFilterList'),
    rimChips: document.getElementById('rimChipsGrid'),
    priceSlider: document.getElementById('shopPriceSlider'),
    priceReadout: document.getElementById('shopPriceReadout'),
    dbLivePill: document.getElementById('dbLiveStatusPill'),
    dbLiveText: document.getElementById('dbLiveStatusText'),
    phpVersionTag: document.getElementById('dbPhpVersionTag'),
    statTotalItems: document.getElementById('statTotalDbItems'),
    statSampleCount: document.getElementById('statSampleCount'),
    statTotalBrands: document.getElementById('statTotalBrands'),
    shuffleBtn: document.getElementById('dbShuffleSampleBtn'),
    sidebarRefreshBtn: document.getElementById('sidebarRefreshDbBtn'),
    resetFiltersBtn: document.getElementById('resetAllFiltersBtn'),
    scrollProgressBar: document.getElementById('shopScrollProgressBar'),
    modalBackdrop: document.getElementById('shopInspectModal'),
    modalCloseBtn: document.getElementById('shopModalCloseBtn'),
    modalBody: document.getElementById('shopModalBody'),
    floatingCartDock: document.getElementById('shopFloatingCartDock'),
    floatingCartTitle: document.getElementById('floatingCartTitle'),
    floatingCartSub: document.getElementById('floatingCartSub')
  };

  function formatUGX(amount) {
    return 'UGX ' + Number(amount || 0).toLocaleString('en-UG');
  }

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem('sesco-wishlist') || '[]');
    } catch (e) {
      return [];
    }
  }

  function getCartItems() {
    try {
      return JSON.parse(localStorage.getItem('sesco-cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function getCartQtyMap() {
    const map = new Map();
    getCartItems().forEach(entry => {
      if (entry && entry.id) {
        map.set(entry.id, Number(entry.qty) || 1);
      }
    });
    return map;
  }

  function updateFloatingCartDock() {
    if (!els.floatingCartDock) return;
    const cart = getCartItems();
    const totalUnits = cart.reduce((sum, x) => sum + (Number(x.qty) || 1), 0);
    const totalPrice = cart.reduce((sum, x) => {
      const p = state.allSampledItems.find(i => i.id === x.id);
      const unitPrice = Number(x.price || (p ? p.price : 0));
      return sum + unitPrice * (Number(x.qty) || 1);
    }, 0);

    if (totalUnits > 0) {
      els.floatingCartDock.classList.add('is-visible');
      if (els.floatingCartTitle) {
        els.floatingCartTitle.textContent = `${cart.length} item(s) selected (${totalUnits} unit${totalUnits > 1 ? 's' : ''}) · ${formatUGX(totalPrice)}`;
      }
      if (els.floatingCartSub) {
        els.floatingCartSub.textContent = 'Automatically added to your cart — ready to send order request';
      }
    } else {
      els.floatingCartDock.classList.remove('is-visible');
    }
  }

  // --------------------------------------------------------------------------
  // 1. FETCH 10-ITEM SAMPLE FROM `backend/get_items.php` (PHP 8.5.12)
  // --------------------------------------------------------------------------
  async function loadDatabaseItems(mode = state.sampleMode) {
    state.sampleMode = mode;

    // Highlight active sample mode button
    document.querySelectorAll('[data-sample-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sampleMode === mode);
    });

    if (els.grid) {
      els.grid.innerHTML = Array.from({ length: 6 }, () => `<div class="shop-skeleton-card"></div>`).join('');
    }

    try {
      const qs = `?limit=10&mode=${encodeURIComponent(mode)}&_t=${Date.now()}`;
      const candidateUrls = [
        `backend/get_items.php${qs}`,
        `http://localhost/sesco_tyres_frontend_redesign/backend/get_items.php${qs}`,
        `http://127.0.0.1/sesco_tyres_frontend_redesign/backend/get_items.php${qs}`
      ];
      let payload = null;
      for (const url of candidateUrls) {
        try {
          const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (response.ok) {
            const parsed = await response.json();
            if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
              payload = parsed;
              break;
            }
          }
        } catch (innerErr) {}
      }

      if (payload) {
        state.allSampledItems = payload.items;
        updateDatabaseTelemetry(payload);
      } else {
        throw new Error('Empty items payload');
      }
    } catch (err) {
      // Fallback if opened without Apache or network issue
      state.allSampledItems = CLIENT_FALLBACK_ITEMS;
      updateDatabaseTelemetry({
        connected: false,
        source: 'treads.sql-fallback',
        php_version: '8.5.12',
        count: CLIENT_FALLBACK_ITEMS.length,
        stats: { total_items: 690, total_brands: 210 }
      });
    }

    // Register with main.js so Cart, Wishlist, and Product Detail work seamlessly
    if (typeof window.registerDbProducts === 'function') {
      window.registerDbProducts(state.allSampledItems);
    }

    // Configure dynamic sidebar controls from the 10 fetched items
    buildDynamicSidebarFilters(state.allSampledItems);
    updateCategoryCounts(state.allSampledItems);
    applyFiltersAndRender();
  }

  function updateDatabaseTelemetry(payload) {
    if (els.dbLivePill && els.dbLiveText) {
      if (payload.connected) {
        els.dbLivePill.classList.remove('is-fallback');
        els.dbLiveText.textContent = `Connected · MySQL treads.item (${payload.count} Sampled)`;
      } else {
        els.dbLivePill.classList.add('is-fallback');
        els.dbLiveText.textContent = `Active · treads.item Sample (${payload.count} Items Loaded)`;
      }
    }
    if (els.phpVersionTag && payload.php_version) {
      els.phpVersionTag.innerHTML = `<i class="fa-brands fa-php"></i> PHP ${payload.php_version} · PDO MySQL`;
    }
    if (els.statTotalItems && payload.stats?.total_items) {
      animateCounter(els.statTotalItems, payload.stats.total_items);
    }
    if (els.statSampleCount) {
      animateCounter(els.statSampleCount, payload.count || 10);
    }
    if (els.statTotalBrands && payload.stats?.total_brands) {
      animateCounter(els.statTotalBrands, payload.stats.total_brands);
    }
  }

  function animateCounter(el, targetVal) {
    if (!el || isReducedMotion) {
      if (el) el.textContent = Number(targetVal).toLocaleString();
      return;
    }
    const duration = 900;
    const startTime = performance.now();
    const startVal = 0;

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetVal - startVal) * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // --------------------------------------------------------------------------
  // 2. DYNAMIC SIDEBAR FILTERS (BRANDS, RIMS, PRICE SLIDER, CATEGORIES)
  // --------------------------------------------------------------------------
  function buildDynamicSidebarFilters(items) {
    // 1. Brands count map
    const brandMap = new Map();
    const rimSet = new Set();
    let highestPrice = 300000;

    items.forEach(item => {
      const b = item.brand || 'SESCO';
      brandMap.set(b, (brandMap.get(b) || 0) + 1);

      const rimMatch = (item.size || '').match(/R(\d{2}(?:\.\d)?)/i);
      if (rimMatch) rimSet.add('R' + rimMatch[1]);

      if (item.price > highestPrice) highestPrice = item.price;
    });

    // Render Brand Checkboxes
    if (els.brandList) {
      const sortedBrands = Array.from(brandMap.entries()).sort((a, b) => b[1] - a[1]);
      els.brandList.innerHTML = sortedBrands.map(([brand, count]) => {
        const checked = state.selectedBrands.has(brand) ? 'checked' : '';
        return `
          <label class="brand-check-label">
            <span class="brand-check-left">
              <input type="checkbox" data-brand-check value="${brand}" ${checked}>
              <span>${brand}</span>
            </span>
            <span class="brand-count-badge">${count}</span>
          </label>
        `;
      }).join('');
    }

    // Render Rim Size Chips
    if (els.rimChips) {
      const sortedRims = Array.from(rimSet).sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)));
      els.rimChips.innerHTML = `
        <button type="button" class="rim-chip-btn ${state.selectedRim === '' ? 'active' : ''}" data-rim-chip="">All Rims</button>
        ${sortedRims.map(rim => `
          <button type="button" class="rim-chip-btn ${state.selectedRim === rim ? 'active' : ''}" data-rim-chip="${rim}">${rim}</button>
        `).join('')}
      `;
    }

    // Price Range Slider max
    if (els.priceSlider) {
      const ceilPrice = Math.max(500000, Math.ceil(highestPrice / 50000) * 50000);
      els.priceSlider.max = String(ceilPrice);
      if (state.maxPrice > ceilPrice || state.maxPrice === 1000000) {
        state.maxPrice = ceilPrice;
        els.priceSlider.value = String(ceilPrice);
      }
      if (els.priceReadout) {
        els.priceReadout.textContent = formatUGX(state.maxPrice);
      }
    }
  }

  function updateCategoryCounts(items) {
    const counts = {
      all: items.length,
      touring: 0,
      suv: 0,
      commercial: 0,
      performance: 0,
      economy: 0
    };
    items.forEach(item => {
      if (counts[item.category] !== undefined) counts[item.category]++;
    });

    document.querySelectorAll('[data-cat-pill]').forEach(btn => {
      const cat = btn.dataset.catPill;
      const badge = btn.querySelector('.cat-pill-count');
      if (badge && counts[cat] !== undefined) {
        badge.textContent = counts[cat];
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. FILTERING, SORTING & RENDERING 3D PRODUCT CARDS
  // --------------------------------------------------------------------------
  function applyFiltersAndRender() {
    const q = state.searchQuery.trim().toLowerCase();

    let list = state.allSampledItems.filter(item => {
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (state.selectedBrands.size > 0 && !state.selectedBrands.has(item.brand)) return false;
      if (state.selectedRim !== '' && !(item.size || '').toUpperCase().includes(state.selectedRim.toUpperCase())) return false;
      if (item.price > state.maxPrice) return false;
      if (q !== '') {
        const haystack = `${item.item_id} ${item.brand} ${item.name} ${item.description} ${item.size} ${item.load_speed} ${item.pattern} ${item.item_type}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Sort
    if (state.sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => a.item_id - b.item_id);
    }

    state.filteredItems = list;

    if (els.countText) {
      els.countText.innerHTML = `Showing <strong>${list.length}</strong> of <strong>${state.allSampledItems.length}</strong> sampled items from <code>treads.item</code>`;
    }

    renderCardsGrid(list);
  }

  function renderCardsGrid(items) {
    if (!els.grid) return;

    if (items.length === 0) {
      els.grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; background: #fff; border-radius: 18px; padding: 48px 24px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 40px; margin-bottom: 12px; color: #0284c7;"><i class="fa-solid fa-magnifying-glass-Minus"></i></div>
          <h3 style="margin: 0 0 8px; font-family: 'Poppins', sans-serif; color: #0b1c32;">No matching items in current 10-item sample</h3>
          <p style="margin: 0 0 18px; color: #64748b; font-size: 14px;">Try clearing your active filters or load a different 10-item sample from the 690 items in <code>treads.item</code>.</p>
          <button type="button" class="btn btn-primary" id="emptyResetBtn">Reset All Filters</button>
        </div>
      `;
      const emptyReset = document.getElementById('emptyResetBtn');
      if (emptyReset) emptyReset.addEventListener('click', resetAllFilters);
      return;
    }

    const wishlist = getWishlist();
    const cartQtyMap = getCartQtyMap();

    els.grid.innerHTML = items.map((item, idx) => {
      const isSaved = wishlist.includes(item.id);
      const inCartQty = cartQtyMap.get(item.id) || 0;
      const isSelected = inCartQty > 0;
      const staggerIndex = idx % 6;

      return `
        <article class="shop-item-card ${isSelected ? 'is-selected-in-cart' : ''}" data-shop-aos="card-3d" style="--aos-stagger: ${staggerIndex}" data-item-id="${item.item_id}" data-product-id="${item.id}" title="Click to select and add to cart">
          <div class="item-visual-stage">
            <div class="item-stage-ring" aria-hidden="true"></div>
            <div class="item-top-badges">
              <span class="item-cat-badge">${item.category_label || item.tag}</span>
              <span class="item-db-id-badge" title="Database Primary Key in treads.item">ID #${item.item_id}</span>
              ${isSelected ? `<span class="item-selected-pill"><i class="fa-solid fa-check" aria-hidden="true"></i> In Cart (${inCartQty})</span>` : ''}
            </div>
            <button type="button" class="item-wish-btn wishlist-btn ${isSaved ? 'is-saved' : ''}" data-wish="${item.id}" aria-label="Save ${item.name} to wishlist" title="Save to Wishlist">
              <i class="fa-${isSaved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>
            </button>
            <img class="item-tyre-img" src="${item.image}" alt="${item.description}" loading="lazy">
            <button type="button" class="item-quick-inspect-btn" data-inspect-id="${item.item_id}">
              <i class="fa-solid fa-database" aria-hidden="true"></i>
              <span>Inspect DB Record</span>
            </button>
          </div>

          <div class="item-card-body">
            <div class="item-brand-row">
              <span class="item-brand-name">${item.brand}</span>
              <span class="item-type-pill"><i class="fa-solid fa-tag" aria-hidden="true"></i> ${item.item_type}</span>
            </div>

            <h3 class="item-card-title">
              <a href="product.html?id=${encodeURIComponent(item.id)}">${item.description}</a>
            </h3>

            <div class="item-specs-grid">
              <div class="item-spec-box">
                <span class="item-spec-label">Tyre Size</span>
                <span class="item-spec-val">${item.size}</span>
              </div>
              <div class="item-spec-box">
                <span class="item-spec-label">Load / Speed</span>
                <span class="item-spec-val">${item.load_speed}</span>
              </div>
              <div class="item-spec-box">
                <span class="item-spec-label">Pattern / Unit</span>
                <span class="item-spec-val">${item.pattern !== 'Standard Tread' ? item.pattern : item.unit}</span>
              </div>
              <div class="item-spec-box">
                <span class="item-spec-label">Restock Pt</span>
                <span class="item-spec-val" style="color:#059669">${item.restock_point} ${item.unit}</span>
              </div>
            </div>

            <div class="item-card-footer">
              <div class="item-price-wrap">
                <span class="item-price-amount">${formatUGX(item.price)}</span>
                <span class="item-price-unit">per ${item.unit} · ${item.price_source === 'price_list' ? 'DB Price List' : 'Standard Rate'}</span>
              </div>
              <div class="item-card-actions" data-card-actions="${item.id}">
                ${renderCardActionControls(item.id, inCartQty)}
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Initialize 3D hover spotlight & observe new cards for Animate-on-Scroll
    bindCardHoverEffects();
    refreshAosElements();
    updateFloatingCartDock();
  }

  function renderCardActionControls(productId, inCartQty) {
    if (inCartQty > 0) {
      return `
        <div class="item-qty-stepper" aria-label="Adjust quantity in cart">
          <button type="button" class="qty-step-btn" data-step-id="${productId}" data-step-delta="-1" title="Decrease quantity">−</button>
          <span class="qty-step-val">${inCartQty}</span>
          <button type="button" class="qty-step-btn" data-step-id="${productId}" data-step-delta="1" title="Increase quantity">+</button>
        </div>
        <button type="button" class="item-select-btn is-selected" data-select-item="${productId}" title="Click to unselect and remove from cart">
          <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
          <span>Selected</span>
        </button>
      `;
    }
    return `
      <button type="button" class="item-select-btn" data-select-item="${productId}">
        <i class="fa-solid fa-cart-plus" aria-hidden="true"></i>
        <span>Select Item</span>
      </button>
    `;
  }

  function syncCardSelectionStates() {
    const cartQtyMap = getCartQtyMap();
    document.querySelectorAll('.shop-item-card[data-product-id]').forEach(card => {
      const productId = card.dataset.productId;
      const qty = cartQtyMap.get(productId) || 0;
      const isSelected = qty > 0;
      card.classList.toggle('is-selected-in-cart', isSelected);

      const topBadges = card.querySelector('.item-top-badges');
      if (topBadges) {
        let pill = topBadges.querySelector('.item-selected-pill');
        if (isSelected) {
          if (!pill) {
            pill = document.createElement('span');
            pill.className = 'item-selected-pill';
            topBadges.appendChild(pill);
          }
          pill.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i> In Cart (${qty})`;
        } else if (pill) {
          pill.remove();
        }
      }

      const actionsEl = card.querySelector(`[data-card-actions="${productId}"]`);
      if (actionsEl) {
        actionsEl.innerHTML = renderCardActionControls(productId, qty);
      }
    });
    updateFloatingCartDock();
  }

  // --------------------------------------------------------------------------
  // 4. INTERACTIVE 3D CURSOR SPOTLIGHT & TILT ON PRODUCT CARDS
  // --------------------------------------------------------------------------
  function bindCardHoverEffects() {
    if (isReducedMotion) return;
    const cards = document.querySelectorAll('.shop-item-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. QUICK INSPECT DATABASE RECORD MODAL
  // --------------------------------------------------------------------------
  function openInspectModal(itemId) {
    const item = state.allSampledItems.find(x => Number(x.item_id) === Number(itemId));
    if (!item || !els.modalBackdrop || !els.modalBody) return;

    const waText = encodeURIComponent(
      `Hello Sesco Tyres, I am enquiring about Database Item #${item.item_id} (${item.description}) priced at ${formatUGX(item.price)}.`
    );

    els.modalBody.innerHTML = `
      <div class="shop-modal-grid">
        <div class="shop-modal-visual">
          <span class="item-cat-badge" style="margin-bottom: 12px;">${item.category_label}</span>
          <img src="${item.image}" alt="${item.description}">
          <div style="font-family: ui-monospace, monospace; font-size: 12px; color: #93c5fd;">
            treads.item · item_id = ${item.item_id}
          </div>
        </div>
        <div class="shop-modal-content">
          <div style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 1px;">
            ${item.brand} · ${item.item_type}
          </div>
          <h2 style="margin: 4px 0 8px; font-family: 'Poppins', sans-serif; font-size: 22px; color: #0b1c32;">
            ${item.description}
          </h2>
          <div style="font-size: 22px; font-weight: 800; color: #163687; margin-bottom: 12px;">
            ${formatUGX(item.price)} <small style="font-size: 12px; color: #64748b; font-weight: 600;">/ ${item.unit}</small>
          </div>

          <table class="modal-db-table">
            <tbody>
              <tr><th>DB Primary Key (<code>item_id</code>)</th><td>#${item.item_id}</td></tr>
              <tr><th>Raw DB <code>description</code></th><td><code>${item.description}</code></td></tr>
              <tr><th>Brand (<code>item_brand</code>)</th><td>${item.brand} (ID: ${item.item_brand_id})</td></tr>
              <tr><th>Type (<code>item_type</code>)</th><td>${item.item_type} (ID: ${item.item_type_id})</td></tr>
              <tr><th>Parsed Tyre Size & Load</th><td>${item.size} · ${item.load_speed}</td></tr>
              <tr><th>Unit (<code>item_unit</code>)</th><td>${item.unit_name} (${item.unit})</td></tr>
              <tr><th>Restock Threshold (<code>restock_point</code>)</th><td>${item.restock_point} ${item.unit}</td></tr>
              <tr><th>Date Added (<code>date</code>)</th><td>${item.date_added}</td></tr>
            </tbody>
          </table>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" data-add="${item.id}">
              <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
            <a class="btn btn-outline" href="https://wa.me/256709828766?text=${waText}" target="_blank" rel="noopener noreferrer" style="border-color:#25D366;color:#059669;">
              <i class="fa-brands fa-whatsapp"></i> Confirm Stock on WhatsApp
            </a>
          </div>
        </div>
      </div>
    `;

    els.modalBackdrop.classList.add('is-open');
    els.modalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeInspectModal() {
    if (!els.modalBackdrop) return;
    els.modalBackdrop.classList.remove('is-open');
    els.modalBackdrop.setAttribute('aria-hidden', 'true');
  }

  function resetAllFilters() {
    state.category = 'all';
    state.selectedBrands.clear();
    state.selectedRim = '';
    state.searchQuery = '';
    state.sortBy = 'id-asc';

    if (els.searchInput) els.searchInput.value = '';
    if (els.searchClear) els.searchClear.classList.remove('visible');
    if (els.sortSelect) els.sortSelect.value = 'id-asc';

    document.querySelectorAll('[data-cat-pill]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.catPill === 'all');
    });

    buildDynamicSidebarFilters(state.allSampledItems);
    applyFiltersAndRender();
  }

  // --------------------------------------------------------------------------
  // 6. BIDIRECTIONAL ANIMATE-ON-SCROLL (AOS) CONTROLLER
  // --------------------------------------------------------------------------
  let aosElements = [];
  let isScrollTicking = false;

  function refreshAosElements() {
    aosElements = Array.from(document.querySelectorAll('[data-shop-aos]'));
    evaluateScrollAnimations();
  }

  function evaluateScrollAnimations() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (els.scrollProgressBar && docHeight > 0) {
      const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      els.scrollProgressBar.style.width = `${pct.toFixed(1)}%`;
    }

    if (isReducedMotion) {
      aosElements.forEach(el => el.classList.add('aos-in-view'));
      return;
    }

    const vh = window.innerHeight;

    aosElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < vh - 40 && rect.bottom > 40;

      if (isVisible) {
        if (!el.classList.contains('aos-in-view')) {
          el.classList.add('aos-in-view');
        }
      } else {
        // Bidirectional: remove class when scrolled out of view so it re-animates smoothly on scroll back
        if (el.classList.contains('aos-in-view')) {
          el.classList.remove('aos-in-view');
        }
      }
    });
  }

  function onWindowScroll() {
    if (!isScrollTicking) {
      requestAnimationFrame(() => {
        evaluateScrollAnimations();
        isScrollTicking = false;
      });
      isScrollTicking = true;
    }
  }

  // --------------------------------------------------------------------------
  // 7. EVENT LISTENERS & INITIALIZATION
  // --------------------------------------------------------------------------
  function bindEvents() {
    // Search input
    if (els.searchInput) {
      els.searchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value;
        if (els.searchClear) {
          els.searchClear.classList.toggle('visible', state.searchQuery.length > 0);
        }
        applyFiltersAndRender();
      });
    }

    if (els.searchClear) {
      els.searchClear.addEventListener('click', () => {
        state.searchQuery = '';
        if (els.searchInput) els.searchInput.value = '';
        els.searchClear.classList.remove('visible');
        applyFiltersAndRender();
      });
    }

    // Sample Mode Switcher (First 10, Featured 10, Random 10)
    document.addEventListener('click', e => {
      const modeBtn = e.target.closest('[data-sample-mode]');
      if (modeBtn) {
        loadDatabaseItems(modeBtn.dataset.sampleMode);
        return;
      }

      const catBtn = e.target.closest('[data-cat-pill]');
      if (catBtn) {
        state.category = catBtn.dataset.catPill;
        document.querySelectorAll('[data-cat-pill]').forEach(b => b.classList.toggle('active', b === catBtn));
        applyFiltersAndRender();
        return;
      }

      const rimBtn = e.target.closest('[data-rim-chip]');
      if (rimBtn) {
        state.selectedRim = rimBtn.dataset.rimChip;
        document.querySelectorAll('[data-rim-chip]').forEach(b => b.classList.toggle('active', b === rimBtn));
        applyFiltersAndRender();
        return;
      }

      const viewBtn = e.target.closest('[data-view-mode]');
      if (viewBtn && els.grid) {
        state.viewMode = viewBtn.dataset.viewMode;
        document.querySelectorAll('[data-view-mode]').forEach(b => b.classList.toggle('active', b === viewBtn));
        els.grid.classList.toggle('is-list-view', state.viewMode === 'list');
        return;
      }

      const inspectBtn = e.target.closest('[data-inspect-id]');
      if (inspectBtn) {
        openInspectModal(inspectBtn.dataset.inspectId);
        return;
      }

      // Inline quantity stepper (- / +) on selected cards
      const stepBtn = e.target.closest('[data-step-id]');
      if (stepBtn) {
        const prodId = stepBtn.dataset.stepId;
        const delta = Number(stepBtn.dataset.stepDelta || 0);
        const currentQty = getCartQtyMap().get(prodId) || 0;
        const nextQty = currentQty + delta;
        if (typeof window.setCartItemQty === 'function') {
          window.setCartItemQty(prodId, nextQty);
        }
        syncCardSelectionStates();
        return;
      }

      // Select / Unselect button on card
      const selectBtn = e.target.closest('[data-select-item]');
      if (selectBtn) {
        const prodId = selectBtn.dataset.selectItem;
        const currentQty = getCartQtyMap().get(prodId) || 0;
        if (currentQty > 0) {
          if (typeof window.removeCartItem === 'function') {
            window.removeCartItem(prodId);
          }
        } else {
          if (typeof window.addCart === 'function') {
            window.addCart(prodId);
          }
        }
        syncCardSelectionStates();
        return;
      }

      // Clicking anywhere on an item card (outside links/wishlist/inspect) automatically adds/selects it in the cart
      const itemCard = e.target.closest('.shop-item-card[data-product-id]');
      if (
        itemCard &&
        !e.target.closest('a') &&
        !e.target.closest('[data-wish]') &&
        !e.target.closest('[data-inspect-id]') &&
        !e.target.closest('[data-add]')
      ) {
        const prodId = itemCard.dataset.productId;
        if (prodId && typeof window.addCart === 'function') {
          window.addCart(prodId);
          syncCardSelectionStates();
        }
        return;
      }

      if (e.target === els.modalBackdrop) {
        closeInspectModal();
      }
    });

    window.addEventListener('sesco:cart-updated', () => {
      syncCardSelectionStates();
    });

    // Brand checkbox changes
    document.addEventListener('change', e => {
      if (e.target.matches('[data-brand-check]')) {
        const brand = e.target.value;
        if (e.target.checked) state.selectedBrands.add(brand);
        else state.selectedBrands.delete(brand);
        applyFiltersAndRender();
      }
    });

    // Price slider
    if (els.priceSlider) {
      els.priceSlider.addEventListener('input', e => {
        state.maxPrice = Number(e.target.value);
        if (els.priceReadout) els.priceReadout.textContent = formatUGX(state.maxPrice);
        applyFiltersAndRender();
      });
    }

    // Sort select
    if (els.sortSelect) {
      els.sortSelect.addEventListener('change', e => {
        state.sortBy = e.target.value;
        applyFiltersAndRender();
      });
    }

    // Shuffle / Re-fetch buttons
    if (els.shuffleBtn) {
      els.shuffleBtn.addEventListener('click', () => loadDatabaseItems('random'));
    }
    if (els.sidebarRefreshBtn) {
      els.sidebarRefreshBtn.addEventListener('click', () => loadDatabaseItems(state.sampleMode));
    }
    if (els.resetFiltersBtn) {
      els.resetFiltersBtn.addEventListener('click', resetAllFilters);
    }
    if (els.modalCloseBtn) {
      els.modalCloseBtn.addEventListener('click', closeInspectModal);
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeInspectModal();
    });

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('resize', onWindowScroll, { passive: true });
  }

  function init() {
    // Check if URL has ?search=... from Home page Tyre Finder
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('search')) {
      state.searchQuery = urlParams.get('search');
      if (els.searchInput) els.searchInput.value = state.searchQuery;
      if (els.searchClear) els.searchClear.classList.add('visible');
    }

    bindEvents();
    refreshAosElements();
    loadDatabaseItems('first10');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

