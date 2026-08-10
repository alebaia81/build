/* ========================================================
   CONSTRUX — Interactions & Animations
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initScrollReveal();
  initCounterAnimation();
  initTimeline();
  addRevealClasses();
});

/* ── HAMBURGER MENU ── */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const navLinks = mobileNav.querySelectorAll('a');

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('active');
    mobileNav.classList.toggle('open', isOpen);
    mobileNav.setAttribute('aria-hidden', !isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });
}

/* ── SCROLL REVEAL ── */
function addRevealClasses() {
  const revealSections = [
    '.stats__grid',
    '.services__grid',
    '.projects__header',
    '.projects__grid',
    '.cta__inner',
    '.footer__inner',
  ];

  revealSections.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) el.classList.add('reveal');
  });

  const staggerGrids = ['.stats__grid', '.services__grid', '.projects__grid'];
  staggerGrids.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) el.classList.add('reveal-stagger');
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  // Observe on a slight delay to let addRevealClasses run
  setTimeout(() => {
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
      observer.observe(el);
    });
  }, 100);
}

/* ── COUNTER ANIMATION ── */
function initCounterAnimation() {
  const counters = document.querySelectorAll('.stat-card__number');
  let hasAnimated = false;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          counters.forEach(counter => animateCounter(counter));
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  const statsSection = document.getElementById('stats');
  if (statsSection) observer.observe(statsSection);
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const isDecimal = target % 1 !== 0;
  const duration = 2000;
  const startTime = performance.now();

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const current = target * easedProgress;

    if (isDecimal) {
      el.textContent = current.toFixed(1);
    } else {
      el.textContent = Math.floor(current);
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = isDecimal ? target.toFixed(1) : target;
    }
  }

  requestAnimationFrame(update);
}

/* ── TIMELINE SLIDER ── */
function initTimeline() {
  const slides = document.querySelectorAll('.timeline__slide');
  const steps = document.querySelectorAll('.timeline__step');
  const tracks = document.querySelectorAll('.timeline__track');

  if (!slides.length) return;

  let currentIndex = 0;
  let autoplayTimer = null;
  const DEFAULT_IMAGE_DELAY = 4500; // 4.5 seconds per slide

  function goToSlide(index) {
    // Clear any active autoplay timer
    if (autoplayTimer) clearTimeout(autoplayTimer);

    // Remove active state from all slides & pause videos
    slides.forEach(s => {
      s.classList.remove('active');
      const vid = s.querySelector('video');
      if (vid) {
        vid.pause();
        vid.onended = null;
        vid.ontimeupdate = null;
      }
    });

    steps.forEach(s => {
      s.classList.remove('active');
      s.classList.remove('completed');
    });

    // Mark completed steps
    for (let i = 0; i < index; i++) {
      steps[i].classList.add('completed');
    }

    // Set active slide
    slides[index].classList.add('active');
    steps[index].classList.add('active');
    currentIndex = index;

    // Update track fills
    updateTrackFills(index);

    // Dynamic duration depending on whether slide has video or image
    const activeVideo = slides[index].querySelector('video');
    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.play().catch(() => {});

      // Early transition 0.5 seconds before video ends
      activeVideo.ontimeupdate = () => {
        if (activeVideo.duration && activeVideo.currentTime >= activeVideo.duration - 0.5) {
          activeVideo.ontimeupdate = null;
          nextSlide();
        }
      };

      const scheduleVideoNext = () => {
        let durationMs = DEFAULT_IMAGE_DELAY;
        if (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 0) {
          durationMs = Math.max((activeVideo.duration - 0.5) * 1000, 3000);
        }
        if (autoplayTimer) clearTimeout(autoplayTimer);
        autoplayTimer = setTimeout(nextSlide, durationMs);
      };

      if (activeVideo.readyState >= 1) {
        scheduleVideoNext();
      } else {
        activeVideo.addEventListener('loadedmetadata', scheduleVideoNext, { once: true });
        autoplayTimer = setTimeout(nextSlide, 14000); // fallback 14s
      }
    } else {
      autoplayTimer = setTimeout(nextSlide, DEFAULT_IMAGE_DELAY);
    }
  }

  function updateTrackFills(activeIndex) {
    tracks.forEach((track, i) => {
      const fill = track.querySelector('.timeline__track-fill');
      if (i < activeIndex) {
        fill.style.width = '100%';
      } else {
        fill.style.width = '0%';
      }
    });
  }

  function nextSlide() {
    const next = (currentIndex + 1) % slides.length;
    goToSlide(next);
  }

  // Step button clicks
  steps.forEach(step => {
    step.addEventListener('click', () => {
      const index = parseInt(step.dataset.step, 10);
      goToSlide(index);
    });
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  const slider = document.querySelector('.timeline__slider');

  if (slider) {
    slider.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToSlide((currentIndex + 1) % slides.length);
        } else {
          goToSlide((currentIndex - 1 + slides.length) % slides.length);
        }
      }
    }, { passive: true });
  }

  // Initialize
  goToSlide(0);

  // Pause timer when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (autoplayTimer) clearTimeout(autoplayTimer);
      const activeVideo = slides[currentIndex]?.querySelector('video');
      if (activeVideo) activeVideo.pause();
    } else {
      goToSlide(currentIndex);
    }
  });
}
