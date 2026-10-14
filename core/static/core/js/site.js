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

  // Logo animado: con "reducir movimiento" se congela en su estado final.
  if (RM) document.querySelectorAll('svg[data-anim]').forEach((svg) => { if (svg.pauseAnimations) { svg.pauseAnimations(); svg.setCurrentTime(0); } });

  // Carga (2c): el botón de envío muestra el cristal con la órbita en movimiento.
  const LOADER = '<svg class="p-loader" width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
    '<path d="M32 6 L54.5 19 L54.5 45 L32 58 L9.5 45 L9.5 19 Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round" opacity=".55"/>' +
    '<ellipse cx="32" cy="34" rx="30" ry="8.5" transform="rotate(-18 32 34)" stroke="currentColor" stroke-width="3" opacity=".25"/>' +
    '<ellipse cx="32" cy="34" rx="30" ry="8.5" transform="rotate(-18 32 34)" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="34 106"><animate attributeName="stroke-dashoffset" values="0;-140" dur="1.2s" repeatCount="indefinite"/></ellipse>' +
    '<circle cx="32" cy="32" r="6" fill="currentColor"><animate attributeName="opacity" values=".35;1;.35" dur="1.2s" repeatCount="indefinite"/></circle></svg>';
  const SENDING = (document.documentElement.lang || '').indexOf('en') === 0 ? 'Sending…' : 'Enviando…';
  window.perseusLoading = function (btn, text) {
    if (!btn || btn.dataset.loading) return;
    btn.dataset.loading = '1';
    btn._orig = btn.innerHTML;
    btn.setAttribute('aria-busy', 'true');
    const dot = btn.querySelector('.p-btn-dot');
    if (dot) dot.innerHTML = LOADER; else btn.insertAdjacentHTML('afterbegin', LOADER);
    const label = Array.prototype.find.call(btn.childNodes, (n) => n.nodeType === 3 && n.textContent.trim());
    if (label) label.textContent = text || SENDING;
    setTimeout(() => { btn.disabled = true; }, 0);
  };
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (e.defaultPrevented || (f.method || '').toLowerCase() !== 'post' || /i18n|setlang/.test(f.action)) return;
    window.perseusLoading(e.submitter || f.querySelector('[type="submit"]'));
  });
  // Al volver con el botón Atrás, el botón queda como estaba.
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('[data-loading]').forEach((btn) => { btn.innerHTML = btn._orig || btn.innerHTML; btn.disabled = false; btn.removeAttribute('aria-busy'); delete btn.dataset.loading; });
  });
})();
