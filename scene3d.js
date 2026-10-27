/* MECHLAB 360 - 3D views (Three.js r128). Falls back to the 2D drawings if WebGL is missing. */
(function () {
  if (!window.THREE) return;
  try { const t = document.createElement('canvas'); if (!(t.getContext('webgl') || t.getContext('experimental-webgl'))) return; } catch (e) { return; }
  const num = id => Number(document.getElementById(id).value) || 0, rad = d => d * Math.PI / 180;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(box, build) {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }), el = r.domElement;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    box.appendChild(el);
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'Drag to rotate, scroll to zoom'; box.appendChild(h);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, 1, .1, 100), root = new THREE.Group();
    sc.add(new THREE.AmbientLight(0xffffff, .75));
    const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(5, 8, 6); sc.add(dl); sc.add(root);
    let yaw = .5, pitch = .3, dist = 10, down = false, px = 0, py = 0, auto = !reduce, vis = true;
    el.addEventListener('pointerdown', e => { down = true; auto = false; px = e.clientX; py = e.clientY; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!down) return; yaw += (e.clientX - px) * .01; pitch = Math.max(-.1, Math.min(1.35, pitch + (e.clientY - py) * .01)); px = e.clientX; py = e.clientY; });
    el.addEventListener('pointerup', () => down = false);
    el.addEventListener('wheel', e => { e.preventDefault(); dist = Math.max(6, Math.min(18, dist + e.deltaY * .01)); }, { passive: false });
    const api = build(root);
    const size = () => { const w = box.clientWidth, hh = box.clientHeight; if (!w || !hh) return; r.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); };
    if (window.ResizeObserver) new ResizeObserver(size).observe(box); else window.addEventListener('resize', size);
    size();
    if (window.IntersectionObserver) new IntersectionObserver(e => vis = e[0].isIntersecting).observe(box);
    (function loop() {
      requestAnimationFrame(loop); if (!vis) return;
      if (auto) yaw += .004;
      cam.position.set(dist * Math.sin(yaw) * Math.cos(pitch), dist * Math.sin(pitch) + 1, dist * Math.cos(yaw) * Math.cos(pitch));
      cam.lookAt(0, 1, 0); api.update(); r.render(sc, cam);
    })();
  }

  function arrow(root, color) { const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, .35, .2); root.add(a); return a; }
  function setArrow(a, origin, v) {
    const len = v.length(); a.visible = len > .02; if (!a.visible) return;
    a.position.copy(origin); a.setDirection(v.clone().normalize()); a.setLength(len, Math.min(.35, len * .4), .2);
  }

  // 1) Hero: live 3D force system, driven by Tool 01 inputs
  const heroArt = document.querySelector('.hero-art'), svg = heroArt && heroArt.querySelector('svg');
  if (heroArt) {
    const box = document.createElement('div'); box.className = 'view3d'; heroArt.appendChild(box); if (svg) svg.style.display = 'none';
    mount(box, root => {
      root.add(new THREE.GridHelper(12, 12, 0x3a5878, 0x1f3550));
      const A = [0x7ca7ff, 0x63e6e2, 0xffbd69].map(c => arrow(root, c)), R = arrow(root, 0xffffff), o = new THREE.Vector3(0, .05, 0);
      return { update() {
        let x = 0, y = 0; const k = .12;
        [['f1', 'a1'], ['f2', 'a2'], ['f3', 'a3']].forEach(([f, a], i) => {
          const fx = num(f) * Math.cos(rad(num(a))), fy = num(f) * Math.sin(rad(num(a))); x += fx; y += fy;
          setArrow(A[i], o, new THREE.Vector3(fx * k, fy * k, 0));
        });
        setArrow(R, o, new THREE.Vector3(x * k, y * k, 0));
      } };
    });
  }

  // 2) Friction: a 3D block that slides once the applied force beats limiting friction
  const fc = document.getElementById('frictionCanvas');
  if (fc) {
    const box = document.createElement('div'); box.className = 'view3d small'; fc.parentNode.insertBefore(box, fc); fc.style.display = 'none';
    mount(box, root => {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(14, .3, 6), new THREE.MeshStandardMaterial({ color: 0x263c56 })); floor.position.y = -.15; root.add(floor);
      const blk = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x7ca7ff })); root.add(blk);
      const N = arrow(root, 0xff8585), W = arrow(root, 0xffbd69), P = arrow(root, 0x63e6e2), F = arrow(root, 0xffbd69);
      let off = 0;
      return { update() {
        const m = Math.max(0, num('mass')), mu = Math.max(0, num('mu')), p = num('applied'), n = m * 9.81, lim = mu * n, fr = Math.min(p, lim), s = .6 + Math.min(m, 100) / 100 * .9;
        off = p > lim + 1e-8 ? (off > 4.5 ? -4.5 : off + .04) : 0;
        blk.scale.set(s * 1.3, s, s * 1.3); blk.position.set(off, s / 2, 0);
        const c = new THREE.Vector3(off, s / 2, 0), k = .012, kN = .004;
        setArrow(N, c.clone().setY(s), new THREE.Vector3(0, Math.min(3, n * kN), 0));
        setArrow(W, c.clone().setY(0), new THREE.Vector3(0, -Math.min(3, n * kN), 0));
        setArrow(P, c.clone().add(new THREE.Vector3(s * .65, 0, 0)), new THREE.Vector3(Math.min(5, p * k * 4), 0, 0));
        setArrow(F, c.clone().add(new THREE.Vector3(-s * .65, -s * .3, 0)), new THREE.Vector3(-Math.min(5, fr * k * 4), 0, 0));
      } };
    });
  }
})();
