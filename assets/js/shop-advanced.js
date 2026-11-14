/**
 * Sesco Tyres — Advanced Shop Controller & Bidirectional Animate-on-Scroll (AOS) Engine
 * Connects to `backend/get_items.php` (PHP 8.5.12) to fetch 10 sampled items from `treads.item`
 */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State
  const state = {
    dbConnected: false,
    dbNotice: '',
    allSampledItems: [],
    filteredItems: [],
    allDbBrands: [],
    allDbTypes: [],
    allDbRims: [],
    totalMatchingDb: 0,
    hasMoreDb: false,
    afterId: 0,
    nextCursor: null,
    filtersSignature: '',
    isLoadingMore: false,
    activeFetchSeq: 0,
    serverFetchTimer: null,
    otherBrandsHoverTimer: null,
    otherBrandsPinned: false,
    sampleMode: 'first10',
    category: 'all',
    selectedBrandIds: new Set(),
    selectedTypeIds: new Set(),
    brandFilterSearch: '',
    typeFilterSearch: '',
    selectedRim: '',
    dimensionQuery: '',
    maxPrice: 1000000,
    userAdjustedPrice: false,
    searchQuery: '',
    sortBy: 'id-asc',
    viewMode: 'grid'
  };

  // DOM Elements
  const els = {
    grid: document.getElementById('shop-products'),
    countText: document.getElementById('product-count'),
    sortSelect: document.getElementById('sort-products'),
    typeList: document.getElementById('typeFilterList'),
    typeFilterTotalBadge: document.getElementById('typeFilterTotalBadge'),
    typeFilterSearch: document.getElementById('typeFilterSearch'),
    typeFilterActiveSummary: document.getElementById('typeFilterActiveSummary'),
    clearTypeFiltersBtn: document.getElementById('clearTypeFiltersBtn'),
    mainHeader: document.querySelector('.main-header'),
    brandBanner: document.getElementById('shopBrandBanner'),
    brandBannerCountMeta: document.getElementById('brandBannerCountMeta'),
    brandFilterSearch: document.getElementById('brandFilterSearch'),
    clearBrandSearchBtn: document.getElementById('clearBrandSearchBtn'),
    dimensionSearchInput: document.getElementById('dimensionSearchInput'),
    clearDimensionSearchBtn: document.getElementById('clearDimensionSearchBtn'),
    brandFilterActiveSummary: document.getElementById('brandFilterActiveSummary'),
    topBrandList: document.getElementById('topBrandList'),
    otherBrandsHoverZone: document.getElementById('otherBrandsHoverZone'),
    otherBrandsTriggerBtn: document.getElementById('otherBrandsTriggerBtn'),
    otherBrandsCountBadge: document.getElementById('otherBrandsCountBadge'),
    otherBrandsPopover: document.getElementById('otherBrandsPopover'),
    otherBrandsPopoverTitle: document.getElementById('otherBrandsPopoverTitle'),
    otherBrandsGrid: document.getElementById('otherBrandsGrid'),
    rimChips: document.getElementById('rimChipsGrid'),
    rimFilterTotalBadge: document.getElementById('rimFilterTotalBadge'),
    clearRimFilterBtn: document.getElementById('clearRimFilterBtn'),
    priceSlider: document.getElementById('shopPriceSlider'),
    priceReadout: document.getElementById('shopPriceReadout'),
    resetFiltersBtn: document.getElementById('resetAllFiltersBtn'),
    paginationFooter: document.getElementById('shopPaginationFooter'),
    scrollProgressBar: document.getElementById('shopScrollProgressBar'),
    modalBackdrop: document.getElementById('shopInspectModal'),
    modalCloseBtn: document.getElementById('shopModalCloseBtn'),
    modalBody: document.getElementById('shopModalBody'),
    floatingCartDock: document.getElementById('shopFloatingCartDock'),
    floatingCartTitle: document.getElementById('floatingCartTitle'),
    floatingCartSub: document.getElementById('floatingCartSub')
  };

  function syncStickyOffsets() {
    const headerH = els.mainHeader ? Math.round(els.mainHeader.getBoundingClientRect().height) : 72;
    const bannerH = els.brandBanner ? Math.round(els.brandBanner.getBoundingClientRect().height) : 112;
    document.documentElement.style.setProperty('--shop-header-h', `${headerH}px`);
    document.documentElement.style.setProperty('--shop-banner-h', `${bannerH}px`);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeDimension(value) {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/\b(\d{2,3})\s+(\d{2})(?=\s*(?:Z?R|\/|\s|$))/g, '$1/$2')
      .replace(/\s+/g, '')
      .replace(/ZR/g, 'R')
      .replace(/R\./g, 'R');
  }

  function hasActiveServerFilters() {
    return (
      state.selectedBrandIds.size > 0 ||
      state.selectedTypeIds.size > 0 ||
      state.selectedRim !== '' ||
      state.dimensionQuery.trim() !== '' ||
      state.searchQuery.trim() !== ''
    );
  }

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
  // 1. FETCH ITEMS & FILTER TABLES FROM `backend/get_items.php` (PHP 8.5.12)
  // --------------------------------------------------------------------------
  function scheduleServerFetch(delayMs = 140) {
    if (state.serverFetchTimer) {
      clearTimeout(state.serverFetchTimer);
    }
    state.serverFetchTimer = setTimeout(() => {
      state.serverFetchTimer = null;
      loadDatabaseItems({ mode: state.sampleMode, append: false, includeFilters: false });
    }, delayMs);
  }

  async function loadDatabaseItems(modeOrOptions = state.sampleMode) {
    const opts = typeof modeOrOptions === 'string'
      ? { mode: modeOrOptions }
      : (modeOrOptions || {});

    const mode = opts.mode || state.sampleMode || 'first10';
    const append = Boolean(opts.append);
    if (append && (!state.nextCursor || state.isLoadingMore)) {
      return;
    }

    const serverFiltered = hasActiveServerFilters();
    const limit = serverFiltered ? 60 : (append ? 30 : 10);
    const afterId = append ? Number(state.nextCursor) : 0;
    const includeFilters = opts.includeFilters !== undefined
      ? Boolean(opts.includeFilters)
      : (!append && (state.allDbBrands.length === 0 || state.allDbTypes.length === 0 || state.allDbRims.length === 0));

    state.sampleMode = mode;
    const fetchSeq = ++state.activeFetchSeq;

    // Highlight active sample mode button
    document.querySelectorAll('[data-sample-mode]').forEach(btn => {
      btn.classList.toggle('active', !serverFiltered && btn.dataset.sampleMode === mode);
    });

    if (append) {
      state.isLoadingMore = true;
      renderPaginationFooter();
    } else if (els.grid) {
      els.grid.innerHTML = Array.from({ length: 6 }, () => `<div class="shop-skeleton-card"></div>`).join('');
    }

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('after_id', String(afterId));
      params.set('mode', mode);
      params.set('include_filters', includeFilters ? '1' : '0');
      if (state.selectedBrandIds.size > 0) {
        params.set('brand_ids', Array.from(state.selectedBrandIds).join(','));
      }
      if (state.selectedTypeIds.size > 0) {
        params.set('type_ids', Array.from(state.selectedTypeIds).join(','));
      }
      if (state.selectedRim !== '') {
        params.set('rim', state.selectedRim);
      }
      if (state.dimensionQuery.trim() !== '') {
        params.set('dimension', state.dimensionQuery.trim());
      }
      if (state.searchQuery.trim() !== '') {
        params.set('search', state.searchQuery.trim());
      }
      params.set('_t', String(Date.now()));

      const qs = `?${params.toString()}`;
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
            if (parsed && typeof parsed === 'object' && ('connected' in parsed || Array.isArray(parsed.items))) {
              payload = parsed;
              break;
            }
          }
        } catch (innerErr) {}
      }

      if (fetchSeq !== state.activeFetchSeq) {
        return;
      }

      state.isLoadingMore = false;

      if (payload && payload.connected === true && Array.isArray(payload.items)) {
        state.dbConnected = true;
        state.dbNotice = '';

        if (append) {
          const existingIds = new Set(state.allSampledItems.map(i => Number(i.item_id)));
          const merged = [...state.allSampledItems];
          payload.items.forEach(item => {
            if (!existingIds.has(Number(item.item_id))) {
              merged.push(item);
            }
          });
          state.allSampledItems = merged;
        } else {
          state.allSampledItems = payload.items;
        }

        state.totalMatchingDb = Number(payload.total_matching ?? state.allSampledItems.length);
        state.afterId = Number(payload.after_id ?? afterId);
        state.nextCursor = (payload.next_cursor !== null && payload.next_cursor !== undefined)
          ? Number(payload.next_cursor)
          : null;
        state.hasMoreDb = Boolean(payload.has_more) && state.nextCursor !== null;

        if (payload.filters && Array.isArray(payload.filters.brands) && Array.isArray(payload.filters.types)) {
          state.allDbBrands = payload.filters.brands;
          state.allDbTypes = payload.filters.types;
          if (Array.isArray(payload.filters.rims)) {
            state.allDbRims = payload.filters.rims;
          }
        }

        updateDatabaseTelemetry(payload);
      } else {
        state.dbConnected = false;
        state.dbNotice = (payload && (payload.message || payload.error)) || 'Could not reach the treads database.';
        state.allSampledItems = [];
        state.allDbBrands = [];
        state.allDbTypes = [];
        state.allDbRims = [];
        state.totalMatchingDb = 0;
        state.afterId = 0;
        state.nextCursor = null;
        state.hasMoreDb = false;
        state.filtersSignature = '';
        state.selectedBrandIds.clear();
        state.selectedTypeIds.clear();
        state.selectedRim = '';
        updateDatabaseTelemetry(payload || {
          connected: false,
          source: 'database-disconnected',
          db_name: 'treads',
          table: 'item',
          php_version: '',
          count: 0,
          total_matching: 0,
          stats: { total_items: 0, total_brands: 0, total_types: 0, priced_items: 0 },
          filters: { brands: [], types: [], rims: [] },
          items: []
        });
      }
    } catch (err) {
      if (fetchSeq !== state.activeFetchSeq) {
        return;
      }
      state.isLoadingMore = false;
      state.dbConnected = false;
      state.dbNotice = 'Unable to connect to the shop database backend.';
      state.allSampledItems = [];
      state.allDbBrands = [];
      state.allDbTypes = [];
      state.allDbRims = [];
      state.totalMatchingDb = 0;
      state.afterId = 0;
      state.nextCursor = null;
      state.hasMoreDb = false;
      state.filtersSignature = '';
      state.selectedBrandIds.clear();
      state.selectedTypeIds.clear();
      state.selectedRim = '';
      updateDatabaseTelemetry({
        connected: false,
        source: 'database-disconnected',
        db_name: 'treads',
        table: 'item',
        php_version: '',
        count: 0,
        total_matching: 0,
        stats: { total_items: 0, total_brands: 0, total_types: 0, priced_items: 0 },
        filters: { brands: [], types: [], rims: [] },
        items: []
      });
    }

    // Register with main.js so Cart, Wishlist, and Product Detail stay in sync with DB connectivity
    if (typeof window.registerDbProducts === 'function') {
      window.registerDbProducts(state.allSampledItems, state.dbConnected);
    }

    // Configure dynamic sidebar controls from full DB tables & loaded items (or zeroed disconnected state)
    buildDynamicSidebarFilters(state.allSampledItems);
    updateCategoryCounts(state.allSampledItems);
    applyFiltersAndRender();
  }

  function updateDatabaseTelemetry(payload) {
    const isConnected = Boolean(payload && payload.connected === true);
    const totalItems = Number(payload?.stats?.total_items ?? 0);
    const sampledCount = state.allSampledItems.length;
    const totalBrands = state.allDbBrands.length > 0
      ? state.allDbBrands.length
      : Number(payload?.stats?.total_brands ?? 0);
    const totalTypes = state.allDbTypes.length > 0
      ? state.allDbTypes.length
      : Number(payload?.stats?.total_types ?? 0);
    const totalRims = state.allDbRims.length;
    const serverFiltered = hasActiveServerFilters();

    if (els.brandBanner) {
      els.brandBanner.classList.toggle('is-disconnected', !isConnected);
    }
    if (els.brandBannerCountMeta) {
      if (!isConnected) {
        els.brandBannerCountMeta.textContent = 'Database Disconnected · 0 brands';
      } else if (serverFiltered) {
        els.brandBannerCountMeta.textContent = `${state.totalMatchingDb} matching of ${totalItems.toLocaleString()} items (${totalBrands} brands)`;
      } else {
        els.brandBannerCountMeta.textContent = `${totalBrands} brands · ${totalItems.toLocaleString()} items`;
      }
    }
    if (els.typeFilterTotalBadge) {
      els.typeFilterTotalBadge.textContent = isConnected ? String(totalTypes) : '0';
    }
    if (els.rimFilterTotalBadge) {
      els.rimFilterTotalBadge.textContent = isConnected ? String(totalRims) : '0';
    }
    syncStickyOffsets();
  }

  // --------------------------------------------------------------------------
  // 2. DYNAMIC FILTERS (TOP 10 BRANDS + OTHER BRANDS, TYPES, RIMS, PRICE SLIDER)
  // --------------------------------------------------------------------------
  function setOtherBrandsOpen(open) {
    if (!els.otherBrandsHoverZone) return;
    els.otherBrandsHoverZone.classList.toggle('is-open', Boolean(open));
    if (els.otherBrandsTriggerBtn) {
      const expanded = Boolean(open) || els.otherBrandsHoverZone.classList.contains('is-search-open');
      els.otherBrandsTriggerBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  }

  function renderTypeAndBrandFilters() {
    const types = Array.isArray(state.allDbTypes) ? state.allDbTypes : [];
    const brands = Array.isArray(state.allDbBrands) ? state.allDbBrands : [];
    const sig = state.dbConnected
      ? `${types.length}-${brands.length}-${types[0]?.id || 0}-${brands[0]?.id || 0}`
      : 'offline';

    if (state.filtersSignature === sig) {
      syncFilterListStates();
      return;
    }

    state.filtersSignature = sig;

    if (els.typeList) {
      if (types.length === 0) {
        els.typeList.innerHTML = `<div class="filter-empty-note" style="font-size:12.5px;color:#64748b;padding:4px 0;">Connect database to load product types.</div>`;
      } else {
        els.typeList.innerHTML = types.map(typeRow => {
          const id = Number(typeRow.id);
          const count = Number(typeRow.item_count || 0);
          const isChecked = state.selectedTypeIds.has(id);
          const name = String(typeRow.name || '');
          return `
            <label class="brand-check-label ${isChecked ? 'is-checked' : ''}" data-filter-name="${escapeHtml(name.toLowerCase())}">
              <span class="brand-check-left">
                <input type="checkbox" data-type-check value="${id}" ${isChecked ? 'checked' : ''}>
                <span title="${escapeHtml(name)}">${escapeHtml(name)}</span>
              </span>
              <span class="brand-count-badge ${count === 0 ? 'is-zero' : ''}">${count}</span>
            </label>
          `;
        }).join('') + `<div class="filter-empty-search" id="typeFilterEmptySearch" style="display:none;font-size:12px;color:#64748b;padding:6px 4px;">No product types match your search.</div>`;
      }
    }

    const topTenBrands = brands.slice(0, 10);
    const remainingBrands = brands.slice(10).sort((a, b) =>
      String(a.label || a.name || '').localeCompare(String(b.label || b.name || ''))
    );

    if (els.topBrandList) {
      if (topTenBrands.length === 0) {
        els.topBrandList.innerHTML = `<span class="brand-banner-empty">Connect database to load brands.</span>`;
      } else {
        els.topBrandList.innerHTML = topTenBrands.map(brandRow => {
          const id = Number(brandRow.id);
          const count = Number(brandRow.item_count || 0);
          const isChecked = state.selectedBrandIds.has(id);
          const label = String(brandRow.label || brandRow.name || '');
          return `
            <button
              type="button"
              class="brand-banner-pill ${isChecked ? 'is-active' : ''}"
              data-brand-filter="${id}"
              data-filter-name="${escapeHtml(label.toLowerCase())}"
              aria-pressed="${isChecked ? 'true' : 'false'}"
              title="${escapeHtml(label)} (${count} items)"
            >
              <span>${escapeHtml(label)}</span>
              <span class="brand-pill-count ${count === 0 ? 'is-zero' : ''}">${count}</span>
            </button>
          `;
        }).join('');
      }
    }

    if (els.otherBrandsGrid) {
      if (remainingBrands.length === 0) {
        els.otherBrandsGrid.innerHTML = `<div class="other-brands-empty-msg">No additional brands available.</div>`;
      } else {
        els.otherBrandsGrid.innerHTML = remainingBrands.map(brandRow => {
          const id = Number(brandRow.id);
          const count = Number(brandRow.item_count || 0);
          const isChecked = state.selectedBrandIds.has(id);
          const label = String(brandRow.label || brandRow.name || '');
          return `
            <button
              type="button"
              class="brand-banner-pill other-brand-item ${isChecked ? 'is-active' : ''}"
              data-brand-filter="${id}"
              data-filter-name="${escapeHtml(label.toLowerCase())}"
              aria-pressed="${isChecked ? 'true' : 'false'}"
              title="${escapeHtml(label)} (${count} items)"
            >
              <span class="other-brand-name">${escapeHtml(label)}</span>
              <span class="brand-pill-count ${count === 0 ? 'is-zero' : ''}">${count}</span>
            </button>
          `;
        }).join('') + `<div class="other-brands-empty-msg" id="otherBrandsEmptySearch" style="display:none;">No remaining brands match your search.</div>`;
      }
    }

    if (els.otherBrandsTriggerBtn) {
      els.otherBrandsTriggerBtn.disabled = remainingBrands.length === 0;
    }

    syncFilterListStates();
  }

  function syncFilterListStates() {
    const typeQ = state.typeFilterSearch.trim().toLowerCase();
    let visibleTypes = 0;

    if (els.typeList) {
      els.typeList.querySelectorAll('.brand-check-label').forEach(label => {
        const cb = label.querySelector('[data-type-check]');
        if (!cb) return;
        const checked = state.selectedTypeIds.has(Number(cb.value));
        cb.checked = checked;
        label.classList.toggle('is-checked', checked);
        const matches = typeQ === '' || (label.dataset.filterName || '').includes(typeQ);
        label.style.display = matches ? '' : 'none';
        if (matches) visibleTypes++;
      });
      const emptyTypeSearch = document.getElementById('typeFilterEmptySearch');
      if (emptyTypeSearch) {
        emptyTypeSearch.style.display = (state.allDbTypes.length > 0 && visibleTypes === 0) ? 'block' : 'none';
      }
    }

    if (els.typeFilterActiveSummary) {
      if (state.selectedTypeIds.size > 0) {
        els.typeFilterActiveSummary.style.display = 'flex';
        els.typeFilterActiveSummary.innerHTML = `
          <span>${state.selectedTypeIds.size} product type${state.selectedTypeIds.size > 1 ? 's' : ''} selected</span>
          <button type="button" class="reset-filters-link" data-clear-types>Clear</button>
        `;
      } else {
        els.typeFilterActiveSummary.style.display = 'none';
        els.typeFilterActiveSummary.innerHTML = '';
      }
    }

    const brandQ = state.brandFilterSearch.trim().toLowerCase();
    let visibleTopBrands = 0;
    let visibleOtherBrands = 0;
    let remainingActiveCount = 0;
    const totalRemainingBrands = Math.max(0, state.allDbBrands.length - 10);

    if (els.clearBrandSearchBtn) {
      els.clearBrandSearchBtn.classList.toggle('is-visible', state.brandFilterSearch.length > 0);
    }
    if (els.clearDimensionSearchBtn) {
      els.clearDimensionSearchBtn.classList.toggle('is-visible', state.dimensionQuery.length > 0);
    }

    if (els.topBrandList) {
      els.topBrandList.querySelectorAll('[data-brand-filter]').forEach(btn => {
        const brandId = Number(btn.dataset.brandFilter);
        const checked = state.selectedBrandIds.has(brandId);
        btn.classList.toggle('is-active', checked);
        btn.setAttribute('aria-pressed', checked ? 'true' : 'false');
        const matches = brandQ === '' || (btn.dataset.filterName || '').includes(brandQ);
        btn.style.display = matches ? '' : 'none';
        if (matches) visibleTopBrands++;
      });
    }

    if (els.otherBrandsGrid) {
      els.otherBrandsGrid.querySelectorAll('[data-brand-filter]').forEach(btn => {
        const brandId = Number(btn.dataset.brandFilter);
        const checked = state.selectedBrandIds.has(brandId);
        if (checked) remainingActiveCount++;
        btn.classList.toggle('is-active', checked);
        btn.setAttribute('aria-pressed', checked ? 'true' : 'false');
        const matches = brandQ === '' || (btn.dataset.filterName || '').includes(brandQ);
        btn.style.display = matches ? '' : 'none';
        if (matches) visibleOtherBrands++;
      });

      const emptyOther = document.getElementById('otherBrandsEmptySearch');
      if (emptyOther) {
        emptyOther.style.display = (totalRemainingBrands > 0 && visibleOtherBrands === 0) ? 'block' : 'none';
      }
    }

    if (els.otherBrandsCountBadge) {
      els.otherBrandsCountBadge.textContent = brandQ !== ''
        ? `${visibleOtherBrands}/${totalRemainingBrands}`
        : String(totalRemainingBrands);
    }
    if (els.otherBrandsPopoverTitle) {
      els.otherBrandsPopoverTitle.textContent = brandQ !== ''
        ? `MATCHING OTHER BRANDS (${visibleOtherBrands} OF ${totalRemainingBrands})`
        : `OTHER BRANDS (${totalRemainingBrands} REMAINING)`;
    }
    if (els.otherBrandsTriggerBtn) {
      els.otherBrandsTriggerBtn.classList.toggle('has-active-selection', remainingActiveCount > 0);
    }
    if (els.otherBrandsHoverZone) {
      const searchOpen = state.dbConnected && brandQ !== '' && (visibleOtherBrands > 0 || visibleTopBrands === 0);
      els.otherBrandsHoverZone.classList.toggle('is-search-open', searchOpen);
      if (els.otherBrandsTriggerBtn) {
        const expanded = searchOpen || els.otherBrandsHoverZone.classList.contains('is-open');
        els.otherBrandsTriggerBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      }
    }

    if (els.brandFilterActiveSummary) {
      const summaryParts = [];
      if (state.selectedBrandIds.size > 0) {
        const selectedNames = Array.from(state.selectedBrandIds)
          .map(id => {
            const found = state.allDbBrands.find(b => Number(b.id) === id);
            return found ? String(found.label || found.name || '') : '';
          })
          .filter(Boolean)
          .slice(0, 4);
        const suffix = state.selectedBrandIds.size > 4 ? ` +${state.selectedBrandIds.size - 4} more` : '';
        summaryParts.push(`${state.selectedBrandIds.size} brand${state.selectedBrandIds.size > 1 ? 's' : ''} selected (${selectedNames.join(', ')}${suffix})`);
      }
      if (state.dimensionQuery.trim() !== '') {
        summaryParts.push(`Dimension: ${state.dimensionQuery.trim().toUpperCase()}`);
      }

      const clearBtns = [];
      if (state.selectedBrandIds.size > 0) {
        clearBtns.push(`<button type="button" class="reset-filters-link" data-clear-brands>Clear brands</button>`);
      }
      if (state.dimensionQuery.trim() !== '') {
        clearBtns.push(`<button type="button" class="reset-filters-link" data-clear-dimension>Clear dimension</button>`);
      }

      if (summaryParts.length > 0) {
        els.brandFilterActiveSummary.style.display = 'flex';
        els.brandFilterActiveSummary.innerHTML = `
          <span>${escapeHtml(summaryParts.join(' · '))}</span>
          <span style="display:inline-flex;gap:12px;align-items:center;">${clearBtns.join('')}</span>
        `;
      } else {
        els.brandFilterActiveSummary.style.display = 'none';
        els.brandFilterActiveSummary.innerHTML = '';
      }
    }
  }

  function buildDynamicSidebarFilters(items) {
    if (!state.dbConnected) {
      state.filtersSignature = 'offline';
      state.otherBrandsPinned = false;
      setOtherBrandsOpen(false);
      if (els.typeList) {
        els.typeList.innerHTML = `<div class="filter-empty-note" style="font-size:12.5px;color:#64748b;padding:4px 0;">Connect database to load product types.</div>`;
      }
      if (els.topBrandList) {
        els.topBrandList.innerHTML = `<span class="brand-banner-empty">Connect database to load brands.</span>`;
      }
      if (els.otherBrandsGrid) {
        els.otherBrandsGrid.innerHTML = `<div class="other-brands-empty-msg">Connect database to load remaining brands.</div>`;
      }
      if (els.otherBrandsCountBadge) els.otherBrandsCountBadge.textContent = '0';
      if (els.otherBrandsTriggerBtn) {
        els.otherBrandsTriggerBtn.disabled = true;
        els.otherBrandsTriggerBtn.classList.remove('has-active-selection');
      }
      if (els.otherBrandsHoverZone) {
        els.otherBrandsHoverZone.classList.remove('is-search-open', 'is-open');
      }
      if (els.typeFilterSearch) {
        els.typeFilterSearch.value = '';
        els.typeFilterSearch.disabled = true;
      }
      if (els.brandFilterSearch) {
        els.brandFilterSearch.value = '';
        els.brandFilterSearch.disabled = true;
      }
      if (els.dimensionSearchInput) {
        els.dimensionSearchInput.value = '';
        els.dimensionSearchInput.disabled = true;
      }
      if (els.clearBrandSearchBtn) els.clearBrandSearchBtn.classList.remove('is-visible');
      if (els.clearDimensionSearchBtn) els.clearDimensionSearchBtn.classList.remove('is-visible');
      if (els.typeFilterActiveSummary) els.typeFilterActiveSummary.style.display = 'none';
      if (els.brandFilterActiveSummary) els.brandFilterActiveSummary.style.display = 'none';
      if (els.rimChips) {
        els.rimChips.innerHTML = `<button type="button" class="rim-chip-btn active" data-rim-chip="" disabled style="opacity:0.6;cursor:not-allowed;">All Rims</button>`;
      }
      if (els.priceSlider) {
        els.priceSlider.min = '0';
        els.priceSlider.max = '0';
        els.priceSlider.value = '0';
        els.priceSlider.disabled = true;
      }
      if (els.priceReadout) {
        els.priceReadout.textContent = formatUGX(0);
      }
      return;
    }

    if (els.typeFilterSearch) els.typeFilterSearch.disabled = false;
    if (els.brandFilterSearch) els.brandFilterSearch.disabled = false;
    if (els.dimensionSearchInput) els.dimensionSearchInput.disabled = false;

    renderTypeAndBrandFilters();

    const list = Array.isArray(items) ? items : [];
    let highestPrice = 0;

    list.forEach(item => {
      if (Number(item.price) > highestPrice) highestPrice = Number(item.price);
    });

    // Render ALL Rim Size Chips from full DB `treads.item` summary (fallback to loaded items)
    if (els.rimChips) {
      let rimEntries = Array.isArray(state.allDbRims) && state.allDbRims.length > 0
        ? state.allDbRims.map(r => ({
            rim: String(r.rim || r.label || ''),
            count: Number(r.item_count || 0)
          }))
        : [];

      if (rimEntries.length === 0 && list.length > 0) {
        const rimMap = new Map();
        list.forEach(item => {
          const r = item.rim || '';
          if (r) rimMap.set(r, (rimMap.get(r) || 0) + 1);
        });
        rimEntries = Array.from(rimMap.entries())
          .sort((a, b) => parseFloat(a[0].slice(1)) - parseFloat(b[0].slice(1)))
          .map(([rim, count]) => ({ rim, count }));
      }

      els.rimChips.innerHTML = `
        <button type="button" class="rim-chip-btn ${state.selectedRim === '' ? 'active' : ''}" data-rim-chip="">All Rims</button>
        ${rimEntries.map(entry => `
          <button type="button" class="rim-chip-btn ${state.selectedRim === entry.rim ? 'active' : ''}" data-rim-chip="${escapeHtml(entry.rim)}">${escapeHtml(entry.rim)}<span class="rim-chip-count">${entry.count}</span></button>
        `).join('')}
      `;
    }

    // Price Range Slider max (adapts to spare parts & heavy commercial tyres)
    if (els.priceSlider) {
      els.priceSlider.disabled = false;
      els.priceSlider.min = '0';
      const ceilPrice = Math.max(100000, Math.ceil((highestPrice || 500000) / 50000) * 50000);
      const stepVal = ceilPrice > 5000000 ? Math.max(10000, Math.round(ceilPrice / 100)) : 10000;
      els.priceSlider.step = String(stepVal);
      els.priceSlider.max = String(ceilPrice);

      if (!state.userAdjustedPrice || state.maxPrice > ceilPrice || state.maxPrice <= 0) {
        state.maxPrice = ceilPrice;
      }
      els.priceSlider.value = String(state.maxPrice);
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
    if (!state.dbConnected) {
      state.filteredItems = [];
      if (els.countText) {
        els.countText.innerHTML = `Database not connected &mdash; <strong>0</strong> tyres loaded from <code>treads.item</code>.`;
      }
      renderCardsGrid([]);
      renderPaginationFooter();
      return;
    }

    const q = state.searchQuery.trim().toLowerCase();
    const dimToken = normalizeDimension(state.dimensionQuery);

    let list = state.allSampledItems.filter(item => {
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (state.selectedBrandIds.size > 0 && !state.selectedBrandIds.has(Number(item.item_brand_id))) return false;
      if (state.selectedTypeIds.size > 0 && !state.selectedTypeIds.has(Number(item.item_type_id))) return false;
      if (state.selectedRim !== '') {
        if (item.rim) {
          if (item.rim !== state.selectedRim) return false;
        } else if (!(item.size || '').toUpperCase().includes(state.selectedRim.toUpperCase())) {
          return false;
        }
      }
      if (Number(item.price) > state.maxPrice) return false;
      if (dimToken !== '') {
        const normalizedDesc = normalizeDimension(`${item.size || ''} ${item.description || ''}`);
        if (!normalizedDesc.includes(dimToken)) return false;
      }
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
      if (hasActiveServerFilters()) {
        els.countText.innerHTML = `Showing <strong>${list.length}</strong> loaded (<strong>${state.totalMatchingDb}</strong> matching in <code>treads.item</code>)`;
      } else {
        els.countText.innerHTML = `Showing <strong>${list.length}</strong> of <strong>${state.allSampledItems.length}</strong> loaded items from <code>treads.item</code>`;
      }
    }

    renderCardsGrid(list);
    renderPaginationFooter();
  }

  function renderPaginationFooter() {
    if (!els.paginationFooter) return;
    if (!state.dbConnected || !state.hasMoreDb || !state.nextCursor || (!hasActiveServerFilters() && state.sampleMode !== 'first10')) {
      els.paginationFooter.innerHTML = '';
      return;
    }

    const label = state.isLoadingMore
      ? 'Loading more from treads.item…'
      : `Load More (${state.allSampledItems.length} of ${state.totalMatchingDb} matching)`;

    els.paginationFooter.innerHTML = `
      <button type="button" class="btn btn-outline shop-load-more-btn" id="loadMoreDbItemsBtn" title="Key-set cursor: load records where item_id > ${state.nextCursor}" ${state.isLoadingMore ? 'disabled' : ''}>
        <i class="fa-solid ${state.isLoadingMore ? 'fa-spinner fa-spin' : 'fa-angles-down'}" aria-hidden="true"></i>
        <span>${label}</span>
      </button>
    `;
  }

  function renderCardsGrid(items) {
    if (!els.grid) return;

    if (!state.dbConnected) {
      els.grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; background: #fff; border-radius: 18px; padding: 52px 24px; text-align: center; border: 1px solid #fecaca;">
          <div style="font-size: 42px; margin-bottom: 12px; color: #dc2626;"><i class="fa-solid fa-database" aria-hidden="true"></i></div>
          <h3 style="margin: 0 0 8px; font-family: 'Poppins', sans-serif; color: #0b1c32;">Database Not Connected</h3>
          <p style="margin: 0 0 18px; color: #64748b; font-size: 14px; max-width: 520px; margin-inline: auto;">No tyres are displayed because all products in the shop are fetched directly from the live <code>treads</code> database. Please ensure MySQL and PHP are running, then retry.</p>
          <button type="button" class="btn btn-primary" id="emptyRetryDbBtn">Retry Database Connection</button>
        </div>
      `;
      const emptyRetry = document.getElementById('emptyRetryDbBtn');
      if (emptyRetry) emptyRetry.addEventListener('click', () => loadDatabaseItems({ mode: state.sampleMode, includeFilters: true }));
      return;
    }

    if (items.length === 0) {
      const noDbItems = state.allSampledItems.length === 0 && !hasActiveServerFilters();
      els.grid.innerHTML = noDbItems ? `
        <div class="empty-state" style="grid-column: 1 / -1; background: #fff; border-radius: 18px; padding: 48px 24px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 40px; margin-bottom: 12px; color: #0284c7;"><i class="fa-solid fa-box-open" aria-hidden="true"></i></div>
          <h3 style="margin: 0 0 8px; font-family: 'Poppins', sans-serif; color: #0b1c32;">No products available in database</h3>
          <p style="margin: 0 0 18px; color: #64748b; font-size: 14px;">The <code>treads.item</code> table returned 0 products.</p>
          <button type="button" class="btn btn-primary" id="emptyRetryDbBtn">Refresh from Database</button>
        </div>
      ` : `
        <div class="empty-state" style="grid-column: 1 / -1; background: #fff; border-radius: 18px; padding: 48px 24px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 40px; margin-bottom: 12px; color: #0284c7;"><i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true"></i></div>
          <h3 style="margin: 0 0 8px; font-family: 'Poppins', sans-serif; color: #0b1c32;">No matching products found</h3>
          <p style="margin: 0 0 18px; color: #64748b; font-size: 14px;">No items in <code>treads.item</code> match your current brand, product type, price, or search filters.</p>
          <button type="button" class="btn btn-primary" id="emptyResetBtn">Reset All Filters</button>
        </div>
      `;
      const emptyReset = document.getElementById('emptyResetBtn');
      if (emptyReset) emptyReset.addEventListener('click', resetAllFilters);
      const emptyRetry = document.getElementById('emptyRetryDbBtn');
      if (emptyRetry) emptyRetry.addEventListener('click', () => loadDatabaseItems({ mode: state.sampleMode, includeFilters: true }));
      return;
    }

    const wishlist = getWishlist();
    const cartQtyMap = getCartQtyMap();

    els.grid.innerHTML = items.map((item, idx) => {
      const isSaved = wishlist.includes(item.id);
      const inCartQty = cartQtyMap.get(item.id) || 0;
      const isSelected = inCartQty > 0;
      const staggerIndex = idx % 6;
      const isTyre = Number(item.item_type_id) === 1;
      const topBadgeLabel = isTyre ? (item.category_label || item.tag) : (item.item_type || item.category_label);
      const firstSpecLabel = isTyre ? 'Tyre Size' : 'Product Type';
      const firstSpecVal = isTyre ? item.size : item.item_type;
      const secondSpecLabel = isTyre ? 'Load / Speed' : 'Specification';
      const secondSpecVal = isTyre ? item.load_speed : item.size;

      return `
        <article class="shop-item-card ${isSelected ? 'is-selected-in-cart' : ''}" data-shop-aos="card-3d" style="--aos-stagger: ${staggerIndex}" data-item-id="${item.item_id}" data-product-id="${escapeHtml(item.id)}" title="Click to select and add to cart">
          <div class="item-visual-stage">
            <div class="item-stage-ring" aria-hidden="true"></div>
            <div class="item-top-badges">
              <span class="item-cat-badge">${escapeHtml(topBadgeLabel)}</span>
              <span class="item-db-id-badge" title="Database Primary Key in treads.item">ID #${item.item_id}</span>
              ${isSelected ? `<span class="item-selected-pill"><i class="fa-solid fa-check" aria-hidden="true"></i> In Cart (${inCartQty})</span>` : ''}
            </div>
            <button type="button" class="item-wish-btn wishlist-btn ${isSaved ? 'is-saved' : ''}" data-wish="${escapeHtml(item.id)}" aria-label="Save ${escapeHtml(item.name)} to wishlist" title="Save to Wishlist">
              <i class="fa-${isSaved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>
            </button>
            <img class="item-tyre-img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.description)}" loading="lazy">
            <button type="button" class="item-quick-inspect-btn" data-inspect-id="${item.item_id}">
              <i class="fa-solid fa-database" aria-hidden="true"></i>
              <span>Inspect DB Record</span>
            </button>
          </div>

          <div class="item-card-body">
            <div class="item-brand-row">
              <span class="item-brand-name">${escapeHtml(item.brand)}</span>
              <span class="item-type-pill"><i class="fa-solid fa-tag" aria-hidden="true"></i> ${escapeHtml(item.item_type)}</span>
            </div>

            <h3 class="item-card-title">
              <a href="product.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.description)}</a>
            </h3>

            <div class="item-specs-grid">
              <div class="item-spec-box">
                <span class="item-spec-label">${firstSpecLabel}</span>
                <span class="item-spec-val">${escapeHtml(firstSpecVal)}</span>
              </div>
              <div class="item-spec-box">
                <span class="item-spec-label">${secondSpecLabel}</span>
                <span class="item-spec-val">${escapeHtml(secondSpecVal)}</span>
              </div>
              <div class="item-spec-box">
                <span class="item-spec-label">Pattern / Unit</span>
                <span class="item-spec-val">${escapeHtml(item.pattern !== 'Standard Tread' ? item.pattern : item.unit)}</span>
              </div>
              <div class="item-spec-box">
                <span class="item-spec-label">Restock Pt</span>
                <span class="item-spec-val" style="color:#059669">${item.restock_point} ${escapeHtml(item.unit)}</span>
              </div>
            </div>

            <div class="item-card-footer">
              <div class="item-price-wrap">
                <span class="item-price-amount">${formatUGX(item.price)}</span>
                <span class="item-price-unit">per ${escapeHtml(item.unit)} · ${item.price_source === 'price_list' ? 'DB Price List' : 'Standard Rate'}</span>
              </div>
              <div class="item-card-actions" data-card-actions="${escapeHtml(item.id)}">
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

    const isTyre = Number(item.item_type_id) === 1;
    const modalBadge = isTyre ? item.category_label : item.item_type;
    const waText = encodeURIComponent(
      `Hello Sesco Tyres, I am enquiring about Database Item #${item.item_id} (${item.description}) priced at ${formatUGX(item.price)}.`
    );

    els.modalBody.innerHTML = `
      <div class="shop-modal-grid">
        <div class="shop-modal-visual">
          <span class="item-cat-badge" style="margin-bottom: 12px;">${escapeHtml(modalBadge)}</span>
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.description)}">
          <div style="font-family: ui-monospace, monospace; font-size: 12px; color: #93c5fd;">
            treads.item · item_id = ${item.item_id}
          </div>
        </div>
        <div class="shop-modal-content">
          <div style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 1px;">
            ${escapeHtml(item.brand)} · ${escapeHtml(item.item_type)}
          </div>
          <h2 style="margin: 4px 0 8px; font-family: 'Poppins', sans-serif; font-size: 22px; color: #0b1c32;">
            ${escapeHtml(item.description)}
          </h2>
          <div style="font-size: 22px; font-weight: 800; color: #163687; margin-bottom: 12px;">
            ${formatUGX(item.price)} <small style="font-size: 12px; color: #64748b; font-weight: 600;">/ ${escapeHtml(item.unit)}</small>
          </div>

          <table class="modal-db-table">
            <tbody>
              <tr><th>DB Primary Key (<code>item_id</code>)</th><td>#${item.item_id}</td></tr>
              <tr><th>Raw DB <code>description</code></th><td><code>${escapeHtml(item.description)}</code></td></tr>
              <tr><th>Brand (<code>item_brand</code>)</th><td>${escapeHtml(item.brand)} (ID: ${item.item_brand_id})</td></tr>
              <tr><th>Type (<code>item_type</code>)</th><td>${escapeHtml(item.item_type)} (ID: ${item.item_type_id})</td></tr>
              <tr><th>${isTyre ? 'Parsed Tyre Size &amp; Load' : 'Parsed Spec &amp; Size'}</th><td>${escapeHtml(item.size)} · ${escapeHtml(item.load_speed)}</td></tr>
              <tr><th>Unit (<code>item_unit</code>)</th><td>${escapeHtml(item.unit_name)} (${escapeHtml(item.unit)})</td></tr>
              <tr><th>Restock Threshold (<code>restock_point</code>)</th><td>${item.restock_point} ${escapeHtml(item.unit)}</td></tr>
              <tr><th>Date Added (<code>date</code>)</th><td>${escapeHtml(item.date_added)}</td></tr>
            </tbody>
          </table>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" data-add="${escapeHtml(item.id)}">
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
    const hadServerFilters = hasActiveServerFilters();
    state.category = 'all';
    state.selectedBrandIds.clear();
    state.selectedTypeIds.clear();
    state.brandFilterSearch = '';
    state.typeFilterSearch = '';
    state.selectedRim = '';
    state.dimensionQuery = '';
    state.otherBrandsPinned = false;
    state.userAdjustedPrice = false;
    state.searchQuery = '';
    state.sortBy = 'id-asc';

    if (els.brandFilterSearch) els.brandFilterSearch.value = '';
    if (els.clearBrandSearchBtn) els.clearBrandSearchBtn.classList.remove('is-visible');
    if (els.dimensionSearchInput) els.dimensionSearchInput.value = '';
    if (els.clearDimensionSearchBtn) els.clearDimensionSearchBtn.classList.remove('is-visible');
    if (els.typeFilterSearch) els.typeFilterSearch.value = '';
    if (els.sortSelect) els.sortSelect.value = 'id-asc';
    setOtherBrandsOpen(false);

    syncFilterListStates();

    if (hadServerFilters && state.dbConnected) {
      loadDatabaseItems({ mode: state.sampleMode || 'first10', append: false, includeFilters: false });
    } else {
      buildDynamicSidebarFilters(state.allSampledItems);
      applyFiltersAndRender();
    }
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
    const cancelOtherBrandsCloseTimer = () => {
      if (state.otherBrandsHoverTimer) {
        clearTimeout(state.otherBrandsHoverTimer);
        state.otherBrandsHoverTimer = null;
      }
    };

    const scheduleOtherBrandsClose = () => {
      cancelOtherBrandsCloseTimer();
      state.otherBrandsHoverTimer = setTimeout(() => {
        state.otherBrandsHoverTimer = null;
        if (!state.otherBrandsPinned) {
          setOtherBrandsOpen(false);
        }
      }, 170);
    };

    // Product type search input (sidebar)
    if (els.typeFilterSearch) {
      els.typeFilterSearch.addEventListener('input', e => {
        state.typeFilterSearch = e.target.value;
        syncFilterListStates();
      });
    }

    // "Search by brand" input field (top brand banner)
    if (els.brandFilterSearch) {
      els.brandFilterSearch.addEventListener('input', e => {
        state.brandFilterSearch = e.target.value;
        syncFilterListStates();
      });
    }

    if (els.clearBrandSearchBtn) {
      els.clearBrandSearchBtn.addEventListener('click', () => {
        state.brandFilterSearch = '';
        if (els.brandFilterSearch) {
          els.brandFilterSearch.value = '';
          els.brandFilterSearch.focus();
        }
        syncFilterListStates();
      });
    }

    // "search by dimension:" input field (top brand banner)
    if (els.dimensionSearchInput) {
      els.dimensionSearchInput.addEventListener('input', e => {
        state.dimensionQuery = e.target.value;
        syncFilterListStates();
        applyFiltersAndRender();
        if (state.dbConnected) {
          scheduleServerFetch(220);
        }
      });
    }

    if (els.clearDimensionSearchBtn) {
      els.clearDimensionSearchBtn.addEventListener('click', () => {
        state.dimensionQuery = '';
        if (els.dimensionSearchInput) {
          els.dimensionSearchInput.value = '';
          els.dimensionSearchInput.focus();
        }
        syncFilterListStates();
        if (state.dbConnected) {
          loadDatabaseItems({ mode: state.sampleMode, append: false, includeFilters: false });
        } else {
          applyFiltersAndRender();
        }
      });
    }

    // "Other brands" 5-column hover & toggle behavior (11th filter pill)
    if (els.otherBrandsTriggerBtn) {
      els.otherBrandsTriggerBtn.addEventListener('mouseenter', () => {
        cancelOtherBrandsCloseTimer();
        if (state.dbConnected && !els.otherBrandsTriggerBtn.disabled) {
          setOtherBrandsOpen(true);
        }
      });
      els.otherBrandsTriggerBtn.addEventListener('focus', () => {
        cancelOtherBrandsCloseTimer();
        if (state.dbConnected && !els.otherBrandsTriggerBtn.disabled) {
          setOtherBrandsOpen(true);
        }
      });
      els.otherBrandsTriggerBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!state.dbConnected || els.otherBrandsTriggerBtn.disabled) return;
        state.otherBrandsPinned = !state.otherBrandsPinned;
        setOtherBrandsOpen(state.otherBrandsPinned);
      });
    }

    if (els.otherBrandsPopover) {
      els.otherBrandsPopover.addEventListener('mouseenter', () => {
        cancelOtherBrandsCloseTimer();
      });
      els.otherBrandsPopover.addEventListener('mouseleave', () => {
        if (!state.otherBrandsPinned) {
          scheduleOtherBrandsClose();
        }
      });
    }

    if (els.otherBrandsHoverZone) {
      els.otherBrandsHoverZone.addEventListener('mouseleave', () => {
        if (!state.otherBrandsPinned) {
          scheduleOtherBrandsClose();
        }
      });
    }

    if (els.clearTypeFiltersBtn) {
      els.clearTypeFiltersBtn.addEventListener('click', () => {
        if (state.selectedTypeIds.size === 0) return;
        state.selectedTypeIds.clear();
        syncFilterListStates();
        if (state.dbConnected) {
          scheduleServerFetch(40);
        } else {
          applyFiltersAndRender();
        }
      });
    }

    if (els.clearRimFilterBtn) {
      els.clearRimFilterBtn.addEventListener('click', () => {
        if (state.selectedRim === '') return;
        state.selectedRim = '';
        document.querySelectorAll('[data-rim-chip]').forEach(b => b.classList.toggle('active', b.dataset.rimChip === ''));
        if (state.dbConnected) {
          scheduleServerFetch(40);
        } else {
          applyFiltersAndRender();
        }
      });
    }

    // Delegated Click Handlers
    document.addEventListener('click', e => {
      if (state.otherBrandsPinned && els.otherBrandsHoverZone && !e.target.closest('#otherBrandsHoverZone')) {
        state.otherBrandsPinned = false;
        setOtherBrandsOpen(false);
      }

      const brandPill = e.target.closest('[data-brand-filter]');
      if (brandPill) {
        if (!state.dbConnected) return;
        const brandId = Number(brandPill.dataset.brandFilter);
        if (brandId > 0) {
          if (state.selectedBrandIds.has(brandId)) state.selectedBrandIds.delete(brandId);
          else state.selectedBrandIds.add(brandId);
        }
        syncFilterListStates();
        if (state.dbConnected) {
          scheduleServerFetch(60);
        } else {
          applyFiltersAndRender();
        }
        return;
      }

      if (e.target.closest('[data-clear-types]')) {
        state.selectedTypeIds.clear();
        syncFilterListStates();
        if (state.dbConnected) scheduleServerFetch(40);
        return;
      }

      if (e.target.closest('[data-clear-brands]')) {
        state.selectedBrandIds.clear();
        syncFilterListStates();
        if (state.dbConnected) scheduleServerFetch(40);
        return;
      }

      if (e.target.closest('[data-clear-dimension]')) {
        state.dimensionQuery = '';
        if (els.dimensionSearchInput) els.dimensionSearchInput.value = '';
        syncFilterListStates();
        if (state.dbConnected) scheduleServerFetch(40);
        return;
      }

      const loadMoreBtn = e.target.closest('#loadMoreDbItemsBtn');
      if (loadMoreBtn) {
        loadDatabaseItems({ mode: state.sampleMode, append: true, includeFilters: false });
        return;
      }

      const rimBtn = e.target.closest('[data-rim-chip]');
      if (rimBtn) {
        state.selectedRim = rimBtn.dataset.rimChip || '';
        document.querySelectorAll('[data-rim-chip]').forEach(b => b.classList.toggle('active', b.dataset.rimChip === state.selectedRim));
        if (state.dbConnected) {
          scheduleServerFetch(40);
        } else {
          applyFiltersAndRender();
        }
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

    // Product Type checkbox changes (filter live against database)
    document.addEventListener('change', e => {
      if (e.target.matches('[data-type-check]')) {
        const typeId = Number(e.target.value);
        if (typeId > 0) {
          if (e.target.checked) state.selectedTypeIds.add(typeId);
          else state.selectedTypeIds.delete(typeId);
        }
        syncFilterListStates();
        if (state.dbConnected) {
          scheduleServerFetch(120);
        } else {
          applyFiltersAndRender();
        }
      }
    });

    // Price slider
    if (els.priceSlider) {
      els.priceSlider.addEventListener('input', e => {
        state.userAdjustedPrice = true;
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

    if (els.resetFiltersBtn) {
      els.resetFiltersBtn.addEventListener('click', resetAllFilters);
    }
    if (els.modalCloseBtn) {
      els.modalCloseBtn.addEventListener('click', closeInspectModal);
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeInspectModal();
        state.otherBrandsPinned = false;
        setOtherBrandsOpen(false);
      }
    });

    if (typeof ResizeObserver === 'function') {
      const stickyObserver = new ResizeObserver(syncStickyOffsets);
      if (els.mainHeader) stickyObserver.observe(els.mainHeader);
      if (els.brandBanner) stickyObserver.observe(els.brandBanner);
    }

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('resize', () => {
      syncStickyOffsets();
      onWindowScroll();
    }, { passive: true });
  }

  function init() {
    syncStickyOffsets();
    // Check if URL has ?search=..., ?dimension=..., ?brand_ids=..., ?type_ids=..., or ?rim=...
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('search')) {
      state.searchQuery = urlParams.get('search');
    }
    if (urlParams.get('dimension')) {
      state.dimensionQuery = urlParams.get('dimension');
      if (els.dimensionSearchInput) els.dimensionSearchInput.value = state.dimensionQuery;
    }
    if (urlParams.get('brand_ids')) {
      urlParams.get('brand_ids').split(',').forEach(part => {
        const id = Number(part.trim());
        if (id > 0) state.selectedBrandIds.add(id);
      });
    }
    if (urlParams.get('type_ids')) {
      urlParams.get('type_ids').split(',').forEach(part => {
        const id = Number(part.trim());
        if (id > 0) state.selectedTypeIds.add(id);
      });
    }
    if (urlParams.get('rim')) {
      const rawRim = urlParams.get('rim').trim().toUpperCase();
      state.selectedRim = rawRim.startsWith('R') ? rawRim : ('R' + rawRim);
    }

    bindEvents();
    refreshAosElements();
    loadDatabaseItems({ mode: 'first10', append: false, includeFilters: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

