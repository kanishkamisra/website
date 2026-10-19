"use strict";

/* =====================================================================
   Perceptron Playground
   A single perceptron, z = w . phi(x) + b, yhat = f(z), trained one
   example at a time with the perceptron rule (sign/step) or the delta
   rule (sigmoid/tanh/linear). No regularization.
   ===================================================================== */

// ---------- Definitions ----------

const POS_RGB = [8, 119, 189];    // --color-pos
const NEG_RGB = [245, 147, 34];   // --color-neg

const FEATURES = [
  { id: "x1", html: "x<sub>1</sub>", text: "x₁", f: (a, b) => a },
  { id: "x2", html: "x<sub>2</sub>", text: "x₂", f: (a, b) => b },
];

const WEIGHT_SUB = { x1: "₁", x2: "₂" };

// pos/neg: the target value y for each class under this activation.
// rule "perceptron": w += eta (y - yhat) x
// rule "delta":      w += eta (y - yhat) f'(z) x
const ACTIVATIONS = {
  sign: {
    name: "sign", pos: 1, neg: -1, rule: "perceptron",
    f: z => (z >= 0 ? 1 : -1),
    note: "Outputs +1 if z ≥ 0, otherwise −1. Classes are labeled +1 and −1. This is the classic perceptron.",
  },
  step: {
    name: "step", pos: 1, neg: 0, rule: "perceptron",
    f: z => (z >= 0 ? 1 : 0),
    note: "Outputs 1 if z ≥ 0, otherwise 0. Classes are labeled 1 and 0. Same perceptron rule, but (y − ŷ) is ±1 instead of ±2.",
  },
  sigmoid: {
    name: "sigmoid", pos: 1, neg: 0, rule: "delta",
    f: z => 1 / (1 + Math.exp(-z)),
    df: (z, y) => y * (1 - y),
    note: "A smooth version of step: outputs a value between 0 and 1. Predicts class 1 when output ≥ 0.5 (i.e. z ≥ 0). Trained by gradient descent on squared error.",
  },
  tanh: {
    name: "tanh", pos: 1, neg: -1, rule: "delta",
    f: z => Math.tanh(z),
    df: (z, y) => 1 - y * y,
    note: "A smooth version of sign: outputs a value between −1 and 1. Predicts +1 when z ≥ 0. Trained by gradient descent on squared error.",
  },
  linear: {
    name: "identity", pos: 1, neg: -1, rule: "delta",
    f: z => z,
    df: () => 1,
    note: "No non-linearity: ŷ = z. Predicts +1 when z ≥ 0. Trained by gradient descent on squared error (the LMS / Widrow-Hoff rule).",
  },
};

const SPEEDS = [1, 2, 3, 5, 10, 20, 50, 100, 300, 1000]; // updates per second

const VIEWS = {
  bool: { min: -0.5, max: 1.5 },
  "1.5": { min: -1.5, max: 1.5 },
  "3": { min: -3, max: 3 },
  "6": { min: -6, max: 6 },
};

const TRAIL_LEN = 6;

// ---------- State ----------

const S = {
  points: [],               // {x1, x2, pos: bool}
  view: "bool",
  features: { x1: true, x2: true },
  w: { x1: 0.5, x2: -0.3 },
  b: 0.1,
  useBias: true,
  act: "sign",
  lr: 0.1,
  wStep: 0.1,               // increment for the weight/bias controls
  order: "fixed",
  maxEpochs: 100,
  stopWhenDone: true,

  // training run
  initial: null,            // {w, b} captured right before the first update
  epoch: 0,
  step: 0,
  idx: 0,                   // position within the current epoch
  perm: [],
  epochMistakes: 0,
  history: [],              // {step, errors, mse}
  epochMarks: [],           // step counts at which an epoch ended
  trail: [],                // past {w, b}
  last: null,               // details of the most recent update
  running: false,
  status: null,             // {text, kind}

  tool: "pos",
  showTrail: true,
  showVector: true,
  hover: null,
};

// ---------- Helpers ----------

const $ = sel => document.querySelector(sel);

function fmt(v, d = 2) {
  if (!isFinite(v)) return String(v);
  if (Math.abs(v) < 0.5 * Math.pow(10, -d)) v = 0;
  return v.toFixed(d).replace("-", "−");
}

// short number for inputs like 1, 0, 0.35
function fmtShort(v) {
  if (!isFinite(v)) return String(v);
  const r = Math.round(v * 100) / 100;
  return String(r === 0 ? 0 : r).replace("-", "−");
}

function fmtSigned(v) {
  const s = fmtShort(v);
  return v > 0 ? "+" + s : s;
}

function paren(s) {
  return s.startsWith("−") ? "(" + s + ")" : s;
}

function toast(msg, ms = 2200) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  $("#toast-container").appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function activeFeatures() {
  return FEATURES.filter(f => S.features[f.id]);
}

function A() { return ACTIVATIONS[S.act]; }

function target(p) { return p.pos ? A().pos : A().neg; }

function classText(pos) {
  const v = pos ? A().pos : A().neg;
  return v > 0 ? "+" + v : fmtShort(v);
}

function zAt(x1, x2, w = S.w, b = S.b) {
  let z = S.useBias ? b : 0;
  for (const f of FEATURES) if (S.features[f.id]) z += w[f.id] * f.f(x1, x2);
  return z;
}

function countErrors() {
  let errors = 0, se = 0;
  for (const p of S.points) {
    const z = zAt(p.x1, p.x2);
    if ((z >= 0) !== p.pos) errors++;
    const d = target(p) - A().f(z);
    se += d * d;
  }
  return { errors, mse: S.points.length ? se / S.points.length : 0 };
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePerm() {
  const p = S.points.map((_, i) => i);
  S.perm = S.order === "shuffle" ? shuffle(p) : p;
}

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- Training ----------

// Start a fresh run from the current weights (used whenever the model
// itself is changed by hand).
function newRun() {
  S.initial = null;
  S.epoch = 0;
  S.step = 0;
  S.idx = 0;
  S.epochMistakes = 0;
  S.history = [];
  S.epochMarks = [];
  S.trail = [];
  S.last = null;
  setStatus(null);
  makePerm();
}

function resetToInitial() {
  if (S.initial) {
    S.w = { ...S.initial.w };
    S.b = S.initial.b;
  }
  newRun();
  stop();
  syncWeightInputs();
  render();
}

function setStatus(text, kind) {
  S.status = text ? { text, kind } : null;
  const el = $("#status-line");
  if (!text) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = text;
  el.className = "status-line " + (kind || "");
}

// Process one training example. Returns false if training should stop.
function doStep() {
  const n = S.points.length;
  if (n === 0) {
    setStatus("Add some data points first.", "bad");
    return false;
  }
  if (S.step === 0 && S.idx === 0 && !S.initial) {
    S.initial = { w: { ...S.w }, b: S.b };
  }
  if (S.history.length === 0) {
    S.history.push({ step: 0, ...countErrors() });
  }
  if (S.perm.length !== n) makePerm();
  if (S.idx >= n) S.idx = 0;

  const i = S.perm[S.idx];
  const p = S.points[i];
  const act = A();
  const feats = activeFeatures();
  const xs = feats.map(f => f.f(p.x1, p.x2));
  const z = zAt(p.x1, p.x2);
  const yhat = act.f(z);
  const y = target(p);
  const err = y - yhat;
  const slope = act.rule === "delta" ? act.df(z, yhat) : 1;
  const factor = S.lr * err * slope;
  const correct = (z >= 0) === p.pos;

  const oldW = { ...S.w };
  const oldB = S.b;
  feats.forEach((f, k) => { S.w[f.id] += factor * xs[k]; });
  if (S.useBias) S.b += factor;

  const changed = factor !== 0;
  if (changed) {
    S.trail.push({ w: oldW, b: oldB });
    if (S.trail.length > TRAIL_LEN) S.trail.shift();
  }
  if (!correct) S.epochMistakes++;

  S.last = {
    i, p: { ...p }, feats, xs, z, yhat, y, err, slope, factor, correct,
    oldW, oldB, newW: { ...S.w }, newB: S.b, lr: S.lr, act: S.act,
    epochPos: S.idx + 1, n,
  };

  S.step++;
  S.idx++;
  S.history.push({ step: S.step, ...countErrors() });

  if (!isFinite(S.b) || feats.some(f => !isFinite(S.w[f.id]))) {
    setStatus("The weights blew up to infinity. Try a smaller learning rate, then Reset.", "bad");
    return false;
  }

  if (S.idx >= n) {
    // end of epoch
    S.epoch++;
    S.epochMarks.push(S.step);
    const mistakes = S.epochMistakes;
    S.epochMistakes = 0;
    S.idx = 0;
    if (S.order === "shuffle") makePerm();
    const { errors } = countErrors();
    if (S.stopWhenDone && errors === 0) {
      const extra = act.rule === "perceptron" && mistakes === 0
        ? " The last epoch made no mistakes, so the perceptron has converged."
        : "";
      setStatus(`All ${n} points classified correctly after ${S.epoch} epoch${S.epoch === 1 ? "" : "s"} (${S.step} updates).${extra}`, "good");
      return false;
    }
    if (S.epoch >= S.maxEpochs) {
      setStatus(`Gave up after ${S.epoch} epochs with ${errors} point${errors === 1 ? "" : "s"} still misclassified. Can any straight line separate this data?`, "bad");
      return false;
    }
  }
  return true;
}

// ---------- Run loop ----------

let rafId = null;
let lastT = 0;
let acc = 0;

function play() {
  if (S.points.length === 0) { toast("Add some data points first."); return; }
  if (S.status && S.status.kind) setStatus(null);
  S.running = true;
  lastT = performance.now();
  acc = 1; // take the first step right away
  updatePlayButton();
  rafId = requestAnimationFrame(loop);
}

function stop() {
  S.running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  updatePlayButton();
}

function loop(t) {
  if (!S.running) return;
  const dt = Math.min(0.1, (t - lastT) / 1000);
  lastT = t;
  acc += dt * SPEEDS[+$("#speed").value];
  let n = Math.floor(acc);
  acc -= n;
  n = Math.min(n, 5000);
  for (let k = 0; k < n; k++) {
    if (!doStep()) { stop(); break; }
  }
  if (n > 0) render();
  if (S.running) rafId = requestAnimationFrame(loop);
}

function updatePlayButton() {
  const b = $("#play-btn");
  b.innerHTML = S.running ? "&#10074;&#10074; Pause" : "&#9654; Train";
  b.classList.toggle("running", S.running);
}

// ---------- Data ----------

const PRESETS = {
  and: { view: "bool", pts: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]] },
  or: { view: "bool", pts: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]] },
  nand: { view: "bool", pts: [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]] },
  xor: { view: "bool", pts: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]] },
  blobs: { view: "3", gen: () => blobs(1.3, 0.45) },
  overlap: { view: "3", gen: () => blobs(0.6, 0.75) },
  empty: { view: null, pts: [] },
};

function blobs(sep, sd) {
  const pts = [];
  for (let k = 0; k < 20; k++) {
    pts.push([sep + sd * gauss(), sep + sd * gauss(), 1]);
    pts.push([-sep + sd * gauss(), -sep + sd * gauss(), 0]);
  }
  return pts;
}

function loadPreset(name) {
  const pr = PRESETS[name];
  const raw = pr.gen ? pr.gen() : pr.pts;
  S.points = raw.map(([x1, x2, c]) => ({ x1: round2(x1), x2: round2(x2), pos: c === 1 }));
  if (pr.view) {
    S.view = pr.view;
    $("#view-select").value = pr.view;
  }
  document.querySelectorAll("#preset-grid .chip").forEach(b =>
    b.classList.toggle("active", b.dataset.preset === name));
  stop();
  newRun();
  renderTable();
  render();
}

function round2(v) { return Math.round(v * 100) / 100; }

function dataChanged({ rebuildTable = true } = {}) {
  if (S.last) S.last.stale = true;
  makePerm();
  if (S.idx >= S.points.length) S.idx = 0;
  document.querySelectorAll("#preset-grid .chip").forEach(b => b.classList.remove("active"));
  if (rebuildTable) renderTable();
  render();
}

// ---------- Table ----------

function renderTable() {
  const tbody = $("#data-table tbody");
  tbody.innerHTML = "";
  $("#n-points").textContent = `(${S.points.length})`;
  if (S.points.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No points yet. Click the plot or pick a preset.</td></tr>`;
    return;
  }
  S.points.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><input type="number" step="0.1" value="${p.x1}" data-k="x1"></td>
      <td><input type="number" step="0.1" value="${p.x2}" data-k="x2"></td>
      <td><select class="${p.pos ? "cls-pos" : "cls-neg"}">
            <option value="1" ${p.pos ? "selected" : ""}>${classText(true)}</option>
            <option value="0" ${p.pos ? "" : "selected"}>${classText(false)}</option>
          </select></td>
      <td><button class="row-del" title="Delete this point">&times;</button></td>`;
    tr.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("change", () => {
        const v = parseFloat(inp.value);
        if (!isFinite(v)) { inp.value = p[inp.dataset.k]; return; }
        p[inp.dataset.k] = v;
        dataChanged({ rebuildTable: false });
      });
    });
    const sel = tr.querySelector("select");
    sel.addEventListener("change", () => {
      p.pos = sel.value === "1";
      sel.className = p.pos ? "cls-pos" : "cls-neg";
      dataChanged({ rebuildTable: false });
    });
    tr.querySelector(".row-del").addEventListener("click", () => {
      S.points.splice(i, 1);
      dataChanged();
    });
    tbody.appendChild(tr);
  });
}

function updateTableHighlights() {
  const rows = $("#data-table tbody").children;
  if (rows.length !== S.points.length) return;
  const cur = S.last && !S.last.stale ? S.last.i : -1;
  for (let i = 0; i < rows.length; i++) {
    const p = S.points[i];
    rows[i].classList.toggle("current", i === cur);
    rows[i].classList.toggle("wrong", (zAt(p.x1, p.x2) >= 0) !== p.pos);
  }
}

// ---------- Weight controls ----------

// Weight values as shown in the inputs: up to 3 decimals, no float noise.
function wDisp(v) { return Number(v.toFixed(3)); }

function renderWeightControls() {
  const box = $("#weight-list");
  box.innerHTML = "";
  const rows = activeFeatures().map(f => ({ id: f.id, label: "w" + WEIGHT_SUB[f.id], title: `weight on ${f.text}` }));
  rows.push({ id: "b", label: "b", title: "bias" });
  for (const r of rows) {
    const div = document.createElement("div");
    const off = r.id === "b" && !S.useBias;
    div.className = "weight-row" + (off ? " disabled" : "");
    div.title = off ? "bias is turned off (see More settings)" : r.title;
    const val = r.id === "b" ? S.b : S.w[r.id];
    div.innerHTML = `
      <span class="wlabel">${r.label}</span>
      <input type="range" min="-5" max="5" step="${S.wStep}" value="${val}" data-w="${r.id}" aria-label="${r.title}">
      <span class="stepper">
        <button class="step-btn-small" data-d="-1" aria-label="decrease ${r.title}">&minus;</button>
        <input type="number" step="${S.wStep}" value="${wDisp(val)}" data-w="${r.id}" aria-label="${r.title}">
        <button class="step-btn-small" data-d="1" aria-label="increase ${r.title}">+</button>
      </span>`;
    const [range, num] = div.querySelectorAll("input");
    div.querySelectorAll("input, button").forEach(el => { el.disabled = off; });
    const get = () => (r.id === "b" ? S.b : S.w[r.id]);
    const set = v => {
      if (!isFinite(v)) return;
      v = Math.round(v * 1e6) / 1e6;
      if (r.id === "b") S.b = v; else S.w[r.id] = v;
      stop();
      newRun();
      render();
    };
    range.addEventListener("input", () => set(+range.value));
    num.addEventListener("change", () => set(parseFloat(num.value)));
    div.querySelectorAll("button").forEach(btn =>
      btn.addEventListener("click", () => set(get() + (+btn.dataset.d) * S.wStep)));
    box.appendChild(div);
  }
}

function syncWeightInputs() {
  document.querySelectorAll("#weight-list input").forEach(inp => {
    if (inp === document.activeElement && inp.type === "number") return;
    const id = inp.dataset.w;
    const v = id === "b" ? S.b : S.w[id];
    if (inp.type === "range") {
      const lim = Math.max(5, Math.ceil(Math.abs(v)));
      inp.min = -lim; inp.max = lim;
    }
    inp.value = inp.type === "number" ? wDisp(v) : v;
  });
}

// ---------- Plot ----------

const plot = $("#plot");
const pctx = plot.getContext("2d");
const HEAT_N = 120;
const heatCanvas = document.createElement("canvas");
heatCanvas.width = heatCanvas.height = HEAT_N;
const hctx = heatCanvas.getContext("2d");
const heatImg = hctx.createImageData(HEAT_N, HEAT_N);

// Plot geometry: a square data area (equal scale on both axes, so w is
// drawn truly perpendicular to the boundary) with room for axes.
const MARGIN = { l: 58, r: 12, t: 12, b: 42 };
const G = { ox: MARGIN.l, oy: MARGIN.t, side: 300 };

function viewRange() { return VIEWS[S.view]; }

function resizeCanvas(c) {
  const dpr = window.devicePixelRatio || 1;
  const r = c.getBoundingClientRect();
  const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: r.width, h: r.height, ctx };
}

function toPx(x1, x2) {
  const { min, max } = viewRange();
  return [G.ox + (x1 - min) / (max - min) * G.side,
          G.oy + G.side - (x2 - min) / (max - min) * G.side];
}

function toData(px, py) {
  const { min, max } = viewRange();
  return [min + (px - G.ox) / G.side * (max - min),
          min + (G.oy + G.side - py) / G.side * (max - min)];
}

function rgb(c, a = 1) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

// Map the model output at z to [-1, 1] for shading.
function shade(z) {
  const act = A();
  if (act.rule === "perceptron") return z >= 0 ? 1 : -1;
  const y = act.f(z);
  const mid = (act.pos + act.neg) / 2, half = (act.pos - act.neg) / 2;
  return Math.max(-1, Math.min(1, (y - mid) / half));
}

function drawHeatmap() {
  const { min, max } = viewRange();
  const d = heatImg.data;
  const perceptron = A().rule === "perceptron";
  const strength = perceptron ? 0.2 : 0.45;
  for (let j = 0; j < HEAT_N; j++) {
    const x2 = max - (j + 0.5) / HEAT_N * (max - min);
    for (let i = 0; i < HEAT_N; i++) {
      const x1 = min + (i + 0.5) / HEAT_N * (max - min);
      const v = shade(zAt(x1, x2));
      const c = v >= 0 ? POS_RGB : NEG_RGB;
      const a = Math.abs(v) * strength;
      const k = (j * HEAT_N + i) * 4;
      d[k] = 255 + (c[0] - 255) * a;
      d[k + 1] = 255 + (c[1] - 255) * a;
      d[k + 2] = 255 + (c[2] - 255) * a;
      d[k + 3] = 255;
    }
  }
  hctx.putImageData(heatImg, 0, 0);
  pctx.imageSmoothingEnabled = !perceptron;
  pctx.drawImage(heatCanvas, G.ox, G.oy, G.side, G.side);
  pctx.imageSmoothingEnabled = true;
}

// The boundary w1 x1 + w2 x2 + b = 0, clipped to the view. Null if it
// misses the view or the weights are all zero.
function boundaryInView(w = S.w, b = S.b) {
  const w1 = w.x1, w2 = w.x2, bb = S.useBias ? b : 0;
  if (Math.abs(w1) < 1e-12 && Math.abs(w2) < 1e-12) return null;
  const { min, max } = viewRange();
  const eps = 1e-9;
  const pts = [];
  const add = (x, y) => {
    if (x >= min - eps && x <= max + eps && y >= min - eps && y <= max + eps &&
        !pts.some(p => Math.abs(p[0] - x) < 1e-7 && Math.abs(p[1] - y) < 1e-7)) pts.push([x, y]);
  };
  if (Math.abs(w2) > 1e-12) {
    add(min, -(w1 * min + bb) / w2);
    add(max, -(w1 * max + bb) / w2);
  }
  if (Math.abs(w1) > 1e-12) {
    add(-(w2 * min + bb) / w1, min);
    add(-(w2 * max + bb) / w1, max);
  }
  return pts.length >= 2 ? [pts[0], pts[1]] : null;
}

function strokeBoundary(seg) {
  if (!seg) return;
  const [ax, ay] = toPx(...seg[0]);
  const [bx, by] = toPx(...seg[1]);
  pctx.beginPath(); pctx.moveTo(ax, ay); pctx.lineTo(bx, by); pctx.stroke();
}

function niceStep(range) {
  const raw = range / 6;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}

function ticks() {
  const { min, max } = viewRange();
  const st = S.view === "bool" ? 0.5 : niceStep(max - min);
  const out = [];
  for (let v = Math.ceil(min / st - 1e-9) * st; v <= max + 1e-9; v += st) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

function drawGrid() {
  pctx.lineWidth = 1;
  for (const v of ticks()) {
    const [px] = toPx(v, 0);
    const [, py] = toPx(0, v);
    pctx.strokeStyle = v === 0 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.07)";
    pctx.beginPath(); pctx.moveTo(px, G.oy); pctx.lineTo(px, G.oy + G.side); pctx.stroke();
    pctx.beginPath(); pctx.moveTo(G.ox, py); pctx.lineTo(G.ox + G.side, py); pctx.stroke();
  }
}

function drawAxes() {
  const x0 = G.ox, y0 = G.oy + G.side;
  pctx.strokeStyle = "#878a8c";
  pctx.lineWidth = 1;
  pctx.strokeRect(G.ox + 0.5, G.oy + 0.5, G.side - 1, G.side - 1);
  pctx.fillStyle = "#555";
  pctx.font = "12px Helvetica Neue, Arial, sans-serif";
  pctx.strokeStyle = "#555";
  for (const v of ticks()) {
    const [px] = toPx(v, 0);
    const [, py] = toPx(0, v);
    const lab = fmtShort(v);
    pctx.beginPath(); pctx.moveTo(px, y0); pctx.lineTo(px, y0 + 5); pctx.stroke();
    pctx.textAlign = "center";
    pctx.fillText(lab, px, y0 + 18);
    pctx.beginPath(); pctx.moveTo(x0 - 5, py); pctx.lineTo(x0, py); pctx.stroke();
    pctx.textAlign = "right";
    pctx.fillText(lab, x0 - 8, py + 4);
  }
  pctx.fillStyle = "#1a1a1b";
  pctx.font = "italic 15px Georgia, serif";
  pctx.textAlign = "center";
  pctx.fillText("x₁", G.ox + G.side / 2, y0 + 37);
  pctx.save();
  pctx.translate(11, G.oy + G.side / 2);
  pctx.fillText("x₂", 0, 4);
  pctx.restore();
}

function labelBox(text, x, y, color) {
  pctx.font = "bold 13px Helvetica Neue, Arial, sans-serif";
  const tw = pctx.measureText(text).width;
  pctx.fillStyle = "rgba(255,255,255,0.85)";
  pctx.beginPath();
  pctx.roundRect(x - tw / 2 - 7, y - 11, tw + 14, 22, 4);
  pctx.fill();
  pctx.fillStyle = color;
  pctx.textAlign = "center";
  pctx.fillText(text, x, y + 4.5);
}

// Label each shaded region with what the model predicts there, placed as
// far from the boundary as possible without covering data points.
function drawRegionLabels() {
  const { min, max } = viewRange();
  const n = Math.hypot(S.w.x1, S.w.x2) || 1;
  const cands = [];
  for (const fx of [0.13, 0.5, 0.87])
    for (const fy of [0.08, 0.3, 0.5, 0.7, 0.92]) {
      const x1 = min + fx * (max - min), x2 = min + fy * (max - min);
      const [px, py] = toPx(x1, x2);
      const crowded = S.points.some(p => {
        const [qx, qy] = toPx(p.x1, p.x2);
        return Math.abs(qx - px) < 52 && Math.abs(qy - py) < 22;
      });
      cands.push({ px, py, z: zAt(x1, x2), crowded });
    }
  for (const pos of [true, false]) {
    const side = cands.filter(c => (c.z >= 0) === pos);
    if (!side.length) continue;
    const pool = side.some(c => !c.crowded) ? side.filter(c => !c.crowded) : side;
    const best = pool.reduce((a, c) => (Math.abs(c.z) > Math.abs(a.z) ? c : a));
    labelBox(`predicts ${classText(pos)}`, best.px, best.py, rgb(pos ? POS_RGB : NEG_RGB));
  }
}

function drawWeightVector() {
  const w1 = S.w.x1, w2 = S.w.x2;
  const n2 = w1 * w1 + w2 * w2;
  if (n2 < 1e-12) return;
  const seg = boundaryInView();
  if (!seg) return;
  // start the arrow at the middle of the visible boundary
  const p0 = [(seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2];
  const { min, max } = viewRange();
  const n = Math.sqrt(n2);
  const L = 0.14 * (max - min);
  const p1 = [p0[0] + w1 / n * L, p0[1] + w2 / n * L];
  const [ax, ay] = toPx(...p0);
  const [bx, by] = toPx(...p1);
  pctx.strokeStyle = "#1a1a1b";
  pctx.fillStyle = "#1a1a1b";
  pctx.lineWidth = 2;
  pctx.beginPath(); pctx.moveTo(ax, ay); pctx.lineTo(bx, by); pctx.stroke();
  const ang = Math.atan2(by - ay, bx - ax);
  pctx.beginPath();
  pctx.moveTo(bx, by);
  pctx.lineTo(bx - 10 * Math.cos(ang - 0.4), by - 10 * Math.sin(ang - 0.4));
  pctx.lineTo(bx - 10 * Math.cos(ang + 0.4), by - 10 * Math.sin(ang + 0.4));
  pctx.closePath(); pctx.fill();
  pctx.font = "bold italic 15px Georgia, serif";
  pctx.textAlign = "center";
  pctx.fillText("w", bx + 13 * Math.cos(ang), by + 13 * Math.sin(ang) + 5);
}

function drawPoints() {
  const cur = S.last && !S.last.stale ? S.last.i : -1;
  S.points.forEach((p, i) => {
    const [x, y] = toPx(p.x1, p.x2);
    const wrong = (zAt(p.x1, p.x2) >= 0) !== p.pos;
    if (i === cur) {
      pctx.strokeStyle = S.last.correct ? "#2e8b57" : "#c0392b";
      pctx.lineWidth = 3;
      pctx.beginPath(); pctx.arc(x, y, 16, 0, 2 * Math.PI); pctx.stroke();
    }
    pctx.fillStyle = rgb(p.pos ? POS_RGB : NEG_RGB);
    pctx.strokeStyle = "white";
    pctx.lineWidth = 2;
    pctx.beginPath(); pctx.arc(x, y, 8, 0, 2 * Math.PI); pctx.fill(); pctx.stroke();
    if (wrong) {
      pctx.strokeStyle = "#1a1a1b";
      pctx.lineWidth = 2;
      pctx.beginPath(); pctx.arc(x, y, 11.5, 0, 2 * Math.PI); pctx.stroke();
    }
    if (S.points.length <= 12) {
      pctx.font = "bold 11px Helvetica Neue, Arial, sans-serif";
      pctx.textAlign = "left";
      pctx.lineWidth = 3;
      pctx.strokeStyle = "rgba(255,255,255,0.9)";
      pctx.strokeText(String(i + 1), x + 11, y - 9);
      pctx.fillStyle = "#333";
      pctx.fillText(String(i + 1), x + 11, y - 9);
    }
  });
}

function renderPlot() {
  // keep the data area square: height follows width
  const wrapW = plot.parentElement.clientWidth;
  G.side = Math.max(160, wrapW - MARGIN.l - MARGIN.r);
  plot.style.height = `${G.side + MARGIN.t + MARGIN.b}px`;
  const { w, h } = resizeCanvas(plot);
  pctx.clearRect(0, 0, w, h);

  pctx.save();
  pctx.beginPath(); pctx.rect(G.ox, G.oy, G.side, G.side); pctx.clip();
  drawHeatmap();
  drawGrid();
  if (S.showTrail && S.trail.length) {
    pctx.lineWidth = 1.5;
    pctx.setLineDash([5, 4]);
    S.trail.forEach((t, k) => {
      pctx.strokeStyle = `rgba(60,60,60,${0.12 + 0.35 * (k + 1) / S.trail.length})`;
      strokeBoundary(boundaryInView(t.w, t.b));
    });
    pctx.setLineDash([]);
  }
  pctx.strokeStyle = "#1a1a1b";
  pctx.lineWidth = 3;
  strokeBoundary(boundaryInView());
  drawRegionLabels();
  if (S.showVector) drawWeightVector();
  drawPoints();
  pctx.restore();

  drawAxes();
  drawHoverTip();
  renderBoundaryEq();
}

function renderBoundaryEq() {
  const el = $("#boundary-eq");
  const w1 = S.w.x1, w2 = S.w.x2, b = S.useBias ? S.b : 0;
  const term = (v, s, first) => {
    const a = fmt(Math.abs(v));
    if (first) return `${v < 0 ? "−" : ""}${a}${s}`;
    return ` ${v < 0 ? "−" : "+"} ${a}${s}`;
  };
  let eq = term(w1, "&thinsp;<i>x</i><sub>1</sub>", true) + term(w2, "&thinsp;<i>x</i><sub>2</sub>");
  if (S.useBias) eq += term(b, "");
  let note = "";
  if (Math.abs(w1) < 1e-12 && Math.abs(w2) < 1e-12) note = " (all weights are 0, so there is no line: everything is on one side)";
  else if (!boundaryInView()) note = " (outside the visible range)";
  el.innerHTML = `<b>Decision boundary</b> (where z = 0): ${eq} = 0${note}`;
}

// ---------- Plot interaction ----------

let drag = null;

function eventPx(e) {
  const r = plot.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

function inArea(px, py) {
  return px >= G.ox && px <= G.ox + G.side && py >= G.oy && py <= G.oy + G.side;
}

function hitTest(px, py) {
  let best = -1, bestD = 12 * 12;
  S.points.forEach((p, i) => {
    const [x, y] = toPx(p.x1, p.x2);
    const d = (x - px) ** 2 + (y - py) ** 2;
    if (d <= bestD) { bestD = d; best = i; }
  });
  return best;
}

plot.addEventListener("contextmenu", e => e.preventDefault());

plot.addEventListener("pointerdown", e => {
  const [px, py] = eventPx(e);
  const hit = hitTest(px, py);
  if (e.button === 2 || S.tool === "erase") {
    if (hit >= 0) { S.points.splice(hit, 1); dataChanged(); }
    return;
  }
  if (hit >= 0) {
    drag = { i: hit, moved: false, sx: px, sy: py };
    plot.setPointerCapture(e.pointerId);
    return;
  }
  if (!inArea(px, py)) return;
  const [x1, x2] = toData(px, py);
  const pos = (S.tool === "pos") !== e.shiftKey;
  S.points.push({ x1: round2(x1), x2: round2(x2), pos });
  dataChanged();
});

plot.addEventListener("pointermove", e => {
  const [px, py] = eventPx(e);
  if (drag) {
    if (!drag.moved && Math.hypot(px - drag.sx, py - drag.sy) < 4) return;
    drag.moved = true;
    const { min, max } = viewRange();
    const [x1, x2] = toData(px, py);
    const p = S.points[drag.i];
    p.x1 = round2(Math.max(min, Math.min(max, x1)));
    p.x2 = round2(Math.max(min, Math.min(max, x2)));
    dataChanged({ rebuildTable: false });
  }
  S.hover = inArea(px, py) ? { px, py, x: toData(px, py) } : null;
  if (!drag) renderPlot();
});

plot.addEventListener("pointerup", () => {
  if (!drag) return;
  if (!drag.moved) S.points[drag.i].pos = !S.points[drag.i].pos;
  drag = null;
  dataChanged();
});

plot.addEventListener("pointerleave", () => {
  S.hover = null;
  renderPlot();
});

// Small readout next to the cursor: z and the model's output there.
function drawHoverTip() {
  if (!S.hover || drag) return;
  const { px, py } = S.hover;
  const [x1, x2] = S.hover.x;
  const z = zAt(x1, x2);
  const y = A().f(z);
  const lines = [
    `(${fmt(x1)}, ${fmt(x2)})`,
    `z = ${fmt(z)}   ŷ = ${A().rule === "perceptron" ? fmtShort(y) : fmt(y, 3)}`,
  ];
  pctx.font = "12px Helvetica Neue, Arial, sans-serif";
  const tw = Math.max(...lines.map(l => pctx.measureText(l).width));
  const bw = tw + 16, bh = 40;
  let bx = px + 14, by = py + 14;
  if (bx + bw > G.ox + G.side) bx = px - 14 - bw;
  if (by + bh > G.oy + G.side) by = py - 14 - bh;
  pctx.fillStyle = "rgba(26,26,27,0.88)";
  pctx.beginPath(); pctx.roundRect(bx, by, bw, bh, 5); pctx.fill();
  pctx.fillStyle = "white";
  pctx.textAlign = "left";
  pctx.fillText(lines[0], bx + 8, by + 16);
  pctx.fillText(lines[1], bx + 8, by + 32);
}

// ---------- Diagram ----------

function actPath(x, y, s) {
  // tiny plot of the activation in a box of size s centered at (x, y)
  const act = A();
  const lo = act.neg; // output range is [neg, 1]
  const pts = [];
  for (let k = 0; k <= 40; k++) {
    const z = -3 + 6 * k / 40;
    const v = act.name === "identity" ? z / 3 : act.f(z);
    const yy = (v - lo) / (1 - lo); // 0..1
    pts.push([x - s / 2 + 4 + (s - 8) * k / 40, y + s / 2 - 5 - (s - 10) * yy]);
  }
  return "M" + pts.map(p => p.map(v => v.toFixed(1)).join(",")).join("L");
}

function renderDiagram() {
  const svg = $("#diagram");
  const feats = activeFeatures();
  const inputs = feats.map(f => ({ id: f.id, html: f.text, w: S.w[f.id], wl: "w" + WEIGHT_SUB[f.id] }));
  if (S.useBias) inputs.push({ id: "b", html: "1", w: S.b, wl: "b", bias: true });
  const W = 340, rowH = 50;
  const H = Math.max(170, inputs.length * rowH + 30);
  const cy = H / 2;
  const sumX = 205, actX = 268, outX = 318;
  const L = S.last && !S.last.stale ? S.last : null;

  let s = "";
  // edges
  inputs.forEach((inp, k) => {
    const y = 15 + rowH / 2 + k * rowH + (H - 30 - inputs.length * rowH) / 2;
    inp.y = y;
    const col = inp.w >= 0 ? "#0877bd" : "#f59322";
    const sw = Math.max(1, Math.min(10, 1 + Math.abs(inp.w) * 2.5));
    s += `<line x1="72" y1="${y}" x2="${sumX - 22}" y2="${cy}" stroke="${col}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" opacity="${Math.abs(inp.w) < 1e-9 ? 0.25 : 0.85}"/>`;
  });
  // weight labels
  inputs.forEach(inp => {
    const t = 0.38;
    const lx = 72 + t * (sumX - 22 - 72), ly = inp.y + t * (cy - inp.y);
    s += `<rect x="${lx - 27}" y="${ly - 9}" width="54" height="17" rx="3" fill="white" stroke="#d3d6da"/>`;
    s += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="11" font-family="Menlo, monospace">${fmt(inp.w)}</text>`;
  });
  // input nodes
  inputs.forEach(inp => {
    s += `<rect x="12" y="${inp.y - 17}" width="60" height="34" rx="6" fill="${inp.bias ? "#eceef0" : "white"}" stroke="#878a8c"/>`;
    let val = "";
    if (L) {
      if (inp.bias) val = "";
      else {
        const k = L.feats.findIndex(f => f.id === inp.id);
        if (k >= 0) val = "= " + fmtShort(L.xs[k]);
      }
    }
    s += `<text x="42" y="${inp.y + (val ? -1 : 5)}" text-anchor="middle" font-size="14" font-family="Helvetica Neue, Arial, sans-serif">${inp.html}</text>`;
    if (val) s += `<text x="42" y="${inp.y + 12}" text-anchor="middle" font-size="10" fill="#555" font-family="Menlo, monospace">${val}</text>`;
    s += `<text x="${inp.bias ? 80 : 80}" y="${inp.y - 8}" font-size="10" fill="#888" font-family="Helvetica Neue, Arial, sans-serif">${inp.wl}</text>`;
  });
  // sum node
  s += `<circle cx="${sumX}" cy="${cy}" r="22" fill="white" stroke="#1a1a1b" stroke-width="1.5"/>`;
  s += `<text x="${sumX}" y="${cy + 7}" text-anchor="middle" font-size="20" font-family="Georgia, serif">Σ</text>`;
  s += `<text x="${sumX}" y="${cy + 40}" text-anchor="middle" font-size="11" font-family="Menlo, monospace" fill="#555">${L ? "z = " + fmt(L.z) : "z"}</text>`;
  // activation node
  s += `<line x1="${sumX + 22}" y1="${cy}" x2="${actX - 22}" y2="${cy}" stroke="#1a1a1b" stroke-width="1.5"/>`;
  s += `<rect x="${actX - 22}" y="${cy - 22}" width="44" height="44" rx="6" fill="white" stroke="#1a1a1b" stroke-width="1.5"/>`;
  s += `<path d="${actPath(actX, cy, 44)}" fill="none" stroke="#3a7ca5" stroke-width="2"/>`;
  s += `<text x="${actX}" y="${cy - 30}" text-anchor="middle" font-size="11" fill="#555">${A().name}</text>`;
  // output
  s += `<line x1="${actX + 22}" y1="${cy}" x2="${outX - 8}" y2="${cy}" stroke="#1a1a1b" stroke-width="1.5" marker-end="url(#arr)"/>`;
  s += `<text x="${outX}" y="${cy + 5}" font-size="15" font-style="italic" font-family="Georgia, serif">ŷ</text>`;
  if (L) {
    const yv = A().rule === "perceptron" ? fmtSigned(L.yhat) : fmt(L.yhat);
    s += `<text x="${outX - 18}" y="${cy + 26}" font-size="11" font-family="Menlo, monospace" fill="#555">= ${yv}</text>`;
    s += `<text x="${outX - 18}" y="${cy + 42}" font-size="11" font-family="Menlo, monospace" fill="${L.correct ? "#2e8b57" : "#c0392b"}">y = ${fmtShort(L.y)}</text>`;
  }
  const defs = `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1a1a1b"/></marker></defs>`;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = defs + s;
}

// ---------- Update explanation ----------

// Small coefficients (delta rule) need more than 2 decimals to be readable.
function fmtCoef(v) {
  if (v === 0) return "0";
  const a = Math.abs(v);
  const str = a >= 0.01 ? fmtShort(v) : v.toPrecision(2);
  return str.replace("-", "−");
}

function renderUpdateBox() {
  const box = $("#update-box");
  const L = S.last;
  if (!L) {
    box.innerHTML = `<span class="placeholder">Press <b>Step</b> to process one training example and see the arithmetic here.</span>`;
    return;
  }
  const act = ACTIVATIONS[L.act];
  const terms = L.feats.map((f, k) => `${paren(fmt(L.oldW[f.id]))}·${paren(fmtShort(L.xs[k]))}`);
  if (S.useBias) terms.push(paren(fmt(L.oldB)));
  const yhatS = act.rule === "perceptron" ? fmtSigned(L.yhat) : fmt(L.yhat, 3);
  const verdict = L.correct
    ? `<span class="ok">✓ correct</span>`
    : `<span class="bad">✗ wrong</span>`;

  let html = `<div class="ub-head">Example #${L.i + 1}: x = (${fmtShort(L.p.x1)}, ${fmtShort(L.p.x2)}), target y = ${fmtSigned(L.y)}`
    + `<span class="muted"> · ${L.epochPos} of ${L.n} this epoch${L.stale ? " · data changed since" : ""}</span></div>`;
  html += `<div class="ub-grid">`;
  html += `<span class="ub-label">1. Sum</span><span class="ub-line">z = ${terms.join(" + ")} = <b>${fmt(L.z)}</b></span>`;
  html += `<span class="ub-label">2. Predict</span><span class="ub-line">ŷ = ${act.name}(${fmt(L.z)}) = <b>${yhatS}</b> &nbsp;${verdict}</span>`;

  const errS = act.rule === "perceptron" ? fmtShort(L.err) : fmt(L.err, 3);
  if (act.rule === "perceptron" && L.err === 0) {
    html += `<span class="ub-label">3. Update</span><span class="ub-line">y − ŷ = 0, so the weights <b>don't change</b></span></div>`;
    box.innerHTML = html;
    return;
  }
  const coefExpr = act.rule === "perceptron"
    ? `η(y − ŷ) = ${fmtShort(L.lr)}·${paren(errS)}`
    : `η(y − ŷ)f′(z) = ${fmtShort(L.lr)}·${paren(errS)}·${fmt(L.slope, 3)}`;
  const c = fmtCoef(L.factor);
  html += `<span class="ub-label">3. Update</span><span class="ub-line">step = ${coefExpr} = <b>${c}</b></span>`;
  L.feats.forEach((f, k) => {
    html += `<span></span><span class="ub-line">w${WEIGHT_SUB[f.id]} ← ${fmt(L.oldW[f.id])} + ${paren(c)}·${paren(fmtShort(L.xs[k]))} = <span class="changed">${fmt(L.newW[f.id])}</span></span>`;
  });
  if (S.useBias) {
    html += `<span></span><span class="ub-line">b ← ${fmt(L.oldB)} + ${paren(c)} = <span class="changed">${fmt(L.newB)}</span></span>`;
  }
  html += `</div>`;
  box.innerHTML = html;
}

// ---------- Chart ----------

const chart = $("#chart");

function renderChart() {
  const { w, h, ctx } = resizeCanvas(chart);
  ctx.clearRect(0, 0, w, h);
  const padL = 30, padR = 10, padT = 10, padB = 20;
  const pw = w - padL - padR, ph = h - padT - padB;
  const n = Math.max(1, S.points.length);
  const hist = S.history.length ? S.history : [{ step: 0, ...countErrors() }];
  const maxStep = Math.max(10, hist[hist.length - 1].step);
  const X = s => padL + s / maxStep * pw;
  const Y = v => padT + ph - v / n * ph;

  ctx.font = "10px Helvetica Neue, Arial, sans-serif";
  ctx.fillStyle = "#888";
  ctx.strokeStyle = "#e3e5e8";
  ctx.lineWidth = 1;
  // y grid
  const yt = n <= 5 ? 1 : Math.ceil(n / 4);
  for (let v = 0; v <= n; v += yt) {
    ctx.beginPath(); ctx.moveTo(padL, Y(v)); ctx.lineTo(w - padR, Y(v)); ctx.stroke();
    ctx.textAlign = "right"; ctx.fillText(String(v), padL - 5, Y(v) + 3);
  }
  // epoch marks
  if (S.epochMarks.length && S.epochMarks.length <= 60) {
    ctx.strokeStyle = "rgba(58,124,165,0.18)";
    for (const m of S.epochMarks) {
      ctx.beginPath(); ctx.moveTo(X(m), padT); ctx.lineTo(X(m), padT + ph); ctx.stroke();
    }
  }
  ctx.textAlign = "center";
  ctx.fillText("0", X(0), h - 6);
  ctx.fillText(String(maxStep), X(maxStep) - 8, h - 6);
  ctx.fillText("updates", padL + pw / 2, h - 6);

  // squared error (continuous activations only), scaled to its own max
  const showMse = A().rule === "delta";
  if (showMse) {
    let mmax = 0;
    for (const p of hist) if (isFinite(p.mse)) mmax = Math.max(mmax, p.mse);
    if (mmax > 0) {
      ctx.strokeStyle = "#3a7ca5";
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      hist.forEach((p, k) => {
        const yy = padT + ph - (p.mse / mmax) * ph;
        k ? ctx.lineTo(X(p.step), yy) : ctx.moveTo(X(p.step), yy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.strokeStyle = "#1a1a1b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  hist.forEach((p, k) => {
    // step-shaped line: error count changes at each update
    if (k === 0) ctx.moveTo(X(p.step), Y(p.errors));
    else { ctx.lineTo(X(p.step), Y(hist[k - 1].errors)); ctx.lineTo(X(p.step), Y(p.errors)); }
  });
  ctx.stroke();

  $("#chart-legend").innerHTML = showMse
    ? `<span class="lg-err">misclassified</span><span class="lg-mse">squared error (rescaled), now ${fmt(hist[hist.length - 1].mse, 3)}</span>`
    : "";
}

// ---------- Render all ----------

function renderCounters() {
  $("#epoch-count").textContent = S.epoch;
  $("#step-count").textContent = S.step;
  const { errors } = countErrors();
  $("#error-count").textContent = `${errors} / ${S.points.length}`;
}

function render() {
  renderPlot();
  renderDiagram();
  renderUpdateBox();
  renderChart();
  renderCounters();
  syncWeightInputs();
  updateTableHighlights();
}

function renderLabelsForActivation() {
  $("#act-select").title = A().note;
  document.querySelectorAll(".label-pos-text").forEach(e => e.textContent = classText(true));
  document.querySelectorAll(".label-neg-text").forEach(e => e.textContent = classText(false));
}

// ---------- Wire up controls ----------

$("#play-btn").addEventListener("click", () => (S.running ? stop() : play()));
$("#step-btn").addEventListener("click", () => {
  stop();
  if (S.status && S.status.kind) setStatus(null);
  doStep();
  render();
});
$("#reset-btn").addEventListener("click", resetToInitial);

$("#speed").addEventListener("input", e => {
  $("#speed-label").textContent = `${SPEEDS[+e.target.value]} / sec`;
});

document.querySelectorAll("#preset-grid .chip").forEach(b =>
  b.addEventListener("click", () => loadPreset(b.dataset.preset)));

document.querySelectorAll(".seg-btn").forEach(b =>
  b.addEventListener("click", () => {
    S.tool = b.dataset.tool;
    document.querySelectorAll(".seg-btn").forEach(x => {
      x.classList.toggle("active", x === b);
      x.setAttribute("aria-checked", x === b ? "true" : "false");
    });
  }));

$("#view-select").addEventListener("change", e => { S.view = e.target.value; render(); });

$("#add-row-btn").addEventListener("click", () => {
  S.points.push({ x1: 0, x2: 0, pos: true });
  dataChanged();
  const wrap = $(".table-wrap");
  wrap.scrollTop = wrap.scrollHeight;
});
$("#clear-btn").addEventListener("click", () => {
  S.points = [];
  stop();
  newRun();
  dataChanged();
});

$("#bias-check").addEventListener("change", e => {
  S.useBias = e.target.checked;
  stop();
  newRun();
  renderWeightControls();
  render();
});

$("#act-select").addEventListener("change", e => {
  S.act = e.target.value;
  stop();
  newRun();
  renderLabelsForActivation();
  renderTable();
  render();
});

$("#zero-btn").addEventListener("click", () => {
  for (const k in S.w) S.w[k] = 0;
  S.b = 0;
  stop(); newRun(); syncWeightInputs(); render();
});
$("#random-btn").addEventListener("click", () => {
  for (const k in S.w) S.w[k] = round2(Math.random() * 2 - 1);
  S.b = round2(Math.random() * 2 - 1);
  stop(); newRun(); syncWeightInputs(); render();
});

$("#wstep-select").addEventListener("change", e => {
  S.wStep = +e.target.value;
  document.querySelectorAll("#weight-list input").forEach(inp => { inp.step = S.wStep; });
});

$("#lr-input").addEventListener("change", e => {
  const v = parseFloat(e.target.value);
  if (isFinite(v) && v >= 0) S.lr = v; else e.target.value = S.lr;
});
$("#order-select").addEventListener("change", e => { S.order = e.target.value; makePerm(); });
$("#max-epochs").addEventListener("change", e => {
  const v = parseInt(e.target.value, 10);
  if (v >= 1) S.maxEpochs = v; else e.target.value = S.maxEpochs;
});
$("#stop-check").addEventListener("change", e => { S.stopWhenDone = e.target.checked; });
$("#trail-check").addEventListener("change", e => { S.showTrail = e.target.checked; render(); });
$("#vector-check").addEventListener("change", e => { S.showVector = e.target.checked; render(); });

window.addEventListener("resize", () => render());

document.addEventListener("keydown", e => {
  if (e.target.matches("input, select, textarea")) return;
  if (e.key === " ") { e.preventDefault(); S.running ? stop() : play(); }
  else if (e.key === "s" || e.key === "ArrowRight") $("#step-btn").click();
  else if (e.key === "r") resetToInitial();
});

// ---------- Init ----------

renderWeightControls();
renderLabelsForActivation();
loadPreset("and");
