/* ===== purakan — バーチャル AI フロア  (modern IT office) ===== */
(function () {
  const app = document.getElementById('app');

  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2f38);
  scene.fog = new THREE.Fog(0x2a2f38, 110, 230);

  const camera = new THREE.PerspectiveCamera(41, window.innerWidth / window.innerHeight, 0.1, 700);
  camera.position.set(58, 50, 66);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 1);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 34; controls.maxDistance = 190;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.36;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  window.__cam = camera; window.__ctl = controls;

  // ---------- lights: bright, even, office-grade ----------
  scene.add(new THREE.HemisphereLight(0xe8eefa, 0x6e747c, 0.62));
  const key = new THREE.DirectionalLight(0xffffff, 0.72);
  key.position.set(40, 66, 34); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const S = 48;
  key.shadow.camera.left = -S; key.shadow.camera.right = S;
  key.shadow.camera.top = S; key.shadow.camera.bottom = -S;
  key.shadow.camera.near = 1; key.shadow.camera.far = 190; key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdce6f5, 0.3); fill.position.set(-44, 34, -26); scene.add(fill);

  // ---------- helpers ----------
  const world = new THREE.Group(); scene.add(world);
  const rand = () => Math.random();
  function mat(color, o) {
    o = o || {};
    return new THREE.MeshStandardMaterial({
      color, roughness: o.rough === undefined ? 0.85 : o.rough,
      metalness: o.metal === undefined ? 0 : o.metal,
      emissive: o.emissive || 0x000000, emissiveIntensity: o.emi === undefined ? 1 : o.emi,
      transparent: !!o.transparent, opacity: o.opacity === undefined ? 1 : o.opacity,
      side: o.side || THREE.FrontSide,
    });
  }
  function box(p, w, h, d, color, x, y, z, o) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, o));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    if (o && o.ry) m.rotation.y = o.ry; if (o && o.rx) m.rotation.x = o.rx;
    p.add(m); return m;
  }
  function cyl(p, rt, rb, h, color, x, y, z, o) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, (o && o.seg) || 16), mat(color, o));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    if (o && o.rx) m.rotation.x = o.rx;
    p.add(m); return m;
  }

  // ---------- palette ----------
  const FW = 66, FD = 46;
  const C = {
    floorA: 0x6c7178, floorB: 0x63686f, walk: 0x787d85,   // grey matte carpet tiles
    wall: 0xdcdfe4, wallSoft: 0xd0d4d9, mullion: 0x373c44,
    deskTop: 0x33383f, deskWhite: 0xe9ecef, alu: 0x9aa1a9,
    chair: 0x2b3037, chairMesh: 0x3d444d,
    glass: 0xbcd6e8, dark: 0x1d222a,
    brand: 0xd88a4a, brandDeep: 0xb96f36,
    blue: 0x3d8bd6, green: 0x35b87a, violet: 0x8b6fd8,
  };

  // ---------- floor: grey matte carpet tiles ----------
  box(world, FW + 1.2, 1, FD + 1.2, 0x585d66, 0, -0.5, 0, { rough: 1 });   // slab edge
  const tn = 3.2, nx = Math.round(FW / tn), nz = Math.round(FD / tn);
  const tileGeo = new THREE.BoxGeometry(tn * 0.985, 0.2, tn * 0.985);
  const tA = mat(C.floorA, { rough: 1 }), tB = mat(C.floorB, { rough: 1 });
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const m = new THREE.Mesh(tileGeo, (i + j) % 2 ? tA : tB);
    m.position.set(-FW / 2 + tn / 2 + i * tn, 0.1, -FD / 2 + tn / 2 + j * tn);
    m.receiveShadow = true; world.add(m);
  }
  // subtle lighter walkway (no more castle carpet)
  box(world, 7, 0.06, FD - 3, C.walk, 0, 0.21, 0, { rough: 1 });
  box(world, FW - 4, 0.06, 6.5, C.walk, 0, 0.21, 1, { rough: 1 });

  // ---------- shell: light walls + floor-to-ceiling glazing ----------
  const northGroup = new THREE.Group(); world.add(northGroup);
  const westGroup = new THREE.Group(); world.add(westGroup);
  function glazing(g, horizontal, span, at, y0, h) {
    // sky panel + dark mullions, reads as a curtain wall
    const n = Math.round(span / 5.5);
    for (let i = 0; i < n; i++) {
      const t = -span / 2 + span / n * (i + 0.5);
      const px = horizontal ? t : at, pz = horizontal ? at : t;
      const w = horizontal ? span / n - 0.35 : 0.22, d = horizontal ? 0.22 : span / n - 0.35;
      box(g, w, h, d, 0xcfe6f7, px, y0 + h / 2, pz, { emissive: 0xa8d2ef, emi: 0.62, rough: 0.15, metal: 0.1 });
      const mw = horizontal ? 0.28 : 0.3, md = horizontal ? 0.3 : 0.28;
      const e = horizontal ? span / n / 2 : 0, f = horizontal ? 0 : span / n / 2;
      box(g, mw, h, md, C.mullion, px - e, y0 + h / 2, pz - f, { rough: 0.5, metal: 0.3 });
    }
    const bw = horizontal ? span : 0.34, bd = horizontal ? 0.34 : span;
    box(g, bw, 0.35, bd, C.mullion, horizontal ? 0 : at, y0, horizontal ? at : 0, { rough: 0.5, metal: 0.3 });
    box(g, bw, 0.35, bd, C.mullion, horizontal ? 0 : at, y0 + h, horizontal ? at : 0, { rough: 0.5, metal: 0.3 });
  }
  // north: solid base + glazing above
  box(northGroup, FW, 15, 0.6, C.wall, 0, 7.5, -FD / 2, { rough: 0.95 });
  glazing(northGroup, true, FW - 2, -FD / 2 + 0.45, 4.4, 8.6);
  box(northGroup, FW, 0.5, 0.9, C.wallSoft, 0, 0.25, -FD / 2 + 0.2, { rough: 0.9 });
  // west
  box(westGroup, 0.6, 15, FD, C.wall, -FW / 2, 7.5, 0, { rough: 0.95 });
  glazing(westGroup, false, FD - 2, -FW / 2 + 0.45, 4.4, 8.6);
  box(westGroup, 0.9, 0.5, FD, C.wallSoft, -FW / 2 + 0.2, 0.25, 0, { rough: 0.9 });

  // ---------- ceiling: linear LED bars ----------
  // slim recessed light lines — kept thin so they never read as ceiling beams
  [-21, -10.5, 10.5, 21].forEach(x => {
    box(world, 0.5, 0.14, FD - 12, 0xf6f9ff, x, 14.2, 0, { emissive: 0xffffff, emi: 0.9, rough: 0.4 });
  });
  [[-16, 12], [16, 12], [-16, -12], [16, -12]].forEach(p => {
    const pl = new THREE.PointLight(0xffffff, 0.32, 44, 2); pl.position.set(p[0], 12.4, p[1]); world.add(pl);
  });

  // ---------- canvas textures ----------
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function labelSprite(title, sub, color) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 240; const g = c.getContext('2d');
    const x = 26, y = 40, w = 460, h = 136, r = 26;
    g.fillStyle = 'rgba(255,255,255,0.97)'; roundRect(g, x, y, w, h, r); g.fill();
    g.fillStyle = color; roundRect(g, x, y, 9, h, 5); g.fill();
    g.fillStyle = color; g.beginPath(); g.moveTo(240, y + h); g.lineTo(272, y + h); g.lineTo(256, y + h + 28); g.closePath(); g.fill();
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = '#232830'; g.font = 'bold 56px "Hiragino Sans","Yu Gothic",sans-serif'; g.fillText(title, x + 34, y + 54);
    g.fillStyle = color; g.font = '700 25px Arial'; g.fillText(sub, x + 36, y + 102);
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sp.scale.set(9.2, 4.3, 1); return sp;
  }
  // dev-workstation screen: code editor + chart, cool tones with brand accent
  function screenTexture(kind) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d');
    g.fillStyle = '#121821'; g.fillRect(0, 0, 512, 320);
    g.fillStyle = '#0d131b'; g.fillRect(0, 0, 512, 30);
    ['#e0655c', '#e0b24a', '#4fbf72'].forEach((cc, i) => { g.fillStyle = cc; g.beginPath(); g.arc(20 + i * 20, 15, 6, 0, 7); g.fill(); });
    if (kind === 1) {
      g.fillStyle = '#0e141d'; g.fillRect(0, 30, 92, 290);
      for (let i = 0; i < 9; i++) { g.fillStyle = '#2a3442'; g.fillRect(12, 48 + i * 26, 62 - (i % 3) * 14, 9); }
      const cols = ['#6fb0e8', '#d88a4a', '#8fd6a8', '#b79ae8', '#7d8a9c'];
      for (let i = 0; i < 10; i++) {
        let x = 108 + (i % 3) * 14;
        for (let k = 0; k < 3 + (i % 3); k++) { g.fillStyle = cols[(i + k) % cols.length]; const w = 26 + ((i * 7 + k * 13) % 60); g.fillRect(x, 50 + i * 26, w, 10); x += w + 10; }
      }
    } else if (kind === 2) {
      g.strokeStyle = '#243040'; g.lineWidth = 2;
      for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(30, 40 + i * 54); g.lineTo(486, 40 + i * 54); g.stroke(); }
      const bars = [70, 110, 88, 150, 128, 176, 158];
      bars.forEach((b, i) => { const x = 44 + i * 62; g.fillStyle = '#2f6fc4'; g.fillRect(x, 288 - b, 40, b); g.fillStyle = '#5f97e0'; g.fillRect(x, 288 - b, 40, 7); });
      g.strokeStyle = C_HEX_BRAND; g.lineWidth = 4; g.beginPath();
      const pts = [58, 82, 66, 124, 140, 182, 196];
      pts.forEach((p, i) => { const x = 44 + i * 62 + 20, y = 288 - p; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      g.fillStyle = '#aebdd0'; g.font = 'bold 22px Arial'; g.fillText('ANALYTICS', 32, 58);
    } else {
      g.fillStyle = '#0e141d'; g.fillRect(20, 46, 220, 250); g.fillStyle = '#0e141d'; g.fillRect(256, 46, 236, 120); g.fillStyle = '#0e141d'; g.fillRect(256, 178, 236, 118);
      g.fillStyle = '#2f6fc4'; g.fillRect(34, 62, 120, 12); g.fillStyle = C_HEX_BRAND; g.fillRect(34, 84, 76, 12);
      for (let i = 0; i < 6; i++) { g.fillStyle = '#26313f'; g.fillRect(34, 110 + i * 28, 150 - (i % 3) * 30, 10); }
      g.fillStyle = '#4fbf72'; for (let i = 0; i < 7; i++) g.fillRect(272 + i * 30, 150 - (i % 4) * 22, 18, 10 + (i % 4) * 22);
      g.strokeStyle = '#6fb0e8'; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i < 9; i++) { const x = 268 + i * 27, y = 250 - Math.abs(Math.sin(i * 0.9)) * 55; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    }
    return new THREE.CanvasTexture(c);
  }
  const C_HEX_BRAND = '#d88a4a';
  const screenTex = [screenTexture(1), screenTexture(2), screenTexture(3)];

  // dashboard wall (behind PM)
  function dashTexture() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
    g.fillStyle = '#141a23'; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#1b2230'; roundRect(g, 30, 30, 470, 210, 12); g.fill();
    roundRect(g, 524, 30, 470, 210, 12); g.fill();
    roundRect(g, 30, 272, 964, 210, 12); g.fill();
    g.fillStyle = '#8fa3bd'; g.font = 'bold 26px Arial';
    g.fillText('THROUGHPUT', 56, 70); g.fillText('CONVERSION', 550, 70); g.fillText('PIPELINE', 56, 312);
    const bars = [88, 140, 108, 176, 150, 196, 172, 210];
    bars.forEach((b, i) => { const x = 60 + i * 54; g.fillStyle = '#2f6fc4'; g.fillRect(x, 226 - b, 34, b); g.fillStyle = '#5f97e0'; g.fillRect(x, 226 - b, 34, 6); });
    g.strokeStyle = C_HEX_BRAND; g.lineWidth = 5; g.beginPath();
    const pts = [70, 96, 82, 140, 158, 190, 178, 206];
    pts.forEach((p, i) => { const x = 554 + i * 54, y = 226 - p; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    g.fillStyle = C_HEX_BRAND; pts.forEach((p, i) => { const x = 554 + i * 54; g.beginPath(); g.arc(x, 226 - p, 7, 0, 7); g.fill(); });
    const segs = [[0.34, '#2f6fc4'], [0.26, '#d88a4a'], [0.2, '#4fbf72'], [0.2, '#8b6fd8']];
    let cx0 = 60; segs.forEach(s => { const w = 904 * s[0]; g.fillStyle = s[1]; roundRect(g, cx0, 360, w - 8, 46, 8); g.fill(); cx0 += w; });
    g.fillStyle = '#9fb2c9'; g.font = '600 22px Arial'; g.fillText('Q3 · live', 60, 452);
    return new THREE.CanvasTexture(c);
  }

  // purakan logos
  function logoCanvas(withText) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
    const O = '#cf8a52', bx = 176, by = 116, bw = 160, bh = 214, br = 16;
    g.fillStyle = O; roundRect(g, bx, by, bw, bh, br); g.fill();
    g.fillStyle = '#e2ab7c'; g.beginPath(); g.ellipse(bx + bw / 2, by, bw / 2, 26, 0, 0, 7); g.fill();
    g.fillStyle = '#f3ddc7'; g.beginPath(); g.ellipse(bx + bw / 2, by, bw / 2 - 11, 16, 0, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; roundRect(g, bx + 12, by + 110, bw - 24, 88, 12); g.fill();
    g.fillStyle = O; roundRect(g, bx + bw / 2 - 28, by + 124, 56, 58, 13); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', bx + bw / 2, by + 155);
    if (withText) {
      g.fillStyle = '#232830'; g.font = 'bold 92px "Hiragino Sans","Yu Gothic",sans-serif'; g.fillText('ぷらかん', 256, 396);
      g.fillStyle = '#6a707a'; g.font = '600 40px Arial'; g.fillText('purakan', 256, 460);
    }
    return c;
  }
  const logoTex = new THREE.CanvasTexture(logoCanvas(true));
  const logoTexIcon = new THREE.CanvasTexture(logoCanvas(false));
  const logoWideTex = (function () {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 480; const g = c.getContext('2d');
    const O = '#cf8a52', bx = 92, by = 128, bw = 150, bh = 200, br = 15;
    g.fillStyle = O; roundRect(g, bx, by, bw, bh, br); g.fill();
    g.fillStyle = '#e2ab7c'; g.beginPath(); g.ellipse(bx + bw / 2, by, bw / 2, 24, 0, 0, 7); g.fill();
    g.fillStyle = '#f3ddc7'; g.beginPath(); g.ellipse(bx + bw / 2, by, bw / 2 - 10, 15, 0, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; roundRect(g, bx + 11, by + 103, bw - 22, 82, 11); g.fill();
    g.fillStyle = O; roundRect(g, bx + bw / 2 - 26, by + 115, 52, 54, 12); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 50px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', bx + bw / 2, by + 144);
    g.textAlign = 'left';
    g.fillStyle = '#232830'; g.font = 'bold 132px "Hiragino Sans","Yu Gothic",sans-serif'; g.fillText('ぷらかん', 310, 208);
    g.fillStyle = '#8a9098'; g.font = '600 62px Arial'; g.fillText('purakan', 316, 316);
    return new THREE.CanvasTexture(c);
  })();

  // ---------- people ----------
  // Every figure is built from one config so each person can differ: hair style,
  // skirt vs trousers, jacket lapels, glasses, headphones, face expression.
  const figures = [];

  function faceTexture(o) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
    const ink = o.ink || '#33241c';
    // brows
    if (o.brows) {
      g.strokeStyle = 'rgba(51,36,28,0.72)'; g.lineWidth = 3.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(36, 38); g.lineTo(56, o.brows === 'sharp' ? 34 : 37);
      g.moveTo(92, 38); g.lineTo(72, o.brows === 'sharp' ? 34 : 37); g.stroke();
    }
    // eyes
    g.fillStyle = ink;
    if (o.eyes === 'lash') {
      g.beginPath(); g.ellipse(46, 58, 8, 9, 0, 0, 7); g.ellipse(82, 58, 8, 9, 0, 0, 7); g.fill();
      g.strokeStyle = ink; g.lineWidth = 3.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(35, 51); g.lineTo(30, 47); g.moveTo(93, 51); g.lineTo(98, 47); g.stroke();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(43, 55, 2.6, 0, 7); g.arc(79, 55, 2.6, 0, 7); g.fill();
    } else if (o.eyes === 'calm') {
      g.lineWidth = 4.5; g.strokeStyle = ink; g.lineCap = 'round';
      g.beginPath(); g.moveTo(38, 58); g.lineTo(54, 58); g.moveTo(74, 58); g.lineTo(90, 58); g.stroke();
    } else {
      g.beginPath(); g.arc(46, 58, 7.5, 0, 7); g.arc(82, 58, 7.5, 0, 7); g.fill();
      if (o.eyes === 'bright') { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(43.5, 55, 2.4, 0, 7); g.arc(79.5, 55, 2.4, 0, 7); g.fill(); }
    }
    // blush
    if (o.blush) { g.fillStyle = 'rgba(233,138,140,0.5)'; g.beginPath(); g.ellipse(30, 74, 9, 5.5, 0, 0, 7); g.ellipse(98, 74, 9, 5.5, 0, 0, 7); g.fill(); }
    // mouth
    g.strokeStyle = ink; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
    if (o.mouth === 'small') g.arc(64, 76, 9, 0.2 * Math.PI, 0.8 * Math.PI);
    else if (o.mouth === 'flat') { g.moveTo(54, 80); g.lineTo(74, 80); }
    else g.arc(64, 74, 15, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    if (o.beard) { g.strokeStyle = 'rgba(60,44,34,0.55)'; g.lineWidth = 9; g.beginPath(); g.arc(64, 66, 30, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke(); }
    return new THREE.CanvasTexture(c);
  }

  function buildHair(g, style, col) {
    const H = (w, h, d, x, y, z, o) => box(g, w, h, d, col, x, y, z, o);
    switch (style) {
      case 'buzz':
        H(1.62, 0.42, 1.56, 0, 6.5, 0); H(1.62, 0.5, 0.3, 0, 6.1, -0.64); break;
      case 'spiky':
        H(1.65, 0.5, 1.6, 0, 6.5, 0); H(1.65, 0.6, 0.32, 0, 6.05, -0.64);
        [[-0.5, 0.3], [0, -0.1], [0.5, 0.25], [-0.2, -0.45], [0.3, -0.5]].forEach((p, i) => {
          const s = box(g, 0.34, 0.62, 0.34, col, p[0], 6.95, p[1]); s.rotation.z = (i % 2 ? 0.3 : -0.3); s.rotation.x = 0.2;
        });
        break;
      case 'side':
        H(1.66, 0.56, 1.62, 0, 6.55, 0); H(1.66, 0.66, 0.32, 0, 6.06, -0.64);
        H(1.0, 0.5, 0.22, 0.34, 6.34, 0.72); H(0.5, 0.34, 0.22, -0.55, 6.42, 0.72); break;
      case 'bob':
        H(1.72, 0.6, 1.68, 0, 6.56, 0); H(1.72, 1.5, 0.38, 0, 5.6, -0.68);
        H(0.34, 1.35, 1.6, -0.86, 5.7, -0.05); H(0.34, 1.35, 1.6, 0.86, 5.7, -0.05);
        H(1.4, 0.42, 0.24, 0, 6.42, 0.74); break;
      case 'long':
        H(1.74, 0.62, 1.7, 0, 6.56, 0); H(1.8, 2.9, 0.42, 0, 4.9, -0.72);
        H(0.36, 2.3, 1.6, -0.88, 5.2, -0.05); H(0.36, 2.3, 1.6, 0.88, 5.2, -0.05);
        H(1.2, 0.4, 0.24, -0.2, 6.44, 0.74); break;
      case 'pony': {
        H(1.7, 0.6, 1.66, 0, 6.56, 0); H(1.7, 0.9, 0.36, 0, 5.95, -0.68);
        const t = cyl(g, 0.3, 0.22, 2.0, col, 0, 5.7, -1.15, { seg: 10 }); t.rotation.x = 0.42;
        cyl(g, 0.34, 0.34, 0.3, col, 0, 6.35, -0.9, { seg: 10 }); break;
      }
      case 'bun':
        H(1.7, 0.6, 1.66, 0, 6.56, 0); H(1.7, 0.8, 0.34, 0, 6.0, -0.66);
        { const b = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 12), mat(col, { rough: 0.9 })); b.position.set(0, 7.05, -0.38); b.castShadow = true; g.add(b); }
        break;
      case 'curly': {
        const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.06, 1), mat(col, { rough: 1 }));
        c.position.set(0, 6.5, -0.12); c.scale.set(1.0, 0.82, 1.0); c.castShadow = true; g.add(c); break;
      }
      case 'twin':
        H(1.7, 0.6, 1.66, 0, 6.56, 0); H(1.7, 1.0, 0.36, 0, 5.9, -0.68);
        cyl(g, 0.3, 0.24, 1.5, col, -1.0, 5.7, -0.5, { seg: 10 }); cyl(g, 0.3, 0.24, 1.5, col, 1.0, 5.7, -0.5, { seg: 10 });
        break;
      default: // 'short'
        H(1.68, 0.58, 1.64, 0, 6.55, 0); H(1.68, 0.72, 0.34, 0, 6.05, -0.64);
    }
  }

  function minifig(cfg) {
    const g = new THREE.Group();
    const skin = cfg.skin, top = cfg.top, low = cfg.low, hair = cfg.hair;
    const shoe = cfg.shoe || 0x23282f;

    if (cfg.skirt) {
      // skirt + bare legs
      box(g, 2.3, 1.25, 1.7, low, 0, 1.55, 0, { rough: 0.85 });
      box(g, 1.95, 0.35, 1.35, low, 0, 2.28, 0, { rough: 0.85 });
      box(g, 0.5, 1.0, 0.55, skin, -0.42, 0.5, 0); box(g, 0.5, 1.0, 0.55, skin, 0.42, 0.5, 0);
      box(g, 0.66, 0.26, 1.0, shoe, -0.42, 0.13, 0.12); box(g, 0.66, 0.26, 1.0, shoe, 0.42, 0.13, 0.12);
    } else {
      box(g, 1.8, 2.0, 1.1, low, 0, 1.25, 0);
      box(g, 0.72, 1.9, 1.0, low, -0.45, 1.2, 0.02); box(g, 0.72, 1.9, 1.0, low, 0.45, 1.2, 0.02);
      box(g, 0.78, 0.28, 1.05, shoe, -0.45, 0.14, 0.1); box(g, 0.78, 0.28, 1.05, shoe, 0.45, 0.14, 0.1);
    }
    // torso
    box(g, 2.0, 2.5, 1.25, top, 0, 3.45, 0, { rough: 0.85 });
    box(g, 2.2, 0.5, 1.35, top, 0, 2.35, 0, { rough: 0.85 });
    if (cfg.inner) {   // open collar / shirt showing under a jacket
      box(g, 0.95, 1.9, 0.09, cfg.inner, 0, 3.62, 0.64, { rough: 0.75 });
      const l1 = box(g, 0.46, 1.6, 0.11, cfg.lapel || top, -0.5, 3.72, 0.67, { rough: 0.7 }); l1.rotation.z = 0.2;
      const l2 = box(g, 0.46, 1.6, 0.11, cfg.lapel || top, 0.5, 3.72, 0.67, { rough: 0.7 }); l2.rotation.z = -0.2;
      box(g, 1.5, 0.3, 0.12, cfg.lapel || top, 0, 4.5, 0.65, { rough: 0.7 });
    } else if (cfg.print) {  // graphic tee / logo strip
      box(g, 1.1, 0.85, 0.08, cfg.print, 0, 3.6, 0.64, { rough: 0.8 });
    }
    if (cfg.tie) box(g, 0.34, 1.5, 0.09, cfg.tie, 0, 3.55, 0.69, { rough: 0.7 });
    if (cfg.scarf) box(g, 1.9, 0.5, 1.35, cfg.scarf, 0, 4.62, 0, { rough: 0.9 });
    // arms + hands
    box(g, 0.6, 2.1, 0.75, cfg.sleeve || top, -1.3, 3.55, 0, { rough: 0.85 });
    box(g, 0.6, 2.1, 0.75, cfg.sleeve || top, 1.3, 3.55, 0, { rough: 0.85 });
    box(g, 0.55, 0.5, 0.7, skin, -1.3, 2.5, 0.15); box(g, 0.55, 0.5, 0.7, skin, 1.3, 2.5, 0.15);
    // neck + head
    cyl(g, 0.35, 0.35, 0.4, skin, 0, 4.9, 0, { seg: 12 });
    box(g, 1.55, 1.55, 1.5, skin, 0, 5.85, 0);
    buildHair(g, cfg.hairStyle, hair);
    // face
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshStandardMaterial({ map: faceTexture(cfg.face || {}), transparent: true, roughness: 1 }));
    face.position.set(0, 5.85, 0.77); g.add(face);
    // glasses
    if (cfg.glasses) {
      // rim-only frames so the eyes stay visible through the lenses
      const fr = cfg.glassCol || 0x2a2f36, o = { rough: 0.35, metal: 0.45 };
      const lw = 0.56, lh = 0.44, t = 0.075, zf = 0.81;
      [-0.36, 0.36].forEach(sx => {
        box(g, lw, t, 0.06, fr, sx, 5.95 + lh / 2, zf, o);           // top rim
        box(g, lw, t, 0.06, fr, sx, 5.95 - lh / 2, zf, o);           // bottom rim
        box(g, t, lh, 0.06, fr, sx - lw / 2, 5.95, zf, o);           // outer rim
        box(g, t, lh, 0.06, fr, sx + lw / 2, 5.95, zf, o);           // inner rim
      });
      box(g, 0.2, t, 0.06, fr, 0, 5.99, zf, o);                      // bridge
      box(g, 0.06, t, 0.62, fr, -0.7, 5.99, 0.52, o);                // temples
      box(g, 0.06, t, 0.62, fr, 0.7, 5.99, 0.52, o);
    }
    // headphones
    if (cfg.headphones) {
      const hc = cfg.headphones;
      box(g, 0.22, 0.5, 0.6, hc, -0.9, 5.95, 0, { rough: 0.5 }); box(g, 0.22, 0.5, 0.6, hc, 0.9, 5.95, 0, { rough: 0.5 });
      const band = cyl(g, 0.92, 0.92, 0.2, hc, 0, 6.5, 0, { seg: 18, rough: 0.5 }); band.rotation.x = Math.PI / 2;
      box(g, 1.9, 0.7, 0.22, hc, 0, 6.62, 0, { rough: 0.5 });
    }
    // cap
    if (cfg.cap) {
      box(g, 1.7, 0.55, 1.62, cfg.cap, 0, 6.62, 0, { rough: 0.8 });
      box(g, 1.5, 0.18, 0.8, cfg.cap, 0, 6.4, 0.95, { rough: 0.8 });
    }
    // lanyard / badge
    if (cfg.badge) {
      box(g, 0.14, 1.2, 0.08, cfg.badge, -0.35, 4.05, 0.66, { rough: 0.7 });
      box(g, 0.14, 1.2, 0.08, cfg.badge, 0.35, 4.05, 0.66, { rough: 0.7 });
      box(g, 0.55, 0.75, 0.06, 0xeef1f4, 0, 3.15, 0.68, { rough: 0.6 });
    }
    if (cfg.scale) g.scale.setScalar(cfg.scale);
    g.userData = { phase: rand() * Math.PI * 2, baseY: 0 };
    figures.push(g); return g;
  }

  // ---------- character roster ----------
  const SKIN = { light: 0xf0c69c, warm: 0xe7b48a, tan: 0xd39a70, deep: 0xb87c52 };
  const HAIRC = { black: 0x1c1a1e, darkBrown: 0x2e2018, brown: 0x4a3323, chestnut: 0x63432a, ash: 0x6a6a72, sand: 0x9a7a4a, plum: 0x4a2438 };

  // 社長 — navy jacket, casual and stylish (open collar, no tie)
  const CEO = {
    skin: SKIN.warm, top: 0x27364f, lapel: 0x1f2c42, inner: 0xf2f4f6, low: 0x8f95a0,
    hair: HAIRC.darkBrown, hairStyle: 'side', shoe: 0x6b4a30,
    face: { eyes: 'bright', brows: 'sharp', mouth: 'smile' }, scale: 1.06,
  };
  // 秘書 — young woman, office lady, friendly
  const SEC = {
    skin: SKIN.light, top: 0xf6f2ee, low: 0x3d4757, skirt: true,
    hair: HAIRC.chestnut, hairStyle: 'long', shoe: 0x8a5a48,
    scarf: 0xe0a9b8, badge: C.brand,
    face: { eyes: 'lash', blush: true, mouth: 'small' }, scale: 0.98,
  };
  // PM — glasses, sharp and capable
  const PM = {
    skin: SKIN.light, top: 0x5a626e, inner: 0xbcd4e8, lapel: 0x4a515c, low: 0x2f3742,
    hair: HAIRC.black, hairStyle: 'short', glasses: true, glassCol: 0x333941,
    face: { eyes: 'calm', brows: 'sharp', mouth: 'flat' }, badge: C.blue, scale: 1.04,
  };
  // その他の社員 — casual, five women / five men, all different
  const STAFF = [
    { g: 'f', skin: SKIN.light, top: 0xd88a4a, print: 0xf4e2d0, low: 0x39404d, hair: HAIRC.darkBrown, hairStyle: 'bob', face: { eyes: 'lash', mouth: 'smile', blush: true } },
    { g: 'm', skin: SKIN.tan, top: 0x3f6f8f, low: 0x2f3742, hair: HAIRC.black, hairStyle: 'spiky', headphones: 0x2a2f36, face: { eyes: 'dot', mouth: 'smile' } },
    { g: 'f', skin: SKIN.warm, top: 0x8b6fd8, low: 0x4a5260, skirt: true, hair: HAIRC.plum, hairStyle: 'twin', face: { eyes: 'bright', mouth: 'small', blush: true } },
    { g: 'm', skin: SKIN.deep, top: 0x4d545d, print: C.brand, low: 0x353c46, hair: HAIRC.black, hairStyle: 'curly', face: { eyes: 'dot', mouth: 'smile', beard: true } },
    { g: 'f', skin: SKIN.light, top: 0x35b87a, low: 0x2f3742, hair: HAIRC.sand, hairStyle: 'pony', glasses: true, glassCol: 0xc98a4a, face: { eyes: 'calm', mouth: 'smile' } },
    { g: 'm', skin: SKIN.warm, top: 0xb0574a, low: 0x414956, hair: HAIRC.brown, hairStyle: 'side', face: { eyes: 'dot', brows: 'soft', mouth: 'flat' } },
    { g: 'f', skin: SKIN.tan, top: 0x3d8bd6, low: 0x333b47, skirt: true, hair: HAIRC.black, hairStyle: 'bun', face: { eyes: 'lash', mouth: 'smile' } },
    { g: 'm', skin: SKIN.light, top: 0x6f7784, inner: 0xe9edf2, lapel: 0x5c636e, low: 0x2b323c, hair: HAIRC.ash, hairStyle: 'buzz', glasses: true, face: { eyes: 'calm', mouth: 'flat' } },
    { g: 'f', skin: SKIN.warm, top: 0xe0a9b8, low: 0x4a5260, hair: HAIRC.chestnut, hairStyle: 'bob', badge: C.blue, face: { eyes: 'bright', mouth: 'small', blush: true } },
    { g: 'm', skin: SKIN.tan, top: 0x2f9c8a, low: 0x323a45, hair: HAIRC.darkBrown, hairStyle: 'short', cap: 0x2f3742, face: { eyes: 'dot', mouth: 'smile' } },
  ];
  // café regulars
  const CAFE_PEOPLE = [
    { g: 'f', skin: SKIN.light, top: 0xefe6da, low: 0x596272, skirt: true, hair: HAIRC.brown, hairStyle: 'long', face: { eyes: 'lash', mouth: 'small', blush: true } },
    { g: 'm', skin: SKIN.warm, top: 0x545c68, low: 0x363d47, hair: HAIRC.black, hairStyle: 'side', headphones: 0x3d8bd6, face: { eyes: 'dot', mouth: 'smile' } },
    { g: 'm', skin: SKIN.tan, top: 0x2f353d, print: 0xd88a4a, low: 0x3a424e, hair: HAIRC.darkBrown, hairStyle: 'buzz', face: { eyes: 'dot', mouth: 'smile' } },
  ];

  let staffIdx = 0;
  function person(cfg, x, z, ry, o) {
    const f = minifig(Object.assign({}, cfg, o || {}));
    f.position.set(x, 0, z); f.rotation.y = ry; world.add(f); return f;
  }
  function worker(x, z, ry) { return person(STAFF[staffIdx++ % STAFF.length], x, z, ry); }

  // ---------- modern furniture ----------
  // sit-stand style desk: slim top, aluminium legs, cable tray
  function desk(x, z, ry, accent, white) {
    const d = new THREE.Group();
    const top = white ? C.deskWhite : C.deskTop;
    box(d, 4.4, 0.16, 2.5, top, 0, 2.42, 0, { rough: 0.45, metal: 0.05 });
    box(d, 4.4, 0.07, 2.5, 0x71787f, 0, 2.33, 0, { rough: 0.5, metal: 0.4 });   // edge shadow line
    [[-1.95, 0], [1.95, 0]].forEach(p => {
      box(d, 0.16, 2.3, 1.9, C.alu, p[0], 1.18, p[1], { rough: 0.35, metal: 0.75 });   // blade leg
      box(d, 0.5, 0.12, 2.1, 0x6d747c, p[0], 0.1, p[1], { rough: 0.4, metal: 0.6 });   // foot
    });
    box(d, 3.0, 0.18, 0.35, 0x585f68, 0, 2.05, -0.8, { rough: 0.6, metal: 0.4 });      // cable tray

    // monitor: thin-bezel panel on a slim arm
    box(d, 0.9, 0.06, 0.5, 0x4a515a, 0, 2.53, -0.78, { rough: 0.4, metal: 0.6 });      // stand base
    box(d, 0.13, 1.15, 0.13, 0x5a626c, 0, 3.1, -0.78, { rough: 0.35, metal: 0.7 });    // post
    const panel = box(d, 3.1, 1.85, 0.1, 0x14181f, 0, 4.05, -0.72, { rough: 0.35, metal: 0.3 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.92, 1.68),
      new THREE.MeshBasicMaterial({ map: screenTex[Math.floor(rand() * screenTex.length)] }));
    face.position.set(0, 4.05, -0.66); d.add(face);
    box(d, 3.16, 0.09, 0.12, 0x0e1218, 0, 3.1, -0.72, { rough: 0.4 });                 // chin
    // laptop, open, beside the keyboard
    box(d, 1.7, 0.09, 1.15, 0xb9c0c8, 1.15, 2.55, 0.35, { rough: 0.4, metal: 0.6 });
    const lid = box(d, 1.7, 1.1, 0.08, 0xaeb6bf, 1.15, 3.05, -0.15, { rough: 0.4, metal: 0.6 });
    lid.rotation.x = -0.28;
    const lf = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), new THREE.MeshBasicMaterial({ map: screenTex[0] }));
    lf.position.set(1.15, 3.06, -0.09); lf.rotation.x = -0.28; d.add(lf);
    // keyboard + mouse + mug
    box(d, 1.7, 0.08, 0.62, 0x2a2f36, -0.85, 2.54, 0.5, { rough: 0.5 });
    box(d, 1.55, 0.03, 0.5, 0x3b424b, -0.85, 2.59, 0.5, { rough: 0.6 });
    box(d, 0.36, 0.11, 0.55, 0x2a2f36, 0.15, 2.55, 0.55, { rough: 0.5 });
    cyl(d, 0.22, 0.19, 0.46, 0xf2f4f6, -1.85, 2.73, 0.42, { seg: 12, rough: 0.5 });
    box(d, 0.55, 0.06, 0.55, C.brand, -1.85, 2.53, 0.42, { rough: 0.6 });               // coaster
    d.position.set(x, 0, z); d.rotation.y = ry; world.add(d); return d;
  }
  // mesh task chair
  function chair(x, z, ry) {
    const c = new THREE.Group();
    box(c, 1.5, 0.22, 1.4, C.chair, 0, 1.62, 0, { rough: 0.6 });
    box(c, 1.4, 1.75, 0.16, C.chairMesh, 0, 2.6, -0.62, { rough: 0.7 });
    box(c, 1.5, 0.16, 0.2, C.chair, 0, 3.42, -0.62, { rough: 0.6 });                    // headrest bar
    box(c, 0.16, 0.5, 0.9, C.chair, -0.78, 2.0, -0.1, { rough: 0.6 });                   // armrests
    box(c, 0.16, 0.5, 0.9, C.chair, 0.78, 2.0, -0.1, { rough: 0.6 });
    cyl(c, 0.14, 0.14, 1.45, 0x2f353d, 0, 0.85, 0, { seg: 10, rough: 0.4, metal: 0.6 });
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      box(c, 0.7, 0.11, 0.2, 0x3a4049, Math.cos(a) * 0.45, 0.2, Math.sin(a) * 0.45, { ry: -a, rough: 0.5, metal: 0.4 });
      cyl(c, 0.14, 0.14, 0.16, 0x22272e, Math.cos(a) * 0.75, 0.16, Math.sin(a) * 0.75, { seg: 8, rx: Math.PI / 2 });
    }
    c.position.set(x, 0, z); c.rotation.y = ry; world.add(c);
  }
  // worker behind the desk, desk flipped so the monitor faces them
  // `who` (optional) pins a specific character; otherwise the next staff member is used
  function station(x, z, accent, white, who) {
    who ? person(who, x, z - 2.8, 0) : worker(x, z - 2.8, 0);
    chair(x, z - 2.55, 0);
    desk(x, z, Math.PI, accent, white);
  }
  function planter(x, z, sc) {
    const p = new THREE.Group();
    cyl(p, 0.95, 0.85, 1.9, 0xdfe3e8, 0, 0.95, 0, { seg: 18, rough: 0.7 });            // matte white pot
    box(p, 1.9, 0.12, 1.9, 0x6f7681, 0, 1.9, 0, { rough: 0.8 });
    cyl(p, 0.22, 0.3, 2.0, 0x4a6b3a, 0, 2.9, 0, { seg: 8 });
    [[0, 4.3, 0, 1.7], [-0.9, 3.8, 0.4, 1.2], [0.9, 3.9, -0.3, 1.3], [0.2, 5.0, 0.5, 1.1]].forEach(f => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(f[3], 0), mat(0x3f8a52, { rough: 0.95 }));
      m.position.set(f[0], f[1], f[2]); m.castShadow = true; p.add(m);
    });
    p.scale.setScalar(sc || 1); p.position.set(x, 0, z); world.add(p);
  }
  function column(x, z) {
    box(world, 1.5, 13.6, 1.5, 0xdadde2, x, 6.8, z, { rough: 0.8 });
    box(world, 1.9, 0.3, 1.9, 0xc3c7cd, x, 0.3, z, { rough: 0.8 });
    box(world, 1.9, 0.3, 1.9, 0xc3c7cd, x, 13.5, z, { rough: 0.8 });
  }
  // storage credenza / lockers
  function credenza(x, z, ry, w) {
    const g = new THREE.Group();
    box(g, w, 2.6, 1.7, 0x4d545d, 0, 1.3, 0, { rough: 0.6 });
    box(g, w + 0.16, 0.16, 1.85, 0xe6e9ed, 0, 2.66, 0, { rough: 0.5 });
    const n = Math.max(2, Math.round(w / 2.6));
    for (let i = 0; i < n; i++) {
      const px = -w / 2 + w / n * (i + 0.5);
      box(g, w / n - 0.25, 2.2, 0.08, 0x5b636d, px, 1.3, 0.88, { rough: 0.55 });
      box(g, 0.7, 0.09, 0.1, C.alu, px, 1.95, 0.95, { rough: 0.3, metal: 0.8 });
    }
    g.position.set(x, 0, z); g.rotation.y = ry || 0; world.add(g);
  }
  function whiteboard(x, z, ry) {
    const g = new THREE.Group();
    box(g, 8, 4.6, 0.18, 0xf7f9fb, 0, 4.2, 0, { rough: 0.55 });
    box(g, 8.3, 0.2, 0.3, 0x8f969f, 0, 1.85, 0.02, { rough: 0.5, metal: 0.4 });
    box(g, 0.2, 3.8, 0.2, 0x8f969f, -3.6, 1.9, 0, { rough: 0.4, metal: 0.6 });
    box(g, 0.2, 3.8, 0.2, 0x8f969f, 3.6, 1.9, 0, { rough: 0.4, metal: 0.6 });
    [[-2.4, 5.2, 2.4, C.blue], [0.6, 4.9, 1.6, C.brand], [-1.2, 3.7, 3.0, 0x8a929c], [2.0, 4.4, 1.2, C.green]].forEach(s =>
      box(g, s[2], 0.5, 0.05, s[3], s[0], s[1], 0.11, { rough: 0.7 }));
    g.position.set(x, 0, z); g.rotation.y = ry || 0; world.add(g);
  }
  function sofa(x, z, ry, color) {
    const g = new THREE.Group();
    box(g, 5.6, 0.9, 2.2, color, 0, 1.15, 0, { rough: 0.8 });
    box(g, 5.6, 1.5, 0.5, color, 0, 1.9, -0.85, { rough: 0.8 });
    box(g, 0.5, 1.1, 2.2, color, -2.55, 1.6, 0, { rough: 0.8 });
    box(g, 0.5, 1.1, 2.2, color, 2.55, 1.6, 0, { rough: 0.8 });
    [-1.5, 1.5].forEach(dx => box(g, 1.0, 0.9, 0.28, C.brand, dx, 1.95, -0.5, { rough: 0.85 }));
    [[-2.2, -0.8], [2.2, -0.8], [-2.2, 0.8], [2.2, 0.8]].forEach(p => cyl(g, 0.12, 0.1, 0.7, 0x6d747c, p[0], 0.35, p[1], { seg: 8, metal: 0.6, rough: 0.4 }));
    g.position.set(x, 0, z); g.rotation.y = ry || 0; world.add(g);
  }

  // ---------- accents & labels ----------
  const COL = { work: C.brand, ceo: C.brand, data: C.blue, cafe: 0x7f8794 };
  function label(title, sub, color, cx, cz) { const sp = labelSprite(title, sub, color); sp.position.set(cx, 8.6, cz); world.add(sp); }

  // === ぷらかん 社長室 — back-left, glass-walled executive office ===
  (function () {
    const ew = -16, sz = -6, roomZmin = -FD / 2 + 1.0, cxc = -24, czc = (roomZmin + sz) / 2;
    const wy = 6.4, doorZ = -14, door = 4.4;
    const frame = C.mullion;
    // glass partition — east side, two panes + open doorway
    function pane(zc, zd) {
      box(world, 0.14, wy - 0.5, zd, C.glass, ew, (wy - 0.5) / 2 + 0.25, zc, { transparent: true, opacity: 0.24, rough: 0.08, metal: 0.1 });
      box(world, 0.3, 0.28, zd, frame, ew, wy, zc, { rough: 0.5, metal: 0.35 });
      box(world, 0.3, 0.3, 0.3, frame, ew, wy / 2, zc - zd / 2, { rough: 0.5, metal: 0.35 });
      box(world, 0.3, 0.3, 0.3, frame, ew, wy / 2, zc + zd / 2, { rough: 0.5, metal: 0.35 });
      box(world, 0.34, 0.3, zd, frame, ew, 0.3, zc, { rough: 0.5, metal: 0.35 });
    }
    pane((roomZmin + doorZ - door / 2) / 2, (doorZ - door / 2) - roomZmin);
    pane((doorZ + door / 2 + sz) / 2, sz - (doorZ + door / 2));
    box(world, 0.3, 0.3, door, frame, ew, wy, doorZ, { rough: 0.5, metal: 0.35 });
    // south wall — solid, carries the purakan sign
    box(world, ew - (-FW / 2), wy, 0.55, C.wall, (ew + -FW / 2) / 2, wy / 2, sz, { rough: 0.9 });
    box(world, ew - (-FW / 2), 0.22, 0.75, 0xcfd4da, (ew + -FW / 2) / 2, wy, sz, { rough: 0.7 });
    // executive desk + chair + CEO
    const dz = -13;
    person(CEO, cxc, dz - 2.8, 0);
    chair(cxc, dz - 2.55, 0);
    desk(cxc, dz, Math.PI, COL.ceo, true);
    // secretary desk — just inside the glass door, facing the entrance side
    station(-19.5, -9.5, COL.ceo, true, SEC);
    planter(-19.5, -18.5, 0.8);
    // meeting corner
    sofa(-28.5, -19.5, 0.35, 0x5c6572);
    box(world, 3.2, 0.16, 1.8, 0x2f353d, -24.5, 1.25, -19.0, { rough: 0.4, metal: 0.3 });
    [[-25.8, -19.6], [-23.2, -19.6], [-25.8, -18.4], [-23.2, -18.4]].forEach(p => cyl(world, 0.09, 0.09, 1.2, C.alu, p[0], 0.6, p[1], { seg: 8, metal: 0.7, rough: 0.35 }));
    credenza(-30.5, -9.5, 0, 6);
    planter(-FW / 2 + 3, sz - 3.2, 1.0);
    // purakan sign on the south wall — faces the hall
    box(world, 9.6, 4.4, 0.2, 0xf4f6f8, cxc, 3.0, sz + 0.2, { rough: 0.55 });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 4.1), new THREE.MeshBasicMaterial({ map: logoWideTex, transparent: true, side: THREE.DoubleSide }));
    plate.position.set(cxc, 3.0, sz + 0.34); world.add(plate);
    box(world, 10.0, 0.14, 0.36, C.brand, cxc, 5.3, sz + 0.28, { rough: 0.5, metal: 0.3 });
    const sl = new THREE.PointLight(0xffffff, 0.55, 18, 2); sl.position.set(cxc, 5.0, sz + 2.6); world.add(sl);
    label('ぷらかん 社長室', 'purakan · CEO & SECRETARY', C_HEX_BRAND, cxc, czc + 1);
  })();

  // === PM 席 — back-center, live dashboard wall ===
  (function () {
    const z = -14;
    box(northGroup, 13, 7.4, 0.3, 0x0f141b, 0, 8.4, -FD / 2 + 0.55, { rough: 0.4 });
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 6.8), new THREE.MeshBasicMaterial({ map: dashTexture() }));
    dash.position.set(0, 8.4, -FD / 2 + 0.72); northGroup.add(dash);
    person(PM, 0, z - 2.8, 0);
    chair(0, z - 2.55, 0);
    desk(0, z, Math.PI, COL.data);
    // server / network rack
    box(world, 2.2, 5.2, 1.8, 0x272c33, 9.5, 2.6, z - 1.6, { rough: 0.55, metal: 0.3 });
    box(world, 1.9, 4.6, 0.12, 0x14181e, 9.5, 2.6, z - 0.72, { rough: 0.4 });
    for (let i = 0; i < 7; i++) {
      box(world, 1.7, 0.42, 0.1, 0x343a42, 9.5, 0.9 + i * 0.66, z - 0.68, { rough: 0.5 });
      box(world, 0.16, 0.16, 0.06, i % 3 ? 0x3ad07a : C.brand, 10.15, 0.9 + i * 0.66, z - 0.64, { emissive: i % 3 ? 0x3ad07a : C.brand, emi: 0.95 });
    }
    planter(-9, z - 1, 0.95);
    label('PM', 'PROJECT MANAGER', '#3d8bd6', 0, z + 0.5);
  })();

  // === ワークフロア — 水槽より手前に 5列 × 2行 = 10席 ===
  (function () {
    const xs = [-15, -7.5, 0, 7.5, 15], rows = [8, 16];
    rows.forEach((z, ri) => xs.forEach(x => station(x, z, COL.work, ri === 1)));
    label('ワークフロア', 'OPEN WORKFLOOR · 10', C_HEX_BRAND, 0, 3.4);
    credenza(25, 15, -Math.PI / 2, 7);
    whiteboard(-27, 14, Math.PI / 2);
    planter(-20, 6, 1.0); planter(20, 6, 0.95); planter(21, 20, 0.9);
  })();

  // === カフェ / 仮眠 — back-right ===
  (function () {
    const cxr = 22, nzw = -FD / 2;
    // counter: white quartz top on a dark base, L-shaped
    box(world, 12, 2.3, 1.8, 0x394049, cxr, 1.15, nzw + 3.4, { rough: 0.55 });
    box(world, 12.4, 0.22, 2.0, 0xeef1f4, cxr, 2.4, nzw + 3.4, { rough: 0.35 });
    box(world, 1.8, 2.3, 7, 0x394049, cxr + 5.1, 1.15, nzw + 7.0, { rough: 0.55 });
    box(world, 2.0, 0.22, 7.4, 0xeef1f4, cxr + 5.1, 2.4, nzw + 7.0, { rough: 0.35 });
    box(world, 12.2, 0.1, 1.9, C.brand, cxr, 0.35, nzw + 3.4, { rough: 0.6 });     // kick accent
    // back wall shelving
    box(world, 11, 0.22, 1.1, 0xe6e9ed, cxr, 5.2, nzw + 0.9, { rough: 0.5 });
    box(world, 11, 0.22, 1.1, 0xe6e9ed, cxr, 6.7, nzw + 0.9, { rough: 0.5 });
    const bcol = [0x4d545d, 0x3d8bd6, 0xd88a4a, 0x35b87a, 0x8b6fd8];
    for (let i = 0; i < 9; i++) cyl(world, 0.26, 0.26, 0.9 + rand() * 0.4, bcol[i % bcol.length], cxr - 5 + i * 1.25, 5.85, nzw + 0.9, { seg: 10, rough: 0.5 });
    for (let i = 0; i < 7; i++) cyl(world, 0.23, 0.19, 0.4, 0xf2f4f6, cxr - 3.6 + i * 1.2, 7.05, nzw + 0.9, { seg: 10, rough: 0.5 });
    // espresso machine
    box(world, 1.9, 1.5, 1.2, 0xd7dbe0, cxr - 4.6, 3.25, nzw + 3.4, { rough: 0.35, metal: 0.5 });
    box(world, 1.9, 0.35, 1.2, 0x2f353d, cxr - 4.6, 4.15, nzw + 3.4, { rough: 0.4, metal: 0.4 });
    box(world, 0.5, 0.5, 0.3, C.brand, cxr - 4.6, 3.3, nzw + 4.05, { emissive: C.brand, emi: 0.4 });
    // menu screen on the return
    box(world, 0.12, 2.2, 3.4, 0x11161d, cxr + 4.2, 6.2, nzw + 5.2, { rough: 0.4 });
    box(world, 0.06, 1.9, 3.1, 0x1b2230, cxr + 4.14, 6.2, nzw + 5.2, { emissive: 0x223046, emi: 0.5, rough: 0.4 });
    // cups + steam
    cyl(world, 0.28, 0.24, 0.5, 0xf2f4f6, cxr + 1, 2.75, nzw + 3.2, { seg: 12, rough: 0.5 });
    cyl(world, 0.28, 0.24, 0.5, 0xf2f4f6, cxr + 2.4, 2.75, nzw + 3.7, { seg: 12, rough: 0.5 });
    const steam = new THREE.Group();
    for (let i = 0; i < 3; i++) { const p = cyl(steam, 0.11, 0.11, 0.1, 0xffffff, 0, i * 0.5, 0, { seg: 8 }); p.material.transparent = true; p.material.opacity = 0.4 - i * 0.11; }
    steam.position.set(cxr + 1, 3.15, nzw + 3.2); world.add(steam); window.__steam = steam;
    // stools + guests + barista
    [-3.5, 0, 3.5].forEach(dxx => {
      cyl(world, 0.55, 0.5, 0.22, 0x3b424b, cxr + dxx, 1.6, nzw + 5.8, { seg: 14, rough: 0.6 });
      cyl(world, 0.13, 0.13, 1.5, C.alu, cxr + dxx, 0.78, nzw + 5.8, { seg: 10, metal: 0.7, rough: 0.35 });
      cyl(world, 0.5, 0.5, 0.1, 0x6d747c, cxr + dxx, 0.1, nzw + 5.8, { seg: 14, metal: 0.5, rough: 0.4 });
    });
    person(CAFE_PEOPLE[0], cxr - 3.5, nzw + 5.8, Math.PI);
    person(CAFE_PEOPLE[1], cxr + 3.5, nzw + 5.8, Math.PI);
    person(CAFE_PEOPLE[2], cxr - 1, nzw + 2.0, 0);
    // pendant lights over the counter
    [-3.5, 0, 3.5].forEach(dxx => {
      cyl(world, 0.04, 0.04, 4.4, 0x5a626c, cxr + dxx, 11.4, nzw + 3.4, { seg: 6 });
      cyl(world, 0.62, 0.34, 0.7, 0xfdf6e8, cxr + dxx, 8.9, nzw + 3.4, { seg: 16, emissive: 0xffe9c0, emi: 0.9, rough: 0.4 });
    });
    // nap pod — sleek white capsule
    const npx = cxr + 5.0, npz = nzw + 12.5;
    box(world, 3.2, 2.3, 4.8, 0xe4e8ec, npx, 1.35, npz, { rough: 0.45 });
    box(world, 3.34, 0.5, 4.94, 0xcfd4da, npx, 2.45, npz, { rough: 0.5 });
    box(world, 0.16, 1.7, 3.7, 0x151b23, npx - 1.58, 1.3, npz, { transparent: true, opacity: 0.72, rough: 0.2 });
    box(world, 2.6, 0.28, 3.5, 0x8f97a2, npx, 0.62, npz, { rough: 0.7 });
    box(world, 1.6, 0.45, 0.8, 0xf2f4f6, npx, 0.95, npz - 1.45, { rough: 0.8 });
    box(world, 0.2, 0.2, 3.4, 0x8fd6ff, npx - 1.62, 2.2, npz, { emissive: 0x8fd6ff, emi: 0.85 });
    const zc = document.createElement('canvas'); zc.width = 128; zc.height = 128; const zg = zc.getContext('2d');
    zg.fillStyle = '#8fa8c4'; zg.font = 'bold 70px sans-serif'; zg.fillText('Z', 20, 70); zg.font = 'bold 46px sans-serif'; zg.fillText('z', 74, 50);
    const zsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(zc), transparent: true }));
    zsp.scale.set(2, 2, 1); zsp.position.set(npx, 4.2, npz); world.add(zsp); window.__zzz = zsp;
    planter(cxr - 6.5, nzw + 6.5, 0.85);
    label('カフェ / 仮眠', 'CAFE & NAP', '#7f8794', cxr, nzw + 6.5);
  })();

  // ---------- CENTER aquarium — frameless, dark base, LED ----------
  const fishes = [];
  (function () {
    const W = 8.4, H = 4.6, D = 4.4, baseH = 1.5;
    box(world, W + 1.0, baseH, D + 1.0, 0x2f353d, 0, baseH / 2, 0, { rough: 0.5 });
    box(world, W + 1.3, 0.18, D + 1.3, 0xe6e9ed, 0, baseH, 0, { rough: 0.4 });
    box(world, W + 1.05, 0.1, D + 1.05, C.brand, 0, 0.22, 0, { emissive: C.brand, emi: 0.35 });
    const y0 = baseH + 0.1;
    const water = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), new THREE.MeshStandardMaterial({ color: 0x2f86bb, transparent: true, opacity: 0.4, roughness: 0.12, metalness: 0.1, emissive: 0x14435e, emissiveIntensity: 0.55 }));
    water.position.set(0, y0 + H / 2, 0); world.add(water);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, H + 0.24, D + 0.24), new THREE.MeshStandardMaterial({ color: 0xd7f0ff, transparent: true, opacity: 0.11, roughness: 0.04, side: THREE.DoubleSide }));
    glass.position.copy(water.position); world.add(glass);
    // slim dark top rail + LED strip
    box(world, W + 0.5, 0.3, D + 0.5, 0x2f353d, 0, y0 + H + 0.15, 0, { rough: 0.5 });
    box(world, W - 0.4, 0.1, D - 0.4, 0xdff2ff, 0, y0 + H + 0.02, 0, { emissive: 0xbfe8ff, emi: 1.0 });
    box(world, W, 0.5, D, 0xc9c3b2, 0, y0 + 0.25, 0, { rough: 1 });
    [[-2.6, 0.8, 0.5, 0x6a7078], [2.4, 1.0, -0.6, 0x585e66], [0.4, 0.7, 1.0, 0x767c85]].forEach(r => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r[1], 0), mat(r[3], { rough: 1 })); m.position.set(r[0], y0 + 0.6, r[2]); world.add(m);
    });
    for (let i = 0; i < 5; i++) { const px = -3 + i * 1.4 + (rand() - 0.5); cyl(world, 0.12, 0.2, 1.6 + rand(), 0x2f7a3a, px, y0 + 1.1, -1 + rand() * 2, { seg: 6 }); }
    const fishCols = [0xe8792a, 0xd8b23a, 0x2b8fd0, 0xd85a5a, 0x8ad0e0, 0xe0a040];
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Group(); const col = fishCols[i % fishCols.length];
      box(f, 0.9, 0.55, 0.4, col, 0, 0, 0, { rough: 0.45, emissive: col, emi: 0.18 });
      box(f, 0.35, 0.5, 0.05, col, -0.6, 0, 0); box(f, 0.2, 0.2, 0.05, 0x101418, 0.35, 0.08, 0.19);
      world.add(f);
      fishes.push({ g: f, r: 1.6 + rand() * 2.4, y: y0 + 1.2 + rand() * (H - 2), sp: 0.4 + rand() * 0.6, ph: rand() * 7, dir: rand() < 0.5 ? 1 : -1, zsq: 0.5 + rand() * 0.9 });
    }
    const apl = new THREE.PointLight(0x9fd8ff, 0.55, 28, 2); apl.position.set(0, y0 + H, 0); world.add(apl);
    // lounge benches flanking it
    [[-7.5, 0], [7.5, 0]].forEach(b => {
      box(world, 1.4, 0.35, 4.4, 0x4d545d, b[0], 1.25, b[1], { rough: 0.7 });
      box(world, 1.5, 0.12, 4.5, C.brand, b[0], 1.45, b[1], { rough: 0.8 });
      [-1.6, 1.6].forEach(dz2 => cyl(world, 0.1, 0.1, 1.1, C.alu, b[0], 0.55, b[1] + dz2, { seg: 8, metal: 0.7, rough: 0.35 }));
    });
  })();

  // ---------- columns + entrance floor logo ----------
  [[-31, 20], [31, 20], [31, -20], [-31, -20]].forEach(p => column(p[0], p[1]));
  (function () {
    // brand sign on the west wall (hides with that wall)
    const wx = -FW / 2 + 1.0, wy = 9.5, wz = 16;
    box(westGroup, 0.25, 8.4, 7.4, 0xf4f6f8, wx - 0.12, wy, wz, { rough: 0.55 });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 6.8), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
    sign.rotation.y = Math.PI / 2; sign.position.set(wx + 0.04, wy, wz); westGroup.add(sign);
    box(westGroup, 0.4, 0.16, 7.8, C.brand, wx - 0.06, wy + 4.4, wz, { rough: 0.5, metal: 0.3 });
    // floor medallion at the entrance
    const mz = FD / 2 - 2.8;
    const med = new THREE.Mesh(new THREE.CircleGeometry(2.4, 44), new THREE.MeshStandardMaterial({ map: logoTexIcon, transparent: true, roughness: 0.9 }));
    med.rotation.x = -Math.PI / 2; med.position.set(0, 0.34, mz); world.add(med);
    cyl(world, 2.8, 2.8, 0.16, 0xd2d6dc, 0, 0.26, mz, { seg: 44, rough: 0.7 });
  })();

  // ---------- resize ----------
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const loader = document.getElementById('loader');
  if (loader) setTimeout(() => { loader.style.opacity = '0'; setTimeout(() => loader.remove(), 600); }, 300);

  // ---------- animate ----------
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;
    for (const f of figures) { f.position.y = f.userData.baseY + Math.sin(t * 2 + f.userData.phase) * 0.07; f.rotation.z = Math.sin(t * 1.3 + f.userData.phase) * 0.012; }
    for (const fi of fishes) {
      const a = fi.ph + t * fi.sp * fi.dir;
      fi.g.position.set(Math.cos(a) * fi.r, fi.y + Math.sin(t * 1.3 + fi.ph) * 0.3, Math.sin(a) * fi.r * fi.zsq);
      fi.g.rotation.y = -a + (fi.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
    if (window.__steam) window.__steam.children.forEach((c, i) => { c.position.y = ((t * 0.7 + i * 0.5) % 1.6); c.material.opacity = Math.max(0, 0.4 - c.position.y * 0.26); });
    if (window.__zzz) { window.__zzz.position.y = 4.2 + Math.sin(t * 1.5) * 0.25; window.__zzz.material.opacity = 0.6 + Math.sin(t * 1.5) * 0.4; }
    northGroup.visible = camera.position.z > -FD / 2 + 1;
    westGroup.visible = camera.position.x > -FW / 2 + 1;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
})();
