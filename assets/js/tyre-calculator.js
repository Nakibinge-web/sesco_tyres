/**
 * Sesco Tyres — Tyre Size Calculator & Fitment Engine
 * 2D Tyre Size Visualizer & Fitment Comparison System
 * Rebuilt to match the exact visual layout and styling of sescotyres.com / tiresize.com
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Standard Available Tyre Dimension Options
  // --------------------------------------------------------------------------
  const WIDTHS = [
    135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325, 335
  ];

  const ASPECTS = [
    25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85
  ];

  const RIMS = [
    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24
  ];

  // Presets popular in Uganda
  const PRESETS = [
    { name: 'Toyota Wish / Fielder', t1: [195, 65, 15], t2: [205, 55, 16] },
    { name: 'Toyota Harrier / RAV4', t1: [225, 65, 17], t2: [235, 60, 18] },
    { name: 'Prado TX / Hilux',     t1: [265, 65, 17], t2: [265, 60, 18] },
    { name: 'Land Cruiser V8',       t1: [285, 60, 18], t2: [285, 50, 20] },
    { name: 'Everyday Saloon',       t1: [205, 55, 16], t2: [225, 45, 17] },
    { name: 'Light Commercial (LT)', t1: [195, 70, 15], t2: [205, 70, 15] }
  ];

  // DOM Elements cache
  const dom = {
    // Tabs & Panes
    tabCalculator: document.getElementById('tab-calculator'),
    tabComparison: document.getElementById('tab-comparison'),
    paneCalc: document.getElementById('pane-calc'),
    paneCmp: document.getElementById('pane-cmp'),

    // Single Inputs
    singleW: document.getElementById('single-w'),
    singleA: document.getElementById('single-a'),
    singleR: document.getElementById('single-r'),
    btnConvertWheel: document.getElementById('btn-convert-wheel'),
    btnCalcSingle: document.getElementById('btn-calc-single'),

    // Single Outputs
    singleValDiameter: document.getElementById('single-val-diameter'),
    singleValWidth: document.getElementById('single-val-width'),
    singleValSidewall: document.getElementById('single-val-sidewall'),
    singleValCircum: document.getElementById('single-val-circum'),
    singleLabelRevs: document.getElementById('single-label-revs'),
    singleValRevs: document.getElementById('single-val-revs'),

    // Comparison Inputs
    cmpW1: document.getElementById('cmp-w1'),
    cmpA1: document.getElementById('cmp-a1'),
    cmpR1: document.getElementById('cmp-r1'),
    cmpW2: document.getElementById('cmp-w2'),
    cmpA2: document.getElementById('cmp-a2'),
    cmpR2: document.getElementById('cmp-r2'),
    btnCalcCompare: document.getElementById('btn-calc-compare'),

    // Comparison Outputs
    cmpValD1: document.getElementById('cmp-val-d1'),
    cmpValD2: document.getElementById('cmp-val-d2'),
    cmpDiffD2: document.getElementById('cmp-diff-d2'),
    cmpValW1: document.getElementById('cmp-val-w1'),
    cmpValW2: document.getElementById('cmp-val-w2'),
    cmpDiffW2: document.getElementById('cmp-diff-w2'),
    cmpValS1: document.getElementById('cmp-val-s1'),
    cmpValS2: document.getElementById('cmp-val-s2'),
    cmpDiffS2: document.getElementById('cmp-diff-s2'),
    cmpValC1: document.getElementById('cmp-val-c1'),
    cmpValC2: document.getElementById('cmp-val-c2'),
    cmpDiffC2: document.getElementById('cmp-diff-c2'),
    cmpLabelRevs: document.getElementById('cmp-label-revs'),
    cmpValR1: document.getElementById('cmp-val-r1'),
    cmpValR2: document.getElementById('cmp-val-r2'),
    cmpDiffR2: document.getElementById('cmp-diff-r2'),

    // Unit Choices
    unitChoices: document.querySelectorAll('.calc-unit-choice'),

    // Visualizer Widget Elements
    visHeaderTitle: document.getElementById('vis-header-title'),
    visSvg: document.getElementById('calc-vis-svg'),
    visSpeedoSection: document.getElementById('vis-speedo-section'),
    visSpeedoHeadRow: document.getElementById('vis-speedo-head-row'),
    visSpeedoValRow: document.getElementById('vis-speedo-val-row'),
    visSingleLinks: document.getElementById('vis-single-links'),
    visBrowseTyresLink: document.getElementById('vis-browse-tyres-link'),

    // Verdict Banner
    verdictBanner: document.getElementById('calc-verdict-banner'),
    verdictIcon: document.getElementById('calc-verdict-icon'),
    verdictStatus: document.getElementById('calc-verdict-status'),
    verdictDiff: document.getElementById('calc-verdict-diff'),
    verdictText: document.getElementById('calc-verdict-text'),

    // Speedometer Callout (bottom section)
    speedoReadingActual: document.getElementById('speedo-reading-actual'),
    speedoNoticeText: document.getElementById('speedo-notice-text'),
    speedoTableBody: document.getElementById('speedo-table-body'),

    // Matrix Table Body
    matrixTableBody: document.getElementById('calc-matrix-body'),

    // Alternatives Grid
    alternativesGrid: document.getElementById('calc-alt-grid'),

    // Direct CTAs
    shopSearchT2Btn: document.getElementById('calc-shop-t2-btn'),
    whatsappBtn: document.getElementById('calc-whatsapp-btn'),
  };

  // State
  let state = {
    activeTab: 'calculator', // 'calculator' | 'comparison'
    unit: 'inches',          // 'inches' | 'mm'
    t1: { width: 195, aspect: 55, rim: 13 },
    t2: { width: 135, aspect: 75, rim: 16 }
  };

  // --------------------------------------------------------------------------
  // Core Tyre Calculation Formulas
  // --------------------------------------------------------------------------
  function calculateTyreMetrics(t) {
    const sidewallMm = t.width * (t.aspect / 100);
    const sidewallIn = sidewallMm / 25.4;
    const rimMm = t.rim * 25.4;
    const diameterMm = (2 * sidewallMm) + rimMm;
    const diameterIn = diameterMm / 25.4;
    const circumferenceMm = Math.PI * diameterMm;
    const circumferenceIn = circumferenceMm / 25.4;
    const revsPerKm = 1000000 / circumferenceMm;
    const revsPerMile = 20173 / diameterIn; // Precise standard loaded revs formula

    return {
      widthMm: t.width,
      widthIn: t.width / 25.4,
      aspect: t.aspect,
      rimIn: t.rim,
      rimMm: rimMm,
      sidewallMm: sidewallMm,
      sidewallIn: sidewallIn,
      diameterMm: diameterMm,
      diameterIn: diameterIn,
      circumferenceMm: circumferenceMm,
      circumferenceIn: circumferenceIn,
      revsPerKm: revsPerKm,
      revsPerMile: revsPerMile,
      sizeStr: `${t.width}/${t.aspect} R${t.rim}`
    };
  }

  // Format number for display in inches (avoids trailing .0 on exact integers)
  function fmtInches(val) {
    const rounded = Number(val.toFixed(1));
    if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
      return String(Math.round(rounded));
    }
    return rounded.toFixed(1);
  }

  // Format percentage difference (+12.1% or -31.2%)
  function fmtPct(num) {
    const n = Number(num);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
  }

  // --------------------------------------------------------------------------
  // Update UI and Visualizer
  // --------------------------------------------------------------------------
  function render() {
    const m1 = calculateTyreMetrics(state.t1);
    const m2 = calculateTyreMetrics(state.t2);

    // 1. Render Single Tyre Results
    renderSingleResults(m1);

    // 2. Render Comparison Tyre Results
    renderComparisonResults(m1, m2);

    // 3. Sync inputs to state
    syncInputsToState();

    // 4. Update Visualizer SVG & Section Headers
    if (state.activeTab === 'calculator') {
      if (dom.visHeaderTitle) dom.visHeaderTitle.textContent = 'Tyre Size Visualizer';
      if (dom.visSpeedoSection) dom.visSpeedoSection.style.display = 'none';
      if (dom.visSingleLinks) dom.visSingleLinks.style.display = 'flex';
      if (dom.visBrowseTyresLink) {
        const compactSize = `${m1.widthMm}/${m1.aspect}R${m1.rimIn}`;
        dom.visBrowseTyresLink.textContent = `Browse ${compactSize} Tires`;
        dom.visBrowseTyresLink.href = `shop.html?search=${encodeURIComponent(m1.sizeStr)}`;
      }
      renderSingleVisualizerSvg(m1);
      if (dom.verdictBanner) dom.verdictBanner.style.display = 'none';
    } else {
      if (dom.visHeaderTitle) dom.visHeaderTitle.textContent = 'Tyre Size Comparison Visualizer';
      if (dom.visSpeedoSection) dom.visSpeedoSection.style.display = 'flex';
      if (dom.visSingleLinks) dom.visSingleLinks.style.display = 'none';
      renderVisualizerSvg(m1, m2);
      renderSpeedometerTable(m1, m2);
      if (dom.verdictBanner) dom.verdictBanner.style.display = 'grid';
    }

    // 5. Update Differences and Verdict Banner
    const diffDiameterMm = m2.diameterMm - m1.diameterMm;
    const diffDiameterPct = ((diffDiameterMm / m1.diameterMm) * 100);
    const diffWidthMm = m2.widthMm - m1.widthMm;
    const diffSidewallMm = m2.sidewallMm - m1.sidewallMm;
    const diffCircumferenceMm = m2.circumferenceMm - m1.circumferenceMm;
    const diffRevsKm = m2.revsPerKm - m1.revsPerKm;
    const rideHeightChangeMm = diffDiameterMm / 2;

    renderVerdict(diffDiameterPct, diffDiameterMm, rideHeightChangeMm, m1, m2);

    // 6. Matrix Table
    renderMatrixTable(m1, m2, {
      diffDiameterMm,
      diffDiameterPct,
      diffWidthMm,
      diffSidewallMm,
      diffCircumferenceMm,
      diffRevsKm,
      rideHeightChangeMm
    });

    // 7. Speedometer Calibration (Lower block)
    renderSpeedometer(m1, m2, diffDiameterPct);

    // 8. Alternative Sizes
    renderAlternativeSizes(m1);

    // 9. Update CTAs
    updateCtas(m1, m2, diffDiameterPct);
  }

  // --------------------------------------------------------------------------
  // Single Tyre Results Renderer
  // --------------------------------------------------------------------------
  function renderSingleResults(m1) {
    if (state.unit === 'inches') {
      const d = fmtInches(m1.diameterIn);
      const w = fmtInches(m1.widthIn);
      const s = fmtInches(m1.sidewallIn);
      const c = (Math.floor(m1.circumferenceIn * 10) / 10).toFixed(1);
      const r = Math.round(m1.revsPerMile);

      if (dom.singleValDiameter) dom.singleValDiameter.textContent = `${d}"`;
      if (dom.singleValWidth) dom.singleValWidth.textContent = `${w}"`;
      if (dom.singleValSidewall) dom.singleValSidewall.textContent = `${s}"`;
      if (dom.singleValCircum) dom.singleValCircum.textContent = `${c}"`;
      if (dom.singleLabelRevs) dom.singleLabelRevs.textContent = 'Revs/Mile';
      if (dom.singleValRevs) dom.singleValRevs.textContent = String(r);
    } else {
      const d = Math.round(m1.diameterMm);
      const w = Math.round(m1.widthMm);
      const s = Math.round(m1.sidewallMm);
      const c = Math.round(m1.circumferenceMm);
      const r = Math.round(m1.revsPerKm);

      if (dom.singleValDiameter) dom.singleValDiameter.textContent = `${d} mm`;
      if (dom.singleValWidth) dom.singleValWidth.textContent = `${w} mm`;
      if (dom.singleValSidewall) dom.singleValSidewall.textContent = `${s} mm`;
      if (dom.singleValCircum) dom.singleValCircum.textContent = `${c} mm`;
      if (dom.singleLabelRevs) dom.singleLabelRevs.textContent = 'Revs/km';
      if (dom.singleValRevs) dom.singleValRevs.textContent = String(r);
    }
  }

  // --------------------------------------------------------------------------
  // Comparison Tyre Results Renderer
  // --------------------------------------------------------------------------
  function renderComparisonResults(m1, m2) {
    if (state.unit === 'inches') {
      const d1 = fmtInches(m1.diameterIn);
      const d2 = fmtInches(m2.diameterIn);
      const diffD = fmtPct(((Number(d2) - Number(d1)) / Number(d1)) * 100);

      const w1 = fmtInches(m1.widthIn);
      const w2 = fmtInches(m2.widthIn);
      const diffW = fmtPct(((Number(w2) - Number(w1)) / Number(w1)) * 100);

      const s1 = fmtInches(m1.sidewallIn);
      const s2 = fmtInches(m2.sidewallIn);
      const diffS = fmtPct(((Number(s2) - Number(s1)) / Number(s1)) * 100);

      const c1 = (Math.floor(m1.circumferenceIn * 10) / 10).toFixed(1);
      const c2 = (Math.floor(m2.circumferenceIn * 10) / 10).toFixed(1);
      const diffC = diffD;

      const r1 = Math.round(m1.revsPerMile);
      const r2 = Math.round(m2.revsPerMile);
      const deltaR = r2 - r1;
      const diffR = (deltaR > 0 ? '+' : '') + deltaR;

      if (dom.cmpValD1) dom.cmpValD1.textContent = `${d1}"`;
      if (dom.cmpValD2) dom.cmpValD2.textContent = `${d2}"`;
      if (dom.cmpDiffD2) dom.cmpDiffD2.textContent = diffD;

      if (dom.cmpValW1) dom.cmpValW1.textContent = `${w1}"`;
      if (dom.cmpValW2) dom.cmpValW2.textContent = `${w2}"`;
      if (dom.cmpDiffW2) dom.cmpDiffW2.textContent = diffW;

      if (dom.cmpValS1) dom.cmpValS1.textContent = `${s1}"`;
      if (dom.cmpValS2) dom.cmpValS2.textContent = `${s2}"`;
      if (dom.cmpDiffS2) dom.cmpDiffS2.textContent = diffS;

      if (dom.cmpValC1) dom.cmpValC1.textContent = `${c1}"`;
      if (dom.cmpValC2) dom.cmpValC2.textContent = `${c2}"`;
      if (dom.cmpDiffC2) dom.cmpDiffC2.textContent = diffC;

      if (dom.cmpLabelRevs) dom.cmpLabelRevs.textContent = 'Revs/Mile';
      if (dom.cmpValR1) dom.cmpValR1.textContent = String(r1);
      if (dom.cmpValR2) dom.cmpValR2.textContent = String(r2);
      if (dom.cmpDiffR2) dom.cmpDiffR2.textContent = diffR;
    } else {
      const d1 = Math.round(m1.diameterMm);
      const d2 = Math.round(m2.diameterMm);
      const diffD = fmtPct(((d2 - d1) / d1) * 100);

      const w1 = Math.round(m1.widthMm);
      const w2 = Math.round(m2.widthMm);
      const diffW = fmtPct(((w2 - w1) / w1) * 100);

      const s1 = Math.round(m1.sidewallMm);
      const s2 = Math.round(m2.sidewallMm);
      const diffS = fmtPct(((s2 - s1) / s1) * 100);

      const c1 = Math.round(m1.circumferenceMm);
      const c2 = Math.round(m2.circumferenceMm);
      const diffC = diffD;

      const r1 = Math.round(m1.revsPerKm);
      const r2 = Math.round(m2.revsPerKm);
      const deltaR = r2 - r1;
      const diffR = (deltaR > 0 ? '+' : '') + deltaR;

      if (dom.cmpValD1) dom.cmpValD1.textContent = `${d1} mm`;
      if (dom.cmpValD2) dom.cmpValD2.textContent = `${d2} mm`;
      if (dom.cmpDiffD2) dom.cmpDiffD2.textContent = diffD;

      if (dom.cmpValW1) dom.cmpValW1.textContent = `${w1} mm`;
      if (dom.cmpValW2) dom.cmpValW2.textContent = `${w2} mm`;
      if (dom.cmpDiffW2) dom.cmpDiffW2.textContent = diffW;

      if (dom.cmpValS1) dom.cmpValS1.textContent = `${s1} mm`;
      if (dom.cmpValS2) dom.cmpValS2.textContent = `${s2} mm`;
      if (dom.cmpDiffS2) dom.cmpDiffS2.textContent = diffS;

      if (dom.cmpValC1) dom.cmpValC1.textContent = `${c1} mm`;
      if (dom.cmpValC2) dom.cmpValC2.textContent = `${c2} mm`;
      if (dom.cmpDiffC2) dom.cmpDiffC2.textContent = diffC;

      if (dom.cmpLabelRevs) dom.cmpLabelRevs.textContent = 'Revs/km';
      if (dom.cmpValR1) dom.cmpValR1.textContent = String(r1);
      if (dom.cmpValR2) dom.cmpValR2.textContent = String(r2);
      if (dom.cmpDiffR2) dom.cmpDiffR2.textContent = diffR;
    }
  }

  // --------------------------------------------------------------------------
  // Synchronize inputs with internal state
  // --------------------------------------------------------------------------
  function syncInputsToState() {
    if (dom.singleW && document.activeElement !== dom.singleW) dom.singleW.value = state.t1.width;
    if (dom.singleA && document.activeElement !== dom.singleA) dom.singleA.value = state.t1.aspect;
    if (dom.singleR && document.activeElement !== dom.singleR) dom.singleR.value = state.t1.rim;

    if (dom.cmpW1 && document.activeElement !== dom.cmpW1) dom.cmpW1.value = state.t1.width;
    if (dom.cmpA1 && document.activeElement !== dom.cmpA1) dom.cmpA1.value = state.t1.aspect;
    if (dom.cmpR1 && document.activeElement !== dom.cmpR1) dom.cmpR1.value = state.t1.rim;

    if (dom.cmpW2 && document.activeElement !== dom.cmpW2) dom.cmpW2.value = state.t2.width;
    if (dom.cmpA2 && document.activeElement !== dom.cmpA2) dom.cmpA2.value = state.t2.aspect;
    if (dom.cmpR2 && document.activeElement !== dom.cmpR2) dom.cmpR2.value = state.t2.rim;
  }

  // --------------------------------------------------------------------------
  // SVG 2D Tyre Visualizer: Shared Helpers
  // --------------------------------------------------------------------------
  function getSharedSvgDefs() {
    return `
      <defs>
        <!-- Forward Arrowhead Marker (Grey) -->
        <marker id="arr-fwd-grey" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M 0,1 L 6,3.5 L 0,6 Z" fill="#737b84" />
        </marker>
        <!-- Reverse Arrowhead Marker (Grey) -->
        <marker id="arr-rev-grey" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <path d="M 6,1 L 0,3.5 L 6,6 Z" fill="#737b84" />
        </marker>

        <!-- Forward Arrowhead Marker (Orange) -->
        <marker id="arr-fwd-orange" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M 0,1 L 6,3.5 L 0,6 Z" fill="#e67e22" />
        </marker>
        <!-- Reverse Arrowhead Marker (Orange) -->
        <marker id="arr-rev-orange" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <path d="M 6,1 L 0,3.5 L 6,6 Z" fill="#e67e22" />
        </marker>

        <!-- Front Tread Rubber Cylindrical Gradient -->
        <linearGradient id="treadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#121212" />
          <stop offset="18%" stop-color="#2c2c2c" />
          <stop offset="50%" stop-color="#383838" />
          <stop offset="82%" stop-color="#2c2c2c" />
          <stop offset="100%" stop-color="#121212" />
        </linearGradient>

        <!-- Side Tyre Rubber Radial Gradient -->
        <radialGradient id="tireSideGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#121212" />
          <stop offset="70%" stop-color="#1c1c1c" />
          <stop offset="88%" stop-color="#2c2c2c" />
          <stop offset="100%" stop-color="#181818" />
        </radialGradient>

        <!-- Wheel Rim Metallic Alloy Gradient -->
        <radialGradient id="rimAlloyGrad" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="28%" stop-color="#cbd5e1" />
          <stop offset="65%" stop-color="#64748b" />
          <stop offset="100%" stop-color="#1e293b" />
        </radialGradient>

        <!-- Aggressive All-Terrain Siping & Tread Block Pattern -->
        <pattern id="treadPattern" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill="transparent" />
          <path d="M 0,2 L 7,2 L 11,8 L 18,8 L 22,2" fill="none" stroke="#161616" stroke-width="2" />
          <path d="M 0,13 L 7,13 L 11,19 L 18,19 L 22,13" fill="none" stroke="#161616" stroke-width="2" />
          <circle cx="5" cy="7" r="1.2" fill="#141414" />
          <circle cx="16" cy="14" r="1.2" fill="#141414" />
        </pattern>
      </defs>
    `;
  }

  // Draw a Front-Facing Tyre Profile
  function drawFrontTyre(cx, cy, W, H, num, color, diamLabel, widthLabel, bracketSide) {
    const topY = cy - H / 2;
    const botY = cy + H / 2;
    const leftX = cx - W / 2;
    const rightX = cx + W / 2;

    // Height Bracket
    let heightBracket = '';
    if (bracketSide === 'left') {
      const bx = leftX - 16;
      heightBracket = `
        <line x1="${bx}" y1="${topY}" x2="${bx}" y2="${botY}" stroke="${color}" stroke-width="1.2" />
        <line x1="${bx - 5}" y1="${topY}" x2="${bx + 5}" y2="${topY}" stroke="${color}" stroke-width="1.2" />
        <line x1="${bx - 5}" y1="${botY}" x2="${bx + 5}" y2="${botY}" stroke="${color}" stroke-width="1.2" />
        <text x="${bx - 8}" y="${cy + 4}" text-anchor="end" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${diamLabel}</text>
      `;
    } else {
      const bx = rightX + 16;
      heightBracket = `
        <line x1="${bx}" y1="${topY}" x2="${bx}" y2="${botY}" stroke="${color}" stroke-width="1.2" />
        <line x1="${bx - 5}" y1="${topY}" x2="${bx + 5}" y2="${topY}" stroke="${color}" stroke-width="1.2" />
        <line x1="${bx - 5}" y1="${botY}" x2="${bx + 5}" y2="${botY}" stroke="${color}" stroke-width="1.2" />
        <text x="${bx + 8}" y="${cy + 4}" text-anchor="start" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${diamLabel}</text>
      `;
    }

    // Width Bracket at bottom
    const bY = cy + 95;
    const widthBracket = `
      <line x1="${leftX}" y1="${bY}" x2="${rightX}" y2="${bY}" stroke="${color}" stroke-width="1.2" />
      <line x1="${leftX}" y1="${bY - 5}" x2="${leftX}" y2="${bY + 5}" stroke="${color}" stroke-width="1.2" />
      <line x1="${rightX}" y1="${bY - 5}" x2="${rightX}" y2="${bY + 5}" stroke="${color}" stroke-width="1.2" />
      <text x="${cx}" y="${bY + 16}" text-anchor="middle" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${widthLabel}</text>
    `;

    // Shoulder notches
    let notches = '';
    for (let y = topY + 10; y < botY - 10; y += 12) {
      notches += `<line x1="${leftX}" y1="${y}" x2="${leftX + 3}" y2="${y}" stroke="#141414" stroke-width="1.5" />`;
      notches += `<line x1="${rightX - 3}" y1="${y}" x2="${rightX}" y2="${y}" stroke="#141414" stroke-width="1.5" />`;
    }

    return `
      <g class="vis-front-tyre-${num}">
        ${heightBracket}
        ${widthBracket}

        <!-- Tyre Body -->
        <rect x="${leftX}" y="${topY}" width="${W}" height="${H}" rx="10" fill="url(#treadGrad)" stroke="#111111" stroke-width="1.5" />
        <rect x="${leftX + 3}" y="${topY + 3}" width="${W - 6}" height="${H - 6}" rx="8" fill="url(#treadPattern)" opacity="0.8" />
        ${notches}

        <!-- Center Grooves -->
        <line x1="${cx - 4}" y1="${topY + 6}" x2="${cx - 4}" y2="${botY - 6}" stroke="#111111" stroke-width="1" opacity="0.5" />
        <line x1="${cx + 4}" y1="${topY + 6}" x2="${cx + 4}" y2="${botY - 6}" stroke="#111111" stroke-width="1" opacity="0.5" />

        <!-- Bold White Number in Center (only if num provided) -->
        ${num ? `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="34" fill="#ffffff" stroke="#111111" stroke-width="2.5" paint-order="stroke fill">${num}</text>` : ''}
      </g>
    `;
  }

  // Draw a Side-View Wheel
  function drawSideWheel(cx, cy, R, RimR, num, color, rimLabel, sidewallLabel, circumLabel, revsLabel, arcSide, sidewallSide) {
    const isOrange = color === '#e67e22';
    const fwdMarker = isOrange ? 'arr-fwd-orange' : 'arr-fwd-grey';
    const revMarker = isOrange ? 'arr-rev-orange' : 'arr-rev-grey';

    // Spoke generation (10 split spokes)
    let spokesHtml = '';
    if (num) {
      for (let i = 0; i < 10; i++) {
        const deg = i * 36;
        spokesHtml += `
          <g transform="rotate(${deg} ${cx} ${cy})">
            <path d="M ${cx - 5} ${cy - 14} L ${cx - 8} ${cy - RimR + 5} L ${cx + 8} ${cy - RimR + 5} L ${cx + 5} ${cy - 14} Z" fill="url(#rimAlloyGrad)" stroke="#111" stroke-width="0.8" />
            <line x1="${cx}" y1="${cy - 14}" x2="${cx}" y2="${cy - RimR + 5}" stroke="#0f172a" stroke-width="1.2" />
          </g>
        `;
      }
    }

    // Outer tread lugs (teeth around perimeter)
    let teethHtml = '';
    for (let i = 0; i < 52; i++) {
      const deg = (i * 360) / 52;
      teethHtml += `<line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy - R + 4}" transform="rotate(${deg} ${cx} ${cy})" stroke="#141414" stroke-width="3" />`;
    }

    // Top Rim Diameter Bracket (starts directly at the inner circle equator y = cy where diameter is first measured)
    const topBracketY = 22;
    const rimBracket = `
      <!-- Rim Diameter Bracket directly from inner circle (y = cy) -->
      <line x1="${cx - RimR}" y1="${topBracketY}" x2="${cx + RimR}" y2="${topBracketY}" stroke="${color}" stroke-width="1.2" />
      <line x1="${cx - RimR}" y1="${topBracketY}" x2="${cx - RimR}" y2="${cy}" stroke="${color}" stroke-width="1.2" />
      <line x1="${cx + RimR}" y1="${topBracketY}" x2="${cx + RimR}" y2="${cy}" stroke="${color}" stroke-width="1.2" />
      <text x="${cx}" y="${topBracketY - 4}" text-anchor="middle" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${rimLabel}</text>
    `;

    // Sidewall Bracket (measures vertical distance between inner circle and outer tyre bottom)
    let sidewallBracket = '';
    if (sidewallSide === 'right') {
      const swX = cx + R + 10;
      sidewallBracket = `
        <!-- Sidewall Bracket (Right) -->
        <line x1="${cx}" y1="${cy + RimR}" x2="${swX + 8}" y2="${cy + RimR}" stroke="${color}" stroke-width="1.2" />
        <line x1="${cx}" y1="${cy + R}" x2="${swX + 8}" y2="${cy + R}" stroke="${color}" stroke-width="1.2" />
        <line x1="${swX}" y1="${cy + RimR}" x2="${swX}" y2="${cy + R}" stroke="${color}" stroke-width="1.2" />
        <text x="${swX + 12}" y="${cy + (RimR + R) / 2 + 4}" text-anchor="start" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${sidewallLabel}</text>
      `;
    } else {
      const swX = cx - R - 10;
      sidewallBracket = `
        <!-- Sidewall Bracket (Left) -->
        <line x1="${swX - 8}" y1="${cy + RimR}" x2="${cx}" y2="${cy + RimR}" stroke="${color}" stroke-width="1.2" />
        <line x1="${swX - 8}" y1="${cy + R}" x2="${cx}" y2="${cy + R}" stroke="${color}" stroke-width="1.2" />
        <line x1="${swX}" y1="${cy + RimR}" x2="${swX}" y2="${cy + R}" stroke="${color}" stroke-width="1.2" />
        <text x="${swX - 12}" y="${cy + (RimR + R) / 2 + 4}" text-anchor="end" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${sidewallLabel}</text>
      `;
    }

    // Small Circumference Arc with two arrows (in front and behind)
    const R_arc = R + 10;
    let circumArc = '';
    if (arcSide === 'left') {
      // Lower-left arc spanning ~42 deg
      const a1_deg = 130;
      const a2_deg = 172;
      const a1 = a1_deg * Math.PI / 180;
      const a2 = a2_deg * Math.PI / 180;
      const x1 = cx + R_arc * Math.cos(a1);
      const y1 = cy + R_arc * Math.sin(a1);
      const x2 = cx + R_arc * Math.cos(a2);
      const y2 = cy + R_arc * Math.sin(a2);

      const amid_deg = (a1_deg + a2_deg) / 2;
      const amid = amid_deg * Math.PI / 180;
      const R_text = R_arc + 14;
      const xmid = cx + R_text * Math.cos(amid);
      const ymid = cy + R_text * Math.sin(amid);
      const rot_deg = amid_deg - 90; // tangent rotation

      circumArc = `
        <!-- Small Circumference Arc (Left) with arrows in front and behind -->
        <path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R_arc.toFixed(1)} ${R_arc.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2" marker-start="url(#${revMarker})" marker-end="url(#${fwdMarker})" />
        <text x="${xmid.toFixed(1)}" y="${ymid.toFixed(1)}" text-anchor="middle" transform="rotate(${rot_deg.toFixed(1)} ${xmid.toFixed(1)} ${ymid.toFixed(1)})" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${circumLabel}</text>
      `;
    } else {
      // Lower-right arc spanning ~42 deg
      const b1_deg = 8;
      const b2_deg = 50;
      const b1 = b1_deg * Math.PI / 180;
      const b2 = b2_deg * Math.PI / 180;
      const x1 = cx + R_arc * Math.cos(b1);
      const y1 = cy + R_arc * Math.sin(b1);
      const x2 = cx + R_arc * Math.cos(b2);
      const y2 = cy + R_arc * Math.sin(b2);

      const bmid_deg = (b1_deg + b2_deg) / 2;
      const bmid = bmid_deg * Math.PI / 180;
      const R_text = R_arc + 14;
      const xmid = cx + R_text * Math.cos(bmid);
      const ymid = cy + R_text * Math.sin(bmid);
      const rot_deg = bmid_deg - 90;

      circumArc = `
        <!-- Small Circumference Arc (Right) with arrows in front and behind -->
        <path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R_arc.toFixed(1)} ${R_arc.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2" marker-start="url(#${revMarker})" marker-end="url(#${fwdMarker})" />
        <text x="${xmid.toFixed(1)}" y="${ymid.toFixed(1)}" text-anchor="middle" transform="rotate(${rot_deg.toFixed(1)} ${xmid.toFixed(1)} ${ymid.toFixed(1)})" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${circumLabel}</text>
      `;
    }

    const revsY = cy + R + 26;

    return `
      <g class="vis-wheel-${num || 'single'}">
        <!-- Outer Rubber Tire -->
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#tireSideGrad)" stroke="#111111" stroke-width="1.5" />
        ${teethHtml}

        <!-- Sidewall Ring Accents -->
        <circle cx="${cx}" cy="${cy}" r="${R - 6}" fill="none" stroke="#2a2a2a" stroke-width="1" />
        <circle cx="${cx}" cy="${cy}" r="${(R + RimR) / 2}" fill="none" stroke="#222222" stroke-width="1" />
        <circle cx="${cx}" cy="${cy}" r="${RimR + 6}" fill="none" stroke="#333333" stroke-width="1" />

        <!-- Rim Outer Lip -->
        <circle cx="${cx}" cy="${cy}" r="${RimR}" fill="#111827" stroke="${num ? 'url(#rimAlloyGrad)' : '#262626'}" stroke-width="3" />
        <circle cx="${cx}" cy="${cy}" r="${RimR - 2}" fill="#0f172a" />
        ${num ? `<circle cx="${cx}" cy="${cy}" r="${RimR - 10}" fill="#1e293b" opacity="0.6" />` : ''}

        <!-- Alloy Spokes -->
        ${spokesHtml}

        <!-- Center Hub -->
        ${num ? `
          <circle cx="${cx}" cy="${cy}" r="17" fill="url(#rimAlloyGrad)" stroke="#0f172a" stroke-width="1.5" />
          <circle cx="${cx}" cy="${cy}" r="14" fill="#0f172a" />
          <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="34" fill="#ffffff" stroke="#111111" stroke-width="2.5" paint-order="stroke fill">${num}</text>
        ` : `
          <circle cx="${cx}" cy="${cy}" r="18" fill="#151515" stroke="#2a2a2a" stroke-width="1.5" />
        `}

        <!-- Dimension Brackets & Annotations (Rendered ON TOP of tyre so lines are fully visible) -->
        ${rimBracket}
        ${sidewallBracket}
        ${circumArc}

        <!-- Revolutions per Distance -->
        <text x="${cx}" y="${revsY}" text-anchor="middle" font-family="'Nunito Sans', sans-serif" font-size="12.5" font-weight="700" fill="#111111">${revsLabel}</text>
      </g>
    `;
  }

  // --------------------------------------------------------------------------
  // SVG 2D Tyre Visualizer: Comparison View (Image 1)
  // --------------------------------------------------------------------------
  function renderVisualizerSvg(m1, m2) {
    if (!dom.visSvg) return;

    const isInch = state.unit === 'inches';

    const maxDiameter = Math.max(m1.diameterMm, m2.diameterMm, 620);
    const scaleH = 190 / maxDiameter;
    const cy = 135;

    const R1 = (m1.diameterMm / 2) * scaleH;
    const RimR1 = (m1.rimMm / 2) * scaleH;

    const R2 = (m2.diameterMm / 2) * scaleH;
    const RimR2 = (m2.rimMm / 2) * scaleH;

    const scaleW = 60 / Math.max(m1.widthMm, 205);
    const W1 = m1.widthMm * scaleW;
    const H1 = m1.diameterMm * scaleH;

    const W2 = m2.widthMm * scaleW;
    const H2 = m2.diameterMm * scaleH;

    // Formatting dimension strings
    const diamLabel1 = isInch ? `${fmtInches(m1.diameterIn)}"` : `${Math.round(m1.diameterMm)}`;
    const widthLabel1 = isInch ? `${fmtInches(m1.widthIn)}"` : `${m1.widthMm}`;
    const rimLabel1 = `${m1.rimIn}"`;
    const sidewallLabel1 = isInch ? `${fmtInches(m1.sidewallIn)}"` : `${Math.round(m1.sidewallMm)}`;
    const circumLabel1 = isInch ? `${(Math.floor(m1.circumferenceIn * 10) / 10).toFixed(1)}"` : `${Math.round(m1.diameterMm * Math.PI)}`;
    const revsLabel1 = isInch ? `${Math.round(m1.revsPerMile)} Revs/mi` : `${Math.round(m1.revsPerKm)} Revs/km`;

    const diamLabel2 = isInch ? `${fmtInches(m2.diameterIn)}"` : `${Math.round(m2.diameterMm)}`;
    const widthLabel2 = isInch ? `${fmtInches(m2.widthIn)}"` : `${m2.widthMm}`;
    const rimLabel2 = `${m2.rimIn}"`;
    const sidewallLabel2 = isInch ? `${fmtInches(m2.sidewallIn)}"` : `${Math.round(m2.sidewallMm)}`;
    const circumLabel2 = isInch ? `${(Math.floor(m2.circumferenceIn * 10) / 10).toFixed(1)}"` : `${Math.round(m2.diameterMm * Math.PI)}`;
    const revsLabel2 = isInch ? `${Math.round(m2.revsPerMile)} Revs/mi` : `${Math.round(m2.revsPerKm)} Revs/km`;

    // Coordinates with ample left/right margins to prevent text cutoff:
    // Front Tyre 1 at cx = 90, Front Tyre 2 at cx = 175
    // Side Wheel 1 at cx = 405, Side Wheel 2 at cx = 675
    dom.visSvg.setAttribute('viewBox', '0 0 880 280');
    dom.visSvg.innerHTML = `
      ${getSharedSvgDefs()}

      <!-- FRONT TYRES -->
      ${drawFrontTyre(90, cy, W1, H1, '1', '#737b84', diamLabel1, widthLabel1, 'left')}
      ${drawFrontTyre(175, cy, W2, H2, '2', '#e67e22', diamLabel2, widthLabel2, 'right')}

      <!-- SIDE WHEELS -->
      ${drawSideWheel(405, cy, R1, RimR1, '1', '#737b84', rimLabel1, sidewallLabel1, circumLabel1, revsLabel1, 'left', 'right')}
      ${drawSideWheel(675, cy, R2, RimR2, '2', '#e67e22', rimLabel2, sidewallLabel2, circumLabel2, revsLabel2, 'right', 'left')}
    `;
  }

  // --------------------------------------------------------------------------
  // SVG 2D Tyre Visualizer: Single View (Image 2)
  // --------------------------------------------------------------------------
  function renderSingleVisualizerSvg(m1) {
    if (!dom.visSvg) return;

    const isInch = state.unit === 'inches';

    const maxDiameter = Math.max(m1.diameterMm, 620);
    const scaleH = 190 / maxDiameter;
    const cy = 135;

    const R1 = (m1.diameterMm / 2) * scaleH;
    const RimR1 = (m1.rimMm / 2) * scaleH;

    const scaleW = 60 / Math.max(m1.widthMm, 205);
    const W1 = m1.widthMm * scaleW;
    const H1 = m1.diameterMm * scaleH;

    const diamLabel1 = isInch ? `${fmtInches(m1.diameterIn)}"` : `${Math.round(m1.diameterMm)}`;
    const widthLabel1 = isInch ? `${fmtInches(m1.widthIn)}"` : `${m1.widthMm}`;
    const rimLabel1 = `${m1.rimIn}"`;
    const sidewallLabel1 = isInch ? `${fmtInches(m1.sidewallIn)}"` : `${Math.round(m1.sidewallMm)}`;
    const circumLabel1 = isInch ? `${(Math.floor(m1.circumferenceIn * 10) / 10).toFixed(1)}"` : `${Math.round(m1.diameterMm * Math.PI)}`;
    const revsLabel1 = isInch ? `${Math.round(m1.revsPerMile)} Revs/mi` : `${Math.round(m1.revsPerKm)} Revs/km`;

    // Centered layout for Single Tyre (Front tyre at cx = 170, Side wheel at cx = 460)
    dom.visSvg.setAttribute('viewBox', '0 0 720 280');
    dom.visSvg.innerHTML = `
      ${getSharedSvgDefs()}

      <!-- FRONT TYRE -->
      ${drawFrontTyre(170, cy, W1, H1, '', '#737b84', diamLabel1, widthLabel1, 'left')}

      <!-- SIDE WHEEL (single mode doesn't need number overlay) -->
      ${drawSideWheel(460, cy, R1, RimR1, '', '#737b84', rimLabel1, sidewallLabel1, circumLabel1, revsLabel1, 'left', 'right')}
    `;
  }

  // --------------------------------------------------------------------------
  // Speedometer Error Table Renderer (Comparison Mode)
  // --------------------------------------------------------------------------
  function renderSpeedometerTable(m1, m2) {
    if (!dom.visSpeedoHeadRow || !dom.visSpeedoValRow) return;

    const isInch = state.unit === 'inches';
    // Precise factor from rounded diameters matching tiresize/sesco
    const factor = (Math.round(m2.diameterMm) / Math.round(m1.diameterMm)) || (m2.diameterMm / m1.diameterMm);

    if (isInch) {
      const speeds = [10, 20, 30, 45, 60, 70, 80, 90];
      dom.visSpeedoHeadRow.innerHTML = `
        <th class="vis-speedo-col-label">Speed</th>
        ${speeds.map(s => `<th>${s} mph</th>`).join('')}
      `;
      dom.visSpeedoValRow.innerHTML = `
        <td class="vis-speedo-col-label">Actual</td>
        ${speeds.map(s => {
          const act = (s * factor).toFixed(1);
          return `<td><span class="vis-amber-badge">${act}</span></td>`;
        }).join('')}
      `;
    } else {
      const speeds = [10, 30, 50, 70, 90, 110, 130, 150];
      dom.visSpeedoHeadRow.innerHTML = `
        <th class="vis-speedo-col-label">Speed</th>
        ${speeds.map(s => `<th>${s} km/h</th>`).join('')}
      `;
      dom.visSpeedoValRow.innerHTML = `
        <td class="vis-speedo-col-label">Actual</td>
        ${speeds.map(s => {
          const act = (s * factor).toFixed(1);
          return `<td><span class="vis-amber-badge">${act}</span></td>`;
        }).join('')}
      `;
    }
  }

  // --------------------------------------------------------------------------
  // Format Helpers
  // --------------------------------------------------------------------------
  function fmtDiff(valMm, valPct = null, unit = 'mm') {
    const num = Number(valMm);
    const sign = num > 0 ? '+' : '';
    let cls = 'calc-diff-zero';
    if (num > 0) cls = 'calc-diff-pos';
    else if (num < 0) cls = 'calc-diff-neg';

    let pctStr = '';
    if (valPct !== null) {
      const pNum = Number(valPct);
      const pSign = pNum > 0 ? '+' : '';
      pctStr = ` (${pSign}${pNum.toFixed(1)}%)`;
    }

    return `<span class="calc-diff-pill ${cls}">${sign}${num.toFixed(1)} ${unit}${pctStr}</span>`;
  }

  // --------------------------------------------------------------------------
  // Verdict Banner Renderer
  // --------------------------------------------------------------------------
  function renderVerdict(diffPct, diffMm, rideHeightMm, m1, m2) {
    if (!dom.verdictBanner) return;

    const absDiff = Math.abs(diffPct);
    const banner = dom.verdictBanner;
    banner.classList.remove('calc-verdict-safe', 'calc-verdict-warn', 'calc-verdict-alert');

    let statusText = '';
    let explanation = '';
    let iconHtml = '';

    if (absDiff <= 1.5) {
      banner.classList.add('calc-verdict-safe');
      statusText = 'Safe Fitment — Ideal Match';
      iconHtml = '<i class="fa-solid fa-circle-check"></i>';
      explanation = `
        <strong>${m2.sizeStr}</strong> is within <strong>${absDiff.toFixed(1)}%</strong> of original <strong>${m1.sizeStr}</strong> diameter.
        This is an excellent fitment within international safety tolerance (±3%). Speedometer error is negligible (${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}%)
        and suspension/arch clearance will remain virtually unchanged.
      `;
    } else if (absDiff <= 3.0) {
      banner.classList.add('calc-verdict-warn');
      statusText = 'Acceptable Fitment — Clearance Check Advised';
      iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
      explanation = `
        <strong>${m2.sizeStr}</strong> has a <strong>${(diffPct > 0 ? '+' : '')}${diffPct.toFixed(1)}% (${diffMm > 0 ? '+' : ''}${diffMm.toFixed(1)} mm)</strong> diameter variance.
        While within standard ±3% tolerance window, vehicle ground clearance will shift by <strong>${rideHeightMm > 0 ? '+' : ''}${rideHeightMm.toFixed(1)} mm</strong>.
        We recommend verifying wheel-well clearance under full steering lock at our Queen's Way workshop.
      `;
    } else {
      banner.classList.add('calc-verdict-alert');
      statusText = 'Caution — Exceeds Recommended ±3% Limit';
      iconHtml = '<i class="fa-solid fa-circle-xmark"></i>';
      explanation = `
        <strong>${m2.sizeStr}</strong> diameter deviates by <strong>${(diffPct > 0 ? '+' : '')}${diffPct.toFixed(1)}% (${diffMm > 0 ? '+' : ''}${diffMm.toFixed(1)} mm)</strong> from stock.
        This exceeds the automotive ±3% safety guideline. This setup carries risks of tyre rubbing on suspension struts/inner fenders, altered braking leverage,
        and substantial speedometer discrepancy. Please consult a Sesco technician before purchasing.
      `;
    }

    if (dom.verdictIcon) dom.verdictIcon.innerHTML = iconHtml;
    if (dom.verdictStatus) dom.verdictStatus.textContent = statusText;
    if (dom.verdictDiff) {
      dom.verdictDiff.innerHTML = `${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}% <small>(${diffMm > 0 ? '+' : ''}${diffMm.toFixed(1)} mm)</small>`;
    }
    if (dom.verdictText) dom.verdictText.innerHTML = explanation;
  }

  // --------------------------------------------------------------------------
  // Matrix Table Renderer
  // --------------------------------------------------------------------------
  function renderMatrixTable(m1, m2, d) {
    if (!dom.matrixTableBody) return;

    const rows = [
      {
        icon: 'fa-arrows-up-down',
        metric: 'Overall Diameter',
        v1: `${m1.diameterMm.toFixed(1)} mm <span class="calc-val-sub">(${m1.diameterIn.toFixed(2)}")</span>`,
        v2: `${m2.diameterMm.toFixed(1)} mm <span class="calc-val-sub">(${m2.diameterIn.toFixed(2)}")</span>`,
        diff: fmtDiff(d.diffDiameterMm, d.diffDiameterPct, 'mm')
      },
      {
        icon: 'fa-arrows-left-right',
        metric: 'Section Width',
        v1: `${m1.widthMm} mm <span class="calc-val-sub">(${m1.widthIn.toFixed(2)}")</span>`,
        v2: `${m2.widthMm} mm <span class="calc-val-sub">(${m2.widthIn.toFixed(2)}")</span>`,
        diff: fmtDiff(d.diffWidthMm, ((d.diffWidthMm / m1.widthMm) * 100), 'mm')
      },
      {
        icon: 'fa-layer-group',
        metric: 'Sidewall Height',
        v1: `${m1.sidewallMm.toFixed(1)} mm <span class="calc-val-sub">(${m1.sidewallIn.toFixed(2)}")</span>`,
        v2: `${m2.sidewallMm.toFixed(1)} mm <span class="calc-val-sub">(${m2.sidewallIn.toFixed(2)}")</span>`,
        diff: fmtDiff(d.diffSidewallMm, ((d.diffSidewallMm / m1.sidewallMm) * 100), 'mm')
      },
      {
        icon: 'fa-compact-disc',
        metric: 'Wheel Rim Diameter',
        v1: `${m1.rimIn}" <span class="calc-val-sub">(${m1.rimMm.toFixed(1)} mm)</span>`,
        v2: `${m2.rimIn}" <span class="calc-val-sub">(${m2.rimMm.toFixed(1)} mm)</span>`,
        diff: fmtDiff(m2.rimIn - m1.rimIn, null, 'in')
      },
      {
        icon: 'fa-circle-notch',
        metric: 'Rolling Circumference',
        v1: `${m1.circumferenceMm.toFixed(1)} mm <span class="calc-val-sub">(${m1.circumferenceIn.toFixed(2)}")</span>`,
        v2: `${m2.circumferenceMm.toFixed(1)} mm <span class="calc-val-sub">(${m2.circumferenceIn.toFixed(2)}")</span>`,
        diff: fmtDiff(d.diffCircumferenceMm, ((d.diffCircumferenceMm / m1.circumferenceMm) * 100), 'mm')
      },
      {
        icon: 'fa-gauge-simple',
        metric: 'Revolutions per km',
        v1: `${Math.round(m1.revsPerKm)} revs/km`,
        v2: `${Math.round(m2.revsPerKm)} revs/km`,
        diff: fmtDiff(d.diffRevsKm, null, 'revs')
      },
      {
        icon: 'fa-road',
        metric: 'Revolutions per mile',
        v1: `${Math.round(m1.revsPerMile)} revs/mi`,
        v2: `${Math.round(m2.revsPerMile)} revs/mi`,
        diff: fmtDiff(m2.revsPerMile - m1.revsPerMile, null, 'revs')
      },
      {
        icon: 'fa-car',
        metric: 'Ground Clearance / Ride Height',
        v1: `Baseline (0.0 mm)`,
        v2: `${d.rideHeightChangeMm > 0 ? '+' : ''}${d.rideHeightChangeMm.toFixed(1)} mm`,
        diff: fmtDiff(d.rideHeightChangeMm, null, 'mm')
      }
    ];

    dom.matrixTableBody.innerHTML = rows.map(r => `
      <tr>
        <td class="col-metric"><i class="fa-solid ${r.icon}"></i> ${r.metric}</td>
        <td><span class="calc-val-main">${r.v1}</span></td>
        <td><span class="calc-val-main">${r.v2}</span></td>
        <td>${r.diff}</td>
      </tr>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // Speedometer Calibration Renderer (Bottom section)
  // --------------------------------------------------------------------------
  function renderSpeedometer(m1, m2, diffPct) {
    const factor = m2.diameterMm / m1.diameterMm;
    const speedoAt100 = 100 * factor;

    if (dom.speedoReadingActual) {
      dom.speedoReadingActual.textContent = `${speedoAt100.toFixed(1)} km/h`;
    }

    if (dom.speedoNoticeText) {
      if (Math.abs(diffPct) < 0.2) {
        dom.speedoNoticeText.textContent = 'Both tyres have identical rolling diameters. Speedometer readings will be exact.';
      } else if (diffPct > 0) {
        dom.speedoNoticeText.textContent = `The new tyre is larger and rotates fewer times per km. Your speedometer will read SLOWER than your actual road speed. (When displaying 100 km/h, your actual speed is ${speedoAt100.toFixed(1)} km/h).`;
      } else {
        dom.speedoNoticeText.textContent = `The new tyre is smaller and rotates faster. Your speedometer will read FASTER than your actual road speed. (When displaying 100 km/h, your actual speed is ${speedoAt100.toFixed(1)} km/h).`;
      }
    }

    if (dom.speedoTableBody) {
      const sampleSpeeds = [30, 50, 80, 100, 120, 140];
      dom.speedoTableBody.innerHTML = sampleSpeeds.map(s => {
        const actual = s * factor;
        const delta = actual - s;
        return `
          <tr>
            <td><strong>${s} km/h</strong></td>
            <td><strong style="color:var(--calc-sky-dark);">${actual.toFixed(1)} km/h</strong></td>
            <td>${fmtDiff(delta, null, 'km/h')}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // --------------------------------------------------------------------------
  // Alternative Sizes Generator
  // --------------------------------------------------------------------------
  function renderAlternativeSizes(m1) {
    if (!dom.alternativesGrid) return;

    const baseDiameter = m1.diameterMm;
    const alternatives = [];

    const targetRims = [m1.rimIn - 1, m1.rimIn, m1.rimIn + 1, m1.rimIn + 2].filter(r => r >= 13 && r <= 22);

    for (const rim of targetRims) {
      for (const width of WIDTHS) {
        for (const aspect of ASPECTS) {
          if (width === m1.widthMm && aspect === m1.aspect && rim === m1.rimIn) continue;

          const candMetrics = calculateTyreMetrics({ width, aspect, rim });
          const diffMm = candMetrics.diameterMm - baseDiameter;
          const diffPct = ((diffMm / baseDiameter) * 100);

          if (Math.abs(diffPct) <= 2.2) {
            alternatives.push({
              width,
              aspect,
              rim,
              sizeStr: `${width}/${aspect} R${rim}`,
              diameterMm: candMetrics.diameterMm,
              diffPct,
              diffMm
            });
          }
        }
      }
    }

    alternatives.sort((a, b) => Math.abs(a.diffPct) - Math.abs(b.diffPct));
    const topAlternatives = alternatives.slice(0, 9);

    if (topAlternatives.length === 0) {
      dom.alternativesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--calc-slate-500);">
          No alternative sizes found within ±2.2% diameter of ${m1.sizeStr}.
        </div>
      `;
      return;
    }

    dom.alternativesGrid.innerHTML = topAlternatives.map(alt => {
      const pSign = alt.diffPct > 0 ? '+' : '';
      return `
        <div class="calc-alt-card">
          <div>
            <div class="calc-alt-size">${alt.sizeStr}</div>
            <div class="calc-alt-details">
              Ø ${alt.diameterMm.toFixed(0)} mm &nbsp;|&nbsp; 
              <span style="font-weight:700; color:${Math.abs(alt.diffPct) <= 1.0 ? 'var(--calc-green)' : 'var(--calc-navy)'};">
                ${pSign}${alt.diffPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="calc-btn-sm calc-btn-copy btn-use-alt" data-width="${alt.width}" data-aspect="${alt.aspect}" data-rim="${alt.rim}" title="Set as Size 2">
              Compare
            </button>
            <a href="shop.html?search=${encodeURIComponent(alt.sizeStr)}" class="calc-btn-sm calc-btn-shop" title="Find in Shop">
              <i class="fa-solid fa-cart-shopping"></i> Stock
            </a>
          </div>
        </div>
      `;
    }).join('');

    dom.alternativesGrid.querySelectorAll('.btn-use-alt').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = Number(btn.dataset.width);
        const a = Number(btn.dataset.aspect);
        const r = Number(btn.dataset.rim);

        state.t2 = { width: w, aspect: a, rim: r };
        switchTab('comparison');

        const el = document.getElementById('calc-workspace-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // --------------------------------------------------------------------------
  // Update Call-To-Action Links
  // --------------------------------------------------------------------------
  function updateCtas(m1, m2, diffPct) {
    if (dom.shopSearchT2Btn) {
      dom.shopSearchT2Btn.href = `shop.html?search=${encodeURIComponent(m2.sizeStr)}`;
      dom.shopSearchT2Btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Find ${m2.sizeStr} in Shop`;
    }

    if (dom.whatsappBtn) {
      const pSign = diffPct > 0 ? '+' : '';
      const text = encodeURIComponent(
        `Hello Sesco Tyres, I used your Tyre Size Calculator to compare my current tyre (${m1.sizeStr}) with alternative (${m2.sizeStr}, difference: ${pSign}${diffPct.toFixed(1)}%). Can you confirm availability and fitting at your Queen's Way workshop?`
      );
      dom.whatsappBtn.href = `https://wa.me/256709828766?text=${text}`;
    }
  }

  // --------------------------------------------------------------------------
  // Tab Switching
  // --------------------------------------------------------------------------
  function switchTab(tab) {
    state.activeTab = tab;
    if (tab === 'calculator') {
      dom.tabCalculator?.classList.add('active');
      dom.tabCalculator?.setAttribute('aria-selected', 'true');
      dom.tabComparison?.classList.remove('active');
      dom.tabComparison?.setAttribute('aria-selected', 'false');

      dom.paneCalc?.classList.add('active');
      dom.paneCmp?.classList.remove('active');
    } else {
      dom.tabComparison?.classList.add('active');
      dom.tabComparison?.setAttribute('aria-selected', 'true');
      dom.tabCalculator?.classList.remove('active');
      dom.tabCalculator?.setAttribute('aria-selected', 'false');

      dom.paneCmp?.classList.add('active');
      dom.paneCalc?.classList.remove('active');
    }
    render();
    if (window.AOS && typeof window.AOS.refresh === 'function') {
      window.AOS.refresh();
    }
  }

  // --------------------------------------------------------------------------
  // Unit Switching
  // --------------------------------------------------------------------------
  function setUnit(unit) {
    state.unit = unit;
    document.querySelectorAll('.calc-unit-choice').forEach(btn => {
      if (btn.dataset.unit === unit) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    render();
    if (window.AOS && typeof window.AOS.refresh === 'function') {
      window.AOS.refresh();
    }
  }

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------
  function attachEvents() {
    // Tab Clicks
    dom.tabCalculator?.addEventListener('click', () => switchTab('calculator'));
    dom.tabComparison?.addEventListener('click', () => switchTab('comparison'));

    // Convert to Different Wheel Size? button
    dom.btnConvertWheel?.addEventListener('click', () => {
      switchTab('comparison');
      if (dom.cmpR2) {
        dom.cmpR2.focus();
        dom.cmpR2.select();
      }
    });

    // Unit toggle buttons
    document.querySelectorAll('.calc-unit-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.unit;
        if (u) setUnit(u);
      });
    });

    // Single Tyre Input Changes
    function onSingleInput() {
      const w = Number(dom.singleW.value) || state.t1.width;
      const a = Number(dom.singleA.value) || state.t1.aspect;
      const r = Number(dom.singleR.value) || state.t1.rim;
      state.t1 = { width: w, aspect: a, rim: r };
      render();
    }

    dom.singleW?.addEventListener('change', onSingleInput);
    dom.singleA?.addEventListener('change', onSingleInput);
    dom.singleR?.addEventListener('change', onSingleInput);

    dom.singleW?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSingleInput(); });
    dom.singleA?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSingleInput(); });
    dom.singleR?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSingleInput(); });

    dom.btnCalcSingle?.addEventListener('click', onSingleInput);

    // Comparison Tyre Input Changes
    function onCmpInput() {
      const w1 = Number(dom.cmpW1.value) || state.t1.width;
      const a1 = Number(dom.cmpA1.value) || state.t1.aspect;
      const r1 = Number(dom.cmpR1.value) || state.t1.rim;

      const w2 = Number(dom.cmpW2.value) || state.t2.width;
      const a2 = Number(dom.cmpA2.value) || state.t2.aspect;
      const r2 = Number(dom.cmpR2.value) || state.t2.rim;

      state.t1 = { width: w1, aspect: a1, rim: r1 };
      state.t2 = { width: w2, aspect: a2, rim: r2 };
      render();
    }

    dom.cmpW1?.addEventListener('change', onCmpInput);
    dom.cmpA1?.addEventListener('change', onCmpInput);
    dom.cmpR1?.addEventListener('change', onCmpInput);
    dom.cmpW2?.addEventListener('change', onCmpInput);
    dom.cmpA2?.addEventListener('change', onCmpInput);
    dom.cmpR2?.addEventListener('change', onCmpInput);

    dom.cmpW1?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCmpInput(); });
    dom.cmpA1?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCmpInput(); });
    dom.cmpR1?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCmpInput(); });
    dom.cmpW2?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCmpInput(); });
    dom.cmpA2?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCmpInput(); });
    dom.cmpR2?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCmpInput(); });

    dom.btnCalcCompare?.addEventListener('click', onCmpInput);
  }


  // --------------------------------------------------------------------------
  // Wheel Size Charts Dataset & Logic (13" to 30")
  // --------------------------------------------------------------------------
  const WHEEL_CHARTS_DATA = {"13":[{"diamGroup":"21\" Tire Diameter","items":[{"size":"185/60R13","calc":"21.7x7.3R13","diam":21.7,"w":185,"a":60,"r":13},{"size":"215/50R13","calc":"21.5X8.5R13","diam":21.5,"w":215,"a":50,"r":13},{"size":"225/45R13","calc":"21x8.9R13","diam":21,"w":225,"a":45,"r":13},{"size":"225/50R13","calc":"21.9x8.9R13","diam":21.9,"w":225,"a":50,"r":13},{"size":"255/40R13","calc":"21x10R13","diam":21,"w":255,"a":40,"r":13}]},{"diamGroup":"22\" Tire Diameter","items":[{"size":"155/80R13","calc":"22.8x6.1R13","diam":22.8,"w":155,"a":80,"r":13},{"size":"175/70R13","calc":"22.6x6.9R13","diam":22.6,"w":175,"a":70,"r":13},{"size":"205/60R13","calc":"22.7x8.1R13","diam":22.7,"w":205,"a":60,"r":13},{"size":"22X8R13","calc":"","diam":22,"w":203,"a":56,"r":13}]},{"diamGroup":"23\" Tire Diameter","items":[{"size":"165/80R13","calc":"23.4X6.5R13","diam":23.4,"w":165,"a":80,"r":13},{"size":"185/70R13","calc":"23.2x7.3R13","diam":23.2,"w":185,"a":70,"r":13}]},{"diamGroup":"24\" Tire Diameter","items":[{"size":"175/80R13","calc":"24.0x6.9R13","diam":24.023622047244096,"w":175,"a":80,"r":13},{"size":"185/80R13","calc":"24.7x7.3R13","diam":24.653543307086615,"w":185,"a":80,"r":13},{"size":"24.5X8R13","calc":"","diam":24.5,"w":203,"a":72,"r":13},{"size":"24.5X9R13","calc":"","diam":24.5,"w":229,"a":64,"r":13}]}],"14":[{"diamGroup":"19\" Tire Diameter","items":[{"size":"105/70R14","calc":"19.8X4.1R14","diam":19.8,"w":105,"a":70,"r":14}]},{"diamGroup":"20\" Tire Diameter","items":[{"size":"115/70R14","calc":"20.3X4.5R14","diam":20.3,"w":115,"a":70,"r":14},{"size":"125/70R14","calc":"20.9X4.9R14","diam":20.9,"w":125,"a":70,"r":14}]},{"diamGroup":"21\" Tire Diameter","items":[{"size":"165/55R14","calc":"21.1X6.5R14","diam":21.1,"w":165,"a":55,"r":14}]},{"diamGroup":"22\" Tire Diameter","items":[{"size":"135/80R14","calc":"22.5X5.3R14","diam":22.5,"w":135,"a":80,"r":14},{"size":"165/65R14","calc":"22.4x6.5R14","diam":22.4,"w":165,"a":65,"r":14},{"size":"185/55R14","calc":"22x7.3R14","diam":22,"w":185,"a":55,"r":14},{"size":"185/60R14","calc":"22.7x7.3R14","diam":22.7,"w":185,"a":60,"r":14},{"size":"195/55R14","calc":"22.4x7.7R14","diam":22.4,"w":195,"a":55,"r":14},{"size":"205/50R14","calc":"22.1x8.1R14","diam":22.1,"w":205,"a":50,"r":14},{"size":"205/55R14","calc":"22.9x8.1R14","diam":22.9,"w":205,"a":55,"r":14},{"size":"225/50R14","calc":"22.9x8.9R14","diam":22.9,"w":225,"a":50,"r":14}]},{"diamGroup":"23\" Tire Diameter","items":[{"size":"175/65R14","calc":"23x6.9R14","diam":23,"w":175,"a":65,"r":14},{"size":"175/70R14","calc":"23.6x6.9R14","diam":23.6,"w":175,"a":70,"r":14},{"size":"185/65R14","calc":"23.5x7.3R14","diam":23.5,"w":185,"a":65,"r":14},{"size":"195/60R14","calc":"23.2x7.7R14","diam":23.2,"w":195,"a":60,"r":14},{"size":"205/60R14","calc":"23.7x8.1R14","diam":23.7,"w":205,"a":60,"r":14}]},{"diamGroup":"24\" Tire Diameter","items":[{"size":"185/70R14","calc":"24.2x7.3R14","diam":24.2,"w":185,"a":70,"r":14},{"size":"185/75R14","calc":"24.9X7.3R14","diam":24.9,"w":185,"a":75,"r":14},{"size":"195/65R14","calc":"24x7.7R14","diam":24,"w":195,"a":65,"r":14},{"size":"195/70R14","calc":"24.7x7.7R14","diam":24.7,"w":195,"a":70,"r":14},{"size":"215/60R14","calc":"24.2x8.5R14","diam":24.2,"w":215,"a":60,"r":14},{"size":"225/60R14","calc":"24.6x8.9R14","diam":24.6,"w":225,"a":60,"r":14}]},{"diamGroup":"25\" Tire Diameter","items":[{"size":"185R14","calc":"25.7x7.3R14","diam":25.7,"w":185,"a":80,"r":14},{"size":"195/75R14","calc":"25.5x7.7R14","diam":25.5,"w":195,"a":75,"r":14},{"size":"205/70R14","calc":"25.3x8.1R14","diam":25.3,"w":205,"a":70,"r":14},{"size":"215/70R14","calc":"25.9x8.5R14","diam":25.9,"w":215,"a":70,"r":14},{"size":"235/60R14","calc":"25.1x9.3R14","diam":25.1,"w":235,"a":60,"r":14},{"size":"245/60R14","calc":"25.6x9.6R14","diam":25.6,"w":245,"a":60,"r":14}]},{"diamGroup":"26\" Tire Diameter","items":[{"size":"195R14","calc":"26.2x7.8R14","diam":26.2,"w":195,"a":80,"r":14},{"size":"205/75R14","calc":"26.1x8.1R14","diam":26.1,"w":205,"a":75,"r":14},{"size":"215/75R14","calc":"26.7x8.5R14","diam":26.7,"w":215,"a":75,"r":14},{"size":"225/70R14","calc":"26.4x8.9R14","diam":26.4,"w":225,"a":70,"r":14},{"size":"26X8.5R14","calc":"","diam":26,"w":216,"a":70,"r":14}]},{"diamGroup":"27\" Tire Diameter","items":[{"size":"205R14","calc":"27x8.2R14","diam":27,"w":205,"a":80,"r":14},{"size":"27X8.5R14","calc":"","diam":27,"w":216,"a":76,"r":14},{"size":"27X9.5R14","calc":"","diam":27,"w":241,"a":68,"r":14}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"28X10R14","calc":"","diam":28,"w":254,"a":70,"r":14}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"30X10R14","calc":"","diam":30,"w":254,"a":80,"r":14}]}],"15":[{"diamGroup":"20\" Tire Diameter","items":[{"size":"105/70R15","calc":"20.8X4.1R15","diam":20.8,"w":105,"a":70,"r":15}]},{"diamGroup":"21\" Tire Diameter","items":[{"size":"115/70R15","calc":"21.3X4.5R15","diam":21.3,"w":115,"a":70,"r":15},{"size":"125/70R15","calc":"21.9X4.9R15","diam":21.9,"w":125,"a":70,"r":15},{"size":"165/50R15","calc":"21.5X6.5R15","diam":21.5,"w":165,"a":50,"r":15},{"size":"195/45R15","calc":"21.9x7.7R15","diam":21.9,"w":195,"a":45,"r":15}]},{"diamGroup":"22\" Tire Diameter","items":[{"size":"125/80R15","calc":"22.9X4.9R15","diam":22.9,"w":125,"a":80,"r":15},{"size":"145/65R15","calc":"22.4x5.7R15","diam":22.4,"w":145,"a":65,"r":15},{"size":"155/60R15","calc":"22.3x6.1R15","diam":22.3,"w":155,"a":60,"r":15},{"size":"165/60R15","calc":"22.8x6.5R15","diam":22.8,"w":165,"a":60,"r":15},{"size":"175/55R15","calc":"22.6x6.9R15","diam":22.6,"w":175,"a":55,"r":15},{"size":"195/50R15","calc":"22.7x7.7R15","diam":22.7,"w":195,"a":50,"r":15},{"size":"22X8R15","calc":"","diam":22,"w":203,"a":44,"r":15},{"size":"22.5X4.5R15","calc":"","diam":22.5,"w":114,"a":83,"r":15},{"size":"245/40R15","calc":"22.7X9.6R15","diam":22.7,"w":245,"a":40,"r":15},{"size":"275/35R15","calc":"22.6x10.8R15","diam":22.6,"w":275,"a":35,"r":15}]},{"diamGroup":"23\" Tire Diameter","items":[{"size":"135/80R15","calc":"23.5X5.3R15","diam":23.5,"w":135,"a":80,"r":15},{"size":"165/65R15","calc":"23.4X6.5R15","diam":23.4,"w":165,"a":65,"r":15},{"size":"175/60R15","calc":"23.3x6.9R15","diam":23.3,"w":175,"a":60,"r":15},{"size":"185/55R15","calc":"23x7.3R15","diam":23,"w":185,"a":55,"r":15},{"size":"185/60R15","calc":"23.7x7.3R15","diam":23.7,"w":185,"a":60,"r":15},{"size":"195/55R15","calc":"23.4x7.7R15","diam":23.4,"w":195,"a":55,"r":15},{"size":"205/50R15","calc":"23.1x8.1R15","diam":23.1,"w":205,"a":50,"r":15},{"size":"205/55R15","calc":"23.9x8.1R15","diam":23.9,"w":205,"a":55,"r":15},{"size":"225/45R15","calc":"23x8.9R15","diam":23,"w":225,"a":45,"r":15},{"size":"225/50R15","calc":"23.9x8.9R15","diam":23.9,"w":225,"a":50,"r":15},{"size":"295/35R15","calc":"23.1X11.6R15","diam":23.1,"w":295,"a":35,"r":15}]},{"diamGroup":"24\" Tire Diameter","items":[{"size":"135/90R15","calc":"24.6X5.3R15","diam":24.6,"w":135,"a":90,"r":15},{"size":"155/80R15","calc":"24.8X6.1R15","diam":24.8,"w":155,"a":80,"r":15},{"size":"175/65R15","calc":"24x6.9R15","diam":24,"w":175,"a":65,"r":15},{"size":"185/65R15","calc":"24.5x7.3R15","diam":24.5,"w":185,"a":65,"r":15},{"size":"195/60R15","calc":"24.2x7.7R15","diam":24.2,"w":195,"a":60,"r":15},{"size":"205/60R15","calc":"24.7x8.1R15","diam":24.7,"w":205,"a":60,"r":15},{"size":"225/55R15","calc":"24.7x8.9R15","diam":24.7,"w":225,"a":55,"r":15},{"size":"235/50R15","calc":"24.3x9.3R15","diam":24.3,"w":235,"a":50,"r":15},{"size":"24X4.5R15","calc":"","diam":24,"w":114,"a":100,"r":15},{"size":"24X5R15","calc":"","diam":24,"w":127,"a":90,"r":15},{"size":"24.5X8R15","calc":"","diam":24.5,"w":203,"a":59,"r":15},{"size":"245/50R15","calc":"24.6x9.6R15","diam":24.6,"w":245,"a":50,"r":15},{"size":"345/35R15","calc":"24.5x13.6R15","diam":24.5,"w":345,"a":35,"r":15}]},{"diamGroup":"25\" Tire Diameter","items":[{"size":"165/80R15","calc":"25.4X6.5R15","diam":25.4,"w":165,"a":80,"r":15},{"size":"185/70R15","calc":"25.2x7.3R15","diam":25.2,"w":185,"a":70,"r":15},{"size":"195/65R15","calc":"25x7.7R15","diam":25,"w":195,"a":65,"r":15},{"size":"195/70R15","calc":"25.7x7.7R15","diam":25.7,"w":195,"a":70,"r":15},{"size":"205/65R15","calc":"25.5x8.1R15","diam":25.5,"w":205,"a":65,"r":15},{"size":"215/60R15","calc":"25.2x8.5R15","diam":25.2,"w":215,"a":60,"r":15},{"size":"225/60R15","calc":"25.6x8.9R15","diam":25.6,"w":225,"a":60,"r":15},{"size":"265/50R15","calc":"25.4X10.4R15","diam":25.4,"w":265,"a":50,"r":15},{"size":"275/50R15","calc":"25.8x10.8R15","diam":25.8,"w":275,"a":50,"r":15}]},{"diamGroup":"26\" Tire Diameter","items":[{"size":"205/70R15","calc":"26.3x8.1R15","diam":26.3,"w":205,"a":70,"r":15},{"size":"215/65R15","calc":"26x8.5R15","diam":26,"w":215,"a":65,"r":15},{"size":"215/70R15","calc":"26.9x8.5R15","diam":26.9,"w":215,"a":70,"r":15},{"size":"235/60R15","calc":"26.1x9.3R15","diam":26.1,"w":235,"a":60,"r":15},{"size":"245/60R15","calc":"26.6x9.6R15","diam":26.6,"w":245,"a":60,"r":15},{"size":"26X10R15","calc":"","diam":26,"w":254,"a":55,"r":15},{"size":"26X10.5R15","calc":"","diam":26,"w":267,"a":52,"r":15},{"size":"26X11.5R15","calc":"","diam":26,"w":292,"a":48,"r":15},{"size":"26X6R15","calc":"","diam":26,"w":152,"a":92,"r":15},{"size":"26X7.5R15","calc":"","diam":26,"w":191,"a":73,"r":15},{"size":"26X8R15","calc":"","diam":26,"w":203,"a":69,"r":15},{"size":"26X8.5R15","calc":"","diam":26,"w":216,"a":65,"r":15},{"size":"295/50R15","calc":"26.6x11.6R15","diam":26.6,"w":295,"a":50,"r":15}]},{"diamGroup":"27\" Tire Diameter","items":[{"size":"205/75R15","calc":"27.1x8.1R15","diam":27.1,"w":205,"a":75,"r":15},{"size":"215/75R15","calc":"27.7x8.5R15","diam":27.7,"w":215,"a":75,"r":15},{"size":"225/70R15","calc":"27.4x8.9R15","diam":27.4,"w":225,"a":70,"r":15},{"size":"255/60R15","calc":"27x10R15","diam":27,"w":255,"a":60,"r":15},{"size":"27X10.5R15","calc":"","diam":27,"w":267,"a":57,"r":15},{"size":"27X9.5R15","calc":"","diam":27,"w":241,"a":63,"r":15},{"size":"27.5X4.5R15","calc":"","diam":27.5,"w":114,"a":139,"r":15},{"size":"295/55R15","calc":"27.8X11.6R15","diam":27.8,"w":295,"a":55,"r":15},{"size":"325/50R15","calc":"27.8x12.8R15","diam":27.8,"w":325,"a":50,"r":15},{"size":"E78-15","calc":"27x6.5R15","diam":27,"w":165,"a":92,"r":15}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"225/75R15","calc":"28.3x8.9R15","diam":28.3,"w":225,"a":75,"r":15},{"size":"235/70R15","calc":"28x9.3R15","diam":28,"w":235,"a":70,"r":15},{"size":"235/75R15","calc":"28.9x9.3R15","diam":28.9,"w":235,"a":75,"r":15},{"size":"245/70R15","calc":"28.5X9.6R15","diam":28.5,"w":245,"a":70,"r":15},{"size":"255/65R15","calc":"28.1x10R15","diam":28.1,"w":255,"a":65,"r":15},{"size":"275/60R15","calc":"28x10.8R15","diam":28,"w":275,"a":60,"r":15},{"size":"28X10.5R15","calc":"","diam":28,"w":267,"a":62,"r":15},{"size":"28X11.5R15","calc":"","diam":28,"w":292,"a":57,"r":15},{"size":"28X12.5R15","calc":"","diam":28,"w":318,"a":52,"r":15},{"size":"28X13.5R15","calc":"","diam":28,"w":343,"a":48,"r":15},{"size":"28X4.5R15","calc":"","diam":28,"w":114,"a":144,"r":15},{"size":"28X7.5R15","calc":"","diam":28,"w":191,"a":87,"r":15},{"size":"28X9R15","calc":"","diam":28,"w":229,"a":72,"r":15}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"215/85R15","calc":"29.4X8.5R15","diam":29.4,"w":215,"a":85,"r":15},{"size":"255/70R15","calc":"29.1x10R15","diam":29.1,"w":255,"a":70,"r":15},{"size":"265/70R15","calc":"29.6x10.4R15","diam":29.6,"w":265,"a":70,"r":15},{"size":"29X10.5R15","calc":"","diam":29,"w":267,"a":67,"r":15},{"size":"29X11.5R15","calc":"","diam":29,"w":292,"a":61,"r":15},{"size":"29X12.5R15","calc":"","diam":29,"w":318,"a":56,"r":15},{"size":"29X15.5R15","calc":"","diam":29,"w":394,"a":45,"r":15},{"size":"29X18R15","calc":"","diam":29,"w":457,"a":39,"r":15},{"size":"29X18.5R15","calc":"","diam":29,"w":470,"a":38,"r":15},{"size":"29X4.5R15","calc":"","diam":29,"w":114,"a":156,"r":15},{"size":"29X8.5R15","calc":"","diam":29,"w":216,"a":82,"r":15},{"size":"29.5X11.5R15","calc":"","diam":29.5,"w":292,"a":63,"r":15},{"size":"29.5X13.5R15","calc":"","diam":29.5,"w":343,"a":54,"r":15},{"size":"29.5X9R15","calc":"","diam":29.5,"w":229,"a":81,"r":15},{"size":"315/60R15","calc":"29.9x12.4R15","diam":29.9,"w":315,"a":60,"r":15},{"size":"7R15","calc":"29.5x7.7R15","diam":29.5,"w":196,"a":94,"r":15}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"255/75R15","calc":"30.1x10R15","diam":30.1,"w":255,"a":75,"r":15},{"size":"265/75R15","calc":"30.6x10.4R15","diam":30.6,"w":265,"a":75,"r":15},{"size":"295/65R15","calc":"30.1x11.6R15","diam":30.1,"w":295,"a":65,"r":15},{"size":"30X10R15","calc":"","diam":30,"w":254,"a":75,"r":15},{"size":"30X10.5R15","calc":"","diam":30,"w":267,"a":71,"r":15},{"size":"30X11.5R15","calc":"","diam":30,"w":292,"a":65,"r":15},{"size":"30X12.5R15","calc":"","diam":30,"w":318,"a":60,"r":15},{"size":"30X13.5R15","calc":"","diam":30,"w":343,"a":56,"r":15},{"size":"30X7R15","calc":"","diam":30,"w":178,"a":107,"r":15},{"size":"30X9R15","calc":"","diam":30,"w":229,"a":83,"r":15},{"size":"30X9.5R15","calc":"","diam":30,"w":241,"a":79,"r":15}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"31X10.5R15","calc":"","diam":31,"w":267,"a":76,"r":15},{"size":"31X11R15","calc":"","diam":31,"w":279,"a":73,"r":15},{"size":"31X11.5R15","calc":"","diam":31,"w":292,"a":70,"r":15},{"size":"31X12.5R15","calc":"","diam":31,"w":318,"a":64,"r":15},{"size":"31X13R15","calc":"","diam":31,"w":330,"a":62,"r":15},{"size":"31X13.5R15","calc":"","diam":31,"w":343,"a":59,"r":15},{"size":"31X14.5R15","calc":"","diam":31,"w":368,"a":55,"r":15},{"size":"31X16.5R15","calc":"","diam":31,"w":419,"a":48,"r":15},{"size":"31X18R15","calc":"","diam":31,"w":457,"a":44,"r":15},{"size":"31X18.5R15","calc":"","diam":31,"w":470,"a":43,"r":15},{"size":"31X9.5R15","calc":"","diam":31,"w":241,"a":84,"r":15}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"32X10.5R15","calc":"","diam":32,"w":267,"a":81,"r":15},{"size":"32X11.5R15","calc":"","diam":32,"w":292,"a":74,"r":15},{"size":"32X14R15","calc":"","diam":32,"w":356,"a":61,"r":15},{"size":"32X16R15","calc":"","diam":32,"w":406,"a":53,"r":15},{"size":"32X17.5R15","calc":"","diam":32,"w":445,"a":49,"r":15},{"size":"32X18.5R15","calc":"","diam":32,"w":470,"a":46,"r":15},{"size":"32X9.5R15","calc":"","diam":32,"w":241,"a":89,"r":15}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"33X10.5R15","calc":"","diam":33,"w":267,"a":86,"r":15},{"size":"33X11.5R15","calc":"","diam":33,"w":292,"a":78,"r":15},{"size":"33X12.5R15","calc":"","diam":33,"w":318,"a":72,"r":15},{"size":"33X13R15","calc":"","diam":33,"w":330,"a":69,"r":15},{"size":"33X13.5R15","calc":"","diam":33,"w":343,"a":67,"r":15},{"size":"33X14R15","calc":"","diam":33,"w":356,"a":64,"r":15},{"size":"33X14.5R15","calc":"","diam":33,"w":368,"a":62,"r":15},{"size":"33X15.5R15","calc":"","diam":33,"w":394,"a":58,"r":15},{"size":"33X16.5R15","calc":"","diam":33,"w":419,"a":55,"r":15},{"size":"33X19.5R15","calc":"","diam":33,"w":495,"a":46,"r":15},{"size":"33X21.5R15","calc":"","diam":33,"w":546,"a":42,"r":15},{"size":"33X9R15","calc":"","diam":33,"w":229,"a":100,"r":15},{"size":"33X9.5R15","calc":"","diam":33,"w":241,"a":95,"r":15}]},{"diamGroup":"34\" Tire Diameter","items":[{"size":"34X10.5R15","calc":"","diam":34,"w":267,"a":90,"r":15},{"size":"34X12.5R15","calc":"","diam":34,"w":318,"a":76,"r":15},{"size":"34X9.5R15","calc":"","diam":34,"w":241,"a":100,"r":15}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"35X10.5R15","calc":"","diam":35,"w":267,"a":95,"r":15},{"size":"35X12.5R15","calc":"","diam":35,"w":318,"a":80,"r":15},{"size":"35X13.5R15","calc":"","diam":35,"w":343,"a":74,"r":15},{"size":"35X14.5R15","calc":"","diam":35,"w":368,"a":69,"r":15},{"size":"35X15R15","calc":"","diam":35,"w":381,"a":67,"r":15},{"size":"35X15.5R15","calc":"","diam":35,"w":394,"a":65,"r":15},{"size":"35X16R15","calc":"","diam":35,"w":406,"a":63,"r":15}]},{"diamGroup":"36\" Tire Diameter","items":[{"size":"36X12.5R15","calc":"","diam":36,"w":318,"a":84,"r":15},{"size":"36X13.5R15","calc":"","diam":36,"w":343,"a":78,"r":15},{"size":"36X14.5R15","calc":"","diam":36,"w":368,"a":72,"r":15}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X12.5R15","calc":"","diam":37,"w":318,"a":88,"r":15},{"size":"37X13R15","calc":"","diam":37,"w":330,"a":85,"r":15},{"size":"37X13.5R15","calc":"","diam":37,"w":343,"a":81,"r":15},{"size":"37X14R15","calc":"","diam":37,"w":356,"a":79,"r":15},{"size":"37X14.5R15","calc":"","diam":37,"w":368,"a":76,"r":15}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X12.5R15","calc":"","diam":38,"w":318,"a":92,"r":15},{"size":"38X13R15","calc":"","diam":38,"w":330,"a":88,"r":15},{"size":"38X14.5R15","calc":"","diam":38,"w":368,"a":79,"r":15},{"size":"38X15.5R15","calc":"","diam":38,"w":394,"a":74,"r":15},{"size":"38.5X11R15","calc":"","diam":38.5,"w":279,"a":107,"r":15},{"size":"38.5X13.5R15","calc":"","diam":38.5,"w":343,"a":87,"r":15},{"size":"38.5X14.5R15","calc":"","diam":38.5,"w":368,"a":81,"r":15},{"size":"38.5X15R15","calc":"","diam":38.5,"w":381,"a":78,"r":15},{"size":"38.5X16R15","calc":"","diam":38.5,"w":406,"a":73,"r":15}]},{"diamGroup":"39\" Tire Diameter","items":[{"size":"39X13.5R15","calc":"","diam":39,"w":343,"a":89,"r":15},{"size":"39.5X13.5R15","calc":"","diam":39.5,"w":343,"a":91,"r":15},{"size":"39.5X15R15","calc":"","diam":39.5,"w":381,"a":82,"r":15},{"size":"39.5X18R15","calc":"","diam":39.5,"w":457,"a":68,"r":15}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X16R15","calc":"","diam":40,"w":406,"a":78,"r":15}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X14R15","calc":"","diam":42,"w":356,"a":96,"r":15},{"size":"42X15R15","calc":"","diam":42,"w":381,"a":90,"r":15},{"size":"42.5X13.5R15","calc":"","diam":42.5,"w":343,"a":102,"r":15}]},{"diamGroup":"44\" Tire Diameter","items":[{"size":"44X18.5R15","calc":"","diam":44,"w":470,"a":78,"r":15},{"size":"44X19.5R15","calc":"","diam":44,"w":495,"a":74,"r":15},{"size":"44X21R15","calc":"","diam":44,"w":533,"a":69,"r":15}]},{"diamGroup":"47\" Tire Diameter","items":[{"size":"47X17R15","calc":"","diam":47,"w":432,"a":94,"r":15}]}],"16":[{"diamGroup":"22\" Tire Diameter","items":[{"size":"125/70R16","calc":"22.9X4.9R16","diam":22.9,"w":125,"a":70,"r":16},{"size":"175/50R16","calc":"22.9x6.9R16","diam":22.9,"w":175,"a":50,"r":16},{"size":"195/40R16","calc":"22.1x7.7R16","diam":22.1,"w":195,"a":40,"r":16},{"size":"195/45R16","calc":"22.9x7.7R16","diam":22.9,"w":195,"a":45,"r":16},{"size":"205/40R16","calc":"22.5x8.1R16","diam":22.5,"w":205,"a":40,"r":16},{"size":"215/35R16","calc":"21.9x8.5R16","diam":21.9,"w":215,"a":35,"r":16},{"size":"215/40R16","calc":"22.8x8.5R16","diam":22.8,"w":215,"a":40,"r":16}]},{"diamGroup":"23\" Tire Diameter","items":[{"size":"125/80R16","calc":"23.9X4.9R16","diam":23.9,"w":125,"a":80,"r":16},{"size":"135/70R16","calc":"23.4X5.3R16","diam":23.4,"w":135,"a":70,"r":16},{"size":"175/55R16","calc":"23.6x6.9R16","diam":23.6,"w":175,"a":55,"r":16},{"size":"185/50R16","calc":"23.3X7.3R16","diam":23.3,"w":185,"a":50,"r":16},{"size":"195/50R16","calc":"23.7x7.7R16","diam":23.7,"w":195,"a":50,"r":16},{"size":"205/45R16","calc":"23.3x8.1R16","diam":23.3,"w":205,"a":45,"r":16},{"size":"215/45R16","calc":"23.6x8.5R16","diam":23.6,"w":215,"a":45,"r":16}]},{"diamGroup":"24\" Tire Diameter","items":[{"size":"125/85R16","calc":"24.4X4.9R16","diam":24.4,"w":125,"a":85,"r":16},{"size":"125/90R16","calc":"24.9X4.9R16","diam":24.9,"w":125,"a":90,"r":16},{"size":"135/80R16","calc":"24.5X5.3R16","diam":24.5,"w":135,"a":80,"r":16},{"size":"175/60R16","calc":"24.3x6.9R16","diam":24.3,"w":175,"a":60,"r":16},{"size":"185/55R16","calc":"24x7.3R16","diam":24,"w":185,"a":55,"r":16},{"size":"185/60R16","calc":"24.7X7.3R16","diam":24.7,"w":185,"a":60,"r":16},{"size":"195/55R16","calc":"24.4x7.7R16","diam":24.4,"w":195,"a":55,"r":16},{"size":"205/50R16","calc":"24.1x8.1R16","diam":24.1,"w":205,"a":50,"r":16},{"size":"205/55R16","calc":"24.9x8.1R16","diam":24.9,"w":205,"a":55,"r":16},{"size":"215/50R16","calc":"24.5X8.5R16","diam":24.5,"w":215,"a":50,"r":16},{"size":"225/45R16","calc":"24x8.9R16","diam":24,"w":225,"a":45,"r":16},{"size":"225/50R16","calc":"24.9x8.9R16","diam":24.9,"w":225,"a":50,"r":16},{"size":"245/45R16","calc":"24.7x9.6R16","diam":24.7,"w":245,"a":45,"r":16}]},{"diamGroup":"25\" Tire Diameter","items":[{"size":"135/90R16","calc":"25.6X5.3R16","diam":25.6,"w":135,"a":90,"r":16},{"size":"145/80R16","calc":"25.1X5.7R16","diam":25.1,"w":145,"a":80,"r":16},{"size":"195/60R16","calc":"25.2x7.7R16","diam":25.2,"w":195,"a":60,"r":16},{"size":"205/60R16","calc":"25.7x8.1R16","diam":25.7,"w":205,"a":60,"r":16},{"size":"215/55R16","calc":"25.3x8.5R16","diam":25.3,"w":215,"a":55,"r":16},{"size":"225/55R16","calc":"25.7x8.9R16","diam":25.7,"w":225,"a":55,"r":16},{"size":"245/50R16","calc":"25.6x9.6R16","diam":25.6,"w":245,"a":50,"r":16},{"size":"265/45R16","calc":"25.4X10.4R16","diam":25.4,"w":265,"a":45,"r":16},{"size":"275/45R16","calc":"25.7x10.8R16","diam":25.7,"w":275,"a":45,"r":16},{"size":"315/40R16","calc":"25.9X12.4R16","diam":25.9,"w":315,"a":40,"r":16}]},{"diamGroup":"26\" Tire Diameter","items":[{"size":"145/90R16","calc":"26.3X5.7R16","diam":26.3,"w":145,"a":90,"r":16},{"size":"145/90R16","calc":"26.3X5.7R16","diam":26.3,"w":145,"a":90,"r":16},{"size":"195/65R16","calc":"26X7.7R16","diam":26,"w":195,"a":65,"r":16},{"size":"205/65R16","calc":"26.5x8.1R16","diam":26.5,"w":205,"a":65,"r":16},{"size":"215/60R16","calc":"26.2x8.5R16","diam":26.2,"w":215,"a":60,"r":16},{"size":"225/60R16","calc":"26.6x8.9R16","diam":26.6,"w":225,"a":60,"r":16},{"size":"235/55R16","calc":"26.2x9.3R16","diam":26.2,"w":235,"a":55,"r":16},{"size":"255/50R16","calc":"26x10R16","diam":26,"w":255,"a":50,"r":16},{"size":"26X11.5R16","calc":"","diam":26,"w":292,"a":43,"r":16}]},{"diamGroup":"27\" Tire Diameter","items":[{"size":"155/90R16","calc":"27X6.1R16","diam":27,"w":155,"a":90,"r":16},{"size":"195/75R16","calc":"27.5x7.7R16","diam":27.5,"w":195,"a":75,"r":16},{"size":"205/70R16","calc":"27.3x8.1R16","diam":27.3,"w":205,"a":70,"r":16},{"size":"215/65R16","calc":"27x8.5R16","diam":27,"w":215,"a":65,"r":16},{"size":"215/70R16","calc":"27.9x8.5R16","diam":27.9,"w":215,"a":70,"r":16},{"size":"225/65R16","calc":"27.5x8.9R16","diam":27.5,"w":225,"a":65,"r":16},{"size":"235/60R16","calc":"27.1x9.3R16","diam":27.1,"w":235,"a":60,"r":16},{"size":"295/50R16","calc":"27.6x11.6R16","diam":27.6,"w":295,"a":50,"r":16},{"size":"355/40R16","calc":"27.2X14R16","diam":27.2,"w":355,"a":40,"r":16}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"195/80R16","calc":"28.3x7.7R16","diam":28.3,"w":195,"a":80,"r":16},{"size":"205/75R16","calc":"28.1X8.1R16","diam":28.1,"w":205,"a":75,"r":16},{"size":"205/80R16","calc":"28.9x8.1R16","diam":28.9,"w":205,"a":80,"r":16},{"size":"215/75R16","calc":"28.7x8.5R16","diam":28.7,"w":215,"a":75,"r":16},{"size":"225/70R16","calc":"28.4x8.9R16","diam":28.4,"w":225,"a":70,"r":16},{"size":"235/65R16","calc":"28x9.3R16","diam":28,"w":235,"a":65,"r":16},{"size":"255/60R16","calc":"28x10R16","diam":28,"w":255,"a":60,"r":16},{"size":"28X11.5R16","calc":"","diam":28,"w":292,"a":52,"r":16}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"225/75R16","calc":"29.3x8.9R16","diam":29.3,"w":225,"a":75,"r":16},{"size":"235/70R16","calc":"29x9.3R16","diam":29,"w":235,"a":70,"r":16},{"size":"235/75R16","calc":"29.9x9.3R16","diam":29.9,"w":235,"a":75,"r":16},{"size":"245/70R16","calc":"29.5x9.6R16","diam":29.5,"w":245,"a":70,"r":16},{"size":"255/65R16","calc":"29.1x10R16","diam":29.1,"w":255,"a":65,"r":16},{"size":"275/60R16","calc":"29X10.8R16","diam":29,"w":275,"a":60,"r":16},{"size":"285/60R16","calc":"29.5X11.2R16","diam":29.5,"w":285,"a":60,"r":16}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"215/85R16","calc":"30.4x8.5R16","diam":30.4,"w":215,"a":85,"r":16},{"size":"235/80R16","calc":"30.8x9.3R16","diam":30.8,"w":235,"a":80,"r":16},{"size":"245/75R16","calc":"30.5x9.6R16","diam":30.5,"w":245,"a":75,"r":16},{"size":"255/70R16","calc":"30.1x10R16","diam":30.1,"w":255,"a":70,"r":16},{"size":"265/70R16","calc":"30.6x10.4R16","diam":30.6,"w":265,"a":70,"r":16},{"size":"285/65R16","calc":"30.6X11.2R16","diam":30.6,"w":285,"a":65,"r":16},{"size":"30X11.5R16","calc":"","diam":30,"w":292,"a":61,"r":16}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"225/85R16","calc":"31.1X8.9R16","diam":31.1,"w":225,"a":85,"r":16},{"size":"235/85R16","calc":"31.7x9.3R16","diam":31.7,"w":235,"a":85,"r":16},{"size":"265/75R16","calc":"31.6x10.4R16","diam":31.6,"w":265,"a":75,"r":16},{"size":"275/70R16","calc":"31.2x10.8R16","diam":31.2,"w":275,"a":70,"r":16},{"size":"285/70R16","calc":"31.7x11.2R16","diam":31.7,"w":285,"a":70,"r":16},{"size":"31X10.5R16","calc":"","diam":31,"w":267,"a":71,"r":16},{"size":"31X11R16","calc":"","diam":31,"w":279,"a":68,"r":16},{"size":"31X11.5R16","calc":"","diam":31,"w":292,"a":65,"r":16},{"size":"31X12.5R16","calc":"","diam":31,"w":318,"a":60,"r":16},{"size":"7.5R16","calc":"31.8x8.7R16","diam":31.8,"w":221,"a":91,"r":16}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"265/80R16","calc":"32.7X10.4R16","diam":32.7,"w":265,"a":80,"r":16},{"size":"285/75R16","calc":"32.8x11.2R16","diam":32.8,"w":285,"a":75,"r":16},{"size":"305/70R16","calc":"32.8x12R16","diam":32.8,"w":305,"a":70,"r":16},{"size":"32X10R16","calc":"","diam":32,"w":254,"a":80,"r":16},{"size":"32X11.5R16","calc":"","diam":32,"w":292,"a":70,"r":16},{"size":"32X9R16","calc":"","diam":32,"w":229,"a":89,"r":16}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"255/85R16","calc":"33.1x10R16","diam":33.1,"w":255,"a":85,"r":16},{"size":"295/75R16","calc":"33.4x11.6R16","diam":33.4,"w":295,"a":75,"r":16},{"size":"33X10.5R16","calc":"","diam":33,"w":267,"a":81,"r":16},{"size":"33X11.5R16","calc":"","diam":33,"w":292,"a":74,"r":16},{"size":"33X12.5R16","calc":"","diam":33,"w":318,"a":68,"r":16},{"size":"33X13R16","calc":"","diam":33,"w":330,"a":65,"r":16},{"size":"33X13.5R16","calc":"","diam":33,"w":343,"a":63,"r":16},{"size":"33X14R16","calc":"","diam":33,"w":356,"a":61,"r":16},{"size":"33X14.5R16","calc":"","diam":33,"w":368,"a":59,"r":16},{"size":"33X9.5R16","calc":"","diam":33,"w":241,"a":89,"r":16},{"size":"33.5X16.5R16","calc":"","diam":33.5,"w":419,"a":53,"r":16}]},{"diamGroup":"34\" Tire Diameter","items":[{"size":"315/75R16","calc":"34.6x12.4R16","diam":34.6,"w":315,"a":75,"r":16},{"size":"34X10.5R16","calc":"","diam":34,"w":267,"a":86,"r":16},{"size":"34X12.5R16","calc":"","diam":34,"w":318,"a":72,"r":16},{"size":"34X13.5R16","calc":"","diam":34,"w":343,"a":67,"r":16},{"size":"34X9R16","calc":"","diam":34,"w":229,"a":100,"r":16},{"size":"34.5X17R16","calc":"","diam":34.5,"w":432,"a":54,"r":16}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"35X10.5R16","calc":"","diam":35,"w":267,"a":90,"r":16},{"size":"35X12.5R16","calc":"","diam":35,"w":318,"a":76,"r":16},{"size":"35X14.5R16","calc":"","diam":35,"w":368,"a":66,"r":16},{"size":"35X15R16","calc":"","diam":35,"w":381,"a":63,"r":16},{"size":"35X16R16","calc":"","diam":35,"w":406,"a":59,"r":16},{"size":"375/65R16","calc":"35.2x14.8R16","diam":35.2,"w":375,"a":65,"r":16}]},{"diamGroup":"36\" Tire Diameter","items":[{"size":"325/80R16","calc":"36.5x12.8R16","diam":36.5,"w":325,"a":80,"r":16},{"size":"345/75R16","calc":"36.4x13.6R16","diam":36.4,"w":345,"a":75,"r":16},{"size":"36X12.5R16","calc":"","diam":36,"w":318,"a":80,"r":16},{"size":"36X13R16","calc":"","diam":36,"w":330,"a":77,"r":16},{"size":"36X13.5R16","calc":"","diam":36,"w":343,"a":74,"r":16},{"size":"36X14.5R16","calc":"","diam":36,"w":368,"a":69,"r":16}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"365/75R16","calc":"37.6x14.4R16","diam":37.6,"w":365,"a":75,"r":16},{"size":"37X12.5R16","calc":"","diam":37,"w":318,"a":84,"r":16},{"size":"37X13R16","calc":"","diam":37,"w":330,"a":81,"r":16},{"size":"37X13.5R16","calc":"","diam":37,"w":343,"a":78,"r":16},{"size":"37X14R16","calc":"","diam":37,"w":356,"a":75,"r":16},{"size":"37X14.5R16","calc":"","diam":37,"w":368,"a":72,"r":16},{"size":"385/70R16","calc":"37.2x15.2R16","diam":37.2,"w":385,"a":70,"r":16},{"size":"395/70R16","calc":"37.8x15.6R16","diam":37.8,"w":395,"a":70,"r":16}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X13R16","calc":"","diam":38,"w":330,"a":85,"r":16},{"size":"38X14.5R16","calc":"","diam":38,"w":368,"a":76,"r":16},{"size":"38X15.5R16","calc":"","diam":38,"w":394,"a":71,"r":16},{"size":"38.5X11R16","calc":"","diam":38.5,"w":279,"a":102,"r":16},{"size":"38.5X13.5R16","calc":"","diam":38.5,"w":343,"a":83,"r":16},{"size":"38.5X14.5R16","calc":"","diam":38.5,"w":368,"a":78,"r":16},{"size":"38.5X15R16","calc":"","diam":38.5,"w":381,"a":75,"r":16}]},{"diamGroup":"39\" Tire Diameter","items":[{"size":"39X13.5R16","calc":"","diam":39,"w":343,"a":85,"r":16},{"size":"39.5X13.5R16","calc":"","diam":39.5,"w":343,"a":87,"r":16},{"size":"39.5X15R16","calc":"","diam":39.5,"w":381,"a":78,"r":16}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X16R16","calc":"","diam":40,"w":406,"a":75,"r":16}]},{"diamGroup":"41\" Tire Diameter","items":[{"size":"41X14.5R16","calc":"","diam":41,"w":368,"a":86,"r":16}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X14R16","calc":"","diam":42,"w":356,"a":93,"r":16},{"size":"42X15R16","calc":"","diam":42,"w":381,"a":87,"r":16},{"size":"42.5X13.5R16","calc":"","diam":42.5,"w":343,"a":98,"r":16}]},{"diamGroup":"44\" Tire Diameter","items":[{"size":"44X19.5R16","calc":"","diam":44,"w":495,"a":72,"r":16},{"size":"44X21R16","calc":"","diam":44,"w":533,"a":67,"r":16}]},{"diamGroup":"46\" Tire Diameter","items":[{"size":"46X19.5R16","calc":"","diam":46,"w":495,"a":77,"r":16}]}],"17":[{"diamGroup":"22\" Tire Diameter","items":[{"size":"22X2.5R17","calc":"","diam":22,"w":64,"a":100,"r":17}]},{"diamGroup":"23\" Tire Diameter","items":[{"size":"125/70R17","calc":"23.9X4.9R17","diam":23.9,"w":125,"a":70,"r":17},{"size":"195/40R17","calc":"23.1x7.7R17","diam":23.1,"w":195,"a":40,"r":17},{"size":"195/45R17","calc":"23.9x7.7R17","diam":23.9,"w":195,"a":45,"r":17},{"size":"205/40R17","calc":"23.5x8.1R17","diam":23.5,"w":205,"a":40,"r":17},{"size":"215/35R17","calc":"22.9x8.5R17","diam":22.9,"w":215,"a":35,"r":17},{"size":"215/40R17","calc":"23.8x8.5R17","diam":23.8,"w":215,"a":40,"r":17},{"size":"225/35R17","calc":"23.2x8.9R17","diam":23.2,"w":225,"a":35,"r":17},{"size":"245/35R17","calc":"23.8x9.6R17","diam":23.8,"w":245,"a":35,"r":17}]},{"diamGroup":"24\" Tire Diameter","items":[{"size":"125/80R17","calc":"24.9X4.9R17","diam":24.9,"w":125,"a":80,"r":17},{"size":"135/70R17","calc":"24.4X5.3R17","diam":24.4,"w":135,"a":70,"r":17},{"size":"205/45R17","calc":"24.3x8.1R17","diam":24.3,"w":205,"a":45,"r":17},{"size":"215/45R17","calc":"24.6x8.5R17","diam":24.6,"w":215,"a":45,"r":17},{"size":"225/40R17","calc":"24.1x8.9R17","diam":24.1,"w":225,"a":40,"r":17},{"size":"235/40R17","calc":"24.4x9.3R17","diam":24.4,"w":235,"a":40,"r":17},{"size":"245/40R17","calc":"24.7x9.6R17","diam":24.7,"w":245,"a":40,"r":17},{"size":"275/35R17","calc":"24.6x10.8R17","diam":24.6,"w":275,"a":35,"r":17}]},{"diamGroup":"25\" Tire Diameter","items":[{"size":"115/95R17","calc":"25.6X4.5R17","diam":25.6,"w":115,"a":95,"r":17},{"size":"135/80R17","calc":"25.5X5.3R17","diam":25.5,"w":135,"a":80,"r":17},{"size":"145/70R17","calc":"25X5.7R17","diam":25,"w":145,"a":70,"r":17},{"size":"155/70R17","calc":"25.5X6.1R17","diam":25.5,"w":155,"a":70,"r":17},{"size":"205/50R17","calc":"25.1x8.1R17","diam":25.1,"w":205,"a":50,"r":17},{"size":"205/55R17","calc":"25.9x8.1R17","diam":25.9,"w":205,"a":55,"r":17},{"size":"215/50R17","calc":"25.5x8.5R17","diam":25.5,"w":215,"a":50,"r":17},{"size":"225/45R17","calc":"25x8.9R17","diam":25,"w":225,"a":45,"r":17},{"size":"225/50R17","calc":"25.9x8.9R17","diam":25.9,"w":225,"a":50,"r":17},{"size":"235/45R17","calc":"25.3x9.3R17","diam":25.3,"w":235,"a":45,"r":17},{"size":"245/45R17","calc":"25.7x9.6R17","diam":25.7,"w":245,"a":45,"r":17},{"size":"255/40R17","calc":"25x10R17","diam":25,"w":255,"a":40,"r":17},{"size":"265/40R17","calc":"25.3x10.4R17","diam":25.3,"w":265,"a":40,"r":17},{"size":"275/40R17","calc":"25.7x10.8R17","diam":25.7,"w":275,"a":40,"r":17},{"size":"295/35R17","calc":"25.1x11.6R17","diam":25.1,"w":295,"a":35,"r":17},{"size":"315/35R17","calc":"25.7x12.4R17","diam":25.7,"w":315,"a":35,"r":17}]},{"diamGroup":"26\" Tire Diameter","items":[{"size":"135/90R17","calc":"26.6X5.3R17","diam":26.6,"w":135,"a":90,"r":17},{"size":"145/80R17","calc":"26.1X5.7R17","diam":26.1,"w":145,"a":80,"r":17},{"size":"155/80R17","calc":"26.8X6.1R17","diam":26.8,"w":155,"a":80,"r":17},{"size":"215/55R17","calc":"26.3x8.5R17","diam":26.3,"w":215,"a":55,"r":17},{"size":"225/55R17","calc":"26.7x8.9R17","diam":26.7,"w":225,"a":55,"r":17},{"size":"235/50R17","calc":"26.3x9.3R17","diam":26.3,"w":235,"a":50,"r":17},{"size":"245/50R17","calc":"26.6x9.6R17","diam":26.6,"w":245,"a":50,"r":17},{"size":"255/45R17","calc":"26x10R17","diam":26,"w":255,"a":45,"r":17},{"size":"26X11.5R17","calc":"","diam":26,"w":292,"a":39,"r":17},{"size":"285/40R17","calc":"26x11.2R17","diam":26,"w":285,"a":40,"r":17},{"size":"295/40R17","calc":"26.3x11.6R17","diam":26.3,"w":295,"a":40,"r":17},{"size":"335/35R17","calc":"26.2x13.2R17","diam":26.2,"w":335,"a":35,"r":17}]},{"diamGroup":"27\" Tire Diameter","items":[{"size":"145/90R17","calc":"27.3X5.7R17","diam":27.3,"w":145,"a":90,"r":17},{"size":"165/80R17","calc":"27.4X6.5R17","diam":27.4,"w":165,"a":80,"r":17},{"size":"215/60R17","calc":"27.2x8.5R17","diam":27.2,"w":215,"a":60,"r":17},{"size":"225/60R17","calc":"27.6x8.9R17","diam":27.6,"w":225,"a":60,"r":17},{"size":"235/55R17","calc":"27.2x9.3R17","diam":27.2,"w":235,"a":55,"r":17},{"size":"245/55R17","calc":"27.6x9.6R17","diam":27.6,"w":245,"a":55,"r":17},{"size":"255/50R17","calc":"27x10R17","diam":27,"w":255,"a":50,"r":17},{"size":"275/50R17","calc":"27.8X10.8R17","diam":27.8,"w":275,"a":50,"r":17},{"size":"305/45R17","calc":"27.8X12R17","diam":27.8,"w":305,"a":45,"r":17},{"size":"345/40R17","calc":"27.9x13.6R17","diam":27.9,"w":345,"a":40,"r":17}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"155/90R17","calc":"28X6.1R17","diam":28,"w":155,"a":90,"r":17},{"size":"165/90R17","calc":"28.7X6.5R17","diam":28.7,"w":165,"a":90,"r":17},{"size":"215/65R17","calc":"28x8.5R17","diam":28,"w":215,"a":65,"r":17},{"size":"215/70R17","calc":"28.9x8.5R17","diam":28.9,"w":215,"a":70,"r":17},{"size":"225/65R17","calc":"28.5x8.9R17","diam":28.5,"w":225,"a":65,"r":17},{"size":"235/60R17","calc":"28.1x9.3R17","diam":28.1,"w":235,"a":60,"r":17},{"size":"245/60R17","calc":"28.6X9.6R17","diam":28.6,"w":245,"a":60,"r":17},{"size":"255/55R17","calc":"28x10R17","diam":28,"w":255,"a":55,"r":17},{"size":"275/55R17","calc":"28.9x10.8R17","diam":28.9,"w":275,"a":55,"r":17}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"175/90R17","calc":"29.4X6.9R17","diam":29.4,"w":175,"a":90,"r":17},{"size":"225/70R17","calc":"29.4x8.9R17","diam":29.4,"w":225,"a":70,"r":17},{"size":"235/65R17","calc":"29x9.3R17","diam":29,"w":235,"a":65,"r":17},{"size":"245/65R17","calc":"29.5x9.6R17","diam":29.5,"w":245,"a":65,"r":17},{"size":"255/60R17","calc":"29x10R17","diam":29,"w":255,"a":60,"r":17},{"size":"265/60R17","calc":"29.5x10.4R17","diam":29.5,"w":265,"a":60,"r":17}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"225/75R17","calc":"30.3x8.9R17","diam":30.3,"w":225,"a":75,"r":17},{"size":"235/70R17","calc":"30x9.3R17","diam":30,"w":235,"a":70,"r":17},{"size":"235/75R17","calc":"30.9x9.3R17","diam":30.9,"w":235,"a":75,"r":17},{"size":"245/70R17","calc":"30.5x9.6R17","diam":30.5,"w":245,"a":70,"r":17},{"size":"255/65R17","calc":"30.1x10R17","diam":30.1,"w":255,"a":65,"r":17},{"size":"265/65R17","calc":"30.6x10.4R17","diam":30.6,"w":265,"a":65,"r":17},{"size":"275/60R17","calc":"30x10.8R17","diam":30,"w":275,"a":60,"r":17},{"size":"285/60R17","calc":"30.5X11.2R17","diam":30.5,"w":285,"a":60,"r":17}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"235/80R17","calc":"31.8x9.3R17","diam":31.8,"w":235,"a":80,"r":17},{"size":"245/75R17","calc":"31.5x9.6R17","diam":31.5,"w":245,"a":75,"r":17},{"size":"255/70R17","calc":"31.1x10R17","diam":31.1,"w":255,"a":70,"r":17},{"size":"265/70R17","calc":"31.6x10.4R17","diam":31.6,"w":265,"a":70,"r":17},{"size":"275/65R17","calc":"31.1x10.8R17","diam":31.1,"w":275,"a":65,"r":17},{"size":"285/65R17","calc":"31.6x11.2R17","diam":31.6,"w":285,"a":65,"r":17},{"size":"31X10.5R17","calc":"","diam":31,"w":267,"a":67,"r":17}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"235/85R17","calc":"32.7X9.3R17","diam":32.7,"w":235,"a":85,"r":17},{"size":"255/75R17","calc":"32.1x10R17","diam":32.1,"w":255,"a":75,"r":17},{"size":"275/70R17","calc":"32.2x10.8R17","diam":32.2,"w":275,"a":70,"r":17},{"size":"285/70R17","calc":"32.7x11.2R17","diam":32.7,"w":285,"a":70,"r":17},{"size":"305/65R17","calc":"32.6x12R17","diam":32.6,"w":305,"a":65,"r":17},{"size":"32X10.5R17","calc":"","diam":32,"w":267,"a":71,"r":17},{"size":"32X11.5R17","calc":"","diam":32,"w":292,"a":65,"r":17}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"255/80R17","calc":"33.1x10R17","diam":33.1,"w":255,"a":80,"r":17},{"size":"285/75R17","calc":"33.8x11.2R17","diam":33.8,"w":285,"a":75,"r":17},{"size":"295/70R17","calc":"33.3x11.6R17","diam":33.3,"w":295,"a":70,"r":17},{"size":"305/70R17","calc":"33.8x12R17","diam":33.8,"w":305,"a":70,"r":17},{"size":"33X10.5R17","calc":"","diam":33,"w":267,"a":76,"r":17},{"size":"33X12.5R17","calc":"","diam":33,"w":318,"a":64,"r":17},{"size":"33X13R17","calc":"","diam":33,"w":330,"a":62,"r":17},{"size":"33X13.5R17","calc":"","diam":33,"w":343,"a":59,"r":17},{"size":"33X9.5R17","calc":"","diam":33,"w":241,"a":84,"r":17}]},{"diamGroup":"34\" Tire Diameter","items":[{"size":"275/80R17","calc":"34.3X10.8R17","diam":34.3,"w":275,"a":80,"r":17},{"size":"315/70R17","calc":"34.4x12.4R17","diam":34.4,"w":315,"a":70,"r":17},{"size":"325/70R17","calc":"34.9x12.8R17","diam":34.9,"w":325,"a":70,"r":17},{"size":"34X10.5R17","calc":"","diam":34,"w":267,"a":81,"r":17}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"35X10.5R17","calc":"","diam":35,"w":267,"a":86,"r":17},{"size":"35X11.5R17","calc":"","diam":35,"w":292,"a":78,"r":17},{"size":"35X12.5R17","calc":"","diam":35,"w":318,"a":72,"r":17},{"size":"35X13.5R17","calc":"","diam":35,"w":343,"a":67,"r":17},{"size":"35X14.5R17","calc":"","diam":35,"w":368,"a":62,"r":17}]},{"diamGroup":"36\" Tire Diameter","items":[{"size":"355/70R17","calc":"36.6x14R17","diam":36.6,"w":355,"a":70,"r":17},{"size":"36X12.5R17","calc":"","diam":36,"w":318,"a":76,"r":17},{"size":"36X13.5R17","calc":"","diam":36,"w":343,"a":70,"r":17}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X12.5R17","calc":"","diam":37,"w":318,"a":80,"r":17},{"size":"37X13R17","calc":"","diam":37,"w":330,"a":77,"r":17},{"size":"37X13.5R17","calc":"","diam":37,"w":343,"a":74,"r":17},{"size":"37X14R17","calc":"","diam":37,"w":356,"a":71,"r":17}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X13.5R17","calc":"","diam":38,"w":343,"a":78,"r":17},{"size":"38X14.5R17","calc":"","diam":38,"w":368,"a":72,"r":17},{"size":"38X15.5R17","calc":"","diam":38,"w":394,"a":68,"r":17},{"size":"38.5X13.5R17","calc":"","diam":38.5,"w":343,"a":80,"r":17},{"size":"38.5X14.5R17","calc":"","diam":38.5,"w":368,"a":74,"r":17}]},{"diamGroup":"39\" Tire Diameter","items":[{"size":"39X13.5R17","calc":"","diam":39,"w":343,"a":81,"r":17},{"size":"39.5X13.5R17","calc":"","diam":39.5,"w":343,"a":83,"r":17},{"size":"39.5X15R17","calc":"","diam":39.5,"w":381,"a":75,"r":17}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X13.5R17","calc":"","diam":40,"w":343,"a":85,"r":17},{"size":"40X14.5R17","calc":"","diam":40,"w":368,"a":79,"r":17},{"size":"40X16R17","calc":"","diam":40,"w":406,"a":72,"r":17}]},{"diamGroup":"41\" Tire Diameter","items":[{"size":"41X14.5R17","calc":"","diam":41,"w":368,"a":83,"r":17}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X14R17","calc":"","diam":42,"w":356,"a":89,"r":17},{"size":"42X14.5R17","calc":"","diam":42,"w":368,"a":86,"r":17},{"size":"42X15R17","calc":"","diam":42,"w":381,"a":83,"r":17},{"size":"42.5X13.5R17","calc":"","diam":42.5,"w":343,"a":94,"r":17}]},{"diamGroup":"43\" Tire Diameter","items":[{"size":"43X14.5R17","calc":"","diam":43,"w":368,"a":90,"r":17}]},{"diamGroup":"44\" Tire Diameter","items":[{"size":"44X19.5R17","calc":"","diam":44,"w":495,"a":69,"r":17},{"size":"44X21R17","calc":"","diam":44,"w":533,"a":64,"r":17}]},{"diamGroup":"47\" Tire Diameter","items":[{"size":"47X17R17","calc":"","diam":47,"w":432,"a":88,"r":17}]},{"diamGroup":"49\" Tire Diameter","items":[{"size":"49X21R17","calc":"","diam":49,"w":533,"a":76,"r":17}]},{"diamGroup":"54\" Tire Diameter","items":[{"size":"54X19.5R17","calc":"","diam":54,"w":495,"a":95,"r":17}]}],"18":[{"diamGroup":"23\" Tire Diameter","items":[{"size":"215/35R18","calc":"23.9x8.5R18","diam":23.9,"w":215,"a":35,"r":18}]},{"diamGroup":"24\" Tire Diameter","items":[{"size":"125/70R18","calc":"24.9X4.9R18","diam":24.9,"w":125,"a":70,"r":18},{"size":"205/40R18","calc":"24.5x8.1R18","diam":24.5,"w":205,"a":40,"r":18},{"size":"215/40R18","calc":"24.8x8.5R18","diam":24.8,"w":215,"a":40,"r":18},{"size":"225/35R18","calc":"24.2x8.9R18","diam":24.2,"w":225,"a":35,"r":18},{"size":"235/35R18","calc":"24.5x9.3R18","diam":24.5,"w":235,"a":35,"r":18},{"size":"245/35R18","calc":"24.8x9.6R18","diam":24.8,"w":245,"a":35,"r":18},{"size":"285/30R18","calc":"24.7x11.2R18","diam":24.7,"w":285,"a":30,"r":18}]},{"diamGroup":"25\" Tire Diameter","items":[{"size":"135/70R18","calc":"25.4X5.3R18","diam":25.4,"w":135,"a":70,"r":18},{"size":"155/60R18","calc":"25.3X6.1R18","diam":25.3,"w":155,"a":60,"r":18},{"size":"215/45R18","calc":"25.6x8.5R18","diam":25.6,"w":215,"a":45,"r":18},{"size":"225/40R18","calc":"25.1x8.9R18","diam":25.1,"w":225,"a":40,"r":18},{"size":"235/40R18","calc":"25.4x9.3R18","diam":25.4,"w":235,"a":40,"r":18},{"size":"245/40R18","calc":"25.7x9.6R18","diam":25.7,"w":245,"a":40,"r":18},{"size":"255/35R18","calc":"25x10R18","diam":25,"w":255,"a":35,"r":18},{"size":"265/35R18","calc":"25.3x10.4R18","diam":25.3,"w":265,"a":35,"r":18},{"size":"275/35R18","calc":"25.6x10.8R18","diam":25.6,"w":275,"a":35,"r":18},{"size":"285/35R18","calc":"25.9x11.2R18","diam":25.9,"w":285,"a":35,"r":18},{"size":"295/30R18","calc":"25x11.6R18","diam":25,"w":295,"a":30,"r":18},{"size":"305/30R18","calc":"25.2x12R18","diam":25.2,"w":305,"a":30,"r":18},{"size":"315/30R18","calc":"25.4x12.4R18","diam":25.4,"w":315,"a":30,"r":18},{"size":"335/30R18","calc":"25.9x13.2R18","diam":25.9,"w":335,"a":30,"r":18}]},{"diamGroup":"26\" Tire Diameter","items":[{"size":"135/80R18","calc":"26.5X5.3R18","diam":26.5,"w":135,"a":80,"r":18},{"size":"145/70R18","calc":"26X5.7R18","diam":26,"w":145,"a":70,"r":18},{"size":"215/50R18","calc":"26.5X8.5R18","diam":26.5,"w":215,"a":50,"r":18},{"size":"225/45R18","calc":"26x8.9R18","diam":26,"w":225,"a":45,"r":18},{"size":"225/50R18","calc":"26.9x8.9R18","diam":26.9,"w":225,"a":50,"r":18},{"size":"235/45R18","calc":"26.3x9.3R18","diam":26.3,"w":235,"a":45,"r":18},{"size":"245/45R18","calc":"26.7x9.6R18","diam":26.7,"w":245,"a":45,"r":18},{"size":"255/40R18","calc":"26x10R18","diam":26,"w":255,"a":40,"r":18},{"size":"26X12R18","calc":"","diam":26,"w":305,"a":33,"r":18},{"size":"265/40R18","calc":"26.3x10.4R18","diam":26.3,"w":265,"a":40,"r":18},{"size":"275/40R18","calc":"26.7x10.8R18","diam":26.7,"w":275,"a":40,"r":18},{"size":"295/35R18","calc":"26.1x11.6R18","diam":26.1,"w":295,"a":35,"r":18},{"size":"305/35R18","calc":"26.4x12R18","diam":26.4,"w":305,"a":35,"r":18},{"size":"315/35R18","calc":"26.7x12.4R18","diam":26.7,"w":315,"a":35,"r":18},{"size":"345/30R18","calc":"26.1x13.6R18","diam":26.1,"w":345,"a":30,"r":18}]},{"diamGroup":"27\" Tire Diameter","items":[{"size":"145/80R18","calc":"27.1X5.7R18","diam":27.1,"w":145,"a":80,"r":18},{"size":"145/85R18","calc":"27.7X5.7R18","diam":27.7,"w":145,"a":85,"r":18},{"size":"215/55R18","calc":"27.3x8.5R18","diam":27.3,"w":215,"a":55,"r":18},{"size":"225/55R18","calc":"27.7x8.9R18","diam":27.7,"w":225,"a":55,"r":18},{"size":"235/50R18","calc":"27.3x9.3R18","diam":27.3,"w":235,"a":50,"r":18},{"size":"245/50R18","calc":"27.6x9.6R18","diam":27.6,"w":245,"a":50,"r":18},{"size":"255/45R18","calc":"27x10R18","diam":27,"w":255,"a":45,"r":18},{"size":"265/45R18","calc":"27.4x10.4R18","diam":27.4,"w":265,"a":45,"r":18},{"size":"275/45R18","calc":"27.7x10.8R18","diam":27.7,"w":275,"a":45,"r":18},{"size":"285/40R18","calc":"27x11.2R18","diam":27,"w":285,"a":40,"r":18},{"size":"295/40R18","calc":"27.3x11.6R18","diam":27.3,"w":295,"a":40,"r":18},{"size":"305/40R18","calc":"27.6X12R18","diam":27.6,"w":305,"a":40,"r":18},{"size":"315/40R18","calc":"27.9x12.4R18","diam":27.9,"w":315,"a":40,"r":18},{"size":"325/35R18","calc":"27x12.8R18","diam":27,"w":325,"a":35,"r":18},{"size":"345/35R18","calc":"27.5x13.6R18","diam":27.5,"w":345,"a":35,"r":18}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"155/85R18","calc":"28.4X6.1R18","diam":28.4,"w":155,"a":85,"r":18},{"size":"225/60R18","calc":"28.6x8.9R18","diam":28.6,"w":225,"a":60,"r":18},{"size":"235/55R18","calc":"28.2x9.3R18","diam":28.2,"w":235,"a":55,"r":18},{"size":"245/55R18","calc":"28.6x9.6R18","diam":28.6,"w":245,"a":55,"r":18},{"size":"255/50R18","calc":"28x10R18","diam":28,"w":255,"a":50,"r":18},{"size":"265/50R18","calc":"28.4X10.4R18","diam":28.4,"w":265,"a":50,"r":18},{"size":"285/45R18","calc":"28.1x11.2R18","diam":28.1,"w":285,"a":45,"r":18},{"size":"295/45R18","calc":"28.5x11.6R18","diam":28.5,"w":295,"a":45,"r":18},{"size":"305/45R18","calc":"28.8X12R18","diam":28.8,"w":305,"a":45,"r":18}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"155/90R18","calc":"29X6.1R18","diam":29,"w":155,"a":90,"r":18},{"size":"165/90R18","calc":"29.7X6.5R18","diam":29.7,"w":165,"a":90,"r":18},{"size":"225/65R18","calc":"29.5X8.9R18","diam":29.5,"w":225,"a":65,"r":18},{"size":"235/60R18","calc":"29.1x9.3R18","diam":29.1,"w":235,"a":60,"r":18},{"size":"245/60R18","calc":"29.6x9.6R18","diam":29.6,"w":245,"a":60,"r":18},{"size":"255/55R18","calc":"29x10R18","diam":29,"w":255,"a":55,"r":18},{"size":"265/55R18","calc":"29.5X10.4R18","diam":29.5,"w":265,"a":55,"r":18},{"size":"275/55R18","calc":"29.9x10.8R18","diam":29.9,"w":275,"a":55,"r":18},{"size":"285/50R18","calc":"29.2x11.2R18","diam":29.2,"w":285,"a":50,"r":18},{"size":"325/45R18","calc":"29.5X12.8R18","diam":29.5,"w":325,"a":45,"r":18}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"175/90R18","calc":"30.4X6.9R18","diam":30.4,"w":175,"a":90,"r":18},{"size":"235/65R18","calc":"30x9.3R18","diam":30,"w":235,"a":65,"r":18},{"size":"245/65R18","calc":"30.5x9.6R18","diam":30.5,"w":245,"a":65,"r":18},{"size":"255/60R18","calc":"30x10R18","diam":30,"w":255,"a":60,"r":18},{"size":"265/60R18","calc":"30.5x10.4R18","diam":30.5,"w":265,"a":60,"r":18},{"size":"285/55R18","calc":"30.3x11.2R18","diam":30.3,"w":285,"a":55,"r":18}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"235/70R18","calc":"31X9.3R18","diam":31,"w":235,"a":70,"r":18},{"size":"255/65R18","calc":"31.1x10R18","diam":31.1,"w":255,"a":65,"r":18},{"size":"265/65R18","calc":"31.6x10.4R18","diam":31.6,"w":265,"a":65,"r":18},{"size":"275/60R18","calc":"31x10.8R18","diam":31,"w":275,"a":60,"r":18},{"size":"285/60R18","calc":"31.5x11.2R18","diam":31.5,"w":285,"a":60,"r":18}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"255/70R18","calc":"32.1x10R18","diam":32.1,"w":255,"a":70,"r":18},{"size":"265/70R18","calc":"32.6x10.4R18","diam":32.6,"w":265,"a":70,"r":18},{"size":"275/65R18","calc":"32.1x10.8R18","diam":32.1,"w":275,"a":65,"r":18},{"size":"285/65R18","calc":"32.6x11.2R18","diam":32.6,"w":285,"a":65,"r":18},{"size":"305/60R18","calc":"32.4x12R18","diam":32.4,"w":305,"a":60,"r":18}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"275/70R18","calc":"33.2x10.8R18","diam":33.2,"w":275,"a":70,"r":18},{"size":"285/70R18","calc":"33.7x11.2R18","diam":33.7,"w":285,"a":70,"r":18},{"size":"295/65R18","calc":"33.1x11.6R18","diam":33.1,"w":295,"a":65,"r":18},{"size":"305/65R18","calc":"33.6x12R18","diam":33.6,"w":305,"a":65,"r":18},{"size":"325/60R18","calc":"33.4x12.8R18","diam":33.4,"w":325,"a":60,"r":18},{"size":"33X10.5R18","calc":"","diam":33,"w":267,"a":71,"r":18},{"size":"33X11.5R18","calc":"","diam":33,"w":292,"a":65,"r":18},{"size":"33X12.5R18","calc":"","diam":33,"w":318,"a":60,"r":18},{"size":"33X13R18","calc":"","diam":33,"w":330,"a":58,"r":18},{"size":"33X13.5R18","calc":"","diam":33,"w":343,"a":56,"r":18}]},{"diamGroup":"34\" Tire Diameter","items":[{"size":"285/75R18","calc":"34.8x11.2R18","diam":34.8,"w":285,"a":75,"r":18},{"size":"295/70R18","calc":"34.3X11.6R18","diam":34.3,"w":295,"a":70,"r":18},{"size":"305/70R18","calc":"34.8x12R18","diam":34.8,"w":305,"a":70,"r":18},{"size":"325/65R18","calc":"34.6x12.8R18","diam":34.6,"w":325,"a":65,"r":18},{"size":"34X12.5R18","calc":"","diam":34,"w":318,"a":64,"r":18}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"315/70R18","calc":"35.4x12.4R18","diam":35.4,"w":315,"a":70,"r":18},{"size":"35X11.5R18","calc":"","diam":35,"w":292,"a":74,"r":18},{"size":"35X12.5R18","calc":"","diam":35,"w":318,"a":68,"r":18},{"size":"35X13R18","calc":"","diam":35,"w":330,"a":65,"r":18},{"size":"35X13.5R18","calc":"","diam":35,"w":343,"a":63,"r":18},{"size":"35X14.5R18","calc":"","diam":35,"w":368,"a":59,"r":18}]},{"diamGroup":"36\" Tire Diameter","items":[{"size":"355/65R18","calc":"36.2x14R18","diam":36.2,"w":355,"a":65,"r":18},{"size":"36X13.5R18","calc":"","diam":36,"w":343,"a":67,"r":18}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X11.5R18","calc":"","diam":37,"w":292,"a":83,"r":18},{"size":"37X12.5R18","calc":"","diam":37,"w":318,"a":76,"r":18},{"size":"37X13.5R18","calc":"","diam":37,"w":343,"a":70,"r":18}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X13.5R18","calc":"","diam":38,"w":343,"a":74,"r":18},{"size":"38X14.5R18","calc":"","diam":38,"w":368,"a":69,"r":18},{"size":"38X15R18","calc":"","diam":38,"w":381,"a":67,"r":18},{"size":"38X15.5R18","calc":"","diam":38,"w":394,"a":65,"r":18},{"size":"38.5X14.5R18","calc":"","diam":38.5,"w":368,"a":71,"r":18}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X13.5R18","calc":"","diam":40,"w":343,"a":81,"r":18},{"size":"40X14.5R18","calc":"","diam":40,"w":368,"a":76,"r":18}]},{"diamGroup":"41\" Tire Diameter","items":[{"size":"41X14.5R18","calc":"","diam":41,"w":368,"a":79,"r":18}]}],"19":[{"diamGroup":"24\" Tire Diameter","items":[{"size":"215/35R19","calc":"24.9x8.5R19","diam":24.9,"w":215,"a":35,"r":19},{"size":"235/30R19","calc":"24.6x9.3R19","diam":24.6,"w":235,"a":30,"r":19},{"size":"245/30R19","calc":"24.8x9.6R19","diam":24.8,"w":245,"a":30,"r":19},{"size":"295/25R19","calc":"24.8X11.6R19","diam":24.8,"w":295,"a":25,"r":19}]},{"diamGroup":"25\" Tire Diameter","items":[{"size":"115/70R19","calc":"25.3X4.5R19","diam":25.3,"w":115,"a":70,"r":19},{"size":"125/70R19","calc":"25.9X4.9R19","diam":25.9,"w":125,"a":70,"r":19},{"size":"225/35R19","calc":"25.2x8.9R19","diam":25.2,"w":225,"a":35,"r":19},{"size":"235/35R19","calc":"25.5x9.3R19","diam":25.5,"w":235,"a":35,"r":19},{"size":"245/35R19","calc":"25.8x9.6R19","diam":25.8,"w":245,"a":35,"r":19},{"size":"255/30R19","calc":"25x10R19","diam":25,"w":255,"a":30,"r":19},{"size":"265/30R19","calc":"25.3x10.4R19","diam":25.3,"w":265,"a":30,"r":19},{"size":"275/30R19","calc":"25.5x10.8R19","diam":25.5,"w":275,"a":30,"r":19},{"size":"285/30R19","calc":"25.7x11.2R19","diam":25.7,"w":285,"a":30,"r":19},{"size":"315/25R19","calc":"25.2x12.4R19","diam":25.2,"w":315,"a":25,"r":19}]},{"diamGroup":"26\" Tire Diameter","items":[{"size":"135/70R19","calc":"26.4X5.3R19","diam":26.4,"w":135,"a":70,"r":19},{"size":"225/40R19","calc":"26.1x8.9R19","diam":26.1,"w":225,"a":40,"r":19},{"size":"235/40R19","calc":"26.4x9.3R19","diam":26.4,"w":235,"a":40,"r":19},{"size":"245/40R19","calc":"26.7x9.6R19","diam":26.7,"w":245,"a":40,"r":19},{"size":"255/35R19","calc":"26x10R19","diam":26,"w":255,"a":35,"r":19},{"size":"265/35R19","calc":"26.3x10.4R19","diam":26.3,"w":265,"a":35,"r":19},{"size":"275/35R19","calc":"26.6x10.8R19","diam":26.6,"w":275,"a":35,"r":19},{"size":"285/35R19","calc":"26.9x11.2R19","diam":26.9,"w":285,"a":35,"r":19},{"size":"295/30R19","calc":"26x11.6R19","diam":26,"w":295,"a":30,"r":19},{"size":"305/30R19","calc":"26.2x12R19","diam":26.2,"w":305,"a":30,"r":19},{"size":"315/30R19","calc":"26.4x12.4R19","diam":26.4,"w":315,"a":30,"r":19},{"size":"325/30R19","calc":"26.7x12.8R19","diam":26.7,"w":325,"a":30,"r":19},{"size":"335/30R19","calc":"26.9x13.2R19","diam":26.9,"w":335,"a":30,"r":19}]},{"diamGroup":"27\" Tire Diameter","items":[{"size":"155/70R19","calc":"27.5x6.1R19","diam":27.5,"w":155,"a":70,"r":19},{"size":"175/60R19","calc":"27.3x6.9R19","diam":27.3,"w":175,"a":60,"r":19},{"size":"225/45R19","calc":"27x8.9R19","diam":27,"w":225,"a":45,"r":19},{"size":"235/45R19","calc":"27.3x9.3R19","diam":27.3,"w":235,"a":45,"r":19},{"size":"245/45R19","calc":"27.7x9.6R19","diam":27.7,"w":245,"a":45,"r":19},{"size":"255/40R19","calc":"27x10R19","diam":27,"w":255,"a":40,"r":19},{"size":"265/40R19","calc":"27.3x10.4R19","diam":27.3,"w":265,"a":40,"r":19},{"size":"275/40R19","calc":"27.7x10.8R19","diam":27.7,"w":275,"a":40,"r":19},{"size":"295/35R19","calc":"27.1x11.6R19","diam":27.1,"w":295,"a":35,"r":19},{"size":"305/35R19","calc":"27.4X12R19","diam":27.4,"w":305,"a":35,"r":19},{"size":"315/35R19","calc":"27.7x12.4R19","diam":27.7,"w":315,"a":35,"r":19},{"size":"345/30R19","calc":"27.1x13.6R19","diam":27.1,"w":345,"a":30,"r":19},{"size":"355/30R19","calc":"27.4x14R19","diam":27.4,"w":355,"a":30,"r":19}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"145/80R19","calc":"28.1X5.7R19","diam":28.1,"w":145,"a":80,"r":19},{"size":"155/80R19","calc":"28.8X6.1R19","diam":28.8,"w":155,"a":80,"r":19},{"size":"225/55R19","calc":"28.7x8.9R19","diam":28.7,"w":225,"a":55,"r":19},{"size":"235/50R19","calc":"28.3x9.3R19","diam":28.3,"w":235,"a":50,"r":19},{"size":"245/50R19","calc":"28.6x9.6R19","diam":28.6,"w":245,"a":50,"r":19},{"size":"255/45R19","calc":"28x10R19","diam":28,"w":255,"a":45,"r":19},{"size":"265/45R19","calc":"28.4X10.4R19","diam":28.4,"w":265,"a":45,"r":19},{"size":"275/45R19","calc":"28.7x10.8R19","diam":28.7,"w":275,"a":45,"r":19},{"size":"285/40R19","calc":"28x11.2R19","diam":28,"w":285,"a":40,"r":19},{"size":"295/40R19","calc":"28.3X11.6R19","diam":28.3,"w":295,"a":40,"r":19},{"size":"315/40R19","calc":"28.9x12.4R19","diam":28.9,"w":315,"a":40,"r":19},{"size":"345/35R19","calc":"28.5x13.6R19","diam":28.5,"w":345,"a":35,"r":19}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"235/55R19","calc":"29.2x9.3R19","diam":29.2,"w":235,"a":55,"r":19},{"size":"245/55R19","calc":"29.6x9.6R19","diam":29.6,"w":245,"a":55,"r":19},{"size":"255/50R19","calc":"29x10R19","diam":29,"w":255,"a":50,"r":19},{"size":"265/50R19","calc":"29.4x10.4R19","diam":29.4,"w":265,"a":50,"r":19},{"size":"275/50R19","calc":"29.8X10.8R19","diam":29.8,"w":275,"a":50,"r":19},{"size":"285/45R19","calc":"29.1x11.2R19","diam":29.1,"w":285,"a":45,"r":19},{"size":"295/45R19","calc":"29.5x11.6R19","diam":29.5,"w":295,"a":45,"r":19}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"165/90R19","calc":"30.7X6.5R19","diam":30.7,"w":165,"a":90,"r":19},{"size":"175/80R19","calc":"30X6.9R19","diam":30,"w":175,"a":80,"r":19},{"size":"255/55R19","calc":"30x10R19","diam":30,"w":255,"a":55,"r":19},{"size":"265/55R19","calc":"30.5x10.4R19","diam":30.5,"w":265,"a":55,"r":19},{"size":"275/55R19","calc":"30.9x10.8R19","diam":30.9,"w":275,"a":55,"r":19}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"235/65R19","calc":"31X9.3R19","diam":31,"w":235,"a":65,"r":19},{"size":"255/60R19","calc":"31x10R19","diam":31,"w":255,"a":60,"r":19}]}],"20":[{"diamGroup":"25\" Tire Diameter","items":[{"size":"215/30R20","calc":"25.1X8.5R20","diam":25.1,"w":215,"a":30,"r":20},{"size":"225/30R20","calc":"25.3x8.9R20","diam":25.3,"w":225,"a":30,"r":20},{"size":"235/30R20","calc":"25.6x9.3R20","diam":25.6,"w":235,"a":30,"r":20},{"size":"245/30R20","calc":"25.8x9.6R20","diam":25.8,"w":245,"a":30,"r":20},{"size":"275/25R20","calc":"25.4X10.8R20","diam":25.4,"w":275,"a":25,"r":20},{"size":"285/25R20","calc":"25.6x11.2R20","diam":25.6,"w":285,"a":25,"r":20},{"size":"295/25R20","calc":"25.8x11.6R20","diam":25.8,"w":295,"a":25,"r":20}]},{"diamGroup":"26\" Tire Diameter","items":[{"size":"145/60R20","calc":"26.9X5.7R20","diam":26.9,"w":145,"a":60,"r":20},{"size":"225/35R20","calc":"26.2x8.9R20","diam":26.2,"w":225,"a":35,"r":20},{"size":"235/35R20","calc":"26.5x9.3R20","diam":26.5,"w":235,"a":35,"r":20},{"size":"245/35R20","calc":"26.8x9.6R20","diam":26.8,"w":245,"a":35,"r":20},{"size":"255/30R20","calc":"26x10R20","diam":26,"w":255,"a":30,"r":20},{"size":"265/30R20","calc":"26.3x10.4R20","diam":26.3,"w":265,"a":30,"r":20},{"size":"275/30R20","calc":"26.5x10.8R20","diam":26.5,"w":275,"a":30,"r":20},{"size":"285/30R20","calc":"26.7x11.2R20","diam":26.7,"w":285,"a":30,"r":20},{"size":"305/25R20","calc":"26x12R20","diam":26,"w":305,"a":25,"r":20},{"size":"315/25R20","calc":"26.2x12.4R20","diam":26.2,"w":315,"a":25,"r":20},{"size":"325/25R20","calc":"26.4x12.8R20","diam":26.4,"w":325,"a":25,"r":20},{"size":"335/25R20","calc":"26.6x13.2R20","diam":26.6,"w":335,"a":25,"r":20},{"size":"345/25R20","calc":"26.8x13.6R20","diam":26.8,"w":345,"a":25,"r":20}]},{"diamGroup":"27\" Tire Diameter","items":[{"size":"155/60R20","calc":"27.3x6.1R20","diam":27.3,"w":155,"a":60,"r":20},{"size":"155/65R20","calc":"27.9X6.1R20","diam":27.9,"w":155,"a":65,"r":20},{"size":"165/60R20","calc":"27.8X6.5R20","diam":27.8,"w":165,"a":60,"r":20},{"size":"175/55R20","calc":"27.6x6.9R20","diam":27.6,"w":175,"a":55,"r":20},{"size":"195/50R20","calc":"27.7x7.7R20","diam":27.7,"w":195,"a":50,"r":20},{"size":"215/45R20","calc":"27.6x8.5R20","diam":27.6,"w":215,"a":45,"r":20},{"size":"225/40R20","calc":"27.1X8.9R20","diam":27.1,"w":225,"a":40,"r":20},{"size":"235/40R20","calc":"27.4x9.3R20","diam":27.4,"w":235,"a":40,"r":20},{"size":"245/40R20","calc":"27.7x9.6R20","diam":27.7,"w":245,"a":40,"r":20},{"size":"255/35R20","calc":"27x10R20","diam":27,"w":255,"a":35,"r":20},{"size":"265/35R20","calc":"27.3x10.4R20","diam":27.3,"w":265,"a":35,"r":20},{"size":"275/35R20","calc":"27.6x10.8R20","diam":27.6,"w":275,"a":35,"r":20},{"size":"285/35R20","calc":"27.9x11.2R20","diam":27.9,"w":285,"a":35,"r":20},{"size":"295/30R20","calc":"27x11.6R20","diam":27,"w":295,"a":30,"r":20},{"size":"305/30R20","calc":"27.2x12R20","diam":27.2,"w":305,"a":30,"r":20},{"size":"315/30R20","calc":"27.4x12.4R20","diam":27.4,"w":315,"a":30,"r":20},{"size":"325/30R20","calc":"27.7x12.8R20","diam":27.7,"w":325,"a":30,"r":20},{"size":"335/30R20","calc":"27.9x13.2R20","diam":27.9,"w":335,"a":30,"r":20}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"225/45R20","calc":"28X8.9R20","diam":28,"w":225,"a":45,"r":20},{"size":"235/45R20","calc":"28.3x9.3R20","diam":28.3,"w":235,"a":45,"r":20},{"size":"245/45R20","calc":"28.7x9.6R20","diam":28.7,"w":245,"a":45,"r":20},{"size":"255/40R20","calc":"28x10R20","diam":28,"w":255,"a":40,"r":20},{"size":"265/40R20","calc":"28.3x10.4R20","diam":28.3,"w":265,"a":40,"r":20},{"size":"275/40R20","calc":"28.7x10.8R20","diam":28.7,"w":275,"a":40,"r":20},{"size":"295/35R20","calc":"28.1x11.6R20","diam":28.1,"w":295,"a":35,"r":20},{"size":"305/35R20","calc":"28.4x12R20","diam":28.4,"w":305,"a":35,"r":20},{"size":"315/35R20","calc":"28.7x12.4R20","diam":28.7,"w":315,"a":35,"r":20},{"size":"345/30R20","calc":"28.1x13.6R20","diam":28.1,"w":345,"a":30,"r":20}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"235/50R20","calc":"29.3X9.3R20","diam":29.3,"w":235,"a":50,"r":20},{"size":"245/50R20","calc":"29.6x9.6R20","diam":29.6,"w":245,"a":50,"r":20},{"size":"255/45R20","calc":"29x10R20","diam":29,"w":255,"a":45,"r":20},{"size":"265/45R20","calc":"29.4x10.4R20","diam":29.4,"w":265,"a":45,"r":20},{"size":"275/45R20","calc":"29.7x10.8R20","diam":29.7,"w":275,"a":45,"r":20},{"size":"285/40R20","calc":"29x11.2R20","diam":29,"w":285,"a":40,"r":20},{"size":"295/40R20","calc":"29.3x11.6R20","diam":29.3,"w":295,"a":40,"r":20},{"size":"305/40R20","calc":"29.6X12R20","diam":29.6,"w":305,"a":40,"r":20},{"size":"325/35R20","calc":"29X12.8R20","diam":29,"w":325,"a":35,"r":20}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"235/55R20","calc":"30.2x9.3R20","diam":30.2,"w":235,"a":55,"r":20},{"size":"255/50R20","calc":"30x10R20","diam":30,"w":255,"a":50,"r":20},{"size":"265/50R20","calc":"30.4x10.4R20","diam":30.4,"w":265,"a":50,"r":20},{"size":"275/50R20","calc":"30.8x10.8R20","diam":30.8,"w":275,"a":50,"r":20},{"size":"285/45R20","calc":"30.1x11.2R20","diam":30.1,"w":285,"a":45,"r":20},{"size":"295/45R20","calc":"30.5x11.6R20","diam":30.5,"w":295,"a":45,"r":20},{"size":"305/45R20","calc":"30.8x12R20","diam":30.8,"w":305,"a":45,"r":20}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"245/60R20","calc":"31.6x9.6R20","diam":31.6,"w":245,"a":60,"r":20},{"size":"255/55R20","calc":"31x10R20","diam":31,"w":255,"a":55,"r":20},{"size":"275/55R20","calc":"31.9x10.8R20","diam":31.9,"w":275,"a":55,"r":20},{"size":"285/50R20","calc":"31.2x11.2R20","diam":31.2,"w":285,"a":50,"r":20},{"size":"295/50R20","calc":"31.6x11.6R20","diam":31.6,"w":295,"a":50,"r":20},{"size":"31X18R20","calc":"","diam":31,"w":457,"a":31,"r":20}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"265/60R20","calc":"32.5x10.4R20","diam":32.5,"w":265,"a":60,"r":20},{"size":"285/55R20","calc":"32.3x11.2R20","diam":32.3,"w":285,"a":55,"r":20},{"size":"295/55R20","calc":"32.8X11.6R20","diam":32.8,"w":295,"a":55,"r":20},{"size":"305/50R20","calc":"32x12R20","diam":32,"w":305,"a":50,"r":20},{"size":"315/50R20","calc":"32.4x12.4R20","diam":32.4,"w":315,"a":50,"r":20},{"size":"325/50R20","calc":"32.8x12.8R20","diam":32.8,"w":325,"a":50,"r":20}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"275/60R20","calc":"33x10.8R20","diam":33,"w":275,"a":60,"r":20},{"size":"285/60R20","calc":"33.5x11.2R20","diam":33.5,"w":285,"a":60,"r":20},{"size":"295/60R20","calc":"33.9x11.6R20","diam":33.9,"w":295,"a":60,"r":20},{"size":"305/55R20","calc":"33.2x12R20","diam":33.2,"w":305,"a":55,"r":20},{"size":"33X11.5R20","calc":"","diam":33,"w":292,"a":57,"r":20},{"size":"33X12R20","calc":"","diam":33,"w":305,"a":54,"r":20},{"size":"33X12.5R20","calc":"","diam":33,"w":318,"a":52,"r":20},{"size":"33X13.5R20","calc":"","diam":33,"w":343,"a":48,"r":20}]},{"diamGroup":"34\" Tire Diameter","items":[{"size":"275/65R20","calc":"34.1x10.8R20","diam":34.1,"w":275,"a":65,"r":20},{"size":"285/65R20","calc":"34.6x11.2R20","diam":34.6,"w":285,"a":65,"r":20},{"size":"305/60R20","calc":"34.4x12R20","diam":34.4,"w":305,"a":60,"r":20},{"size":"315/60R20","calc":"34.9x12.4R20","diam":34.9,"w":315,"a":60,"r":20},{"size":"355/50R20","calc":"34X14R20","diam":34,"w":355,"a":50,"r":20}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"295/65R20","calc":"35.1X11.6R20","diam":35.1,"w":295,"a":65,"r":20},{"size":"325/60R20","calc":"35.4x12.8R20","diam":35.4,"w":325,"a":60,"r":20},{"size":"35X11.5R20","calc":"","diam":35,"w":292,"a":65,"r":20},{"size":"35X12.5R20","calc":"","diam":35,"w":318,"a":60,"r":20},{"size":"35X13R20","calc":"","diam":35,"w":330,"a":58,"r":20},{"size":"35X13.5R20","calc":"","diam":35,"w":343,"a":56,"r":20},{"size":"35X14.5R20","calc":"","diam":35,"w":368,"a":52,"r":20}]},{"diamGroup":"36\" Tire Diameter","items":[{"size":"355/60R20","calc":"36.8x14R20","diam":36.8,"w":355,"a":60,"r":20},{"size":"36X13.5R20","calc":"","diam":36,"w":343,"a":59,"r":20},{"size":"36X15.5R20","calc":"","diam":36,"w":394,"a":52,"r":20}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X11.5R20","calc":"","diam":37,"w":292,"a":74,"r":20},{"size":"37X12.5R20","calc":"","diam":37,"w":318,"a":68,"r":20},{"size":"37X13.5R20","calc":"","diam":37,"w":343,"a":63,"r":20},{"size":"37X14.5R20","calc":"","diam":37,"w":368,"a":59,"r":20}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X13.5R20","calc":"","diam":38,"w":343,"a":67,"r":20},{"size":"38X14.5R20","calc":"","diam":38,"w":368,"a":62,"r":20},{"size":"38X15.5R20","calc":"","diam":38,"w":394,"a":58,"r":20},{"size":"38.5X13.5R20","calc":"","diam":38.5,"w":343,"a":69,"r":20},{"size":"38.5X14.5R20","calc":"","diam":38.5,"w":368,"a":64,"r":20}]},{"diamGroup":"39\" Tire Diameter","items":[{"size":"39X13.5R20","calc":"","diam":39,"w":343,"a":70,"r":20},{"size":"39.5X13.5R20","calc":"","diam":39.5,"w":343,"a":72,"r":20},{"size":"39.5X15R20","calc":"","diam":39.5,"w":381,"a":65,"r":20}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X13.5R20","calc":"","diam":40,"w":343,"a":74,"r":20},{"size":"40X14.5R20","calc":"","diam":40,"w":368,"a":69,"r":20},{"size":"40X15.5R20","calc":"","diam":40,"w":394,"a":65,"r":20}]},{"diamGroup":"41\" Tire Diameter","items":[{"size":"41X14.5R20","calc":"","diam":41,"w":368,"a":72,"r":20}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X14.5R20","calc":"","diam":42,"w":368,"a":76,"r":20},{"size":"42X15R20","calc":"","diam":42,"w":381,"a":73,"r":20},{"size":"42.5X13.5R20","calc":"","diam":42.5,"w":343,"a":83,"r":20}]},{"diamGroup":"43\" Tire Diameter","items":[{"size":"43X14.5R20","calc":"","diam":43,"w":368,"a":79,"r":20}]},{"diamGroup":"44\" Tire Diameter","items":[{"size":"44X19.5R20","calc":"","diam":44,"w":495,"a":62,"r":20},{"size":"44X19.5R20","calc":"","diam":44,"w":495,"a":62,"r":20},{"size":"44X21R20","calc":"","diam":44,"w":533,"a":57,"r":20}]},{"diamGroup":"45\" Tire Diameter","items":[{"size":"45X14.5R20","calc":"","diam":45,"w":368,"a":86,"r":20}]},{"diamGroup":"46\" Tire Diameter","items":[{"size":"46X19.5R20","calc":"","diam":46,"w":495,"a":67,"r":20}]},{"diamGroup":"49\" Tire Diameter","items":[{"size":"49X21R20","calc":"","diam":49,"w":533,"a":69,"r":20}]},{"diamGroup":"54\" Tire Diameter","items":[{"size":"54X19.5R20","calc":"","diam":54,"w":495,"a":87,"r":20}]}],"21":[{"diamGroup":"27\" Tire Diameter","items":[{"size":"255/30R21","calc":"27.0x10.0R21","diam":27.023622047244096,"w":255,"a":30,"r":21},{"size":"265/30R21","calc":"27.3x10.4R21","diam":27.25984251968504,"w":265,"a":30,"r":21},{"size":"275/30R21","calc":"27.5x10.8R21","diam":27.496062992125985,"w":275,"a":30,"r":21}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"245/35R21","calc":"27.8x9.6R21","diam":27.751968503937007,"w":245,"a":35,"r":21},{"size":"255/35R21","calc":"28.0x10.0R21","diam":28.02755905511811,"w":255,"a":35,"r":21},{"size":"265/35R21","calc":"28.3x10.4R21","diam":28.303149606299215,"w":265,"a":35,"r":21},{"size":"275/30R21","calc":"27.5x10.8R21","diam":27.496062992125985,"w":275,"a":30,"r":21},{"size":"285/30R21","calc":"27.7x11.2R21","diam":27.73228346456693,"w":285,"a":30,"r":21}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"245/40R21","calc":"28.7x9.6R21","diam":28.716535433070867,"w":245,"a":40,"r":21},{"size":"255/40R21","calc":"29.0x10.0R21","diam":29.031496062992126,"w":255,"a":40,"r":21},{"size":"265/40R21","calc":"29.3x10.4R21","diam":29.346456692913385,"w":265,"a":40,"r":21},{"size":"275/35R21","calc":"28.6x10.8R21","diam":28.578740157480315,"w":275,"a":35,"r":21},{"size":"285/35R21","calc":"28.9x11.2R21","diam":28.85433070866142,"w":285,"a":35,"r":21},{"size":"295/35R21","calc":"29.1x11.6R21","diam":29.12992125984252,"w":295,"a":35,"r":21}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"265/45R21","calc":"30.4x10.4R21","diam":30.38976377952756,"w":265,"a":45,"r":21},{"size":"275/40R21","calc":"29.7x10.8R21","diam":29.661417322834644,"w":275,"a":40,"r":21},{"size":"285/40R21","calc":"30.0x11.2R21","diam":29.976377952755904,"w":285,"a":40,"r":21},{"size":"295/40R21","calc":"30.3x11.6R21","diam":30.291338582677167,"w":295,"a":40,"r":21},{"size":"315/35R21","calc":"29.7x12.4R21","diam":29.681102362204726,"w":315,"a":35,"r":21}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"265/45R21","calc":"30.4x10.4R21","diam":30.38976377952756,"w":265,"a":45,"r":21},{"size":"275/45R21","calc":"30.7x10.8R21","diam":30.744094488188978,"w":275,"a":45,"r":21},{"size":"295/40R21","calc":"30.3x11.6R21","diam":30.291338582677167,"w":295,"a":40,"r":21}]}],"22":[{"diamGroup":"27\" Tire Diameter","items":[{"size":"275/25R22","calc":"27.4x10.8R22","diam":27.413385826771652,"w":275,"a":25,"r":22}]},{"diamGroup":"28\" Tire Diameter","items":[{"size":"255/30R22","calc":"28.0x10.0R22","diam":28.023622047244096,"w":255,"a":30,"r":22},{"size":"265/30R22","calc":"28.3x10.4R22","diam":28.25984251968504,"w":265,"a":30,"r":22},{"size":"275/30R22","calc":"28.5x10.8R22","diam":28.496062992125985,"w":275,"a":30,"r":22},{"size":"285/25R22","calc":"27.6x11.2R22","diam":27.61023622047244,"w":285,"a":25,"r":22}]},{"diamGroup":"29\" Tire Diameter","items":[{"size":"255/35R22","calc":"29.0x10.0R22","diam":29.02755905511811,"w":255,"a":35,"r":22},{"size":"265/35R22","calc":"29.3x10.4R22","diam":29.303149606299215,"w":265,"a":35,"r":22},{"size":"275/30R22","calc":"28.5x10.8R22","diam":28.496062992125985,"w":275,"a":30,"r":22},{"size":"285/30R22","calc":"28.7x11.2R22","diam":28.73228346456693,"w":285,"a":30,"r":22},{"size":"295/30R22","calc":"29.0x11.6R22","diam":28.968503937007874,"w":295,"a":30,"r":22},{"size":"305/30R22","calc":"29.2x12.0R22","diam":29.20472440944882,"w":305,"a":30,"r":22}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"265/40R22","calc":"30.3x10.4R22","diam":30.346456692913385,"w":265,"a":40,"r":22},{"size":"275/35R22","calc":"29.6x10.8R22","diam":29.578740157480315,"w":275,"a":35,"r":22},{"size":"285/35R22","calc":"29.9x11.2R22","diam":29.85433070866142,"w":285,"a":35,"r":22},{"size":"295/35R22","calc":"30.1x11.6R22","diam":30.12992125984252,"w":295,"a":35,"r":22}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"265/40R22","calc":"30.3x10.4R22","diam":30.346456692913385,"w":265,"a":40,"r":22},{"size":"275/40R22","calc":"30.7x10.8R22","diam":30.661417322834644,"w":275,"a":40,"r":22},{"size":"285/40R22","calc":"31.0x11.2R22","diam":30.976377952755904,"w":285,"a":40,"r":22},{"size":"305/40R22","calc":"31.6x12.0R22","diam":31.606299212598426,"w":305,"a":40,"r":22}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"285/45R22","calc":"32.1x11.2R22","diam":32.09842519685039,"w":285,"a":45,"r":22},{"size":"305/40R22","calc":"31.6x12.0R22","diam":31.606299212598426,"w":305,"a":40,"r":22}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"305/45R22","calc":"32.8x12.0R22","diam":32.80708661417323,"w":305,"a":45,"r":22},{"size":"33X12.5R22","calc":"","diam":33,"w":318,"a":44,"r":22}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"35X12.5R22","calc":"","diam":35,"w":318,"a":52,"r":22}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X12.5R22","calc":"37x12.5R22","diam":37,"w":318,"a":60,"r":22}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X15.5R22","calc":"40x15.5R22","diam":40,"w":394,"a":62,"r":22}]}],"23":[{"diamGroup":"31\" Tire Diameter","items":[{"size":"285/35R23","calc":"30.9x11.2R23","diam":30.85433070866142,"w":285,"a":35,"r":23},{"size":"295/35R23","calc":"31.1x11.6R23","diam":31.12992125984252,"w":295,"a":35,"r":23},{"size":"305/35R23","calc":"31.4x12.0R23","diam":31.405511811023622,"w":305,"a":35,"r":23},{"size":"325/30R23","calc":"30.7x12.8R23","diam":30.67716535433071,"w":325,"a":30,"r":23}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"285/40R23","calc":"32.0x11.2R23","diam":31.976377952755904,"w":285,"a":40,"r":23},{"size":"305/35R23","calc":"31.4x12.0R23","diam":31.405511811023622,"w":305,"a":35,"r":23}]}],"24":[{"diamGroup":"29\" Tire Diameter","items":[{"size":"275/25R24","calc":"29.4x10.8R24","diam":29.4,"w":275,"a":25,"r":24}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"255/30R24","calc":"30x10R24","diam":30,"w":255,"a":30,"r":24},{"size":"275/30R24","calc":"30.5x10.8R24","diam":30.5,"w":275,"a":30,"r":24},{"size":"285/30R24","calc":"30.7x11.2R24","diam":30.7,"w":285,"a":30,"r":24}]},{"diamGroup":"31\" Tire Diameter","items":[{"size":"285/35R24","calc":"31.9x11.2R24","diam":31.9,"w":285,"a":35,"r":24},{"size":"295/30R24","calc":"31X11.6R24","diam":31,"w":295,"a":30,"r":24}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"295/35R24","calc":"32.1x11.6R24","diam":32.1,"w":295,"a":35,"r":24},{"size":"305/35R24","calc":"32.4x12R24","diam":32.4,"w":305,"a":35,"r":24},{"size":"315/35R24","calc":"32.7x12.4R24","diam":32.7,"w":315,"a":35,"r":24},{"size":"405/25R24","calc":"32x15.9R24","diam":32,"w":405,"a":25,"r":24}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"285/40R24","calc":"33x11.2R24","diam":33,"w":285,"a":40,"r":24},{"size":"295/40R24","calc":"33.3x11.6R24","diam":33.3,"w":295,"a":40,"r":24}]},{"diamGroup":"34\" Tire Diameter","items":[{"size":"385/35R24","calc":"34.6x15.2R24","diam":34.6,"w":385,"a":35,"r":24}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"325/45R24","calc":"35.5x12.8R24","diam":35.5,"w":325,"a":45,"r":24},{"size":"35X12.5R24","calc":"","diam":35,"w":318,"a":44,"r":24},{"size":"35X13.5R24","calc":"","diam":35,"w":343,"a":41,"r":24},{"size":"375/40R24","calc":"35.8X14.8R24","diam":35.8,"w":375,"a":40,"r":24}]},{"diamGroup":"36\" Tire Diameter","items":[{"size":"315/50R24","calc":"36.4X12.4R24","diam":36.4,"w":315,"a":50,"r":24}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X13.5R24","calc":"","diam":37,"w":343,"a":48,"r":24},{"size":"37X14.5R24","calc":"","diam":37,"w":368,"a":45,"r":24}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X13.5R24","calc":"","diam":38,"w":343,"a":52,"r":24},{"size":"38X14R24","calc":"","diam":38,"w":356,"a":50,"r":24},{"size":"38X15.5R24","calc":"","diam":38,"w":394,"a":45,"r":24}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X13.5R24","calc":"","diam":40,"w":343,"a":59,"r":24},{"size":"40X14.5R24","calc":"","diam":40,"w":368,"a":55,"r":24},{"size":"40X15.5R24","calc":"","diam":40,"w":394,"a":52,"r":24}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X15.5R24","calc":"","diam":42,"w":394,"a":58,"r":24}]}],"26":[{"diamGroup":"31\" Tire Diameter","items":[{"size":"275/25R26","calc":"31.4x10.8R26","diam":31.4,"w":275,"a":25,"r":26},{"size":"295/25R26","calc":"31.8x11.6R26","diam":31.8,"w":295,"a":25,"r":26}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"295/30R26","calc":"33x11.6R26","diam":33,"w":295,"a":30,"r":26},{"size":"305/30R26","calc":"33.2x12R26","diam":33.2,"w":305,"a":30,"r":26}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"315/40R26","calc":"35.9x12.4R26","diam":35.9,"w":315,"a":40,"r":26}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X13.5R26","calc":"","diam":37,"w":343,"a":41,"r":26}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X15.5R26","calc":"","diam":38,"w":394,"a":39,"r":26}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X13.5R26","calc":"","diam":40,"w":343,"a":52,"r":26},{"size":"40X15.5R26","calc":"","diam":40,"w":394,"a":45,"r":26}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X15.5R26","calc":"","diam":42,"w":394,"a":52,"r":26}]}],"28":[{"diamGroup":"33\" Tire Diameter","items":[{"size":"295/25R28","calc":"33.8x11.6R28","diam":33.8,"w":295,"a":25,"r":28}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"325/35R28","calc":"37x12.8R28","diam":37,"w":325,"a":35,"r":28}]},{"diamGroup":"40\" Tire Diameter","items":[{"size":"40X15.5R28","calc":"","diam":40,"w":394,"a":39,"r":28}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X15.5R28","calc":"","diam":42,"w":394,"a":45,"r":28}]}],"30":[{"diamGroup":"37\" Tire Diameter","items":[{"size":"315/30R30","calc":"37.4x12.4R30","diam":37.44094488188976,"w":315,"a":30,"r":30}]}],"16.5":[{"diamGroup":"29\" Tire Diameter","items":[{"size":"8.75R16.5","calc":"29.5x8.8R16.5","diam":29.5,"w":224,"a":74,"r":16.5}]},{"diamGroup":"30\" Tire Diameter","items":[{"size":"9.5R16.5","calc":"30.6x9.5R16.5","diam":30.6,"w":241,"a":74,"r":16.5}]},{"diamGroup":"32\" Tire Diameter","items":[{"size":"32X12R16.5","calc":"","diam":32,"w":305,"a":65,"r":16.5}]},{"diamGroup":"33\" Tire Diameter","items":[{"size":"33X11.5R16.5","calc":"","diam":33,"w":292,"a":72,"r":16.5},{"size":"33X12.5R16.5","calc":"","diam":33,"w":318,"a":66,"r":16.5},{"size":"33X14R16.5","calc":"","diam":33,"w":356,"a":59,"r":16.5},{"size":"33X14.5R16.5","calc":"","diam":33,"w":368,"a":57,"r":16.5},{"size":"33X15.5R16.5","calc":"","diam":33,"w":394,"a":53,"r":16.5}]},{"diamGroup":"35\" Tire Diameter","items":[{"size":"35X12.5R16.5","calc":"","diam":35,"w":318,"a":74,"r":16.5},{"size":"35X14.5R16.5","calc":"","diam":35,"w":368,"a":64,"r":16.5},{"size":"35X15R16.5","calc":"","diam":35,"w":381,"a":62,"r":16.5},{"size":"35X15.5R16.5","calc":"","diam":35,"w":394,"a":60,"r":16.5},{"size":"35X16R16.5","calc":"","diam":35,"w":406,"a":58,"r":16.5},{"size":"35X9.5R16.5","calc":"","diam":35,"w":241,"a":97,"r":16.5}]},{"diamGroup":"36\" Tire Diameter","items":[{"size":"36X12.5R16.5","calc":"","diam":36,"w":318,"a":78,"r":16.5},{"size":"36X13.5R16.5","calc":"","diam":36,"w":343,"a":72,"r":16.5},{"size":"36X14.5R16.5","calc":"","diam":36,"w":368,"a":67,"r":16.5},{"size":"36X16R16.5","calc":"","diam":36,"w":406,"a":61,"r":16.5}]},{"diamGroup":"37\" Tire Diameter","items":[{"size":"37X12.5R16.5","calc":"","diam":37,"w":318,"a":82,"r":16.5},{"size":"37X13R16.5","calc":"","diam":37,"w":330,"a":79,"r":16.5},{"size":"37X14R16.5","calc":"","diam":37,"w":356,"a":73,"r":16.5}]},{"diamGroup":"38\" Tire Diameter","items":[{"size":"38X11R16.5","calc":"","diam":38,"w":279,"a":98,"r":16.5},{"size":"38X12.5R16.5","calc":"","diam":38,"w":318,"a":86,"r":16.5},{"size":"38X15.5R16.5","calc":"","diam":38,"w":394,"a":69,"r":16.5},{"size":"38.5X11R16.5","calc":"","diam":38.5,"w":279,"a":100,"r":16.5},{"size":"38.5X13.5R16.5","calc":"","diam":38.5,"w":343,"a":81,"r":16.5},{"size":"38.5X14.5R16.5","calc":"","diam":38.5,"w":368,"a":76,"r":16.5},{"size":"38.5X15R16.5","calc":"","diam":38.5,"w":381,"a":73,"r":16.5},{"size":"38.5X16R16.5","calc":"","diam":38.5,"w":406,"a":69,"r":16.5}]},{"diamGroup":"39\" Tire Diameter","items":[{"size":"39X13.5R16.5","calc":"","diam":39,"w":343,"a":83,"r":16.5},{"size":"39.5X13.5R16.5","calc":"","diam":39.5,"w":343,"a":85,"r":16.5},{"size":"39.5X15R16.5","calc":"","diam":39.5,"w":381,"a":77,"r":16.5},{"size":"39.5X18R16.5","calc":"","diam":39.5,"w":457,"a":64,"r":16.5}]},{"diamGroup":"42\" Tire Diameter","items":[{"size":"42X14R16.5","calc":"","diam":42,"w":356,"a":91,"r":16.5},{"size":"42X15R16.5","calc":"","diam":42,"w":381,"a":85,"r":16.5},{"size":"42.5X13.5R16.5","calc":"","diam":42.5,"w":343,"a":96,"r":16.5}]},{"diamGroup":"43\" Tire Diameter","items":[{"size":"43X14.5R16.5","calc":"","diam":43,"w":368,"a":91,"r":16.5}]},{"diamGroup":"44\" Tire Diameter","items":[{"size":"44X18.5R16.5","calc":"","diam":44,"w":470,"a":74,"r":16.5},{"size":"44X18.5R16.5","calc":"","diam":44,"w":470,"a":74,"r":16.5},{"size":"44X19.5R16.5","calc":"","diam":44,"w":495,"a":71,"r":16.5},{"size":"44X21R16.5","calc":"","diam":44,"w":533,"a":65,"r":16.5}]},{"diamGroup":"47\" Tire Diameter","items":[{"size":"47X17R16.5","calc":"","diam":47,"w":432,"a":90,"r":16.5}]},{"diamGroup":"48\" Tire Diameter","items":[{"size":"48X12.5R16.5","calc":"","diam":48,"w":318,"a":126,"r":16.5}]},{"diamGroup":"49\" Tire Diameter","items":[{"size":"49X21R16.5","calc":"","diam":49,"w":533,"a":77,"r":16.5}]}]};

  function initWheelCharts() {
    const tabsBar = document.getElementById('wheel-tabs-bar');
    const subhead = document.getElementById('calc-charts-subhead');
    const body = document.getElementById('calc-charts-body');
    if (!tabsBar || !subhead || !body) return;

    function renderWheel(wheelKey) {
      if (subhead) subhead.textContent = `Tyre Size Calculator Chart for ${wheelKey}" Wheels`;
      const groups = WHEEL_CHARTS_DATA[wheelKey] || [];
      if (!groups.length) {
        body.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">No tyre chart entries found for ${wheelKey}" wheels.</div>`;
        return;
      }

      body.innerHTML = groups.map(g => `
        <div class="calc-chart-col">
          <div class="calc-chart-col-title">${g.diamGroup}</div>
          <ul class="calc-chart-list">
            ${g.items.map(it => `
              <li class="calc-chart-item">
                <button type="button" class="calc-chart-size-link" data-w="${it.w}" data-a="${it.a}" data-r="${it.r}">
                  ${it.size}
                </button>
                ${it.calc ? `<span class="calc-chart-equiv"> = ${it.calc}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');

      bindSizeLinks();
    }

    function bindSizeLinks() {
      body.querySelectorAll('.calc-chart-size-link').forEach(btn => {
        btn.addEventListener('click', () => {
          const w = parseInt(btn.getAttribute('data-w'), 10);
          const a = parseInt(btn.getAttribute('data-a'), 10);
          const r = parseFloat(btn.getAttribute('data-r'));
          const sizeText = btn.textContent.trim();

          if (state.activeTab === 'calculator') {
            state.t1.width = w;
            state.t1.aspect = a;
            state.t1.rim = r;
            if (dom.singleW) dom.singleW.value = w;
            if (dom.singleA) dom.singleA.value = a;
            if (dom.singleR) dom.singleR.value = r;
          } else {
            // Set as Size 2 in comparison mode
            state.t2.width = w;
            state.t2.aspect = a;
            state.t2.rim = r;
            if (dom.cmpW2) dom.cmpW2.value = w;
            if (dom.cmpA2) dom.cmpA2.value = a;
            if (dom.cmpR2) dom.cmpR2.value = r;
          }

          render();

          // Smooth scroll up to calculator
          const widget = document.getElementById('calc-box-widget');
          if (widget) {
            widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          if (typeof showToast === 'function') {
            showToast(`Loaded ${sizeText} into Tyre Calculator`, 'info');
          }
        });
      });
    }

    tabsBar.querySelectorAll('.calc-wheel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabsBar.querySelectorAll('.calc-wheel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const wheel = tab.getAttribute('data-wheel');
        renderWheel(wheel);
      });
    });

    const initialWheelTab = tabsBar.querySelector('.calc-wheel-tab.active');
    if (initialWheelTab) {
      renderWheel(initialWheelTab.getAttribute('data-wheel'));
    } else {
      bindSizeLinks();
    }
  }


  
  // --------------------------------------------------------------------------
  // Tire Diameter Charts Dataset & Logic (20" to 40")
  // --------------------------------------------------------------------------
  const DIAMETER_CHARTS_DATA = {"21":[{"wheelGroup":"13\" Wheel Size","items":[{"size":"185/60R13","calc":"21.7x7.3R13","diam":21.7,"w":185,"a":60,"r":13},{"size":"215/50R13","calc":"21.5X8.5R13","diam":21.5,"w":215,"a":50,"r":13},{"size":"225/45R13","calc":"21x8.9R13","diam":21,"w":225,"a":45,"r":13},{"size":"225/50R13","calc":"21.9x8.9R13","diam":21.9,"w":225,"a":50,"r":13},{"size":"255/40R13","calc":"21x10R13","diam":21,"w":255,"a":40,"r":13}]},{"wheelGroup":"14\" Wheel Size","items":[{"size":"165/55R14","calc":"21.1X6.5R14","diam":21.1,"w":165,"a":55,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"115/70R15","calc":"21.3X4.5R15","diam":21.3,"w":115,"a":70,"r":15},{"size":"125/70R15","calc":"21.9X4.9R15","diam":21.9,"w":125,"a":70,"r":15},{"size":"165/50R15","calc":"21.5X6.5R15","diam":21.5,"w":165,"a":50,"r":15},{"size":"195/45R15","calc":"21.9x7.7R15","diam":21.9,"w":195,"a":45,"r":15}]}],"22":[{"wheelGroup":"13\" Wheel Size","items":[{"size":"155/80R13","calc":"22.8x6.1R13","diam":22.8,"w":155,"a":80,"r":13},{"size":"175/70R13","calc":"22.6x6.9R13","diam":22.6,"w":175,"a":70,"r":13},{"size":"205/60R13","calc":"22.7x8.1R13","diam":22.7,"w":205,"a":60,"r":13},{"size":"22X8R13","calc":"","diam":22,"w":203,"a":56,"r":13}]},{"wheelGroup":"14\" Wheel Size","items":[{"size":"135/80R14","calc":"22.5X5.3R14","diam":22.5,"w":135,"a":80,"r":14},{"size":"165/65R14","calc":"22.4x6.5R14","diam":22.4,"w":165,"a":65,"r":14},{"size":"185/55R14","calc":"22x7.3R14","diam":22,"w":185,"a":55,"r":14},{"size":"185/60R14","calc":"22.7x7.3R14","diam":22.7,"w":185,"a":60,"r":14},{"size":"195/55R14","calc":"22.4x7.7R14","diam":22.4,"w":195,"a":55,"r":14},{"size":"205/50R14","calc":"22.1x8.1R14","diam":22.1,"w":205,"a":50,"r":14},{"size":"205/55R14","calc":"22.9x8.1R14","diam":22.9,"w":205,"a":55,"r":14},{"size":"225/50R14","calc":"22.9x8.9R14","diam":22.9,"w":225,"a":50,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"125/80R15","calc":"22.9X4.9R15","diam":22.9,"w":125,"a":80,"r":15},{"size":"145/65R15","calc":"22.4x5.7R15","diam":22.4,"w":145,"a":65,"r":15},{"size":"155/60R15","calc":"22.3x6.1R15","diam":22.3,"w":155,"a":60,"r":15},{"size":"165/60R15","calc":"22.8x6.5R15","diam":22.8,"w":165,"a":60,"r":15},{"size":"175/55R15","calc":"22.6x6.9R15","diam":22.6,"w":175,"a":55,"r":15},{"size":"195/50R15","calc":"22.7x7.7R15","diam":22.7,"w":195,"a":50,"r":15},{"size":"22X8R15","calc":"","diam":22,"w":203,"a":44,"r":15},{"size":"22.5X4.5R15","calc":"","diam":22.5,"w":114,"a":83,"r":15},{"size":"245/40R15","calc":"22.7X9.6R15","diam":22.7,"w":245,"a":40,"r":15},{"size":"275/35R15","calc":"22.6x10.8R15","diam":22.6,"w":275,"a":35,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"125/70R16","calc":"22.9X4.9R16","diam":22.9,"w":125,"a":70,"r":16},{"size":"175/50R16","calc":"22.9x6.9R16","diam":22.9,"w":175,"a":50,"r":16},{"size":"195/40R16","calc":"22.1x7.7R16","diam":22.1,"w":195,"a":40,"r":16},{"size":"195/45R16","calc":"22.9x7.7R16","diam":22.9,"w":195,"a":45,"r":16},{"size":"205/40R16","calc":"22.5x8.1R16","diam":22.5,"w":205,"a":40,"r":16},{"size":"215/35R16","calc":"21.9x8.5R16","diam":21.9,"w":215,"a":35,"r":16},{"size":"215/40R16","calc":"22.8x8.5R16","diam":22.8,"w":215,"a":40,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"22X2.5R17","calc":"","diam":22,"w":64,"a":100,"r":17}]}],"23":[{"wheelGroup":"13\" Wheel Size","items":[{"size":"165/80R13","calc":"23.4X6.5R13","diam":23.4,"w":165,"a":80,"r":13},{"size":"185/70R13","calc":"23.2x7.3R13","diam":23.2,"w":185,"a":70,"r":13}]},{"wheelGroup":"14\" Wheel Size","items":[{"size":"175/65R14","calc":"23x6.9R14","diam":23,"w":175,"a":65,"r":14},{"size":"175/70R14","calc":"23.6x6.9R14","diam":23.6,"w":175,"a":70,"r":14},{"size":"185/65R14","calc":"23.5x7.3R14","diam":23.5,"w":185,"a":65,"r":14},{"size":"195/60R14","calc":"23.2x7.7R14","diam":23.2,"w":195,"a":60,"r":14},{"size":"205/60R14","calc":"23.7x8.1R14","diam":23.7,"w":205,"a":60,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"135/80R15","calc":"23.5X5.3R15","diam":23.5,"w":135,"a":80,"r":15},{"size":"165/65R15","calc":"23.4X6.5R15","diam":23.4,"w":165,"a":65,"r":15},{"size":"175/60R15","calc":"23.3x6.9R15","diam":23.3,"w":175,"a":60,"r":15},{"size":"185/55R15","calc":"23x7.3R15","diam":23,"w":185,"a":55,"r":15},{"size":"185/60R15","calc":"23.7x7.3R15","diam":23.7,"w":185,"a":60,"r":15},{"size":"195/55R15","calc":"23.4x7.7R15","diam":23.4,"w":195,"a":55,"r":15},{"size":"205/50R15","calc":"23.1x8.1R15","diam":23.1,"w":205,"a":50,"r":15},{"size":"205/55R15","calc":"23.9x8.1R15","diam":23.9,"w":205,"a":55,"r":15},{"size":"225/45R15","calc":"23x8.9R15","diam":23,"w":225,"a":45,"r":15},{"size":"225/50R15","calc":"23.9x8.9R15","diam":23.9,"w":225,"a":50,"r":15},{"size":"295/35R15","calc":"23.1X11.6R15","diam":23.1,"w":295,"a":35,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"125/80R16","calc":"23.9X4.9R16","diam":23.9,"w":125,"a":80,"r":16},{"size":"135/70R16","calc":"23.4X5.3R16","diam":23.4,"w":135,"a":70,"r":16},{"size":"175/55R16","calc":"23.6x6.9R16","diam":23.6,"w":175,"a":55,"r":16},{"size":"185/50R16","calc":"23.3X7.3R16","diam":23.3,"w":185,"a":50,"r":16},{"size":"195/50R16","calc":"23.7x7.7R16","diam":23.7,"w":195,"a":50,"r":16},{"size":"205/45R16","calc":"23.3x8.1R16","diam":23.3,"w":205,"a":45,"r":16},{"size":"215/45R16","calc":"23.6x8.5R16","diam":23.6,"w":215,"a":45,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"125/70R17","calc":"23.9X4.9R17","diam":23.9,"w":125,"a":70,"r":17},{"size":"195/40R17","calc":"23.1x7.7R17","diam":23.1,"w":195,"a":40,"r":17},{"size":"195/45R17","calc":"23.9x7.7R17","diam":23.9,"w":195,"a":45,"r":17},{"size":"205/40R17","calc":"23.5x8.1R17","diam":23.5,"w":205,"a":40,"r":17},{"size":"215/35R17","calc":"22.9x8.5R17","diam":22.9,"w":215,"a":35,"r":17},{"size":"215/40R17","calc":"23.8x8.5R17","diam":23.8,"w":215,"a":40,"r":17},{"size":"225/35R17","calc":"23.2x8.9R17","diam":23.2,"w":225,"a":35,"r":17},{"size":"245/35R17","calc":"23.8x9.6R17","diam":23.8,"w":245,"a":35,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"215/35R18","calc":"23.9x8.5R18","diam":23.9,"w":215,"a":35,"r":18}]}],"24":[{"wheelGroup":"13\" Wheel Size","items":[{"size":"175/80R13","calc":"24.0x6.9R13","diam":24.023622047244096,"w":175,"a":80,"r":13},{"size":"185/80R13","calc":"24.7x7.3R13","diam":24.653543307086615,"w":185,"a":80,"r":13},{"size":"24.5X8R13","calc":"","diam":24.5,"w":203,"a":72,"r":13},{"size":"24.5X9R13","calc":"","diam":24.5,"w":229,"a":64,"r":13}]},{"wheelGroup":"14\" Wheel Size","items":[{"size":"185/70R14","calc":"24.2x7.3R14","diam":24.2,"w":185,"a":70,"r":14},{"size":"185/75R14","calc":"24.9X7.3R14","diam":24.9,"w":185,"a":75,"r":14},{"size":"195/65R14","calc":"24x7.7R14","diam":24,"w":195,"a":65,"r":14},{"size":"195/70R14","calc":"24.7x7.7R14","diam":24.7,"w":195,"a":70,"r":14},{"size":"215/60R14","calc":"24.2x8.5R14","diam":24.2,"w":215,"a":60,"r":14},{"size":"225/60R14","calc":"24.6x8.9R14","diam":24.6,"w":225,"a":60,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"135/90R15","calc":"24.6X5.3R15","diam":24.6,"w":135,"a":90,"r":15},{"size":"155/80R15","calc":"24.8X6.1R15","diam":24.8,"w":155,"a":80,"r":15},{"size":"175/65R15","calc":"24x6.9R15","diam":24,"w":175,"a":65,"r":15},{"size":"185/65R15","calc":"24.5x7.3R15","diam":24.5,"w":185,"a":65,"r":15},{"size":"195/60R15","calc":"24.2x7.7R15","diam":24.2,"w":195,"a":60,"r":15},{"size":"205/60R15","calc":"24.7x8.1R15","diam":24.7,"w":205,"a":60,"r":15},{"size":"225/55R15","calc":"24.7x8.9R15","diam":24.7,"w":225,"a":55,"r":15},{"size":"235/50R15","calc":"24.3x9.3R15","diam":24.3,"w":235,"a":50,"r":15},{"size":"24X4.5R15","calc":"","diam":24,"w":114,"a":100,"r":15},{"size":"24X5R15","calc":"","diam":24,"w":127,"a":90,"r":15},{"size":"24.5X8R15","calc":"","diam":24.5,"w":203,"a":59,"r":15},{"size":"245/50R15","calc":"24.6x9.6R15","diam":24.6,"w":245,"a":50,"r":15},{"size":"345/35R15","calc":"24.5x13.6R15","diam":24.5,"w":345,"a":35,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"125/85R16","calc":"24.4X4.9R16","diam":24.4,"w":125,"a":85,"r":16},{"size":"125/90R16","calc":"24.9X4.9R16","diam":24.9,"w":125,"a":90,"r":16},{"size":"135/80R16","calc":"24.5X5.3R16","diam":24.5,"w":135,"a":80,"r":16},{"size":"175/60R16","calc":"24.3x6.9R16","diam":24.3,"w":175,"a":60,"r":16},{"size":"185/55R16","calc":"24x7.3R16","diam":24,"w":185,"a":55,"r":16},{"size":"185/60R16","calc":"24.7X7.3R16","diam":24.7,"w":185,"a":60,"r":16},{"size":"195/55R16","calc":"24.4x7.7R16","diam":24.4,"w":195,"a":55,"r":16},{"size":"205/50R16","calc":"24.1x8.1R16","diam":24.1,"w":205,"a":50,"r":16},{"size":"205/55R16","calc":"24.9x8.1R16","diam":24.9,"w":205,"a":55,"r":16},{"size":"215/50R16","calc":"24.5X8.5R16","diam":24.5,"w":215,"a":50,"r":16},{"size":"225/45R16","calc":"24x8.9R16","diam":24,"w":225,"a":45,"r":16},{"size":"225/50R16","calc":"24.9x8.9R16","diam":24.9,"w":225,"a":50,"r":16},{"size":"245/45R16","calc":"24.7x9.6R16","diam":24.7,"w":245,"a":45,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"125/80R17","calc":"24.9X4.9R17","diam":24.9,"w":125,"a":80,"r":17},{"size":"135/70R17","calc":"24.4X5.3R17","diam":24.4,"w":135,"a":70,"r":17},{"size":"205/45R17","calc":"24.3x8.1R17","diam":24.3,"w":205,"a":45,"r":17},{"size":"215/45R17","calc":"24.6x8.5R17","diam":24.6,"w":215,"a":45,"r":17},{"size":"225/40R17","calc":"24.1x8.9R17","diam":24.1,"w":225,"a":40,"r":17},{"size":"235/40R17","calc":"24.4x9.3R17","diam":24.4,"w":235,"a":40,"r":17},{"size":"245/40R17","calc":"24.7x9.6R17","diam":24.7,"w":245,"a":40,"r":17},{"size":"275/35R17","calc":"24.6x10.8R17","diam":24.6,"w":275,"a":35,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"125/70R18","calc":"24.9X4.9R18","diam":24.9,"w":125,"a":70,"r":18},{"size":"205/40R18","calc":"24.5x8.1R18","diam":24.5,"w":205,"a":40,"r":18},{"size":"215/40R18","calc":"24.8x8.5R18","diam":24.8,"w":215,"a":40,"r":18},{"size":"225/35R18","calc":"24.2x8.9R18","diam":24.2,"w":225,"a":35,"r":18},{"size":"235/35R18","calc":"24.5x9.3R18","diam":24.5,"w":235,"a":35,"r":18},{"size":"245/35R18","calc":"24.8x9.6R18","diam":24.8,"w":245,"a":35,"r":18},{"size":"285/30R18","calc":"24.7x11.2R18","diam":24.7,"w":285,"a":30,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"215/35R19","calc":"24.9x8.5R19","diam":24.9,"w":215,"a":35,"r":19},{"size":"235/30R19","calc":"24.6x9.3R19","diam":24.6,"w":235,"a":30,"r":19},{"size":"245/30R19","calc":"24.8x9.6R19","diam":24.8,"w":245,"a":30,"r":19},{"size":"295/25R19","calc":"24.8X11.6R19","diam":24.8,"w":295,"a":25,"r":19}]}],"25":[{"wheelGroup":"13\" Wheel Size","items":[{"size":"185/80R13","calc":"24.7x7.3R13","diam":24.653543307086615,"w":185,"a":80,"r":13},{"size":"24.5X8R13","calc":"","diam":24.5,"w":203,"a":72,"r":13},{"size":"24.5X9R13","calc":"","diam":24.5,"w":229,"a":64,"r":13}]},{"wheelGroup":"14\" Wheel Size","items":[{"size":"185R14","calc":"25.7x7.3R14","diam":25.7,"w":185,"a":80,"r":14},{"size":"195/75R14","calc":"25.5x7.7R14","diam":25.5,"w":195,"a":75,"r":14},{"size":"205/70R14","calc":"25.3x8.1R14","diam":25.3,"w":205,"a":70,"r":14},{"size":"215/70R14","calc":"25.9x8.5R14","diam":25.9,"w":215,"a":70,"r":14},{"size":"235/60R14","calc":"25.1x9.3R14","diam":25.1,"w":235,"a":60,"r":14},{"size":"245/60R14","calc":"25.6x9.6R14","diam":25.6,"w":245,"a":60,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"165/80R15","calc":"25.4X6.5R15","diam":25.4,"w":165,"a":80,"r":15},{"size":"185/70R15","calc":"25.2x7.3R15","diam":25.2,"w":185,"a":70,"r":15},{"size":"195/65R15","calc":"25x7.7R15","diam":25,"w":195,"a":65,"r":15},{"size":"195/70R15","calc":"25.7x7.7R15","diam":25.7,"w":195,"a":70,"r":15},{"size":"205/65R15","calc":"25.5x8.1R15","diam":25.5,"w":205,"a":65,"r":15},{"size":"215/60R15","calc":"25.2x8.5R15","diam":25.2,"w":215,"a":60,"r":15},{"size":"225/60R15","calc":"25.6x8.9R15","diam":25.6,"w":225,"a":60,"r":15},{"size":"265/50R15","calc":"25.4X10.4R15","diam":25.4,"w":265,"a":50,"r":15},{"size":"275/50R15","calc":"25.8x10.8R15","diam":25.8,"w":275,"a":50,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"135/90R16","calc":"25.6X5.3R16","diam":25.6,"w":135,"a":90,"r":16},{"size":"145/80R16","calc":"25.1X5.7R16","diam":25.1,"w":145,"a":80,"r":16},{"size":"195/60R16","calc":"25.2x7.7R16","diam":25.2,"w":195,"a":60,"r":16},{"size":"205/60R16","calc":"25.7x8.1R16","diam":25.7,"w":205,"a":60,"r":16},{"size":"215/55R16","calc":"25.3x8.5R16","diam":25.3,"w":215,"a":55,"r":16},{"size":"225/55R16","calc":"25.7x8.9R16","diam":25.7,"w":225,"a":55,"r":16},{"size":"245/50R16","calc":"25.6x9.6R16","diam":25.6,"w":245,"a":50,"r":16},{"size":"265/45R16","calc":"25.4X10.4R16","diam":25.4,"w":265,"a":45,"r":16},{"size":"275/45R16","calc":"25.7x10.8R16","diam":25.7,"w":275,"a":45,"r":16},{"size":"315/40R16","calc":"25.9X12.4R16","diam":25.9,"w":315,"a":40,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"115/95R17","calc":"25.6X4.5R17","diam":25.6,"w":115,"a":95,"r":17},{"size":"135/80R17","calc":"25.5X5.3R17","diam":25.5,"w":135,"a":80,"r":17},{"size":"145/70R17","calc":"25X5.7R17","diam":25,"w":145,"a":70,"r":17},{"size":"155/70R17","calc":"25.5X6.1R17","diam":25.5,"w":155,"a":70,"r":17},{"size":"205/50R17","calc":"25.1x8.1R17","diam":25.1,"w":205,"a":50,"r":17},{"size":"205/55R17","calc":"25.9x8.1R17","diam":25.9,"w":205,"a":55,"r":17},{"size":"215/50R17","calc":"25.5x8.5R17","diam":25.5,"w":215,"a":50,"r":17},{"size":"225/45R17","calc":"25x8.9R17","diam":25,"w":225,"a":45,"r":17},{"size":"225/50R17","calc":"25.9x8.9R17","diam":25.9,"w":225,"a":50,"r":17},{"size":"235/45R17","calc":"25.3x9.3R17","diam":25.3,"w":235,"a":45,"r":17},{"size":"245/45R17","calc":"25.7x9.6R17","diam":25.7,"w":245,"a":45,"r":17},{"size":"255/40R17","calc":"25x10R17","diam":25,"w":255,"a":40,"r":17},{"size":"265/40R17","calc":"25.3x10.4R17","diam":25.3,"w":265,"a":40,"r":17},{"size":"275/40R17","calc":"25.7x10.8R17","diam":25.7,"w":275,"a":40,"r":17},{"size":"295/35R17","calc":"25.1x11.6R17","diam":25.1,"w":295,"a":35,"r":17},{"size":"315/35R17","calc":"25.7x12.4R17","diam":25.7,"w":315,"a":35,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"135/70R18","calc":"25.4X5.3R18","diam":25.4,"w":135,"a":70,"r":18},{"size":"155/60R18","calc":"25.3X6.1R18","diam":25.3,"w":155,"a":60,"r":18},{"size":"215/45R18","calc":"25.6x8.5R18","diam":25.6,"w":215,"a":45,"r":18},{"size":"225/40R18","calc":"25.1x8.9R18","diam":25.1,"w":225,"a":40,"r":18},{"size":"235/40R18","calc":"25.4x9.3R18","diam":25.4,"w":235,"a":40,"r":18},{"size":"245/40R18","calc":"25.7x9.6R18","diam":25.7,"w":245,"a":40,"r":18},{"size":"255/35R18","calc":"25x10R18","diam":25,"w":255,"a":35,"r":18},{"size":"265/35R18","calc":"25.3x10.4R18","diam":25.3,"w":265,"a":35,"r":18},{"size":"275/35R18","calc":"25.6x10.8R18","diam":25.6,"w":275,"a":35,"r":18},{"size":"285/35R18","calc":"25.9x11.2R18","diam":25.9,"w":285,"a":35,"r":18},{"size":"295/30R18","calc":"25x11.6R18","diam":25,"w":295,"a":30,"r":18},{"size":"305/30R18","calc":"25.2x12R18","diam":25.2,"w":305,"a":30,"r":18},{"size":"315/30R18","calc":"25.4x12.4R18","diam":25.4,"w":315,"a":30,"r":18},{"size":"335/30R18","calc":"25.9x13.2R18","diam":25.9,"w":335,"a":30,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"115/70R19","calc":"25.3X4.5R19","diam":25.3,"w":115,"a":70,"r":19},{"size":"125/70R19","calc":"25.9X4.9R19","diam":25.9,"w":125,"a":70,"r":19},{"size":"225/35R19","calc":"25.2x8.9R19","diam":25.2,"w":225,"a":35,"r":19},{"size":"235/35R19","calc":"25.5x9.3R19","diam":25.5,"w":235,"a":35,"r":19},{"size":"245/35R19","calc":"25.8x9.6R19","diam":25.8,"w":245,"a":35,"r":19},{"size":"255/30R19","calc":"25x10R19","diam":25,"w":255,"a":30,"r":19},{"size":"265/30R19","calc":"25.3x10.4R19","diam":25.3,"w":265,"a":30,"r":19},{"size":"275/30R19","calc":"25.5x10.8R19","diam":25.5,"w":275,"a":30,"r":19},{"size":"285/30R19","calc":"25.7x11.2R19","diam":25.7,"w":285,"a":30,"r":19},{"size":"315/25R19","calc":"25.2x12.4R19","diam":25.2,"w":315,"a":25,"r":19}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"215/30R20","calc":"25.1X8.5R20","diam":25.1,"w":215,"a":30,"r":20},{"size":"225/30R20","calc":"25.3x8.9R20","diam":25.3,"w":225,"a":30,"r":20},{"size":"235/30R20","calc":"25.6x9.3R20","diam":25.6,"w":235,"a":30,"r":20},{"size":"245/30R20","calc":"25.8x9.6R20","diam":25.8,"w":245,"a":30,"r":20},{"size":"275/25R20","calc":"25.4X10.8R20","diam":25.4,"w":275,"a":25,"r":20},{"size":"285/25R20","calc":"25.6x11.2R20","diam":25.6,"w":285,"a":25,"r":20},{"size":"295/25R20","calc":"25.8x11.6R20","diam":25.8,"w":295,"a":25,"r":20}]}],"26":[{"wheelGroup":"14\" Wheel Size","items":[{"size":"195R14","calc":"26.2x7.8R14","diam":26.2,"w":195,"a":80,"r":14},{"size":"205/75R14","calc":"26.1x8.1R14","diam":26.1,"w":205,"a":75,"r":14},{"size":"215/75R14","calc":"26.7x8.5R14","diam":26.7,"w":215,"a":75,"r":14},{"size":"225/70R14","calc":"26.4x8.9R14","diam":26.4,"w":225,"a":70,"r":14},{"size":"26X8.5R14","calc":"","diam":26,"w":216,"a":70,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"205/70R15","calc":"26.3x8.1R15","diam":26.3,"w":205,"a":70,"r":15},{"size":"215/65R15","calc":"26x8.5R15","diam":26,"w":215,"a":65,"r":15},{"size":"215/70R15","calc":"26.9x8.5R15","diam":26.9,"w":215,"a":70,"r":15},{"size":"235/60R15","calc":"26.1x9.3R15","diam":26.1,"w":235,"a":60,"r":15},{"size":"245/60R15","calc":"26.6x9.6R15","diam":26.6,"w":245,"a":60,"r":15},{"size":"26X10R15","calc":"","diam":26,"w":254,"a":55,"r":15},{"size":"26X10.5R15","calc":"","diam":26,"w":267,"a":52,"r":15},{"size":"26X11.5R15","calc":"","diam":26,"w":292,"a":48,"r":15},{"size":"26X6R15","calc":"","diam":26,"w":152,"a":92,"r":15},{"size":"26X7.5R15","calc":"","diam":26,"w":191,"a":73,"r":15},{"size":"26X8R15","calc":"","diam":26,"w":203,"a":69,"r":15},{"size":"26X8.5R15","calc":"","diam":26,"w":216,"a":65,"r":15},{"size":"295/50R15","calc":"26.6x11.6R15","diam":26.6,"w":295,"a":50,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"145/90R16","calc":"26.3X5.7R16","diam":26.3,"w":145,"a":90,"r":16},{"size":"145/90R16","calc":"26.3X5.7R16","diam":26.3,"w":145,"a":90,"r":16},{"size":"195/65R16","calc":"26X7.7R16","diam":26,"w":195,"a":65,"r":16},{"size":"205/65R16","calc":"26.5x8.1R16","diam":26.5,"w":205,"a":65,"r":16},{"size":"215/60R16","calc":"26.2x8.5R16","diam":26.2,"w":215,"a":60,"r":16},{"size":"225/60R16","calc":"26.6x8.9R16","diam":26.6,"w":225,"a":60,"r":16},{"size":"235/55R16","calc":"26.2x9.3R16","diam":26.2,"w":235,"a":55,"r":16},{"size":"255/50R16","calc":"26x10R16","diam":26,"w":255,"a":50,"r":16},{"size":"26X11.5R16","calc":"","diam":26,"w":292,"a":43,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"135/90R17","calc":"26.6X5.3R17","diam":26.6,"w":135,"a":90,"r":17},{"size":"145/80R17","calc":"26.1X5.7R17","diam":26.1,"w":145,"a":80,"r":17},{"size":"155/80R17","calc":"26.8X6.1R17","diam":26.8,"w":155,"a":80,"r":17},{"size":"215/55R17","calc":"26.3x8.5R17","diam":26.3,"w":215,"a":55,"r":17},{"size":"225/55R17","calc":"26.7x8.9R17","diam":26.7,"w":225,"a":55,"r":17},{"size":"235/50R17","calc":"26.3x9.3R17","diam":26.3,"w":235,"a":50,"r":17},{"size":"245/50R17","calc":"26.6x9.6R17","diam":26.6,"w":245,"a":50,"r":17},{"size":"255/45R17","calc":"26x10R17","diam":26,"w":255,"a":45,"r":17},{"size":"26X11.5R17","calc":"","diam":26,"w":292,"a":39,"r":17},{"size":"285/40R17","calc":"26x11.2R17","diam":26,"w":285,"a":40,"r":17},{"size":"295/40R17","calc":"26.3x11.6R17","diam":26.3,"w":295,"a":40,"r":17},{"size":"335/35R17","calc":"26.2x13.2R17","diam":26.2,"w":335,"a":35,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"135/80R18","calc":"26.5X5.3R18","diam":26.5,"w":135,"a":80,"r":18},{"size":"145/70R18","calc":"26X5.7R18","diam":26,"w":145,"a":70,"r":18},{"size":"215/50R18","calc":"26.5X8.5R18","diam":26.5,"w":215,"a":50,"r":18},{"size":"225/45R18","calc":"26x8.9R18","diam":26,"w":225,"a":45,"r":18},{"size":"225/50R18","calc":"26.9x8.9R18","diam":26.9,"w":225,"a":50,"r":18},{"size":"235/45R18","calc":"26.3x9.3R18","diam":26.3,"w":235,"a":45,"r":18},{"size":"245/45R18","calc":"26.7x9.6R18","diam":26.7,"w":245,"a":45,"r":18},{"size":"255/40R18","calc":"26x10R18","diam":26,"w":255,"a":40,"r":18},{"size":"26X12R18","calc":"","diam":26,"w":305,"a":33,"r":18},{"size":"265/40R18","calc":"26.3x10.4R18","diam":26.3,"w":265,"a":40,"r":18},{"size":"275/40R18","calc":"26.7x10.8R18","diam":26.7,"w":275,"a":40,"r":18},{"size":"295/35R18","calc":"26.1x11.6R18","diam":26.1,"w":295,"a":35,"r":18},{"size":"305/35R18","calc":"26.4x12R18","diam":26.4,"w":305,"a":35,"r":18},{"size":"315/35R18","calc":"26.7x12.4R18","diam":26.7,"w":315,"a":35,"r":18},{"size":"345/30R18","calc":"26.1x13.6R18","diam":26.1,"w":345,"a":30,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"135/70R19","calc":"26.4X5.3R19","diam":26.4,"w":135,"a":70,"r":19},{"size":"225/40R19","calc":"26.1x8.9R19","diam":26.1,"w":225,"a":40,"r":19},{"size":"235/40R19","calc":"26.4x9.3R19","diam":26.4,"w":235,"a":40,"r":19},{"size":"245/40R19","calc":"26.7x9.6R19","diam":26.7,"w":245,"a":40,"r":19},{"size":"255/35R19","calc":"26x10R19","diam":26,"w":255,"a":35,"r":19},{"size":"265/35R19","calc":"26.3x10.4R19","diam":26.3,"w":265,"a":35,"r":19},{"size":"275/35R19","calc":"26.6x10.8R19","diam":26.6,"w":275,"a":35,"r":19},{"size":"285/35R19","calc":"26.9x11.2R19","diam":26.9,"w":285,"a":35,"r":19},{"size":"295/30R19","calc":"26x11.6R19","diam":26,"w":295,"a":30,"r":19},{"size":"305/30R19","calc":"26.2x12R19","diam":26.2,"w":305,"a":30,"r":19},{"size":"315/30R19","calc":"26.4x12.4R19","diam":26.4,"w":315,"a":30,"r":19},{"size":"325/30R19","calc":"26.7x12.8R19","diam":26.7,"w":325,"a":30,"r":19},{"size":"335/30R19","calc":"26.9x13.2R19","diam":26.9,"w":335,"a":30,"r":19}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"145/60R20","calc":"26.9X5.7R20","diam":26.9,"w":145,"a":60,"r":20},{"size":"225/35R20","calc":"26.2x8.9R20","diam":26.2,"w":225,"a":35,"r":20},{"size":"235/35R20","calc":"26.5x9.3R20","diam":26.5,"w":235,"a":35,"r":20},{"size":"245/35R20","calc":"26.8x9.6R20","diam":26.8,"w":245,"a":35,"r":20},{"size":"255/30R20","calc":"26x10R20","diam":26,"w":255,"a":30,"r":20},{"size":"265/30R20","calc":"26.3x10.4R20","diam":26.3,"w":265,"a":30,"r":20},{"size":"275/30R20","calc":"26.5x10.8R20","diam":26.5,"w":275,"a":30,"r":20},{"size":"285/30R20","calc":"26.7x11.2R20","diam":26.7,"w":285,"a":30,"r":20},{"size":"305/25R20","calc":"26x12R20","diam":26,"w":305,"a":25,"r":20},{"size":"315/25R20","calc":"26.2x12.4R20","diam":26.2,"w":315,"a":25,"r":20},{"size":"325/25R20","calc":"26.4x12.8R20","diam":26.4,"w":325,"a":25,"r":20},{"size":"335/25R20","calc":"26.6x13.2R20","diam":26.6,"w":335,"a":25,"r":20},{"size":"345/25R20","calc":"26.8x13.6R20","diam":26.8,"w":345,"a":25,"r":20}]}],"27":[{"wheelGroup":"14\" Wheel Size","items":[{"size":"205R14","calc":"27x8.2R14","diam":27,"w":205,"a":80,"r":14},{"size":"27X8.5R14","calc":"","diam":27,"w":216,"a":76,"r":14},{"size":"27X9.5R14","calc":"","diam":27,"w":241,"a":68,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"205/75R15","calc":"27.1x8.1R15","diam":27.1,"w":205,"a":75,"r":15},{"size":"215/75R15","calc":"27.7x8.5R15","diam":27.7,"w":215,"a":75,"r":15},{"size":"225/70R15","calc":"27.4x8.9R15","diam":27.4,"w":225,"a":70,"r":15},{"size":"255/60R15","calc":"27x10R15","diam":27,"w":255,"a":60,"r":15},{"size":"27X10.5R15","calc":"","diam":27,"w":267,"a":57,"r":15},{"size":"27X9.5R15","calc":"","diam":27,"w":241,"a":63,"r":15},{"size":"27.5X4.5R15","calc":"","diam":27.5,"w":114,"a":139,"r":15},{"size":"295/55R15","calc":"27.8X11.6R15","diam":27.8,"w":295,"a":55,"r":15},{"size":"325/50R15","calc":"27.8x12.8R15","diam":27.8,"w":325,"a":50,"r":15},{"size":"E78-15","calc":"27x6.5R15","diam":27,"w":165,"a":92,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"155/90R16","calc":"27X6.1R16","diam":27,"w":155,"a":90,"r":16},{"size":"195/75R16","calc":"27.5x7.7R16","diam":27.5,"w":195,"a":75,"r":16},{"size":"205/70R16","calc":"27.3x8.1R16","diam":27.3,"w":205,"a":70,"r":16},{"size":"215/65R16","calc":"27x8.5R16","diam":27,"w":215,"a":65,"r":16},{"size":"215/70R16","calc":"27.9x8.5R16","diam":27.9,"w":215,"a":70,"r":16},{"size":"225/65R16","calc":"27.5x8.9R16","diam":27.5,"w":225,"a":65,"r":16},{"size":"235/60R16","calc":"27.1x9.3R16","diam":27.1,"w":235,"a":60,"r":16},{"size":"295/50R16","calc":"27.6x11.6R16","diam":27.6,"w":295,"a":50,"r":16},{"size":"355/40R16","calc":"27.2X14R16","diam":27.2,"w":355,"a":40,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"145/90R17","calc":"27.3X5.7R17","diam":27.3,"w":145,"a":90,"r":17},{"size":"165/80R17","calc":"27.4X6.5R17","diam":27.4,"w":165,"a":80,"r":17},{"size":"215/60R17","calc":"27.2x8.5R17","diam":27.2,"w":215,"a":60,"r":17},{"size":"225/60R17","calc":"27.6x8.9R17","diam":27.6,"w":225,"a":60,"r":17},{"size":"235/55R17","calc":"27.2x9.3R17","diam":27.2,"w":235,"a":55,"r":17},{"size":"245/55R17","calc":"27.6x9.6R17","diam":27.6,"w":245,"a":55,"r":17},{"size":"255/50R17","calc":"27x10R17","diam":27,"w":255,"a":50,"r":17},{"size":"275/50R17","calc":"27.8X10.8R17","diam":27.8,"w":275,"a":50,"r":17},{"size":"305/45R17","calc":"27.8X12R17","diam":27.8,"w":305,"a":45,"r":17},{"size":"345/40R17","calc":"27.9x13.6R17","diam":27.9,"w":345,"a":40,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"145/80R18","calc":"27.1X5.7R18","diam":27.1,"w":145,"a":80,"r":18},{"size":"145/85R18","calc":"27.7X5.7R18","diam":27.7,"w":145,"a":85,"r":18},{"size":"215/55R18","calc":"27.3x8.5R18","diam":27.3,"w":215,"a":55,"r":18},{"size":"225/55R18","calc":"27.7x8.9R18","diam":27.7,"w":225,"a":55,"r":18},{"size":"235/50R18","calc":"27.3x9.3R18","diam":27.3,"w":235,"a":50,"r":18},{"size":"245/50R18","calc":"27.6x9.6R18","diam":27.6,"w":245,"a":50,"r":18},{"size":"255/45R18","calc":"27x10R18","diam":27,"w":255,"a":45,"r":18},{"size":"265/45R18","calc":"27.4x10.4R18","diam":27.4,"w":265,"a":45,"r":18},{"size":"275/45R18","calc":"27.7x10.8R18","diam":27.7,"w":275,"a":45,"r":18},{"size":"285/40R18","calc":"27x11.2R18","diam":27,"w":285,"a":40,"r":18},{"size":"295/40R18","calc":"27.3x11.6R18","diam":27.3,"w":295,"a":40,"r":18},{"size":"305/40R18","calc":"27.6X12R18","diam":27.6,"w":305,"a":40,"r":18},{"size":"315/40R18","calc":"27.9x12.4R18","diam":27.9,"w":315,"a":40,"r":18},{"size":"325/35R18","calc":"27x12.8R18","diam":27,"w":325,"a":35,"r":18},{"size":"345/35R18","calc":"27.5x13.6R18","diam":27.5,"w":345,"a":35,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"155/70R19","calc":"27.5x6.1R19","diam":27.5,"w":155,"a":70,"r":19},{"size":"175/60R19","calc":"27.3x6.9R19","diam":27.3,"w":175,"a":60,"r":19},{"size":"225/45R19","calc":"27x8.9R19","diam":27,"w":225,"a":45,"r":19},{"size":"235/45R19","calc":"27.3x9.3R19","diam":27.3,"w":235,"a":45,"r":19},{"size":"245/45R19","calc":"27.7x9.6R19","diam":27.7,"w":245,"a":45,"r":19},{"size":"255/40R19","calc":"27x10R19","diam":27,"w":255,"a":40,"r":19},{"size":"265/40R19","calc":"27.3x10.4R19","diam":27.3,"w":265,"a":40,"r":19},{"size":"275/40R19","calc":"27.7x10.8R19","diam":27.7,"w":275,"a":40,"r":19},{"size":"295/35R19","calc":"27.1x11.6R19","diam":27.1,"w":295,"a":35,"r":19},{"size":"305/35R19","calc":"27.4X12R19","diam":27.4,"w":305,"a":35,"r":19},{"size":"315/35R19","calc":"27.7x12.4R19","diam":27.7,"w":315,"a":35,"r":19},{"size":"345/30R19","calc":"27.1x13.6R19","diam":27.1,"w":345,"a":30,"r":19},{"size":"355/30R19","calc":"27.4x14R19","diam":27.4,"w":355,"a":30,"r":19}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"155/60R20","calc":"27.3x6.1R20","diam":27.3,"w":155,"a":60,"r":20},{"size":"155/65R20","calc":"27.9X6.1R20","diam":27.9,"w":155,"a":65,"r":20},{"size":"165/60R20","calc":"27.8X6.5R20","diam":27.8,"w":165,"a":60,"r":20},{"size":"175/55R20","calc":"27.6x6.9R20","diam":27.6,"w":175,"a":55,"r":20},{"size":"195/50R20","calc":"27.7x7.7R20","diam":27.7,"w":195,"a":50,"r":20},{"size":"215/45R20","calc":"27.6x8.5R20","diam":27.6,"w":215,"a":45,"r":20},{"size":"225/40R20","calc":"27.1X8.9R20","diam":27.1,"w":225,"a":40,"r":20},{"size":"235/40R20","calc":"27.4x9.3R20","diam":27.4,"w":235,"a":40,"r":20},{"size":"245/40R20","calc":"27.7x9.6R20","diam":27.7,"w":245,"a":40,"r":20},{"size":"255/35R20","calc":"27x10R20","diam":27,"w":255,"a":35,"r":20},{"size":"265/35R20","calc":"27.3x10.4R20","diam":27.3,"w":265,"a":35,"r":20},{"size":"275/35R20","calc":"27.6x10.8R20","diam":27.6,"w":275,"a":35,"r":20},{"size":"285/35R20","calc":"27.9x11.2R20","diam":27.9,"w":285,"a":35,"r":20},{"size":"295/30R20","calc":"27x11.6R20","diam":27,"w":295,"a":30,"r":20},{"size":"305/30R20","calc":"27.2x12R20","diam":27.2,"w":305,"a":30,"r":20},{"size":"315/30R20","calc":"27.4x12.4R20","diam":27.4,"w":315,"a":30,"r":20},{"size":"325/30R20","calc":"27.7x12.8R20","diam":27.7,"w":325,"a":30,"r":20},{"size":"335/30R20","calc":"27.9x13.2R20","diam":27.9,"w":335,"a":30,"r":20}]},{"wheelGroup":"21\" Wheel Size","items":[{"size":"255/30R21","calc":"27.0x10.0R21","diam":27.023622047244096,"w":255,"a":30,"r":21},{"size":"265/30R21","calc":"27.3x10.4R21","diam":27.25984251968504,"w":265,"a":30,"r":21},{"size":"275/30R21","calc":"27.5x10.8R21","diam":27.496062992125985,"w":275,"a":30,"r":21}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"275/25R22","calc":"27.4x10.8R22","diam":27.413385826771652,"w":275,"a":25,"r":22}]}],"28":[{"wheelGroup":"14\" Wheel Size","items":[{"size":"28X10R14","calc":"","diam":28,"w":254,"a":70,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"225/75R15","calc":"28.3x8.9R15","diam":28.3,"w":225,"a":75,"r":15},{"size":"235/70R15","calc":"28x9.3R15","diam":28,"w":235,"a":70,"r":15},{"size":"235/75R15","calc":"28.9x9.3R15","diam":28.9,"w":235,"a":75,"r":15},{"size":"245/70R15","calc":"28.5X9.6R15","diam":28.5,"w":245,"a":70,"r":15},{"size":"255/65R15","calc":"28.1x10R15","diam":28.1,"w":255,"a":65,"r":15},{"size":"275/60R15","calc":"28x10.8R15","diam":28,"w":275,"a":60,"r":15},{"size":"28X10.5R15","calc":"","diam":28,"w":267,"a":62,"r":15},{"size":"28X11.5R15","calc":"","diam":28,"w":292,"a":57,"r":15},{"size":"28X12.5R15","calc":"","diam":28,"w":318,"a":52,"r":15},{"size":"28X13.5R15","calc":"","diam":28,"w":343,"a":48,"r":15},{"size":"28X4.5R15","calc":"","diam":28,"w":114,"a":144,"r":15},{"size":"28X7.5R15","calc":"","diam":28,"w":191,"a":87,"r":15},{"size":"28X9R15","calc":"","diam":28,"w":229,"a":72,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"195/80R16","calc":"28.3x7.7R16","diam":28.3,"w":195,"a":80,"r":16},{"size":"205/75R16","calc":"28.1X8.1R16","diam":28.1,"w":205,"a":75,"r":16},{"size":"205/80R16","calc":"28.9x8.1R16","diam":28.9,"w":205,"a":80,"r":16},{"size":"215/75R16","calc":"28.7x8.5R16","diam":28.7,"w":215,"a":75,"r":16},{"size":"225/70R16","calc":"28.4x8.9R16","diam":28.4,"w":225,"a":70,"r":16},{"size":"235/65R16","calc":"28x9.3R16","diam":28,"w":235,"a":65,"r":16},{"size":"255/60R16","calc":"28x10R16","diam":28,"w":255,"a":60,"r":16},{"size":"28X11.5R16","calc":"","diam":28,"w":292,"a":52,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"155/90R17","calc":"28X6.1R17","diam":28,"w":155,"a":90,"r":17},{"size":"165/90R17","calc":"28.7X6.5R17","diam":28.7,"w":165,"a":90,"r":17},{"size":"215/65R17","calc":"28x8.5R17","diam":28,"w":215,"a":65,"r":17},{"size":"215/70R17","calc":"28.9x8.5R17","diam":28.9,"w":215,"a":70,"r":17},{"size":"225/65R17","calc":"28.5x8.9R17","diam":28.5,"w":225,"a":65,"r":17},{"size":"235/60R17","calc":"28.1x9.3R17","diam":28.1,"w":235,"a":60,"r":17},{"size":"245/60R17","calc":"28.6X9.6R17","diam":28.6,"w":245,"a":60,"r":17},{"size":"255/55R17","calc":"28x10R17","diam":28,"w":255,"a":55,"r":17},{"size":"275/55R17","calc":"28.9x10.8R17","diam":28.9,"w":275,"a":55,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"155/85R18","calc":"28.4X6.1R18","diam":28.4,"w":155,"a":85,"r":18},{"size":"225/60R18","calc":"28.6x8.9R18","diam":28.6,"w":225,"a":60,"r":18},{"size":"235/55R18","calc":"28.2x9.3R18","diam":28.2,"w":235,"a":55,"r":18},{"size":"245/55R18","calc":"28.6x9.6R18","diam":28.6,"w":245,"a":55,"r":18},{"size":"255/50R18","calc":"28x10R18","diam":28,"w":255,"a":50,"r":18},{"size":"265/50R18","calc":"28.4X10.4R18","diam":28.4,"w":265,"a":50,"r":18},{"size":"285/45R18","calc":"28.1x11.2R18","diam":28.1,"w":285,"a":45,"r":18},{"size":"295/45R18","calc":"28.5x11.6R18","diam":28.5,"w":295,"a":45,"r":18},{"size":"305/45R18","calc":"28.8X12R18","diam":28.8,"w":305,"a":45,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"145/80R19","calc":"28.1X5.7R19","diam":28.1,"w":145,"a":80,"r":19},{"size":"155/80R19","calc":"28.8X6.1R19","diam":28.8,"w":155,"a":80,"r":19},{"size":"225/55R19","calc":"28.7x8.9R19","diam":28.7,"w":225,"a":55,"r":19},{"size":"235/50R19","calc":"28.3x9.3R19","diam":28.3,"w":235,"a":50,"r":19},{"size":"245/50R19","calc":"28.6x9.6R19","diam":28.6,"w":245,"a":50,"r":19},{"size":"255/45R19","calc":"28x10R19","diam":28,"w":255,"a":45,"r":19},{"size":"265/45R19","calc":"28.4X10.4R19","diam":28.4,"w":265,"a":45,"r":19},{"size":"275/45R19","calc":"28.7x10.8R19","diam":28.7,"w":275,"a":45,"r":19},{"size":"285/40R19","calc":"28x11.2R19","diam":28,"w":285,"a":40,"r":19},{"size":"295/40R19","calc":"28.3X11.6R19","diam":28.3,"w":295,"a":40,"r":19},{"size":"315/40R19","calc":"28.9x12.4R19","diam":28.9,"w":315,"a":40,"r":19},{"size":"345/35R19","calc":"28.5x13.6R19","diam":28.5,"w":345,"a":35,"r":19}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"225/45R20","calc":"28X8.9R20","diam":28,"w":225,"a":45,"r":20},{"size":"235/45R20","calc":"28.3x9.3R20","diam":28.3,"w":235,"a":45,"r":20},{"size":"245/45R20","calc":"28.7x9.6R20","diam":28.7,"w":245,"a":45,"r":20},{"size":"255/40R20","calc":"28x10R20","diam":28,"w":255,"a":40,"r":20},{"size":"265/40R20","calc":"28.3x10.4R20","diam":28.3,"w":265,"a":40,"r":20},{"size":"275/40R20","calc":"28.7x10.8R20","diam":28.7,"w":275,"a":40,"r":20},{"size":"295/35R20","calc":"28.1x11.6R20","diam":28.1,"w":295,"a":35,"r":20},{"size":"305/35R20","calc":"28.4x12R20","diam":28.4,"w":305,"a":35,"r":20},{"size":"315/35R20","calc":"28.7x12.4R20","diam":28.7,"w":315,"a":35,"r":20},{"size":"345/30R20","calc":"28.1x13.6R20","diam":28.1,"w":345,"a":30,"r":20}]},{"wheelGroup":"21\" Wheel Size","items":[{"size":"245/35R21","calc":"27.8x9.6R21","diam":27.751968503937007,"w":245,"a":35,"r":21},{"size":"255/35R21","calc":"28.0x10.0R21","diam":28.02755905511811,"w":255,"a":35,"r":21},{"size":"265/35R21","calc":"28.3x10.4R21","diam":28.303149606299215,"w":265,"a":35,"r":21},{"size":"275/30R21","calc":"27.5x10.8R21","diam":27.496062992125985,"w":275,"a":30,"r":21},{"size":"285/30R21","calc":"27.7x11.2R21","diam":27.73228346456693,"w":285,"a":30,"r":21}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"255/30R22","calc":"28.0x10.0R22","diam":28.023622047244096,"w":255,"a":30,"r":22},{"size":"265/30R22","calc":"28.3x10.4R22","diam":28.25984251968504,"w":265,"a":30,"r":22},{"size":"275/30R22","calc":"28.5x10.8R22","diam":28.496062992125985,"w":275,"a":30,"r":22},{"size":"285/25R22","calc":"27.6x11.2R22","diam":27.61023622047244,"w":285,"a":25,"r":22}]}],"29":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"215/85R15","calc":"29.4X8.5R15","diam":29.4,"w":215,"a":85,"r":15},{"size":"255/70R15","calc":"29.1x10R15","diam":29.1,"w":255,"a":70,"r":15},{"size":"265/70R15","calc":"29.6x10.4R15","diam":29.6,"w":265,"a":70,"r":15},{"size":"29X10.5R15","calc":"","diam":29,"w":267,"a":67,"r":15},{"size":"29X11.5R15","calc":"","diam":29,"w":292,"a":61,"r":15},{"size":"29X12.5R15","calc":"","diam":29,"w":318,"a":56,"r":15},{"size":"29X15.5R15","calc":"","diam":29,"w":394,"a":45,"r":15},{"size":"29X18R15","calc":"","diam":29,"w":457,"a":39,"r":15},{"size":"29X18.5R15","calc":"","diam":29,"w":470,"a":38,"r":15},{"size":"29X4.5R15","calc":"","diam":29,"w":114,"a":156,"r":15},{"size":"29X8.5R15","calc":"","diam":29,"w":216,"a":82,"r":15},{"size":"29.5X11.5R15","calc":"","diam":29.5,"w":292,"a":63,"r":15},{"size":"29.5X13.5R15","calc":"","diam":29.5,"w":343,"a":54,"r":15},{"size":"29.5X9R15","calc":"","diam":29.5,"w":229,"a":81,"r":15},{"size":"315/60R15","calc":"29.9x12.4R15","diam":29.9,"w":315,"a":60,"r":15},{"size":"7R15","calc":"29.5x7.7R15","diam":29.5,"w":196,"a":94,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"225/75R16","calc":"29.3x8.9R16","diam":29.3,"w":225,"a":75,"r":16},{"size":"235/70R16","calc":"29x9.3R16","diam":29,"w":235,"a":70,"r":16},{"size":"235/75R16","calc":"29.9x9.3R16","diam":29.9,"w":235,"a":75,"r":16},{"size":"245/70R16","calc":"29.5x9.6R16","diam":29.5,"w":245,"a":70,"r":16},{"size":"255/65R16","calc":"29.1x10R16","diam":29.1,"w":255,"a":65,"r":16},{"size":"275/60R16","calc":"29X10.8R16","diam":29,"w":275,"a":60,"r":16},{"size":"285/60R16","calc":"29.5X11.2R16","diam":29.5,"w":285,"a":60,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"8.75R16.5","calc":"29.5x8.8R16.5","diam":29.5,"w":224,"a":74,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"175/90R17","calc":"29.4X6.9R17","diam":29.4,"w":175,"a":90,"r":17},{"size":"225/70R17","calc":"29.4x8.9R17","diam":29.4,"w":225,"a":70,"r":17},{"size":"235/65R17","calc":"29x9.3R17","diam":29,"w":235,"a":65,"r":17},{"size":"245/65R17","calc":"29.5x9.6R17","diam":29.5,"w":245,"a":65,"r":17},{"size":"255/60R17","calc":"29x10R17","diam":29,"w":255,"a":60,"r":17},{"size":"265/60R17","calc":"29.5x10.4R17","diam":29.5,"w":265,"a":60,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"155/90R18","calc":"29X6.1R18","diam":29,"w":155,"a":90,"r":18},{"size":"165/90R18","calc":"29.7X6.5R18","diam":29.7,"w":165,"a":90,"r":18},{"size":"225/65R18","calc":"29.5X8.9R18","diam":29.5,"w":225,"a":65,"r":18},{"size":"235/60R18","calc":"29.1x9.3R18","diam":29.1,"w":235,"a":60,"r":18},{"size":"245/60R18","calc":"29.6x9.6R18","diam":29.6,"w":245,"a":60,"r":18},{"size":"255/55R18","calc":"29x10R18","diam":29,"w":255,"a":55,"r":18},{"size":"265/55R18","calc":"29.5X10.4R18","diam":29.5,"w":265,"a":55,"r":18},{"size":"275/55R18","calc":"29.9x10.8R18","diam":29.9,"w":275,"a":55,"r":18},{"size":"285/50R18","calc":"29.2x11.2R18","diam":29.2,"w":285,"a":50,"r":18},{"size":"325/45R18","calc":"29.5X12.8R18","diam":29.5,"w":325,"a":45,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"235/55R19","calc":"29.2x9.3R19","diam":29.2,"w":235,"a":55,"r":19},{"size":"245/55R19","calc":"29.6x9.6R19","diam":29.6,"w":245,"a":55,"r":19},{"size":"255/50R19","calc":"29x10R19","diam":29,"w":255,"a":50,"r":19},{"size":"265/50R19","calc":"29.4x10.4R19","diam":29.4,"w":265,"a":50,"r":19},{"size":"275/50R19","calc":"29.8X10.8R19","diam":29.8,"w":275,"a":50,"r":19},{"size":"285/45R19","calc":"29.1x11.2R19","diam":29.1,"w":285,"a":45,"r":19},{"size":"295/45R19","calc":"29.5x11.6R19","diam":29.5,"w":295,"a":45,"r":19}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"235/50R20","calc":"29.3X9.3R20","diam":29.3,"w":235,"a":50,"r":20},{"size":"245/50R20","calc":"29.6x9.6R20","diam":29.6,"w":245,"a":50,"r":20},{"size":"255/45R20","calc":"29x10R20","diam":29,"w":255,"a":45,"r":20},{"size":"265/45R20","calc":"29.4x10.4R20","diam":29.4,"w":265,"a":45,"r":20},{"size":"275/45R20","calc":"29.7x10.8R20","diam":29.7,"w":275,"a":45,"r":20},{"size":"285/40R20","calc":"29x11.2R20","diam":29,"w":285,"a":40,"r":20},{"size":"295/40R20","calc":"29.3x11.6R20","diam":29.3,"w":295,"a":40,"r":20},{"size":"305/40R20","calc":"29.6X12R20","diam":29.6,"w":305,"a":40,"r":20},{"size":"325/35R20","calc":"29X12.8R20","diam":29,"w":325,"a":35,"r":20}]},{"wheelGroup":"21\" Wheel Size","items":[{"size":"245/40R21","calc":"28.7x9.6R21","diam":28.716535433070867,"w":245,"a":40,"r":21},{"size":"255/40R21","calc":"29.0x10.0R21","diam":29.031496062992126,"w":255,"a":40,"r":21},{"size":"265/40R21","calc":"29.3x10.4R21","diam":29.346456692913385,"w":265,"a":40,"r":21},{"size":"275/35R21","calc":"28.6x10.8R21","diam":28.578740157480315,"w":275,"a":35,"r":21},{"size":"285/35R21","calc":"28.9x11.2R21","diam":28.85433070866142,"w":285,"a":35,"r":21},{"size":"295/35R21","calc":"29.1x11.6R21","diam":29.12992125984252,"w":295,"a":35,"r":21}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"255/35R22","calc":"29.0x10.0R22","diam":29.02755905511811,"w":255,"a":35,"r":22},{"size":"265/35R22","calc":"29.3x10.4R22","diam":29.303149606299215,"w":265,"a":35,"r":22},{"size":"275/30R22","calc":"28.5x10.8R22","diam":28.496062992125985,"w":275,"a":30,"r":22},{"size":"285/30R22","calc":"28.7x11.2R22","diam":28.73228346456693,"w":285,"a":30,"r":22},{"size":"295/30R22","calc":"29.0x11.6R22","diam":28.968503937007874,"w":295,"a":30,"r":22},{"size":"305/30R22","calc":"29.2x12.0R22","diam":29.20472440944882,"w":305,"a":30,"r":22}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"275/25R24","calc":"29.4x10.8R24","diam":29.4,"w":275,"a":25,"r":24}]}],"30":[{"wheelGroup":"14\" Wheel Size","items":[{"size":"30X10R14","calc":"","diam":30,"w":254,"a":80,"r":14}]},{"wheelGroup":"15\" Wheel Size","items":[{"size":"255/75R15","calc":"30.1x10R15","diam":30.1,"w":255,"a":75,"r":15},{"size":"265/75R15","calc":"30.6x10.4R15","diam":30.6,"w":265,"a":75,"r":15},{"size":"295/65R15","calc":"30.1x11.6R15","diam":30.1,"w":295,"a":65,"r":15},{"size":"30X10R15","calc":"","diam":30,"w":254,"a":75,"r":15},{"size":"30X10.5R15","calc":"","diam":30,"w":267,"a":71,"r":15},{"size":"30X11.5R15","calc":"","diam":30,"w":292,"a":65,"r":15},{"size":"30X12.5R15","calc":"","diam":30,"w":318,"a":60,"r":15},{"size":"30X13.5R15","calc":"","diam":30,"w":343,"a":56,"r":15},{"size":"30X7R15","calc":"","diam":30,"w":178,"a":107,"r":15},{"size":"30X9R15","calc":"","diam":30,"w":229,"a":83,"r":15},{"size":"30X9.5R15","calc":"","diam":30,"w":241,"a":79,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"215/85R16","calc":"30.4x8.5R16","diam":30.4,"w":215,"a":85,"r":16},{"size":"235/80R16","calc":"30.8x9.3R16","diam":30.8,"w":235,"a":80,"r":16},{"size":"245/75R16","calc":"30.5x9.6R16","diam":30.5,"w":245,"a":75,"r":16},{"size":"255/70R16","calc":"30.1x10R16","diam":30.1,"w":255,"a":70,"r":16},{"size":"265/70R16","calc":"30.6x10.4R16","diam":30.6,"w":265,"a":70,"r":16},{"size":"285/65R16","calc":"30.6X11.2R16","diam":30.6,"w":285,"a":65,"r":16},{"size":"30X11.5R16","calc":"","diam":30,"w":292,"a":61,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"9.5R16.5","calc":"30.6x9.5R16.5","diam":30.6,"w":241,"a":74,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"225/75R17","calc":"30.3x8.9R17","diam":30.3,"w":225,"a":75,"r":17},{"size":"235/70R17","calc":"30x9.3R17","diam":30,"w":235,"a":70,"r":17},{"size":"235/75R17","calc":"30.9x9.3R17","diam":30.9,"w":235,"a":75,"r":17},{"size":"245/70R17","calc":"30.5x9.6R17","diam":30.5,"w":245,"a":70,"r":17},{"size":"255/65R17","calc":"30.1x10R17","diam":30.1,"w":255,"a":65,"r":17},{"size":"265/65R17","calc":"30.6x10.4R17","diam":30.6,"w":265,"a":65,"r":17},{"size":"275/60R17","calc":"30x10.8R17","diam":30,"w":275,"a":60,"r":17},{"size":"285/60R17","calc":"30.5X11.2R17","diam":30.5,"w":285,"a":60,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"175/90R18","calc":"30.4X6.9R18","diam":30.4,"w":175,"a":90,"r":18},{"size":"235/65R18","calc":"30x9.3R18","diam":30,"w":235,"a":65,"r":18},{"size":"245/65R18","calc":"30.5x9.6R18","diam":30.5,"w":245,"a":65,"r":18},{"size":"255/60R18","calc":"30x10R18","diam":30,"w":255,"a":60,"r":18},{"size":"265/60R18","calc":"30.5x10.4R18","diam":30.5,"w":265,"a":60,"r":18},{"size":"285/55R18","calc":"30.3x11.2R18","diam":30.3,"w":285,"a":55,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"165/90R19","calc":"30.7X6.5R19","diam":30.7,"w":165,"a":90,"r":19},{"size":"175/80R19","calc":"30X6.9R19","diam":30,"w":175,"a":80,"r":19},{"size":"255/55R19","calc":"30x10R19","diam":30,"w":255,"a":55,"r":19},{"size":"265/55R19","calc":"30.5x10.4R19","diam":30.5,"w":265,"a":55,"r":19},{"size":"275/55R19","calc":"30.9x10.8R19","diam":30.9,"w":275,"a":55,"r":19}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"235/55R20","calc":"30.2x9.3R20","diam":30.2,"w":235,"a":55,"r":20},{"size":"255/50R20","calc":"30x10R20","diam":30,"w":255,"a":50,"r":20},{"size":"265/50R20","calc":"30.4x10.4R20","diam":30.4,"w":265,"a":50,"r":20},{"size":"275/50R20","calc":"30.8x10.8R20","diam":30.8,"w":275,"a":50,"r":20},{"size":"285/45R20","calc":"30.1x11.2R20","diam":30.1,"w":285,"a":45,"r":20},{"size":"295/45R20","calc":"30.5x11.6R20","diam":30.5,"w":295,"a":45,"r":20},{"size":"305/45R20","calc":"30.8x12R20","diam":30.8,"w":305,"a":45,"r":20}]},{"wheelGroup":"21\" Wheel Size","items":[{"size":"265/45R21","calc":"30.4x10.4R21","diam":30.38976377952756,"w":265,"a":45,"r":21},{"size":"275/40R21","calc":"29.7x10.8R21","diam":29.661417322834644,"w":275,"a":40,"r":21},{"size":"285/40R21","calc":"30.0x11.2R21","diam":29.976377952755904,"w":285,"a":40,"r":21},{"size":"295/40R21","calc":"30.3x11.6R21","diam":30.291338582677167,"w":295,"a":40,"r":21},{"size":"315/35R21","calc":"29.7x12.4R21","diam":29.681102362204726,"w":315,"a":35,"r":21}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"265/40R22","calc":"30.3x10.4R22","diam":30.346456692913385,"w":265,"a":40,"r":22},{"size":"275/35R22","calc":"29.6x10.8R22","diam":29.578740157480315,"w":275,"a":35,"r":22},{"size":"285/35R22","calc":"29.9x11.2R22","diam":29.85433070866142,"w":285,"a":35,"r":22},{"size":"295/35R22","calc":"30.1x11.6R22","diam":30.12992125984252,"w":295,"a":35,"r":22}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"255/30R24","calc":"30x10R24","diam":30,"w":255,"a":30,"r":24},{"size":"275/30R24","calc":"30.5x10.8R24","diam":30.5,"w":275,"a":30,"r":24},{"size":"285/30R24","calc":"30.7x11.2R24","diam":30.7,"w":285,"a":30,"r":24}]}],"31":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"31X10.5R15","calc":"","diam":31,"w":267,"a":76,"r":15},{"size":"31X11R15","calc":"","diam":31,"w":279,"a":73,"r":15},{"size":"31X11.5R15","calc":"","diam":31,"w":292,"a":70,"r":15},{"size":"31X12.5R15","calc":"","diam":31,"w":318,"a":64,"r":15},{"size":"31X13R15","calc":"","diam":31,"w":330,"a":62,"r":15},{"size":"31X13.5R15","calc":"","diam":31,"w":343,"a":59,"r":15},{"size":"31X14.5R15","calc":"","diam":31,"w":368,"a":55,"r":15},{"size":"31X16.5R15","calc":"","diam":31,"w":419,"a":48,"r":15},{"size":"31X18R15","calc":"","diam":31,"w":457,"a":44,"r":15},{"size":"31X18.5R15","calc":"","diam":31,"w":470,"a":43,"r":15},{"size":"31X9.5R15","calc":"","diam":31,"w":241,"a":84,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"225/85R16","calc":"31.1X8.9R16","diam":31.1,"w":225,"a":85,"r":16},{"size":"235/85R16","calc":"31.7x9.3R16","diam":31.7,"w":235,"a":85,"r":16},{"size":"265/75R16","calc":"31.6x10.4R16","diam":31.6,"w":265,"a":75,"r":16},{"size":"275/70R16","calc":"31.2x10.8R16","diam":31.2,"w":275,"a":70,"r":16},{"size":"285/70R16","calc":"31.7x11.2R16","diam":31.7,"w":285,"a":70,"r":16},{"size":"31X10.5R16","calc":"","diam":31,"w":267,"a":71,"r":16},{"size":"31X11R16","calc":"","diam":31,"w":279,"a":68,"r":16},{"size":"31X11.5R16","calc":"","diam":31,"w":292,"a":65,"r":16},{"size":"31X12.5R16","calc":"","diam":31,"w":318,"a":60,"r":16},{"size":"7.5R16","calc":"31.8x8.7R16","diam":31.8,"w":221,"a":91,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"31X10.5R16.5","calc":"","diam":31,"w":267,"a":69,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"235/80R17","calc":"31.8x9.3R17","diam":31.8,"w":235,"a":80,"r":17},{"size":"245/75R17","calc":"31.5x9.6R17","diam":31.5,"w":245,"a":75,"r":17},{"size":"255/70R17","calc":"31.1x10R17","diam":31.1,"w":255,"a":70,"r":17},{"size":"265/70R17","calc":"31.6x10.4R17","diam":31.6,"w":265,"a":70,"r":17},{"size":"275/65R17","calc":"31.1x10.8R17","diam":31.1,"w":275,"a":65,"r":17},{"size":"285/65R17","calc":"31.6x11.2R17","diam":31.6,"w":285,"a":65,"r":17},{"size":"31X10.5R17","calc":"","diam":31,"w":267,"a":67,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"235/70R18","calc":"31X9.3R18","diam":31,"w":235,"a":70,"r":18},{"size":"255/65R18","calc":"31.1x10R18","diam":31.1,"w":255,"a":65,"r":18},{"size":"265/65R18","calc":"31.6x10.4R18","diam":31.6,"w":265,"a":65,"r":18},{"size":"275/60R18","calc":"31x10.8R18","diam":31,"w":275,"a":60,"r":18},{"size":"285/60R18","calc":"31.5x11.2R18","diam":31.5,"w":285,"a":60,"r":18}]},{"wheelGroup":"19\" Wheel Size","items":[{"size":"235/65R19","calc":"31X9.3R19","diam":31,"w":235,"a":65,"r":19},{"size":"255/60R19","calc":"31x10R19","diam":31,"w":255,"a":60,"r":19}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"245/60R20","calc":"31.6x9.6R20","diam":31.6,"w":245,"a":60,"r":20},{"size":"255/55R20","calc":"31x10R20","diam":31,"w":255,"a":55,"r":20},{"size":"275/55R20","calc":"31.9x10.8R20","diam":31.9,"w":275,"a":55,"r":20},{"size":"285/50R20","calc":"31.2x11.2R20","diam":31.2,"w":285,"a":50,"r":20},{"size":"295/50R20","calc":"31.6x11.6R20","diam":31.6,"w":295,"a":50,"r":20},{"size":"31X18R20","calc":"","diam":31,"w":457,"a":31,"r":20}]},{"wheelGroup":"21\" Wheel Size","items":[{"size":"265/45R21","calc":"30.4x10.4R21","diam":30.38976377952756,"w":265,"a":45,"r":21},{"size":"275/45R21","calc":"30.7x10.8R21","diam":30.744094488188978,"w":275,"a":45,"r":21},{"size":"295/40R21","calc":"30.3x11.6R21","diam":30.291338582677167,"w":295,"a":40,"r":21}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"265/40R22","calc":"30.3x10.4R22","diam":30.346456692913385,"w":265,"a":40,"r":22},{"size":"275/40R22","calc":"30.7x10.8R22","diam":30.661417322834644,"w":275,"a":40,"r":22},{"size":"285/40R22","calc":"31.0x11.2R22","diam":30.976377952755904,"w":285,"a":40,"r":22},{"size":"305/40R22","calc":"31.6x12.0R22","diam":31.606299212598426,"w":305,"a":40,"r":22}]},{"wheelGroup":"23\" Wheel Size","items":[{"size":"285/35R23","calc":"30.9x11.2R23","diam":30.85433070866142,"w":285,"a":35,"r":23},{"size":"295/35R23","calc":"31.1x11.6R23","diam":31.12992125984252,"w":295,"a":35,"r":23},{"size":"305/35R23","calc":"31.4x12.0R23","diam":31.405511811023622,"w":305,"a":35,"r":23},{"size":"325/30R23","calc":"30.7x12.8R23","diam":30.67716535433071,"w":325,"a":30,"r":23}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"285/35R24","calc":"31.9x11.2R24","diam":31.9,"w":285,"a":35,"r":24},{"size":"295/30R24","calc":"31X11.6R24","diam":31,"w":295,"a":30,"r":24}]},{"wheelGroup":"26\" Wheel Size","items":[{"size":"275/25R26","calc":"31.4x10.8R26","diam":31.4,"w":275,"a":25,"r":26},{"size":"295/25R26","calc":"31.8x11.6R26","diam":31.8,"w":295,"a":25,"r":26}]}],"32":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"32X10.5R15","calc":"","diam":32,"w":267,"a":81,"r":15},{"size":"32X11.5R15","calc":"","diam":32,"w":292,"a":74,"r":15},{"size":"32X14R15","calc":"","diam":32,"w":356,"a":61,"r":15},{"size":"32X16R15","calc":"","diam":32,"w":406,"a":53,"r":15},{"size":"32X17.5R15","calc":"","diam":32,"w":445,"a":49,"r":15},{"size":"32X18.5R15","calc":"","diam":32,"w":470,"a":46,"r":15},{"size":"32X9.5R15","calc":"","diam":32,"w":241,"a":89,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"265/80R16","calc":"32.7X10.4R16","diam":32.7,"w":265,"a":80,"r":16},{"size":"285/75R16","calc":"32.8x11.2R16","diam":32.8,"w":285,"a":75,"r":16},{"size":"305/70R16","calc":"32.8x12R16","diam":32.8,"w":305,"a":70,"r":16},{"size":"32X10R16","calc":"","diam":32,"w":254,"a":80,"r":16},{"size":"32X11.5R16","calc":"","diam":32,"w":292,"a":70,"r":16},{"size":"32X9R16","calc":"","diam":32,"w":229,"a":89,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"32X12R16.5","calc":"","diam":32,"w":305,"a":65,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"235/85R17","calc":"32.7X9.3R17","diam":32.7,"w":235,"a":85,"r":17},{"size":"255/75R17","calc":"32.1x10R17","diam":32.1,"w":255,"a":75,"r":17},{"size":"275/70R17","calc":"32.2x10.8R17","diam":32.2,"w":275,"a":70,"r":17},{"size":"285/70R17","calc":"32.7x11.2R17","diam":32.7,"w":285,"a":70,"r":17},{"size":"305/65R17","calc":"32.6x12R17","diam":32.6,"w":305,"a":65,"r":17},{"size":"32X10.5R17","calc":"","diam":32,"w":267,"a":71,"r":17},{"size":"32X11.5R17","calc":"","diam":32,"w":292,"a":65,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"255/70R18","calc":"32.1x10R18","diam":32.1,"w":255,"a":70,"r":18},{"size":"265/70R18","calc":"32.6x10.4R18","diam":32.6,"w":265,"a":70,"r":18},{"size":"275/65R18","calc":"32.1x10.8R18","diam":32.1,"w":275,"a":65,"r":18},{"size":"285/65R18","calc":"32.6x11.2R18","diam":32.6,"w":285,"a":65,"r":18},{"size":"305/60R18","calc":"32.4x12R18","diam":32.4,"w":305,"a":60,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"265/60R20","calc":"32.5x10.4R20","diam":32.5,"w":265,"a":60,"r":20},{"size":"285/55R20","calc":"32.3x11.2R20","diam":32.3,"w":285,"a":55,"r":20},{"size":"295/55R20","calc":"32.8X11.6R20","diam":32.8,"w":295,"a":55,"r":20},{"size":"305/50R20","calc":"32x12R20","diam":32,"w":305,"a":50,"r":20},{"size":"315/50R20","calc":"32.4x12.4R20","diam":32.4,"w":315,"a":50,"r":20},{"size":"325/50R20","calc":"32.8x12.8R20","diam":32.8,"w":325,"a":50,"r":20}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"285/45R22","calc":"32.1x11.2R22","diam":32.09842519685039,"w":285,"a":45,"r":22},{"size":"305/40R22","calc":"31.6x12.0R22","diam":31.606299212598426,"w":305,"a":40,"r":22}]},{"wheelGroup":"23\" Wheel Size","items":[{"size":"285/40R23","calc":"32.0x11.2R23","diam":31.976377952755904,"w":285,"a":40,"r":23},{"size":"305/35R23","calc":"31.4x12.0R23","diam":31.405511811023622,"w":305,"a":35,"r":23}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"295/35R24","calc":"32.1x11.6R24","diam":32.1,"w":295,"a":35,"r":24},{"size":"305/35R24","calc":"32.4x12R24","diam":32.4,"w":305,"a":35,"r":24},{"size":"315/35R24","calc":"32.7x12.4R24","diam":32.7,"w":315,"a":35,"r":24},{"size":"405/25R24","calc":"32x15.9R24","diam":32,"w":405,"a":25,"r":24}]}],"33":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"33X10.5R15","calc":"","diam":33,"w":267,"a":86,"r":15},{"size":"33X11.5R15","calc":"","diam":33,"w":292,"a":78,"r":15},{"size":"33X12.5R15","calc":"","diam":33,"w":318,"a":72,"r":15},{"size":"33X13R15","calc":"","diam":33,"w":330,"a":69,"r":15},{"size":"33X13.5R15","calc":"","diam":33,"w":343,"a":67,"r":15},{"size":"33X14R15","calc":"","diam":33,"w":356,"a":64,"r":15},{"size":"33X14.5R15","calc":"","diam":33,"w":368,"a":62,"r":15},{"size":"33X15.5R15","calc":"","diam":33,"w":394,"a":58,"r":15},{"size":"33X16.5R15","calc":"","diam":33,"w":419,"a":55,"r":15},{"size":"33X19.5R15","calc":"","diam":33,"w":495,"a":46,"r":15},{"size":"33X21.5R15","calc":"","diam":33,"w":546,"a":42,"r":15},{"size":"33X9R15","calc":"","diam":33,"w":229,"a":100,"r":15},{"size":"33X9.5R15","calc":"","diam":33,"w":241,"a":95,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"255/85R16","calc":"33.1x10R16","diam":33.1,"w":255,"a":85,"r":16},{"size":"295/75R16","calc":"33.4x11.6R16","diam":33.4,"w":295,"a":75,"r":16},{"size":"33X10.5R16","calc":"","diam":33,"w":267,"a":81,"r":16},{"size":"33X11.5R16","calc":"","diam":33,"w":292,"a":74,"r":16},{"size":"33X12.5R16","calc":"","diam":33,"w":318,"a":68,"r":16},{"size":"33X13R16","calc":"","diam":33,"w":330,"a":65,"r":16},{"size":"33X13.5R16","calc":"","diam":33,"w":343,"a":63,"r":16},{"size":"33X14R16","calc":"","diam":33,"w":356,"a":61,"r":16},{"size":"33X14.5R16","calc":"","diam":33,"w":368,"a":59,"r":16},{"size":"33X9.5R16","calc":"","diam":33,"w":241,"a":89,"r":16},{"size":"33.5X16.5R16","calc":"","diam":33.5,"w":419,"a":53,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"33X11.5R16.5","calc":"","diam":33,"w":292,"a":72,"r":16.5},{"size":"33X12.5R16.5","calc":"","diam":33,"w":318,"a":66,"r":16.5},{"size":"33X14R16.5","calc":"","diam":33,"w":356,"a":59,"r":16.5},{"size":"33X14.5R16.5","calc":"","diam":33,"w":368,"a":57,"r":16.5},{"size":"33X15.5R16.5","calc":"","diam":33,"w":394,"a":53,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"255/80R17","calc":"33.1x10R17","diam":33.1,"w":255,"a":80,"r":17},{"size":"285/75R17","calc":"33.8x11.2R17","diam":33.8,"w":285,"a":75,"r":17},{"size":"295/70R17","calc":"33.3x11.6R17","diam":33.3,"w":295,"a":70,"r":17},{"size":"305/70R17","calc":"33.8x12R17","diam":33.8,"w":305,"a":70,"r":17},{"size":"33X10.5R17","calc":"","diam":33,"w":267,"a":76,"r":17},{"size":"33X12.5R17","calc":"","diam":33,"w":318,"a":64,"r":17},{"size":"33X13R17","calc":"","diam":33,"w":330,"a":62,"r":17},{"size":"33X13.5R17","calc":"","diam":33,"w":343,"a":59,"r":17},{"size":"33X9.5R17","calc":"","diam":33,"w":241,"a":84,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"275/70R18","calc":"33.2x10.8R18","diam":33.2,"w":275,"a":70,"r":18},{"size":"285/70R18","calc":"33.7x11.2R18","diam":33.7,"w":285,"a":70,"r":18},{"size":"295/65R18","calc":"33.1x11.6R18","diam":33.1,"w":295,"a":65,"r":18},{"size":"305/65R18","calc":"33.6x12R18","diam":33.6,"w":305,"a":65,"r":18},{"size":"325/60R18","calc":"33.4x12.8R18","diam":33.4,"w":325,"a":60,"r":18},{"size":"33X10.5R18","calc":"","diam":33,"w":267,"a":71,"r":18},{"size":"33X11.5R18","calc":"","diam":33,"w":292,"a":65,"r":18},{"size":"33X12.5R18","calc":"","diam":33,"w":318,"a":60,"r":18},{"size":"33X13R18","calc":"","diam":33,"w":330,"a":58,"r":18},{"size":"33X13.5R18","calc":"","diam":33,"w":343,"a":56,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"275/60R20","calc":"33x10.8R20","diam":33,"w":275,"a":60,"r":20},{"size":"285/60R20","calc":"33.5x11.2R20","diam":33.5,"w":285,"a":60,"r":20},{"size":"295/60R20","calc":"33.9x11.6R20","diam":33.9,"w":295,"a":60,"r":20},{"size":"305/55R20","calc":"33.2x12R20","diam":33.2,"w":305,"a":55,"r":20},{"size":"33X11.5R20","calc":"","diam":33,"w":292,"a":57,"r":20},{"size":"33X12R20","calc":"","diam":33,"w":305,"a":54,"r":20},{"size":"33X12.5R20","calc":"","diam":33,"w":318,"a":52,"r":20},{"size":"33X13.5R20","calc":"","diam":33,"w":343,"a":48,"r":20}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"305/45R22","calc":"32.8x12.0R22","diam":32.80708661417323,"w":305,"a":45,"r":22},{"size":"33X12.5R22","calc":"","diam":33,"w":318,"a":44,"r":22}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"285/40R24","calc":"33x11.2R24","diam":33,"w":285,"a":40,"r":24},{"size":"295/40R24","calc":"33.3x11.6R24","diam":33.3,"w":295,"a":40,"r":24}]},{"wheelGroup":"26\" Wheel Size","items":[{"size":"295/30R26","calc":"33x11.6R26","diam":33,"w":295,"a":30,"r":26},{"size":"305/30R26","calc":"33.2x12R26","diam":33.2,"w":305,"a":30,"r":26}]},{"wheelGroup":"28\" Wheel Size","items":[{"size":"295/25R28","calc":"33.8x11.6R28","diam":33.8,"w":295,"a":25,"r":28}]}],"34":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"34X10.5R15","calc":"","diam":34,"w":267,"a":90,"r":15},{"size":"34X12.5R15","calc":"","diam":34,"w":318,"a":76,"r":15},{"size":"34X9.5R15","calc":"","diam":34,"w":241,"a":100,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"315/75R16","calc":"34.6x12.4R16","diam":34.6,"w":315,"a":75,"r":16},{"size":"34X10.5R16","calc":"","diam":34,"w":267,"a":86,"r":16},{"size":"34X12.5R16","calc":"","diam":34,"w":318,"a":72,"r":16},{"size":"34X13.5R16","calc":"","diam":34,"w":343,"a":67,"r":16},{"size":"34X9R16","calc":"","diam":34,"w":229,"a":100,"r":16},{"size":"34.5X17R16","calc":"","diam":34.5,"w":432,"a":54,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"275/80R17","calc":"34.3X10.8R17","diam":34.3,"w":275,"a":80,"r":17},{"size":"315/70R17","calc":"34.4x12.4R17","diam":34.4,"w":315,"a":70,"r":17},{"size":"325/70R17","calc":"34.9x12.8R17","diam":34.9,"w":325,"a":70,"r":17},{"size":"34X10.5R17","calc":"","diam":34,"w":267,"a":81,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"285/75R18","calc":"34.8x11.2R18","diam":34.8,"w":285,"a":75,"r":18},{"size":"295/70R18","calc":"34.3X11.6R18","diam":34.3,"w":295,"a":70,"r":18},{"size":"305/70R18","calc":"34.8x12R18","diam":34.8,"w":305,"a":70,"r":18},{"size":"325/65R18","calc":"34.6x12.8R18","diam":34.6,"w":325,"a":65,"r":18},{"size":"34X12.5R18","calc":"","diam":34,"w":318,"a":64,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"275/65R20","calc":"34.1x10.8R20","diam":34.1,"w":275,"a":65,"r":20},{"size":"285/65R20","calc":"34.6x11.2R20","diam":34.6,"w":285,"a":65,"r":20},{"size":"305/60R20","calc":"34.4x12R20","diam":34.4,"w":305,"a":60,"r":20},{"size":"315/60R20","calc":"34.9x12.4R20","diam":34.9,"w":315,"a":60,"r":20},{"size":"355/50R20","calc":"34X14R20","diam":34,"w":355,"a":50,"r":20}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"385/35R24","calc":"34.6x15.2R24","diam":34.6,"w":385,"a":35,"r":24}]}],"35":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"35X10.5R15","calc":"","diam":35,"w":267,"a":95,"r":15},{"size":"35X12.5R15","calc":"","diam":35,"w":318,"a":80,"r":15},{"size":"35X13.5R15","calc":"","diam":35,"w":343,"a":74,"r":15},{"size":"35X14.5R15","calc":"","diam":35,"w":368,"a":69,"r":15},{"size":"35X15R15","calc":"","diam":35,"w":381,"a":67,"r":15},{"size":"35X15.5R15","calc":"","diam":35,"w":394,"a":65,"r":15},{"size":"35X16R15","calc":"","diam":35,"w":406,"a":63,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"35X10.5R16","calc":"","diam":35,"w":267,"a":90,"r":16},{"size":"35X12.5R16","calc":"","diam":35,"w":318,"a":76,"r":16},{"size":"35X14.5R16","calc":"","diam":35,"w":368,"a":66,"r":16},{"size":"35X15R16","calc":"","diam":35,"w":381,"a":63,"r":16},{"size":"35X16R16","calc":"","diam":35,"w":406,"a":59,"r":16},{"size":"375/65R16","calc":"35.2x14.8R16","diam":35.2,"w":375,"a":65,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"35X12.5R16.5","calc":"","diam":35,"w":318,"a":74,"r":16.5},{"size":"35X14.5R16.5","calc":"","diam":35,"w":368,"a":64,"r":16.5},{"size":"35X15R16.5","calc":"","diam":35,"w":381,"a":62,"r":16.5},{"size":"35X15.5R16.5","calc":"","diam":35,"w":394,"a":60,"r":16.5},{"size":"35X16R16.5","calc":"","diam":35,"w":406,"a":58,"r":16.5},{"size":"35X9.5R16.5","calc":"","diam":35,"w":241,"a":97,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"35X10.5R17","calc":"","diam":35,"w":267,"a":86,"r":17},{"size":"35X11.5R17","calc":"","diam":35,"w":292,"a":78,"r":17},{"size":"35X12.5R17","calc":"","diam":35,"w":318,"a":72,"r":17},{"size":"35X13.5R17","calc":"","diam":35,"w":343,"a":67,"r":17},{"size":"35X14.5R17","calc":"","diam":35,"w":368,"a":62,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"315/70R18","calc":"35.4x12.4R18","diam":35.4,"w":315,"a":70,"r":18},{"size":"35X11.5R18","calc":"","diam":35,"w":292,"a":74,"r":18},{"size":"35X12.5R18","calc":"","diam":35,"w":318,"a":68,"r":18},{"size":"35X13R18","calc":"","diam":35,"w":330,"a":65,"r":18},{"size":"35X13.5R18","calc":"","diam":35,"w":343,"a":63,"r":18},{"size":"35X14.5R18","calc":"","diam":35,"w":368,"a":59,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"295/65R20","calc":"35.1X11.6R20","diam":35.1,"w":295,"a":65,"r":20},{"size":"325/60R20","calc":"35.4x12.8R20","diam":35.4,"w":325,"a":60,"r":20},{"size":"35X11.5R20","calc":"","diam":35,"w":292,"a":65,"r":20},{"size":"35X12.5R20","calc":"","diam":35,"w":318,"a":60,"r":20},{"size":"35X13R20","calc":"","diam":35,"w":330,"a":58,"r":20},{"size":"35X13.5R20","calc":"","diam":35,"w":343,"a":56,"r":20},{"size":"35X14.5R20","calc":"","diam":35,"w":368,"a":52,"r":20}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"35X12.5R22","calc":"","diam":35,"w":318,"a":52,"r":22}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"325/45R24","calc":"35.5x12.8R24","diam":35.5,"w":325,"a":45,"r":24},{"size":"35X12.5R24","calc":"","diam":35,"w":318,"a":44,"r":24},{"size":"35X13.5R24","calc":"","diam":35,"w":343,"a":41,"r":24},{"size":"375/40R24","calc":"35.8X14.8R24","diam":35.8,"w":375,"a":40,"r":24}]},{"wheelGroup":"26\" Wheel Size","items":[{"size":"315/40R26","calc":"35.9x12.4R26","diam":35.9,"w":315,"a":40,"r":26}]},{"wheelGroup":"28\" Wheel Size","items":[{"size":"305/25R28","calc":"34.0x12.0R28","diam":34.003937007874015,"w":305,"a":25,"r":28}]}],"36":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"36X12.5R15","calc":"","diam":36,"w":318,"a":84,"r":15},{"size":"36X13.5R15","calc":"","diam":36,"w":343,"a":78,"r":15},{"size":"36X14.5R15","calc":"","diam":36,"w":368,"a":72,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"325/80R16","calc":"36.5x12.8R16","diam":36.5,"w":325,"a":80,"r":16},{"size":"345/75R16","calc":"36.4x13.6R16","diam":36.4,"w":345,"a":75,"r":16},{"size":"36X12.5R16","calc":"","diam":36,"w":318,"a":80,"r":16},{"size":"36X13R16","calc":"","diam":36,"w":330,"a":77,"r":16},{"size":"36X13.5R16","calc":"","diam":36,"w":343,"a":74,"r":16},{"size":"36X14.5R16","calc":"","diam":36,"w":368,"a":69,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"36X12.5R16.5","calc":"","diam":36,"w":318,"a":78,"r":16.5},{"size":"36X13.5R16.5","calc":"","diam":36,"w":343,"a":72,"r":16.5},{"size":"36X14.5R16.5","calc":"","diam":36,"w":368,"a":67,"r":16.5},{"size":"36X16R16.5","calc":"","diam":36,"w":406,"a":61,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"355/70R17","calc":"36.6x14R17","diam":36.6,"w":355,"a":70,"r":17},{"size":"36X12.5R17","calc":"","diam":36,"w":318,"a":76,"r":17},{"size":"36X13.5R17","calc":"","diam":36,"w":343,"a":70,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"355/65R18","calc":"36.2x14R18","diam":36.2,"w":355,"a":65,"r":18},{"size":"36X13.5R18","calc":"","diam":36,"w":343,"a":67,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"355/60R20","calc":"36.8x14R20","diam":36.8,"w":355,"a":60,"r":20},{"size":"36X13.5R20","calc":"","diam":36,"w":343,"a":59,"r":20},{"size":"36X15.5R20","calc":"","diam":36,"w":394,"a":52,"r":20}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"315/50R24","calc":"36.4X12.4R24","diam":36.4,"w":315,"a":50,"r":24}]}],"37":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"37X12.5R15","calc":"","diam":37,"w":318,"a":88,"r":15},{"size":"37X13R15","calc":"","diam":37,"w":330,"a":85,"r":15},{"size":"37X13.5R15","calc":"","diam":37,"w":343,"a":81,"r":15},{"size":"37X14R15","calc":"","diam":37,"w":356,"a":79,"r":15},{"size":"37X14.5R15","calc":"","diam":37,"w":368,"a":76,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"365/75R16","calc":"37.6x14.4R16","diam":37.6,"w":365,"a":75,"r":16},{"size":"37X12.5R16","calc":"","diam":37,"w":318,"a":84,"r":16},{"size":"37X13R16","calc":"","diam":37,"w":330,"a":81,"r":16},{"size":"37X13.5R16","calc":"","diam":37,"w":343,"a":78,"r":16},{"size":"37X14R16","calc":"","diam":37,"w":356,"a":75,"r":16},{"size":"37X14.5R16","calc":"","diam":37,"w":368,"a":72,"r":16},{"size":"385/70R16","calc":"37.2x15.2R16","diam":37.2,"w":385,"a":70,"r":16},{"size":"395/70R16","calc":"37.8x15.6R16","diam":37.8,"w":395,"a":70,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"37X12.5R16.5","calc":"","diam":37,"w":318,"a":82,"r":16.5},{"size":"37X13R16.5","calc":"","diam":37,"w":330,"a":79,"r":16.5},{"size":"37X14R16.5","calc":"","diam":37,"w":356,"a":73,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"37X12.5R17","calc":"","diam":37,"w":318,"a":80,"r":17},{"size":"37X13R17","calc":"","diam":37,"w":330,"a":77,"r":17},{"size":"37X13.5R17","calc":"","diam":37,"w":343,"a":74,"r":17},{"size":"37X14R17","calc":"","diam":37,"w":356,"a":71,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"37X11.5R18","calc":"","diam":37,"w":292,"a":83,"r":18},{"size":"37X12.5R18","calc":"","diam":37,"w":318,"a":76,"r":18},{"size":"37X13.5R18","calc":"","diam":37,"w":343,"a":70,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"37X11.5R20","calc":"","diam":37,"w":292,"a":74,"r":20},{"size":"37X12.5R20","calc":"","diam":37,"w":318,"a":68,"r":20},{"size":"37X13.5R20","calc":"","diam":37,"w":343,"a":63,"r":20},{"size":"37X14.5R20","calc":"","diam":37,"w":368,"a":59,"r":20}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"37X12.5R22","calc":"37x12.5R22","diam":37,"w":318,"a":60,"r":22}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"37X13.5R24","calc":"","diam":37,"w":343,"a":48,"r":24},{"size":"37X14.5R24","calc":"","diam":37,"w":368,"a":45,"r":24}]},{"wheelGroup":"26\" Wheel Size","items":[{"size":"37X13.5R26","calc":"","diam":37,"w":343,"a":41,"r":26}]},{"wheelGroup":"28\" Wheel Size","items":[{"size":"325/35R28","calc":"37x12.8R28","diam":37,"w":325,"a":35,"r":28}]},{"wheelGroup":"30\" Wheel Size","items":[{"size":"315/30R30","calc":"37.4x12.4R30","diam":37.44094488188976,"w":315,"a":30,"r":30}]}],"38":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"38X12.5R15","calc":"","diam":38,"w":318,"a":92,"r":15},{"size":"38X13R15","calc":"","diam":38,"w":330,"a":88,"r":15},{"size":"38X14.5R15","calc":"","diam":38,"w":368,"a":79,"r":15},{"size":"38X15.5R15","calc":"","diam":38,"w":394,"a":74,"r":15},{"size":"38.5X11R15","calc":"","diam":38.5,"w":279,"a":107,"r":15},{"size":"38.5X13.5R15","calc":"","diam":38.5,"w":343,"a":87,"r":15},{"size":"38.5X14.5R15","calc":"","diam":38.5,"w":368,"a":81,"r":15},{"size":"38.5X15R15","calc":"","diam":38.5,"w":381,"a":78,"r":15},{"size":"38.5X16R15","calc":"","diam":38.5,"w":406,"a":73,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"38X13R16","calc":"","diam":38,"w":330,"a":85,"r":16},{"size":"38X14.5R16","calc":"","diam":38,"w":368,"a":76,"r":16},{"size":"38X15.5R16","calc":"","diam":38,"w":394,"a":71,"r":16},{"size":"38.5X11R16","calc":"","diam":38.5,"w":279,"a":102,"r":16},{"size":"38.5X13.5R16","calc":"","diam":38.5,"w":343,"a":83,"r":16},{"size":"38.5X14.5R16","calc":"","diam":38.5,"w":368,"a":78,"r":16},{"size":"38.5X15R16","calc":"","diam":38.5,"w":381,"a":75,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"38X11R16.5","calc":"","diam":38,"w":279,"a":98,"r":16.5},{"size":"38X12.5R16.5","calc":"","diam":38,"w":318,"a":86,"r":16.5},{"size":"38X15.5R16.5","calc":"","diam":38,"w":394,"a":69,"r":16.5},{"size":"38.5X11R16.5","calc":"","diam":38.5,"w":279,"a":100,"r":16.5},{"size":"38.5X13.5R16.5","calc":"","diam":38.5,"w":343,"a":81,"r":16.5},{"size":"38.5X14.5R16.5","calc":"","diam":38.5,"w":368,"a":76,"r":16.5},{"size":"38.5X15R16.5","calc":"","diam":38.5,"w":381,"a":73,"r":16.5},{"size":"38.5X16R16.5","calc":"","diam":38.5,"w":406,"a":69,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"38X13.5R17","calc":"","diam":38,"w":343,"a":78,"r":17},{"size":"38X14.5R17","calc":"","diam":38,"w":368,"a":72,"r":17},{"size":"38X15.5R17","calc":"","diam":38,"w":394,"a":68,"r":17},{"size":"38.5X13.5R17","calc":"","diam":38.5,"w":343,"a":80,"r":17},{"size":"38.5X14.5R17","calc":"","diam":38.5,"w":368,"a":74,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"38X13.5R18","calc":"","diam":38,"w":343,"a":74,"r":18},{"size":"38X14.5R18","calc":"","diam":38,"w":368,"a":69,"r":18},{"size":"38X15R18","calc":"","diam":38,"w":381,"a":67,"r":18},{"size":"38X15.5R18","calc":"","diam":38,"w":394,"a":65,"r":18},{"size":"38.5X14.5R18","calc":"","diam":38.5,"w":368,"a":71,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"38X13.5R20","calc":"","diam":38,"w":343,"a":67,"r":20},{"size":"38X14.5R20","calc":"","diam":38,"w":368,"a":62,"r":20},{"size":"38X15.5R20","calc":"","diam":38,"w":394,"a":58,"r":20},{"size":"38.5X13.5R20","calc":"","diam":38.5,"w":343,"a":69,"r":20},{"size":"38.5X14.5R20","calc":"","diam":38.5,"w":368,"a":64,"r":20}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"38X13.5R24","calc":"","diam":38,"w":343,"a":52,"r":24},{"size":"38X14R24","calc":"","diam":38,"w":356,"a":50,"r":24},{"size":"38X15.5R24","calc":"","diam":38,"w":394,"a":45,"r":24}]},{"wheelGroup":"26\" Wheel Size","items":[{"size":"38X15.5R26","calc":"","diam":38,"w":394,"a":39,"r":26}]}],"39":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"39X13.5R15","calc":"","diam":39,"w":343,"a":89,"r":15},{"size":"39.5X13.5R15","calc":"","diam":39.5,"w":343,"a":91,"r":15},{"size":"39.5X15R15","calc":"","diam":39.5,"w":381,"a":82,"r":15},{"size":"39.5X18R15","calc":"","diam":39.5,"w":457,"a":68,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"39X13.5R16","calc":"","diam":39,"w":343,"a":85,"r":16},{"size":"39.5X13.5R16","calc":"","diam":39.5,"w":343,"a":87,"r":16},{"size":"39.5X15R16","calc":"","diam":39.5,"w":381,"a":78,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"39X13.5R16.5","calc":"","diam":39,"w":343,"a":83,"r":16.5},{"size":"39.5X13.5R16.5","calc":"","diam":39.5,"w":343,"a":85,"r":16.5},{"size":"39.5X15R16.5","calc":"","diam":39.5,"w":381,"a":77,"r":16.5},{"size":"39.5X18R16.5","calc":"","diam":39.5,"w":457,"a":64,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"39X13.5R17","calc":"","diam":39,"w":343,"a":81,"r":17},{"size":"39.5X13.5R17","calc":"","diam":39.5,"w":343,"a":83,"r":17},{"size":"39.5X15R17","calc":"","diam":39.5,"w":381,"a":75,"r":17}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"39X13.5R20","calc":"","diam":39,"w":343,"a":70,"r":20},{"size":"39.5X13.5R20","calc":"","diam":39.5,"w":343,"a":72,"r":20},{"size":"39.5X15R20","calc":"","diam":39.5,"w":381,"a":65,"r":20}]}],"40":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"40X16R15","calc":"","diam":40,"w":406,"a":78,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"40X16R16","calc":"","diam":40,"w":406,"a":75,"r":16}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"40X13.5R17","calc":"","diam":40,"w":343,"a":85,"r":17},{"size":"40X14.5R17","calc":"","diam":40,"w":368,"a":79,"r":17},{"size":"40X16R17","calc":"","diam":40,"w":406,"a":72,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"40X13.5R18","calc":"","diam":40,"w":343,"a":81,"r":18},{"size":"40X14.5R18","calc":"","diam":40,"w":368,"a":76,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"40X13.5R20","calc":"","diam":40,"w":343,"a":74,"r":20},{"size":"40X14.5R20","calc":"","diam":40,"w":368,"a":69,"r":20},{"size":"40X15.5R20","calc":"","diam":40,"w":394,"a":65,"r":20}]},{"wheelGroup":"22\" Wheel Size","items":[{"size":"40X15.5R22","calc":"40x15.5R22","diam":40,"w":394,"a":62,"r":22}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"40X13.5R24","calc":"","diam":40,"w":343,"a":59,"r":24},{"size":"40X14.5R24","calc":"","diam":40,"w":368,"a":55,"r":24},{"size":"40X15.5R24","calc":"","diam":40,"w":394,"a":52,"r":24}]},{"wheelGroup":"26\" Wheel Size","items":[{"size":"40X13.5R26","calc":"","diam":40,"w":343,"a":52,"r":26},{"size":"40X15.5R26","calc":"","diam":40,"w":394,"a":45,"r":26}]},{"wheelGroup":"28\" Wheel Size","items":[{"size":"40X15.5R28","calc":"","diam":40,"w":394,"a":39,"r":28}]}],"41-54":[{"wheelGroup":"15\" Wheel Size","items":[{"size":"42X14R15","calc":"","diam":42,"w":356,"a":96,"r":15},{"size":"42X15R15","calc":"","diam":42,"w":381,"a":90,"r":15},{"size":"42.5X13.5R15","calc":"","diam":42.5,"w":343,"a":102,"r":15},{"size":"44X18.5R15","calc":"","diam":44,"w":470,"a":78,"r":15},{"size":"44X19.5R15","calc":"","diam":44,"w":495,"a":74,"r":15},{"size":"44X21R15","calc":"","diam":44,"w":533,"a":69,"r":15},{"size":"47X17R15","calc":"","diam":47,"w":432,"a":94,"r":15}]},{"wheelGroup":"16\" Wheel Size","items":[{"size":"41X14.5R16","calc":"","diam":41,"w":368,"a":86,"r":16},{"size":"42X14R16","calc":"","diam":42,"w":356,"a":93,"r":16},{"size":"42X15R16","calc":"","diam":42,"w":381,"a":87,"r":16},{"size":"42.5X13.5R16","calc":"","diam":42.5,"w":343,"a":98,"r":16},{"size":"44X19.5R16","calc":"","diam":44,"w":495,"a":72,"r":16},{"size":"44X21R16","calc":"","diam":44,"w":533,"a":67,"r":16},{"size":"46X19.5R16","calc":"","diam":46,"w":495,"a":77,"r":16}]},{"wheelGroup":"16.5\" Wheel Size","items":[{"size":"42X14R16.5","calc":"","diam":42,"w":356,"a":91,"r":16.5},{"size":"42X15R16.5","calc":"","diam":42,"w":381,"a":85,"r":16.5},{"size":"42.5X13.5R16.5","calc":"","diam":42.5,"w":343,"a":96,"r":16.5},{"size":"43X14.5R16.5","calc":"","diam":43,"w":368,"a":91,"r":16.5},{"size":"44X18.5R16.5","calc":"","diam":44,"w":470,"a":74,"r":16.5},{"size":"44X18.5R16.5","calc":"","diam":44,"w":470,"a":74,"r":16.5},{"size":"44X19.5R16.5","calc":"","diam":44,"w":495,"a":71,"r":16.5},{"size":"44X21R16.5","calc":"","diam":44,"w":533,"a":65,"r":16.5},{"size":"47X17R16.5","calc":"","diam":47,"w":432,"a":90,"r":16.5},{"size":"48X12.5R16.5","calc":"","diam":48,"w":318,"a":126,"r":16.5},{"size":"49X21R16.5","calc":"","diam":49,"w":533,"a":77,"r":16.5}]},{"wheelGroup":"17\" Wheel Size","items":[{"size":"41X14.5R17","calc":"","diam":41,"w":368,"a":83,"r":17},{"size":"42X14R17","calc":"","diam":42,"w":356,"a":89,"r":17},{"size":"42X14.5R17","calc":"","diam":42,"w":368,"a":86,"r":17},{"size":"42X15R17","calc":"","diam":42,"w":381,"a":83,"r":17},{"size":"42.5X13.5R17","calc":"","diam":42.5,"w":343,"a":94,"r":17},{"size":"43X14.5R17","calc":"","diam":43,"w":368,"a":90,"r":17},{"size":"44X19.5R17","calc":"","diam":44,"w":495,"a":69,"r":17},{"size":"44X21R17","calc":"","diam":44,"w":533,"a":64,"r":17},{"size":"47X17R17","calc":"","diam":47,"w":432,"a":88,"r":17},{"size":"49X21R17","calc":"","diam":49,"w":533,"a":76,"r":17},{"size":"54X19.5R17","calc":"","diam":54,"w":495,"a":95,"r":17}]},{"wheelGroup":"18\" Wheel Size","items":[{"size":"41X14.5R18","calc":"","diam":41,"w":368,"a":79,"r":18}]},{"wheelGroup":"20\" Wheel Size","items":[{"size":"41X14.5R20","calc":"","diam":41,"w":368,"a":72,"r":20},{"size":"42X14.5R20","calc":"","diam":42,"w":368,"a":76,"r":20},{"size":"42X15R20","calc":"","diam":42,"w":381,"a":73,"r":20},{"size":"42.5X13.5R20","calc":"","diam":42.5,"w":343,"a":83,"r":20},{"size":"43X14.5R20","calc":"","diam":43,"w":368,"a":79,"r":20},{"size":"44X19.5R20","calc":"","diam":44,"w":495,"a":62,"r":20},{"size":"44X19.5R20","calc":"","diam":44,"w":495,"a":62,"r":20},{"size":"44X21R20","calc":"","diam":44,"w":533,"a":57,"r":20},{"size":"45X14.5R20","calc":"","diam":45,"w":368,"a":86,"r":20},{"size":"46X19.5R20","calc":"","diam":46,"w":495,"a":67,"r":20},{"size":"49X21R20","calc":"","diam":49,"w":533,"a":69,"r":20},{"size":"54X19.5R20","calc":"","diam":54,"w":495,"a":87,"r":20}]},{"wheelGroup":"24\" Wheel Size","items":[{"size":"42X15.5R24","calc":"","diam":42,"w":394,"a":58,"r":24}]},{"wheelGroup":"26\" Wheel Size","items":[{"size":"42X15.5R26","calc":"","diam":42,"w":394,"a":52,"r":26}]},{"wheelGroup":"28\" Wheel Size","items":[{"size":"42X15.5R28","calc":"","diam":42,"w":394,"a":45,"r":28}]}]};

  function initDiameterCharts() {
    const tabsBar = document.getElementById('diam-tabs-bar');
    const subhead = document.getElementById('calc-diam-charts-subhead');
    const body = document.getElementById('calc-diam-charts-body');
    if (!tabsBar || !subhead || !body) return;

    function renderDiam(diamKey) {
      if (subhead) subhead.textContent = `${diamKey}" Diameter Tyre Size Calculation Chart`;
      const groups = DIAMETER_CHARTS_DATA[diamKey] || [];
      if (!groups.length) {
        body.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">No tyre chart entries found for ${diamKey}" tall tyres.</div>`;
        return;
      }

      body.innerHTML = groups.map(g => `
        <div class="calc-chart-col">
          <div class="calc-chart-col-title">${g.wheelGroup}</div>
          <ul class="calc-chart-list">
            ${g.items.map(it => `
              <li class="calc-chart-item">
                <button type="button" class="calc-chart-size-link" data-w="${it.w}" data-a="${it.a}" data-r="${it.r}">
                  ${it.size}
                </button>
                ${it.calc ? `<span class="calc-chart-equiv"> = ${it.calc}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');

      bindSizeLinks();
    }

    function bindSizeLinks() {
      body.querySelectorAll('.calc-chart-size-link').forEach(btn => {
        btn.addEventListener('click', () => {
          const w = parseInt(btn.getAttribute('data-w'), 10);
          const a = parseInt(btn.getAttribute('data-a'), 10);
          const r = parseFloat(btn.getAttribute('data-r'));
          const sizeText = btn.textContent.trim();

          if (state.activeTab === 'calculator') {
            state.t1.width = w;
            state.t1.aspect = a;
            state.t1.rim = r;
            if (dom.singleW) dom.singleW.value = w;
            if (dom.singleA) dom.singleA.value = a;
            if (dom.singleR) dom.singleR.value = r;
          } else {
            state.t2.width = w;
            state.t2.aspect = a;
            state.t2.rim = r;
            if (dom.cmpW2) dom.cmpW2.value = w;
            if (dom.cmpA2) dom.cmpA2.value = a;
            if (dom.cmpR2) dom.cmpR2.value = r;
          }

          render();

          const widget = document.getElementById('calc-box-widget');
          if (widget) {
            widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          if (typeof showToast === 'function') {
            showToast(`Loaded ${sizeText} into Tyre Calculator`, 'info');
          }
        });
      });
    }

    tabsBar.querySelectorAll('.calc-wheel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabsBar.querySelectorAll('.calc-wheel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const diam = tab.getAttribute('data-diam');
        renderDiam(diam);
      });
    });

    const initialDiamTab = tabsBar.querySelector('.calc-wheel-tab.active');
    if (initialDiamTab) {
      renderDiam(initialDiamTab.getAttribute('data-diam'));
    } else {
      bindSizeLinks();
    }
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    attachEvents();
    render();
    initWheelCharts();
    initDiameterCharts();
  });

})();
