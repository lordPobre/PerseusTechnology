// <fintora-orb lang="es|en"> · Orbe interactivo de Fintora con datos simulados.
// Modo sitio: se anima solo en bucle de 26 s; al tocar una pestaña o categoría toma el control 12 s.
// Modo video: atributo "controlled" (+ "pointer" para dibujar el cursor) y el.setTime(segundos).
(function () {
  if (customElements.get('fintora-orb')) return;
  const TAU = Math.PI * 2, LOOP = 26, BLEND = 0.8;
  const D = {
    ingresos: 1850000, gastos: 1437620, saldo: 412380, dias: 17,
    cats: [
      { es: 'Vivienda', en: 'Housing', v: 520000, b: 540000, c: '#14b39a' },
      { es: 'Supermercado', en: 'Groceries', v: 298400, b: 320000, c: '#9ccf55' },
      { es: 'Cuotas', en: 'Installments', v: 236900, b: 250000, c: '#2fd38a' },
      { es: 'Transporte', en: 'Transport', v: 142300, b: 180000, c: '#6fe3b4' },
      { es: 'Servicios', en: 'Utilities', v: 122000, b: 130000, c: '#4fd1c5' },
      { es: 'Ocio', en: 'Leisure', v: 118020, b: 100000, c: '#ffb547' },
    ],
  };
  const money = (n) => '$' + Math.round(n).toLocaleString('es-CL');
  const pct = (x) => Math.round(x * 100) + '%';
  const L = {
    es: {
      tabs: ['Saldo del mes', 'Ingresos vs gastos', 'Alertas'], saldo: 'Saldo del mes',
      porDia: (m, d) => `${m} por día · quedan ${d} días`, flujo: 'Gastos sobre ingresos',
      gastaste: (g, i) => `Gastaste ${g} de ${i}`, share: (a, b) => `${a} de tus gastos · ${b} del presupuesto`,
      alerta: 'Alerta de presupuesto', supero: (n, b) => `${n} superó su presupuesto de ${b}`,
      cerca: (n, b) => `${n} está cerca del límite de ${b}`,
    },
    en: {
      tabs: ['Monthly balance', 'Income vs expenses', 'Alerts'], saldo: 'Monthly balance',
      porDia: (m, d) => `${m} per day · ${d} days left`, flujo: 'Expenses vs income',
      gastaste: (g, i) => `You spent ${g} of ${i}`, share: (a, b) => `${a} of your spending · ${b} of budget`,
      alerta: 'Budget alert', supero: (n, b) => `${n} went over its ${b} budget`,
      cerca: (n, b) => `${n} is close to its ${b} limit`,
    },
  };
  // Guion del bucle: [inicio en s, estado]
  const SEQ = [[0, { m: 'saldo' }], [5, { m: 'flujo' }]];
  D.cats.forEach((_, i) => SEQ.push([9.5 + i * 1.8, { m: 'cat', i }]));
  SEQ.push([20.3, { m: 'alerta', i: 0 }], [23.2, { m: 'alerta', i: 1 }]);
  const key = (s) => s.m + (s.i ?? '');
  const ALERT_CAT = [5, 1];

  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixC = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p);
  const css = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => { p = Math.min(1, Math.max(0, p)); return 1 - Math.pow(1 - p, 3); };
  const DEEP = rgb('#06281e'), TEAL = rgb('#14b39a'), LIME = rgb('#9ccf55'), WHITE = rgb('#ffffff');

  function params(s) {
    let dom = '#2fd38a', rc = '#c6ff3d', scale = 1, ring = D.saldo / D.ingresos, over = 0;
    if (s.m === 'flujo') { dom = '#22c493'; rc = '#2fd38a'; scale = 0.95; ring = D.gastos / D.ingresos; }
    if (s.m === 'cat') { const c = D.cats[s.i]; dom = rc = c.c; ring = c.v / D.gastos; scale = 0.74 + 0.26 * Math.sqrt(c.v / D.cats[0].v); }
    if (s.m === 'alerta') { const c = D.cats[ALERT_CAT[s.i]], u = c.v / c.b; dom = rc = s.i ? '#ffb547' : '#ff7a45'; ring = Math.min(u, 1); over = Math.max(u - 1, 0); }
    return { dom: rgb(dom), rc: rgb(rc), scale, ring, over, alert: s.m === 'alerta' ? 1 : 0 };
  }
  function mixP(a, b, p) {
    return { dom: mixC(a.dom, b.dom, p), rc: mixC(a.rc, b.rc, p), scale: lerp(a.scale, b.scale, p), ring: lerp(a.ring, b.ring, p), over: lerp(a.over, b.over, p), alert: lerp(a.alert, b.alert, p) };
  }
  function readout(s, l, lang) {
    if (s.m === 'saldo') return { k: l.saldo, v: D.saldo, u: '$', sub: l.porDia(money(D.saldo / D.dias), D.dias) };
    if (s.m === 'flujo') return { k: l.flujo, v: (D.gastos / D.ingresos) * 100, u: '%', sub: l.gastaste(money(D.gastos), money(D.ingresos)) };
    if (s.m === 'cat') { const c = D.cats[s.i]; return { k: c[lang], v: c.v, u: '$', sub: l.share(pct(c.v / D.gastos), pct(c.v / c.b)) }; }
    const c = D.cats[ALERT_CAT[s.i]];
    return { k: l.alerta, v: (c.v / c.b) * 100, u: '%', sub: (s.i ? l.cerca : l.supero)(c[lang], money(c.b)), warn: 1 };
  }
  function seqAt(t) {
    t = ((t % LOOP) + LOOP) % LOOP;
    let i = 0;
    for (let j = 0; j < SEQ.length; j++) if (SEQ[j][0] <= t) i = j;
    const n = SEQ.length;
    return { t, i, s: SEQ[i][1], p: SEQ[(i - 1 + n) % n][1], since: t - SEQ[i][0], next: SEQ[(i + 1) % n][1], nextAt: i + 1 < n ? SEQ[i + 1][0] : LOOP };
  }
  const el = (tag, style, parent) => { const e = document.createElement(tag); if (style) Object.assign(e.style, style); if (parent) parent.appendChild(e); return e; };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const C1 = TAU * 46, C2 = TAU * 49.5;
  const MONO = "'Geist Mono', ui-monospace, monospace";

  class FintoraOrb extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      this.lang_ = (this.getAttribute('lang') || document.documentElement.lang || 'es').slice(0, 2) === 'en' ? 'en' : 'es';
      this.l = L[this.lang_];
      this.controlled = this.hasAttribute('controlled');
      this.rm = !this.controlled && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build();
      this._ro = new ResizeObserver(() => this._layout());
      this._ro.observe(this);
      this._layout();
      if (this.controlled) { this.setTime(0); return; }
      this.t0 = performance.now(); this.tl = 0; this.last = this.t0; this.manual = null; this.manualUntil = 0;
      this.cur = { s: SEQ[0][1], prevP: params(SEQ[SEQ.length - 1][1]), prevV: null, at: this.t0 - BLEND * 1000 };
      this.cur.prevP = params(SEQ[0][1]);
      this.visible = true;
      this._io = new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) this._loop(); });
      this._io.observe(this);
      this._loop();
    }
    disconnectedCallback() { this._ro && this._ro.disconnect(); this._io && this._io.disconnect(); cancelAnimationFrame(this._raf); }

    _build() {
      Object.assign(this.style, { display: 'block', position: 'relative', height: this.style.height || '100%', color: '#f5f5f0', fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif" });
      this.innerHTML = '';
      const wrap = el('div', { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', boxSizing: 'border-box' }, this);
      this.tabsEl = el('div', { display: 'flex', flexWrap: 'wrap', gap: '6px' }, wrap);
      this.tabs = this.l.tabs.map((txt, i) => {
        const b = el('button', { fontSize: '13.5px', fontWeight: '500', lineHeight: '1', whiteSpace: 'nowrap', fontFamily: 'inherit', padding: '10px 16px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#b4b4ad', cursor: 'pointer', transition: 'background .25s, color .25s, border-color .25s' }, this.tabsEl);
        b.type = 'button'; b.textContent = txt;
        b.addEventListener('click', () => this._pick(i === 0 ? { m: 'saldo' } : i === 1 ? { m: 'flujo' } : { m: 'alerta', i: this.cur && this.cur.s.m === 'alerta' ? 1 - this.cur.s.i : 0 }));
        return b;
      });
      this.stage = el('div', { flex: '1 1 auto', minHeight: '0', display: 'grid', gap: '24px', alignItems: 'center' }, wrap);
      this.orbBox = el('div', { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '0', alignSelf: 'stretch' }, this.stage);
      this.orb = el('div', { position: 'relative', width: '240px', height: '240px', flex: 'none' }, this.orbBox);
      this.glow = el('div', { position: 'absolute', inset: '-28%', borderRadius: '50%', pointerEvents: 'none' }, this.orb);
      this.sphere = el('div', { position: 'absolute', inset: '0', borderRadius: '50%', overflow: 'hidden', isolation: 'isolate' }, this.orb);
      this.blobs = [0, 1, 2, 3].map(() => el('div', { position: 'absolute', width: '78%', height: '78%', borderRadius: '50%', transform: 'translate(-50%,-50%)' }, this.sphere));
      this.hl = el('div', { position: 'absolute', width: '60%', height: '60%', borderRadius: '50%', transform: 'translate(-50%,-50%)' }, this.sphere);
      el('div', { position: 'absolute', inset: '0', borderRadius: '50%', background: 'radial-gradient(circle at 46% 42%, rgba(0,0,0,0) 50%, rgba(2,24,17,.5) 82%, rgba(1,16,11,.85) 100%)' }, this.sphere);
      const svg = sv('svg', { viewBox: '0 0 100 100', fill: 'none' });
      Object.assign(svg.style, { position: 'absolute', inset: '-10%', width: '120%', height: '120%', overflow: 'visible', pointerEvents: 'none' });
      this.orb.appendChild(svg);
      sv('circle', { cx: 50, cy: 50, r: 46, stroke: 'rgba(255,255,255,.09)', 'stroke-width': 0.7 }, svg);
      this.arc = sv('circle', { cx: 50, cy: 50, r: 46, 'stroke-width': 1.5, 'stroke-linecap': 'round', transform: 'rotate(-90 50 50)' }, svg);
      this.arc2 = sv('circle', { cx: 50, cy: 50, r: 49.5, 'stroke-width': 1.5, 'stroke-linecap': 'round', stroke: '#ff5a4e', transform: 'rotate(-90 50 50)' }, svg);

      this.read = el('div', { display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '0' }, this.stage);
      this.rk = el('span', { fontFamily: MONO, fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a8a84' }, this.read);
      this.rv = el('span', { fontSize: '60px', fontWeight: '600', letterSpacing: '-.05em', lineHeight: '.95', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }, this.read);
      this.rs = el('span', { fontSize: '15.5px', lineHeight: '1.5', color: '#b4b4ad', maxWidth: '30ch', textWrap: 'pretty' }, this.read);
      this.live = el('span', { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }, this);
      this.live.setAttribute('role', 'status');

      this.chipsEl = el('div', { display: 'grid', gap: '8px' }, wrap);
      this.chips = D.cats.map((c, i) => {
        const b = el('button', { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '11px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.025)', color: '#f5f5f0', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', minWidth: '0', transition: 'background .25s, border-color .25s' }, this.chipsEl);
        b.type = 'button';
        const top = el('span', { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', fontSize: '14px', fontWeight: '500' }, b);
        el('span', { width: '8px', height: '8px', borderRadius: '50%', background: c.c, flex: 'none' }, top);
        el('span', { flex: '1', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, top).textContent = c[this.lang_];
        if (c.v > c.b) el('span', { fontFamily: MONO, fontSize: '11px', color: '#0a0a0a', background: '#ffb547', borderRadius: '999px', padding: '2px 7px', flex: 'none' }, top).textContent = pct(c.v / c.b);
        el('span', { fontFamily: MONO, fontSize: '13px', color: '#8a8a84' }, b).textContent = money(c.v);
        b.addEventListener('click', () => this._pick({ m: 'cat', i }));
        return b;
      });
      [...this.tabs, ...this.chips].forEach((b) => {
        b.addEventListener('mouseenter', () => { if (b.getAttribute('aria-pressed') !== 'true') b.style.borderColor = 'rgba(198,255,61,.4)'; });
        b.addEventListener('mouseleave', () => { if (b.getAttribute('aria-pressed') !== 'true') b.style.borderColor = b._bc; });
        b.addEventListener('focus', () => { if (b.matches(':focus-visible')) { b.style.outline = '2px solid #c6ff3d'; b.style.outlineOffset = '2px'; } });
        b.addEventListener('blur', () => { b.style.outline = 'none'; });
      });
      if (this.hasAttribute('pointer')) {
        this.ptr = el('div', { position: 'absolute', left: '0', top: '0', width: '0', height: '0', pointerEvents: 'none', zIndex: '5' }, this);
        this.ripple = el('div', { position: 'absolute', borderRadius: '50%', border: '2px solid #c6ff3d', transform: 'translate(-50%,-50%)' }, this.ptr);
        this.arrow = el('div', { position: 'absolute', left: '-3px', top: '-2px', transformOrigin: '3px 2px' }, this.ptr);
        this.arrow.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2.5 L4 19 L8.6 14.8 L11.6 21.5 L14.4 20.3 L11.4 13.7 L17.5 13.7 Z" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.4" stroke-linejoin="round"/></svg>';
      }
    }

    _layout() {
      const w = this.clientWidth;
      if (!w) return;
      const wide = w >= 560;
      this.wide = wide;
      Object.assign(this.stage.style, wide
        ? { gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,.9fr)', gridTemplateRows: 'minmax(0,1fr)' }
        : { gridTemplateColumns: 'minmax(0,1fr)', gridTemplateRows: 'auto auto' });
      this.chipsEl.style.gridTemplateColumns = wide ? 'repeat(3,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))';
      this.orbBox.style.height = wide ? 'auto' : Math.round(Math.min(w * 0.78, 320)) + 'px';
      this.rv.style.fontSize = (wide ? Math.max(44, Math.min(64, w * 0.085)) : Math.max(40, Math.min(56, w * 0.12))) + 'px';
      const S = Math.max(120, Math.min(this.orbBox.clientWidth, this.orbBox.clientHeight) * 0.74);
      this.orb.style.width = this.orb.style.height = Math.round(S) + 'px';
    }

    _pick(s) {
      if (this.controlled) return;
      this.manual = s;
      this.manualUntil = performance.now() + 12000;
      this._set(s, performance.now());
      const r = readout(s, this.l, this.lang_);
      this.live.textContent = `${r.k}: ${r.u === '$' ? money(r.v) : Math.round(r.v) + '%'}. ${r.sub}`;
    }
    _set(s, now) {
      if (key(s) === key(this.cur.s)) return;
      this.cur = { s, prevP: this._shownP || params(this.cur.s), prevV: this._shownV, at: now };
    }
    _loop() {
      cancelAnimationFrame(this._raf);
      const step = (now) => {
        if (!this.visible || !this.isConnected) return;
        const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
        if (this.manual && now > this.manualUntil) this.manual = null;
        if (!this.manual) { this.tl = (this.tl + dt) % LOOP; this._set(seqAt(this.tl).s, now); }
        const since = (now - this.cur.at) / 1000;
        this._render(this.rm ? 0 : (now - this.t0) / 1000, this.cur.s, this.cur.prevP, this.cur.prevV, since);
        this._raf = requestAnimationFrame(step);
      };
      this._raf = requestAnimationFrame(step);
    }

    // Modo video: dibuja exactamente el instante t del bucle.
    setTime(t) {
      const a = seqAt(t);
      const pr = readout(a.p, this.l, this.lang_);
      this._render(a.t, a.s, params(a.p), { v: pr.v, u: pr.u }, a.since);
      if (this.ptr) this._pointer(a);
    }

    _render(t, s, prevP, prevV, since) {
      const p = ease(since / BLEND), P = mixP(prevP, params(s), p);
      this._shownP = P;
      const w = (k) => (TAU * k) / LOOP;
      const breathe = 1 + 0.014 * Math.sin(w(4) * t) + P.alert * 0.02 * Math.sin(TAU * 1.2 * t);
      this.orb.style.transform = `scale(${(P.scale * breathe).toFixed(4)})`;
      const glowA = 0.24 + P.alert * (0.1 + 0.08 * Math.sin(TAU * 1.2 * t));
      this.glow.style.background = `radial-gradient(closest-side, ${css(P.dom, glowA)}, ${css(P.dom, 0)})`;
      this.sphere.style.background = `radial-gradient(circle at 50% 50%, ${css(mixC(P.dom, DEEP, 0.7))} 0%, ${css(DEEP)} 100%)`;
      const cols = [P.dom, mixC(P.dom, TEAL, 0.55), mixC(P.dom, WHITE, 0.3), mixC(P.dom, LIME, 0.55)];
      const orbit = [[1, 2, 0.3, 1.9, 24, 20], [2, 1, 2.2, 0.6, 22, 24], [3, 2, 4.1, 3.3, 18, 16], [1, 3, 5.2, 2.4, 26, 18]];
      this.blobs.forEach((b, j) => {
        const [kx, ky, px, py, ax, ay] = orbit[j];
        b.style.left = (50 + ax * Math.sin(w(kx) * t + px)).toFixed(2) + '%';
        b.style.top = (50 + ay * Math.cos(w(ky) * t + py)).toFixed(2) + '%';
        b.style.background = `radial-gradient(closest-side, ${css(cols[j], 0.95)}, ${css(cols[j], 0)})`;
      });
      this.hl.style.left = (46 + 6 * Math.sin(w(2) * t + 1)).toFixed(2) + '%';
      this.hl.style.top = (50 + 5 * Math.cos(w(1) * t)).toFixed(2) + '%';
      this.hl.style.background = `radial-gradient(closest-side, ${css(mixC(P.dom, WHITE, 0.82), 0.9)}, ${css(mixC(P.dom, WHITE, 0.82), 0)})`;
      this.arc.setAttribute('stroke', css(P.rc));
      this.arc.setAttribute('stroke-dasharray', `${(P.ring * C1).toFixed(2)} ${C1.toFixed(2)}`);
      this.arc2.setAttribute('stroke-dasharray', `${(P.over * C2).toFixed(2)} ${C2.toFixed(2)}`);
      this.arc2.setAttribute('opacity', P.over > 0.005 ? 1 : 0);

      const r = readout(s, this.l, this.lang_);
      const tp = ease(since / 0.9);
      const from = prevV && prevV.u === r.u ? prevV.v : 0;
      const v = lerp(from, r.v, tp);
      this._shownV = { v, u: r.u };
      const op = ease(since / 0.45);
      this.rk.textContent = r.k; this.rs.textContent = r.sub;
      this.rk.style.color = r.warn ? css(P.rc) : '#8a8a84';
      this.rv.textContent = r.u === '$' ? money(v) : Math.round(v) + '%';
      [this.rk, this.rs].forEach((e) => { e.style.opacity = op.toFixed(3); e.style.transform = `translateY(${((1 - op) * 6).toFixed(2)}px)`; });

      const k = key(s);
      const actTab = s.m === 'saldo' ? 0 : s.m === 'flujo' ? 1 : s.m === 'alerta' ? 2 : -1;
      this.tabs.forEach((b, i) => {
        const on = i === actTab;
        b.setAttribute('aria-pressed', on);
        b._bc = 'rgba(255,255,255,.12)';
        Object.assign(b.style, on ? { background: '#c6ff3d', color: '#0a0a0a', borderColor: '#c6ff3d' } : { background: 'transparent', color: '#b4b4ad', borderColor: b.matches(':hover') ? 'rgba(198,255,61,.4)' : b._bc });
      });
      this.chips.forEach((b, i) => {
        const on = s.m === 'cat' && s.i === i;
        b.setAttribute('aria-pressed', on);
        b._bc = 'rgba(255,255,255,.1)';
        Object.assign(b.style, on ? { background: 'rgba(198,255,61,.08)', borderColor: 'rgba(198,255,61,.55)' } : { background: 'rgba(255,255,255,.025)', borderColor: b.matches(':hover') ? 'rgba(198,255,61,.4)' : b._bc });
      });
      this._k = k;
    }

    _target(s) {
      const b = s.m === 'cat' ? this.chips[s.i] : this.tabs[s.m === 'saldo' ? 0 : s.m === 'flujo' ? 1 : 2];
      let x = b.offsetWidth / 2, y = b.offsetHeight / 2, n = b;
      while (n && n !== this) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      if (s.m === 'cat') { x -= b.offsetWidth * 0.18; }
      return [x, y];
    }
    _pointer(a) {
      const cur = this._target(a.s), nxt = this._target(a.next);
      const mv = ease((a.t - (a.nextAt - 1.0)) / 0.75);
      let x = lerp(cur[0], nxt[0], mv), y = lerp(cur[1], nxt[1], mv);
      const arcLift = Math.sin(Math.PI * mv) * 30;
      y -= arcLift;
      const dPrev = a.since, dNext = a.nextAt - a.t;
      const press = Math.max(0, 1 - Math.min(dPrev, dNext) / 0.18);
      this.ptr.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      this.arrow.style.transform = `scale(${(1 - 0.16 * press).toFixed(3)})`;
      const rp = dPrev < 0.6 ? dPrev / 0.6 : 1;
      const R = 6 + rp * 34;
      Object.assign(this.ripple.style, { left: '0', top: '0', width: R * 2 + 'px', height: R * 2 + 'px', opacity: rp < 1 ? (0.7 * (1 - rp)).toFixed(3) : '0' });
    }
  }
  customElements.define('fintora-orb', FintoraOrb);
})();
