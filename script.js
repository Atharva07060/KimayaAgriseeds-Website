const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    toggle.textContent = isOpen ? '×' : '☰';
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.textContent = '\u2630';
    });
  });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lightweight scroll feedback: page progress, a polished sticky header, and a return-to-top control.
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
scrollProgress.setAttribute('aria-hidden', 'true');

const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.type = 'button';
backToTop.setAttribute('aria-label', 'Back to top');
backToTop.innerHTML = '<span aria-hidden="true">\u2191</span>';

const siteHeader = document.querySelector('.header');
document.body.append(scrollProgress, backToTop);

let scrollUpdatePending = false;
function updateScrollUI() {
  const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(window.scrollY / scrollableHeight, 1);
  scrollProgress.style.transform = `scaleX(${progress})`;
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 12);
  backToTop.classList.toggle('is-visible', window.scrollY > 480);
  scrollUpdatePending = false;
}

window.addEventListener('scroll', () => {
  if (!scrollUpdatePending) {
    scrollUpdatePending = true;
    window.requestAnimationFrame(updateScrollUI);
  }
}, { passive: true });
window.addEventListener('resize', updateScrollUI, { passive: true });
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
});
updateScrollUI();

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.hero-copy, .hero-art, .hero-field-visual, .trust-strip, .intro, .home-catalogue, .closing, .page-hero, .product-feature, .hybrid-range, .bulk-banner, .product-gallery, .variety-proof, .contact-hero, .contact-grid, .contact-form-section, .contact-bottom, .next-season, .footer'
  );
  const staggerTargets = document.querySelectorAll(
    '.hero-catalogue-card, .home-category-card, .home-hybrid-product, .hybrid-card, .gallery-card, .proof-slot, .trust-strip > div, .contact-card, .address-card, .visit-card, .form-intro, .contact-form'
  );

  revealTargets.forEach((element) => element.classList.add('reveal'));
  staggerTargets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${(index % 3) * 85}ms`);
  });

  if (revealTargets.length + staggerTargets.length) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }
}

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formStatus = contactForm.querySelector('#form-status');
  const originalButtonContent = submitButton?.innerHTML ?? '';

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const config = window.KIMAYA_SUPABASE;
    if (!config?.submitUrl || !config?.publishableKey) {
      formStatus.textContent = 'The enquiry form is not configured yet. Please contact us by phone or email.';
      formStatus.className = 'form-status is-error';
      formStatus.hidden = false;
      return;
    }

    const fields = new FormData(contactForm);
    const payload = {
      name: fields.get('name'),
      email: fields.get('email'),
      phone: fields.get('phone'),
      enquiry_type: fields.get('enquiry'),
      message: fields.get('message'),
      company_website: fields.get('company_website'),
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    contactForm.setAttribute('aria-busy', 'true');
    formStatus.hidden = true;

    try {
      const response = await fetch(config.submitUrl, {
        method: 'POST',
        headers: {
          apikey: config.publishableKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Please try again in a moment.');

      contactForm.reset();
      formStatus.textContent = 'Thank you—your enquiry has been received.';
      formStatus.className = 'form-status is-success';
    } catch (error) {
      formStatus.textContent = error instanceof TypeError
        ? 'We could not reach the form service. Please try again or contact us by phone or email.'
        : (error.message || 'We could not save your enquiry. Please try again.');
      formStatus.className = 'form-status is-error';
    } finally {
      formStatus.hidden = false;
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonContent;
      contactForm.removeAttribute('aria-busy');
    }
  });
}
