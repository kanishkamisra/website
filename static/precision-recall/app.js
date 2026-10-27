"use strict";

/* =====================================================================
   Precision & Recall Practice
   Each page load makes a new scenario: two classifiers tested on the
   same items. Students say which one has higher accuracy, recall, and
   precision (or neither). A plain visit gives a new random scenario;
   a link with #s=12345 always shows that same scenario.
   ===================================================================== */

// ---------- Scenario themes (family friendly) ----------
// intro: how the two classifiers are introduced, followed by "N items."
// items: what is being classified; pos: the positive class, used in
// "labels 60 as ___" and "50 are actually ___".

const THEMES = [
  { intro: "Two spam filters are tested on", items: "emails", pos: "spam" },
  { intro: "Two cat detectors are tested on", items: "photos", pos: "cat photos" },
  { intro: "Two sentiment classifiers are tested on", items: "movie reviews", pos: "positive reviews" },
  { intro: "Two language identifiers are tested on", items: "sentences", pos: "Spanish" },
  { intro: "Two question detectors are tested on", items: "sentences", pos: "questions" },
  { intro: "Two ripeness scanners at a farm stand check", items: "tomatoes", pos: "ripe" },
  { intro: "Two weather apps predict rain for", items: "days", pos: "rainy" },
  { intro: "Two recipe sorters are tested on", items: "recipes", pos: "vegetarian" },
  { intro: "Two bird-song apps listen to", items: "recordings", pos: "robin songs" },
  { intro: "Two part-of-speech taggers are tested on", items: "words", pos: "nouns" },
  { intro: "Two rhyme detectors are tested on", items: "word pairs", pos: "rhymes" },
  { intro: "Two spell checkers are tested on", items: "words", pos: "misspelled" },
  { intro: "Two library robots sort", items: "books", pos: "mystery novels" },
  { intro: "Two dog-breed apps are tested on", items: "dog photos", pos: "golden retrievers" },
  { intro: "Two sarcasm detectors are tested on", items: "comments", pos: "sarcastic" },
  { intro: "Two music apps are tested on", items: "songs", pos: "jazz" },
];

// Easy numbers: every count is a multiple of `step` (one tenth of N).
const SIZES = [
  { N: 20, step: 2 },
  { N: 50, step: 5 },
  { N: 100, step: 10 },
  { N: 100, step: 10 },
  { N: 200, step: 20 },
];

// Question order; each metric has its own color (see .m-* in style.css).
const METRICS = [
  { key: "rec", name: "recall" },
  { key: "prec", name: "precision" },
  { key: "acc", name: "accuracy" },
];

// Non-tied metrics must differ by at least this much, so the comparison
// is clear-cut rather than a rounding contest.
const MIN_GAP = 0.05;

// ---------- Helpers ----------

const $ = sel => document.querySelector(sel);

// Small seeded PRNG so a seed always gives the same scenario.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fractions are [numerator, denominator]; compare exactly.
function cmpFrac([a, b], [c, d]) {
  const l = a * d, r = c * b;
  return l === r ? 0 : l > r ? 1 : -1;
}

function fracVal([a, b]) { return a / b; }

function dec([a, b]) {
  const v = a / b;
  const r = Math.round(v * 100) / 100;
  return (Math.abs(v - r) < 1e-9 ? "= " : "≈ ") + r.toFixed(2);
}

function counts(c, N, P) {
  const tn = N - P - c.fp;
  return {
    tp: c.tp, fp: c.fp, fn: P - c.tp, tn,
    labeled: c.tp + c.fp,
    acc: [c.tp + tn, N],
    rec: [c.tp, P],
    prec: [c.tp, c.tp + c.fp],
  };
}

// ---------- Scenario generation ----------

function generate(seed) {
  const rnd = mulberry32(seed);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

  const theme = pick(THEMES);
  // Mix of scenario shapes: about 3 in 5 have no ties; the rest tie on
  // exactly one metric (the "Neither!" case).
  const tieOn = pick([null, null, null, "acc", "rec", "prec"]);
  const wantTradeoff = rnd() < 0.6; // one wins recall, the other precision

  for (let tries = 0; tries < 50000; tries++) {
    const { N, step } = pick(SIZES);
    const posUnits = int(3, 6);
    const P = posUnits * step;
    const negUnits = N / step - posUnits;
    const make = () => ({ tp: int(1, posUnits) * step, fp: int(0, negUnits) * step });
    const A = make(), B = make();
    if (A.tp === B.tp && A.fp === B.fp) continue;

    const cA = counts(A, N, P), cB = counts(B, N, P);
    const answers = {};
    const ties = [];
    let clear = true;
    for (const { key } of METRICS) {
      const c = cmpFrac(cA[key], cB[key]);
      if (c === 0) ties.push(key);
      else if (Math.abs(fracVal(cA[key]) - fracVal(cB[key])) < MIN_GAP) clear = false;
      answers[key] = c > 0 ? "A" : c < 0 ? "B" : "Neither";
    }
    if (!clear) continue;
    if (tieOn) {
      if (ties.length !== 1 || ties[0] !== tieOn) continue;
    } else {
      if (ties.length) continue;
      if (wantTradeoff && answers.rec === answers.prec) continue;
    }
    return { seed, theme, N, P, A: cA, B: cB, answers };
  }
  // Practically unreachable; fall back to the slide's example.
  const N = 100, P = 50;
  const A = counts({ tp: 40, fp: 20 }, N, P), B = counts({ tp: 40, fp: 0 }, N, P);
  return { seed, theme: THEMES[0], N, P, A, B, answers: { acc: "B", rec: "Neither", prec: "B" } };
}

// ---------- Text ----------

function describe(c, pos) {
  if (c.labeled === 0) return `labels nothing as ${pos}.`;
  const which = c.tp === c.labeled ? `all ${c.tp}` : c.tp === 0 ? "none" : `${c.tp}`;
  const verb = c.tp === 1 ? "is" : "are";
  return `labels ${c.labeled} as ${pos}; ${which} of those ${verb} actually ${pos}.`;
}

function explain(key, S) {
  const { A, B, N, P, theme } = S;
  const pos = theme.pos;
  const line = (name, c) => {
    if (key === "acc") {
      return `<b>${name}:</b> ${c.tp} correctly labeled ${pos} + ${c.tn} correctly labeled not ${pos} → (${c.tp} + ${c.tn}) / ${N} = ${c.acc[0]}/${N} ${dec(c.acc)}`;
    }
    if (key === "rec") {
      return `<b>${name}:</b> found ${c.tp} of the ${P} that are actually ${pos} → ${c.tp}/${P} ${dec(c.rec)}`;
    }
    return `<b>${name}:</b> of the ${c.labeled} it labeled ${pos}, ${c.tp} really are → ${c.tp}/${c.labeled} ${dec(c.prec)}`;
  };
  const rule = {
    acc: "Accuracy = (true positives + true negatives) / total",
    rec: "Recall = true positives / actual positives",
    prec: "Precision = true positives / labeled positive",
  }[key];
  let html = `<div class="rule m-${key}">${rule}</div><div>${line("A", A)}</div><div>${line("B", B)}</div>`;
  if (S.answers[key] === "Neither") {
    const what = { acc: "the same number right overall", rec: `the same share of the actual ${pos}`, prec: "equally trustworthy labels" }[key];
    html += `<div class="note">Neither! They have ${what}, even though their raw counts differ.</div>`;
  }
  return html;
}

// ---------- State and rendering ----------

let S = null;          // current scenario
let picked = {};       // metric key -> chosen option

function readSeed() {
  const m = location.hash.match(/s=(\d+)/);
  return m ? Number(m[1]) : null;
}

function newSeed() {
  return 1 + Math.floor(Math.random() * 99999);
}

function load(seed, { keepHash = false } = {}) {
  S = generate(seed);
  picked = {};
  // Leave the address plain so a refresh gives a new scenario; only a
  // shared link (with #s=...) pins one.
  if (!keepHash && location.hash) {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  const { theme, N, P, A, B } = S;
  $("#scenario-id").textContent = `Scenario #${S.seed}`;
  $("#scenario-intro").textContent = `${theme.intro} ${N} ${theme.items}.`;
  $("#fact-total").innerHTML = `${N} ${theme.items}, <b>${P} are actually ${theme.pos}</b>.`;
  $("#fact-a").textContent = describe(A, theme.pos);
  $("#fact-b").textContent = describe(B, theme.pos);

  const box = $("#questions");
  box.innerHTML = "";
  METRICS.forEach(({ key, name }, i) => {
    const q = document.createElement("div");
    q.className = `question q-${key}`;
    q.innerHTML = `
      <p class="q-text">${i + 1}. Which classifier has a higher <span class="metric m-${key}">${name}</span>?</p>
      <div class="options" role="group" aria-label="${name}">
        <button class="opt" data-v="A">A</button>
        <button class="opt" data-v="B">B</button>
        <button class="opt" data-v="Neither">Neither</button>
      </div>
      <div class="feedback" hidden></div>`;
    q.querySelectorAll(".opt").forEach(btn =>
      btn.addEventListener("click", () => answer(key, btn.dataset.v, q)));
    box.appendChild(q);
  });
  $("#summary").hidden = true;
}

function answer(key, choice, q) {
  if (picked[key]) return;
  picked[key] = choice;
  const correct = S.answers[key];
  const right = choice === correct;
  q.querySelectorAll(".opt").forEach(b => {
    b.disabled = true;
    if (b.dataset.v === correct) b.classList.add("correct");
    else if (b.dataset.v === choice) b.classList.add("wrong");
  });
  const fb = q.querySelector(".feedback");
  fb.hidden = false;
  fb.innerHTML = `<div class="verdict ${right ? "ok" : "bad"}">${right ? "✓ Correct!" : `✗ Not quite: the answer is <b>${correct}</b>.`}</div>` + explain(key, S);
  bumpRecord(right);
  if (Object.keys(picked).length === METRICS.length) showSummary();
}

function matrix(name, c) {
  const pos = S.theme.pos;
  return `
    <table class="matrix">
      <caption>Classifier ${name}</caption>
      <thead><tr><th></th><th>labeled ${pos}</th><th>labeled not</th></tr></thead>
      <tbody>
        <tr><th>actually ${pos}</th><td class="tp">${c.tp}</td><td>${c.fn}</td></tr>
        <tr><th>actually not</th><td>${c.fp}</td><td class="tn">${c.tn}</td></tr>
      </tbody>
    </table>`;
}

function showSummary() {
  const n = METRICS.filter(({ key }) => picked[key] === S.answers[key]).length;
  const msg = n === 3 ? "3 / 3. Nicely done!" : n === 2 ? "2 / 3. Almost there!" : `${n} / 3. Check the working above and try another!`;
  $("#summary-text").textContent = msg;
  $("#matrix-a").innerHTML = matrix("A", S.A);
  $("#matrix-b").innerHTML = matrix("B", S.B);
  $("#summary").hidden = false;
}

// ---------- Record (this device only) ----------

const RECORD_KEY = "pr-practice-record";

function getRecord() {
  try {
    const r = JSON.parse(localStorage.getItem(RECORD_KEY));
    if (r && Number.isFinite(r.right) && Number.isFinite(r.total)) return r;
  } catch (e) {}
  return { right: 0, total: 0 };
}

function setRecord(r) {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(r)); } catch (e) {}
  $("#record-value").textContent = `${r.right} / ${r.total}`;
}

function bumpRecord(right) {
  const r = getRecord();
  r.total++;
  if (right) r.right++;
  setRecord(r);
}

// ---------- Wire up ----------

$("#new-btn").addEventListener("click", () => load(newSeed()));
$("#new-btn-2").addEventListener("click", () => load(newSeed()));
$("#record-reset").addEventListener("click", () => setRecord({ right: 0, total: 0 }));
$("#copy-btn").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#s=${S.seed}`;
  const btn = $("#copy-btn");
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = "Link copied!";
  } catch (e) {
    // clipboard can be blocked (e.g. file:// pages); show the link instead
    window.prompt("Link to this scenario:", url);
  }
  setTimeout(() => { btn.textContent = "Copy link"; }, 1500);
});
window.addEventListener("hashchange", () => {
  const s = readSeed();
  if (s && (!S || s !== S.seed)) load(s, { keepHash: true });
});

setRecord(getRecord());
const linked = readSeed();
load(linked || newSeed(), { keepHash: !!linked });
