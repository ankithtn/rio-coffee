/* ============================================
    Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── Navbar scroll effect ── */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    /* ── Mobile menu toggle ── */
    const burger = document.querySelector('.navbar__burger');
    if (burger) {
        burger.addEventListener('click', () => {
            const isOpen = navbar.classList.toggle('menu-open');
            burger.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close on nav link click
        document.querySelectorAll('.navbar__links a').forEach(link => {
            link.addEventListener('click', () => {
                navbar.classList.remove('menu-open');
                burger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navbar.classList.contains('menu-open')) {
                navbar.classList.remove('menu-open');
                burger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }

    /* ── Scroll reveal ── */
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));



    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

});

function animateCounter(el, target) {
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();

    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/* ── Contact Form — Validation + Submission ── */
(function () {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  /* ── Toast helper ── */
  function createToast() {
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.innerHTML = `
      <div class="toast__icon">
        <svg viewBox="0 0 12 12"><polyline points="1.5 6 4.5 9 10.5 3"/></svg>
      </div>
      <span class="toast__msg">Enquiry sent — we'll be in touch soon.</span>
      <button class="toast__close" aria-label="Dismiss">
        <svg viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
      </button>
    `;
    document.body.appendChild(t);
    t.querySelector('.toast__close').addEventListener('click', () => hideToast(t));
    return t;
  }

  function showToast(t) {
    requestAnimationFrame(() => {
      t.classList.add('toast--show');
      setTimeout(() => hideToast(t), 5000);
    });
  }

  function hideToast(t) {
    t.classList.remove('toast--show');
    setTimeout(() => t.remove(), 400);
  }

  /* ── Validation rules ── */
  const rules = {
    name:     { test: v => v.trim().length >= 2,              msg: 'Please enter your full name' },
    email:    { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Please enter a valid email address' },
    phone:    { test: v => /^[+\d\s\-()]{7,}$/.test(v.trim()), msg: 'Please enter a valid phone number' },
    location: { test: v => v.trim().length >= 2,              msg: 'Please enter your city or area' },
    message:  { test: v => v.trim().length >= 10,             msg: 'Please add a message (at least 10 characters)' },
  };

  function getField(name) {
    return form.querySelector(`[name="${name}"]`);
  }

  function setError(el, msg) {
    el.classList.add('error');
    el.classList.remove('valid');
    let err = el.parentElement.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      el.parentElement.appendChild(err);
    }
    err.textContent = msg;
  }

  function setValid(el) {
    el.classList.remove('error');
    el.classList.add('valid');
    const err = el.parentElement.querySelector('.field-error');
    if (err) err.remove();
  }

  function validateField(name) {
    const el = getField(name);
    if (!el) return true;
    const rule = rules[name];
    if (!rule) return true;
    const ok = rule.test(el.value);
    ok ? setValid(el) : setError(el, rule.msg);
    return ok;
  }

  /* Live validation on blur */
  Object.keys(rules).forEach(name => {
    const el = getField(name);
    if (!el) return;
    el.addEventListener('blur', () => validateField(name));
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) validateField(name);
    });
  });

  /* ── Form submit ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* Validate all fields */
    const allValid = Object.keys(rules).map(n => validateField(n)).every(Boolean);
    if (!allValid) {
      const firstError = form.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Loading state */
    const btn = form.querySelector('[type="submit"]');
    const btnText = btn.querySelector('.btn-text') || btn;
    btn.classList.add('btn--submitting');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="btn-text" style="opacity:0">${originalText}</span>`;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.reset();
        form.querySelectorAll('.valid').forEach(el => el.classList.remove('valid'));
        const toast = createToast();
        showToast(toast);
      } else {
        throw new Error('Server error');
      }
    } catch {
      const toast = createToast();
      toast.querySelector('.toast__msg').textContent = 'Something went wrong — please try again.';
      toast.querySelector('.toast__icon svg').innerHTML = '<line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>';
      toast.querySelector('.toast__icon').style.background = 'rgba(180,40,40,0.15)';
      toast.querySelector('.toast__icon svg').style.stroke = 'rgba(200,60,60,0.9)';
      showToast(toast);
    } finally {
      btn.classList.remove('btn--submitting');
      btn.innerHTML = originalText;
    }
  });
})();
