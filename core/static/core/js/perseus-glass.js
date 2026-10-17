// <perseus-glass variant="stack|crystal" accent="#c6ff3d" active="-1|0|1|2" shift="0">
// Glass 3D hero object. Drag to rotate, follows the pointer with parallax.
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

  class PerseusGlass extends HTMLElement {
    static get observedAttributes() { return ['variant', 'accent', 'active', 'shift']; }
    connectedCallback() {
      if (this._alive) return;
      this._alive = true;
      Object.assign(this.style, { display: 'block', position: 'relative', width: '100%', height: '100%', touchAction: 'pan-y', cursor: 'grab' });
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', 'Objeto 3D de vidrio de Perseus Technology');
      this._host = document.createElement('div');
      this._host.style.cssText = 'position:absolute;inset:0;';
      this.appendChild(this._host);
      if (this._useLite()) { this._renderLite(true); return; }
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
          this._renderLite(true);
        });
      };
      evs.forEach((e) => window.addEventListener(e, go, { passive: true, capture: true }));
      const auto = () => idle(go, { timeout: 2500 });
      if (document.readyState === 'complete') auto(); else window.addEventListener('load', auto, { once: true });
      this._offStart = off;
    }
    disconnectedCallback() { this._alive = false; if (this._offStart) this._offStart(); this._teardown(); }

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
      this.style.cursor = 'default';
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
      this._onUp = () => { this._drag = null; this.style.cursor = 'grab'; };
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
      this._r.render(this._scene, this._cam);
      if (this._watch()) return;
      if (!this._shown) {
        this._shown = true;
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
