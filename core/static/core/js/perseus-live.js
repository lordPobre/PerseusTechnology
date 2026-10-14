// perseus-live.js · Demos interactivas para las páginas de servicio. Sin dependencias.
// <perseus-field>  fondo de puntos que reacciona al cursor
// <perseus-code>   Desarrollo Web: código Django que construye un sitio en vivo
// <perseus-dash>   Apps: panel de flujo de caja con datos de ejemplo
// <perseus-infra>  Soporte TI: monitor de infraestructura; clic en un nodo simula una falla
(function () {
  if (customElements.get('perseus-field')) return;
  const ACID = '#c6ff3d', BONE = '#f5f5f0', MUTE = '#8a8a84', RED = '#ff5a4e', AMBER = '#ffb547';
  const MONO = "'Geist Mono', ui-monospace, monospace", SANS = "'Geist', system-ui, sans-serif";
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const st = document.createElement('style');
  st.textContent = '@keyframes plPulse{0%,100%{box-shadow:0 0 0 0 rgba(198,255,61,.55)}50%{box-shadow:0 0 0 6px rgba(198,255,61,0)}}@keyframes plBlink{50%{opacity:0}}@keyframes plIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}';
  document.head.appendChild(st);

  const h = (tag, style, html) => { const e = document.createElement(tag); if (style) e.style.cssText = style; if (html != null) e.innerHTML = html; return e; };
  const clp = (n) => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('es-CL');
  const fit = (c) => { const d = Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect(); c.width = Math.max(1, Math.round(r.width * d)); c.height = Math.max(1, Math.round(r.height * d)); const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return { w: r.width, h: r.height, g }; };
  const FRAME = 'position:relative;display:flex;flex-direction:column;width:100%;height:100%;border-radius:24px;border:1px solid rgba(255,255,255,.1);background:rgba(14,14,14,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.45);font-family:' + SANS + ';color:' + BONE;
  const DOT = '<i style="display:block;width:7px;height:7px;border-radius:9px;background:' + ACID + ';animation:plPulse 2s infinite"></i>';
  const bar = (title, right) => h('div', 'display:flex;align-items:center;gap:12px;height:44px;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.07);flex:none',
    '<span style="display:flex;gap:6px"><i style="display:block;width:10px;height:10px;border-radius:9px;background:#333"></i><i style="display:block;width:10px;height:10px;border-radius:9px;background:#333"></i><i style="display:block;width:10px;height:10px;border-radius:9px;background:#333"></i></span>' +
    '<span style="font-family:' + MONO + ';font-size:11.5px;color:' + MUTE + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + title + '</span>' +
    '<span style="margin-left:auto;display:flex;align-items:center;gap:8px;font-family:' + MONO + ';font-size:11px;color:' + MUTE + ';white-space:nowrap">' + right + '</span>');

  class Base extends HTMLElement {
    connectedCallback() {
      if (this._on) return;
      this._on = true; this._timers = [];
      this.style.display = 'block'; this.style.width = '100%'; this.style.height = '100%';
      this.build();
      this._io = new IntersectionObserver((es) => { this._vis = es[es.length - 1].isIntersecting; if (this._vis) this._kick(); }, { threshold: 0.02 });
      this._io.observe(this);
      if (this.resize) { this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(this); }
    }
    disconnectedCallback() {
      this._on = false;
      if (this._io) this._io.disconnect();
      if (this._ro) this._ro.disconnect();
      cancelAnimationFrame(this._raf); this._raf = 0;
      this._timers.forEach(clearInterval);
      if (this.teardown) this.teardown();
      this.innerHTML = '';
    }
    every(ms, fn) { this._timers.push(setInterval(() => { if (this._vis && this._on) fn(); }, ms)); }
    _kick() {
      if (this._raf || !this.tick) return;
      const f = (t) => { this._raf = 0; if (!this._on || !this._vis) return; this.tick(t); this._raf = requestAnimationFrame(f); };
      this._raf = requestAnimationFrame(f);
    }
  }

  /* ---------- Fondo ---------- */
  class Field extends Base {
    build() {
      const m = 'radial-gradient(85% 85% at 65% 40%, #000 25%, transparent 80%)';
      Object.assign(this.style, { position: 'absolute', inset: '0', width: 'auto', height: 'auto', pointerEvents: 'none', overflow: 'hidden', maskImage: m, webkitMaskImage: m });
      this.c = h('canvas', 'display:block;width:100%;height:100%');
      this.appendChild(this.c);
      this.mx = this.my = this.tx = this.ty = -1e4;
      this._mv = (e) => { const b = this.getBoundingClientRect(); this.tx = e.clientX - b.left; this.ty = e.clientY - b.top; if (this.mx < -5000) { this.mx = this.tx; this.my = this.ty; } };
      window.addEventListener('pointermove', this._mv, { passive: true });
    }
    teardown() { window.removeEventListener('pointermove', this._mv); }
    resize() { this.v = fit(this.c); }
    tick(t) {
      if (!this.v) return;
      const { w, h: H, g } = this.v, T = RM ? 0 : t / 1000, s = 34, R = 190;
      this.mx += (this.tx - this.mx) * 0.12; this.my += (this.ty - this.my) * 0.12;
      g.clearRect(0, 0, w, H);
      for (let y = s / 2; y < H; y += s) for (let x = s / 2; x < w; x += s) {
        const dx = x - this.mx, dy = y - this.my, d = Math.hypot(dx, dy) || 1, k = Math.max(0, 1 - d / R);
        const wv = (Math.sin(x * 0.011 + T * 0.7) + Math.sin(y * 0.014 - T * 0.5)) * 0.25 + 0.5;
        const z = 1.1 + k * 2.4 + wv * 0.5, px = x + (dx / d) * k * 16, py = y + (dy / d) * k * 16;
        g.fillStyle = k > 0.02 ? 'rgba(198,255,61,' + (0.15 + k * 0.75).toFixed(3) + ')' : 'rgba(245,245,240,' + (0.05 + wv * 0.1).toFixed(3) + ')';
        g.fillRect(px - z / 2, py - z / 2, z, z);
      }
    }
  }

  /* ---------- Desarrollo Web ---------- */
  const CODE = [
    "{% extends 'base.html' %}",
    '<nav class="flex justify-between">',
    '  <a href="/">tu-empresa</a>',
    '  <a class="btn" href="/cotizar/">Cotizar</a>',
    '</nav>',
    '<section class="hero">',
    '  <h1>{{ titulo }}</h1>',
    '  <p>{{ bajada }}</p>',
    '</section>',
    '<div class="grid grid-cols-3 gap-4">',
    '  {% for p in productos %}',
    "    {% include 'card.html' %}",
    '  {% endfor %}',
    '</div>',
    '<form method="post" action="/pagar/">',
    '  {% csrf_token %}',
    '  <button>Pagar</button>',
    '</form>',
  ];
  const REVEAL = { 4: 'nav', 8: 'hero', 13: 'cards', 17: 'pay' };
  const RANGES = { nav: [1, 4], hero: [5, 8], cards: [9, 13], pay: [14, 17] };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const TOK = /(\{%.*?%\}|\{\{.*?\}\})|("[^"]*"|'[^']*')|(<\/?[a-z0-9]+|\/?>)|([a-z-]+)(?==)/g;
  const hl = (s) => {
    let o = '', i = 0, m; TOK.lastIndex = 0;
    while ((m = TOK.exec(s))) {
      o += esc(s.slice(i, m.index));
      o += '<span style="color:' + (m[1] ? ACID : m[2] ? '#d8ff74' : m[3] ? BONE : MUTE) + '">' + esc(m[0]) + '</span>';
      i = TOK.lastIndex;
    }
    return o + esc(s.slice(i));
  };
  const CARET = '<span style="display:inline-block;width:7px;height:14px;margin-left:1px;vertical-align:-2px;background:' + ACID + ';animation:plBlink 1s steps(1) infinite"></span>';

  class Code extends Base {
    build() {
      const root = h('div', FRAME);
      root.appendChild(bar('templates/tienda/home.html', DOT + 'runserver'));
      const body = h('div', 'flex:1;min-height:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));grid-auto-rows:minmax(0,1fr)');
      this.ed = h('div', 'padding:14px 0;font-family:' + MONO + ';font-size:12px;line-height:1.75;color:#b4b4ad;overflow:hidden;white-space:pre;border-right:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07)');
      this.lines = CODE.map((_, i) => {
        const l = h('div', 'display:flex;gap:14px;padding:0 14px;transition:background .2s', '<span style="width:18px;text-align:right;color:#4a4a46;flex:none">' + (i + 1) + '</span><span></span>');
        this.ed.appendChild(l); return l;
      });
      const pv = h('div', 'display:flex;padding:14px;min-height:0');
      const site = h('div', 'flex:1;display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:14px;background:#f5f5f0;color:#0a0a0a;overflow:hidden;font-family:' + SANS);
      pv.appendChild(site);
      const blk = (k, html, extra) => {
        const b = h('div', 'opacity:.07;transform:translateY(6px);transition:opacity .5s,transform .5s,box-shadow .2s;border-radius:8px;cursor:default;' + (extra || ''), html);
        b.addEventListener('pointerenter', () => { this.mark(k, true); b.style.boxShadow = '0 0 0 2px #0a0a0a'; });
        b.addEventListener('pointerleave', () => { this.mark(k, false); b.style.boxShadow = 'none'; });
        site.appendChild(b); return b;
      };
      const bars = (w) => '<div style="height:6px;width:' + w + ';border-radius:4px;background:#d6d6cf"></div>';
      this.blocks = {
        nav: blk('nav', '<div style="display:flex;align-items:center;justify-content:space-between;padding:2px"><b style="font-size:12px;letter-spacing:-.02em">tu-empresa</b><span style="padding:5px 10px;border-radius:99px;background:#0a0a0a;color:' + ACID + ';font-size:10px;font-weight:600">Cotizar</span></div>'),
        hero: blk('hero', '<div style="font-weight:600;font-size:22px;line-height:1;letter-spacing:-.045em">Tu tienda,<br>rápida y propia.</div><div style="display:flex;flex-direction:column;gap:5px;margin-top:9px">' + bars('72%') + bars('48%') + '</div>', 'padding:4px 2px'),
        cards: blk('cards', '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">' + ['24.990', '18.500', '32.000'].map((p) => '<div style="display:flex;flex-direction:column;gap:5px;padding:6px;border-radius:8px;background:#e9e9e2"><div style="aspect-ratio:1/.8;border-radius:6px;background:#d2d2ca"></div><div style="height:5px;width:80%;border-radius:3px;background:#c2c2ba"></div><b style="font-size:10px">$' + p + '</b></div>').join('') + '</div>'),
        pay: blk('pay', '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:#0a0a0a;color:#f5f5f0;font-size:11px"><span>Total · 3 productos</span><b style="color:' + ACID + '">Pagar →</b></div>', 'margin-top:auto'),
      };
      body.append(this.ed, pv);
      const sc = h('div', 'flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid rgba(255,255,255,.07)');
      this.rings = ['Rendimiento', 'Accesibilidad', 'Prácticas', 'SEO'].map((t, i) => {
        const c = h('div', 'display:flex;align-items:center;gap:9px;padding:11px 12px;min-width:0;' + (i ? 'border-left:1px solid rgba(255,255,255,.07)' : ''),
          '<svg width="32" height="32" viewBox="0 0 36 36" style="flex:none;transform:rotate(-90deg)"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3"></circle><circle cx="18" cy="18" r="15" fill="none" stroke="' + ACID + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="94.25" style="stroke-dashoffset:94.25"></circle></svg>' +
          '<span style="display:flex;flex-direction:column;line-height:1.15;min-width:0"><b style="font-size:15px;font-weight:600">0</b><span style="font-size:10.5px;color:' + MUTE + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t + '</span></span>');
        sc.appendChild(c);
        return { arc: c.querySelectorAll('circle')[1], num: c.querySelector('b') };
      });
      root.append(body, sc);
      this.appendChild(root);
      this.reset();
      if (RM) { CODE.forEach((_, i) => { this.li = i; this.ci = 0; this.finishLine(); }); this.score(); return; }
      this.every(26, () => this.step());
    }
    reset() {
      this.li = 0; this.ci = 0; this.hold = 0; this.done = false;
      this.lines.forEach((l) => { l.lastChild.innerHTML = ''; });
      Object.values(this.blocks).forEach((b) => { b.style.opacity = '.07'; b.style.transform = 'translateY(6px)'; });
      this.rings.forEach((r) => { r.arc.style.transition = 'none'; r.arc.style.strokeDashoffset = '94.25'; r.num.textContent = '0'; });
      this.ed.scrollTop = 0;
    }
    finishLine() {
      this.lines[this.li].lastChild.innerHTML = hl(CODE[this.li]);
      const k = REVEAL[this.li];
      if (k) { this.blocks[k].style.opacity = '1'; this.blocks[k].style.transform = 'none'; }
    }
    step() {
      if (this.hold > 0) { this.hold--; if (!this.hold && this.done) this.reset(); return; }
      const L = CODE[this.li];
      this.ci = Math.min(L.length, this.ci + 2);
      this.lines[this.li].lastChild.innerHTML = hl(L.slice(0, this.ci)) + CARET;
      const ln = this.lines[this.li];
      this.ed.scrollTop = Math.max(0, ln.offsetTop - this.ed.clientHeight + 48);
      if (this.ci >= L.length) {
        this.finishLine();
        this.li++; this.ci = 0; this.hold = 3;
        if (this.li >= CODE.length) { this.score(); this.done = true; this.hold = 190; }
      }
    }
    score() {
      [99, 100, 100, 100].forEach((v, i) => {
        const r = this.rings[i];
        r.arc.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1) ' + (i * 0.12) + 's';
        r.arc.style.strokeDashoffset = String(94.25 * (1 - v / 100));
        let n = 0;
        const iv = setInterval(() => { n = Math.min(v, n + 3); r.num.textContent = n; if (n >= v) clearInterval(iv); }, 28);
        this._timers.push(iv);
      });
    }
    mark(k, on) { const [a, b] = RANGES[k]; for (let i = a; i <= b; i++) this.lines[i].style.background = on ? 'rgba(198,255,61,.09)' : 'transparent'; }
  }

  /* ---------- Apps ---------- */
  const TX = [
    ['Pago cliente · Factura 1043', 'Ventas', 1240000], ['Arriendo oficina', 'Fijos', -850000], ['Licencias Microsoft 365', 'Software', -64900],
    ['Transferencia recibida', 'Ventas', 560000], ['Combustible flota', 'Operación', -92300], ['Honorarios diseño', 'Servicios', -380000],
    ['Venta e-commerce #2281', 'Ventas', 47990], ['Cuenta de luz', 'Fijos', -71200],
  ];
  class Dash extends Base {
    build() {
      const root = h('div', FRAME);
      root.appendChild(bar('app · flujo de caja', DOT + 'datos de ejemplo'));
      const body = h('div', 'flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;padding:16px');
      const top = h('div', 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap', '<b style="font-size:17px;font-weight:600;letter-spacing:-.02em">Flujo de caja</b>');
      const seg = h('div', 'display:flex;gap:2px;padding:3px;border-radius:99px;background:rgba(255,255,255,.06)');
      this.segs = ['Mes', 'Trimestre'].map((t, i) => { const b = h('button', '', t); b.type = 'button'; b.addEventListener('click', () => this.setRange(i)); seg.appendChild(b); return b; });
      top.appendChild(seg);
      const kp = h('div', 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px');
      this.kpi = [['Ingresos', ACID], ['Egresos', BONE], ['Saldo proyectado', BONE]].map(([t, c]) => {
        const k = h('div', 'padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.045);min-width:0', '<div style="font-size:11px;color:' + MUTE + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t + '</div><div style="font-size:clamp(14px,1.4vw,19px);font-weight:600;letter-spacing:-.03em;margin-top:3px;color:' + c + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">$0</div>');
        kp.appendChild(k); return { el: k.lastChild, v: 0, to: 0 };
      });
      const cw = h('div', 'position:relative;flex:1;min-height:110px');
      this.c = h('canvas', 'position:absolute;inset:0;width:100%;height:100%;cursor:crosshair');
      this.tip = h('div', 'position:absolute;top:0;left:0;pointer-events:none;padding:6px 9px;border-radius:9px;background:#f5f5f0;color:#0a0a0a;font:500 11px ' + MONO + ';white-space:nowrap;opacity:0;transition:opacity .15s');
      cw.append(this.c, this.tip);
      this.c.addEventListener('pointermove', (e) => { const b = this.c.getBoundingClientRect(); this.hx = e.clientX - b.left; });
      this.c.addEventListener('pointerleave', () => { this.hx = null; });
      this.feed = h('div', 'flex:none;display:flex;flex-direction:column;height:122px;overflow:hidden;border-top:1px solid rgba(255,255,255,.07);padding-top:6px');
      body.append(top, kp, cw, this.feed);
      root.appendChild(body);
      this.appendChild(root);
      this.setRange(0);
      for (let i = 0; i < 4; i++) this.push(false);
      this.every(2300, () => this.push(true));
    }
    setRange(i) {
      this.range = i;
      this.segs.forEach((b, j) => { b.style.cssText = 'border:0;cursor:pointer;padding:5px 12px;border-radius:99px;font:500 12px ' + SANS + ';' + (j === i ? 'background:#f5f5f0;color:#0a0a0a' : 'background:transparent;color:' + BONE); });
      const n = i ? 13 : 30; let s = 4.2e6, seed = i ? 7 : 3;
      const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      this.data = Array.from({ length: n }, () => (s += (rnd() - 0.4) * (i ? 1.5e6 : 5.2e5)));
      this.cut = Math.round((n - 1) * 0.68);
      this.prog = 0;
      this.base = i ? [38.4e6, 29.1e6] : [12.8e6, 9.6e6];
      this.setK();
    }
    setK() { this.kpi[0].to = this.base[0]; this.kpi[1].to = this.base[1]; this.kpi[2].to = this.data[this.data.length - 1]; }
    push(anim) {
      this.ti = ((this.ti || 0) + 1) % TX.length;
      const t = TX[this.ti];
      const r = h('div', 'display:flex;align-items:center;gap:10px;padding:6px 0;font-size:12.5px;border-bottom:1px solid rgba(255,255,255,.05);flex:none;' + (anim && !RM ? 'animation:plIn .45s ease-out' : ''),
        '<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t[0] + '</span><span style="padding:2px 8px;border-radius:99px;background:rgba(255,255,255,.06);font-size:10.5px;color:#cfcfc8;flex:none">' + t[1] + '</span><b style="font:500 12px ' + MONO + ';min-width:84px;text-align:right;flex:none;color:' + (t[2] > 0 ? ACID : BONE) + '">' + (t[2] > 0 ? '+' : '') + clp(t[2]) + '</b>');
      this.feed.prepend(r);
      while (this.feed.children.length > 5) this.feed.lastChild.remove();
      if (anim) { if (t[2] > 0) this.base[0] += t[2]; else this.base[1] -= t[2]; this.data[this.data.length - 1] += t[2]; this.setK(); }
    }
    resize() { this.v = fit(this.c); }
    tick() {
      this.kpi.forEach((k) => { k.v += (k.to - k.v) * (RM ? 1 : 0.08); k.el.textContent = clp(k.v); });
      if (!this.v) return;
      this.prog = Math.min(1, this.prog + (RM ? 1 : 0.022));
      const { w, h: H, g } = this.v, d = this.data, n = d.length, pad = 4, base = H - 18;
      const mn = Math.min(...d) * 0.9, mx = Math.max(...d) * 1.04;
      const X = (i) => pad + (i / (n - 1)) * (w - pad * 2), Y = (v) => base - ((v - mn) / (mx - mn)) * (base - 10);
      g.clearRect(0, 0, w, H);
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
      for (let k = 0; k < 4; k++) { const y = 8 + k * (base - 8) / 3; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      const upto = this.prog * (n - 1);
      const pts = [];
      for (let i = 0; i <= Math.min(Math.floor(upto), this.cut); i++) pts.push([X(i), Y(d[i])]);
      if (pts.length > 1) {
        const grd = g.createLinearGradient(0, 0, 0, base); grd.addColorStop(0, 'rgba(198,255,61,.22)'); grd.addColorStop(1, 'rgba(198,255,61,0)');
        g.beginPath(); g.moveTo(pts[0][0], base); pts.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(pts[pts.length - 1][0], base); g.closePath(); g.fillStyle = grd; g.fill();
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.strokeStyle = ACID; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
      }
      if (upto > this.cut) {
        g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(this.cut), Y(d[this.cut]));
        for (let i = this.cut + 1; i <= Math.floor(upto); i++) g.lineTo(X(i), Y(d[i]));
        g.strokeStyle = 'rgba(245,245,240,.6)'; g.lineWidth = 1.5; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X(this.cut), 6); g.lineTo(X(this.cut), base); g.stroke();
        g.setLineDash([]);
      }
      g.font = '10px ' + MONO; g.fillStyle = MUTE;
      g.fillText('hoy', X(this.cut) - 9, H - 3);
      g.textAlign = 'right'; g.fillText('proyección', w - pad, H - 3); g.textAlign = 'left';
      if (this.hx != null) {
        const i = Math.max(0, Math.min(n - 1, Math.round(((this.hx - pad) / (w - pad * 2)) * (n - 1)))), x = X(i), y = Y(d[i]);
        g.strokeStyle = 'rgba(245,245,240,.25)'; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, base); g.stroke();
        g.beginPath(); g.arc(x, y, 4, 0, 7); g.fillStyle = i > this.cut ? BONE : ACID; g.fill();
        this.tip.textContent = (this.range ? 'Semana ' : 'Día ') + (i + 1) + ' · ' + clp(d[i]) + (i > this.cut ? ' · proy.' : '');
        const tw = this.tip.offsetWidth;
        this.tip.style.transform = 'translate(' + Math.max(0, Math.min(w - tw, x + 10)) + 'px,' + Math.max(0, y - 34) + 'px)';
        this.tip.style.opacity = '1';
      } else this.tip.style.opacity = '0';
    }
  }

  /* ---------- Soporte TI ---------- */
  const NODES = [['Usuarios', 0.09, 0.5], ['Firewall', 0.3, 0.5], ['Servidor app', 0.56, 0.24], ['Microsoft 365', 0.56, 0.76], ['Base de datos', 0.84, 0.24], ['Respaldos', 0.84, 0.76]];
  const EDGES = [[0, 1], [1, 2], [1, 3], [2, 4], [4, 5], [2, 5]];
  const FIX = { 1: 'activando firewall de respaldo fw-02', 2: 'reiniciando contenedor en srv-app-02', 3: 'redirigiendo correo por ruta secundaria', 4: 'conmutando a réplica db-replica-02', 5: 'reintentando en almacenamiento secundario' };
  const LOGS = ['[OK] respaldo db-prod completado · 4,2 GB', '[OK] parche de seguridad aplicado · srv-app-01', '[OK] certificado SSL renovado', '[INFO] 312 usuarios activos en Microsoft 365', '[OK] escaneo de vulnerabilidades · 0 críticas', '[OK] réplica de base de datos sincronizada', '[INFO] CPU srv-app-01 · 34%'];
  class Infra extends Base {
    build() {
      const root = h('div', FRAME);
      root.appendChild(bar('monitor · 24/7', DOT + 'en línea'));
      const stats = h('div', 'flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;align-items:center;border-bottom:1px solid rgba(255,255,255,.07)');
      this.st = ['Uptime', 'Latencia', 'Incidentes'].map((t, i) => {
        const s = h('div', 'padding:10px 16px;min-width:0;' + (i ? 'border-left:1px solid rgba(255,255,255,.07)' : ''), '<div style="font-size:11px;color:' + MUTE + '">' + t + '</div><div style="font-size:18px;font-weight:600;letter-spacing:-.03em;margin-top:2px;transition:color .3s">—</div>');
        stats.appendChild(s); return s.lastChild;
      });
      this.btn = h('button', 'margin:0 12px;padding:8px 14px;border-radius:99px;border:1px solid rgba(255,90,78,.5);background:transparent;color:' + BONE + ';font:500 12px ' + SANS + ';cursor:pointer;white-space:nowrap', 'Simular falla');
      this.btn.type = 'button';
      this.btn.addEventListener('click', () => this.incident(4));
      stats.appendChild(this.btn);
      this.st[0].textContent = '99,9%'; this.st[2].textContent = '0';
      const cw = h('div', 'position:relative;flex:1;min-height:150px');
      this.c = h('canvas', 'position:absolute;inset:0;width:100%;height:100%');
      this.tip = h('div', 'position:absolute;top:0;left:0;pointer-events:none;padding:7px 10px;border-radius:10px;background:#f5f5f0;color:#0a0a0a;font:500 11px/1.45 ' + MONO + ';white-space:nowrap;opacity:0;transition:opacity .15s');
      cw.append(this.c, this.tip);
      this.c.addEventListener('pointermove', (e) => { const b = this.c.getBoundingClientRect(); this.hx = e.clientX - b.left; this.hy = e.clientY - b.top; });
      this.c.addEventListener('pointerleave', () => { this.hx = null; });
      this.c.addEventListener('click', () => { if (this.hov > 0) this.incident(this.hov); });
      this.log = h('div', 'flex:none;height:128px;overflow:hidden;padding:10px 16px;border-top:1px solid rgba(255,255,255,.07);font-family:' + MONO + ';font-size:11.5px;line-height:1.75;color:#b4b4ad;display:flex;flex-direction:column;justify-content:flex-end');
      root.append(stats, cw, this.log);
      this.appendChild(root);
      this.state = NODES.map(() => ({ s: 'ok', load: 0.18 + Math.random() * 0.4 }));
      this.pk = []; this.lat = 14; this.hov = -1;
      LOGS.slice(0, 4).forEach((l) => this.line(l, false));
      this.li = 4;
      this.every(1700, () => { if (!this.busy) this.line(LOGS[this.li++ % LOGS.length], true); });
      this.every(800, () => {
        this.lat = Math.max(8, Math.min(26, this.lat + (Math.random() - 0.5) * 4));
        if (!this.busy) this.st[1].textContent = Math.round(this.lat) + ' ms';
        this.state.forEach((s) => { s.load = Math.max(0.08, Math.min(0.9, s.load + (Math.random() - 0.5) * 0.08)); });
      });
    }
    line(t, anim) {
      const tag = t.match(/^\[[^\]]+\]/)[0];
      const c = tag === '[OK]' ? ACID : tag === '[ALERTA]' ? RED : tag === '[AUTO]' ? AMBER : MUTE;
      const r = h('div', 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none;' + (anim && !RM ? 'animation:plIn .35s ease-out' : ''),
        '<span style="color:#55554f">' + new Date().toTimeString().slice(0, 8) + '</span> <span style="color:' + c + '">' + tag + '</span>' + esc(t.slice(tag.length)));
      this.log.appendChild(r);
      while (this.log.children.length > 6) this.log.firstChild.remove();
    }
    incident(i) {
      if (this.busy || !FIX[i]) return;
      this.busy = true; this.btn.disabled = true; this.btn.style.opacity = '.4';
      const t0 = performance.now(), name = NODES[i][0];
      this.state[i].s = 'down';
      this.st[2].textContent = '1'; this.st[2].style.color = RED; this.st[1].textContent = '—';
      this.line('[ALERTA] ' + name.toLowerCase() + ' sin respuesta', true);
      setTimeout(() => { if (!this._on) return; this.state[i].s = 'heal'; this.line('[AUTO] ' + FIX[i], true); }, 1300);
      setTimeout(() => {
        if (!this._on) return;
        this.state[i].s = 'ok';
        this.line('[OK] servicio restablecido en ' + ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s · ingeniero notificado', true);
        this.st[2].textContent = '0'; this.st[2].style.color = '';
        this.busy = false; this.btn.disabled = false; this.btn.style.opacity = '';
      }, 2900);
    }
    resize() { this.v = fit(this.c); }
    tick(t) {
      if (!this.v) return;
      const { w, h: H, g } = this.v;
      const P = NODES.map((n) => [n[1] * w, n[2] * (H - 14)]);
      const col = (s) => (s === 'down' ? RED : s === 'heal' ? AMBER : ACID);
      g.clearRect(0, 0, w, H);
      EDGES.forEach(([a, b]) => {
        const bad = this.state[a].s !== 'ok' || this.state[b].s !== 'ok';
        g.strokeStyle = bad ? 'rgba(255,90,78,.4)' : 'rgba(255,255,255,.12)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(P[a][0], P[a][1]); g.lineTo(P[b][0], P[b][1]); g.stroke();
      });
      if (!RM && Math.random() < 0.28) this.pk.push({ e: Math.floor(Math.random() * EDGES.length), t: 0, dir: Math.random() < 0.62 ? 1 : -1, sp: 0.008 + Math.random() * 0.012 });
      this.pk = this.pk.filter((p) => {
        p.t += p.sp;
        if (p.t >= 1) return false;
        const [a, b] = EDGES[p.e], from = p.dir > 0 ? a : b, to = p.dir > 0 ? b : a, down = this.state[to].s === 'down' || this.state[from].s === 'down';
        if (down && p.t > 0.8) return false;
        const x = P[from][0] + (P[to][0] - P[from][0]) * p.t, y = P[from][1] + (P[to][1] - P[from][1]) * p.t;
        g.fillStyle = down ? RED : ACID; g.shadowColor = g.fillStyle; g.shadowBlur = 8;
        g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); g.shadowBlur = 0;
        return true;
      });
      this.hov = -1;
      P.forEach((p, i) => {
        const s = this.state[i].s, c = col(s), r = 15, near = this.hx != null && Math.hypot(this.hx - p[0], this.hy - p[1]) < 26;
        if (near) this.hov = i;
        const pulse = RM ? 0.5 : (Math.sin(t / 420 + i) + 1) / 2;
        g.beginPath(); g.arc(p[0], p[1], r + 6 + pulse * 4, 0, 7);
        g.strokeStyle = s === 'ok' ? 'rgba(198,255,61,' + (0.08 + pulse * 0.12).toFixed(3) + ')' : c; g.lineWidth = s === 'ok' ? 1 : 1.5; g.stroke();
        g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fillStyle = near ? '#202020' : '#121212'; g.fill();
        g.strokeStyle = c; g.lineWidth = 1.5; g.stroke();
        g.beginPath(); g.arc(p[0], p[1], 4, 0, 7); g.fillStyle = c; g.fill();
        g.font = '10.5px ' + MONO; g.textAlign = 'center'; g.fillStyle = s === 'ok' ? '#cfcfc8' : c;
        g.fillText(NODES[i][0], p[0], p[1] + r + 16); g.textAlign = 'left';
      });
      this.c.style.cursor = this.hov > 0 && !this.busy ? 'pointer' : 'default';
      if (this.hov >= 0) {
        const s = this.state[this.hov], p = P[this.hov];
        this.tip.innerHTML = '<b>' + NODES[this.hov][0] + '</b> · ' + (s.s === 'ok' ? 'operativo' : s.s === 'down' ? 'sin respuesta' : 'recuperando') + '<br>CPU ' + Math.round(s.load * 100) + '%' + (this.hov > 0 && !this.busy ? ' · clic para simular falla' : '');
        const tw = this.tip.offsetWidth;
        this.tip.style.transform = 'translate(' + Math.max(0, Math.min(w - tw, p[0] + 22)) + 'px,' + Math.max(0, p[1] - 46) + 'px)';
        this.tip.style.opacity = '1';
      } else this.tip.style.opacity = '0';
    }
  }

  customElements.define('perseus-field', Field);
  customElements.define('perseus-code', Code);
  customElements.define('perseus-dash', Dash);
  customElements.define('perseus-infra', Infra);
})();
