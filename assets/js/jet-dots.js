(function () {
  // Large dot-field render of one jet. Dots stream in and assemble as the
  // section scrolls into view, then the camera orbits while the section is pinned.

  var VS = [
    '#version 300 es',
    'precision highp float;',
    'layout(location = 0) in vec3 aTarget;',
    'layout(location = 1) in vec3 aScatter;',
    'layout(location = 2) in vec4 aInfo;',
    'uniform mat4 uViewProj;',
    'uniform float uAssemble;',
    'uniform float uTime;',
    'uniform float uMotion;',
    'uniform float uDist;',
    'uniform vec2 uRes;',
    'uniform vec2 uPointer;',
    'uniform float uRadius;',
    'uniform float uPush;',
    'uniform float uSize;',
    'uniform float uGain;',
    'uniform float uThin;',
    'uniform vec3 uC0;',
    'uniform vec3 uC1;',
    'uniform vec3 uC2;',
    'uniform vec3 uHi;',
    'out vec3 vColor;',
    'out float vAlpha;',
    'float ease(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5; }',
    'void main() {',
    '  float shade = aInfo.x;',
    '  bool edge = aInfo.y > 6.5;',
    '  float seed = aInfo.z;',
    '  float spread = 0.7;',
    '  float dust = step(seed, 0.035);',
    '  float e = ease(clamp(uAssemble * (1.0 + spread) - aInfo.w * spread, 0.0, 1.0)) * (1.0 - dust);',
    '  float ang = (1.0 - e) * (1.8 + seed * 1.6) + dust * uTime * 0.03;',
    '  float ca = cos(ang), sa = sin(ang);',
    '  vec3 s = vec3(ca * aScatter.x - sa * aScatter.z, aScatter.y, sa * aScatter.x + ca * aScatter.z);',
    '  vec3 p = mix(s, aTarget, e);',
    '  p += uMotion * 0.005 * vec3(sin(uTime * 0.9 + seed * 31.0), sin(uTime * 1.1 + seed * 17.0), sin(uTime * 0.7 + seed * 23.0));',
    '  vec4 clip = uViewProj * vec4(p, 1.0);',
    '  vec2 ndc = clip.xy / clip.w;',
    '  vec2 px = vec2((ndc.x * 0.5 + 0.5) * uRes.x, (0.5 - ndc.y * 0.5) * uRes.y);',
    '  vec2 d = px - uPointer;',
    '  float dist = length(d);',
    '  float f = 1.0 - smoothstep(0.0, uRadius, dist);',
    '  px += (dist > 0.001 ? d / dist : vec2(0.0)) * f * f * uPush;',
    '  ndc = vec2(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0);',
    '  gl_Position = vec4(ndc * clip.w, clip.z, clip.w);',
    '  float persp = uDist / clip.w;',
    '  gl_PointSize = clamp(uSize * persp * (edge ? 1.15 : 1.0) * mix(1.5, 1.0, e), 1.0, 9.0);',
    '  if (!edge && dust < 0.5 && fract(seed * 13.7) < uThin) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vAlpha = 0.0; vColor = vec3(0.0); return; }',
    '  float g = clamp(dot(ndc, vec2(0.62, -0.78)) * 0.6 + 0.5 + (fract(seed * 7.13) - 0.5) * 1.1, 0.0, 1.0);',
    '  vec3 col = g < 0.5 ? mix(uC0, uC1, g * 2.0) : mix(uC1, uC2, g * 2.0 - 1.0);',
    '  float twinkle = 1.0 - uMotion * 0.45 * (0.5 + 0.5 * sin(uTime * (1.1 + seed * 2.6) + seed * 60.0));',
    '  float body = dust > 0.5 ? 0.35 : edge ? 0.9 : (0.14 + 0.36 * shade) * (abs(aInfo.y - 1.0) < 0.5 ? 0.45 : 1.0);',
    '  float fog = clamp(1.0 - (clip.w - uDist) * 0.38, 0.4, 1.0);',
    '  vAlpha = uGain * body * twinkle * fog * mix(0.3, 1.0, e) * (1.0 + f * 0.8);',
    '  vColor = mix(col, uHi, f * 0.3);',
    '}',
  ].join('\n');

  var FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec3 vColor;',
    'in float vAlpha;',
    'out vec4 outColor;',
    'void main() {',
    '  float r = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.28, r) * vAlpha;',
    '  if (a < 0.004) discard;',
    '  outColor = vec4(vColor * a, a);',
    '}',
  ].join('\n');

  var DEFAULTS = {
    base: 'assets/jets/',
    jet: 'f35',
    // 'light': ink dots for a light page. 'dark': gradient-colored dots for a dark page.
    theme: 'light',
    ink: '#12161d',
    colors: ['#4f7dff', '#9d5cff', '#ff4fa0'],
    size: 2.0,
    gain: 0.9,
    thin: 0.45,
    // Left-click drag rotates the jet (mouse and pen only, so touch still scrolls).
    // Double-click eases it back to the scroll path's view.
    drag: true,
    dragSpeed: 0.35,
    // Dots part around the cursor.
    hover: true,
    radius: 130,
    push: 22,
    fov: 30,
    maxDpr: 2,
    // Camera path while pinned: azimuth (deg, 90 = right side), elevation (deg), distance multiplier.
    path: [
      { at: 0, az: 150, el: 48, zoom: 1.0 },
      { at: 0.5, az: 92, el: 18, zoom: 0.9 },
      { at: 1, az: 32, el: 9, zoom: 0.94 },
    ],
  };

  function hex(c) {
    var n = parseInt(c.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function program(gl) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {};
    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p: p, u: u };
  }

  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }

  function lookAt(eye, up) {
    var z = norm([eye[0], eye[1], eye[2]]);
    var x = norm(cross(up, z));
    var y = cross(z, x);
    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
    ];
  }

  function multiply(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }

  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  function cameraAt(path, q) {
    for (var i = 1; i < path.length; i++) {
      if (q <= path[i].at || i === path.length - 1) {
        var a = path[i - 1], b = path[i];
        var t = smooth(clamp((q - a.at) / ((b.at - a.at) || 1), 0, 1));
        return { az: lerp(a.az, b.az, t), el: lerp(a.el, b.el, t), zoom: lerp(a.zoom, b.zoom, t) };
      }
    }
    return path[0];
  }

  function start(canvas, section, options) {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = DEFAULTS[k]; });
    Object.keys(options || {}).forEach(function (k) { o[k] = options[k]; });
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) return null;
    var prog = program(gl);
    var vao = null, count = 0;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var view = { w: 0, h: 0, dpr: 1 };
    var state = { assemble: reduced ? 1 : 0, orbit: reduced ? 0.5 : 0, px: -1e4, py: -1e4 };
    var pointer = { x: -1e4, y: -1e4 };
    // User rotation (degrees) layered on top of the scroll path, with release momentum.
    var spin = { az: 0, el: 0, vaz: 0, vel: 0, id: null, x: 0, y: 0, t: 0, reset: false };
    var EL_MIN = -70, EL_MAX = 80;
    var time = 0, last = 0, raf = 0, visible = false, ready = false;
    var dark = o.theme === 'dark';
    var ink = hex(o.ink);
    var colors = dark ? o.colors.map(hex) : [ink, ink, ink];
    var hi = dark ? [1, 1, 1] : ink;

    function load() {
      return fetch(o.base + 'jets.json').then(function (r) { return r.json(); }).then(function (manifest) {
        var meta = manifest.jets.filter(function (j) { return j.id === o.jet; })[0];
        if (!meta) throw new Error('Unknown jet: ' + o.jet);
        return fetch(o.base + meta.file).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
          var dv = new DataView(buf);
          var n = meta.count;
          var data = new Float32Array(n * 10);
          var seed = 1234567;
          var rand = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
          for (var i = 0; i < n; i++) {
            var b = i * 8, k = i * 10;
            var x = dv.getInt16(b, true) / 32767;
            data[k] = x;
            data[k + 1] = dv.getInt16(b + 2, true) / 32767;
            data[k + 2] = dv.getInt16(b + 4, true) / 32767;
            var u = rand() * 2 - 1, th = rand() * Math.PI * 2, rr = 1.6 + Math.pow(rand(), 0.6) * 2.2;
            var ring = Math.sqrt(1 - u * u);
            data[k + 3] = ring * Math.cos(th) * rr;
            data[k + 4] = u * rr * 0.55;
            data[k + 5] = ring * Math.sin(th) * rr;
            data[k + 6] = dv.getUint8(b + 6) / 255;
            data[k + 7] = dv.getUint8(b + 7);
            data[k + 8] = rand();
            data[k + 9] = 0.55 * (1 - (x + 1) / 2) + 0.45 * rand();
          }
          vao = gl.createVertexArray();
          gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(0);
          gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
          gl.enableVertexAttribArray(1);
          gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
          gl.enableVertexAttribArray(2);
          gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
          gl.bindVertexArray(null);
          count = n;
        });
      });
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, o.maxDpr);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      var W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
      if (W !== canvas.width || H !== canvas.height) {
        canvas.width = W;
        canvas.height = H;
      }
      view.w = w;
      view.h = h;
      view.dpr = dpr;
    }

    function targets() {
      var r = section.getBoundingClientRect();
      var vh = window.innerHeight;
      return {
        assemble: clamp(1 - (r.top + 0.1 * vh) / (0.95 * vh), 0, 1),
        orbit: clamp(-r.top / Math.max(1, r.height - vh), 0, 1),
      };
    }

    function render() {
      resize();
      var W = canvas.width, H = canvas.height, aspect = W / H;
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!vao) return;

      var fov = o.fov * Math.PI / 180;
      var span = 2 * Math.tan(fov / 2);
      var dist = Math.max(2.6 / (span * aspect), 2.2 / span);
      var narrow = clamp((900 - view.w) / 500, 0, 1);
      var cam = cameraAt(o.path, state.orbit);
      var sway = reduced ? 0 : Math.sin(time * 0.35) * 2.5;
      var az = (cam.az + sway + spin.az) * Math.PI / 180;
      var el = clamp(cam.el + (reduced ? 0 : Math.sin(time * 0.27) * 1.5) + spin.el, EL_MIN, EL_MAX) * Math.PI / 180;
      var d = dist * cam.zoom;
      var eye = [d * Math.cos(el) * Math.cos(az), d * Math.sin(el), d * Math.cos(el) * Math.sin(az)];
      var vp = multiply(perspective(fov, aspect, 0.1, 50), lookAt(eye, [0, 1, 0]));

      gl.useProgram(prog.p);
      gl.uniformMatrix4fv(prog.u.uViewProj, false, vp);
      gl.uniform1f(prog.u.uAssemble, state.assemble);
      gl.uniform1f(prog.u.uTime, time);
      gl.uniform1f(prog.u.uMotion, reduced ? 0 : 1);
      gl.uniform1f(prog.u.uDist, d);
      gl.uniform2f(prog.u.uRes, W, H);
      gl.uniform2f(prog.u.uPointer, state.px * view.dpr, state.py * view.dpr);
      gl.uniform1f(prog.u.uRadius, o.radius * view.dpr);
      gl.uniform1f(prog.u.uPush, o.push * view.dpr);
      gl.uniform1f(prog.u.uSize, o.size * view.dpr * lerp(Math.min(1.25, Math.max(0.85, view.w / 1200)), 0.72, narrow));
      gl.uniform1f(prog.u.uGain, o.gain * (dark ? 1 : lerp(0.78, 0.62, narrow)) * lerp(1, 0.85, narrow));
      gl.uniform1f(prog.u.uThin, lerp(o.thin, 0.75, narrow));
      gl.uniform3fv(prog.u.uC0, colors[0]);
      gl.uniform3fv(prog.u.uC1, colors[1]);
      gl.uniform3fv(prog.u.uC2, colors[2]);
      gl.uniform3fv(prog.u.uHi, hi);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.bindVertexArray(null);
    }

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(dt);
      render();
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
    }

    function update(dt) {
      time += dt;
      var t = targets();
      var k = 1 - Math.exp(-dt * 5);
      if (!reduced) {
        state.assemble += (t.assemble - state.assemble) * k;
        state.orbit += (t.orbit - state.orbit) * k;
      }
      var kp = 1 - Math.exp(-dt * 10);
      if (pointer.x < -1e3 || state.px < -1e3) {
        state.px = pointer.x;
        state.py = pointer.y;
      } else {
        state.px += (pointer.x - state.px) * kp;
        state.py += (pointer.y - state.py) * kp;
      }
      if (spin.reset) {
        var kr = 1 - Math.exp(-dt * 6);
        spin.az -= spin.az * kr;
        spin.el -= spin.el * kr;
        if (Math.abs(spin.az) < 0.05 && Math.abs(spin.el) < 0.05) {
          spin.az = spin.el = 0;
          spin.reset = false;
        }
      } else if (spin.id === null && !reduced) {
        spin.az += spin.vaz * dt;
        spin.el += spin.vel * dt;
        var decay = Math.exp(-dt * 4.5);
        spin.vaz *= decay;
        spin.vel *= decay;
      }
      // Keep the combined elevation in range so the tilt stops at the limits instead of piling up.
      var base = cameraAt(o.path, state.orbit).el;
      spin.el = clamp(spin.el, EL_MIN - base, EL_MAX - base);
    }

    function wake() {
      if (raf || !ready || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function onPointer(e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }

    function onLeave() {
      pointer.x = pointer.y = -1e4;
    }

    function onDown(e) {
      if (e.button !== 0 || e.pointerType === 'touch' || spin.id !== null) return;
      e.preventDefault();
      spin.id = e.pointerId;
      spin.x = e.clientX;
      spin.y = e.clientY;
      spin.t = performance.now();
      spin.vaz = spin.vel = 0;
      spin.reset = false;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      canvas.classList.add('dragging');
    }

    function onDrag(e) {
      if (e.pointerId !== spin.id) return;
      var now = performance.now();
      var dx = e.clientX - spin.x, dy = e.clientY - spin.y;
      var secs = Math.max(0.008, (now - spin.t) / 1000);
      var daz = dx * o.dragSpeed, del = dy * o.dragSpeed;
      spin.az += daz;
      spin.el += del;
      spin.vaz = clamp(lerp(spin.vaz, daz / secs, 0.5), -300, 300);
      spin.vel = clamp(lerp(spin.vel, del / secs, 0.5), -300, 300);
      spin.x = e.clientX;
      spin.y = e.clientY;
      spin.t = now;
    }

    function onUp(e) {
      if (e.pointerId !== spin.id) return;
      // Only carry momentum if the pointer was still moving when released.
      if (performance.now() - spin.t > 80) spin.vaz = spin.vel = 0;
      spin.id = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      canvas.classList.remove('dragging');
    }

    function onReset() {
      spin.az -= Math.round(spin.az / 360) * 360;
      spin.vaz = spin.vel = 0;
      spin.reset = true;
    }

    var observer = new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      wake();
    });

    var done = load().then(function () {
      ready = true;
      if (!reduced) {
        var t = targets();
        state.assemble = t.assemble;
        state.orbit = t.orbit;
      }
      observer.observe(section);
      if (o.hover) {
        addEventListener('pointermove', onPointer, { passive: true });
        document.addEventListener('pointerleave', onLeave);
      }
      if (o.drag) {
        canvas.classList.add('draggable');
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onDrag);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onUp);
        canvas.addEventListener('lostpointercapture', onUp);
        canvas.addEventListener('dblclick', onReset);
      }
      document.addEventListener('visibilitychange', wake);
    });

    return {
      ready: done,
      advance: function (seconds) {
        for (var i = 0; i < Math.round(seconds * 60); i++) update(1 / 60);
        render();
      },
      destroy: function () {
        cancelAnimationFrame(raf);
        observer.disconnect();
        removeEventListener('pointermove', onPointer);
        document.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onDrag);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('lostpointercapture', onUp);
        canvas.removeEventListener('dblclick', onReset);
        canvas.classList.remove('draggable', 'dragging');
        document.removeEventListener('visibilitychange', wake);
      },
    };
  }

  window.JetDots = { start: start, defaults: DEFAULTS };
})();
