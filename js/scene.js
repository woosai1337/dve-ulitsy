/* «Две улицы» — ночная сцена: звёзды и два биплана По-2.
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
  camera.position.set(0, 4.6, 16);
  camera.lookAt(0, 4.6, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  /* ——— звёзды ——— */
  function makeStars(count, spread, size, color, opacity) {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.35) * spread * 0.55;
      pos[i * 3 + 2] = -Math.random() * spread * 0.4 - 4;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ color: color, size: size, transparent: true, opacity: opacity, depthWrite: false });
    return new THREE.Points(geo, mat);
  }

  var stars = makeStars(900, 90, 0.16, 0xffffff, 0.85);
  var gold = makeStars(120, 70, 0.26, 0xefc75e, 0.7);
  scene.add(stars);
  scene.add(gold);

  /* ——— свет ——— */
  scene.add(new THREE.AmbientLight(0x2a3a5c, 1.1));
  var key = new THREE.DirectionalLight(0xbcd0f5, 1.5);
  key.position.set(6, 10, 12);
  scene.add(key);
  var warm = new THREE.PointLight(0xe02b34, 1.1, 60);
  warm.position.set(-12, 2, 8);
  scene.add(warm);

  /* ——— самолёт ——— */
  function makeBiplane(scale) {
    var plane = new THREE.Group();
    var body = new THREE.MeshPhongMaterial({ color: 0x2b3a55, shininess: 30 });
    var dark = new THREE.MeshPhongMaterial({ color: 0x1d2942, shininess: 20 });

    function box(w, h, d, mat, x, y, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || body);
      m.position.set(x || 0, y || 0, z || 0);
      plane.add(m);
      return m;
    }

    box(5.4, 0.8, 0.8, body, 0, 0, 0);                 // фюзеляж
    box(4.6, 0.12, 1.7, dark, 0.1, 0.95, 0);           // верхнее крыло
    box(4.2, 0.12, 1.5, dark, 0.3, -0.05, 0);          // нижнее крыло
    box(0.1, 0.95, 0.1, dark, -1.2, 0.45, 0.6);        // стойки
    box(0.1, 0.95, 0.1, dark, -1.2, 0.45, -0.6);
    box(0.1, 0.95, 0.1, dark, 1.5, 0.45, 0.6);
    box(0.1, 0.95, 0.1, dark, 1.5, 0.45, -0.6);
    box(1.0, 0.1, 1.9, dark, -2.5, 0.1, 0);            // хвостовое оперение
    box(0.1, 0.85, 0.8, dark, -2.6, 0.5, 0);
    box(0.9, 0.45, 0.7, dark, 0.9, 0.55, 0);           // кабина

    var prop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.12), body);
    prop.position.set(2.85, 0, 0);
    plane.add(prop);

    function light(color) {
      var l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: color }));
      return l;
    }
    var left = light(0xe02b34); left.position.set(0.1, 0.95, 0.95); plane.add(left);
    var right = light(0x46a55b); right.position.set(0.1, 0.95, -0.95); plane.add(right);

    plane.scale.setScalar(scale);
    plane.userData.prop = prop;
    return plane;
  }

  /* на узких экранах текст занимает всю ширину — оставляем только звёзды */
  var wide = window.innerWidth >= 760;

  /* луна */
  if (wide) {
    var moon = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.MeshBasicMaterial({ color: 0xf3e7ca, transparent: true, opacity: .82 }));
    moon.position.set(6.4, 8.6, -26);
    scene.add(moon);
    var halo = new THREE.Mesh(new THREE.CircleGeometry(6.4, 48), new THREE.MeshBasicMaterial({ color: 0xefc75e, transparent: true, opacity: .07 }));
    halo.position.set(6.4, 8.6, -26.4);
    scene.add(halo);
  }

  /* два биплана кружат в правой части неба, чтобы не спорить с текстом */
  var planes = [
    { mesh: makeBiplane(0.95), cx: 5.4, cy: 6.1, cz: -1.5, rx: 3.0, ry: 1.1, speed: 0.22, phase: 0.4 },
    { mesh: makeBiplane(0.6), cx: 7.2, cy: 3.9, cz: -9, rx: 2.2, ry: 0.85, speed: 0.16, phase: 2.7 }
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
    stars.rotation.y = t * 0.006;
    gold.rotation.y = -t * 0.01;

    if (showPlanes) planes.forEach(function (p) {
      var m = p.mesh;
      var a = t * p.speed + p.phase;
      m.position.x = p.cx + Math.cos(a) * p.rx;
      m.position.y = p.cy + Math.sin(a) * p.ry;
      m.position.z = p.cz + Math.sin(a * 0.7) * 1.4;
      m.rotation.y = -Math.cos(a) * 0.42;
      m.rotation.z = -Math.sin(a) * 0.22;
      m.rotation.x = Math.sin(a * 0.9) * 0.05;
      if (p.mesh.userData.prop) p.mesh.userData.prop.rotation.x += 0.85;
    });

    renderer.render(scene, camera);
    if (running && !reduceMotion) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);

  /* высота первого экрана меняется после загрузки шрифтов — следим за размером */
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { resize(); }).observe(canvas);
  }
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { resize(); });
  }
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