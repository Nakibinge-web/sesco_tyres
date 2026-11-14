/* ========================================
   CONTACT PAGE ADVANCED JAVASCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  
  // === FADE-IN SCROLL ANIMATIONS (REVERSIBLE) ===
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.classList.remove('is-hidden');
      } else {
        // Reverse animation when scrolling back
        entry.target.classList.remove('is-visible');
        entry.target.classList.add('is-hidden');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.fade-in-section').forEach(el => {
    fadeInObserver.observe(el);
  });
  
  // === STAGGERED ANIMATION FOR CONTACT ITEMS (REVERSIBLE) ===
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.classList.remove('is-hidden');
      } else {
        // Reverse animation when scrolling back
        entry.target.classList.remove('is-visible');
        entry.target.classList.add('is-hidden');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.stagger-item').forEach(el => {
    staggerObserver.observe(el);
  });
  
  // === RIPPLE EFFECT ON BUTTON CLICKS ===
  document.querySelectorAll('.ripple-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // === INQUIRY FORM VALIDATION, PROGRESS & SUBMISSION ===
  function isContactFieldFilledValid(input) {
    const val = String(input.value || '').trim();
    if (!val) return false;
    if (input.classList.contains('is-invalid') || input.classList.contains('error')) return false;
    if (input.name === 'name') return val.length >= 2 && val.length <= 100;
    if (input.name === 'phone') {
      return typeof window.isValidSescoContactNumber === 'function'
        ? window.isValidSescoContactNumber(val)
        : /^[+]?[0-9]{7,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
    }
    if (input.name === 'vehicle') return val.length >= 2 && val.length <= 120;
    if (input.name === 'message') return val.length >= 10 && val.length <= 500;
    return input.checkValidity();
  }

  function pulseFieldValid(el) {
    if (!el || typeof el.animate !== 'function') return;
    el.animate([
      { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
      { boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)' }
    ], {
      duration: 500,
      easing: 'ease-out'
    });
  }

  function focusFirstInvalidElement(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof el.animate === 'function') {
      el.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ], {
        duration: 500,
        easing: 'ease-in-out'
      });
    }
    el.focus();
  }

  function resetInquiryFormState(targetForm, updateProgressFn, charCounterEl) {
    targetForm.reset();
    if (window.jQuery) {
      const $targetForm = window.jQuery(targetForm);
      const validator = $targetForm.data('validator');
      if (validator) {
        validator.resetForm();
      }
      $targetForm
        .find('.is-invalid, .error, .is-valid, .valid, .field-error')
        .removeClass('is-invalid error is-valid valid field-error');
    }
    targetForm.querySelectorAll('.field').forEach(fieldEl => {
      fieldEl.classList.remove('field-has-content', 'field-focused');
    });
    targetForm.querySelectorAll('input, select, textarea').forEach(ctrl => {
      ctrl.style.borderColor = '';
    });
    const formMessage = targetForm.querySelector('.form-message');
    if (formMessage) {
      formMessage.style.display = 'none';
      formMessage.textContent = '';
    }
    if (charCounterEl) {
      charCounterEl.textContent = '0 / 500 characters';
      charCounterEl.style.opacity = '0';
      charCounterEl.style.color = '#687789';
    }
    if (typeof updateProgressFn === 'function') {
      updateProgressFn();
    }
  }

  function submitInquiryForm(targetForm, updateProgressFn, charCounterEl) {
    const submitBtn = targetForm.querySelector('.btn-primary');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');
    const formGrid = targetForm.querySelector('.form-grid');
    const formMessage = targetForm.querySelector('.form-message');
    const successAnimation = targetForm.querySelector('.form-success-animation');
    if (!submitBtn || submitBtn.disabled) return;

    if (formMessage) {
      formMessage.style.display = 'none';
      formMessage.textContent = '';
    }

    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-flex';

    setTimeout(() => {
      if (btnLoader) btnLoader.style.display = 'none';
      if (formGrid) formGrid.style.display = 'none';
      submitBtn.style.display = 'none';
      if (successAnimation) successAnimation.style.display = 'block';

      setTimeout(() => {
        resetInquiryFormState(targetForm, updateProgressFn, charCounterEl);
        if (successAnimation) successAnimation.style.display = 'none';
        if (formGrid) formGrid.style.display = 'grid';
        submitBtn.style.display = 'inline-flex';
        if (btnText) btnText.style.display = 'inline';
        submitBtn.disabled = false;
      }, 3000);
    }, 2000);
  }

  function initInquiryForm() {
    const form = document.getElementById('contactInquiryForm') || document.querySelector('[data-demo-form]');
    if (!form) return;

    form.dataset.advancedHandled = 'true';

    // Character counter on inquiry message
    let charCounterEl = null;
    const textarea = form.querySelector('textarea[name="message"]');
    if (textarea) {
      charCounterEl = document.createElement('div');
      charCounterEl.className = 'char-counter';
      charCounterEl.style.cssText = `
        font-family: 'Nunito Sans', ui-sans-serif, sans-serif;
        text-align: right;
        font-size: 11px;
        color: #687789;
        margin-top: 5px;
        font-weight: 600;
        opacity: 0;
        transition: opacity 0.3s ease, color 0.3s ease;
      `;
      textarea.setAttribute('maxlength', '500');
      textarea.parentElement.appendChild(charCounterEl);

      textarea.addEventListener('input', function() {
        const length = this.value.length;
        const maxLength = 500;
        charCounterEl.textContent = `${length} / ${maxLength} characters`;
        charCounterEl.style.opacity = length > 0 ? '1' : '0';
        if (length > maxLength * 0.9) {
          charCounterEl.style.color = '#dc2626';
        } else if (length > maxLength * 0.7) {
          charCounterEl.style.color = '#d97706';
        } else {
          charCounterEl.style.color = '#10b981';
        }
      });
    }

    // Form progress indicator bar
    const formInputs = form.querySelectorAll('input, select, textarea');
    const progressBar = document.createElement('div');
    progressBar.className = 'form-scroll-progress';
    progressBar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #38bdf8, #0891b2, #163687);
      width: 0%;
      transition: width 0.3s ease;
      z-index: 10;
      border-radius: 0;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
    `;
    form.style.position = 'relative';
    form.insertBefore(progressBar, form.firstChild);

    const updateFormProgress = () => {
      const totalFields = formInputs.length || 1;
      const filledFields = Array.from(formInputs).filter(isContactFieldFilledValid).length;
      const progress = (filledFields / totalFields) * 100;
      progressBar.style.width = progress + '%';

      if (progress === 100) {
        progressBar.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
        progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      } else {
        progressBar.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.5)';
        progressBar.style.background = 'linear-gradient(90deg, #38bdf8, #0891b2, #163687)';
      }
    };

    formInputs.forEach(input => {
      input.addEventListener('input', function() {
        this.parentElement.classList.toggle('field-has-content', this.value.length > 0);
        updateFormProgress();
      });
      input.addEventListener('change', updateFormProgress);
      input.addEventListener('blur', function() {
        updateFormProgress();
        if (window.jQuery && window.jQuery(form).data('validator')) return;
        if (this.value && this.checkValidity()) {
          this.style.borderColor = '#10b981';
          pulseFieldValid(this);
        }
      });
    });

    // Attach jQuery Validation when jQuery + plugin are available
    if (window.jQuery && typeof window.jQuery.fn.validate === 'function') {
      const $ = window.jQuery;
      const $form = $(form);
      if (typeof window.registerSescoContactMethod === 'function') {
        window.registerSescoContactMethod($);
      }
      const trimNormalizer = function(val) { return $.trim(val); };
      const phoneRules = {
        required: false,
        normalizer: trimNormalizer
      };
      if ($.validator && $.validator.methods && $.validator.methods.sescoContact) {
        phoneRules.sescoContact = true;
      }

      $form.validate({
        errorElement: 'span',
        errorClass: 'contact-field-error',
        validClass: 'is-valid',
        ignore: [],
        rules: {
          name: {
            required: true,
            minlength: 2,
            maxlength: 100,
            normalizer: trimNormalizer
          },
          email: {
            required: true,
            email: true,
            maxlength: 120,
            normalizer: trimNormalizer
          },
          phone: phoneRules,
          subject: {
            required: true
          },
          vehicle: {
            required: false,
            minlength: 2,
            maxlength: 120,
            normalizer: trimNormalizer
          },
          message: {
            required: true,
            minlength: 10,
            maxlength: 500,
            normalizer: trimNormalizer
          }
        },
        messages: {
          name: {
            required: 'Please enter your full name.',
            minlength: 'Name must be at least 2 characters.',
            maxlength: 'Name cannot exceed 100 characters.'
          },
          email: {
            required: 'Please enter your email address.',
            email: 'Please enter a valid email address.',
            maxlength: 'Email address cannot exceed 120 characters.'
          },
          phone: {
            sescoContact: 'Please enter a valid phone number (at least 7 digits).'
          },
          subject: {
            required: 'Please select what we can help you with.'
          },
          vehicle: {
            minlength: 'Vehicle or tyre size must be at least 2 characters.',
            maxlength: 'Vehicle or tyre size cannot exceed 120 characters.'
          },
          message: {
            required: 'Please enter your message.',
            minlength: 'Please write at least 10 characters in your message.',
            maxlength: 'Message cannot exceed 500 characters.'
          }
        },
        highlight: function(element, _errorClass, validClass) {
          element.style.borderColor = '';
          $(element).addClass('is-invalid error').removeClass(validClass);
          updateFormProgress();
        },
        unhighlight: function(element, _errorClass, validClass) {
          const $el = $(element);
          const wasValid = $el.hasClass(validClass);
          element.style.borderColor = '';
          $el.removeClass('is-invalid error field-error');
          if ($.trim($el.val()) !== '') {
            $el.addClass(validClass);
            if (!wasValid) pulseFieldValid(element);
          } else {
            $el.removeClass(validClass);
          }
          updateFormProgress();
        },
        errorPlacement: function(error, element) {
          error.addClass('contact-field-error');
          error.insertAfter(element);
        },
        invalidHandler: function(_event, validator) {
          const formMessage = form.querySelector('.form-message');
          if (formMessage) {
            formMessage.style.display = 'none';
            formMessage.textContent = '';
          }
          if (validator.errorList && validator.errorList.length > 0) {
            focusFirstInvalidElement(validator.errorList[0].element);
          }
        },
        submitHandler: function(submittedForm, event) {
          if (event) event.preventDefault();
          submitInquiryForm(submittedForm, updateFormProgress, charCounterEl);
          return false;
        }
      });

      $form.find('select').on('change', function() {
        if ($form.data('validator')) {
          $(this).valid();
        }
      });
      return;
    }

    // Fallback when jQuery / jQuery Validation CDN is unreachable offline
    form.addEventListener('invalid', function(e) {
      e.preventDefault();
      focusFirstInvalidElement(form.querySelector(':invalid'));
    }, true);

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        focusFirstInvalidElement(form.querySelector(':invalid'));
        return;
      }
      submitInquiryForm(form, updateFormProgress, charCounterEl);
    });
  }

  initInquiryForm();
  
  // === CUSTOM TOOLTIPS ===
  const tooltip = document.getElementById('custom-tooltip');
  
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', function(e) {
      const tooltipText = this.getAttribute('data-tooltip');
      tooltip.textContent = tooltipText;
      tooltip.classList.add('show');
      positionTooltip(e);
    });
    
    el.addEventListener('mousemove', positionTooltip);
    
    el.addEventListener('mouseleave', function() {
      tooltip.classList.remove('show');
    });
  });
  
  function positionTooltip(e) {
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    let left = e.pageX - (tooltipWidth / 2);
    let top = e.pageY - tooltipHeight - 15;
    
    // Keep tooltip within viewport
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  
  // === PARALLAX EFFECT ON MAP SECTION ===
  const mapSection = document.querySelector('.parallax-section');
  if (mapSection) {
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      const sectionTop = mapSection.offsetTop;
      const sectionHeight = mapSection.offsetHeight;
      
      if (scrolled > sectionTop - window.innerHeight && scrolled < sectionTop + sectionHeight) {
        const parallax = (scrolled - (sectionTop - window.innerHeight)) * 0.1;
        mapSection.style.transform = `translateY(${parallax}px)`;
      }
    });
  }
  
  // === ANIMATE OPENING HOURS REVEAL (REVERSIBLE) ===
  const hoursTimeline = document.querySelector('.hours-timeline');
  if (hoursTimeline) {
    const hoursObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-hours');
          entry.target.classList.remove('animate-hours-reverse');
        } else {
          // Reverse animation when scrolling back
          entry.target.classList.remove('animate-hours');
          entry.target.classList.add('animate-hours-reverse');
        }
      });
    }, { threshold: 0.3 });
    
    hoursObserver.observe(hoursTimeline);
  }
  
  // === NEUMORPHIC INPUT FOCUS EFFECTS ===
  const inputs = document.querySelectorAll('.form-panel input, .form-panel select, .form-panel textarea');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('field-focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('field-focused');
    });
  });
  
  // === PROGRESS RING ANIMATION ON HOVER ===
  document.querySelectorAll('.contact-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
      const ring = this.querySelector('.progress-ring-circle');
      if (ring) {
        ring.style.strokeDashoffset = '0';
        ring.style.stroke = '#0891b2';
      }
    });
    
    item.addEventListener('mouseleave', function() {
      const ring = this.querySelector('.progress-ring-circle');
      if (ring) {
        ring.style.strokeDashoffset = '138';
      }
    });
  });
  
  // === ICON BOUNCE ON HOVER ===
  document.querySelectorAll('.contact-symbol').forEach(symbol => {
    symbol.addEventListener('mouseenter', function() {
      const icon = this.querySelector('i');
      if (icon) {
        icon.style.animation = 'bounce 0.6s ease';
      }
    });
    
    symbol.addEventListener('mouseleave', function() {
      const icon = this.querySelector('i');
      if (icon) {
        icon.style.animation = '';
      }
    });
  });
  
  // Add bounce animation to CSS dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-5px); }
      50% { transform: translateY(0); }
      75% { transform: translateY(-3px); }
    }
  `;
  document.head.appendChild(style);
  
  // === SPLIT BACKGROUND COLOR EFFECT (REVERSIBLE) ===
  const contactGrid = document.querySelector('.contact-grid');
  if (contactGrid) {
    const gridObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        } else {
          // Reverse animation when scrolling back
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
        }
      });
    }, { threshold: 0.1 });
    
    gridObserver.observe(contactGrid);
  }
  
  console.log('✨ Contact page advanced features loaded successfully!');
  
  // === MAGNETIC BUTTON EFFECT ===
  const magneticButtons = document.querySelectorAll('.btn-primary');
  magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Create subtle magnetic pull
      const distance = Math.sqrt(x*x + y*y);
      const maxDistance = 50;
      
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        const moveX = x * strength * 0.3;
        const moveY = y * strength * 0.3;
        
        btn.style.transform = `translate(${moveX}px, ${moveY}px) translateY(-2px)`;
      }
    });
    
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = '';
    });
  });
  
  // === GRADIENT CURSOR FOLLOWER FOR CONTACT ITEMS ===
  const contactItems = document.querySelectorAll('.contact-item');
  contactItems.forEach(item => {
    item.addEventListener('mousemove', function(e) {
      const rect = item.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      item.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7))`;
    });
    
    item.addEventListener('mouseleave', function() {
      item.style.background = '';
    });
  });
  
  // === PARALLAX EFFECT ON CONTACT ITEMS ===
  window.addEventListener('mousemove', function(e) {
    const contactSymbols = document.querySelectorAll('.contact-symbol');
    const moveX = (e.clientX / window.innerWidth - 0.5) * 20;
    const moveY = (e.clientY / window.innerHeight - 0.5) * 20;
    
    contactSymbols.forEach((symbol, index) => {
      const depth = (index + 1) * 0.1;
      symbol.style.transform = `translate(${moveX * depth}px, ${moveY * depth}px)`;
    });
  });
  
  // === INTERSECTION OBSERVER FOR SECTION ANIMATIONS (REVERSIBLE) ===
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.style.filter = 'blur(0)';
      } else {
        // Reverse animation when scrolling back
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateY(40px)';
        entry.target.style.filter = 'blur(5px)';
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.map-section, .contact-page-main').forEach(section => {
    sectionObserver.observe(section);
  });
  
  // === SCROLL DIRECTION TRACKING ===
  let lastScrollTop = 0;
  let scrollDirection = 'down';
  
  window.addEventListener('scroll', function() {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    
    if (st > lastScrollTop) {
      scrollDirection = 'down';
    } else if (st < lastScrollTop) {
      scrollDirection = 'up';
    }
    
    lastScrollTop = st <= 0 ? 0 : st;
    
    // Store scroll direction as data attribute for CSS access
    document.body.setAttribute('data-scroll-direction', scrollDirection);
  }, false);
  
  // === FAQ ACCORDION FUNCTIONALITY ===
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', function() {
      const isActive = item.classList.contains('active');
      
      // Close all other FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherButton = otherItem.querySelector('.faq-question');
          otherButton.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
        question.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        
        // Smooth scroll to question if it's out of view
        setTimeout(() => {
          const rect = item.getBoundingClientRect();
          const offset = 100; // Offset from top
          
          if (rect.top < offset) {
            window.scrollTo({
              top: window.pageYOffset + rect.top - offset,
              behavior: 'smooth'
            });
          }
        }, 300);
      }
    });
    
    // Keyboard accessibility
    question.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });
  
  console.log('✨ Reversible scroll animations enabled!');
  console.log('❓ FAQ accordion initialized with', faqItems.length, 'questions');
  
  // === LOADING SKELETON ANIMATION (for future use) ===
  const addLoadingSkeleton = (element) => {
    element.classList.add('skeleton-loading');
    element.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
    element.style.backgroundSize = '200% 100%';
    element.style.animation = 'skeleton-loading 1.5s ease-in-out infinite';
  };
  
  // Add skeleton animation keyframes
  const skeletonStyle = document.createElement('style');
  skeletonStyle.textContent = `
    @keyframes skeleton-loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
    
    .field-has-content label {
      color: #000000;
      font-weight: 600;
    }
  `;
  document.head.appendChild(skeletonStyle);
});
