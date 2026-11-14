/**
 * Sesco Tyres — Customer Feedback Page Controller
 * Handles star rating input, review submission to `treads.testimonials`,
 * category filtering, and rendering live verified customer reviews.
 */
(() => {
  const CANDIDATE_ENDPOINTS = [
    'backend/testimonials.php',
    'http://localhost/sesco_tyres_frontend_redesign/backend/testimonials.php',
    'http://127.0.0.1/sesco_tyres_frontend_redesign/backend/testimonials.php',
  ];

  const RATING_LABELS = {
    1: '1 / 5 — Poor',
    2: '2 / 5 — Fair',
    3: '3 / 5 — Good',
    4: '4 / 5 — Very Good',
    5: '5 / 5 — Excellent',
  };

  let activeFilter = 'all';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildInitialsAvatar(name) {
    const clean = String(name || 'DR').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    const initials = (
      (parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || '')
    ).toUpperCase() || 'ST';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#163687"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Nunito Sans, Arial, sans-serif" font-size="34" font-weight="800">${escapeHtml(initials)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function renderStarsHtml(rating) {
    const score = Math.max(1, Math.min(5, Number(rating) || 5));
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= score
        ? '<i class="fa-solid fa-star" aria-hidden="true"></i>'
        : '<i class="fa-regular fa-star" style="color:#cbd5e1" aria-hidden="true"></i>';
    }
    return html;
  }

  async function requestTestimonials(method, queryOrPayload) {
    let lastError = 'Unable to connect to feedback server.';

    for (const baseUrl of CANDIDATE_ENDPOINTS) {
      const url = method === 'GET' && queryOrPayload ? `${baseUrl}?${queryOrPayload}` : baseUrl;
      const options = method === 'GET'
        ? { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(queryOrPayload),
          };

      try {
        const res = await fetch(url, options);
        const data = await res.json();
        if (res.ok && data && data.success) {
          return data;
        }
        if (data && data.message) {
          lastError = data.message;
          if (res.status >= 400 && res.status < 500) {
            throw new Error(data.message);
          }
        }
      } catch (err) {
        if (err && err.message && err.message === lastError) {
          throw err;
        }
        lastError = err?.message || lastError;
      }
    }

    throw new Error(lastError);
  }

  function updateSummaryStats(stats) {
    if (!stats) return;
    const avgEl = document.getElementById('fbStatAvg');
    const countEl = document.getElementById('fbStatCount');
    const fiveEl = document.getElementById('fbStatFiveStar');

    if (avgEl) avgEl.textContent = Number(stats.average_rating ?? 5.0).toFixed(1);
    if (countEl) countEl.textContent = String(stats.total_reviews ?? 0);
    if (fiveEl) fiveEl.textContent = String(stats.five_star_count ?? 0);
  }

  function renderReviewsList(items) {
    const container = document.getElementById('fbReviewsList');
    if (!container) return;

    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="feedback-empty-msg">No published reviews match this filter yet. Check back soon!</div>';
      return;
    }

    container.innerHTML = items.map((item, idx) => {
      const safeName = escapeHtml(item.reviewer_name);
      const safeVehicle = escapeHtml(item.vehicle || 'Sesco Tyres Driver');
      const safeType = escapeHtml(item.review_type || 'Service');
      const safeSubject = escapeHtml(item.subject_reviewed || 'Tyre Service');
      const safeHeadline = escapeHtml(item.headline);
      const safeBody = escapeHtml(item.review_text);
      const safeSource = escapeHtml(item.source_label || 'Website Feedback');
      const safeTime = escapeHtml(item.relative_time || 'Recently');
      const avatarSrc = item.avatar_url ? escapeHtml(item.avatar_url) : buildInitialsAvatar(item.reviewer_name);
      const verifiedBadge = item.is_verified
        ? '<i class="fa-solid fa-circle-check" title="Verified Customer" aria-hidden="true"></i>'
        : '';
      const aosDelay = Math.min(idx * 60, 240);

      return `
        <article class="review-item-card" data-aos="fade-up" data-aos-delay="${aosDelay}">
          <div class="review-item-top">
            <div class="review-item-author">
              <img class="review-item-avatar" src="${avatarSrc}" alt="${safeName}" loading="lazy">
              <div>
                <div class="review-item-name">${safeName} ${verifiedBadge}</div>
                <div class="review-item-vehicle">${safeVehicle}</div>
              </div>
            </div>
            <div class="review-item-stars" aria-label="Rated ${Number(item.rating) || 5} out of 5">
              ${renderStarsHtml(item.rating)}
            </div>
          </div>
          <div class="review-item-badges">
            <span class="review-badge">${safeSubject}</span>
            <span class="review-badge is-type">${safeType}</span>
          </div>
          <h3 class="review-item-headline">"${safeHeadline}"</h3>
          <p class="review-item-text">${safeBody}</p>
          <div class="review-item-meta">
            <i class="fa-solid fa-certificate" style="color:#0891b2" aria-hidden="true"></i>
            <span>${safeSource} · ${safeTime}</span>
          </div>
        </article>
      `;
    }).join('');

    if (window.AOS) {
      if (typeof window.AOS.refreshHard === 'function') {
        window.AOS.refreshHard();
      } else if (typeof window.AOS.refresh === 'function') {
        window.AOS.refresh();
      }
    }
  }

  async function loadReviews(filterType = 'all') {
    const query = filterType !== 'all'
      ? `limit=25&type=${encodeURIComponent(filterType)}`
      : 'limit=25';

    try {
      const data = await requestTestimonials('GET', query);
      updateSummaryStats(data.stats);
      renderReviewsList(data.testimonials);
    } catch {
      const container = document.getElementById('fbReviewsList');
      if (container) {
        container.innerHTML = '<div class="feedback-empty-msg">Could not load customer reviews right now. Start Apache/MySQL in XAMPP to view live database reviews.</div>';
      }
    }
  }

  function paintStarButtons(score, hoverMode = false) {
    const ratingInput = document.getElementById('fbRatingInput');
    const caption = document.getElementById('fbRatingCaption');
    const buttons = Array.from(document.querySelectorAll('#fbStarButtons .star-rate-btn'));
    if (!ratingInput || buttons.length === 0) return;

    buttons.forEach(btn => {
      const val = Number(btn.dataset.value);
      btn.classList.toggle(hoverMode ? 'is-hover' : 'is-active', val <= score);
      if (!hoverMode) {
        btn.classList.remove('is-hover');
        btn.setAttribute('aria-checked', val === score ? 'true' : 'false');
      }
    });
    if (!hoverMode && caption) {
      caption.textContent = RATING_LABELS[score] || `${score} / 5`;
    }
  }

  function setRatingValue(score) {
    const ratingInput = document.getElementById('fbRatingInput');
    if (!ratingInput) return;
    const clamped = Math.max(1, Math.min(5, Number(score) || 5));
    ratingInput.value = String(clamped);
    paintStarButtons(clamped, false);

    if (window.jQuery && window.jQuery('#feedbackForm').data('validator')) {
      window.jQuery('#feedbackForm').validate().element(ratingInput);
    }
  }

  function initStarPicker() {
    const ratingInput = document.getElementById('fbRatingInput');
    const buttons = Array.from(document.querySelectorAll('#fbStarButtons .star-rate-btn'));
    if (!ratingInput || buttons.length === 0) return;

    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => paintStarButtons(Number(btn.dataset.value), true));
      btn.addEventListener('click', () => setRatingValue(Number(btn.dataset.value)));
    });

    document.getElementById('fbStarButtons')?.addEventListener('mouseleave', () => {
      paintStarButtons(Number(ratingInput.value) || 5, false);
    });
  }

  function initFormControls() {
    // Prefill signed-in user info if available
    const nameInput = document.getElementById('fbName');
    const emailInput = document.getElementById('fbEmail');
    const savedName = localStorage.getItem('sesco-client-name');
    const savedEmail = localStorage.getItem('sesco-client-email');
    if (nameInput && !nameInput.value && savedName) nameInput.value = savedName;
    if (emailInput && !emailInput.value && savedEmail) emailInput.value = savedEmail;

    // Show custom subject box when "Other" is selected
    const subjectSelect = document.getElementById('fbSubjectSelect');
    const customWrap = document.getElementById('fbCustomSubjectWrap');
    const customInput = document.getElementById('fbCustomSubject');

    subjectSelect?.addEventListener('change', () => {
      const isCustom = subjectSelect.value === '__custom__';
      if (customWrap) customWrap.style.display = isCustom ? 'flex' : 'none';
      if (customInput) {
        customInput.required = isCustom;
        if (!isCustom) {
          customInput.value = '';
        } else {
          customInput.focus();
        }
      }
      if (window.jQuery && window.jQuery('#feedbackForm').data('validator')) {
        const validator = window.jQuery('#feedbackForm').validate();
        validator.element(subjectSelect);
        if (customInput) validator.element(customInput);
      }
    });

    // Character counter on detailed review
    const textInput = document.getElementById('fbReviewText');
    const charCount = document.getElementById('fbCharCount');
    textInput?.addEventListener('input', () => {
      if (charCount) charCount.textContent = `${textInput.value.length} / 800`;
    });

    // Filter pills
    document.getElementById('fbFilterBar')?.addEventListener('click', e => {
      const btn = e.target.closest('.feedback-filter-btn');
      if (!btn) return;
      document.querySelectorAll('#fbFilterBar .feedback-filter-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeFilter = btn.dataset.filter || 'all';
      loadReviews(activeFilter);
    });
  }

  function showFormStatus(type, htmlMessage) {
    const banner = document.getElementById('fbFormMessage');
    if (!banner) return;
    banner.className = `feedback-status-banner ${type === 'success' ? 'is-success' : 'is-error'}`;
    banner.innerHTML = htmlMessage;
  }

  function resetFeedbackFields(form) {
    const subjectSelect = document.getElementById('fbSubjectSelect');
    const customWrap = document.getElementById('fbCustomSubjectWrap');
    const customInput = document.getElementById('fbCustomSubject');
    const headlineEl = document.getElementById('fbHeadline');
    const reviewEl = document.getElementById('fbReviewText');
    const charCount = document.getElementById('fbCharCount');

    if (subjectSelect) subjectSelect.value = '';
    if (customWrap) customWrap.style.display = 'none';
    if (customInput) {
      customInput.required = false;
      customInput.value = '';
    }
    if (headlineEl) headlineEl.value = '';
    if (reviewEl) reviewEl.value = '';
    if (charCount) charCount.textContent = '0 / 800';
    setRatingValue(5);

    if (window.jQuery) {
      const $form = window.jQuery(form);
      const validator = $form.data('validator');
      if (validator) {
        validator.resetForm();
      }
      $form.find('.is-invalid, .error, .is-valid, .valid').removeClass('is-invalid error is-valid valid');
    }
  }

  async function submitFeedbackForm(form) {
    const submitBtn = document.getElementById('fbSubmitBtn');
    const name = document.getElementById('fbName')?.value.trim() || '';
    const email = document.getElementById('fbEmail')?.value.trim() || '';
    const vehicle = document.getElementById('fbVehicle')?.value.trim() || '';
    const reviewType = form.querySelector('input[name="review_type"]:checked')?.value || 'Service';
    const selectedSubject = document.getElementById('fbSubjectSelect')?.value || '';
    const customSubject = document.getElementById('fbCustomSubject')?.value.trim() || '';
    const subjectReviewed = selectedSubject === '__custom__' ? customSubject : selectedSubject;
    const rating = Number(document.getElementById('fbRatingInput')?.value || 5);
    const headline = document.getElementById('fbHeadline')?.value.trim() || '';
    const reviewText = document.getElementById('fbReviewText')?.value.trim() || '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Submitting Review...</span>';
    }

    const payload = {
      client_id: localStorage.getItem('sesco-client-id') || null,
      reviewer_name: name,
      reviewer_email: email || null,
      vehicle,
      review_type: reviewType,
      subject_reviewed: subjectReviewed,
      rating,
      headline,
      review_text: reviewText,
    };

    try {
      const resData = await requestTestimonials('POST', payload);
      updateSummaryStats(resData.stats);

      const submittedName = resData.testimonial?.reviewer_name || name;
      const successMessage = `Thank you ${submittedName}. Your feedback has been submitted and is being reviewed by our team`;

      showFormStatus(
        'success',
        `<i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${escapeHtml(successMessage)}`
      );

      resetFeedbackFields(form);
      await loadReviews(activeFilter);
    } catch (err) {
      showFormStatus(
        'error',
        `<i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(err?.message || 'Unable to submit review right now.')}`
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Submit Review</span> <span>→</span>';
      }
    }
  }

  function initFormSubmission() {
    const form = document.getElementById('feedbackForm');
    if (!form) return;

    if (window.jQuery && typeof window.jQuery.fn.validate === 'function') {
      const $ = window.jQuery;
      const $form = $(form);

      $form.validate({
        errorElement: 'span',
        errorClass: 'feedback-field-error',
        validClass: 'is-valid',
        ignore: [],
        rules: {
          reviewer_name: {
            required: true,
            minlength: 2,
            maxlength: 100,
            normalizer: function (val) { return $.trim(val); },
          },
          reviewer_email: {
            required: false,
            email: true,
            maxlength: 100,
            normalizer: function (val) { return $.trim(val); },
          },
          vehicle: {
            required: true,
            minlength: 2,
            maxlength: 120,
            normalizer: function (val) { return $.trim(val); },
          },
          review_type: {
            required: true,
          },
          subject_select: {
            required: true,
          },
          custom_subject: {
            required: {
              depends: function () {
                return $('#fbSubjectSelect').val() === '__custom__';
              },
            },
            minlength: 2,
            maxlength: 120,
            normalizer: function (val) { return $.trim(val); },
          },
          rating: {
            required: true,
            range: [1, 5],
          },
          headline: {
            required: true,
            minlength: 3,
            maxlength: 160,
            normalizer: function (val) { return $.trim(val); },
          },
          review_text: {
            required: true,
            minlength: 10,
            maxlength: 800,
            normalizer: function (val) { return $.trim(val); },
          },
        },
        messages: {
          reviewer_name: {
            required: 'Please enter your full name.',
            minlength: 'Full name must be at least 2 characters.',
            maxlength: 'Full name cannot exceed 100 characters.',
          },
          reviewer_email: {
            email: 'Please enter a valid email address.',
            maxlength: 'Email address cannot exceed 100 characters.',
          },
          vehicle: {
            required: 'Please enter your vehicle model and location.',
            minlength: 'Vehicle details must be at least 2 characters.',
            maxlength: 'Vehicle details cannot exceed 120 characters.',
          },
          review_type: {
            required: 'Please choose what you are reviewing.',
          },
          subject_select: {
            required: 'Please select the service or product you are reviewing.',
          },
          custom_subject: {
            required: 'Please specify the service or product you are reviewing.',
            minlength: 'Please enter at least 2 characters.',
            maxlength: 'Subject cannot exceed 120 characters.',
          },
          rating: {
            required: 'Please select an overall star rating.',
            range: 'Please select a rating between 1 and 5 stars.',
          },
          headline: {
            required: 'Please enter a short review headline.',
            minlength: 'Headline must be at least 3 characters.',
            maxlength: 'Headline cannot exceed 160 characters.',
          },
          review_text: {
            required: 'Please write your detailed review.',
            minlength: 'Please write at least 10 characters in your detailed review.',
            maxlength: 'Review cannot exceed 800 characters.',
          },
        },
        highlight: function (element, _errorClass, validClass) {
          const $el = $(element);
          $el.addClass('is-invalid error').removeClass(validClass);
          if (element.id === 'fbRatingInput') {
            $el.closest('.star-rating-row').addClass('is-invalid');
          }
        },
        unhighlight: function (element, _errorClass, validClass) {
          const $el = $(element);
          $el.removeClass('is-invalid error');
          if (element.id === 'fbRatingInput') {
            $el.closest('.star-rating-row').removeClass('is-invalid');
          }
          if ($.trim($el.val()) !== '') {
            $el.addClass(validClass);
          } else {
            $el.removeClass(validClass);
          }
        },
        errorPlacement: function (error, element) {
          error.addClass('feedback-field-error');
          const $field = $(element).closest('.field');
          if ($field.length) {
            $field.append(error);
          } else {
            error.insertAfter(element);
          }
        },
        invalidHandler: function () {
          const banner = document.getElementById('fbFormMessage');
          if (banner) {
            banner.className = 'feedback-status-banner';
            banner.innerHTML = '';
          }
        },
        submitHandler: function (submittedForm, event) {
          if (event) event.preventDefault();
          submitFeedbackForm(submittedForm);
          return false;
        },
      });
      return;
    }

    // Fallback when jQuery / jQuery Validation CDN is unreachable offline
    form.addEventListener('submit', e => {
      e.preventDefault();
      submitFeedbackForm(form);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initStarPicker();
    initFormControls();
    initFormSubmission();
    loadReviews('all');
  });
})();

