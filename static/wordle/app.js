(() => {
  'use strict';

  // ---------- Data ----------
  const ANSWERS = window.WORDLE_DATA.answers;
  const ALLOWED = window.WORDLE_DATA.allowed;
  const ALLOWED_SET = new Set(ALLOWED);
  const TURN1_LEADERBOARD = window.TURN1_LEADERBOARD;

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

  // ---------- Inlined Web Worker (Blob URL so this works from file:// too) ----------
  const WORKER_SOURCE = `
    function patternCode(guessCodes, candCodes) {
      const fb0 = guessCodes[0] === candCodes[0] ? 2 : 0;
      const fb1 = guessCodes[1] === candCodes[1] ? 2 : 0;
      const fb2 = guessCodes[2] === candCodes[2] ? 2 : 0;
      const fb3 = guessCodes[3] === candCodes[3] ? 2 : 0;
      const fb4 = guessCodes[4] === candCodes[4] ? 2 : 0;
      const fb = [fb0, fb1, fb2, fb3, fb4];
      const rem = new Int16Array(26);
      if (fb0 === 0) rem[candCodes[0]]++;
      if (fb1 === 0) rem[candCodes[1]]++;
      if (fb2 === 0) rem[candCodes[2]]++;
      if (fb3 === 0) rem[candCodes[3]]++;
      if (fb4 === 0) rem[candCodes[4]]++;
      for (let i = 0; i < 5; i++) {
        if (fb[i] === 0) {
          const gl = guessCodes[i];
          if (rem[gl] > 0) { fb[i] = 1; rem[gl]--; }
        }
      }
      return fb[0] + fb[1] * 3 + fb[2] * 9 + fb[3] * 27 + fb[4] * 81;
    }

    function toCodes(word) {
      const c = new Uint8Array(5);
      for (let i = 0; i < 5; i++) c[i] = word.charCodeAt(i) - 97;
      return c;
    }

    function scoreGuess(guessCodes, candidateCodesList) {
      const Nc = candidateCodesList.length;
      const counts = new Int32Array(243);
      for (let c = 0; c < Nc; c++) {
        counts[patternCode(guessCodes, candidateCodesList[c])]++;
      }
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
      return {
        entropy,
        expRemaining: sumSq / Nc,
        maxRemaining: maxCount,
        partitions
      };
    }

    self.onmessage = function(e) {
      const { requestId, candidates, guessPool, specificGuess } = e.data;
      const candidateCodes = candidates.map(toCodes);

      let specific = null;
      if (specificGuess && candidateCodes.length > 0) {
        specific = scoreGuess(toCodes(specificGuess), candidateCodes);
      }

      // Returns the FULL scored list (every word in guessPool), not just a top slice,
      // so the caller can sort by any column without a re-computation round trip.
      let leaderboard = [];
      if (guessPool && candidateCodes.length > 0) {
        leaderboard = new Array(guessPool.length);
        for (let g = 0; g < guessPool.length; g++) {
          const word = guessPool[g];
          const r = scoreGuess(toCodes(word), candidateCodes);
          leaderboard[g] = { word, entropy: r.entropy, expRemaining: r.expRemaining,
                              maxRemaining: r.maxRemaining, partitions: r.partitions };
        }
        leaderboard.sort((a, b) => (b.entropy - a.entropy) || (a.expRemaining - b.expRemaining));
      }

      self.postMessage({ requestId, specific, leaderboard });
    };
  `;

  const workerBlob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(workerBlob));

  let requestCounter = 0;
  const pendingRequests = new Map();
  worker.onmessage = (e) => {
    const { requestId, specific, leaderboard } = e.data;
    const resolver = pendingRequests.get(requestId);
    if (resolver) {
      pendingRequests.delete(requestId);
      resolver({ specific, leaderboard });
    }
  };

  function analyze(candidates, guessPool, specificGuess) {
    const requestId = ++requestCounter;
    return new Promise((resolve) => {
      pendingRequests.set(requestId, resolve);
      worker.postMessage({ requestId, candidates, guessPool, specificGuess });
    });
  }

  // ---------- DOM refs ----------
  const boardEl = document.getElementById('board');
  const keyboardEl = document.getElementById('keyboard');
  const toastContainer = document.getElementById('toast-container');
  const remainingCountEl = document.getElementById('remaining-count');
  const maxBitsEl = document.getElementById('max-bits');
  const remainingListEl = document.getElementById('remaining-list');
  const historyBodyEl = document.getElementById('history-body');
  const leaderboardBodyEl = document.getElementById('leaderboard-body');
  const leaderboardLoadingEl = document.getElementById('leaderboard-loading');
  const newGameBtn = document.getElementById('new-game-btn');
  const revealBtn = document.getElementById('reveal-btn');
  const wordSearchInput = document.getElementById('word-search-input');
  const wordSearchBtn = document.getElementById('word-search-btn');
  const wordSearchResultEl = document.getElementById('word-search-result');
  const answersToggleBtn = document.getElementById('answers-toggle-btn');
  const answersModeNoteEl = document.getElementById('answers-mode-note');
  const scratchModal = document.getElementById('scratch-modal');
  const scratchAnswerEl = document.getElementById('scratch-answer');
  const scratchCloseBtn = document.getElementById('scratch-close');
  const scratchRevealAllBtn = document.getElementById('scratch-reveal-all');

  // ---------- Game state ----------
  const MAX_GUESSES = 6;
  const WORD_LEN = 5;
  // `candidates` is always the set of ALLOWED words consistent with every (guess,
  // feedback) pair so far -- never the curated NYT answer list. The only place the
  // actual solution is used is to generate real feedback and check for a win; it
  // never feeds any displayed metric.
  let solution, candidates, guesses, feedbacks, currentGuess, currentRow, gameOver, keyStates, busy;

  // ---------- Leaderboard sorting (client-side, over the full precomputed/computed dataset) ----------
  const SORT_LABELS = { word: 'Word', entropy: 'Expected bits', expRemaining: 'Expected left', maxRemaining: 'Worst case' };
  const SORT_DEFAULT_DIR = { word: 'asc', entropy: 'desc', expRemaining: 'asc', maxRemaining: 'asc' };
  let leaderboardData = [];
  let sortKey = 'entropy';
  let sortDir = 'desc';

  function applySort() {
    const dir = sortDir === 'asc' ? 1 : -1;
    leaderboardData.sort((a, b) => {
      if (sortKey === 'word') return dir * a.word.localeCompare(b.word);
      return dir * (a[sortKey] - b[sortKey]);
    });
  }

  function updateSortHeaderUI() {
    document.querySelectorAll('#leaderboard-table th[data-sort-key]').forEach((th) => {
      const key = th.dataset.sortKey;
      const label = th.querySelector('.th-text');
      const active = key === sortKey;
      label.textContent = SORT_LABELS[key] + (active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');
      th.classList.toggle('sorted', active);
    });
  }

  function setLeaderboardData(entries) {
    leaderboardData = entries.slice();
    applySort();
    renderLeaderboard(leaderboardData.slice(0, 10));
    updateSortHeaderUI();
  }

  document.querySelectorAll('#leaderboard-table th[data-sort-key]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sortKey;
      if (key === sortKey) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = SORT_DEFAULT_DIR[key];
      }
      applySort();
      renderLeaderboard(leaderboardData.slice(0, 10));
      updateSortHeaderUI();
    });
  });

  function randomSolution() {
    return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
  }

  function newGame() {
    solution = randomSolution();
    candidates = ALLOWED.slice();
    guesses = [];
    feedbacks = [];
    currentGuess = '';
    currentRow = 0;
    gameOver = false;
    keyStates = {};
    busy = false;
    sortKey = 'entropy';
    sortDir = 'desc';
    showCandidatesOnly = false;

    buildBoard();
    buildKeyboard();
    updateKeyboardColors();
    historyBodyEl.innerHTML = '';
    wordSearchInput.value = '';
    setSearchResult('', false);
    answersModeNoteEl.textContent = '';
    updateAnswersToggleUI();
    updateStats();
    setLeaderboardData(TURN1_LEADERBOARD);
  }

  // ---------- Board ----------
  function buildBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'board-row';
      row.id = `row-${r}`;
      for (let c = 0; c < WORD_LEN; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function currentRowEl() {
    return document.getElementById(`row-${currentRow}`);
  }

  function renderCurrentGuess() {
    const row = currentRowEl();
    if (!row) return;
    for (let c = 0; c < WORD_LEN; c++) {
      const tile = row.children[c];
      const letter = currentGuess[c] || '';
      tile.textContent = letter;
      tile.classList.toggle('filled', letter !== '');
    }
  }

  function shakeRow() {
    const row = currentRowEl();
    if (!row) return;
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 500);
  }

  function revealRow(row, guess, fb) {
    const delayStep = 260;
    const flipDuration = 450;
    return new Promise((resolve) => {
      for (let i = 0; i < WORD_LEN; i++) {
        const tile = row.children[i];
        const delay = i * delayStep;
        setTimeout(() => tile.classList.add('flip'), delay);
        setTimeout(() => {
          const cls = fb[i] === 2 ? 'correct' : fb[i] === 1 ? 'present' : 'absent';
          tile.classList.add(cls);
        }, delay + flipDuration / 2);
      }
      setTimeout(resolve, (WORD_LEN - 1) * delayStep + flipDuration + 50);
    });
  }

  // ---------- Keyboard ----------
  const KB_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['enter','z','x','c','v','b','n','m','back'],
  ];

  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    KB_ROWS.forEach((rowKeys) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      rowKeys.forEach((k) => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.dataset.key = k;
        if (k === 'enter') { btn.textContent = 'Enter'; btn.classList.add('wide'); }
        else if (k === 'back') { btn.textContent = '⌫'; btn.classList.add('wide'); }
        else { btn.textContent = k; }
        btn.addEventListener('click', () => handleKey(k));
        rowEl.appendChild(btn);
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  function updateKeyboardColors() {
    document.querySelectorAll('.key').forEach((btn) => {
      const k = btn.dataset.key;
      btn.classList.remove('correct', 'present', 'absent');
      if (keyStates[k]) btn.classList.add(keyStates[k]);
    });
  }

  function updateKeyStatesFromGuess(guess, fb) {
    for (let i = 0; i < WORD_LEN; i++) {
      const letter = guess[i];
      const cls = fb[i] === 2 ? 'correct' : fb[i] === 1 ? 'present' : 'absent';
      const rank = { absent: 0, present: 1, correct: 2 };
      if (!keyStates[letter] || rank[cls] > rank[keyStates[letter]]) {
        keyStates[letter] = cls;
      }
    }
  }

  // ---------- Input handling ----------
  function handleKey(k) {
    if (gameOver || busy) return;
    if (k === 'enter') { submitGuess(); return; }
    if (k === 'back') { currentGuess = currentGuess.slice(0, -1); renderCurrentGuess(); return; }
    if (/^[a-z]$/.test(k) && currentGuess.length < WORD_LEN) {
      currentGuess += k;
      renderCurrentGuess();
    }
  }

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (gameOver || busy) return;
    const key = e.key.toLowerCase();
    if (key === 'enter') { e.preventDefault(); handleKey('enter'); }
    else if (key === 'backspace') { e.preventDefault(); handleKey('back'); }
    else if (/^[a-z]$/.test(key)) { e.preventDefault(); handleKey(key); }
  });

  // ---------- Toasts ----------
  function showToast(msg, duration = 1800) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ---------- Info tooltips (single shared element, clamped to viewport so it never gets cut off) ----------
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
      e.stopPropagation();
      if (tooltipOwner === icon) hideTooltip();
      else showTooltip(icon);
    });
  });
  document.addEventListener('click', hideTooltip);
  window.addEventListener('scroll', () => { if (tooltipOwner) positionTooltip(tooltipOwner); }, true);
  window.addEventListener('resize', () => { if (tooltipOwner) positionTooltip(tooltipOwner); });

  // ---------- Stats / analysis panel ----------
  function updateStats() {
    remainingCountEl.textContent = candidates.length;
    const maxBits = candidates.length > 0 ? Math.log2(candidates.length) : 0;
    maxBitsEl.textContent = maxBits.toFixed(2);

    const preview = candidates.slice(0, 40).join(', ');
    remainingListEl.textContent = candidates.length > 40
      ? preview + `, … (+${candidates.length - 40} more)`
      : preview;
  }

  function addHistoryRow(turnNum, guess, actualBits, expectedBits, efficiencyPct, leftAfter) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${turnNum}</td>
      <td>${guess.toUpperCase()}</td>
      <td>${actualBits.toFixed(2)}</td>
      <td>${expectedBits.toFixed(2)}</td>
      <td>${efficiencyPct.toFixed(0)}%</td>
      <td>${leftAfter}</td>
    `;
    historyBodyEl.appendChild(tr);
  }

  function renderLeaderboard(entries) {
    leaderboardBodyEl.innerHTML = '';
    entries.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${entry.word.toUpperCase()}</td>
        <td>${entry.entropy.toFixed(3)}</td>
        <td>${entry.expRemaining.toFixed(1)}</td>
        <td>${entry.maxRemaining}</td>
      `;
      leaderboardBodyEl.appendChild(tr);
    });
  }

  let showCandidatesOnly = false;

  function updateAnswersToggleUI() {
    // Before the first guess every allowed word is still a candidate, so this
    // toggle would score all ~13k words against all ~13k words -- tens of
    // seconds of work for a table identical to the precomputed turn-1 one.
    const usable = guesses.length > 0 && !gameOver;
    answersToggleBtn.disabled = !usable;
    answersToggleBtn.title = usable
      ? ''
      : 'Make a guess first -- before that, every allowed word is still possible.';
    answersToggleBtn.classList.toggle('active', showCandidatesOnly);
    answersToggleBtn.setAttribute('aria-pressed', String(showCandidatesOnly));
  }

  async function refreshLeaderboard() {
    if (candidates.length === 0) { setLeaderboardData([]); return; }
    leaderboardLoadingEl.hidden = false;

    let result, noteText;
    if (showCandidatesOnly) {
      // `candidates` is already the ALLOWED-based, board-filtered pool -- just also
      // restrict the guess pool to it, so suggestions are themselves still-possible
      // words instead of any allowed word (e.g. probe words that can't be the answer).
      result = await analyze(candidates, candidates, null);
      noteText = `Showing the ${candidates.length.toLocaleString()} word${candidates.length === 1 ? '' : 's'} still consistent with your board.`;
    } else {
      result = await analyze(candidates, ALLOWED, null);
      noteText = '';
    }

    // Set the note and the table together so there's never a moment where one
    // reflects the new toggle state and the other still shows the old data.
    leaderboardLoadingEl.hidden = true;
    answersModeNoteEl.textContent = noteText;
    setLeaderboardData(result.leaderboard);
  }

  answersToggleBtn.addEventListener('click', () => {
    if (guesses.length === 0 || gameOver) return;
    showCandidatesOnly = !showCandidatesOnly;
    updateAnswersToggleUI();
    refreshLeaderboard();
  });

  // ---------- Word lookup ----------
  function setSearchResult(html, isError) {
    wordSearchResultEl.innerHTML = html;
    wordSearchResultEl.classList.toggle('error', !!isError);
  }

  async function analyzeSearchWord() {
    const raw = wordSearchInput.value.trim().toLowerCase();

    if (!/^[a-z]{5}$/.test(raw)) {
      setSearchResult('Enter a 5-letter word.', true);
      return;
    }
    if (!ALLOWED_SET.has(raw)) {
      setSearchResult(`&ldquo;${raw.toUpperCase()}&rdquo; is not in the allowed word list.`, true);
      return;
    }
    if (candidates.length === 0) {
      setSearchResult('No candidates remain &mdash; start a new game.', true);
      return;
    }

    setSearchResult('Computing&hellip;', false);
    const { specific } = await analyze(candidates, null, raw);
    if (!specific) return;

    setSearchResult(`
      <span class="sr-word">${raw.toUpperCase()}</span><br>
      Expected bits: <strong>${specific.entropy.toFixed(3)}</strong> &middot;
      Expected left: <strong>${specific.expRemaining.toFixed(1)}</strong> &middot;
      Worst case: <strong>${specific.maxRemaining}</strong>
    `, false);
  }

  wordSearchBtn.addEventListener('click', analyzeSearchWord);
  wordSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); analyzeSearchWord(); }
  });

  // ---------- Guess submission ----------
  async function submitGuess() {
    const guess = currentGuess.toLowerCase();

    if (guess.length !== WORD_LEN) {
      shakeRow();
      showToast('Not enough letters');
      return;
    }
    if (!ALLOWED_SET.has(guess)) {
      shakeRow();
      showToast('Not in word list');
      return;
    }

    busy = true;
    const row = currentRowEl();
    const fb = getFeedback(guess, solution);
    const candidatesBefore = candidates;

    await revealRow(row, guess, fb);
    updateKeyStatesFromGuess(guess, fb);
    updateKeyboardColors();

    const fbKey = fb.join('');
    const candidatesAfter = candidatesBefore.filter(
      (w) => getFeedback(guess, w).join('') === fbKey
    );

    const Nbefore = candidatesBefore.length;
    const Nafter = candidatesAfter.length;
    const maxBits = Nbefore > 0 ? Math.log2(Nbefore) : 0;
    const actualBits = Nafter > 0 ? Math.log2(Nbefore / Nafter) : 0;

    guesses.push(guess);
    feedbacks.push(fbKey);
    candidates = candidatesAfter;

    const won = guess === solution;
    currentRow++;
    currentGuess = '';

    const { specific } = await analyze(candidatesBefore, null, guess);
    const expectedBits = specific ? specific.entropy : actualBits;
    const efficiencyPct = maxBits > 0 ? (actualBits / maxBits) * 100 : 100;
    addHistoryRow(guesses.length, guess, actualBits, expectedBits, efficiencyPct, Nafter);

    updateStats();
    updateAnswersToggleUI();

    if (won) {
      gameOver = true;
      showToast(`Splendid! Solved in ${guesses.length}/${MAX_GUESSES}`, 3000);
      answersModeNoteEl.textContent = '';
      setLeaderboardData([]);
      updateAnswersToggleUI();
      busy = false;
      return;
    }
    if (currentRow >= MAX_GUESSES) {
      gameOver = true;
      showToast(`The word was ${solution.toUpperCase()}`, 4000);
      answersModeNoteEl.textContent = '';
      setLeaderboardData([]);
      updateAnswersToggleUI();
      busy = false;
      return;
    }

    await refreshLeaderboard();
    busy = false;
  }

  // ---------- Scratch-card solution reveal ----------
  let scratchCleanup = null;

  function drawScratchSurface(ctx, w, h) {
    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#c3c7cd');
    grad.addColorStop(1, '#8b8f96');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    for (let x = -h; x < w; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE', w / 2, h / 2);
  }

  function openScratchModal(word) {
    if (scratchCleanup) scratchCleanup();

    scratchAnswerEl.textContent = word.toUpperCase();
    scratchModal.hidden = false;

    // Fresh canvas each time so we don't accumulate listeners across opens.
    const oldCanvas = document.getElementById('scratch-canvas');
    const canvas = oldCanvas.cloneNode();
    oldCanvas.replaceWith(canvas);
    const ctx = canvas.getContext('2d');
    canvas.style.opacity = '1';
    drawScratchSurface(ctx, canvas.width, canvas.height);

    let isDown = false;
    let revealed = false;

    function pointFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches && e.touches[0];
      const clientX = t ? t.clientX : e.clientX;
      const clientY = t ? t.clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    function checkRevealed() {
      if (revealed) return;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      let sampled = 0;
      for (let i = 3; i < data.length; i += 16) {
        sampled++;
        if (data[i] < 10) transparent++;
      }
      if (transparent / sampled > 0.5) {
        revealed = true;
        canvas.style.transition = 'opacity 0.4s ease';
        canvas.style.opacity = '0';
      }
    }

    function onDown(e) { isDown = true; const p = pointFromEvent(e); scratchAt(p.x, p.y); }
    function onMove(e) {
      if (!isDown) return;
      const p = pointFromEvent(e);
      scratchAt(p.x, p.y);
      checkRevealed();
    }
    function onUp() { isDown = false; checkRevealed(); }
    function onTouchStart(e) { onDown(e); e.preventDefault(); }
    function onTouchMove(e) { onMove(e); e.preventDefault(); }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onUp);

    scratchRevealAllBtn.onclick = () => {
      revealed = true;
      canvas.style.transition = 'opacity 0.4s ease';
      canvas.style.opacity = '0';
    };

    scratchCleanup = () => {
      window.removeEventListener('mouseup', onUp);
      scratchRevealAllBtn.onclick = null;
    };
  }

  function closeScratchModal() {
    scratchModal.hidden = true;
    if (scratchCleanup) { scratchCleanup(); scratchCleanup = null; }
  }

  scratchCloseBtn.addEventListener('click', closeScratchModal);
  scratchModal.addEventListener('click', (e) => {
    if (e.target === scratchModal) closeScratchModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !scratchModal.hidden) closeScratchModal();
  });

  // ---------- Buttons ----------
  newGameBtn.addEventListener('click', newGame);
  revealBtn.addEventListener('click', () => {
    gameOver = true;
    openScratchModal(solution);
  });

  // ---------- Boot ----------
  newGame();
})();
