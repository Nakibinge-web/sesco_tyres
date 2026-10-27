/* ========================================
   CONTACT PAGE ADVANCED JAVASCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  
  // === FADE-IN SCROLL ANIMATIONS ===
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.fade-in-section').forEach(el => {
    fadeInObserver.observe(el);
  });
  
  // === STAGGERED ANIMATION FOR CONTACT ITEMS ===
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
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
  
  // === ANIMATE OPENING HOURS REVEAL ===
  const hoursTimeline = document.querySelector('.hours-timeline');
  if (hoursTimeline) {
    const hoursObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-hours');
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
  
  // === SPLIT BACKGROUND COLOR EFFECT ===
  const contactGrid = document.querySelector('.contact-grid');
  if (contactGrid) {
    const gridObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    
    gridObserver.observe(contactGrid);
  }
  
  console.log('✨ Contact page advanced features loaded successfully!');
});
