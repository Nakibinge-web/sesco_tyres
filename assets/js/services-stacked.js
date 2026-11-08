/**
 * SESCO TYRES - OUR SERVICES PAGE SCROLL ANIMATION & COMPOSITION
 * Cinematic, Reversible Scroll-Driven Timeline:
 * 
 * Stage 1: Centered Hexagonal circular-path entrance & center title reveal
 * Stage 2: Cards align horizontally, "Our Services" heading glides above
 * Stage 3: Smooth transition to rich solid black background (#000000)
 *          Wheel Alignment card length increases (longer than others)
 *          Full-width description of ONLY Wheel Alignment service appears below
 * Interactive: Clicking any other card elongates it and displays its description
 * Section ends 40px below description, revealing CTA band & Footer cleanly
 */
(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServicesAnimation);
  } else {
    initServicesAnimation();
  }

  function initServicesAnimation() {
    const stackedGrid = document.getElementById('servicesStackedGrid');
    if (!stackedGrid) return;

    let hexContainer = document.getElementById('servicesHexContainer');
    if (!hexContainer) {
      hexContainer = document.createElement('div');
      hexContainer.className = 'services-hex-container';
      hexContainer.id = 'servicesHexContainer';
      stackedGrid.appendChild(hexContainer);
    }

    const cards = Array.from(stackedGrid.querySelectorAll('.service-stack-card'));
    if (cards.length === 0) return;

    // Ensure all cards are inside hexContainer
    cards.forEach(card => {
      if (card.parentNode !== hexContainer) {
        hexContainer.appendChild(card);
      }
    });

    // Heading "Our Services"
    let centerTitle = document.getElementById('servicesCenterTitle');
    if (!centerTitle) {
      centerTitle = document.createElement('div');
      centerTitle.className = 'services-center-title';
      centerTitle.id = 'servicesCenterTitle';
      centerTitle.innerHTML = `
        <span class="services-eyebrow">PRECISION & VEHICLE CARE</span>
        <h2 class="services-heading-text">Our Services</h2>
      `;
      hexContainer.insertBefore(centerTitle, hexContainer.firstChild);
    }

    // Pure Solid Black Background Overlay
    let bgOverlay = document.getElementById('servicesBgOverlay');
    if (!bgOverlay) {
      bgOverlay = document.createElement('div');
      bgOverlay.className = 'services-bg-overlay';
      bgOverlay.id = 'servicesBgOverlay';
      document.body.appendChild(bgOverlay);
    }

    // Full-Width Service Description Panel
    let descPanel = document.getElementById('serviceDescriptionPanelFull');
    if (!descPanel) {
      descPanel = document.createElement('div');
      descPanel.className = 'service-description-panel-full';
      descPanel.id = 'serviceDescriptionPanelFull';
      descPanel.innerHTML = `
        <div class="service-panel-body">
          <div class="service-panel-main">
            <h3 class="service-panel-title" id="servicePanelTitle">Wheel Alignment</h3>
            <p class="service-panel-desc" id="servicePanelDesc"></p>
            <div class="service-panel-actions">
              <a href="#" class="service-panel-btn" id="servicePanelLink">
                <span>Explore Service Details</span>
                <span class="btn-arrow"><i class="fa-solid fa-arrow-right"></i></span>
              </a>
            </div>
          </div>
          <div class="service-panel-features" id="servicePanelFeatures">
            <ul class="service-features-list"></ul>
          </div>
        </div>
      `;
      hexContainer.appendChild(descPanel);
    }

    // Comprehensive Service Data
    const serviceData = [
      {
        index: 0,
        num: '01',
        tag: 'COMPUTERIZED 3D LASER PRECISION',
        title: 'Wheel Alignment',
        description: 'At Sesco tyres, we believe one of the most important considerations to vehicle maintenance is to ensure your wheels are correctly aligned. Proper alignment prevents uneven tire wear, improves fuel efficiency, and ensures your vehicle handles safely on the road.',
        features: ['3D Laser Sensor Diagnostics', 'Camber, Caster & Toe Calibration', 'Prevents Irregular Tread Wear', 'Restores Factory Handling'],
        link: 'service-detail.html#alignment'
      },
      {
        index: 1,
        num: '02',
        tag: 'MAXIMUM TREAD LIFE & HANDLING',
        title: 'Tyre Rotation',
        description: 'Tyres are expensive, so you want to make them last as long as possible. It is essential to rotate your tyres periodically to prevent uneven wear. Regular rotation extends tire life and maintains balanced handling across all four wheels.',
        features: ['Even Wear Distribution', 'Maintains Balanced Traction', 'Extended Mileage Lifespan', 'Comprehensive Tread Inspection'],
        link: 'service-detail.html#rotation'
      },
      {
        index: 2,
        num: '03',
        tag: 'PRECISION MOUNTING & SAFETY',
        title: 'Tyre Fitting',
        description: 'An incorrectly fitted tyre can become damaged and burst and could lead to traffic accidents involving vehicle damage and personal injury. Our expert technicians ensure every tire is fitted to manufacturer specifications for your safety.',
        features: ['Zero-Damage Rim Mounting', 'Bead Sealing & Pressure Check', 'OEM Torque Specification', 'New Tubeless Valve Installation'],
        link: 'service-detail.html#fitting'
      },
      {
        index: 3,
        num: '04',
        tag: 'DYNAMIC VIBRATION-FREE ROTATION',
        title: 'Tyre Balancing',
        description: 'Wheel balancing is the process of matching the weight of the combined tyre and wheel assembly so that it spins smoothly at high speed. Proper balancing eliminates vibrations and prevents premature wear on suspension components.',
        features: ['Dynamic Computerized Wheel Balancer', 'Eliminates Steering Wheel Vibration', 'Protects Suspension Bushings', 'Smooth High-Speed Cruising'],
        link: 'service-detail.html#balancing'
      },
      {
        index: 4,
        num: '05',
        tag: '100% GENUINE IMPORTED BRANDS',
        title: 'Stock Tyres',
        description: 'Our tyres are on more vehicles in Uganda than any other brand. Delivering trusted quality, durability, and safety across every road you travel. We stock a wide range of premium brands for all vehicle types.',
        features: ['Authorized Direct Importer', 'Michelin, Bridgestone, Continental, Pirelli', 'Passenger, SUV, Commercial & 4x4', 'Manufacturer Warranty Backed'],
        link: 'service-detail.html#tyres'
      },
      {
        index: 5,
        num: '06',
        tag: 'COMPLETE VEHICLE HEALTH & CARE',
        title: 'Basic Car Servicing',
        description: 'An oil change is the most important part of any car service. If oil is not changed regularly, sludge can build up and stop the engine from being lubricated properly. We provide comprehensive servicing to keep your vehicle running smoothly.',
        features: ['Premium Synthetic Oil & Filter Replacement', 'Fluid Level Top-ups & Leak Checks', 'Brake Pad & Rotor Health Inspection', 'Multi-Point Vehicle Safety Check'],
        link: 'service-detail.html#servicing'
      }
    ];

    // State: Wheel alignment (0) is active by default
    let activeCardIndex = 0;
    let isHorizontalActive = false;

    // Helper to update the full-width description panel content
    function renderServiceData(serviceIndex) {
      const s = serviceData[serviceIndex];
      if (!s) return;

      const titleEl = document.getElementById('servicePanelTitle');
      const descEl = document.getElementById('servicePanelDesc');
      const featuresEl = document.getElementById('servicePanelFeatures');
      const linkEl = document.getElementById('servicePanelLink');

      if (titleEl) titleEl.textContent = s.title;
      if (descEl) descEl.textContent = s.description;

      if (featuresEl) {
        featuresEl.innerHTML = `
          <ul class="service-features-list">
            ${s.features.map(f => `<li><i class="fa-solid fa-check"></i> <span>${f}</span></li>`).join('')}
          </ul>
        `;
      }

      if (linkEl) {
        linkEl.href = s.link;
        const textSpan = linkEl.querySelector('span:first-child') || linkEl.querySelector('span');
        if (textSpan) {
          textSpan.textContent = `Explore ${s.title} Details`;
        }
      }
    }

    // Switch active service on user click
    function setActiveService(newIndex, animate = true) {
      if (newIndex < 0 || newIndex >= serviceData.length) return;
      activeCardIndex = newIndex;

      const layout = getLayoutDimensions();

      // Update card visual active classes, heights, aligned centers, and keep service title visible in white text
      cards.forEach((card, idx) => {
        const cardContent = card.querySelector('.service-stack-content');
        if (cardContent) cardContent.style.opacity = 1;

        if (idx === activeCardIndex) {
          card.classList.add('active-card');
          if (isHorizontalActive) {
            card.style.height = layout.activeHeight + 'px';
            const curX = layout.horizPositions[idx];
            const curY = layout.isMobile ? layout.horizYArray[idx] : layout.activeCenterY;
            card.style.transform = `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px)) rotate(0deg)`;
          }
        } else {
          card.classList.remove('active-card');
          if (isHorizontalActive) {
            card.style.height = layout.cardHeight + 'px';
            const curX = layout.horizPositions[idx];
            const curY = layout.isMobile ? layout.horizYArray[idx] : layout.standardCenterY;
            card.style.transform = `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px)) rotate(0deg)`;
          }
        }
      });

      if (animate && descPanel.classList.contains('visible')) {
        descPanel.style.opacity = 0;
        descPanel.style.transform = `translate(-50%, calc(-50% + ${layout.panelY + 10}px))`;
        setTimeout(() => {
          renderServiceData(activeCardIndex);
          descPanel.style.opacity = 1;
          descPanel.style.transform = `translate(-50%, calc(-50% + ${layout.panelY}px))`;
        }, 150);
      } else {
        renderServiceData(activeCardIndex);
      }
    }

    // Expose for testing and external triggers
    window.handleServicesScroll = handleScroll;
    window.setActiveService = setActiveService;

    // Initialize with Wheel Alignment (0)
    renderServiceData(0);

    // Scroll Progress Hint
    let scrollHint = document.getElementById('servicesScrollHint');
    if (!scrollHint) {
      scrollHint = document.createElement('div');
      scrollHint.className = 'scroll-progress-hint';
      scrollHint.id = 'servicesScrollHint';
      scrollHint.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="7 13 12 18 17 13"></polyline>
          <polyline points="7 6 12 11 17 6"></polyline>
        </svg>
        <span>Scroll to explore</span>
      `;
      document.body.appendChild(scrollHint);
    }

    // Centered hexagonal animation configuration (symmetrical around origin 0, 0)
    const cardConfigs = [
      { index: 0, finalX: -150, finalY: -200, radius: 300, startAngle: 225, delay: 0 },    // Card 1: Wheel Alignment
      { index: 1, finalX: 170,  finalY: -200, radius: 320, startAngle: 270, delay: 0.15 },   // Card 2: Tyre Rotation
      { index: 2, finalX: 470,  finalY: 0,    radius: 340, startAngle: 315, delay: 0.3 },    // Card 3: Tyre Fitting
      { index: 3, finalX: 170,  finalY: 200,  radius: 320, startAngle: 45,  delay: 0.45 },   // Card 4: Tyre Balancing
      { index: 4, finalX: -150, finalY: 200,  radius: 300, startAngle: 90,  delay: 0.6 },    // Card 5: Stock Tyres
      { index: 5, finalX: -470, finalY: 0,    radius: 360, startAngle: 180, delay: 0.75 }    // Card 6: Basic Servicing
    ];

    // Easing helper
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Calculate layout parameters dynamically based on screen width
    function getLayoutDimensions() {
      const w = window.innerWidth;
      if (w > 1280) {
        return {
          cardWidth: 185,
          cardHeight: 220,
          activeHeight: 275,
          horizPositions: [-512.5, -307.5, -102.5, 102.5, 307.5, 512.5],
          standardCenterY: -105,
          activeCenterY: -75,
          titleHexX: 0,
          titleHexY: 0,
          titleHorizX: 0,
          titleHorizY: -260,
          panelY: 245,
          isMobile: false
        };
      } else if (w > 1024) {
        return {
          cardWidth: 155,
          cardHeight: 195,
          activeHeight: 245,
          horizPositions: [-427.5, -256.5, -85.5, 85.5, 256.5, 427.5],
          standardCenterY: -100,
          activeCenterY: -72.5,
          titleHexX: 0,
          titleHexY: 0,
          titleHorizX: 0,
          titleHorizY: -250,
          panelY: 235,
          isMobile: false
        };
      } else if (w > 768) {
        return {
          cardWidth: 130,
          cardHeight: 170,
          activeHeight: 215,
          horizPositions: [-355, -213, -71, 71, 213, 355],
          standardCenterY: -95,
          activeCenterY: -70,
          titleHexX: 0,
          titleHexY: 0,
          titleHorizX: 0,
          titleHorizY: -235,
          panelY: 220,
          isMobile: false
        };
      } else {
        // Mobile layout: 2 rows of 3 compact cards with generous clearance above description
        return {
          cardWidth: 100,
          cardHeight: 120,
          activeHeight: 145,
          horizPositions: [-110, 0, 110, -110, 0, 110],
          horizYArray: [-150, -150, -150, -20, -20, -20],
          standardCenterY: -90,
          activeCenterY: -60,
          titleHexX: 0,
          titleHexY: -210,
          titleHorizX: 0,
          titleHorizY: -225,
          panelY: 195,
          isMobile: true
        };
      }
    }

    // Circular motion path during initial entrance
    function calculateCardHexPosition(config, scrollProgress) {
      const adjustedProgress = Math.max(0, Math.min(1, (scrollProgress - config.delay) / (1 - config.delay)));
      const easedProgress = easeOutCubic(adjustedProgress);

      const angleRad = (config.startAngle * Math.PI) / 180;
      const startX = config.finalX + Math.cos(angleRad) * config.radius;
      const startY = config.finalY + Math.sin(angleRad) * config.radius;

      const currentX = startX + (config.finalX - startX) * easedProgress;
      const currentY = startY + (config.finalY - startY) * easedProgress;
      const rotation = (1 - easedProgress) * 360 * 1.5;
      const opacity = easedProgress;

      return { x: currentX, y: currentY, rotation, opacity };
    }

    // Main scroll handler - pure, scrubbed mathematical timeline
    function handleScroll() {
      const scrollY = window.scrollY;
      const gridRect = stackedGrid.getBoundingClientRect();
      const gridTop = scrollY + gridRect.top;
      const scrollFromTop = scrollY - gridTop + window.innerHeight * 0.25;

      const layout = getLayoutDimensions();

      // Calibrated timeline intervals (finishes cleanly with runway ending 40px below description)
      const hexagonScrollRange = 550;    // Stage 1: 0 - 550
      const holdHexagonEnd = 800;        // Stage 1 Hold: 550 - 800
      const horizontalScrollStart = 800;
      const horizontalScrollEnd = 1350;  // Stage 2: 800 - 1350
      const holdHorizontalEnd = 1500;    // Stage 2 Hold: 1350 - 1500
      const bgScrollStart = 1500;
      const bgScrollEnd = 1900;          // Stage 3: 1500 - 1900 (Background to solid black & Wheel alignment description reveals)
      const sectionEndScroll = 2100;     // Stage 4 Hold ends, section cleanly unpins ~40px below description

      // Ensure sticky container stays firmly pinned
      hexContainer.style.position = 'sticky';

      // -------------------------------------------------------------
      // STAGE 0: Above Showcase Section (User is interacting with Hero Banner)
      // Completely hide showcase elements and prevent pointer interaction
      // -------------------------------------------------------------
      if (scrollFromTop <= 0) {
        isHorizontalActive = false;
        hexContainer.style.visibility = 'hidden';
        hexContainer.style.pointerEvents = 'none';
        hexContainer.classList.remove('is-interactive');

        cardConfigs.forEach((config) => {
          const card = cards[config.index];
          if (!card) return;
          card.style.opacity = '0';
          card.style.pointerEvents = 'none';
          card.classList.remove('active-card', 'in-horizontal');
        });

        centerTitle.style.opacity = '0';
        centerTitle.classList.remove('visible', 'dark-mode');
        descPanel.style.opacity = '0';
        descPanel.classList.remove('visible');
        bgOverlay.style.opacity = '0';
        scrollHint.classList.add('hidden');
        return;
      }

      // Restore container visibility when showcase section is entered
      hexContainer.style.visibility = 'visible';

      // -------------------------------------------------------------
      // STAGE 1: Hexagonal Entrance (0 < scrollFromTop < 550)
      // -------------------------------------------------------------
      if (scrollFromTop < hexagonScrollRange) {
        isHorizontalActive = false;
        hexContainer.classList.remove('is-interactive');
        hexContainer.style.pointerEvents = 'none';
        const hexProgress = Math.max(0, Math.min(1, scrollFromTop / hexagonScrollRange));

        cardConfigs.forEach((config) => {
          const card = cards[config.index];
          if (!card) return;
          const pos = calculateCardHexPosition(config, hexProgress);

          card.style.transform = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.rotation}deg)`;
          card.style.opacity = pos.opacity;
          card.style.pointerEvents = 'none';
          card.style.width = layout.cardWidth + 'px';
          card.style.height = layout.cardHeight + 'px';
          card.classList.remove('active-card', 'in-horizontal');

          const cardContent = card.querySelector('.service-stack-content');
          if (cardContent) cardContent.style.opacity = 1;
        });

        // Title appears in center of hexagon as formation completes
        if (hexProgress > 0.8) {
          const titleOpacity = (hexProgress - 0.8) / 0.2;
          centerTitle.style.opacity = titleOpacity;
          centerTitle.style.transform = `translate(calc(-50% + ${layout.titleHexX}px), calc(-50% + ${layout.titleHexY}px))`;
          centerTitle.classList.add('visible');
        } else {
          centerTitle.style.opacity = 0;
          centerTitle.classList.remove('visible');
        }

        centerTitle.classList.remove('dark-mode');
        bgOverlay.style.opacity = 0;

        // Description panel hidden
        descPanel.style.opacity = 0;
        descPanel.classList.remove('visible');

        scrollHint.classList.remove('hidden');
        scrollHint.querySelector('span').textContent = 'Scroll to explore';
      }

      // -------------------------------------------------------------
      // STAGE 1 HOLD: Hexagonal Showcase (550 <= scrollFromTop < 800)
      // -------------------------------------------------------------
      else if (scrollFromTop >= hexagonScrollRange && scrollFromTop < horizontalScrollStart) {
        isHorizontalActive = false;
        hexContainer.classList.remove('is-interactive');
        hexContainer.style.pointerEvents = 'none';

        cardConfigs.forEach((config) => {
          const card = cards[config.index];
          if (!card) return;

          card.style.transform = `translate(calc(-50% + ${config.finalX}px), calc(-50% + ${config.finalY}px)) rotate(0deg)`;
          card.style.opacity = 1;
          card.style.pointerEvents = 'none';
          card.style.width = layout.cardWidth + 'px';
          card.style.height = layout.cardHeight + 'px';
          card.classList.remove('active-card', 'in-horizontal');

          const cardContent = card.querySelector('.service-stack-content');
          if (cardContent) cardContent.style.opacity = 1;
        });

        centerTitle.style.opacity = 1;
        centerTitle.style.transform = `translate(calc(-50% + ${layout.titleHexX}px), calc(-50% + ${layout.titleHexY}px))`;
        centerTitle.classList.add('visible');
        centerTitle.classList.remove('dark-mode');

        bgOverlay.style.opacity = 0;

        descPanel.style.opacity = 0;
        descPanel.classList.remove('visible');

        scrollHint.classList.remove('hidden');
        scrollHint.querySelector('span').textContent = 'Keep scrolling';
      }

      // -------------------------------------------------------------
      // STAGE 2: Images Align Horizontally & Title Elevates Above Cards (800 <= scrollFromTop < 1350)
      // All cards remain uniform standard height on clean white background showcase
      // -------------------------------------------------------------
      else if (scrollFromTop >= horizontalScrollStart && scrollFromTop < horizontalScrollEnd) {
        isHorizontalActive = true;
        hexContainer.classList.add('is-interactive');
        hexContainer.style.pointerEvents = 'auto';
        const horizProgress = (scrollFromTop - horizontalScrollStart) / (horizontalScrollEnd - horizontalScrollStart);
        const easedProgress = easeInOutCubic(horizProgress);

        cardConfigs.forEach((config, i) => {
          const card = cards[config.index];
          if (!card) return;

          let targetX = layout.horizPositions[config.index];
          let targetY = layout.isMobile ? layout.horizYArray[config.index] : layout.standardCenterY;

          // Normalized smooth stagger so card 5 completes at horizProgress = 1.0
          const cardDelay = i * 0.08;
          const cardDuration = 1 - (5 * 0.08);
          const cardProgress = Math.max(0, Math.min(1, (horizProgress - cardDelay) / cardDuration));
          const cardEased = easeOutCubic(cardProgress);

          const curX = config.finalX + (targetX - config.finalX) * cardEased;
          const curY = config.finalY + (targetY - config.finalY) * cardEased;

          card.style.transform = `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px)) rotate(0deg)`;
          card.style.opacity = 1;
          card.style.pointerEvents = 'auto';
          card.style.width = layout.cardWidth + 'px';
          card.style.height = layout.cardHeight + 'px';
          card.classList.remove('active-card');
          card.classList.add('in-horizontal');

          // Service name remains clearly visible at bottom center
          const cardContent = card.querySelector('.service-stack-content');
          if (cardContent) cardContent.style.opacity = 1;
        });

        // Title glides up smoothly above cards
        const titleX = layout.titleHexX + (layout.titleHorizX - layout.titleHexX) * easedProgress;
        const titleY = layout.titleHexY + (layout.titleHorizY - layout.titleHexY) * easedProgress;

        centerTitle.style.opacity = 1;
        centerTitle.style.transform = `translate(calc(-50% + ${titleX}px), calc(-50% + ${titleY}px))`;
        centerTitle.classList.add('visible');
        centerTitle.classList.remove('dark-mode');

        // Background is white in showcase
        bgOverlay.style.opacity = 0;

        descPanel.style.opacity = 0;
        descPanel.classList.remove('visible');

        scrollHint.classList.add('hidden');
      }

      // -------------------------------------------------------------
      // STAGE 2 HOLD: Horizontal Line Held in View on White Background (1350 <= scrollFromTop < 1500)
      // -------------------------------------------------------------
      else if (scrollFromTop >= horizontalScrollEnd && scrollFromTop < bgScrollStart) {
        isHorizontalActive = true;
        hexContainer.classList.add('is-interactive');
        hexContainer.style.pointerEvents = 'auto';

        cardConfigs.forEach((config) => {
          const card = cards[config.index];
          if (!card) return;

          let targetX = layout.horizPositions[config.index];
          let targetY = layout.isMobile ? layout.horizYArray[config.index] : layout.standardCenterY;

          card.style.transform = `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) rotate(0deg)`;
          card.style.opacity = 1;
          card.style.pointerEvents = 'auto';
          card.style.width = layout.cardWidth + 'px';
          card.style.height = layout.cardHeight + 'px';
          card.classList.remove('active-card');
          card.classList.add('in-horizontal');

          const cardContent = card.querySelector('.service-stack-content');
          if (cardContent) cardContent.style.opacity = 1;
        });

        centerTitle.style.opacity = 1;
        centerTitle.style.transform = `translate(calc(-50% + ${layout.titleHorizX}px), calc(-50% + ${layout.titleHorizY}px))`;
        centerTitle.classList.add('visible');
        centerTitle.classList.remove('dark-mode');

        // Background remains white in showcase
        bgOverlay.style.opacity = 0;

        descPanel.style.opacity = 0;
        descPanel.classList.remove('visible');

        scrollHint.classList.add('hidden');
      }

      // -------------------------------------------------------------
      // STAGE 3: Smooth Transition to Section with Elongated Cards & Detail Panel (1500 <= scrollFromTop < 1900)
      // Background turns solid black (#000000), active card elongates, detail panel reveals sitting on background
      // -------------------------------------------------------------
      else if (scrollFromTop >= bgScrollStart && scrollFromTop < bgScrollEnd) {
        isHorizontalActive = true;
        hexContainer.classList.add('is-interactive');
        hexContainer.style.pointerEvents = 'auto';
        const progress = (scrollFromTop - bgScrollStart) / (bgScrollEnd - bgScrollStart);
        const easedBg = easeInOutCubic(Math.max(0, Math.min(1, progress)));

        // Animate background overlay smoothly to solid black (#000000)
        bgOverlay.style.opacity = easedBg;

        cardConfigs.forEach((config) => {
          const card = cards[config.index];
          if (!card) return;

          let targetX = layout.horizPositions[config.index];
          let targetY;

          if (layout.isMobile) {
            targetY = layout.horizYArray[config.index];
          } else {
            if (config.index === activeCardIndex) {
              targetY = layout.standardCenterY + (layout.activeCenterY - layout.standardCenterY) * easedBg;
            } else {
              targetY = layout.standardCenterY;
            }
          }

          card.style.transform = `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) rotate(0deg)`;
          card.style.opacity = 1;
          card.style.pointerEvents = 'auto';
          card.style.width = layout.cardWidth + 'px';

          // Active card elongates as background transitions to solid black
          if (config.index === activeCardIndex) {
            const currentH = layout.cardHeight + (layout.activeHeight - layout.cardHeight) * easedBg;
            card.style.height = currentH + 'px';
            if (easedBg > 0.6) {
              card.classList.add('active-card');
            } else {
              card.classList.remove('active-card');
            }
          } else {
            card.style.height = layout.cardHeight + 'px';
            card.classList.remove('active-card');
          }

          card.classList.add('in-horizontal');

          const cardContent = card.querySelector('.service-stack-content');
          if (cardContent) cardContent.style.opacity = 1;
        });

        // Title turns to crisp white on black background
        centerTitle.style.opacity = 1;
        centerTitle.style.transform = `translate(calc(-50% + ${layout.titleHorizX}px), calc(-50% + ${layout.titleHorizY}px))`;
        centerTitle.classList.add('visible');

        if (easedBg > 0.4) {
          centerTitle.classList.add('dark-mode');
        } else {
          centerTitle.classList.remove('dark-mode');
        }

        // Full-width description panel reveals below elongated cards with upward settle
        const upwardOffset = 25 * (1 - easedBg);
        descPanel.style.opacity = easedBg;
        descPanel.style.transform = `translate(-50%, calc(-50% + ${layout.panelY + upwardOffset}px))`;

        if (easedBg > 0.05) {
          descPanel.classList.add('visible');
        } else {
          descPanel.classList.remove('visible');
        }

        scrollHint.classList.add('hidden');
      }

      // -------------------------------------------------------------
      // STAGE 4: Section with Elongated Cards and Detail Panel (1900 <= scrollFromTop < sectionEndScroll)
      // Solid black background (#000000), active elongated card, detail panel sitting directly on background
      // -------------------------------------------------------------
      else if (scrollFromTop >= bgScrollEnd && scrollFromTop < sectionEndScroll) {
        isHorizontalActive = true;
        hexContainer.classList.add('is-interactive');
        hexContainer.style.pointerEvents = 'auto';
        bgOverlay.style.opacity = 1;

        cardConfigs.forEach((config) => {
          const card = cards[config.index];
          if (!card) return;

          let targetX = layout.horizPositions[config.index];
          let targetY = layout.isMobile ? layout.horizYArray[config.index] : 
                        ((config.index === activeCardIndex) ? layout.activeCenterY : layout.standardCenterY);

          card.style.transform = `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) rotate(0deg)`;
          card.style.opacity = 1;
          card.style.pointerEvents = 'auto';
          card.style.width = layout.cardWidth + 'px';

          if (config.index === activeCardIndex) {
            card.style.height = layout.activeHeight + 'px';
            card.classList.add('active-card');
          } else {
            card.style.height = layout.cardHeight + 'px';
            card.classList.remove('active-card');
          }

          card.classList.add('in-horizontal');

          const cardContent = card.querySelector('.service-stack-content');
          if (cardContent) cardContent.style.opacity = 1;
        });

        centerTitle.style.opacity = 1;
        centerTitle.style.transform = `translate(calc(-50% + ${layout.titleHorizX}px), calc(-50% + ${layout.titleHorizY}px))`;
        centerTitle.classList.add('visible', 'dark-mode');

        descPanel.style.opacity = 1;
        descPanel.style.transform = `translate(-50%, calc(-50% + ${layout.panelY}px))`;
        descPanel.classList.add('visible');

        scrollHint.classList.add('hidden');
      }

      // -------------------------------------------------------------
      // STAGE 5: Scrolling From Elongated Cards & Detail Panel to Footer (scrollFromTop >= sectionEndScroll)
      // Background REMAINS SOLID BLACK WITH WHITE TEXT - DOES NOT CHANGE AGAIN!
      // -------------------------------------------------------------
      else {
        isHorizontalActive = true;
        hexContainer.classList.add('is-interactive');
        hexContainer.style.pointerEvents = 'auto';
        
        // Background remains 100% solid black through the footer!
        bgOverlay.style.opacity = 1;

        cardConfigs.forEach((config) => {
          const card = cards[config.index];
          if (!card) return;

          let targetX = layout.horizPositions[config.index];
          let targetY = layout.isMobile ? layout.horizYArray[config.index] : 
                        ((config.index === activeCardIndex) ? layout.activeCenterY : layout.standardCenterY);

          card.style.transform = `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) rotate(0deg)`;
          card.style.opacity = 1;
          card.style.pointerEvents = 'auto';
          card.style.width = layout.cardWidth + 'px';

          if (config.index === activeCardIndex) {
            card.style.height = layout.activeHeight + 'px';
            card.classList.add('active-card');
          } else {
            card.style.height = layout.cardHeight + 'px';
            card.classList.remove('active-card');
          }

          card.classList.add('in-horizontal');

          const cardContent = card.querySelector('.service-stack-content');
          if (cardContent) cardContent.style.opacity = 1;
        });

        centerTitle.style.opacity = 1;
        centerTitle.style.transform = `translate(calc(-50% + ${layout.titleHorizX}px), calc(-50% + ${layout.titleHorizY}px))`;
        centerTitle.classList.add('visible', 'dark-mode');

        descPanel.style.opacity = 1;
        descPanel.style.transform = `translate(-50%, calc(-50% + ${layout.panelY}px))`;
        descPanel.classList.add('visible');

        scrollHint.classList.add('hidden');
      }
    }

    // Interactive Card Click Handler:
    // "When the user clicks on another service like 'Tyre fitting', the card of that specific service
    // should become longer to show that it is the active card and the description of the service appears below.
    // This should not happen as the user scrolls display of service description should only appear when the user clicks on a certain card."
    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        if (isHorizontalActive) {
          setActiveService(index, true);
        }
      });
    });

    // Handle smooth window resize
    window.addEventListener('resize', () => {
      handleScroll();
    });

    // RequestAnimationFrame scroll loop for optimal 60fps performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initial invocation
    handleScroll();
  }
})();
