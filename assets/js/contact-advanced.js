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
  
  // === FORM SUBMISSION WITH LOADING & SUCCESS ANIMATION ===
  const form = document.querySelector('[data-demo-form]');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const submitBtn = form.querySelector('.btn-primary');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoader = submitBtn.querySelector('.btn-loader');
      const formMessage = form.querySelector('.form-message');
      const successAnimation = form.querySelector('.form-success-animation');
      
      // Show loading state
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
      
      // Simulate form submission
      setTimeout(() => {
        // Hide loading
        btnLoader.style.display = 'none';
        
        // Hide form fields
        form.querySelector('.form-grid').style.display = 'none';
        submitBtn.style.display = 'none';
        
        // Show success animation
        successAnimation.style.display = 'block';
        
        // Reset form after 3 seconds
        setTimeout(() => {
          form.reset();
          successAnimation.style.display = 'none';
          form.querySelector('.form-grid').style.display = 'grid';
          submitBtn.style.display = 'inline-flex';
          btnText.style.display = 'inline';
          submitBtn.disabled = false;
        }, 3000);
      }, 2000);
    });
  }
  
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
  
  // === FORM FIELD VALIDATION ANIMATION ===
  const formInputs = document.querySelectorAll('.form-panel input, .form-panel select, .form-panel textarea');
  formInputs.forEach(input => {
    // Add success checkmark on valid input
    input.addEventListener('blur', function() {
      if (this.value && this.checkValidity()) {
        this.style.borderColor = '#10b981';
        
        // Add success pulse
        this.animate([
          { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
          { boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)' }
        ], {
          duration: 500,
          easing: 'ease-out'
        });
      }
    });
    
    // Real-time typing feedback
    input.addEventListener('input', function() {
      if (this.value.length > 0) {
        this.parentElement.classList.add('field-has-content');
      } else {
        this.parentElement.classList.remove('field-has-content');
      }
    });
  });
  
  // === SCROLL PROGRESS INDICATOR FOR FORM ===
  const formPanel = document.querySelector('.form-panel');
  if (formPanel) {
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
      border-radius: 0 3px 3px 0;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
    `;
    formPanel.style.position = 'relative';
    formPanel.insertBefore(progressBar, formPanel.firstChild);
    
    // Update progress based on filled fields
    const updateFormProgress = () => {
      const totalFields = formInputs.length;
      const filledFields = Array.from(formInputs).filter(input => 
        input.value && input.checkValidity()
      ).length;
      
      const progress = (filledFields / totalFields) * 100;
      progressBar.style.width = progress + '%';
      
      // Add glow when complete
      if (progress === 100) {
        progressBar.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
        progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      } else {
        progressBar.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.5)';
        progressBar.style.background = 'linear-gradient(90deg, #38bdf8, #0891b2, #163687)';
      }
    };
    
    formInputs.forEach(input => {
      input.addEventListener('input', updateFormProgress);
      input.addEventListener('blur', updateFormProgress);
    });
  }
  
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
  
  // === ANIMATED COUNTER FOR FORM CHARACTERS ===
  const textarea = document.querySelector('textarea[name="message"]');
  if (textarea) {
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.style.cssText = `
      text-align: right;
      font-size: 11px;
      color: #687789;
      margin-top: 5px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.3s ease, color 0.3s ease;
    `;
    textarea.parentElement.appendChild(counter);
    
    textarea.addEventListener('input', function() {
      const length = this.value.length;
      const maxLength = 500;
      counter.textContent = `${length} / ${maxLength} characters`;
      counter.style.opacity = length > 0 ? '1' : '0';
      
      // Change color as approaching limit
      if (length > maxLength * 0.9) {
        counter.style.color = '#ef4444';
      } else if (length > maxLength * 0.7) {
        counter.style.color = '#f59e0b';
      } else {
        counter.style.color = '#10b981';
      }
    });
    
    textarea.setAttribute('maxlength', '500');
  }
  
  // === SMOOTH SCROLL TO FORM ON ERROR ===
  if (form) {
    const originalSubmitHandler = form.onsubmit;
    form.addEventListener('invalid', function(e) {
      e.preventDefault();
      
      // Find first invalid field
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add shake animation
        firstInvalid.animate([
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
        
        firstInvalid.focus();
      }
    }, true);
  }
  
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
      color: #0891b2;
      font-weight: 600;
    }
  `;
  document.head.appendChild(skeletonStyle);
});
