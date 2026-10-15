/* «Две улицы» — ночное небо над Гомелем: два биплана По-2 идут над городом.
   Если WebGL недоступен или включён режим «уменьшенное движение», сцена не запускается. */
(function () {
  "use strict";

  var canvas = document.getElementById("nightCanvas");
  if (!canvas || typeof THREE === "undefined") return;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    canvas.style.display = "none";
    return;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
  camera.position.set(0, 4.2, 16);
  camera.lookAt(0, 4.2, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var wide = window.innerWidth >= 760;

  /* ——— звёзды: ночь, а не космос — их немного ——— */
  function makeStars(count, spread, size, color, opacity) {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = 2 + Math.random() * spread * 0.4;
      pos[i * 3 + 2] = -Math.random() * spread * 0.35 - 6;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ color: color, size: size, transparent: true, opacity: opacity, depthWrite: false });
    return new THREE.Points(geo, mat);
  }
  var stars = makeStars(520, 90, 0.14, 0xffffff, 0.5);
  var warmStars = makeStars(80, 70, 0.2, 0xefc75e, 0.42);
  scene.add(stars);
  scene.add(warmStars);

  /* ——— свет ——— */
  scene.add(new THREE.AmbientLight(0x3b5570, 1.3));
  var key = new THREE.DirectionalLight(0xd8e6fb, 1.5);
  key.position.set(6, 10, 12);
  scene.add(key);
  var warm = new THREE.PointLight(0xd1232a, 0.8, 60);
  warm.position.set(-12, 2, 8);
  scene.add(warm);

  /* ——— низкие облака, чтобы читался полёт над землёй ——— */
  function cloudTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(226, 240, 255, .5)");
    grad.addColorStop(.45, "rgba(200, 224, 210, .17)");
    grad.addColorStop(1, "rgba(200, 224, 210, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  var cloudMat = new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, opacity: 0.5, depthWrite: false });
  var clouds = [];
  for (var ci = 0; ci < 7; ci++) {
    var sp = new THREE.Sprite(cloudMat.clone());
    sp.position.set(-24 + Math.random() * 48, -0.4 + Math.random() * 2.6, -9 - Math.random() * 6);
    var s = 9 + Math.random() * 8;
    sp.scale.set(s * 1.7, s * 0.7, 1);
    sp.material.opacity = 0.12 + Math.random() * 0.16;
    sp.userData.speed = 0.06 + Math.random() * 0.12;
    clouds.push(sp);
    scene.add(sp);
  }

  /* ——— город далеко внизу ——— */
  var city = new THREE.Group();
  var matA = new THREE.MeshBasicMaterial({ color: 0x0a1712 });
  var matB = new THREE.MeshBasicMaterial({ color: 0x0d1d17 });
  for (var bi = 0; bi < 36; bi++) {
    var w = 1.2 + Math.random() * 2.6;
    var h = 1.5 + Math.random() * 4.4;
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.3), bi % 2 ? matA : matB);
    b.position.set(-37 + bi * 2.15, -9.4 + h / 2, -24 - Math.random() * 3);
    city.add(b);
  }
  var winGeo = new THREE.BufferGeometry();
  var winPos = new Float32Array(110 * 3);
  for (var wi = 0; wi < 110; wi++) {
    winPos[wi * 3] = -35 + Math.random() * 70;
    winPos[wi * 3 + 1] = -8.6 + Math.random() * 3.6;
    winPos[wi * 3 + 2] = -22.6 - Math.random() * 2;
  }
  winGeo.setAttribute("position", new THREE.BufferAttribute(winPos, 3));
  city.add(new THREE.Points(winGeo, new THREE.PointsMaterial({ color: 0xffcf8a, size: 0.17, transparent: true, opacity: 0.7, depthWrite: false })));
  scene.add(city);

  /* ——— биплан По-2 ——— */
  function makeBiplane(scale) {
    var plane = new THREE.Group();
    var body = new THREE.MeshPhongMaterial({ color: 0x4a628c, shininess: 30, emissive: 0x0b1424 });
    var dark = new THREE.MeshPhongMaterial({ color: 0x354a72, shininess: 22, emissive: 0x080f1c });

    function box(w, h, d, mat, x, y, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || body);
      m.position.set(x || 0, y || 0, z || 0);
      plane.add(m);
      return m;
    }

    box(4.6, 0.52, 0.52, body, 0, 0, 0);              // фюзеляж
    box(4.2, 0.09, 1.45, dark, 0.05, 0.86, 0);        // верхнее крыло
    box(3.9, 0.09, 1.3, dark, 0.25, -0.06, 0);        // нижнее крыло
    box(0.07, 0.84, 0.07, dark, -1.15, 0.42, 0.55);   // стойки
    box(0.07, 0.84, 0.07, dark, -1.15, 0.42, -0.55);
    box(0.07, 0.84, 0.07, dark, 1.35, 0.42, 0.55);
    box(0.07, 0.84, 0.07, dark, 1.35, 0.42, -0.55);
    box(0.85, 0.08, 1.5, dark, -2.35, 0.06, 0);       // стабилизатор
    box(0.06, 0.72, 0.62, dark, -2.42, 0.42, 0);      // киль
    box(0.72, 0.34, 0.56, dark, 0.65, 0.42, 0);       // кабина

    var prop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 0.1), dark);
    prop.position.set(2.44, 0, 0);
    plane.add(prop);

    function lamp(color, x, y, z) {
      var l = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), new THREE.MeshBasicMaterial({ color: color }));
      l.position.set(x, y, z);
      plane.add(l);
    }
    lamp(0xd1232a, 0.05, 0.86, 0.8);
    lamp(0x2f9a4a, 0.05, 0.86, -0.8);

    plane.scale.setScalar(scale);
    plane.userData.prop = prop;
    return plane;
  }

  /* два биплана кружат в правой части неба, чтобы не спорить с текстом */
  /* камера чуть выше самолётов — так читается силуэт биплана, а не тёмная плита */
  var planes = [
    { mesh: makeBiplane(0.8), cx: 5.2, cy: 3.1, cz: -1.5, rx: 3.0, ry: 0.8, speed: 0.22, phase: 0.4 },
    { mesh: makeBiplane(0.52), cx: 7.2, cy: 1.7, cz: -8, rx: 2.1, ry: 0.6, speed: 0.16, phase: 2.7 }
  ];
  var showPlanes = wide;
  if (showPlanes) planes.forEach(function (p) { scene.add(p.mesh); });

  /* ——— цикл ——— */
  var clock = new THREE.Clock();
  var running = true;

  function resize() {
    var w = canvas.clientWidth || canvas.parentNode.clientWidth;
    var h = canvas.clientHeight || canvas.parentNode.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame() {
    var t = clock.getElapsedTime();
    stars.rotation.y = t * 0.004;
    warmStars.rotation.y = -t * 0.006;

    clouds.forEach(function (c) {
      c.position.x += c.userData.speed * 0.016;
      if (c.position.x > 30) c.position.x = -30;
    });

    if (showPlanes) planes.forEach(function (p) {
      var m = p.mesh;
      var a = t * p.speed + p.phase;
      m.position.x = p.cx + Math.cos(a) * p.rx;
      m.position.y = p.cy + Math.sin(a) * p.ry;
      m.position.z = p.cz + Math.sin(a * 0.7) * 1.4;
      m.rotation.y = -Math.cos(a) * 0.42;
      m.rotation.z = -Math.sin(a) * 0.22;
      m.rotation.x = Math.sin(a * 0.9) * 0.05;
      if (m.userData.prop) m.userData.prop.rotation.x += 0.85;
    });

    renderer.render(scene, camera);
    if (running && !reduceMotion) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(function () { resize(); }).observe(canvas);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(function () { resize(); });
  window.addEventListener("load", function () { resize(); });

  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    var hero = document.querySelector(".hero");
    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) { running = true; requestAnimationFrame(frame); }
        else if (!visible) { running = false; }
      }, { threshold: 0.01 }).observe(hero);
    }
    requestAnimationFrame(frame);
  }
})();