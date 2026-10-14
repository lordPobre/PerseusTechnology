// Home · Perseus Dark A. Sin dependencias.
(function () {
  // Manifiesto: separa en palabras y las ilumina según el scroll.
  const m = document.querySelector('[data-manifesto]');
  if (m) {
    const hl = parseInt(m.dataset.highlight || '0', 10);
    const words = m.textContent.trim().split(/\s+/);
    m.innerHTML = words.map((w, i) => '<span' + (i < hl ? ' class="hl"' : '') + '>' + w + ' </span>').join('');
    const spans = m.querySelectorAll('span');
    let last = -1;
    const onScroll = () => {
      const b = m.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.85 - b.top) / (b.height * 0.75 + vh * 0.25)));
      const lit = Math.round(p * spans.length);
      if (lit === last) return;
      last = lit;
      spans.forEach((s, i) => s.classList.toggle('on', i < lit));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Tarjetas de soluciones: foco que sigue al cursor.
  document.querySelectorAll('[data-spot]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      el.style.setProperty('--x', (e.clientX - b.left) + 'px');
      el.style.setProperty('--y', (e.clientY - b.top) + 'px');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--x', '-999px'); el.style.setProperty('--y', '-999px'); });
  });

  // Casos: preview flotante con la imagen cargada en el admin.
  const box = document.querySelector('[data-preview-box]');
  const list = document.querySelector('.p-casos');
  if (box && list && window.matchMedia('(hover: hover) and (min-width: 1000px)').matches) {
    list.querySelectorAll('[data-preview]').forEach((a) => {
      a.addEventListener('pointerenter', () => { box.style.backgroundImage = 'url("' + a.dataset.preview + '")'; box.classList.add('on'); });
    });
    list.addEventListener('pointerleave', () => box.classList.remove('on'));
    list.addEventListener('pointermove', (e) => { box.style.transform = 'translate(' + (e.clientX + 24) + 'px,' + (e.clientY - 110) + 'px) rotate(-3deg)'; });
  }
})();
