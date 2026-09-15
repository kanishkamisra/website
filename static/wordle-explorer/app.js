(() => {
  'use strict';

  // ---------- Data ----------
  // Explorer only ever reasons over ALLOWED (every word you could type as a guess),
  // never the curated NYT answer list -- picking "the answer" here is just picking
  // which word to explore against, not trying to reconstruct a hidden secret.
  const ALLOWED = window.WORDLE_DATA.allowed;
  const ALLOWED_SET = new Set(ALLOWED);
  const ANSWERS_SET = new Set(window.WORDLE_DATA.answers);

  // ---------- Feedback (Wordle coloring rule: greens first, then yellows by remaining count) ----------
  function getFeedback(guess, solution) {
    const fb = [0, 0, 0, 0, 0];
    const used = [false, false, false, false, false];
    for (let i = 0; i < 5; i++) {
      if (guess[i] === solution[i]) { fb[i] = 2; used[i] = true; }
    }
    const rem = {};
    for (let i = 0; i < 5; i++) {
      if (!used[i]) {
        const s = solution[i];
        rem[s] = (rem[s] || 0) + 1;
      }
    }
    for (let i = 0; i < 5; i++) {
      if (fb[i] === 0) {
        const g = guess[i];
        if (rem[g] > 0) { fb[i] = 1; rem[g]--; }
      }
    }
    return fb;
  }

  // Base-3 encode/decode of a 5-slot {0,1,2} feedback pattern -> 0..242.
  function patternCode(fb) {
    return fb[0] + fb[1] * 3 + fb[2] * 9 + fb[3] * 27 + fb[4] * 81;
  }

  function decodePattern(code) {
    const fb = [0, 0, 0, 0, 0];
    let c = code;
    for (let i = 0; i < 5; i++) { fb[i] = c % 3; c = (c - fb[i]) / 3; }
    return fb;
  }

  // Scores a single guess against a candidate pool: how many candidates fall into
  // each of the 243 possible feedback patterns, plus the usual summary stats.
  // At ~13k candidates this runs in single-digit milliseconds, so it's plain
  // synchronous main-thread work here -- no worker needed (unlike the full
  // all-guesses-vs-all-candidates leaderboard in the main game).
  function scoreGuess(guess, candidates) {
    const counts = new Array(243).fill(0);
    for (let i = 0; i < candidates.length; i++) {
      counts[patternCode(getFeedback(guess, candidates[i]))]++;
    }
    const Nc = candidates.length;
    let entropy = 0, sumSq = 0, maxCount = 0, partitions = 0;
    for (let p = 0; p < 243; p++) {
      const cnt = counts[p];
      if (cnt > 0) {
        const prob = cnt / Nc;
        entropy -= prob * Math.log2(prob);
        sumSq += cnt * cnt;
        if (cnt > maxCount) maxCount = cnt;
        partitions++;
      }
    }
    return { entropy, expRemaining: sumSq / Nc, maxRemaining: maxCount, partitions, counts };
  }

  // ---------- DOM refs ----------
  const changeAnswerBtn = document.getElementById('change-answer-btn');

  const answerPickerEl = document.getElementById('answer-picker');
  const answerInputEl = document.getElementById('answer-input');
  const answerRandomBtn = document.getElementById('answer-random-btn');
  const answerSetBtn = document.getElementById('answer-set-btn');
  const answerResultEl = document.getElementById('answer-result');

  const answerDisplayEl = document.getElementById('answer-display');
  const answerTilesEl = document.getElementById('answer-tiles');
  const answerFactEl = document.getElementById('answer-fact');
  const resetGuessesBtn = document.getElementById('reset-guesses-btn');

  const guessPickerEl = document.getElementById('guess-picker');
  const guessInputEl = document.getElementById('guess-input');
  const guessAnalyzeBtn = document.getElementById('guess-analyze-btn');
  const guessResultEl = document.getElementById('guess-result');

  const outcomePreviewEl = document.getElementById('outcome-preview');
  const outcomeTilesEl = document.getElementById('outcome-tiles');
  const outcomeSummaryEl = document.getElementById('outcome-summary');
  const commitGuessBtn = document.getElementById('commit-guess-btn');
  const commitGuessNumEl = document.getElementById('commit-guess-num');

  const historyWrapEl = document.getElementById('history-wrap');
  const historyBodyEl = document.getElementById('history-body');

  const remainingCountEl = document.getElementById('remaining-count');
  const maxBitsEl = document.getElementById('max-bits');
  const remainingListEl = document.getElementById('remaining-list');

  const guessStatsSectionEl = document.getElementById('guess-stats-section');
  const statsCandidateCountEl = document.getElementById('stats-candidate-count');
  const statEntropyEl = document.getElementById('stat-entropy');
  const statExpRemainingEl = document.getElementById('stat-exp-remaining');
  const statMaxRemainingEl = document.getElementById('stat-max-remaining');
  const statPartitionsEl = document.getElementById('stat-partitions');
  const distCaptionEl = document.getElementById('dist-caption');
  const distributionListEl = document.getElementById('distribution-list');
  const distOrientationBtn = document.getElementById('dist-orientation-btn');
  const distColumnDetailEl = document.getElementById('dist-column-detail');
  const distColumnDetailTilesEl = document.getElementById('dist-column-detail-tiles');
  const distColumnDetailTextEl = document.getElementById('dist-column-detail-text');

  const wordDatalistEl = document.getElementById('word-datalist');
  const toastContainer = document.getElementById('toast-container');

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = {
    answer: document.getElementById('tab-panel-answer'),
    blind: document.getElementById('tab-panel-blind'),
  };

  const blindGuessInputEl = document.getElementById('blind-guess-input');
  const blindGuessAnalyzeBtn = document.getElementById('blind-guess-analyze-btn');
  const blindGuessResultEl = document.getElementById('blind-guess-result');
  const blindEmptyStateEl = document.getElementById('blind-empty-state');
  const blindGuessStatsSectionEl = document.getElementById('blind-guess-stats-section');
  const blindStatsGuessWordEl = document.getElementById('blind-stats-guess-word');
  const blindStatsCandidateCountEl = document.getElementById('blind-stats-candidate-count');
  const blindStatEntropyEl = document.getElementById('blind-stat-entropy');
  const blindStatExpRemainingEl = document.getElementById('blind-stat-exp-remaining');
  const blindStatMaxRemainingEl = document.getElementById('blind-stat-max-remaining');
  const blindStatPartitionsEl = document.getElementById('blind-stat-partitions');
  const blindDistCaptionEl = document.getElementById('blind-dist-caption');
  const blindDistributionListEl = document.getElementById('blind-distribution-list');
  const blindDistOrientationBtn = document.getElementById('blind-dist-orientation-btn');
  const blindDistColumnDetailEl = document.getElementById('blind-dist-column-detail');
  const blindDistColumnDetailTilesEl = document.getElementById('blind-dist-column-detail-tiles');
  const blindDistColumnDetailTextEl = document.getElementById('blind-dist-column-detail-text');

  const blindOutcomeWordsWrapEl = document.getElementById('blind-outcome-words-wrap');
  const blindOutcomeHintEl = document.getElementById('blind-outcome-hint');
  const blindOutcomeDetailEl = document.getElementById('blind-outcome-detail');
  const blindOutcomePatternTilesEl = document.getElementById('blind-outcome-pattern-tiles');
  const blindOutcomeWordsSummaryEl = document.getElementById('blind-outcome-words-summary');
  const blindOutcomeWordsListEl = document.getElementById('blind-outcome-words-list');

  // ---------- State ----------
  let answer = null;
  let candidates = ALLOWED.slice();
  let history = [];
  let lastAnalysis = null; // { guess, fb, code, count, actualBits, efficiencyPct, result, Nc }
  let distOrientation = 'rows';

  // ---------- Toasts ----------
  function showToast(msg, duration = 1800) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ---------- Info tooltips (single shared element, clamped to viewport) ----------
  const globalTooltip = document.getElementById('global-tooltip');
  let tooltipOwner = null;

  function positionTooltip(icon) {
    const margin = 8;
    const iconRect = icon.getBoundingClientRect();
    const tw = globalTooltip.offsetWidth;
    const th = globalTooltip.offsetHeight;

    let left = iconRect.left + iconRect.width / 2 - tw / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tw - margin));

    let top = iconRect.top - th - margin;
    if (top < margin) top = iconRect.bottom + margin;

    globalTooltip.style.left = `${left}px`;
    globalTooltip.style.top = `${top}px`;
  }

  function showTooltip(icon) {
    tooltipOwner = icon;
    globalTooltip.textContent = icon.dataset.tooltip;
    globalTooltip.classList.add('visible');
    positionTooltip(icon);
  }

  function hideTooltip() {
    tooltipOwner = null;
    globalTooltip.classList.remove('visible');
  }

  document.querySelectorAll('.info-icon').forEach((icon) => {
    icon.addEventListener('mouseenter', () => showTooltip(icon));
    icon.addEventListener('mouseleave', hideTooltip);
    icon.addEventListener('focus', () => showTooltip(icon));
    icon.addEventListener('blur', hideTooltip);
    icon.addEventListener('click', (e) => {
      // Not a toggle: mouseenter/focus already show it before this fires (mouse and
      // touch both focus the element on click), so treating this as "close if
      // already open" would immediately undo that. Showing unconditionally here and
      // relying on the document-level click-away listener to close it means a click
      // or tap always works, not just hover.
      e.stopPropagation();
      showTooltip(icon);
    });
  });
  document.addEventListener('click', hideTooltip);
  window.addEventListener('scroll', () => { if (tooltipOwner) positionTooltip(tooltipOwner); }, true);
  window.addEventListener('resize', () => { if (tooltipOwner) positionTooltip(tooltipOwner); });

  // ---------- Validation ----------
  function validateWord(raw) {
    const w = raw.trim().toLowerCase();
    if (!/^[a-z]{5}$/.test(w)) return { ok: false, error: 'Enter a 5-letter word.' };
    if (!ALLOWED_SET.has(w)) return { ok: false, error: `&ldquo;${w.toUpperCase()}&rdquo; is not in the allowed word list.` };
    return { ok: true, word: w };
  }

  function setAnswerResult(html, isError) {
    answerResultEl.innerHTML = html;
    answerResultEl.classList.toggle('error', !!isError);
  }

  function setGuessResult(html, isError) {
    guessResultEl.innerHTML = html;
    guessResultEl.classList.toggle('error', !!isError);
  }

  // ---------- Tiles ----------
  function renderTiles(container, word, fb) {
    container.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const tile = document.createElement('div');
      tile.className = 'tile filled';
      if (fb) {
        tile.classList.add(fb[i] === 2 ? 'correct' : fb[i] === 1 ? 'present' : 'absent');
      }
      tile.textContent = word[i];
      container.appendChild(tile);
    }
  }

  // ---------- Outcome distribution chart ----------
  // Shared across both orientations: which patterns actually occur, sorted by
  // how many candidates produce them, and the largest one (bars scale against it).
  function computeDistributionBuckets(counts) {
    const buckets = [];
    for (let code = 0; code < 243; code++) {
      if (counts[code] > 0) buckets.push({ code, count: counts[code] });
    }
    buckets.sort((a, b) => b.count - a.count);
    const maxCount = buckets.length ? buckets[0].count : 1;
    return { buckets, maxCount };
  }

  // Makes an item (row or column) clickable/keyboard-activatable, sharing the
  // same interaction wiring regardless of orientation.
  function makeClickable(el, onItemClick, code, fb, count) {
    el.classList.add('dist-clickable');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.addEventListener('click', () => onItemClick(code, fb, count, el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemClick(code, fb, count, el); }
    });
  }

  // Column mode's lightweight "peek": mouse/keyboard hover previews a column's
  // metrics immediately, no click required. A click is also wired as a fallback
  // for touch, where hover never fires. Distinct from makeClickable's onItemClick,
  // which (in the blind tab) additionally drives the heavier word-list lookup.
  function makeHoverable(el, onEnter, onLeave) {
    el.tabIndex = 0;
    el.classList.add('dist-clickable');
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('focus', onEnter);
    el.addEventListener('blur', onLeave);
    el.addEventListener('click', onEnter);
  }

  // One horizontal bar per realized feedback pattern, stacked top to bottom.
  // Bars are neutral gray (magnitude only, sequential-style). When actualCode is
  // given (the "with an answer" tab), that single row is picked out in the accent
  // color plus a text badge, so the "real" outcome is never color-only. Pass
  // actualCode = null (the "without an answer" tab) to render a plain
  // distribution with nothing singled out. Pass onItemClick to make every row
  // clickable (invoked with code, fb, count, rowEl); omit it to leave rows inert.
  function renderDistributionRows(listEl, buckets, maxCount, Nc, actualCode, onItemClick) {
    listEl.classList.remove('as-columns');
    listEl.innerHTML = '';

    let actualRowEl = null;
    buckets.forEach(({ code, count }) => {
      const fb = decodePattern(code);
      const row = document.createElement('div');
      row.className = 'dist-row' + (code === actualCode ? ' dist-actual' : '');

      const pattern = document.createElement('div');
      pattern.className = 'dist-pattern';
      fb.forEach((v) => {
        const mini = document.createElement('span');
        mini.className = 'dist-mini-tile ' + (v === 2 ? 'correct' : v === 1 ? 'present' : 'absent');
        pattern.appendChild(mini);
      });
      row.appendChild(pattern);

      const track = document.createElement('div');
      track.className = 'dist-bar-track';
      const fill = document.createElement('div');
      fill.className = 'dist-bar-fill';
      fill.style.width = `${(count / maxCount) * 100}%`;
      track.appendChild(fill);
      row.appendChild(track);

      const countEl = document.createElement('div');
      countEl.className = 'dist-count';
      const pct = (count / Nc) * 100;
      const bits = Math.log2(Nc / count); // self-information of this one outcome: -log2(probability)
      countEl.innerHTML = `${count.toLocaleString()} <span class="dist-pct">(${pct < 0.1 ? '&lt;0.1' : pct.toFixed(1)}%)</span> <span class="dist-bits">&middot; ${bits.toFixed(2)} bits</span>`;
      if (code === actualCode) {
        const badge = document.createElement('span');
        badge.className = 'dist-actual-badge';
        badge.textContent = 'your answer';
        countEl.appendChild(badge);
      }
      row.appendChild(countEl);

      if (onItemClick) makeClickable(row, onItemClick, code, fb, count);

      listEl.appendChild(row);
      if (code === actualCode) actualRowEl = row;
    });

    if (actualRowEl) {
      requestAnimationFrame(() => actualRowEl.scrollIntoView({ block: 'center' }));
    }
  }

  // Same data, rotated: one vertical bar per pattern, arranged left to right
  // (a conventional histogram shape). With up to 243 columns, only the
  // emphasized one gets a persistent value label (on its cap, per the usual
  // column mark spec) -- every other column's full detail instead shows up in
  // the shared readout below the chart as soon as you hover or focus it.
  function renderDistributionColumns(listEl, buckets, maxCount, Nc, actualCode, onItemClick, onHoverEnter, onHoverLeave) {
    listEl.classList.add('as-columns');
    listEl.innerHTML = '';
    const BAR_MAX_PX = 210; // leaves headroom in the container for a cap label

    let actualColEl = null;
    buckets.forEach(({ code, count }) => {
      const fb = decodePattern(code);
      const col = document.createElement('div');
      const isActual = code === actualCode;
      col.className = 'dist-col' + (isActual ? ' dist-actual' : '');

      if (isActual) {
        const label = document.createElement('div');
        label.className = 'dist-col-label';
        label.textContent = count.toLocaleString();
        col.appendChild(label);
      }

      const bar = document.createElement('div');
      bar.className = 'dist-col-bar';
      bar.style.height = `${Math.max(3, Math.round((count / maxCount) * BAR_MAX_PX))}px`;
      col.appendChild(bar);

      if (onItemClick) makeClickable(col, onItemClick, code, fb, count);
      if (onHoverEnter && onHoverLeave) makeHoverable(col, () => onHoverEnter(code, fb, count), onHoverLeave);

      listEl.appendChild(col);
      if (isActual) actualColEl = col;
    });

    if (actualColEl) {
      requestAnimationFrame(() => actualColEl.scrollIntoView({ inline: 'center', block: 'nearest' }));
    }
  }

  function renderDistribution(listEl, counts, Nc, actualCode, onItemClick, orientation, onHoverEnter, onHoverLeave) {
    const { buckets, maxCount } = computeDistributionBuckets(counts);
    if (orientation === 'columns') {
      renderDistributionColumns(listEl, buckets, maxCount, Nc, actualCode, onItemClick, onHoverEnter, onHoverLeave);
    } else {
      renderDistributionRows(listEl, buckets, maxCount, Nc, actualCode, onItemClick);
    }
  }

  // Column mode's detail readout: the full per-outcome metrics (pattern, count,
  // percent, bits) that row mode shows inline on every row, but for just the one
  // column currently clicked -- given the chart's full width below it, instead
  // of trying to fit them above a 6-22px bar.
  function renderColumnDetail(refs, guessWord, fb, count, Nc, extraLabel) {
    renderTiles(refs.tiles, guessWord, fb);
    const pct = (count / Nc) * 100;
    const bits = Math.log2(Nc / count);
    refs.text.innerHTML = `${count.toLocaleString()} word${count === 1 ? '' : 's'} (${pct < 0.1 ? '&lt;0.1' : pct.toFixed(1)}%) &middot; ${bits.toFixed(2)} bits${extraLabel ? ` &mdash; ${extraLabel}` : ''}`;
    refs.wrap.hidden = false;
  }

  // ---------- Stats ----------
  function updateTopStats() {
    remainingCountEl.textContent = candidates.length.toLocaleString();
    maxBitsEl.textContent = candidates.length > 0 ? Math.log2(candidates.length).toFixed(2) : '0.00';
    const preview = candidates.slice(0, 40).join(', ');
    remainingListEl.textContent = candidates.length > 40
      ? preview + `, … (+${(candidates.length - 40).toLocaleString()} more)`
      : preview;
  }

  function updateGuessStats(elems, result, Nc) {
    elems.entropy.textContent = result.entropy.toFixed(3);
    elems.expRemaining.textContent = result.expRemaining.toFixed(1);
    elems.maxRemaining.textContent = result.maxRemaining.toLocaleString();
    elems.partitions.textContent = `${result.partitions} / 243`;
  }

  function addHistoryRow(entry) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.n}</td>
      <td>${entry.guess.toUpperCase()}</td>
      <td>${entry.actualBits.toFixed(2)}</td>
      <td>${entry.expectedBits.toFixed(2)}</td>
      <td>${entry.efficiencyPct.toFixed(0)}%</td>
      <td>${entry.leftAfter.toLocaleString()}</td>
    `;
    historyBodyEl.appendChild(tr);
  }

  // ---------- Visibility (single source of truth, called after every state change) ----------
  function refreshVisibility() {
    const hasAnswer = answer !== null;
    answerPickerEl.hidden = hasAnswer;
    answerDisplayEl.hidden = !hasAnswer;
    changeAnswerBtn.hidden = !hasAnswer;
    guessPickerEl.hidden = !hasAnswer;
    historyWrapEl.hidden = history.length === 0;
    outcomePreviewEl.hidden = !lastAnalysis;
    guessStatsSectionEl.hidden = !lastAnalysis;
  }

  // ---------- Answer picking ----------
  function setAnswer(word) {
    answer = word;
    candidates = ALLOWED.slice();
    history = [];
    lastAnalysis = null;
    historyBodyEl.innerHTML = '';

    renderTiles(answerTilesEl, answer, null);
    answerFactEl.textContent = ANSWERS_SET.has(answer)
      ? `${answer.toUpperCase()} has been a real NYT Wordle answer.`
      : `${answer.toUpperCase()} is a valid guess, but not on NYT's curated answer list.`;

    answerInputEl.value = '';
    setAnswerResult('', false);
    guessInputEl.value = '';
    setGuessResult('', false);

    updateTopStats();
    refreshVisibility();
  }

  function trySetAnswerFromInput() {
    const v = validateWord(answerInputEl.value);
    if (!v.ok) { setAnswerResult(v.error, true); return; }
    setAnswer(v.word);
  }

  answerSetBtn.addEventListener('click', trySetAnswerFromInput);
  answerInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); trySetAnswerFromInput(); }
  });

  answerRandomBtn.addEventListener('click', () => {
    const word = ALLOWED[Math.floor(Math.random() * ALLOWED.length)];
    setAnswer(word);
    showToast(`Answer set to ${word.toUpperCase()}`);
  });

  changeAnswerBtn.addEventListener('click', () => {
    answer = null;
    candidates = ALLOWED.slice();
    history = [];
    lastAnalysis = null;
    historyBodyEl.innerHTML = '';

    updateTopStats();
    refreshVisibility();
    answerInputEl.value = '';
    setAnswerResult('', false);
    answerInputEl.focus();
  });

  resetGuessesBtn.addEventListener('click', () => {
    candidates = ALLOWED.slice();
    history = [];
    lastAnalysis = null;
    historyBodyEl.innerHTML = '';
    guessInputEl.value = '';
    setGuessResult('', false);

    updateTopStats();
    refreshVisibility();
    showToast('Guess history cleared.');
  });

  // ---------- Guess analysis ----------
  function showDistColumnDetail(fb, count, isActual) {
    renderColumnDetail(
      { tiles: distColumnDetailTilesEl, text: distColumnDetailTextEl, wrap: distColumnDetailEl },
      lastAnalysis.guess, fb, count, lastAnalysis.Nc,
      isActual ? 'your answer' : null
    );
  }

  // Column mode only: hovering (or focusing, or tapping) any column -- not
  // just the emphasized "actual" one -- previews its metrics in the readout
  // below the chart. Un-hovering reverts to the actual answer's own outcome,
  // which stays the default, persistently-informative view.
  function onDistColHoverEnter(code, fb, count) {
    showDistColumnDetail(fb, count, code === lastAnalysis.code);
  }

  function onDistColHoverLeave() {
    showDistColumnDetail(lastAnalysis.fb, lastAnalysis.count, true);
  }

  function analyzeGuess(word) {
    const result = scoreGuess(word, candidates);
    const fb = getFeedback(word, answer);
    const code = patternCode(fb);
    const count = result.counts[code];
    const Nc = candidates.length;
    const maxBits = Nc > 0 ? Math.log2(Nc) : 0;
    const actualBits = count > 0 ? Math.log2(Nc / count) : 0;
    const efficiencyPct = maxBits > 0 ? (actualBits / maxBits) * 100 : 100;

    lastAnalysis = { guess: word, fb, code, count, actualBits, efficiencyPct, result, Nc };

    renderTiles(outcomeTilesEl, word, fb);
    outcomeSummaryEl.innerHTML = `
      Against <strong>${answer.toUpperCase()}</strong>, <strong>${word.toUpperCase()}</strong> narrows
      ${Nc.toLocaleString()} &rarr; <strong>${count.toLocaleString()}</strong> word${count === 1 ? '' : 's'}
      (<strong>${actualBits.toFixed(2)} bits</strong>, ${efficiencyPct.toFixed(0)}% of the max possible this turn).
    `;
    commitGuessNumEl.textContent = `#${history.length + 1}`;

    statsCandidateCountEl.textContent = Nc.toLocaleString();
    updateGuessStats({
      entropy: statEntropyEl,
      expRemaining: statExpRemainingEl,
      maxRemaining: statMaxRemainingEl,
      partitions: statPartitionsEl,
    }, result, Nc);
    distCaptionEl.textContent = `${result.partitions} distinct outcomes out of 243, across the ${Nc.toLocaleString()} word${Nc === 1 ? '' : 's'} still possible. The highlighted ${distOrientation === 'columns' ? 'column' : 'row'} is what ${answer.toUpperCase()} actually produces.`;
    renderDistribution(
      distributionListEl, result.counts, Nc, code, null, distOrientation,
      distOrientation === 'columns' ? onDistColHoverEnter : null,
      distOrientation === 'columns' ? onDistColHoverLeave : null
    );
    tabPanels.answer.classList.toggle('chart-expanded', distOrientation === 'columns');

    if (distOrientation === 'columns') {
      renderColumnDetail(
        { tiles: distColumnDetailTilesEl, text: distColumnDetailTextEl, wrap: distColumnDetailEl },
        word, fb, count, Nc, 'your answer'
      );
    } else {
      distColumnDetailEl.hidden = true;
    }

    refreshVisibility();
  }

  function tryAnalyzeFromInput() {
    if (!answer) return;
    const v = validateWord(guessInputEl.value);
    if (!v.ok) { setGuessResult(v.error, true); return; }
    setGuessResult('', false);
    analyzeGuess(v.word);
  }

  guessAnalyzeBtn.addEventListener('click', tryAnalyzeFromInput);
  guessInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tryAnalyzeFromInput(); }
  });

  commitGuessBtn.addEventListener('click', () => {
    if (!lastAnalysis) return;
    const { guess, fb, actualBits, efficiencyPct, result } = lastAnalysis;
    const fbKey = fb.join('');
    candidates = candidates.filter((w) => getFeedback(guess, w).join('') === fbKey);

    history.push({
      n: history.length + 1,
      guess,
      actualBits,
      expectedBits: result.entropy,
      efficiencyPct,
      leftAfter: candidates.length,
    });
    addHistoryRow(history[history.length - 1]);

    const solved = guess === answer;
    lastAnalysis = null;
    guessInputEl.value = '';
    setGuessResult('', false);

    updateTopStats();
    refreshVisibility();

    if (solved) {
      showToast(`That's the answer! Solved in ${history.length} guess${history.length === 1 ? '' : 'es'}.`, 3000);
    }
    guessInputEl.focus();
  });

  distOrientationBtn.addEventListener('click', () => {
    distOrientation = distOrientation === 'rows' ? 'columns' : 'rows';
    distOrientationBtn.textContent = distOrientation === 'rows' ? 'Show as columns' : 'Show as rows';
    tabPanels.answer.classList.toggle('chart-expanded', distOrientation === 'columns');
    if (lastAnalysis) {
      distCaptionEl.textContent = `${lastAnalysis.result.partitions} distinct outcomes out of 243, across the ${lastAnalysis.Nc.toLocaleString()} word${lastAnalysis.Nc === 1 ? '' : 's'} still possible. The highlighted ${distOrientation === 'columns' ? 'column' : 'row'} is what ${answer.toUpperCase()} actually produces.`;
      renderDistribution(
        distributionListEl, lastAnalysis.result.counts, lastAnalysis.Nc, lastAnalysis.code, null, distOrientation,
        distOrientation === 'columns' ? onDistColHoverEnter : null,
        distOrientation === 'columns' ? onDistColHoverLeave : null
      );
      if (distOrientation === 'columns') {
        renderColumnDetail(
          { tiles: distColumnDetailTilesEl, text: distColumnDetailTextEl, wrap: distColumnDetailEl },
          lastAnalysis.guess, lastAnalysis.fb, lastAnalysis.count, lastAnalysis.Nc, 'your answer'
        );
      } else {
        distColumnDetailEl.hidden = true;
      }
    }
  });

  // ---------- Tabs ----------
  function switchTab(name) {
    Object.entries(tabPanels).forEach(([key, el]) => { el.hidden = key !== name; });
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === name;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    // "Change answer" belongs only to the answer tab; re-derive it there instead
    // of just unhiding it, since it should stay hidden if no answer is set yet.
    if (name === 'answer') refreshVisibility();
    else changeAnswerBtn.hidden = true;
  }

  tabButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  // ---------- Blind guess analysis (no answer fixed -- always the full allowed pool) ----------
  function setBlindGuessResult(html, isError) {
    blindGuessResultEl.innerHTML = html;
    blindGuessResultEl.classList.toggle('error', !!isError);
  }

  let blindGuessWord = null;
  let blindSelectedItemEl = null;
  let blindSelectedData = null; // { fb, count } for the currently click-pinned outcome, if any
  let blindDistOrientation = 'rows';
  let lastBlindResult = null; // { result, Nc } -- cached so toggling orientation doesn't need to recompute

  // Clicking a row or column asks "if this pattern happened, which words could
  // it have been?" -- a plain re-filter over ALLOWED by that exact pattern, not
  // a stored per-bucket list, since a fresh pass is already sub-10ms at this
  // word-list size.
  function selectBlindOutcome(code, fb, count, itemEl) {
    if (blindSelectedItemEl) {
      blindSelectedItemEl.classList.remove('dist-selected');
      const oldLabel = blindSelectedItemEl.querySelector('.dist-col-label');
      if (oldLabel) oldLabel.remove();
    }
    itemEl.classList.add('dist-selected');
    // Column mode only bakes a cap label onto the pre-known "actual" column at
    // render time; a click-selected column needs one added on the fly.
    if (itemEl.classList.contains('dist-col')) {
      const label = document.createElement('div');
      label.className = 'dist-col-label';
      label.textContent = count.toLocaleString();
      itemEl.insertBefore(label, itemEl.firstChild);
    }
    blindSelectedItemEl = itemEl;
    blindSelectedData = { fb, count };

    renderTiles(blindOutcomePatternTilesEl, blindGuessWord, fb);
    const fbKey = fb.join('');
    const words = ALLOWED.filter((w) => getFeedback(blindGuessWord, w).join('') === fbKey);
    blindOutcomeWordsSummaryEl.textContent = `${count.toLocaleString()} of the ${ALLOWED.length.toLocaleString()} allowed words produce this pattern:`;
    const preview = words.slice(0, 40).join(', ');
    blindOutcomeWordsListEl.textContent = words.length > 40
      ? preview + `, … (+${(words.length - 40).toLocaleString()} more)`
      : preview;

    blindOutcomeHintEl.hidden = true;
    blindOutcomeDetailEl.hidden = false;

    // The below-chart metrics readout is column mode's equivalent of the inline
    // text every row already shows -- redundant (and left hidden) in row mode.
    // Hovering already keeps it updated for mouse/keyboard use; this covers
    // touch, where a tap goes straight to click with no hover in between.
    if (blindDistOrientation === 'columns') {
      renderColumnDetail(
        { tiles: blindDistColumnDetailTilesEl, text: blindDistColumnDetailTextEl, wrap: blindDistColumnDetailEl },
        blindGuessWord, fb, count, ALLOWED.length, null
      );
    } else {
      blindDistColumnDetailEl.hidden = true;
    }
  }

  // Column mode only: hovering (or focusing) any column previews its metrics
  // below the chart instantly, without needing the heavier click-driven
  // word-list lookup that selectBlindOutcome does. Un-hovering hides it again
  // -- there's no fixed "actual" outcome here to fall back to showing.
  function onBlindColHoverEnter(code, fb, count) {
    renderColumnDetail(
      { tiles: blindDistColumnDetailTilesEl, text: blindDistColumnDetailTextEl, wrap: blindDistColumnDetailEl },
      blindGuessWord, fb, count, ALLOWED.length, null
    );
  }

  function onBlindColHoverLeave() {
    // Revert to whatever's click-pinned, if anything, rather than just hiding --
    // a hover peek shouldn't make the thing you deliberately selected vanish.
    if (blindSelectedData) {
      renderColumnDetail(
        { tiles: blindDistColumnDetailTilesEl, text: blindDistColumnDetailTextEl, wrap: blindDistColumnDetailEl },
        blindGuessWord, blindSelectedData.fb, blindSelectedData.count, ALLOWED.length, null
      );
    } else {
      blindDistColumnDetailEl.hidden = true;
    }
  }

  function analyzeBlindGuess(word) {
    const result = scoreGuess(word, ALLOWED);
    const Nc = ALLOWED.length;

    blindGuessWord = word;
    blindSelectedItemEl = null;
    blindSelectedData = null;
    blindOutcomeHintEl.hidden = false;
    blindOutcomeDetailEl.hidden = true;
    blindOutcomeWordsWrapEl.hidden = false;
    blindDistColumnDetailEl.hidden = true;

    blindStatsGuessWordEl.textContent = word.toUpperCase();
    blindStatsCandidateCountEl.textContent = Nc.toLocaleString();
    updateGuessStats({
      entropy: blindStatEntropyEl,
      expRemaining: blindStatExpRemainingEl,
      maxRemaining: blindStatMaxRemainingEl,
      partitions: blindStatPartitionsEl,
    }, result, Nc);
    lastBlindResult = { result, Nc };
    blindDistCaptionEl.textContent = `${result.partitions} distinct outcomes out of 243, across all ${Nc.toLocaleString()} allowed words.`;
    renderDistribution(
      blindDistributionListEl, result.counts, Nc, null, selectBlindOutcome, blindDistOrientation,
      blindDistOrientation === 'columns' ? onBlindColHoverEnter : null,
      blindDistOrientation === 'columns' ? onBlindColHoverLeave : null
    );
    tabPanels.blind.classList.toggle('chart-expanded', blindDistOrientation === 'columns');

    blindEmptyStateEl.hidden = true;
    blindGuessStatsSectionEl.hidden = false;
  }

  function tryAnalyzeBlindFromInput() {
    const v = validateWord(blindGuessInputEl.value);
    if (!v.ok) { setBlindGuessResult(v.error, true); return; }
    setBlindGuessResult('', false);
    analyzeBlindGuess(v.word);
  }

  blindDistOrientationBtn.addEventListener('click', () => {
    blindDistOrientation = blindDistOrientation === 'rows' ? 'columns' : 'rows';
    blindDistOrientationBtn.textContent = blindDistOrientation === 'rows' ? 'Show as columns' : 'Show as rows';
    tabPanels.blind.classList.toggle('chart-expanded', blindDistOrientation === 'columns');
    if (lastBlindResult) {
      blindSelectedItemEl = null;
      blindSelectedData = null;
      blindOutcomeHintEl.hidden = false;
      blindOutcomeDetailEl.hidden = true;
      blindDistColumnDetailEl.hidden = true;
      renderDistribution(
        blindDistributionListEl, lastBlindResult.result.counts, lastBlindResult.Nc, null, selectBlindOutcome, blindDistOrientation,
        blindDistOrientation === 'columns' ? onBlindColHoverEnter : null,
        blindDistOrientation === 'columns' ? onBlindColHoverLeave : null
      );
    }
  });

  blindGuessAnalyzeBtn.addEventListener('click', tryAnalyzeBlindFromInput);
  blindGuessInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tryAnalyzeBlindFromInput(); }
  });

  // ---------- Boot ----------
  wordDatalistEl.innerHTML = ALLOWED.map((w) => `<option value="${w}">`).join('');
  updateTopStats();
  refreshVisibility();
  switchTab('blind');
})();
