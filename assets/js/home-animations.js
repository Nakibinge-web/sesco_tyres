/**
 * Sesco Tyres - Home Page Bidirectional Scroll Animations Controller
 * Reverses animations when the user scrolls back, and re-triggers them
 * smoothly when scrolling into view again.
 */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Select all animation target elements
  const targetSelectors = [
    '.trust-item',
    '.finder',
    '.section-head',
    '.shop-section-head',
    '.shop-showcase-stage',
    '.shop-showcase-footer',
    '.services-head',
    '.services-carousel-wrapper',
    '.quote-section-head',
    '.quote-step-card',
    '.quote-interactive-builder',
    '.appointment-form-wrap',
    '.appointment-image-wrap',
    '.car-service-section',
    '.service-pillar',
    '.testimonials-head',
    '.testimonial-main-card',
    '.testimonials-arc-track',
    '.blog-head',
    '.latest-article-card',
    '.footer-brand',
    '.footer-col',
    '.scroll-zoom-in',
    '.scroll-fade-up'
  ];

  let elements = [];
  let ticking = false;
  let lastScrollY = window.scrollY;

  // Stagger delays setup
  function prepareStaggerElements() {
    const staggerGroups = [
      '.trust-grid .trust-item',
      '.quote-steps-grid .quote-step-card',
      '.car-service-pillars .service-pillar',
      '.latest-blog-grid .latest-article-card',
      '.footer-grid .footer-col'
    ];

    staggerGroups.forEach(selector => {
      const items = document.querySelectorAll(selector);
      items.forEach((item, index) => {
        const delayClass = `stagger-delay-${(index % 5) + 1}`;
        item.classList.add(delayClass);
      });
    });
  }

  // Check and update visibility with bidirectional reversal
  function updateAnimations() {
    if (isReducedMotion) {
      document.body.classList.add('hero-loaded');
      elements.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const heroEl = document.getElementById('hero-section') || document.querySelector('.hero');
    const heroHeight = heroEl ? heroEl.offsetHeight : 500;

    // 1. Hero Section Reversal:
    // When near top (< 70% of hero height), zoom-in is active
    // When user scrolls down past the hero, remove hero-loaded so when scrolling back up it zooms in again!
    if (scrollY < heroHeight * 0.75) {
      document.body.classList.add('hero-loaded');
    } else if (scrollY > heroHeight * 1.1) {
      document.body.classList.remove('hero-loaded');
    }

    // 2. Section Elements Bidirectional Check:
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();

      // Check if element is inside visible viewport buffer
      const inView = rect.top < vh - 45 && rect.bottom > 45;

      if (inView) {
        // Element is visible -> trigger zoom-in / reveal animation
        if (!el.classList.contains('is-revealed')) {
          el.classList.add('is-revealed');
        }
      } else {
        // Element is outside viewport:
        // - rect.top >= vh - 45: below viewport (user scrolled up past it) -> REVERSE!
        // - rect.bottom <= 45: above viewport (user scrolled down past it) -> REVERSE!
        // This ensures full bidirectional animation when scrolling both up and down.
        if (el.classList.contains('is-revealed')) {
          el.classList.remove('is-revealed');
        }
      }
    });

    lastScrollY = scrollY;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateAnimations();
        ticking = false;
      });
      ticking = true;
    }
  }

  function init() {
    prepareStaggerElements();
    elements = Array.from(document.querySelectorAll(targetSelectors.join(', ')));

    // Initial check
    updateAnimations();

    // Listen to scroll and resize
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial hero entrance trigger
    setTimeout(() => {
      if (window.scrollY < 200) {
        document.body.classList.add('hero-loaded');
      }
    }, 60);

    // Also support IntersectionObserver for immediate browser thread updates
    if ('IntersectionObserver' in window && !isReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const el = entry.target;
          const rect = entry.boundingClientRect;
          const vh = window.innerHeight;

          if (entry.isIntersecting) {
            el.classList.add('is-revealed');
          } else {
            // When leaving viewport, reverse!
            if (rect.top >= vh - 45 || rect.bottom <= 45) {
              el.classList.remove('is-revealed');
            }
          }
        });
      }, {
        root: null,
        rootMargin: '10px 0px 10px 0px',
        threshold: [0, 0.12]
      });

      elements.forEach(el => observer.observe(el));
    }
  }

  // DOM ready check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    updateAnimations();
  });

})();
