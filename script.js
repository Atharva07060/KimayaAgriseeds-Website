const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    toggle.textContent = isOpen ? '×' : '☰';
  });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.intro, .product-teaser, .closing, .page-hero, .product-feature, .hybrid-range, .bulk-banner, .product-gallery, .variety-proof, .contact-hero, .contact-grid, .bulk-contact, .next-season'
  );
  const staggerTargets = document.querySelectorAll(
    '.hybrid-card, .gallery-card, .proof-slot, .trust-strip > div'
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
