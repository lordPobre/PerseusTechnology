// site.js · Transiciones y revelado al scroll en todas las páginas.
(function () {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Revelado: secciones con [data-reveal] y secciones del main después del hero.
  if (!RM && 'IntersectionObserver' in window) {
    const els = document.querySelectorAll('[data-reveal], main > section:not(:first-child), main > div > section:not(:first-child)');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.top < window.innerHeight * 0.92) return; // ya visible al cargar: no lo ocultamos
      el.classList.add('p-reveal');
      io.observe(el);
    });
  }

  // Navegadores sin View Transitions entre documentos: fundido simple al salir.
  if (!RM && !('onpagereveal' in window)) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      document.documentElement.classList.add('p-leaving');
      setTimeout(() => { location.href = a.href; }, 220);
    });
    window.addEventListener('pageshow', () => document.documentElement.classList.remove('p-leaving'));
  }
})();
