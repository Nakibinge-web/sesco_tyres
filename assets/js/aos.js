/* ==========================================================================
   AOS (Animate On Scroll) Engine
   ========================================================================== */
(function (global) {
  var AOS = {
    options: {
      duration: 800,
      delay: 0,
      offset: 80,
      once: false,
      easing: 'ease-out-cubic'
    },
    elements: [],
    observer: null,

    init: function (opts) {
      if (opts) {
        for (var k in opts) {
          if (opts.hasOwnProperty(k)) this.options[k] = opts[k];
        }
      }
      var self = this;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          self.refresh();
        });
      } else {
        self.refresh();
      }
      this.bindEvents();
    },

    refresh: function () {
      var self = this;
      this.elements = Array.prototype.slice.call(document.querySelectorAll('[data-aos]'));
      if (!this.elements.length) return;

      if ('IntersectionObserver' in window) {
        if (this.observer) this.observer.disconnect();

        this.observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var el = entry.target;
            var isOnce = el.getAttribute('data-aos-once') === 'true' || self.options.once;

            if (entry.isIntersecting) {
              el.classList.add('aos-animate');
              if (isOnce) {
                self.observer.unobserve(el);
              }
            } else if (!isOnce) {
              el.classList.remove('aos-animate');
            }
          });
        }, {
          rootMargin: '0px 0px -' + (this.options.offset || 60) + 'px 0px',
          threshold: [0, 0.1, 0.2]
        });

        this.elements.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          // If already in viewport on load, immediately animate
          if (rect.top < window.innerHeight - 40 && rect.bottom > 0) {
            el.classList.add('aos-animate');
          }
          self.observer.observe(el);
        });
      } else {
        this.elements.forEach(function (el) {
          el.classList.add('aos-animate');
        });
      }
    },

    bindEvents: function () {
      var self = this;
      window.addEventListener('resize', function () {
        self.refresh();
      });
      window.addEventListener('orientationchange', function () {
        self.refresh();
      });
    }
  };

  if (!global.AOS) {
    global.AOS = AOS;
  }
})(typeof window !== 'undefined' ? window : this);

