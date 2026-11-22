// <perseus-glass variant="stack|crystal" accent="#c6ff3d" active="-1|0|1|2" shift="0" constellation="on|off">
// Glass 3D hero object. Drag to rotate, follows the pointer with parallax.
// variant="crystal": al tocar el cristal (clic, toque, Enter o Espacio) se abre y muestra la constelación de
// Perseo; se cierra con otro toque o con Escape. En la versión liviana (sin WebGL) la constelación es un SVG.
(function () {
  if (customElements.get('perseus-glass')) return;
  const base = 'https://esm.sh/three@0.160.0';
  let libP = null;
  function load() {
    if (!libP) libP = import(base).then(async (T) => {
      let RE = null, RB = null;
      try {
        const [a, b] = await Promise.all([
          import(base + '/examples/jsm/environments/RoomEnvironment.js'),
          import(base + '/examples/jsm/geometries/RoundedBoxGeometry.js'),
        ]);
        RE = a.RoomEnvironment; RB = b.RoundedBoxGeometry;
      } catch (e) {}
      return { T, RE, RB };
    });
    return libP;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const seg = (k, a, b) => ease((k - a) / (b - a));

  // Constelación de Perseo. Coordenadas J2000 del Yale Bright Star Catalogue.
  // [letra de Bayer, nombre propio (IAU), ascensión recta en horas, declinación en grados, magnitud visual]
  const STARS = [
    ['α', 'Mirfak', 3.40538, 49.8612, 1.79],
    ['β', 'Algol', 3.13615, 40.9557, 2.1],
    ['γ', '', 3.07994, 53.5065, 2.93],
    ['δ', '', 3.71541, 47.7876, 3.01],
    ['ε', '', 3.96423, 40.0102, 2.89],
    ['ζ', '', 3.9022, 31.8836, 2.85],
    ['η', 'Miram', 2.84495, 55.8955, 3.76],
    ['θ', '', 2.73666, 49.2285, 4.12],
    ['ι', '', 3.15111, 49.6133, 4.05],
    ['κ', 'Misam', 3.15827, 44.8575, 3.8],
    ['λ', '', 4.10973, 50.3513, 4.29],
    ['μ', '', 4.24829, 48.4093, 4.14],
    ['ν', '', 3.75323, 42.5785, 3.77],
    ['ξ', 'Menkib', 3.98275, 35.791, 4.04],
    ['ο', 'Atik', 3.73865, 32.2882, 3.83],
    ['ρ', 'Gorgonea Tertia', 3.08628, 38.8403, 3.3],
    ['τ', '', 2.90429, 52.7625, 3.95],
    ['ψ', '', 3.60816, 48.1926, 4.23],
    ['48', '', 4.14436, 47.7125, 4.04],
  ];
  // Figura simplificada (como en las cartas de la IAU), ordenada para dibujarse desde Mirfak hacia afuera.
  const LINES = [['α', 'γ'], ['α', 'ι'], ['α', 'ψ'], ['α', 'κ'], ['γ', 'τ'], ['ι', 'θ'], ['ψ', 'δ'], ['κ', 'β'], ['τ', 'η'],
    ['δ', '48'], ['δ', 'ν'], ['β', 'ρ'], ['48', 'μ'], ['ν', 'ε'], ['μ', 'λ'], ['ε', 'ξ'], ['ξ', 'ζ'], ['ζ', 'ο']];
  const IDX = {}; STARS.forEach((st, i) => { IDX[st[0]] = i; });
  const DEPTH = { 'α': 0 }; LINES.forEach(([a, b]) => { DEPTH[b] = DEPTH[a] + 1; });
  const MAXD = Math.max.apply(null, Object.keys(DEPTH).map((k) => DEPTH[k]));
  const INCOMING = {}; LINES.forEach(([, b], i) => { INCOMING[b] = i; });
  const SKY_H = 4.2; // alto de la figura, en unidades de la escena (el cristal mide 3,5)
  const starSize = (m) => 0.12 + 0.43 * Math.pow(10, -0.2 * (m - 1.8));
  const TXT = {
    es: { open: 'Abrir la constelación de Perseo', close: 'Cerrar la constelación de Perseo', hint: 'Toca el cristal', title: 'Perseo', sub: 'La constelación que nos acompaña', back: 'Toca para cerrar' },
    en: { open: 'Open the Perseus constellation', close: 'Close the Perseus constellation', hint: 'Tap the crystal', title: 'Perseus', sub: 'The constellation that accompanies us', back: 'Tap to close' },
  };
  // Proyección al plano: el este queda a la izquierda, como se ve en el cielo. Devuelve [x, y] con `alto` unidades de alto.
  function skyMap(alto) {
    const ra0 = STARS.reduce((a, st) => a + st[2], 0) / STARS.length * 15;
    const raw = STARS.map((st) => [(ra0 - st[2] * 15) * Math.cos(st[3] * Math.PI / 180), st[3]]);
    const xs = raw.map((q) => q[0]), ys = raw.map((q) => q[1]);
    const cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    const sc = alto / (Math.max.apply(null, ys) - Math.min.apply(null, ys));
    return raw.map((q) => [(q[0] - cx) * sc, (q[1] - cy) * sc]);
  }

  class PerseusGlass extends HTMLElement {
    static get observedAttributes() { return ['variant', 'accent', 'active', 'shift']; }
    connectedCallback() {
      if (this._alive) return;
      this._alive = true;
      Object.assign(this.style, { display: 'block', position: 'relative', width: '100%', height: '100%', touchAction: 'pan-y', cursor: 'grab' });
      this._host = document.createElement('div');
      this._host.style.cssText = 'position:absolute;inset:0;';
      this.appendChild(this._host);
      this._interactive = (this.getAttribute('variant') || 'stack') === 'crystal' && this.getAttribute('constellation') !== 'off';
      if (this._interactive) this._initUI();
      else { this.setAttribute('role', 'img'); this.setAttribute('aria-label', 'Objeto 3D de vidrio de Perseus Technology'); }
      if (this._useLite()) { this._lite = true; this._renderLite(true); this._ready(); return; }
      // Mientras llega three.js solo se ve el halo (sin un cristal CSS que después cambie por el 3D).
      // La carga empieza cuando la página terminó de cargar, o antes si el usuario interactúa.
      this._renderLite(false, true);
      const evs = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown'];
      const off = () => evs.forEach((e) => window.removeEventListener(e, go, true));
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 120));
      const go = () => {
        off();
        if (!this._alive || this._started) return;
        this._started = true;
        load().then((lib) => { if (this._alive) { this._lib = lib; idle(() => { if (this._alive) this._setup(); }, { timeout: 800 }); } }).catch((e) => {
          console.warn('perseus-glass', e);
          if (this._liteEl) this._liteEl.remove();
          this._lite = true;
          this._renderLite(true);
          this._ready();
          if (this._open) this._liteSky(true);
        });
      };
      evs.forEach((e) => window.addEventListener(e, go, { passive: true, capture: true }));
      const auto = () => idle(go, { timeout: 2500 });
      if (document.readyState === 'complete') auto(); else window.addEventListener('load', auto, { once: true });
      this._offStart = off;
    }
    disconnectedCallback() { this._alive = false; if (this._offStart) this._offStart(); if (this._offUI) this._offUI(); this._teardown(); }

    // lite="auto" (por defecto): sin 3D en celulares modestos, con ahorro de datos o movimiento reducido.
    // lite="on" fuerza la versión liviana; lite="off" fuerza el 3D. poster="url" usa una imagen en vez del dibujo CSS.
    _useLite() {
      const mode = this.getAttribute('lite') || 'auto';
      if (mode === 'on') return true;
      if (mode === 'off') return false;
      const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
      const c = navigator.connection || {};
      const weak = (navigator.deviceMemory || 8) <= 2 || !!c.saveData || /2g/.test(c.effectiveType || '');
      let gl = true;
      let soft = false;
      try {
        const cv = document.createElement('canvas');
        const ctx = cv.getContext('webgl2') || cv.getContext('webgl');
        gl = !!ctx;
        // Sin GPU real (SwiftShader, llvmpipe…) el vidrio con refracción se calcula en la CPU y congela la página.
        const info = ctx && ctx.getExtension('WEBGL_debug_renderer_info');
        const name = info ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
        soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
        const lose = ctx && ctx.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      } catch (e) { gl = false; }
      return !gl || soft || mq('(prefers-reduced-motion: reduce)') || (mq('(max-width: 767px)') && weak);
    }

    _renderLite(animated, haloOnly) {
      this.style.cursor = this._interactive ? 'pointer' : 'default';
      const a = this.getAttribute('accent') || '#c6ff3d';
      let poster = (this.getAttribute('poster') || '').trim();
      if (!/^(https?:)?\/\//.test(poster) && poster.charAt(0) !== '/') poster = '';
      if (!document.getElementById('pg-lite-kf')) {
        const s = document.createElement('style'); s.id = 'pg-lite-kf';
        s.textContent = '@keyframes pgSpin{to{transform:translate(-50%,-50%) rotateX(72deg) rotateZ(360deg)}}@keyframes pgSpin2{to{transform:translate(-50%,-50%) rotateX(64deg) rotateY(18deg) rotateZ(-360deg)}}@keyframes pgFloat{50%{transform:translate(-50%,-53%)}}@media (prefers-reduced-motion:reduce){.pg-anim{animation:none!important}}';
        document.head.appendChild(s);
      }
      this._liteEl = document.createElement('div');
      this._liteEl.style.cssText = 'position:absolute;inset:0;transition:opacity .6s ease';
      this._host.appendChild(this._liteEl);
      if (haloOnly) {
        this._liteEl.innerHTML = '<div style="position:absolute;left:50%;top:50%;width:min(90%,620px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,' + a + '33,transparent 70%)"></div>';
        return;
      }
      if (poster) { this._liteEl.innerHTML = '<img src="' + poster + '" alt="" width="1200" height="1200" fetchpriority="high" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">'; return; }
      const an = (v) => (animated ? v : 'none');
      const ring = (size, op, anim, w) => '<div class="pg-anim" style="position:absolute;left:50%;top:50%;width:' + size + ';aspect-ratio:1;border-radius:50%;border:' + w + 'px solid ' + a + ';opacity:' + op + ';transform:translate(-50%,-50%) rotateX(72deg);animation:' + an(anim) + '"></div>';
      this._liteEl.innerHTML =
        '<div style="position:absolute;inset:0;perspective:900px;overflow:hidden">' +
        '<div style="position:absolute;left:50%;top:50%;width:min(90%,620px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,' + a + '40,transparent 70%)"></div>' +
        ring('min(78%,520px)', 0.85, 'pgSpin 18s linear infinite', 1.5) +
        ring('min(92%,610px)', 0.3, 'pgSpin2 26s linear infinite', 1) +
        '<div class="pg-anim" style="position:absolute;left:50%;top:50%;width:min(42%,280px);aspect-ratio:1/1.12;transform:translate(-50%,-50%);animation:' + an('pgFloat 6s ease-in-out infinite') + ';clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(135deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.12) 38%,rgba(255,255,255,.04) 50%,rgba(255,255,255,.22) 62%,rgba(255,255,255,.5) 100%),conic-gradient(from 210deg at 50% 50%,rgba(255,255,255,.35),rgba(255,255,255,.05),rgba(255,255,255,.3),rgba(255,255,255,.08),rgba(255,255,255,.35));box-shadow:inset 0 0 40px rgba(255,255,255,.25)">' +
        '<div style="position:absolute;left:50%;top:50%;width:30%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:' + a + ';box-shadow:0 0 60px ' + a + '"></div></div>' +
        '</div>';
    }
    attributeChangedCallback(n) {
      if (!this._r) return;
      if (n === 'variant' || n === 'accent') this._build();
      if (n === 'active') this._active = parseInt(this.getAttribute('active') || '-1', 10);
      if (n === 'shift') this._resize();
    }

    _setup() {
      const { T, RE } = this._lib;
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
      this._minDt = coarse ? 1 / 31 : 0; // 30 fps en celulares y tablets
      const r = this._r = new T.WebGLRenderer({ antialias: dpr < 1.5, alpha: true, powerPreference: 'high-performance' });
      r.setPixelRatio(dpr);
      r.setClearColor(0x000000, 0);
      r.toneMapping = T.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.05;
      r.domElement.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;opacity:0;transform:scale(.94);transition:opacity 1.1s ease,transform 1.4s cubic-bezier(.2,.8,.2,1);';
      this.style.cursor = 'grab';
      this._host.appendChild(r.domElement);
      this._scene = new T.Scene();
      this._cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
      this._cam.position.set(0, 0, 10);
      if (RE) {
        const pm = new T.PMREMGenerator(r);
        this._env = pm.fromScene(new RE(), 0.04).texture;
        this._scene.environment = this._env;
        pm.dispose();
      }
      this._scene.add(new T.AmbientLight(0xffffff, 0.35));
      const key = new T.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 6); this._scene.add(key);
      this._active = parseInt(this.getAttribute('active') || '-1', 10);
      this._yaw = 0; this._pitch = 0; this._vy = 0; this._vp = 0; this._px = 0; this._py = 0; this._tx = 0; this._ty = 0;
      this._build();

      this._onWinMove = (e) => {
        if (this._interactive && !this._drag) this._hover(e);
        const b = this.getBoundingClientRect();
        this._tx = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1.5, 1.5);
        this._ty = clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1.5, 1.5);
        if (this._drag) {
          const dx = e.clientX - this._drag.x, dy = e.clientY - this._drag.y;
          this._drag.x = e.clientX; this._drag.y = e.clientY;
          this._vy = dx * 0.006; this._vp = dy * 0.004;
          this._yaw += this._vy; this._pitch = clamp(this._pitch + this._vp, -0.7, 0.7);
        }
      };
      this._onDown = (e) => { if (e.button !== 0) return; this._drag = { x: e.clientX, y: e.clientY }; this.style.cursor = 'grabbing'; };
      this._onUp = () => { if (!this._drag) return; this._drag = null; this.style.cursor = 'grab'; };
      window.addEventListener('pointermove', this._onWinMove, { passive: true });
      this.addEventListener('pointerdown', this._onDown);
      window.addEventListener('pointerup', this._onUp);
      window.addEventListener('pointercancel', this._onUp);
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
      this._resize();
      this._clock = new T.Clock();
      this._tickB = () => this._tick();
      // Solo dibuja cuando el hero está en pantalla y la pestaña está visible.
      this._vis = true;
      const run = () => { cancelAnimationFrame(this._raf); if (this._vis && !document.hidden) this._raf = requestAnimationFrame(this._tickB); };
      this._io = new IntersectionObserver((es) => { this._vis = es[0].isIntersecting; run(); });
      this._io.observe(this);
      this._onVis = run;
      document.addEventListener('visibilitychange', run);
      run();
    }

    _teardown() {
      cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
      if (this._onVis) document.removeEventListener('visibilitychange', this._onVis);
      if (this._onWinMove) {
        window.removeEventListener('pointermove', this._onWinMove);
        window.removeEventListener('pointerup', this._onUp);
        window.removeEventListener('pointercancel', this._onUp);
        this.removeEventListener('pointerdown', this._onDown);
      }
      this._clear();
      if (this._env) this._env.dispose();
      if (this._r) { this._r.dispose(); this._r.forceContextLoss && this._r.forceContextLoss(); }
      this._r = null;
      if (this._host) this._host.remove();
      if (this._ui) { this._ui.remove(); this._ui = null; this._svg = null; }
    }

    _clear() {
      if (!this._root) return;
      this._root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
      this._scene.remove(this._root);
      this._root = null;
    }

    _glass(extra) {
      const { T } = this._lib;
      return new T.MeshPhysicalMaterial(Object.assign({
        color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1, thickness: 1.1, ior: 1.42,
        envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.35, iridescenceIOR: 1.25,
        specularIntensity: 1,
      }, extra || {}));
    }

    _halo(color, scale, opacity) {
      const { T } = this._lib;
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
      const tex = new T.CanvasTexture(c);
      const s = new T.Sprite(new T.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false }));
      s.scale.set(scale, scale, 1);
      return s;
    }

    _build() {
      const { T, RB } = this._lib;
      this._clear();
      const accent = new T.Color(this.getAttribute('accent') || '#c6ff3d');
      this._accent = accent;
      const root = this._root = new T.Group();
      const obj = this._obj = new T.Group();
      root.add(obj);
      this._scene.add(root);
      const v = this.getAttribute('variant') || 'stack';
      this._variant = v;
      this._parts = [];
      const light = new T.PointLight(accent, 40, 18, 2); light.position.set(0, 0, -2.5); root.add(light);
      const halo = this._halo(accent, v === 'crystal' ? 9 : 8.5, v === 'crystal' ? 0.32 : 0.26);
      halo.position.set(0, 0, -3); root.add(halo);
      this._haloS = halo;

      if (v === 'crystal') {
        const geo = new T.IcosahedronGeometry(1.75, 0);
        const crystal = new T.Mesh(geo, this._glass({ flatShading: true, thickness: 1.6, iridescence: 0.6 }));
        obj.add(crystal);
        const core = new T.Mesh(new T.IcosahedronGeometry(0.55, 1), new T.MeshBasicMaterial({ color: accent }));
        obj.add(core);
        this._core = core;
        const ringMat = new T.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85 });
        const ringMat2 = new T.MeshBasicMaterial({ color: 0xf5f5f0, transparent: true, opacity: 0.35 });
        const r1 = new T.Mesh(new T.TorusGeometry(2.55, 0.012, 6, 128), ringMat); r1.rotation.x = 1.25;
        const r2 = new T.Mesh(new T.TorusGeometry(2.95, 0.008, 6, 128), ringMat2); r2.rotation.set(1.6, 0.5, 0);
        root.add(r1, r2);
        this._rings = [r1, r2];
        const N = 260, pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rad = 2.6 + Math.random() * 2.2;
          const s = Math.sqrt(1 - u * u);
          pos[i * 3] = rad * s * Math.cos(th); pos[i * 3 + 1] = rad * u * 0.7; pos[i * 3 + 2] = rad * s * Math.sin(th);
        }
        const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
        const pts = new T.Points(pg, new T.PointsMaterial({ color: 0xf5f5f0, size: 0.025, transparent: true, opacity: 0.6, sizeAttenuation: true }));
        root.add(pts);
        this._pts = pts;
        this._crystal = crystal;
        this._sky = null;
        if (this._interactive) this._buildSky(root, obj, geo, accent);
        this._size = 6.2;
        this._baseRot = { x: 0.35, y: 0.4 };
      } else {
        const mk = (w, h, d) => RB ? new RB(w, h, d, 6, Math.min(h, d) * 0.42) : new T.BoxGeometry(w, h, d);
        const ys = [1.05, 0, -1.05];
        for (let i = 0; i < 3; i++) {
          const g = new T.Group();
          const slab = new T.Mesh(mk(3.4, 0.5, 2.3), this._glass({ thickness: 0.9 }));
          g.add(slab);
          const plate = new T.Mesh(new T.BoxGeometry(2.6, 0.05, 1.5), new T.MeshBasicMaterial({ color: i === 1 ? accent : new T.Color(0xf5f5f0), transparent: true, opacity: i === 1 ? 1 : 0.55 }));
          g.add(plate);
          const dots = new T.Group();
          for (let k = 0; k < 4; k++) {
            const dmesh = new T.Mesh(new T.BoxGeometry(0.34, 0.08, 0.34), new T.MeshBasicMaterial({ color: accent }));
            dmesh.position.set(-0.95 + k * 0.63, 0.06, 0.45);
            dmesh.visible = false;
            dots.add(dmesh);
          }
          g.add(dots);
          g.position.y = ys[i];
          g.userData = { y: ys[i], plate, dots, k: 0, idx: i };
          obj.add(g);
          this._parts.push(g);
        }
        this._size = 5.4;
        this._baseRot = { x: 0.5, y: -0.62 };
      }
      this._resize();
    }

    // ---------- Constelación de Perseo (solo variant="crystal") ----------
    _txt() { return TXT[(document.documentElement.lang || 'es').slice(0, 2) === 'en' ? 'en' : 'es']; }

    _initUI() {
      const tx = this._txt(), a = this.getAttribute('accent') || '#c6ff3d';
      this._open = false; this._k = 0; this._kE = 0;
      this.setAttribute('role', 'button');
      this.setAttribute('tabindex', '0');
      this.setAttribute('aria-pressed', 'false');
      this.setAttribute('aria-label', tx.open);
      if (!document.getElementById('pg-ui-css')) {
        const st = document.createElement('style'); st.id = 'pg-ui-css';
        st.textContent = 'perseus-glass[role=button]{outline:none;-webkit-tap-highlight-color:transparent}' +
          '.pg-focus{position:absolute;left:50%;top:50%;height:66%;max-width:94%;aspect-ratio:1;transform:translate(-50%,-50%);border:2px solid ' + a + ';border-radius:50%;opacity:0;transition:opacity .2s}' +
          'perseus-glass:focus-visible .pg-focus{opacity:.9}' +
          '.pg-ui{position:absolute;inset:0;pointer-events:none;font-family:"Geist Mono",ui-monospace,monospace}' +
          '.pg-pill{position:absolute;left:50%;bottom:6%;transform:translate(-50%,6px);display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid rgba(255,255,255,.12);border-radius:99px;background:rgba(10,10,10,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#b4b4ad;opacity:0;transition:opacity .6s ease,transform .6s ease;white-space:nowrap}' +
          '.pg-pill.on{opacity:1;transform:translate(-50%,0)}.pg-pill svg{color:' + a + '}' +
          '.pg-cap{position:absolute;left:50%;bottom:5%;transform:translate(-50%,8px);padding:12px 22px 11px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(10,10,10,.62);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);text-align:center;opacity:0;transition:opacity .6s ease,transform .6s ease;white-space:nowrap}' +
          '.pg-cap.on{opacity:1;transform:translate(-50%,0)}' +
          '.pg-cap b{display:block;font-family:Geist,system-ui,sans-serif;font-weight:600;font-size:clamp(22px,2.2vw,30px);letter-spacing:-.03em;color:#f5f5f0}' +
          '.pg-cap span{display:block;margin-top:4px;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#b4b4ad}' +
          '.pg-cap i{display:block;margin-top:8px;font-style:normal;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a84}' +
          '.pg-cap.sm{bottom:3%;padding:8px 16px 7px}.pg-cap.sm b{display:inline;font-size:17px}.pg-cap.sm span{display:none}.pg-cap.sm i{display:inline;margin:0 0 0 12px}' +
          '.pg-lbl{position:absolute;left:0;top:0;font-size:11.5px;letter-spacing:.04em;color:#f5f5f0;opacity:0;white-space:nowrap;transform:translate(-200px,-200px)}' +
          '.pg-lbl em{font-style:normal;color:' + a + ';margin-right:6px}' +
          '.pg-sky{position:absolute;left:50%;top:46%;width:min(78%,72vh,520px);aspect-ratio:1;transform:translate(-50%,-50%);opacity:0;transition:opacity .8s ease}.pg-sky.on{opacity:1}' +
          '.pg-sky line{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .45s ease}.pg-sky.on line{stroke-dashoffset:0}' +
          '@media (prefers-reduced-motion:reduce){.pg-pill,.pg-cap,.pg-sky,.pg-sky line{transition:none!important}}';
        document.head.appendChild(st);
      }
      const ui = this._ui = document.createElement('div');
      ui.className = 'pg-ui';
      ui.setAttribute('aria-hidden', 'true');
      ui.innerHTML = '<div class="pg-focus"></div><div class="pg-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"/></svg>' + tx.hint + '</div>' +
        '<div class="pg-cap"><b>' + tx.title + '</b><span>' + tx.sub + '</span><i>' + tx.back + '</i></div>';
      this.appendChild(ui);
      this._pill = ui.querySelector('.pg-pill');
      this._cap = ui.querySelector('.pg-cap');
      this._lbls = [['α', -12, -24, true], ['β', 14, -8, false]].map(([b, dx, dy, left]) => {
        const el = document.createElement('div');
        el.className = 'pg-lbl';
        el.innerHTML = '<em>' + b + '</em>' + STARS[IDX[b]][1];
        ui.appendChild(el);
        return { el, i: IDX[b], dx, dy, left };
      });
      // Un toque sin arrastre abre o cierra; arrastrar sigue girando el cristal.
      const down = (e) => { this._tap = { x: e.clientX, y: e.clientY, t: performance.now() }; };
      const click = (e) => {
        const d = this._tap; this._tap = null;
        if (d && (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 700)) return;
        if (!this._open && e.detail !== 0 && !this._hit(e)) return;
        this._toggle();
      };
      const key = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggle(); }
        else if (e.key === 'Escape' && this._open) this._toggle(false);
      };
      this.addEventListener('pointerdown', down);
      this.addEventListener('click', click);
      this.addEventListener('keydown', key);
      this._offUI = () => { this.removeEventListener('pointerdown', down); this.removeEventListener('click', click); this.removeEventListener('keydown', key); };
    }

    // ¿El puntero está sobre el cristal? (no sobre el espacio vacío del hero)
    _hit(e) {
      const b = this.getBoundingClientRect();
      let cx = b.left + b.width / 2, cy = b.top + b.height / 2, r = Math.min(b.width, b.height) * 0.38;
      if (this._r && this._cam && this._root) {
        const ppu = b.height / (2 * Math.tan(this._cam.fov * Math.PI / 360) * this._cam.position.z);
        cx += this._root.position.x * ppu; r = 2.1 * ppu;
      }
      return Math.hypot(e.clientX - cx, e.clientY - cy) < r;
    }

    _hover(e) {
      const b = this.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) return;
      this.style.cursor = this._open || this._hit(e) ? 'pointer' : 'grab';
    }

    _toggle(v) {
      const open = typeof v === 'boolean' ? v : !this._open;
      if (open === this._open) return;
      this._open = open;
      const tx = this._txt();
      this.setAttribute('aria-pressed', String(open));
      this.setAttribute('aria-label', open ? tx.close : tx.open);
      if (this._lite) this._liteSky(open);
      this._syncUI();
    }

    _ready() { this._isReady = true; this._syncUI(); }

    _syncUI() {
      if (!this._ui) return;
      if (this._capH !== this.clientHeight) { this._capH = this.clientHeight; this._cap.classList.toggle('sm', this._capH < 560); } // celulares: leyenda en una línea
      this._pill.classList.toggle('on', !!this._isReady && !this._open && (this._lite || this._k < 0.05));
      this._cap.classList.toggle('on', this._open && (this._lite || this._k > 0.55));
    }

    // Versión liviana: la misma figura en SVG sobre el cristal CSS o el póster.
    _liteSky(open) {
      if (!this._svg) {
        const a = this.getAttribute('accent') || '#c6ff3d', P = skyMap(SKY_H), u = 100;
        const xy = (q) => [(q[0] * u).toFixed(1), (-q[1] * u).toFixed(1)];
        let h = '<svg class="pg-sky" viewBox="-260 -250 520 520" aria-hidden="true">';
        LINES.forEach(([p, c]) => {
          const A = xy(P[IDX[p]]), B = xy(P[IDX[c]]);
          h += '<line pathLength="1" x1="' + A[0] + '" y1="' + A[1] + '" x2="' + B[0] + '" y2="' + B[1] + '" stroke="' + a + '" stroke-opacity=".6" stroke-width="1.2" style="transition-delay:' + (DEPTH[p] * 90 + 200) + 'ms"/>';
        });
        STARS.forEach((st, i) => {
          const q = xy(P[i]), z = starSize(st[4]), c = i === 0 ? a : '#f5f5f0';
          h += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (z * 22).toFixed(1) + '" fill="' + c + '" fill-opacity=".14"/>' +
            '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (z * 7).toFixed(1) + '" fill="' + c + '"/>';
        });
        this._lbls.forEach((L) => {
          const q = xy(P[L.i]);
          h += '<text x="' + (+q[0] + L.dx) + '" y="' + (+q[1] + L.dy + 12) + '"' + (L.left ? ' text-anchor="end"' : '') + ' fill="#f5f5f0" font-size="13" font-family="Geist Mono, ui-monospace, monospace"><tspan fill="' + a + '">' + STARS[L.i][0] + '</tspan> ' + STARS[L.i][1] + '</text>';
        });
        this._ui.insertAdjacentHTML('afterbegin', h + '</svg>');
        this._svg = this._ui.querySelector('.pg-sky');
        void this._svg.getBoundingClientRect();
      }
      requestAnimationFrame(() => { if (this._svg) this._svg.classList.toggle('on', open); });
      if (this._liteEl) { this._liteEl.style.transition = 'opacity .6s ease'; this._liteEl.style.opacity = open ? '0.12' : '1'; }
    }

    _dotTex() {
      const { T } = this._lib;
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.16, 'rgba(255,255,255,.9)');
      grd.addColorStop(0.38, 'rgba(255,255,255,.16)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      return new T.CanvasTexture(c);
    }

    _buildSky(root, obj, geo, accent) {
      const { T } = this._lib;
      // Las 20 caras del cristal como piezas sueltas: al abrir se separan, giran y se achican.
      const shards = new T.Group(); shards.visible = false;
      const mat = this._glass({ flatShading: true, thickness: 1.6, iridescence: 0.6, side: T.DoubleSide });
      const pa = geo.attributes.position;
      for (let i = 0; i + 2 < pa.count; i += 3) {
        const v = [0, 1, 2].map((j) => new T.Vector3().fromBufferAttribute(pa, i + j));
        const c = v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1 / 3);
        const g = new T.BufferGeometry().setFromPoints(v.map((x) => x.clone().sub(c)));
        g.computeVertexNormals();
        const m = new T.Mesh(g, mat);
        m.position.copy(c);
        m.userData = { c, dir: c.clone().normalize(), ax: new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), sp: 1.5 + Math.random() * 2 };
        shards.add(m);
      }
      obj.add(shards);
      // Estrellas (sprites) y la figura (líneas que crecen desde Mirfak).
      const sky = new T.Group(); sky.visible = false;
      const tex = this._dotTex(), P = skyMap(SKY_H);
      const stars = STARS.map((st, i) => {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, color: i === 0 ? accent : new T.Color(0xf5f5f0), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
        const z = starSize(st[4]);
        sp.scale.set(z, z, 1);
        sp.userData = { to: new T.Vector3(P[i][0], P[i][1], (((i * 37) % 7) - 3) * 0.08), a: 0 };
        sp.position.copy(sp.userData.to);
        sky.add(sp);
        return sp;
      });
      const pos = new Float32Array(LINES.length * 6);
      const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(pos, 3));
      const lines = new T.LineSegments(lg, new T.LineBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false }));
      lines.frustumCulled = false;
      sky.add(lines);
      sky.position.y = 0.12;
      root.add(sky);
      this._sky = { shards, sky, stars, lines, pos, tmp: new T.Vector3() };
    }

    _animSky(t) {
      const S = this._sky;
      const dt = Math.min(0.1, Math.max(0, t - (this._skyT == null ? t : this._skyT))); this._skyT = t;
      this._k = this._open ? Math.min(1, this._k + dt / 1.8) : Math.max(0, this._k - dt / 1.1);
      const k = this._k, kE = this._kE = ease(k), opening = k > 0.001;
      // 1) El cristal se abre en piezas.
      this._crystal.visible = !opening;
      const e = seg(k, 0, 0.55);
      S.shards.visible = opening && e < 0.999;
      if (S.shards.visible) {
        S.shards.children.forEach((m) => {
          const u = m.userData;
          m.position.copy(u.c).addScaledVector(u.dir, e * 2.6);
          m.setRotationFromAxisAngle(u.ax, e * u.sp);
          m.scale.setScalar(Math.max(0.001, 1 - e));
        });
      }
      // 2) El núcleo se apaga y Mirfak nace en el centro; luego se dibuja la figura.
      this._core.scale.multiplyScalar(Math.max(0.001, 1 - seg(k, 0.05, 0.4)));
      S.sky.visible = k > 0.15;
      if (S.sky.visible) {
        const lp = seg(k, 0.45, 1), mE = seg(k, 0.18, 0.55);
        S.stars.forEach((sp, i) => {
          const u = sp.userData, b = STARS[i][0];
          if (i === 0) { sp.position.copy(u.to).multiplyScalar(mE); u.a = seg(k, 0.15, 0.32); }
          else { const L = LINES[INCOMING[b]]; u.a = ease(((clamp(lp * MAXD - DEPTH[L[0]], 0, 1)) - 0.7) / 0.3); }
          let tw = 0.88 + 0.12 * Math.sin(t * 2.1 + i * 1.7);
          if (b === 'β') { const ph = (t % 5.7) / 5.7; if (ph > 0.82) tw *= 1 - 0.6 * Math.sin((ph - 0.82) / 0.18 * Math.PI); } // Algol, la estrella que "parpadea"
          sp.material.opacity = u.a * tw;
        });
        const A = S.tmp;
        LINES.forEach(([a, b], i) => {
          const p = ease(clamp(lp * MAXD - DEPTH[a], 0, 1));
          A.copy(S.stars[IDX[a]].position);
          const B = S.stars[IDX[b]].userData.to, o = i * 6;
          S.pos[o] = A.x; S.pos[o + 1] = A.y; S.pos[o + 2] = A.z;
          S.pos[o + 3] = A.x + (B.x - A.x) * p; S.pos[o + 4] = A.y + (B.y - A.y) * p; S.pos[o + 5] = A.z + (B.z - A.z) * p;
        });
        S.lines.geometry.attributes.position.needsUpdate = true;
        S.lines.material.opacity = 0.55 * seg(k, 0.45, 0.6);
        S.sky.rotation.set(this._py * 0.12, this._px * 0.25 + Math.sin(t * 0.25) * 0.06, 0);
      }
      // 3) Los anillos se abren y quedan casi de frente, como un marco.
      const r1 = this._rings[0], r2 = this._rings[1];
      r1.rotation.x = 1.25 - kE * 0.95; r2.rotation.x = 1.6 - kE * 1.2; r2.rotation.y = 0.5 * (1 - kE);
      r1.scale.setScalar(1 + kE * 0.06); r2.scale.setScalar(1 + kE * 0.02);
      this._pts.material.opacity = 0.6 - kE * 0.3;
      this._syncUI();
      this._placeLabels(k);
    }

    _placeLabels(k) {
      const show = k > 0.001 && this._sky && this._sky.sky.visible;
      if (!show && !this._lblOn) return;
      this._lblOn = show;
      const w = this.clientWidth, h = this.clientHeight, v = this._sky.tmp;
      this._lbls.forEach((L) => {
        if (!show) { L.el.style.opacity = '0'; return; }
        const sp = this._sky.stars[L.i];
        sp.getWorldPosition(v).project(this._cam);
        const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
        L.el.style.transform = 'translate(' + (x + L.dx).toFixed(1) + 'px,' + (y + L.dy).toFixed(1) + 'px)' + (L.left ? ' translateX(-100%)' : '');
        L.el.style.opacity = String(sp.userData.a * seg(k, 0.5, 0.75));
      });
    }

    _resize() {
      if (!this._r) return;
      const w = Math.max(1, this.clientWidth), h = Math.max(1, this.clientHeight);
      this._r.setSize(w, h, false);
      const aspect = w / h;
      this._cam.aspect = aspect;
      const vfov = this._cam.fov * Math.PI / 180;
      const need = (this._size || 5.5) / Math.min(1, aspect);
      this._cam.position.z = need / (2 * Math.tan(vfov / 2)) * 1.05;
      this._cam.updateProjectionMatrix();
      const shift = parseFloat(this.getAttribute('shift') || '0') || 0;
      if (this._root) {
        const halfW = Math.tan(vfov / 2) * this._cam.position.z * aspect;
        this._root.position.x = shift * halfW;
      }
    }

    _tick() {
      if (!this._vis || document.hidden) return;
      this._raf = requestAnimationFrame(this._tickB);
      if (!this._r || !this._root) return;
      const t = this._clock.getElapsedTime();
      if (this._minDt && t - (this._lastT || 0) < this._minDt) return;
      this._lastT = t;
      if (!this._drag) { this._yaw += this._vy; this._pitch = clamp(this._pitch + this._vp, -0.7, 0.7); this._vy *= 0.94; this._vp *= 0.9; this._pitch *= 0.985; }
      this._px += (this._tx - this._px) * 0.05; this._py += (this._ty - this._py) * 0.05;
      const br = this._baseRot;
      if (this._variant === 'crystal') {
        this._obj.rotation.set(br.x + this._pitch + this._py * 0.25, br.y + this._yaw + t * 0.18 + this._px * 0.4, 0);
        this._core.rotation.y = -t * 0.6;
        const s = 1 + Math.sin(t * 2) * 0.06; this._core.scale.set(s, s, s);
        this._rings[0].rotation.z = t * 0.25; this._rings[1].rotation.z = -t * 0.15;
        this._pts.rotation.y = t * 0.03 + this._px * 0.1;
        this._root.rotation.x = this._py * 0.08;
        if (this._sky) this._animSky(t);
      } else {
        this._obj.rotation.set(br.x + this._pitch + this._py * 0.18, br.y + this._yaw + this._px * 0.35 + Math.sin(t * 0.3) * 0.08, 0);
        this._parts.forEach((g, i) => {
          const u = g.userData;
          const on = this._active === i ? 1 : 0;
          u.k += (on - u.k) * 0.08;
          g.position.y = u.y + Math.sin(t * 1.1 + i * 1.3) * 0.06 + (i === 0 ? 1 : i === 2 ? -1 : 0) * u.k * 0.35;
          g.position.x = u.k * 0.9;
          u.plate.material.opacity = (i === 1 ? 1 : 0.55) + u.k * 0.45;
          if (i !== 1) u.plate.material.color.copy(new this._lib.T.Color(0xf5f5f0)).lerp(this._accent, u.k);
          u.dots.children.forEach((d, k) => { d.visible = u.k > 0.5; d.position.y = 0.06 + Math.max(0, Math.sin(t * 3 + k)) * 0.12 * u.k; });
        });
      }
      this._haloS.material.opacity = (this._variant === 'crystal' ? 0.3 : 0.24) + Math.sin(t * 1.4) * 0.04;
      if (this._sky) this._haloS.material.opacity *= 1 - 0.45 * (this._kE || 0);
      this._r.render(this._scene, this._cam);
      if (this._watch()) return;
      if (!this._shown) {
        this._shown = true;
        this._ready();
        const cv = this._r.domElement;
        requestAnimationFrame(() => { cv.style.opacity = '1'; cv.style.transform = 'none'; });
        if (this._liteEl) { this._liteEl.style.transition = 'opacity 1.4s ease'; this._liteEl.style.opacity = '0'; const el = this._liteEl; setTimeout(() => el.remove(), 1500); this._liteEl = null; }
      }
    }
  }
  // Calidad adaptable: si el equipo no sostiene ~20 fps, baja la resolución (una sola vez, sin cambiar de versión).
  PerseusGlass.prototype._watch = function () {
    const now = performance.now();
    const p = this._perf || (this._perf = { n: 0, sum: 0, last: now, done: false });
    const dt = now - p.last; p.last = now;
    if (p.done || this._drag || document.hidden || dt > 250) return false; // >250 ms: pestaña o ventana en pausa
    p.n++;
    if (p.n <= 12) return false; // compilación de shaders
    p.sum += dt;
    if (p.n < 52) return false;
    const avg = p.sum / 40;
    p.done = true;
    if (avg > 50 && this._r.getPixelRatio() > 1) { this._r.setPixelRatio(1); this._resize(); }
    return false;
  };
  customElements.define('perseus-glass', PerseusGlass);
})();