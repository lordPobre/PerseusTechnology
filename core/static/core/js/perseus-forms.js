// perseus-forms.js · Cotizador y formulario de contacto en pasos. Sin dependencias.
// <perseus-quote contact="/contacto/">  config opcional: <script type="application/json"> dentro del elemento
// <perseus-contact action="/contacto/" csrf="..." asunto="" mensaje="">  envía nombre, email, asunto, mensaje
(function () {
  if (customElements.get('perseus-quote')) return;
  const ACID = '#c6ff3d', BONE = '#f5f5f0', MUTE = '#8a8a84', BODY = '#b4b4ad';
  const MONO = "'Geist Mono', ui-monospace, monospace", SANS = "'Geist', system-ui, sans-serif";
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const st = document.createElement('style');
  st.textContent = '@keyframes pfIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}@keyframes pfPulse{0%,100%{box-shadow:0 0 0 0 rgba(198,255,61,.55)}50%{box-shadow:0 0 0 6px rgba(198,255,61,0)}}@keyframes pfPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}';
  document.head.appendChild(st);
  const h = (tag, style, html) => { const e = document.createElement(tag); if (style) e.style.cssText = style; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');
  const lang = (el) => ((el.getAttribute('lang') || document.documentElement.lang || 'es').slice(0, 2) === 'en' ? 'en' : 'es');
  const P = {
    check: '<path d="M20 6 9 17l-5-5"/>', arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    web: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  };
  const ico = (k, s, w) => '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block">' + P[k] + '</svg>';
  const PANEL = 'padding:clamp(20px,2.4vw,28px);border-radius:28px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);display:flex;flex-direction:column;gap:16px';
  const INPUT = 'width:100%;min-height:48px;padding:0 0 4px;background:transparent;border:0;border-bottom:1px solid rgba(255,255,255,.18);color:' + BONE + ';font:400 17px ' + SANS + ';outline:none;border-radius:0';

  /* ---------------- Cotizador ---------------- */
  // Valores de ejemplo: ajústalos en core/contenido.py (COTIZADOR).
  const DEFAULT_CFG = {
    base: [
      { id: 'landing', t: 'Landing page', d: 'Una página de alta conversión para una campaña o producto.', p: 150000, pages: 1, weeks: 2 },
      { id: 'corp', t: 'Sitio corporativo', d: 'Secciones autoadministrables, blog y formulario de contacto.', p: 350000, pages: 5, weeks: 4 },
      { id: 'shop', t: 'E-commerce', d: 'Catálogo, carrito, stock y pagos integrados.', p: 650000, pages: 5, weeks: 6 },
      { id: 'app', t: 'Sistema a medida', d: 'Herramienta interna con roles, historial y reportes.', p: 1200000, pages: 0, weeks: 10 },
    ],
    page_price: 40000, max_pages: 20,
    extras: [
      { id: 'seo', t: 'SEO técnico avanzado', p: 120000, weeks: 0.5 },
      { id: 'blog', t: 'Blog autoadministrable', p: 90000, weeks: 0.5 },
      { id: 'en', t: 'Versión en inglés', p: 150000, weeks: 1 },
      { id: 'api', t: 'Integración con ERP o facturación', p: 250000, weeks: 2 },
      { id: 'pay', t: 'Pasarela de pago', p: 120000, weeks: 1, hide: ['shop'] },
    ],
    support: [{ t: 'Sin plan', p: 0 }, { t: 'Soporte TI', p: 25000 }, { t: 'Soporte y mejoras', p: 60000 }],
  };
  const TQ = {
    es: { s1: 'Tipo de proyecto', s2: 'Secciones', s3: 'Extras', s4: 'Soporte mensual', from: 'desde', incl: 'incluidas', each: 'por sección adicional', yours: 'Tu estimación', extraPages: 'secciones adicionales', monthly: '/ mes', total: 'Total estimado', nosup: 'Sin plan mensual', time: 'Entrega estimada', weeks: 'semanas', note: 'Valor referencial en CLP. Un ingeniero confirma la cotización final en menos de 24 horas.', cta: 'Enviar esta cotización', subject: 'Cotización', pagesL: 'secciones' },
    en: { s1: 'Project type', s2: 'Sections', s3: 'Add-ons', s4: 'Monthly support', from: 'from', incl: 'included', each: 'per extra section', yours: 'Your estimate', extraPages: 'extra sections', monthly: '/ month', total: 'Estimated total', nosup: 'No monthly plan', time: 'Estimated delivery', weeks: 'weeks', note: 'Reference price in CLP. An engineer confirms the final quote within 24 hours.', cta: 'Send this quote', subject: 'Quote', pagesL: 'sections' },
  };

  class Quote extends HTMLElement {
    connectedCallback() {
      if (this._on) return;
      this._on = true;
      const j = this.querySelector('script[type="application/json"]');
      try { this.cfg = j ? JSON.parse(j.textContent) : DEFAULT_CFG; } catch (e) { this.cfg = DEFAULT_CFG; }
      this.t = TQ[lang(this)];
      this.contact = this.getAttribute('contact') || '#contacto';
      const b0 = this.cfg.base[Math.min(1, this.cfg.base.length - 1)];
      this.s = { base: b0.id, extras: new Set(), pages: b0.pages, sup: 0 };
      this.style.display = 'block';
      this.innerHTML = '';
      this.build();
      this.update(true);
    }
    disconnectedCallback() { this._on = false; cancelAnimationFrame(this._raf); this.innerHTML = ''; }
    build() {
      const t = this.t, c = this.cfg;
      const root = h('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:16px;align-items:start;font-family:' + SANS + ';color:' + BONE);
      const left = h('div', 'display:flex;flex-direction:column;gap:12px;min-width:0');
      const panel = (n, title) => { const p = h('div', PANEL); p.appendChild(h('div', 'display:flex;align-items:baseline;gap:10px', '<span style="font-family:' + MONO + ';font-size:12px;color:' + ACID + '">' + n + '</span><span style="font-weight:600;font-size:20px;letter-spacing:-.02em">' + esc(title) + '</span>')); left.appendChild(p); return p; };
      const p1 = panel('01', t.s1);
      const g1 = h('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:8px');
      p1.appendChild(g1);
      this.baseBtns = c.base.map((b) => {
        const el = h('button', '', '<span style="display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%"><b style="font-size:16px;font-weight:600;letter-spacing:-.01em">' + esc(b.t) + '</b><span data-ck style="width:22px;height:22px;border-radius:99px;display:flex;align-items:center;justify-content:center;flex:none;transition:all .2s">' + ico('check', 13, 3) + '</span></span><span style="font-size:13.5px;line-height:1.45;color:' + BODY + '">' + esc(b.d) + '</span><span style="font-family:' + MONO + ';font-size:12px;color:' + MUTE + ';margin-top:auto">' + t.from + ' ' + clp(b.p) + '</span>');
        el.type = 'button';
        el.addEventListener('click', () => { this.s.base = b.id; this.s.pages = b.pages; this.update(); });
        g1.appendChild(el); return [b, el];
      });
      this.p2 = panel('02', t.s2);
      const row = h('div', 'display:flex;align-items:center;gap:16px');
      this.range = h('input', 'flex:1;min-width:0;accent-color:' + ACID + ';height:28px;cursor:pointer');
      this.range.type = 'range'; this.range.max = String(c.max_pages || 20); this.range.setAttribute('aria-label', t.s2);
      this.range.addEventListener('input', () => { this.s.pages = +this.range.value; this.update(); });
      this.pagesOut = h('span', 'min-width:56px;text-align:right;font-weight:600;font-size:30px;letter-spacing:-.04em;font-variant-numeric:tabular-nums');
      row.append(this.range, this.pagesOut);
      this.pagesHint = h('span', 'font-size:13px;color:' + MUTE);
      this.p2.append(row, this.pagesHint);
      const p3 = panel('03', t.s3);
      const g3 = h('div', 'display:flex;flex-direction:column;gap:6px');
      p3.appendChild(g3);
      this.extraBtns = c.extras.map((x) => {
        const el = h('button', '', '<span data-box style="width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex:none;transition:all .2s">' + ico('check', 13, 3) + '</span><span style="flex:1;text-align:left;font-size:15px">' + esc(x.t) + '</span><span style="font-family:' + MONO + ';font-size:12.5px;color:' + MUTE + '">+' + clp(x.p) + '</span>');
        el.type = 'button';
        el.addEventListener('click', () => { if (this.s.extras.has(x.id)) this.s.extras.delete(x.id); else this.s.extras.add(x.id); this.update(); });
        g3.appendChild(el); return [x, el];
      });
      const p4 = panel('04', t.s4);
      const g4 = h('div', 'display:flex;flex-wrap:wrap;gap:4px;padding:4px;border-radius:24px;background:rgba(255,255,255,.05);align-self:flex-start');
      p4.appendChild(g4);
      this.supBtns = c.support.map((s, i) => {
        const el = h('button', '', esc(s.t) + (s.p ? ' · ' + clp(s.p) : ''));
        el.type = 'button';
        el.addEventListener('click', () => { this.s.sup = i; this.update(); });
        g4.appendChild(el); return el;
      });
      const tk = h('aside', 'position:sticky;top:92px;display:flex;flex-direction:column;gap:18px;padding:clamp(24px,2.6vw,32px);border-radius:28px;background:' + BONE + ';color:#0a0a0a;min-width:0');
      tk.appendChild(h('span', 'font-family:' + MONO + ';font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#4d6b00', t.yours));
      this.lines = h('div', 'display:flex;flex-direction:column;border-top:1px solid rgba(10,10,10,.12)');
      const tot = h('div', 'display:flex;flex-direction:column;gap:6px');
      tot.appendChild(h('span', 'font-size:13px;color:#5a5a55', t.total));
      this.totalEl = h('span', 'font-weight:600;font-size:clamp(44px,5vw,72px);line-height:.95;letter-spacing:-.055em;font-variant-numeric:tabular-nums');
      this.monthEl = h('span', 'font-size:15px;color:#3d3d39');
      tot.append(this.totalEl, this.monthEl);
      this.timeEl = h('div', 'display:flex;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:16px;background:#e9e9e2;font-size:14px');
      this.cta = h('a', 'display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px 8px 8px 24px;border-radius:99px;background:#0a0a0a;color:' + ACID + ';text-decoration:none;font-weight:600;font-size:16px', esc(t.cta) + '<span style="width:40px;height:40px;border-radius:99px;background:' + ACID + ';color:#0a0a0a;display:flex;align-items:center;justify-content:center">' + ico('arrow', 17, 2.4) + '</span>');
      tk.append(this.lines, tot, this.timeEl, this.cta, h('p', 'margin:0;font-size:12.5px;line-height:1.5;color:#5a5a55', t.note));
      root.append(left, tk);
      this.appendChild(root);
    }
    update(first) {
      const c = this.cfg, s = this.s, t = this.t, b = c.base.find((x) => x.id === s.base) || c.base[0];
      this.baseBtns.forEach(([x, el]) => {
        const on = x.id === s.base;
        el.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:16px;border-radius:20px;cursor:pointer;text-align:left;font-family:inherit;color:' + BONE + ';transition:border-color .2s,background .2s;border:1px solid ' + (on ? ACID : 'rgba(255,255,255,.1)') + ';background:' + (on ? 'rgba(198,255,61,.08)' : 'transparent');
        el.setAttribute('aria-pressed', on);
        const ck = el.querySelector('[data-ck]'); ck.style.background = on ? ACID : 'rgba(255,255,255,.08)'; ck.style.color = on ? '#0a0a0a' : 'transparent';
      });
      this.p2.style.display = b.pages ? '' : 'none';
      if (b.pages) {
        s.pages = Math.min(c.max_pages || 20, Math.max(b.pages, s.pages || b.pages));
        this.range.min = String(b.pages); this.range.value = String(s.pages);
        this.pagesOut.textContent = s.pages;
        this.pagesHint.textContent = b.pages + ' ' + t.incl + ' · +' + clp(c.page_price) + ' ' + t.each;
      }
      this.extraBtns.forEach(([x, el]) => {
        const hidden = x.hide && x.hide.indexOf(s.base) >= 0;
        if (hidden) s.extras.delete(x.id);
        const on = s.extras.has(x.id);
        el.style.cssText = 'display:' + (hidden ? 'none' : 'flex') + ';align-items:center;gap:14px;padding:13px 14px;border-radius:16px;cursor:pointer;font-family:inherit;color:' + BONE + ';transition:border-color .2s,background .2s;border:1px solid ' + (on ? 'rgba(198,255,61,.5)' : 'rgba(255,255,255,.08)') + ';background:' + (on ? 'rgba(198,255,61,.06)' : 'transparent');
        el.setAttribute('aria-pressed', on);
        const bx = el.querySelector('[data-box]'); bx.style.background = on ? ACID : 'transparent'; bx.style.border = on ? '1.5px solid ' + ACID : '1.5px solid rgba(255,255,255,.25)'; bx.style.color = on ? '#0a0a0a' : 'transparent';
      });
      this.supBtns.forEach((el, i) => { const on = i === s.sup; el.style.cssText = 'border:0;cursor:pointer;padding:9px 14px;border-radius:99px;font:500 13.5px ' + SANS + ';transition:all .2s;' + (on ? 'background:' + BONE + ';color:#0a0a0a' : 'background:transparent;color:' + BONE); });
      const L = [[b.t, b.p]];
      const extraP = b.pages ? Math.max(0, s.pages - b.pages) : 0;
      if (extraP) L.push([extraP + ' ' + t.extraPages, extraP * c.page_price]);
      let weeks = b.weeks + extraP * 0.25;
      c.extras.forEach((x) => { if (s.extras.has(x.id)) { L.push([x.t, x.p]); weeks += x.weeks || 0; } });
      this.target = L.reduce((a, l) => a + l[1], 0);
      this.lines.innerHTML = L.map((l) => '<div style="display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(10,10,10,.12);font-size:14.5px"><span>' + esc(l[0]) + '</span><span style="font-family:' + MONO + ';font-size:13px;white-space:nowrap">' + clp(l[1]) + '</span></div>').join('');
      const sup = c.support[s.sup];
      this.monthEl.textContent = sup.p ? '+ ' + clp(sup.p) + ' ' + t.monthly + ' · ' + sup.t : t.nosup;
      const w = Math.ceil(weeks);
      this.timeEl.innerHTML = '<span style="color:#5a5a55">' + t.time + '</span><b style="font-weight:600">' + w + '–' + (w + 2) + ' ' + t.weeks + '</b>';
      const summary = [t.subject + ': ' + b.t, b.pages ? s.pages + ' ' + t.pagesL : '']
        .concat(c.extras.filter((x) => s.extras.has(x.id)).map((x) => '+ ' + x.t))
        .concat([sup.p ? t.s4 + ': ' + sup.t : '', t.total + ': ' + clp(this.target)]).filter(Boolean).join('\n');
      this.cta.href = this.contact + (this.contact.indexOf('?') >= 0 ? '&' : '?') + 'asunto=' + encodeURIComponent(t.subject + ' · ' + b.t) + '&mensaje=' + encodeURIComponent(summary);
      if (first || RM) { this.cur = this.target; this.totalEl.textContent = clp(this.cur); } else this.anim();
    }
    anim() {
      cancelAnimationFrame(this._raf);
      const f = () => {
        this.cur += (this.target - this.cur) * 0.14;
        if (Math.abs(this.target - this.cur) < 60) this.cur = this.target;
        this.totalEl.textContent = clp(this.cur);
        if (this.cur !== this.target) this._raf = requestAnimationFrame(f);
      };
      this._raf = requestAnimationFrame(f);
    }
  }

  /* ---------------- Contacto en pasos ---------------- */
  const TC = {
    es: { steps: ['Necesidad', 'Detalles', 'Contacto'], q1: '¿Qué necesitas?', q1s: 'Puedes elegir más de una opción.', opts: [['web', 'Sitio web'], ['cart', 'E-commerce'], ['grid', 'App a medida'], ['server', 'Soporte TI'], ['help', 'Aún no lo sé']], q2: 'Cuéntanos más', when: '¿Para cuándo?', whens: ['Lo antes posible', 'En 1 a 3 meses', 'Sin fecha definida'], msg: 'Qué quieres resolver', msgPh: 'Sistemas actuales, plazos, lo que hoy no funciona…', q3: '¿Cómo te contactamos?', name: 'Nombre', namePh: 'Tu nombre', email: 'Correo laboral', company: 'Empresa (opcional)', companyPh: 'Nombre de tu empresa', next: 'Siguiente', back: 'Atrás', send: 'Enviar solicitud', sending: 'Enviando…', sum: 'Tu solicitud', resp: 'Respuesta en menos de 24 horas', nda: 'NDA desde la primera reunión', okT: 'Solicitud lista.', okD: 'Te escribiremos en menos de 24 horas con los próximos pasos.', need: 'Necesita', plazo: 'Plazo', emp: 'Empresa', general: 'Consulta general', step: 'Paso', of: 'de', empty: 'Aún sin completar' },
    en: { steps: ['Need', 'Details', 'Contact'], q1: 'What do you need?', q1s: 'You can pick more than one.', opts: [['web', 'Website'], ['cart', 'E-commerce'], ['grid', 'Custom app'], ['server', 'IT support'], ['help', 'Not sure yet']], q2: 'Tell us more', when: 'When do you need it?', whens: ['As soon as possible', 'In 1 to 3 months', 'No fixed date'], msg: 'What do you want to solve', msgPh: 'Current systems, timeline, what is not working today…', q3: 'How can we reach you?', name: 'Name', namePh: 'Your name', email: 'Work email', company: 'Company (optional)', companyPh: 'Your company', next: 'Next', back: 'Back', send: 'Send request', sending: 'Sending…', sum: 'Your request', resp: 'Reply within 24 hours', nda: 'NDA from the first meeting', okT: 'Request ready.', okD: 'We will email you within 24 hours with next steps.', need: 'Needs', plazo: 'Timeline', emp: 'Company', general: 'General inquiry', step: 'Step', of: 'of', empty: 'Not filled in yet' },
  };
  const KEYWORDS = { web: ['web', 'sitio', 'landing', 'corporativ', 'site'], cart: ['commerce', 'tienda', 'shop'], grid: ['app', 'sistema', 'fintora', 'system'], server: ['soporte', 'consultor', 'infra', ' ti', 'support'] };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  class Contact extends HTMLElement {
    connectedCallback() {
      if (this._on) return;
      this._on = true;
      this.t = TC[lang(this)];
      const q = new URLSearchParams(window.location.search);
      const pre = this.getAttribute('asunto') || q.get('asunto') || '';
      this.s = { step: 0, needs: new Set(), when: '', msg: this.getAttribute('mensaje') || q.get('mensaje') || '', name: '', email: '', company: '', done: false };
      const low = ' ' + pre.toLowerCase();
      this.t.opts.forEach(([k, l]) => { if (pre && (KEYWORDS[k] || []).some((w) => low.indexOf(w) >= 0)) this.s.needs.add(l); });
      this.quoteSubject = /cotiz|quote/i.test(pre) ? pre : '';
      this.style.display = 'block';
      this.innerHTML = '';
      this.build();
      this.render();
    }
    disconnectedCallback() { this._on = false; this.innerHTML = ''; }
    build() {
      const t = this.t;
      const root = h('div', 'display:flex;flex-wrap:wrap;gap:16px;align-items:stretch;font-family:' + SANS + ';color:' + BONE);
      this.card = h('div', 'flex:2 1 460px;min-width:0;display:flex;flex-direction:column;border-radius:28px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);overflow:hidden');
      const prog = h('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:20px clamp(20px,3vw,32px) 0');
      this.segs = t.steps.map((label, i) => {
        const sgm = h('button', 'display:flex;flex-direction:column;gap:10px;padding:0;background:none;border:0;text-align:left;font-family:inherit;cursor:pointer', '<span style="position:relative;display:block;height:3px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden"><span data-fill style="position:absolute;inset:0;background:' + ACID + ';transform-origin:left;transition:transform .5s cubic-bezier(.2,.7,.2,1)"></span></span><span style="display:flex;gap:8px;align-items:baseline;font-size:13px"><span style="font-family:' + MONO + ';font-size:11px">0' + (i + 1) + '</span><span data-l>' + esc(label) + '</span></span>');
        sgm.type = 'button';
        sgm.addEventListener('click', () => { if (i < this.s.step) { this.s.step = i; this.render(); } });
        prog.appendChild(sgm); return sgm;
      });
      this.body = h('div', 'flex:1;padding:clamp(24px,3vw,36px) clamp(20px,3vw,32px);min-height:320px');
      this.foot = h('div', 'display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 clamp(20px,3vw,32px) clamp(20px,3vw,32px)');
      this.backBtn = h('button', 'display:flex;align-items:center;gap:8px;padding:0 18px;min-height:52px;border-radius:99px;border:1px solid rgba(255,255,255,.16);background:transparent;color:' + BONE + ';font:500 15px ' + SANS + ';cursor:pointer', ico('back', 16) + esc(t.back));
      this.backBtn.type = 'button';
      this.backBtn.addEventListener('click', () => { if (this.s.step > 0) { this.s.step--; this.render(); } });
      this.nextBtn = h('button', 'display:flex;align-items:center;gap:14px;margin-left:auto;padding:6px 6px 6px 22px;border-radius:99px;border:0;background:' + ACID + ';color:#0a0a0a;font:600 15px ' + SANS + ';cursor:pointer;transition:opacity .2s');
      this.nextBtn.type = 'button';
      this.nextBtn.addEventListener('click', () => this.next());
      this.foot.append(this.backBtn, this.nextBtn);
      this.card.append(prog, this.body, this.foot);
      this.aside = h('aside', 'flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:18px;padding:clamp(22px,2.6vw,30px);border-radius:28px;background:' + BONE + ';color:#0a0a0a');
      this.form = h('form', 'display:none');
      this.form.method = 'post';
      this.form.action = this.getAttribute('action') || '#';
      const hid = (n, v) => { const i = h('input'); i.type = 'hidden'; i.name = n; if (v != null) i.value = v; this.form.appendChild(i); return i; };
      if (this.getAttribute('csrf')) hid('csrfmiddlewaretoken', this.getAttribute('csrf'));
      this.f = { nombre: hid('nombre'), email: hid('email'), asunto: hid('asunto'), mensaje: hid('mensaje') };
      root.append(this.card, this.aside, this.form);
      this.appendChild(root);
    }
    valid(i) {
      const s = this.s;
      if (i === 0) return s.needs.size > 0;
      if (i === 1) return s.msg.trim().length >= 5;
      return s.name.trim().length > 1 && EMAIL.test(s.email.trim());
    }
    syncNav() {
      const t = this.t, s = this.s, last = s.step === 2, ok = this.valid(s.step);
      this.backBtn.style.visibility = s.step && !s.done ? 'visible' : 'hidden';
      this.nextBtn.innerHTML = esc(last ? t.send : t.next) + '<span style="width:40px;height:40px;border-radius:99px;background:#0a0a0a;color:' + ACID + ';display:flex;align-items:center;justify-content:center">' + ico('arrow', 16, 2.4) + '</span>';
      this.nextBtn.style.opacity = ok ? '1' : '.4';
      this.nextBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
      this.nextBtn.setAttribute('aria-disabled', String(!ok));
      this.foot.style.display = s.done ? 'none' : 'flex';
      this.segs.forEach((sg, i) => {
        sg.querySelector('[data-fill]').style.transform = 'scaleX(' + (s.done || i < s.step ? 1 : i === s.step ? 0.35 : 0) + ')';
        sg.style.color = i <= s.step ? BONE : MUTE;
        sg.style.cursor = i < s.step && !s.done ? 'pointer' : 'default';
      });
      this.syncAside();
    }
    syncAside() {
      const t = this.t, s = this.s;
      const row = (k, v) => '<div style="display:flex;flex-direction:column;gap:3px;padding:12px 0;border-bottom:1px solid rgba(10,10,10,.12)"><span style="font-size:12px;color:#5a5a55">' + k + '</span><span style="font-size:15px;line-height:1.4;' + (v ? '' : 'color:#9a9a93') + '">' + (v ? esc(v) : t.empty) + '</span></div>';
      this.aside.innerHTML = '<span style="font-family:' + MONO + ';font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#4d6b00">' + t.sum + '</span>' +
        '<div style="display:flex;flex-direction:column;border-top:1px solid rgba(10,10,10,.12)">' +
        row(t.need, this.quoteSubject || Array.from(s.needs).join(', ')) +
        row(t.plazo, s.when) +
        row(t.msg, s.msg.length > 120 ? s.msg.slice(0, 120) + '…' : s.msg) +
        row(t.name, [s.name, s.email].filter(Boolean).join(' · ')) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;margin-top:auto;font-size:14px"><span style="display:flex;align-items:center;gap:10px"><i style="display:block;width:8px;height:8px;border-radius:9px;background:#4d6b00;animation:pfPulse 2.2s infinite"></i>' + t.resp + '</span><span style="color:#5a5a55">' + t.nda + '</span></div>';
    }
    next() {
      const s = this.s;
      if (!this.valid(s.step)) { this.shake(); return; }
      if (s.step < 2) { s.step++; this.render(); return; }
      this.submit();
    }
    shake() { if (RM) return; this.nextBtn.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }
    submit() {
      const t = this.t, s = this.s;
      const head = [t.need + ': ' + (Array.from(s.needs).join(', ') || '—'), s.when ? t.plazo + ': ' + s.when : '', s.company ? t.emp + ': ' + s.company : ''].filter(Boolean).join('\n');
      this.f.nombre.value = s.name.trim();
      this.f.email.value = s.email.trim();
      this.f.asunto.value = this.quoteSubject || Array.from(s.needs).join(', ') || t.general;
      this.f.mensaje.value = head + '\n\n' + s.msg.trim();
      const a = this.form.getAttribute('action');
      if (a && a !== '#') { if (window.perseusLoading) window.perseusLoading(this.nextBtn, t.sending); else { this.nextBtn.style.opacity = '.6'; this.nextBtn.firstChild.textContent = t.sending; } this.form.submit(); return; }
      s.done = true; this.render();
    }
    render() {
      const t = this.t, s = this.s, b = this.body;
      b.innerHTML = '';
      const wrap = h('div', 'display:flex;flex-direction:column;gap:22px;' + (RM ? '' : 'animation:pfIn .45s cubic-bezier(.2,.7,.2,1)'));
      const title = (x, sub) => { wrap.appendChild(h('div', 'display:flex;flex-direction:column;gap:6px', '<span style="font-family:' + MONO + ';font-size:12px;color:' + MUTE + '">' + t.step + ' ' + (s.step + 1) + ' ' + t.of + ' 3</span><h3 style="margin:0;font-weight:600;font-size:clamp(28px,3vw,40px);line-height:1;letter-spacing:-.04em">' + esc(x) + '</h3>' + (sub ? '<span style="font-size:14px;color:' + BODY + '">' + esc(sub) + '</span>' : ''))); };
      const field = (label, el) => { const l = h('label', 'display:flex;flex-direction:column;gap:8px;font-size:13.5px;color:' + BODY); l.appendChild(document.createTextNode(label)); l.appendChild(el); return l; };
      const input = (key, type, ph, ac) => {
        const i = h('input', INPUT); i.type = type; i.value = s[key]; i.placeholder = ph || ''; if (ac) i.autocomplete = ac;
        i.addEventListener('focus', () => { i.style.borderBottomColor = ACID; });
        i.addEventListener('blur', () => { i.style.borderBottomColor = 'rgba(255,255,255,.18)'; });
        i.addEventListener('input', () => { s[key] = i.value; this.syncNav(); });
        i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.next(); } });
        return i;
      };
      if (s.done) {
        wrap.appendChild(h('div', 'display:flex;flex-direction:column;gap:18px;padding:24px 0', '<span style="width:64px;height:64px;border-radius:99px;background:' + ACID + ';color:#0a0a0a;display:flex;align-items:center;justify-content:center;animation:pfPop .5s cubic-bezier(.2,.7,.2,1)">' + ico('check', 28, 3) + '</span><h3 style="margin:0;font-weight:600;font-size:40px;letter-spacing:-.04em">' + t.okT + '</h3><p style="margin:0;font-size:17px;line-height:1.6;color:' + BODY + '">' + t.okD + '</p>'));
      } else if (s.step === 0) {
        title(t.q1, t.q1s);
        const g = h('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));gap:8px');
        t.opts.forEach(([k, l]) => {
          const on = s.needs.has(l);
          const el = h('button', 'position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:28px;min-height:120px;padding:16px;border-radius:20px;cursor:pointer;text-align:left;font:600 15.5px ' + SANS + ';letter-spacing:-.01em;color:' + BONE + ';transition:border-color .2s,background .2s,transform .2s;border:1px solid ' + (on ? ACID : 'rgba(255,255,255,.1)') + ';background:' + (on ? 'rgba(198,255,61,.08)' : 'transparent'),
            '<span style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:' + (on ? ACID : 'rgba(255,255,255,.06)') + ';color:' + (on ? '#0a0a0a' : ACID) + '">' + ico(k, 19) + '</span>' + esc(l));
          el.type = 'button'; el.setAttribute('aria-pressed', on);
          el.addEventListener('click', () => { if (s.needs.has(l)) s.needs.delete(l); else s.needs.add(l); this.quoteSubject = ''; this.render(); });
          g.appendChild(el);
        });
        wrap.appendChild(g);
      } else if (s.step === 1) {
        title(t.q2);
        const chips = h('div', 'display:flex;flex-wrap:wrap;gap:8px');
        t.whens.forEach((w) => {
          const on = s.when === w;
          const c = h('button', 'padding:10px 16px;border-radius:99px;cursor:pointer;font:500 14px ' + SANS + ';transition:all .2s;border:1px solid ' + (on ? ACID : 'rgba(255,255,255,.16)') + ';background:' + (on ? ACID : 'transparent') + ';color:' + (on ? '#0a0a0a' : BONE), esc(w));
          c.type = 'button'; c.setAttribute('aria-pressed', on);
          c.addEventListener('click', () => { s.when = on ? '' : w; this.render(); });
          chips.appendChild(c);
        });
        const wl = h('div', 'display:flex;flex-direction:column;gap:10px;font-size:13.5px;color:' + BODY, esc(t.when)); wl.appendChild(chips);
        const ta = h('textarea', INPUT + ';min-height:120px;padding:8px 0;resize:vertical;line-height:1.5');
        ta.rows = 4; ta.value = s.msg; ta.placeholder = t.msgPh;
        ta.addEventListener('focus', () => { ta.style.borderBottomColor = ACID; });
        ta.addEventListener('blur', () => { ta.style.borderBottomColor = 'rgba(255,255,255,.18)'; });
        ta.addEventListener('input', () => { s.msg = ta.value; this.syncNav(); });
        wrap.append(wl, field(t.msg, ta));
      } else {
        title(t.q3);
        const grid = h('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:22px');
        grid.append(field(t.name, input('name', 'text', t.namePh, 'name')), field(t.email, input('email', 'email', 'tu@empresa.cl', 'email')));
        wrap.append(grid, field(t.company, input('company', 'text', t.companyPh, 'organization')));
      }
      b.appendChild(wrap);
      this.syncNav();
      const first = b.querySelector('input,textarea');
      if (first && this._rendered) first.focus({ preventScroll: true });
      this._rendered = true;
    }
  }

  customElements.define('perseus-quote', Quote);
  customElements.define('perseus-contact', Contact);
})();
