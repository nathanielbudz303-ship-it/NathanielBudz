(function () {
  var JET_VS = '#version 300 es\n' +
    'precision highp float;\n' +
    'layout(location = 0) in vec4 aP;\n' +
    'layout(location = 1) in float aTag;\n' +
    'uniform mat3 uM;\n' +
    'uniform vec2 uPos;\n' +
    'uniform vec2 uGrid;\n' +
    'uniform float uW;\n' +
    'uniform vec3 uBody;\n' +
    'uniform vec3 uEdge;\n' +
    'uniform vec3 uCanopy;\n' +
    'uniform vec3 uNavR;\n' +
    'uniform vec3 uNavG;\n' +
    'uniform float uNav;\n' +
    'uniform float uEdgeW;\n' +
    'out vec3 vC;\n' +
    'out float vW;\n' +
    'void main() {\n' +
    '  vec2 px = uPos + (uM * aP.xyz).xy;\n' +
    '  gl_Position = vec4(px.x / uGrid.x * 2.0 - 1.0, 1.0 - px.y / uGrid.y * 2.0, 0.0, 1.0);\n' +
    '  gl_PointSize = 1.0;\n' +
    '  float w = uW * (0.55 + 0.45 * aP.w);\n' +
    '  vec3 c = uBody;\n' +
    '  if (aTag > 6.5) { c = uEdge; w = uW * uEdgeW; }\n' +
    '  else if (aTag > 5.5) { c = uCanopy; }\n' +
    '  else if (aTag > 4.5) { if (uNav > 0.5) { c = uNavG; w = uW * 10.0; } }\n' +
    '  else if (aTag > 3.5) { if (uNav > 0.5) { c = uNavR; w = uW * 10.0; } }\n' +
    '  else if (aTag > 1.5) { c = uBody * 0.82; }\n' +
    '  else if (aTag > 0.5) { c = uCanopy; w *= 1.3; }\n' +
    '  vC = c * w;\n' +
    '  vW = w;\n' +
    '}';

  var TRAIL_VS = '#version 300 es\n' +
    'precision highp float;\n' +
    'layout(location = 0) in vec2 aXY;\n' +
    'layout(location = 1) in float aW;\n' +
    'layout(location = 2) in vec3 aC;\n' +
    'uniform vec2 uGrid;\n' +
    'uniform float uScale;\n' +
    'out vec3 vC;\n' +
    'out float vW;\n' +
    'void main() {\n' +
    '  gl_Position = vec4(aXY.x / uGrid.x * 2.0 - 1.0, 1.0 - aXY.y / uGrid.y * 2.0, 0.0, 1.0);\n' +
    '  gl_PointSize = 1.0;\n' +
    '  vW = aW * uScale;\n' +
    '  vC = aC * vW;\n' +
    '}';

  var SPLAT_FS = '#version 300 es\n' +
    'precision highp float;\n' +
    'in vec3 vC;\n' +
    'in float vW;\n' +
    'out vec4 outColor;\n' +
    'void main() { outColor = vec4(vC, vW); }';

  var FULL_VS = '#version 300 es\n' +
    'void main() {\n' +
    '  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);\n' +
    '  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);\n' +
    '}';

  var ASCII_FS = '#version 300 es\n' +
    'precision highp float;\n' +
    'precision highp int;\n' +
    'uniform sampler2D uDensity;\n' +
    'uniform sampler2D uAtlas;\n' +
    'uniform ivec2 uCell;\n' +
    'uniform int uRows;\n' +
    'uniform int uHeight;\n' +
    'uniform int uLevels;\n' +
    'uniform float uGain;\n' +
    'uniform float uGamma;\n' +
    'uniform float uJitter;\n' +
    'uniform float uGrid;\n' +
    'uniform float uTime;\n' +
    'uniform vec3 uInk;\n' +
    'out vec4 outColor;\n' +
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
    'void main() {\n' +
    '  ivec2 p = ivec2(gl_FragCoord.xy);\n' +
    '  int yTop = uHeight - 1 - p.y;\n' +
    '  ivec2 cell = ivec2(p.x / uCell.x, yTop / uCell.y);\n' +
    '  ivec2 local = ivec2(p.x - cell.x * uCell.x, yTop - cell.y * uCell.y);\n' +
    '  vec4 d = texelFetch(uDensity, ivec2(cell.x, uRows - 1 - cell.y), 0);\n' +
    '  float level = pow(1.0 - exp(-d.a * uGain), uGamma);\n' +
    '  vec3 col = uInk;\n' +
    '  float alpha = uGrid;\n' +
    '  int glyph = uLevels;\n' +
    '  if (level > 0.035) {\n' +
    '    float jitter = (hash(vec2(cell) + floor(uTime * 7.0)) - 0.5) * uJitter;\n' +
    '    glyph = clamp(int((level + jitter) * float(uLevels - 1) + 0.5), 1, uLevels - 1);\n' +
    '    col = d.rgb / max(d.a, 1e-5);\n' +
    '    alpha = 1.0;\n' +
    '  }\n' +
    '  float m = texelFetch(uAtlas, ivec2(glyph * uCell.x + local.x, local.y), 0).r;\n' +
    '  float a = m * alpha;\n' +
    '  outColor = vec4(col * a, a);\n' +
    '}';

  var RAMPS = {
    classic: ' .:-=+*#%@',
    detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    blocks: ' ░▒▓█',
    minimal: ' .+#',
    terminal: ' .-=o#@',
    binary: ' 01',
    dots: ' .·:•o',
  };

  var THEMES = {
    light: { bg: '#f3f3f0', ink: '#1b2230', bodies: { yf23: '#4f5e73', f35: '#2c323b' }, edge: '#161b24', canopy: '#b5822a', flame: '#e0592b', trail: '#6b7586', navR: '#dc2b1f', navG: '#1a9e4b' },
    dark: { bg: '#08080e', ink: '#e4e8f0', bodies: { yf23: '#b3c2d6', f35: '#e1e4ea' }, edge: '#ffffff', canopy: '#f2bd52', flame: '#ff7b3b', trail: '#7c8597', navR: '#ff4a3d', navG: '#3ddc84' },
  };

  var DEFAULTS = {
    base: 'jets/',
    jets: ['yf23', 'f35'],
    theme: 'light',
    color: true,
    count: 3,
    size: [0.12, 0.21],
    speed: 1,
    turnRate: 0.42,
    bank: 1.0,
    formation: 0.3,
    breaks: true,
    breakEvery: 30,
    tilt: 0.3,
    avoid: true,
    pattern: 'lanes',
    meander: 0.16,
    flowDrift: 0.35,
    separate: true,
    separation: 1,
    lookahead: 5,
    cellW: 8,
    cellH: 8,
    glyph: 1,
    weight: 500,
    ramp: RAMPS.classic,
    gain: 2.2,
    gamma: 0.75,
    edges: 1.25,
    jitter: 0.1,
    dots: 0.1,
    contrails: true,
    contrailLife: 2.8,
    contrailStrength: 1.1,
    afterburner: true,
    nav: true,
    maxDpr: 2,
    font: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
  };

  var TAU = Math.PI * 2;
  var TRAIL_MAX = 12000;

  function hex(c) {
    var n = parseInt(c.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function wrap(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  function program(gl, vs, fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]);
      gl.shaderSource(sh, s[1]);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {};
    for (var i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      var name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p: p, u: u };
  }

  function orientation(heading, roll, pitch, tilt, scale) {
    var ch = Math.cos(heading), sh = Math.sin(heading);
    var cr = Math.cos(roll), sr = Math.sin(roll);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var ct = Math.cos(tilt), st = Math.sin(tilt);
    var A = [[cp, -sp * cr, sp * sr], [sp, cp * cr, -cp * sr], [0, sr, cr]];
    var H = [[ch, 0, -sh], [0, 1, 0], [sh, 0, ch]];
    var W = [0, 1, 2].map(function (r) {
      return [0, 1, 2].map(function (c) { return H[r][0] * A[0][c] + H[r][1] * A[1][c] + H[r][2] * A[2][c]; });
    });
    return [
      W[0].map(function (v) { return v * scale; }),
      [0, 1, 2].map(function (c) { return (W[2][c] * ct - W[1][c] * st) * scale; }),
    ];
  }

  function apply(m, p) {
    return [m[0][0] * p[0] + m[0][1] * p[1] + m[0][2] * p[2], m[1][0] * p[0] + m[1][1] * p[1] + m[1][2] * p[2]];
  }

  function start(canvas, options) {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = DEFAULTS[k]; });
    Object.keys(options || {}).forEach(function (k) { o[k] = options[k]; });
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) return null;
    var floatTarget = !!gl.getExtension('EXT_color_buffer_float');
    var weightScale = floatTarget ? 1 : 0.25;
    var jetProg = program(gl, JET_VS, SPLAT_FS);
    var trailProg = program(gl, TRAIL_VS, SPLAT_FS);
    var asciiProg = program(gl, FULL_VS, ASCII_FS);

    var types = {};
    var trailData = new Float32Array(TRAIL_MAX * 8);
    var trailDraw = new Float32Array(TRAIL_MAX * 6);
    var trailHead = 0;
    var trailVao = gl.createVertexArray();
    gl.bindVertexArray(trailVao);
    var trailBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
    gl.bufferData(gl.ARRAY_BUFFER, trailDraw.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 12);
    var emptyVao = gl.createVertexArray();
    gl.bindVertexArray(null);

    var density = gl.createTexture();
    var fbo = gl.createFramebuffer();
    var atlasTex = gl.createTexture();
    var view = { w: 0, h: 0, dpr: 1, cols: 0, rows: 0, cw: 0, ch: 0, width: 0, height: 0 };
    var atlasKey = '';
    var pointer = { x: -1e4, y: -1e4 };
    var flyers = [];
    var time = 0, last = 0, raf = 0, paused = false, dead = false, cooldown = 0, nextBreak = 1, uid = 0;
    var seed = (Date.now() & 0xffff) + 1;
    var rand = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    function rampText() {
      var r = o.ramp && o.ramp.length > 1 ? o.ramp : RAMPS.classic;
      return r[0] === ' ' ? r : ' ' + r;
    }

    function buildAtlas() {
      var ramp = rampText();
      var key = [view.cw, view.ch, ramp, o.glyph, o.weight, o.font].join('|');
      if (key === atlasKey) return;
      atlasKey = key;
      var glyphs = ramp + '·';
      var c = document.createElement('canvas');
      c.width = glyphs.length * view.cw;
      c.height = view.ch;
      var x = c.getContext('2d');
      x.font = o.weight + ' 100px ' + o.font;
      var advance = x.measureText('M').width / 100;
      var px = Math.min(view.cw / advance, view.ch * 0.92) * o.glyph;
      x.fillStyle = '#000';
      x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#fff';
      x.font = o.weight + ' ' + px.toFixed(2) + 'px ' + o.font;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      for (var i = 0; i < glyphs.length; i++) x.fillText(glyphs[i], i * view.cw + view.cw / 2, view.ch * 0.53);
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, o.maxDpr);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      var cw = Math.max(3, Math.round(o.cellW * dpr));
      var ch = Math.max(4, Math.round(o.cellH * dpr));
      var W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
      if (W !== view.width || H !== view.height || cw !== view.cw || ch !== view.ch) {
        view.w = w;
        view.h = h;
        view.dpr = dpr;
        view.width = canvas.width = W;
        view.height = canvas.height = H;
        view.cw = cw;
        view.ch = ch;
        view.cols = Math.ceil(W / cw);
        view.rows = Math.ceil(H / ch);
        gl.bindTexture(gl.TEXTURE_2D, density);
        gl.texImage2D(gl.TEXTURE_2D, 0, floatTarget ? gl.RGBA16F : gl.RGBA8, view.cols, view.rows, 0, gl.RGBA, floatTarget ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, density, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      buildAtlas();
    }

    function load() {
      return fetch(o.base + 'jets.json').then(function (r) { return r.json(); }).then(function (manifest) {
        return Promise.all(manifest.jets.map(function (meta, index) {
          return fetch(o.base + meta.file).then(function (r) {
            if (!/\.txt$/.test(meta.file)) return r.arrayBuffer();
            return r.text().then(function (b64) {
              var bin = atob(b64.trim());
              var bytes = new Uint8Array(bin.length);
              for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              return bytes.buffer;
            });
          }).then(function (buf) {
            var view8 = new DataView(buf);
            var n = meta.count;
            var order = [];
            for (var i = 0; i < n; i++) order.push(i);
            var s = 97 + index;
            for (var j = n - 1; j > 0; j--) {
              s = (s * 16807) % 2147483647;
              var k = Math.floor((s / 2147483647) * (j + 1));
              var t = order[j]; order[j] = order[k]; order[k] = t;
            }
            var pos = new Float32Array(n * 4);
            var tag = new Float32Array(n);
            order.forEach(function (src, slot) {
              var b = src * 8;
              pos[slot * 4] = view8.getInt16(b, true) / 32767;
              pos[slot * 4 + 1] = view8.getInt16(b + 2, true) / 32767;
              pos[slot * 4 + 2] = view8.getInt16(b + 4, true) / 32767;
              pos[slot * 4 + 3] = view8.getUint8(b + 6) / 255;
              tag[slot] = view8.getUint8(b + 7);
            });
            var vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            [[0, 4, pos], [1, 1, tag]].forEach(function (a) {
              gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
              gl.bufferData(gl.ARRAY_BUFFER, a[2], gl.STATIC_DRAW);
              gl.enableVertexAttribArray(a[0]);
              gl.vertexAttribPointer(a[0], a[1], gl.FLOAT, false, 0, 0);
            });
            gl.bindVertexArray(null);
            types[meta.id] = { meta: meta, vao: vao, count: n, scale: meta.scale || 1 };
          });
        }));
      });
    }

    var straight = function (t) { return { kind: 's', t: t }; };
    var turn = function (dir, angle, bank) { return { kind: 't', dir: dir, left: angle, bank: bank }; };

    function enabled() {
      var list = o.jets.filter(function (id) { return types[id]; });
      return list.length ? list : Object.keys(types);
    }

    function sizeFor(type, t) {
      var lo = Math.min(o.size[0], o.size[1]), hi = Math.max(o.size[0], o.size[1]);
      return Math.max(14, Math.min(view.w, view.h) * (lo + (hi - lo) * t)) * type.scale;
    }

    function vel(f, heading) {
      var v = f.speed * o.speed;
      return [Math.cos(heading) * v, Math.sin(heading) * v];
    }

    function crossing(ax, ay, bx, by, cx, cy, dx, dy) {
      var r1 = bx - ax, r2 = by - ay, s1 = dx - cx, s2 = dy - cy;
      var den = r1 * s2 - r2 * s1;
      if (Math.abs(den) < 1e-9) return null;
      var t = ((cx - ax) * s2 - (cy - ay) * s1) / den;
      var u = ((cx - ax) * r2 - (cy - ay) * r1) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) return null;
      return [ax + t * r1, ay + t * r2];
    }

    function conflicts(f, heading, x, y, others, T) {
      var va = vel(f, heading), n = 0;
      for (var i = 0; i < others.length; i++) {
        var g = others[i];
        if (g === f || g.group === f.group || g.leader) continue;
        var vb = vel(g, g.heading);
        var sep = ((f.S + g.S) * 1.3 + 24) * o.separation;
        var px = g.x - x, py = g.y - y, rx = vb[0] - va[0], ry = vb[1] - va[1];
        var rv = rx * rx + ry * ry;
        var t = rv > 1e-6 ? Math.max(0, Math.min(T, -(px * rx + py * ry) / rv)) : 0;
        var dx = px + rx * t, dy = py + ry * t;
        if (dx * dx + dy * dy < sep * sep) { n++; continue; }
        var hit = crossing(x, y, x + va[0] * T, y + va[1] * T, g.x, g.y, g.x + vb[0] * T, g.y + vb[1] * T);
        if (hit && hit[0] > -40 && hit[0] < view.w + 40 && hit[1] > -40 && hit[1] < view.h + 40) n++;
      }
      return n;
    }

    function extend(f) {
      var toCenter = wrap(Math.atan2(view.h / 2 - f.y, view.w / 2 - f.x) - f.heading);
      var best = null;
      for (var k = 0; k < 12; k++) {
        var dir = rand() < 0.65 ? Math.sign(toCenter) || 1 : rand() < 0.5 ? -1 : 1;
        var angle = 0.5 + rand() * 1.6;
        var c = o.separate ? conflicts(f, f.heading + dir * angle, f.x, f.y, flyers, o.lookahead) : 0;
        if (!best || c < best.c) best = { dir: dir, angle: angle, c: c };
        if (!c) break;
      }
      if (best.c && o.separate) {
        f.plan.push(straight(0.8 + rand()));
        return;
      }
      var bank = Math.min(o.bank, 0.55 + rand() * 0.45);
      f.plan.push(turn(best.dir, best.angle, Math.max(0.15, bank)), straight(1.5 + rand() * 3));
    }

    function makeFlyer(id, S, group) {
      uid++;
      return { id: id, type: types[id], S: S, roll: 0, pitch: 0, leader: null, plan: [], emit: 0, burn: 0, ph: rand() * 100, uid: uid, group: group || uid, check: 0 };
    }

    function spawn(inside) {
      var ids = enabled();
      var id = ids[Math.floor(rand() * ids.length)];
      var f = makeFlyer(id, sizeFor(types[id], rand()));
      f.speed = f.S * (1.15 + 0.4 * rand());
      var lead, best = null;
      for (var k = 0; k < 16; k++) {
        var c, x, y, hd;
        if (inside) {
          x = view.w * (0.1 + 0.8 * rand());
          y = view.h * (0.1 + 0.8 * rand());
          hd = rand() * TAU;
        } else {
          var R = Math.hypot(view.w, view.h) / 2 + f.S * 1.4;
          var a = rand() * TAU;
          x = view.w / 2 + Math.cos(a) * R;
          y = view.h / 2 + Math.sin(a) * R;
          hd = Math.atan2(view.h * (0.2 + 0.6 * rand()) - y, view.w * (0.2 + 0.6 * rand()) - x);
        }
        c = o.separate ? conflicts(f, hd, x, y, flyers, o.lookahead * 1.6) : 0;
        if (!best || c < best.c) best = { x: x, y: y, hd: hd, c: c };
        if (!c) break;
      }
      f.x = best.x;
      f.y = best.y;
      f.heading = best.hd;
      if (inside) lead = 0.5 + rand() * 2;
      else lead = ((Math.hypot(f.x - view.w / 2, f.y - view.h / 2) - Math.min(view.w, view.h) * 0.2) / f.speed) * (0.6 + 0.5 * rand());
      f.plan = [straight(lead)];
      flyers.push(f);
      if (rand() < o.formation) {
        var w = makeFlyer(id, f.S * 0.96, f.group);
        w.x = f.x; w.y = f.y; w.heading = f.heading; w.speed = f.speed; w.leader = f;
        w.slot = [-1.6, (rand() < 0.5 ? -1 : 1) * 1.25];
        flyers.push(w);
      }
    }

    function spawnBreak() {
      var ids = enabled();
      var id = ids[Math.floor(rand() * ids.length)];
      var S = sizeFor(types[id], 0.5);
      var speed = S * 1.7;
      var best = null;
      [[true, 0.27], [true, 0.73], [false, 0.27], [false, 0.73]].forEach(function (opt) {
        var hd = opt[0] ? 0 : Math.PI;
        var x0 = opt[0] ? -S * 2 : view.w + S * 2;
        var probe = { S: S * 1.6, speed: speed / o.speed, group: -1 };
        var c = o.separate ? conflicts(probe, hd, x0, view.h * opt[1], flyers, (view.w * 0.6) / speed) : 0;
        if (!best || c < best.c || (c === best.c && rand() < 0.5)) best = { fromLeft: opt[0], row: opt[1], c: c };
      });
      var fromLeft = best.fromLeft;
      var heading = (fromLeft ? 0 : Math.PI) + (rand() - 0.5) * 0.16;
      var fx = Math.cos(heading), fy = Math.sin(heading);
      var bx = view.w * (fromLeft ? 0.3 + 0.12 * rand() : 0.7 - 0.12 * rand());
      var by = view.h * best.row;
      var dist = (fromLeft ? bx : view.w - bx) / Math.max(0.5, Math.abs(fx)) + S * 2.2;
      var gap = S * 0.72;
      var angle = 2.3 + rand() * 0.5;
      uid++;
      var group = uid;
      [-1, 1].forEach(function (side) {
        var back = side > 0 ? S * 0.3 : 0;
        var f = makeFlyer(id, S, group);
        f.speed = speed;
        f.heading = heading;
        f.scripted = true;
        f.x = bx - fx * dist - fy * gap * side - fx * back;
        f.y = by - fy * dist + fx * gap * side - fy * back;
        f.plan = [straight(dist / speed), turn(side, angle, Math.min(1.2, Math.max(0.6, o.bank + 0.2))), straight(3 + rand() * 2)];
        flyers.push(f);
      });
    }

    var flowBase = rand() * TAU;

    function clamp(v, lo, hi) {
      return v < lo ? lo : v > hi ? hi : v;
    }

    function flowFrame() {
      var th = flowBase + o.flowDrift * Math.sin(time * 0.075);
      var c = Math.cos(th), s = Math.sin(th);
      return { th: th, c: c, s: s, U: (view.w * Math.abs(c) + view.h * Math.abs(s)) / 2, N: (view.w * Math.abs(s) + view.h * Math.abs(c)) / 2 };
    }

    function laneOf(F, x, y) {
      return -(x - view.w / 2) * F.s + (y - view.h / 2) * F.c;
    }

    function alongOf(F, x, y) {
      return (x - view.w / 2) * F.c + (y - view.h / 2) * F.s;
    }

    function place(F, u, n) {
      return [view.w / 2 + u * F.c - n * F.s, view.h / 2 + u * F.s + n * F.c];
    }

    function pickLane(F, width) {
      var taken = flyers.filter(function (g) { return !g.leader; }).map(function (g) {
        return { n: g.lane !== undefined ? g.lane : laneOf(F, g.x, g.y), w: g.S * (g.hasWing ? 2.6 : 1.4) };
      });
      var best = null;
      for (var k = 0; k < 28; k++) {
        var n = (rand() * 2 - 1) * F.N * 0.82;
        var gap = Infinity;
        taken.forEach(function (t) { gap = Math.min(gap, Math.abs(n - t.n) - t.w - width); });
        if (!best || gap > best.gap) best = { n: n, gap: gap };
      }
      return best;
    }

    function spawnLane(inside) {
      var F = flowFrame();
      var ids = enabled();
      var id = ids[Math.floor(rand() * ids.length)];
      var S = sizeFor(types[id], rand());
      var wing = rand() < o.formation;
      var slot = pickLane(F, S * (wing ? 2.6 : 1.4));
      if (!inside && slot.gap < S * 0.3) return false;
      var f = makeFlyer(id, S);
      f.speed = f.S * (1.15 + 0.4 * rand());
      f.lane = slot.n;
      var u = inside ? (rand() * 2 - 1) * F.U * 0.8 : -(F.U + f.S * 1.5);
      var p = place(F, u, f.lane);
      f.x = p[0];
      f.y = p[1];
      f.heading = F.th;
      f.mf = 0.12 + rand() * 0.18;
      f.mode = 'flow';
      f.dodge = 0;
      flyers.push(f);
      if (wing) {
        f.hasWing = true;
        var w = makeFlyer(id, f.S * 0.96, f.group);
        w.x = f.x; w.y = f.y; w.heading = f.heading; w.speed = f.speed; w.leader = f;
        w.slot = [-1.6, (rand() < 0.5 ? -1 : 1) * 1.25];
        flyers.push(w);
      }
    }

    function spawnBreakLane() {
      var F = flowFrame();
      var ids = enabled();
      var id = ids[Math.floor(rand() * ids.length)];
      var S = sizeFor(types[id], 0.5);
      var slot = pickLane(F, S * 6);
      if (slot.gap < 0) return false;
      var lane = slot.n;
      var breakU = (rand() * 0.3 - 0.25) * F.U;
      var outTime = 1.5 + rand() * 0.4;
      uid++;
      var group = uid;
      [-1, 1].forEach(function (side) {
        var f = makeFlyer(id, S, group);
        f.speed = S * 1.5;
        f.mode = 'hold';
        f.scripted = true;
        f.side = side;
        f.lane = lane + side * S * 0.72;
        f.breakU = breakU;
        f.outTime = outTime;
        f.mf = 0.12 + rand() * 0.18;
        f.dodge = 0;
        var p = place(F, -(F.U + S * 2) - (side > 0 ? S * 0.3 : 0), f.lane);
        f.x = p[0];
        f.y = p[1];
        f.heading = F.th;
        flyers.push(f);
      });
    }

    function steerLane(f, dt, F) {
      var n = laneOf(F, f.x, f.y);
      var desired;
      if (f.mode === 'hold') {
        desired = F.th + clamp((f.lane - n) / (f.S * 3), -0.4, 0.4);
        if (alongOf(F, f.x, f.y) >= f.breakU) {
          f.mode = 'out';
          f.t = 0;
        }
      } else if (f.mode === 'out') {
        desired = F.th + f.side * 1.0;
        f.t += dt;
        if (f.t > f.outTime) {
          f.mode = 'flow';
          f.lane = n;
          f.scripted = false;
        }
      } else {
        if (o.avoid) {
          var dx = pointer.x - f.x, dy = pointer.y - f.y;
          var hx = Math.cos(f.heading), hy = Math.sin(f.heading);
          if (Math.abs(f.dodge) < f.S && Math.hypot(dx, dy) < Math.max(f.S * 3, 110) && dx * hx + dy * hy > 0) {
            f.dodge = -Math.sign(hx * dy - hy * dx || 1) * f.S * 3;
          }
        }
        f.dodge *= Math.exp(-dt / 2.5);
        desired = F.th + o.meander * Math.sin(time * f.mf + f.ph) + clamp((f.lane + f.dodge - n) / (f.S * 3), -0.45, 0.45);
      }
      var cap = f.mode === 'out' ? Math.max(o.bank, 1.15) : o.bank;
      var bank = clamp(wrap(desired - f.heading) * 2.2, -cap, cap);
      var limit = 1.7 * dt;
      f.roll += clamp((bank - f.roll) * Math.min(1, dt * 6), -limit, limit);
      f.heading += o.turnRate * Math.tan(f.roll) * dt;
      f.pitch = 0.05 * Math.sin(time * 0.6 + f.ph);
      f.x += Math.cos(f.heading) * f.speed * o.speed * dt;
      f.y += Math.sin(f.heading) * f.speed * o.speed * dt;
    }

    function emit(x, y, life, w, color, spread) {
      var i = trailHead * 8;
      trailData[i] = x;
      trailData[i + 1] = y;
      trailData[i + 2] = (rand() - 0.5) * spread;
      trailData[i + 3] = (rand() - 0.5) * spread;
      trailData[i + 4] = time;
      trailData[i + 5] = life;
      trailData[i + 6] = w;
      trailData[i + 7] = color;
      trailHead = (trailHead + 1) % TRAIL_MAX;
    }

    function step(dt) {
      var lanes = o.pattern === 'lanes';
      var F = lanes ? flowFrame() : null;
      cooldown -= dt;
      var free = flyers.filter(function (f) { return !f.leader && !f.scripted; }).length;
      if (free < o.count && cooldown <= 0) {
        if (lanes) spawnLane(false);
        else spawn(false);
        cooldown = 1.2 + rand() * 2.5;
      }
      if (o.breaks && time >= nextBreak) {
        if (lanes && spawnBreakLane() === false) nextBreak = time + 2;
        else {
          if (!lanes) spawnBreak();
          nextBreak = time + o.breakEvery * (0.85 + 0.3 * rand());
        }
      }
      var cx = view.w / 2, cy = view.h / 2;
      for (var i = flyers.length - 1; i >= 0; i--) {
        var f = flyers[i];
        if (!types[f.id]) { flyers.splice(i, 1); continue; }
        if (f.leader && flyers.indexOf(f.leader) < 0) {
          f.leader = null;
          f.plan = [straight(1 + rand() * 2)];
        }
        if (f.leader) {
          var L = f.leader, c = Math.cos(L.heading), s = Math.sin(L.heading);
          f.x = L.x + (c * f.slot[0] - s * f.slot[1]) * L.S;
          f.y = L.y + (s * f.slot[0] + c * f.slot[1]) * L.S;
          f.heading = L.heading;
          f.roll = L.roll;
          f.pitch = L.pitch;
        } else if (lanes) {
          if (f.mode === undefined) {
            f.mode = 'flow';
            f.lane = laneOf(F, f.x, f.y);
            f.mf = 0.12 + rand() * 0.18;
            f.dodge = 0;
          }
          steerLane(f, dt, F);
        } else {
          if (!f.plan.length) extend(f);
          var seg = f.plan[0];
          if (f.scripted && f.plan.length <= 1) f.scripted = false;
          f.check -= dt;
          if (o.separate && !f.scripted && seg.kind === 's' && f.check <= 0) {
            f.check = 0.3;
            var higher = flyers.filter(function (g) { return g.scripted || g.uid < f.uid; });
            if (conflicts(f, f.heading, f.x, f.y, higher, o.lookahead)) {
              var choice = null;
              [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.57, -1.57, 2.1, -2.1, 2.8, -2.8].some(function (d) {
                if (conflicts(f, f.heading + d, f.x, f.y, higher, o.lookahead)) return false;
                choice = d;
                return true;
              });
              if (choice !== null) {
                f.plan = [turn(Math.sign(choice), Math.abs(choice), Math.max(0.3, Math.min(o.bank, 0.8))), straight(1.5 + rand() * 2)];
                seg = f.plan[0];
              }
            }
          }
          if (o.avoid && !f.scripted && seg.kind === 's') {
            var dx = pointer.x - f.x, dy = pointer.y - f.y;
            var hx = Math.cos(f.heading), hy = Math.sin(f.heading);
            if (Math.hypot(dx, dy) < Math.max(f.S * 3, 110) && dx * hx + dy * hy > 0) {
              f.plan = [turn(-Math.sign(hx * dy - hy * dx) || 1, 1.2 + rand() * 0.6, Math.max(0.3, o.bank)), straight(1.5 + rand() * 2)];
              seg = f.plan[0];
            }
          }
          var bank = 0;
          if (seg.kind === 't') {
            var rate = o.turnRate * Math.tan(seg.bank);
            bank = seg.left > rate * (seg.bank / 1.7) * 0.5 ? seg.dir * seg.bank : 0;
          }
          var limit = 1.7 * dt;
          f.roll += Math.max(-limit, Math.min(limit, (bank - f.roll) * Math.min(1, dt * 6)));
          var omega = o.turnRate * Math.tan(f.roll);
          f.heading += omega * dt;
          if (seg.kind === 't') {
            if (Math.sign(omega) === seg.dir) seg.left -= Math.abs(omega * dt);
            if (seg.left <= 0.01 && Math.abs(f.roll) < 0.03) f.plan.shift();
          } else {
            seg.t -= dt;
            if (seg.t <= 0) f.plan.shift();
          }
          f.pitch = 0.05 * Math.sin(time * 0.6 + f.ph);
          f.x += Math.cos(f.heading) * f.speed * o.speed * dt;
          f.y += Math.sin(f.heading) * f.speed * o.speed * dt;
        }
        var R = Math.hypot(view.w, view.h) / 2 + f.S * 1.6;
        var away = (f.x - cx) * Math.cos(f.heading) + (f.y - cy) * Math.sin(f.heading) > 0;
        var gone = lanes && !f.leader && f.mode === 'flow' && alongOf(F, f.x, f.y) > F.U + f.S * 1.6;
        if (gone || (Math.hypot(f.x - cx, f.y - cy) > R && away)) { flyers.splice(i, 1); continue; }
        f.m = orientation(f.heading, f.roll, f.pitch, o.tilt, f.S);
        var meta = f.type.meta;
        if (o.contrails && dt > 0) {
          f.emit += dt;
          while (f.emit > 1 / 40) {
            f.emit -= 1 / 40;
            meta.tips.forEach(function (tip) {
              var p = apply(f.m, tip);
              emit(f.x + p[0], f.y + p[1], o.contrailLife, o.contrailStrength, 0, 7);
              if (rand() < 0.3) emit(f.x + p[0] + (rand() - 0.5) * f.S * 0.5, f.y + p[1] + (rand() - 0.5) * f.S * 0.5, o.contrailLife * 0.65, o.contrailStrength * 0.65, 0, 4);
            });
          }
        }
        if (o.afterburner && dt > 0) {
          f.burn += dt;
          while (f.burn > 1 / 150) {
            f.burn -= 1 / 150;
            meta.nozzles.forEach(function (n) {
              var back = rand() * 0.22;
              var p = apply(f.m, [n[0] - back, n[1] + (rand() - 0.5) * n[3], n[2] + (rand() - 0.5) * n[3]]);
              emit(f.x + p[0], f.y + p[1], 0.16 + rand() * 0.08, 4, 1, 0);
            });
          }
        }
      }
    }

    function render() {
      resize();
      var th = THEMES[o.theme] || THEMES.light;
      var ink = hex(th.ink);
      var pick = function (c) { return o.color ? hex(c) : ink; };
      var gridW = (view.cols * view.cw) / view.dpr;
      var gridH = (view.rows * view.ch) / view.dpr;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, view.cols, view.rows);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);

      gl.useProgram(jetProg.p);
      gl.uniform2f(jetProg.u.uGrid, gridW, gridH);
      gl.uniform3fv(jetProg.u.uEdge, pick(th.edge));
      gl.uniform3fv(jetProg.u.uCanopy, pick(th.canopy));
      gl.uniform3fv(jetProg.u.uNavR, pick(th.navR));
      gl.uniform3fv(jetProg.u.uNavG, pick(th.navG));
      gl.uniform1f(jetProg.u.uNav, o.nav ? 1 : 0);
      gl.uniform1f(jetProg.u.uEdgeW, o.edges);
      var cellArea = (view.cw / view.dpr) * (view.ch / view.dpr);
      flyers.forEach(function (f) {
        if (!f.m) return;
        var cells = (f.S * f.S) / cellArea;
        var n = Math.max(1200, Math.min(f.type.count, Math.round(cells * 26)));
        gl.uniformMatrix3fv(jetProg.u.uM, false, [f.m[0][0], f.m[1][0], 0, f.m[0][1], f.m[1][1], 0, f.m[0][2], f.m[1][2], 0]);
        gl.uniform2f(jetProg.u.uPos, f.x, f.y);
        gl.uniform1f(jetProg.u.uW, (cells / n) * weightScale);
        gl.uniform3fv(jetProg.u.uBody, pick(th.bodies[f.id] || th.ink));
        gl.bindVertexArray(f.type.vao);
        gl.drawArrays(gl.POINTS, 0, n);
      });

      var colors = [pick(th.trail), pick(th.flame)];
      var count = 0;
      for (var i = 0; i < TRAIL_MAX; i++) {
        var b = i * 8;
        var life = trailData[b + 5];
        if (!life) continue;
        var age = time - trailData[b + 4];
        if (age > life || age < 0) { trailData[b + 5] = 0; continue; }
        var isFlame = trailData[b + 7] > 0.5;
        if (isFlame ? !o.afterburner : !o.contrails) continue;
        var k = 1 - age / life;
        var c = colors[isFlame ? 1 : 0];
        var d = count * 6;
        trailDraw[d] = trailData[b] + trailData[b + 2] * age;
        trailDraw[d + 1] = trailData[b + 1] + trailData[b + 3] * age;
        trailDraw[d + 2] = trailData[b + 6] * k * k;
        trailDraw[d + 3] = c[0];
        trailDraw[d + 4] = c[1];
        trailDraw[d + 5] = c[2];
        count++;
      }
      if (count) {
        gl.useProgram(trailProg.p);
        gl.uniform2f(trailProg.u.uGrid, gridW, gridH);
        gl.uniform1f(trailProg.u.uScale, weightScale);
        gl.bindVertexArray(trailVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, trailDraw, 0, count * 6);
        gl.drawArrays(gl.POINTS, 0, count);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, view.width, view.height);
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(asciiProg.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, density);
      gl.uniform1i(asciiProg.u.uDensity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.uniform1i(asciiProg.u.uAtlas, 1);
      gl.uniform2i(asciiProg.u.uCell, view.cw, view.ch);
      gl.uniform1i(asciiProg.u.uRows, view.rows);
      gl.uniform1i(asciiProg.u.uHeight, view.height);
      gl.uniform1i(asciiProg.u.uLevels, rampText().length);
      gl.uniform1f(asciiProg.u.uGain, o.gain / weightScale);
      gl.uniform1f(asciiProg.u.uGamma, o.gamma);
      gl.uniform1f(asciiProg.u.uJitter, o.jitter);
      gl.uniform1f(asciiProg.u.uGrid, o.dots);
      gl.uniform1f(asciiProg.u.uTime, time);
      gl.uniform3fv(asciiProg.u.uInk, ink);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!paused) {
        time += dt;
        step(dt);
      }
      render();
      if (!dead) raf = requestAnimationFrame(frame);
    }

    function onPointer(e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }

    function onLeave() {
      pointer.x = pointer.y = -1e4;
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!dead) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    var ready = Promise.all([
      document.fonts && document.fonts.load ? document.fonts.load(o.weight + ' 12px ' + o.font).catch(function () {}) : null,
      load(),
    ]).then(function () {
      resize();
      for (var i = 0; i < o.count; i++) (o.pattern === 'lanes' ? spawnLane : spawn)(true);
      for (var j = 0; j < 75; j++) {
        time += 1 / 30;
        step(1 / 30);
      }
      addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVisibility);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) paused = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    });

    return {
      ready: ready,
      theme: function () { return THEMES[o.theme] || THEMES.light; },
      get: function () {
        var out = {};
        Object.keys(DEFAULTS).forEach(function (k) { if (k !== 'base' && k !== 'font' && k !== 'maxDpr') out[k] = o[k]; });
        return out;
      },
      set: function (partial) {
        Object.keys(partial).forEach(function (k) { o[k] = partial[k]; });
        if ('glyph' in partial || 'weight' in partial) {
          if (document.fonts && document.fonts.load) document.fonts.load(o.weight + ' 12px ' + o.font).then(function () { atlasKey = ''; });
        }
        if ('jets' in partial || 'size' in partial || 'pattern' in partial) {
          flyers.length = 0;
          for (var i = 0; i < o.count; i++) (o.pattern === 'lanes' ? spawnLane : spawn)(true);
        }
      },
      pause: function (v) { paused = v; },
      advance: function (seconds) {
        for (var i = 0; i < Math.round(seconds * 60); i++) {
          time += 1 / 60;
          step(1 / 60);
        }
      },
      sample: function () {
        return flyers.map(function (f) { return { x: f.x, y: f.y, uid: f.uid, group: f.group, wing: !!f.leader }; });
      },
      breakNow: function () { (o.pattern === 'lanes' ? spawnBreakLane : spawnBreak)(); },
      destroy: function () {
        dead = true;
        cancelAnimationFrame(raf);
        removeEventListener('pointermove', onPointer);
        document.removeEventListener('pointerleave', onLeave);
        document.removeEventListener('visibilitychange', onVisibility);
      },
    };
  }

  window.JetAscii = { start: start, defaults: DEFAULTS, ramps: RAMPS, themes: THEMES };
})();
