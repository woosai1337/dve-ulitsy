/* «Улица Галины Докутович» — интерактивная модель По-2.
   Модель собрана по трёхпроекционному чертежу: размах 11,4 м, длина 8,7 м.
   Работает без WebGL? Показываем фотографию. Уважает prefers-reduced-motion. */
(function () {
  "use strict";

  var canvas = document.getElementById("planeCanvas");
  if (!canvas) return;

  var stage = canvas.parentNode;
  while (stage && !stage.classList.contains("plane__stage")) stage = stage.parentNode;
  if (!stage) stage = canvas.parentNode;
  if (typeof THREE === "undefined") {
    stage.classList.add("is-fallback");
    return;
  }

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}
  var staticMode = /(?:\?|&)static=1/.test(window.location.search);
  var motion = !reduceMotion && !staticMode;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    stage.classList.add("is-fallback");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  camera.position.set(15.8, 5.4, 11.0);
  camera.lookAt(0, 0.35, 0.3);

  /* ——— свет: тёплая бумага + холодное небо ——— */
  scene.add(new THREE.HemisphereLight(0xfff7e8, 0x77816a, 1.45));
  var key = new THREE.DirectionalLight(0xfff3dd, 2.35);
  key.position.set(7, 11, 7);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xcfe2ee, 1.0);
  fill.position.set(-9, 4, -5);
  scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffffff, 0.7);
  rim.position.set(-3, -6, 6);
  scene.add(rim);

  /* ——— материалы ——— */
  function m(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.78, metalness: 0.04 }, opts || {}));
  }
  var olive = m(0x5f6e48);
  var oliveDark = m(0x4b5838);
  var linen = m(0xd5cdb4, { roughness: 0.9, side: THREE.DoubleSide });
  var red = m(0xb02129, { roughness: 0.62 });
  var metal = m(0x8d918a, { roughness: 0.42, metalness: 0.55 });
  var metalDark = m(0x3c403a, { roughness: 0.5, metalness: 0.4 });
  var tyre = m(0x222320, { roughness: 0.95 });
  var wood = m(0x775232, { roughness: 0.8 });
  var coaming = m(0x4c3a2a, { roughness: 0.8 });
  var cockpitDark = m(0x171a16, { roughness: 1 });
  var glass = new THREE.MeshStandardMaterial({ color: 0xb9d5df, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
  var wire = m(0x30332e, { roughness: 0.6, metalness: 0.5 });

  var plane = new THREE.Group();
  plane.rotation.z = -0.015;

  function add(geo, mat, x, y, z, parent) {
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    (parent || plane).add(mesh);
    return mesh;
  }

  function tube(a, b, r, mat, parent) {
    var dir = new THREE.Vector3().subVectors(b, a);
    var len = dir.length();
    var geo = new THREE.CylinderGeometry(r, r, len, 8);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    (parent || plane).add(mesh);
    return mesh;
  }

  function v(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ——— фюзеляж: выдавленный боковой профиль ——— */
  (function fuselage() {
    var s = new THREE.Shape();
    s.moveTo(3.98, 0.5);
    s.bezierCurveTo(4.34, 0.5, 4.56, 0.32, 4.56, 0.02);
    s.bezierCurveTo(4.56, -0.3, 4.3, -0.5, 3.92, -0.52);
    s.lineTo(1.4, -0.55);
    s.bezierCurveTo(-0.9, -0.55, -2.55, -0.4, -4.1, -0.17);
    s.quadraticCurveTo(-4.42, -0.11, -4.44, 0.02);
    s.lineTo(-4.44, 0.13);
    s.bezierCurveTo(-2.9, 0.27, -1.2, 0.46, 0.9, 0.56);
    s.quadraticCurveTo(2.9, 0.62, 3.98, 0.5);
    s.closePath();
    var geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.88, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.05, bevelSegments: 3, curveSegments: 18
    });
    geo.rotateY(-Math.PI / 2);
    geo.translate(0.42, 0, 0);
    add(geo, olive, 0, 0, 0);

    /* верхний стрингер и «гаргрот» за кабиной */
    add(new THREE.BoxGeometry(0.13, 0.035, 4.6), oliveDark, 0, 0.59, -1.2);
    add(new THREE.BoxGeometry(0.36, 0.07, 3.0), olive, 0, 0.655, -0.8);
    add(new THREE.BoxGeometry(0.19, 0.05, 1.5), oliveDark, 0, 0.585, 2.35);

    /* кабина пилота и штурмана */
    function cockpit(z, wide) {
      var disk = add(new THREE.CircleGeometry(0.275, 26), cockpitDark, 0, 0.663, z);
      disk.rotation.x = -Math.PI / 2;
      disk.scale.set(wide || 1, 1, 1);
      var ring = add(new THREE.TorusGeometry(0.282, 0.038, 8, 26), coaming, 0, 0.685, z);
      ring.rotation.x = -Math.PI / 2;
      ring.scale.set(wide || 1, 1.15, 1);
      var shield = add(new THREE.PlaneGeometry(0.46, 0.22), glass, 0, 0.82, z + 0.38);
      shield.rotation.x = 0.42;
      /* рамка козырька */
      add(new THREE.BoxGeometry(0.5, 0.018, 0.018), metalDark, 0, 0.93, z + 0.34);
    }
    cockpit(1.22, 1);
    cockpit(-0.02, 0.95);

    /* подголовники и парусиновые борта кабин */
    add(new THREE.BoxGeometry(0.4, 0.13, 0.07), coaming, 0, 0.71, 0.78);
    add(new THREE.BoxGeometry(0.34, 0.1, 0.06), coaming, 0, 0.71, -0.42);

    /* маленькие лючки и поручни на борту */
    var hatch = add(new THREE.CircleGeometry(0.075, 16), oliveDark, 0.505, -0.05, 2.35);
    hatch.rotation.y = Math.PI / 2;
    var hatch2 = add(new THREE.CircleGeometry(0.06, 16), oliveDark, -0.505, 0.02, 2.15);
    hatch2.rotation.y = -Math.PI / 2;
  })();

  /* ——— мотор М-11 и капот ——— */
  (function engine() {
    var cowl = add(new THREE.CylinderGeometry(0.575, 0.635, 0.78, 36, 1, true), olive, 0, 0, 4.28);
    cowl.rotation.x = Math.PI / 2;
    var lip = add(new THREE.TorusGeometry(0.575, 0.045, 8, 36), metalDark, 0, 0, 4.67);
    var face = add(new THREE.CircleGeometry(0.55, 32), cockpitDark, 0, 0, 4.64);
    face.rotation.y = 0;

    for (var i = 0; i < 5; i++) {
      var a = Math.PI / 2 + i * Math.PI * 2 / 5;
      var radial = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
      var cyl = new THREE.Group();
      var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.115, 0.36, 12), metal);
      barrel.position.y = 0.18;
      cyl.add(barrel);
      for (var f = 0; f < 4; f++) {
        var fin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.016, 12), metalDark);
        fin.position.y = 0.08 + f * 0.065;
        cyl.add(fin);
      }
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), radial);
      cyl.position.copy(radial.clone().multiplyScalar(0.34)).setZ(4.55);
      plane.add(cyl);
    }
    add(new THREE.SphereGeometry(0.2, 20, 14), metalDark, 0, 0, 4.66);

    /* выхлопной патрубок */
    var curve = new THREE.CatmullRomCurve3([
      v(0.42, -0.05, 4.4), v(0.62, -0.2, 3.9), v(0.66, -0.38, 3.1), v(0.58, -0.45, 2.5)
    ]);
    add(new THREE.TubeGeometry(curve, 20, 0.035, 8, false), metalDark, 0, 0, 0);
  })();


  /* ——— крылья ——— */
  function wingShape(span, chord, notch) {
    var h = span / 2;
    var s = new THREE.Shape();
    s.moveTo(-h, 0);
    s.lineTo(h, 0);
    s.quadraticCurveTo(h + 0.04, chord * 0.5, h - 0.28, chord * 0.82);
    s.quadraticCurveTo(h - 0.55, chord, h - 0.95, chord);
    if (notch) {
      /* вырез в центроплане над кабинами — как у настоящего По-2 */
      s.lineTo(1.06, chord);
      s.quadraticCurveTo(0.94, chord, 0.9, chord - 0.5);
      s.quadraticCurveTo(0.86, chord - 0.64, 0.72, chord - 0.64);
      s.lineTo(-0.72, chord - 0.64);
      s.quadraticCurveTo(-0.86, chord - 0.64, -0.9, chord - 0.5);
      s.quadraticCurveTo(-0.94, chord, -1.06, chord);
    }
    s.lineTo(-h + 0.95, chord);
    s.quadraticCurveTo(-h + 0.55, chord, -h + 0.28, chord * 0.82);
    s.quadraticCurveTo(-h - 0.04, chord * 0.5, -h, 0);
    s.closePath();
    return s;
  }

  function makeWing(span, chord, y, z, thickness, notch) {
    var geo = new THREE.ExtrudeGeometry(wingShape(span, chord, notch), {
      depth: thickness, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.02, bevelSegments: 2, curveSegments: 14
    });
    geo.rotateX(-Math.PI / 2);
    add(geo, olive, 0, y, z);
    /* нервюры и полотняные швы сверху */
    for (var x = -span / 2 + 0.65; x <= span / 2 - 0.65; x += 0.52) {
      if (Math.abs(x) < 0.7) continue;
      add(new THREE.BoxGeometry(0.016, 0.008, chord * 0.9), oliveDark, x, y + thickness + 0.006, z - chord * 0.5);
    }
    /* задняя кромка/элероны */
    function hinge(x1, x2) {
      add(new THREE.BoxGeometry(Math.abs(x2 - x1), 0.01, 0.014), oliveDark, (x1 + x2) / 2, y + thickness + 0.009, z - chord * 0.79);
    }
    hinge(2.35, 4.95); hinge(-4.95, -2.35);
    return { y: y, z: z, chord: chord };
  }

  var upper = makeWing(11.4, 1.48, 1.5, 3.12, 0.115, false);
  var lower = makeWing(10.8, 1.4, -0.42, 2.35, 0.1);

  /* светлая полотняная обшивка снизу крыльев */
  function underside(span, chord, y, z, notch) {
    var sg = new THREE.ShapeGeometry(wingShape(span - 0.08, chord - 0.06, notch), 12);
    sg.rotateX(-Math.PI / 2);
    add(sg, linen, 0, y - 0.012, z - 0.03);
  }
  underside(11.4, 1.5, 1.5, 3.12, false);
  underside(10.8, 1.42, -0.42, 2.35);
  add(new THREE.BoxGeometry(0.82, 0.04, 4.5), linen, 0, -0.535, 0.1);

  /* ——— стойки и расчалки ——— */
  (function rigging() {
    var xs = [2.9, -2.9];
    xs.forEach(function (x) {
      tube(v(x, -0.36, 2.15), v(x, 1.48, 2.72), 0.042, wood);
      tube(v(x, -0.36, 1.0), v(x, 1.48, 1.35), 0.042, wood);
      tube(v(x, -0.36, 2.12), v(x, 1.46, 1.37), 0.012, wire);
      tube(v(x, -0.36, 1.03), v(x, 1.46, 2.7), 0.012, wire);
    });
    /* кабанные стойки у фюзеляжа */
    [0.34, -0.34].forEach(function (x) {
      tube(v(x, 0.55, 2.8), v(x * 1.6, 1.47, 2.88), 0.035, wood);
      tube(v(x, 0.55, 1.55), v(x * 1.6, 1.47, 1.63), 0.035, wood);
    });
    /* передние и задние растяжки кабана */
    tube(v(0.34, 0.58, 2.8), v(-0.54, 1.45, 2.88), 0.008, wire);
    tube(v(-0.34, 0.58, 2.8), v(0.54, 1.45, 2.88), 0.008, wire);

    /* стойки шасси */
    [1, -1].forEach(function (s) {
      var axle = v(s * 1.05, -1.22, 1.78);
      tube(v(s * 0.3, -0.48, 2.0), axle, 0.05, wood);
      tube(v(s * 0.88, -0.42, 1.6), axle, 0.045, wood);
      tube(v(s * 0.3, -0.48, 1.5), axle, 0.03, metalDark);
    });
    tube(v(-1.05, -1.22, 1.78), v(1.05, -1.22, 1.78), 0.025, metalDark);

    /* антенна */
    tube(v(0, 0.66, 0.1), v(0, 1.2, -3.55), 0.006, wire);
  })();

  /* ——— шасси ——— */
  (function gear() {
    [1, -1].forEach(function (s) {
      var x = s * 1.05;
      var tyreMesh = add(new THREE.TorusGeometry(0.315, 0.095, 10, 28), tyre, x, -1.22, 1.78);
      tyreMesh.rotation.y = Math.PI / 2;
      var hub = add(new THREE.CylinderGeometry(0.235, 0.235, 0.12, 20), metal, x, -1.22, 1.78);
      hub.rotation.z = Math.PI / 2;
      var cap = add(new THREE.CylinderGeometry(0.075, 0.075, 0.14, 16), red, x, -1.22, 1.78);
      cap.rotation.z = Math.PI / 2;
    });
    /* хвостовой костыль */
    tube(v(0, -0.28, -3.7), v(0, -0.62, -4.0), 0.028, metalDark);
    add(new THREE.BoxGeometry(0.08, 0.05, 0.3), metalDark, 0, -0.64, -4.1);
  })();

  /* ——— хвост ——— */
  (function tail() {
    /* стабилизатор */
    var hs = wingShape(3.7, 0.95);
    var hg = new THREE.ExtrudeGeometry(hs, { depth: 0.075, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.02, bevelSegments: 2, curveSegments: 12 });
    hg.rotateX(-Math.PI / 2);
    add(hg, olive, 0, 0.16, -3.34);
    add(new THREE.BoxGeometry(2.9, 0.008, 0.016), oliveDark, 0, 0.255, -3.98);

    /* киль и руль направления */
    var fs = new THREE.Shape();
    fs.moveTo(-2.9, 0.12);
    fs.lineTo(-3.18, 0.9);
    fs.bezierCurveTo(-3.38, 1.48, -3.7, 1.72, -4.0, 1.64);
    fs.bezierCurveTo(-4.3, 1.54, -4.46, 0.95, -4.5, 0.32);
    fs.lineTo(-4.5, 0.12);
    fs.closePath();
    var fg = new THREE.ExtrudeGeometry(fs, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.018, bevelSegments: 2, curveSegments: 14 });
    fg.rotateY(-Math.PI / 2);
    fg.translate(0.035, 0, 0);
    add(fg, olive, 0, 0, 0);
    /* руль — чуть темнее, зазор */
    add(new THREE.BoxGeometry(0.012, 1.0, 0.02), oliveDark, 0.045, 0.82, -4.28);

    /* расчалки хвоста */
    tube(v(0, 1.28, -3.82), v(1.55, 0.19, -3.9), 0.007, wire);
    tube(v(0, 1.28, -3.82), v(-1.55, 0.19, -3.9), 0.007, wire);
  })();


    var sg = starGeo(0.17);
    [0.045, -0.045].forEach(function (x) {
      var st = new THREE.Mesh(sg, red);
      st.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
      st.position.set(x, 0.92, -4.12);
      plane.add(st);
    });

  /* ——— винт ——— */
  var prop = new THREE.Group();
  (function propeller() {
    var hub = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.3, 18), metalDark);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.16;
    prop.add(hub);
    var bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0.06);
    bladeShape.bezierCurveTo(0.17, 0.26, 0.13, 0.92, 0.045, 1.11);
    bladeShape.quadraticCurveTo(0, 1.17, -0.045, 1.11);
    bladeShape.bezierCurveTo(-0.13, 0.92, -0.17, 0.26, 0, 0.06);
    var bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 });
    var b1 = new THREE.Mesh(bladeGeo, wood);
    var b2 = new THREE.Mesh(bladeGeo, wood);
    b2.rotation.z = Math.PI;
    prop.add(b1); prop.add(b2);
    prop.position.set(0, 0, 4.96);
    plane.add(prop);

    /* лёгкий диск «вращения» */
    var blurCanvas = document.createElement("canvas");
    blurCanvas.width = blurCanvas.height = 256;
    var bg = blurCanvas.getContext("2d");
    var grad = bg.createRadialGradient(128, 128, 10, 128, 128, 126);
    grad.addColorStop(0, "rgba(120,92,58,0)");
    grad.addColorStop(0.45, "rgba(120,92,58,0)");
    grad.addColorStop(0.72, "rgba(120,92,58,.12)");
    grad.addColorStop(0.94, "rgba(80,60,38,.20)");
    grad.addColorStop(1, "rgba(80,60,38,0)");
    bg.fillStyle = grad;
    bg.fillRect(0, 0, 256, 256);
    var blur = new THREE.Mesh(
      new THREE.CircleGeometry(1.12, 48),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blurCanvas), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide })
    );
    blur.position.set(0, 0, 4.99);
    blur.visible = motion;
    plane.add(blur);
  })();

  /* ——— звёзды ——— */
  function starGeo(r) {
    var s = new THREE.Shape();
    for (var i = 0; i < 10; i++) {
      var rr = i % 2 ? r * 0.42 : r;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: false, curveSegments: 4 });
  }
  (function stars() {
    var g = starGeo(0.25);
    var left = new THREE.Mesh(g, red);
    left.rotation.y = -Math.PI / 2;
    left.position.set(-0.535, 0.1, -0.75);
    plane.add(left);
    var right = new THREE.Mesh(g, red);
    right.rotation.y = Math.PI / 2;
    right.position.set(0.535, 0.1, -0.75);
    plane.add(right);

    var wg = starGeo(0.31);
    [2.85, -2.85].forEach(function (x) {
      var st = new THREE.Mesh(wg, red);
      st.rotation.x = -Math.PI / 2;
      st.position.set(x, 1.65, 2.4);
      plane.add(st);
    });
  })();

  /* ——— мелочи: ПВД, поручни ——— */
  tube(v(4.15, 1.55, 2.95), v(5.15, 1.55, 2.95), 0.012, metal);
  add(new THREE.BoxGeometry(0.02, 0.02, 0.32), metalDark, 5.12, 1.55, 2.95);

  /* ——— земля: мягкая тень и кольцо ——— */
  (function ground() {
    var sc = document.createElement("canvas");
    sc.width = sc.height = 256;
    var g = sc.getContext("2d");
    var rg = g.createRadialGradient(128, 128, 8, 128, 128, 126);
    rg.addColorStop(0, "rgba(26,35,27,.40)");
    rg.addColorStop(0.55, "rgba(26,35,27,.18)");
    rg.addColorStop(1, "rgba(26,35,27,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 256, 256);
    var shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(10.5, 6.2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, opacity: 0.85 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -2.15, 0.6);
    scene.add(shadow);

    var ring = new THREE.Mesh(
      new THREE.RingGeometry(5.15, 5.2, 96),
      new THREE.MeshBasicMaterial({ color: 0x2f7a45, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.09;
    scene.add(ring);
  })();

  var rig = new THREE.Group();
  rig.rotation.order = "YXZ";
  rig.add(plane);
  scene.add(rig);

  var state = {
    yaw: -0.26,
    pitch: 0.045,
    dragging: false,
    auto: motion,
    lastInput: -10,
    t: 0
  };
  if (staticMode) {
    state.yaw = -0.26;
    state.pitch = 0.045;
    state.auto = false;
  }

  function draw() {
    rig.rotation.y = state.yaw;
    rig.rotation.x = state.pitch;
    renderer.render(scene, camera);
  }

  function resize() {
    var w = canvas.clientWidth || stage.clientWidth;
    var h = canvas.clientHeight || stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!motion) draw();
  }

  var running = true;
  var clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    state.t += dt;

    if (state.auto && !state.dragging) {
      state.yaw += dt * 0.16;
    }

    rig.rotation.y = state.yaw;
    rig.rotation.x = state.pitch;
    if (motion) prop.rotation.z += dt * 13.5;
    else prop.rotation.z = 0.55;

    renderer.render(scene, camera);
    if (motion) requestAnimationFrame(frame);
  }

  /* ——— управление мышью/пальцем ——— */
  var px = 0, py = 0;
  canvas.addEventListener("pointerdown", function (e) {
    state.dragging = true;
    state.auto = false;
    px = e.clientX; py = e.clientY;
    state.lastInput = state.t;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    stage.classList.add("is-grabbing");
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!state.dragging) return;
    var dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    state.yaw += dx * 0.0075;
    state.pitch = Math.max(-0.42, Math.min(0.55, state.pitch + dy * 0.005));
    state.lastInput = state.t;
    if (!motion) draw();
  });
  function endDrag() {
    state.dragging = false;
    state.lastInput = state.t;
    stage.classList.remove("is-grabbing");
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", function () { if (state.dragging) endDrag(); });

  canvas.addEventListener("keydown", function (e) {
    var step = 0.12;
    if (e.key === "ArrowLeft") { state.yaw -= step; state.auto = false; state.lastInput = state.t; e.preventDefault(); }
    else if (e.key === "ArrowRight") { state.yaw += step; state.auto = false; state.lastInput = state.t; e.preventDefault(); }
    else if (e.key === "ArrowUp") { state.pitch = Math.max(-0.42, state.pitch - 0.08); e.preventDefault(); }
    else if (e.key === "ArrowDown") { state.pitch = Math.min(0.55, state.pitch + 0.08); e.preventDefault(); }
    if (!motion) draw();
  });

  /* после паузы возвращаем медленное вращение */
  setInterval(function () {
    if (!motion || state.dragging) return;
    if (!state.auto && state.t - state.lastInput > 5) state.auto = true;
  }, 1000);

  resize();
  window.addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(resize);
  window.addEventListener("load", resize);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; clock.getDelta(); requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }, { threshold: 0.02 }).observe(canvas);
  }

  stage.classList.add("is-ready");
  prop.rotation.z = 0.55;
  draw();
  if (motion) requestAnimationFrame(frame);
})();