// ===== GAME CONTROLLER =====

let state = {
  deck: [],
  hands: [[], [], [], []],
  currentPlayer: 0,
  lastPlayer: 0,
  lastCombo: null,
  lastPlayedCards: [],
  passedPlayers: new Set(),
  selectedIndices: new Set(),
  gameOver: false,
  roundNum: 1,
  newRound: true,
  statusMsg: ''
};

let timerInterval = null;
let timeLeft = 15;
const TURN_TIME = 15;

// Timer functions
function startTimer() {
  stopTimer();
  timeLeft = TURN_TIME;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      stopTimer();
      if (state.currentPlayer === 0 && !state.gameOver) {
        onTimeout();
      }
    }
  }, 1000);
}

// Auto-play or pass when time runs out
function onTimeout() {
  if (state.newRound) {
    const hand = state.hands[0];
    if (hand.length === 0) return;

    const sorted = sortHand(hand);
    const lowestCard = sorted[0];
    const handIdx = hand.findIndex(c => c.rank === lowestCard.rank && c.suit === lowestCard.suit);

    // Check if lowest card belongs to a combo group - if so, play the whole group
    const groupLabels = detectComboGroups(hand);
    const label = groupLabels[handIdx];
    if (label) {
      const groupIndices = groupLabels.map((lbl, i) => lbl === label ? i : -1).filter(i => i >= 0);
      const groupCards = groupIndices.map(i => hand[i]);
      if (detectCombo(groupCards)) {
        for (const i of groupIndices) state.selectedIndices.add(i);
        state.statusMsg = 'Hết giờ! Tự động đánh';
        onPlay();
        return;
      }
    }

    // Fallback: play lowest single
    state.selectedIndices.add(handIdx);
    state.statusMsg = 'Hết giờ! Tự động đánh';
    onPlay();
  } else {
    state.statusMsg = 'Hết giờ! Tự động bỏ lượt';
    onPass();
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('timer-display');
  const barEl = document.getElementById('timer-fill');
  if (timerEl) {
    timerEl.textContent = timeLeft;
    timerEl.className = 'timer-display';
    if (timeLeft <= 5) timerEl.classList.add('danger');
    else if (timeLeft <= 10) timerEl.classList.add('warning');
  }
  if (barEl) {
    const pct = (timeLeft / TURN_TIME) * 100;
    barEl.style.width = pct + '%';
    barEl.className = 'timer-fill';
    if (timeLeft <= 5) barEl.classList.add('danger');
    else if (timeLeft <= 10) barEl.classList.add('warning');
  }
}

// UI functions
// Update only card selection styles without re-rendering entire hand
function updateCardSelectionStyles() {
  const handEl = document.getElementById('player-hand');
  if (!handEl) return;
  const cards = handEl.querySelectorAll('.card');
  cards.forEach(card => {
    const idx = parseInt(card.dataset.idx);
    if (state.selectedIndices.has(idx)) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function toggleSelect(idx) {
  if (state.gameOver) return;

  if (state.selectedIndices.has(idx)) {
    // Deselect: just remove this card
    state.selectedIndices.delete(idx);
  } else {
    // Select: try to auto-complete the combo group this card belongs to
    state.selectedIndices.add(idx);
    tryAutoSelectCombo(idx);
  }
  updateCardSelectionStyles();
}

// Auto-select sibling cards in the same combo group if the resulting combo is valid to play
function tryAutoSelectCombo(clickedIdx) {
  const hand = state.hands[0];
  const groupLabels = detectComboGroups(hand);
  const clickedLabel = groupLabels[clickedIdx];

  // No group label = isolated card, nothing to auto-select
  if (!clickedLabel) return;

  // Find all indices in the same group
  const groupIndices = groupLabels
    .map((lbl, i) => lbl === clickedLabel ? i : -1)
    .filter(i => i >= 0);

  // Build the candidate combo from all group members
  const groupCards = groupIndices.map(i => hand[i]);
  const combo = detectCombo(groupCards);
  if (!combo) return;

  // Check if this combo is valid to play right now
  const isValid = state.newRound || !state.lastCombo || canBeat(state.lastCombo, combo);
  if (!isValid) return;

  // Auto-select all cards in the group
  for (const i of groupIndices) {
    state.selectedIndices.add(i);
  }
}

// Drag and drop for card reordering
let draggedIdx = null;
let dragGhost = null;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
let globalDragListenersAdded = false;

function initHandInteractions() {
  const handEl = document.getElementById('player-hand');
  if (!handEl) return;

  const cards = handEl.querySelectorAll('.card');
  cards.forEach((card) => {
    // Click to select
    card.addEventListener('click', (e) => {
      if (isDragging || state.gameOver) return;
      const cardIdx = parseInt(card.dataset.idx);
      if (state.selectedIndices.has(cardIdx)) {
        state.selectedIndices.delete(cardIdx);
      } else {
        state.selectedIndices.add(cardIdx);
      }
      // Update only card styles without re-rendering full hand
      updateCardSelectionStyles();
    });

    // Mouse down - start tracking for potential drag
    card.addEventListener('mousedown', (e) => {
      if (state.gameOver) return;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      draggedIdx = parseInt(card.dataset.idx);
      isDragging = false;
    });

    // Touch start
    card.addEventListener('touchstart', (e) => {
      if (state.gameOver) return;
      const touch = e.touches[0];
      dragStartX = touch.clientX;
      dragStartY = touch.clientY;
      draggedIdx = parseInt(card.dataset.idx);
      isDragging = false;
    }, { passive: true });
  });

  // Only add global listeners once
  if (!globalDragListenersAdded) {
    globalDragListenersAdded = true;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: true });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
  }
}

function onDragMove(e) {
  if (draggedIdx === null) return;

  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const dx = Math.abs(clientX - dragStartX);
  const dy = Math.abs(clientY - dragStartY);

  // Start drag if moved more than 8px
  if (!isDragging && (dx > 8 || dy > 8)) {
    isDragging = true;
    startDrag();
  }

  if (isDragging && dragGhost) {
    updateGhostPosition(clientX, clientY);
    const gapIdx = calculateGapIndex(clientX);
    renderHandWithGap(gapIdx);
  }
}

function onDragEnd(e) {
  if (draggedIdx === null) return;

  if (!isDragging) {
    // Was a click, not a drag - let click handler deal with it
    draggedIdx = null;
    return;
  }

  // Complete the drag
  let clientX, clientY;
  if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const dropIdx = calculateGapIndex(clientX);

  // Reorder if position changed
  if (dropIdx !== draggedIdx) {
    const hand = state.hands[0];
    const [moved] = hand.splice(draggedIdx, 1);
    hand.splice(dropIdx, 0, moved);
  }

  // Clean up
  const handEl = document.getElementById('player-hand');
  if (handEl) handEl.classList.remove('dragging-active');

  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }

  draggedIdx = null;
  isDragging = false;
  state.selectedIndices.clear();
  renderGame(state);
}

// Get screen position of a card in player's hand by card data
function getCardScreenPos(rank, suit) {
  const handEl = document.getElementById('player-hand');
  if (!handEl) return { x: 240, y: 500 };
  const cards = handEl.querySelectorAll('.card');
  for (const card of cards) {
    if (card.dataset.rank === rank && card.dataset.suit === suit) {
      const rect = card.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  }
  // Fallback: center of hand area
  return { x: 240, y: 500 };
}

// Get screen position of opponent avatar
function getOpponentScreenPos(playerIdx) {
  const oppEls = document.querySelectorAll('.opponent');
  if (!oppEls || oppEls.length < playerIdx) return { x: 240, y: 100 };
  const rect = oppEls[playerIdx - 1].getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// Animate cards flying from source to table center
// cardPositions: array of {rank, suit} for player, or null for opponents (uses avatar)
function animatePlay(playerIdx, cards, cardPositions, callback) {
  const playedCardsEl = document.querySelector('.played-cards');
  if (!playedCardsEl) { callback && callback(); return; }

  const tableRect = playedCardsEl.getBoundingClientRect();
  const targetX = tableRect.left + tableRect.width / 2 - 30;
  const targetY = tableRect.top + tableRect.height / 2 - 42;

  // Get source positions
  const sourcePositions = cards.map((card, i) => {
    if (playerIdx === 0 && cardPositions && cardPositions[i]) {
      return cardPositions[i]; // Use pre-captured positions (before DOM changed)
    }
    return getOpponentScreenPos(playerIdx);
  });

  cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = `flying-card ${isRed(card.suit) ? 'red' : 'black'}`;
    el.setAttribute('data-rank', card.rank);
    el.setAttribute('data-suit', card.suit);
    el.innerHTML = `<span class="center-suit">${card.suit}</span>`;

    const src = sourcePositions[i];
    const offsetX = (i - (cards.length - 1) / 2) * 20;
    const startX = src.x - 30 + offsetX;
    const startY = src.y - 42;

    el.style.left = startX + 'px';
    el.style.top = startY + 'px';

    el.style.transition = 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.left = (targetX + offsetX) + 'px';
      el.style.top = targetY + 'px';
      el.style.transform = 'scale(0.75)';
    });

    setTimeout(() => {
      el.remove();
      if (i === cards.length - 1) {
        callback && callback();
      }
    }, 380);
  });
}

function calculateGapIndex(clientX) {
  const handEl = document.getElementById('player-hand');
  if (!handEl) return 0;

  const rect = handEl.getBoundingClientRect();
  const cardWidth = 72;
  const n = state.hands[0].length || 1;
  const overlap = Math.min(48, Math.max(26, (460 - cardWidth) / (n - 1)));

  let relX = clientX - rect.left;
  let idx = Math.round(relX / overlap);
  return Math.max(0, Math.min(idx, n - 1));
}

function startDrag() {
  const handEl = document.getElementById('player-hand');
  const card = handEl.querySelector(`.card[data-idx="${draggedIdx}"]`);
  if (!card) return;

  // Disable pointer events on hand during drag to prevent hover/click
  handEl.classList.add('dragging-active');

  // Create ghost
  dragGhost = card.cloneNode(true);
  dragGhost.classList.add('dragging-ghost');
  dragGhost.style.position = 'fixed';
  dragGhost.style.pointerEvents = 'none';
  dragGhost.style.zIndex = '1000';
  dragGhost.style.width = card.offsetWidth + 'px';
  dragGhost.style.height = card.offsetHeight + 'px';
  dragGhost.style.transition = 'none';

  // Hide original
  card.style.opacity = '0';

  document.body.appendChild(dragGhost);
}

function updateGhostPosition(x, y) {
  if (!dragGhost) return;
  dragGhost.style.left = (x - 36) + 'px';
  dragGhost.style.top = (y - 50) + 'px';
}

function renderHandWithGap(gapIdx) {
  const handEl = document.getElementById('player-hand');
  if (!handEl) return;

  const hand = state.hands[0];
  const n = hand.length;
  if (n === 0) return;

  const maxWidth = 460;
  const cardW = 72;
  const overlap = Math.min(48, Math.max(26, (maxWidth - cardW) / (n - 1 || 1)));
  const totalWidth = cardW + (n - 1) * overlap;
  const startX = (maxWidth - totalWidth) / 2;
  const spread = 24;

  const cards = handEl.querySelectorAll('.card');
  cards.forEach((cardEl) => {
    const i = parseInt(cardEl.dataset.idx);

    if (i === draggedIdx) {
      cardEl.style.opacity = '0';
      return;
    }

    // Simulate: remove dragged card, insert gap at gapIdx
    // Step 1: calculate slot as if dragged card removed
    let slot = (i < draggedIdx) ? i : i - 1;
    // Step 2: shift slots at/after gapIdx right by 1 to make room
    if (slot >= gapIdx) slot++;

    const x = startX + slot * overlap;
    cardEl.style.left = x + 'px';
    cardEl.style.transition = 'left 0.15s ease';
    cardEl.style.opacity = '1';
  });
}

function onPlay() {
  if (state.currentPlayer !== 0 || state.gameOver) return;
  const selected = getSelectedCards();
  const combo = detectCombo(selected);
  if (!combo) { state.statusMsg = 'Chọn bài hợp lệ!'; renderGame(state); return; }
  const valid = state.newRound || canBeat(state.lastCombo, combo);
  if (!valid) { state.statusMsg = 'Không chặn được!'; renderGame(state); return; }

  stopTimer();

  // Capture actual screen positions BEFORE modifying DOM
  const cardPositions = selected.map(c => getCardScreenPos(c.rank, c.suit));

  // Remove from hand BEFORE renderGame
  for (const c of selected) {
    const idx = state.hands[0].findIndex(hc => hc.rank === c.rank && hc.suit === c.suit);
    if (idx >= 0) state.hands[0].splice(idx, 1);
  }

  // Update state (except lastPlayedCards - will set after animation)
  state.lastCombo = combo;
  state.lastPlayer = 0;
  state.passedPlayers.clear();
  state.newRound = false;
  state.selectedIndices.clear();
  state.statusMsg = '';

  // Render first WITHOUT showing played cards
  renderGame(state);

  // Animate cards flying to table from captured positions
  animatePlay(0, selected, cardPositions, () => {
    state.lastPlayedCards = selected;
    const playedCardsEl = document.querySelector('.played-cards');
    if (playedCardsEl) {
      playedCardsEl.innerHTML = selected.map(c =>
        `<div class="card ${isRed(c.suit) ? 'red' : 'black'}" data-rank="${c.rank}" data-suit="${c.suit}"><span class="center-suit">${c.suit}</span></div>`
      ).join('');
    }
    checkWin(0);
    if (!state.gameOver) {
      updateAIContext();
      nextTurn();
    }
  });
}

function onPass() {
  if (state.currentPlayer !== 0 || state.gameOver || state.newRound) return;
  stopTimer();
  state.passedPlayers.add(0);
  state.selectedIndices.clear();
  state.statusMsg = 'Bạn bỏ lượt';
  renderGame(state);

  // Check if round ended (3+ players passed)
  const passedCount = state.passedPlayers.size;
  const activePlayers = state.hands.filter((h, i) => h.length > 0).length;

  if (passedCount >= activePlayers - 1 && activePlayers > 1) {
    // New round - last player who played wins the round
    state.newRound = true;
    state.roundNum++;
    state.lastCombo = null;
    state.lastPlayedCards = [];
    state.passedPlayers.clear();
    state.statusMsg = 'Vòng mới!';
    // Last player who played continues
    state.currentPlayer = state.lastPlayer;
    renderGame(state);
    if (state.currentPlayer === 0) {
      startTimer();
    } else {
      setTimeout(aiPlay, 800);
    }
  } else {
    // Continue to next player
    nextTurn();
  }
}

function onHint() {
  if (state.currentPlayer !== 0 || state.gameOver) return;

  // Ask AI for the best move
  const suggestion = (window.AI && window.AI.selectCards)
    ? window.AI.selectCards(state.hands[0], state.lastCombo, state.newRound, state)
    : null;

  // Clear current selection
  state.selectedIndices.clear();

  if (!suggestion) {
    // AI says pass - show hint in status
    state.statusMsg = 'Gợi ý: Bỏ lượt';
    renderGame(state);
    return;
  }

  // Select the suggested cards
  const hand = state.hands[0];
  for (const card of suggestion) {
    const idx = hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
    if (idx >= 0) state.selectedIndices.add(idx);
  }

  state.statusMsg = `Gợi ý: Đánh ${suggestion.length} lá`;
  updateCardSelectionStyles();
  // Update status without full re-render
  const statusEl = document.querySelector('.status-msg');
  if (statusEl) statusEl.textContent = state.statusMsg;
}

function onSort() {
  state.selectedIndices.clear(); // Clear selection before sorting
  state.hands[0] = sortHand(state.hands[0]);
  // Render hand only - no need to re-render entire game
  const handArea = document.getElementById('player-hand');
  if (handArea) {
    handArea.innerHTML = renderPlayerHand(state.hands[0], state.selectedIndices);
    initHandInteractions();
  }
}

function getSelectedCards() {
  const cards = [];
  const hand = state.hands[0];
  for (const idx of state.selectedIndices) {
    if (idx < hand.length) cards.push(hand[idx]);
  }
  return cards;
}

function checkWin(player) {
  if (state.hands[player].length === 0) {
    state.gameOver = true;
    stopTimer();
    const isPlayer = player === 0;
    state.statusMsg = isPlayer ? '🎉 Bạn thắng!' : `${PLAYER_NAMES[player]} thắng!`;
    renderGame(state);

    // Show win overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="menu-box">
        <div class="win-text">${isPlayer ? '🎉 Chiến Thắng!' : '😢 Thua Rồi!'}</div>
        <p class="win-sub">${isPlayer ? 'Bạn đã thắng ván này!' : PLAYER_NAMES[player] + ' đã thắng ván này!'}</p>
        <button class="btn-start" onclick="startGame()">Ván Mới</button>
      </div>
    `;
    document.getElementById('game').appendChild(overlay);
    return true;
  }
  return false;
}

function nextTurn() {
  // Find next active player (has cards and hasn't passed)
  let next = (state.currentPlayer + 1) % 4;
  let attempts = 0;

  // Skip players who have passed or have no cards
  while (attempts < 4) {
    const hasCards = state.hands[next].length > 0;
    const hasPassed = state.passedPlayers.has(next);

    if (hasCards && !hasPassed) {
      break;  // Found valid next player
    }
    next = (next + 1) % 4;
    attempts++;
  }

  // Check if only one player left with cards
  let activePlayers = 0;
  let lastActive = -1;
  for (let i = 0; i < 4; i++) {
    if (state.hands[i].length > 0) {
      activePlayers++;
      lastActive = i;
    }
  }

  if (activePlayers <= 1) {
    // Game over or only one player
    if (activePlayers === 1) {
      state.newRound = true;
      state.roundNum++;
      state.lastCombo = null;
      state.lastPlayedCards = [];
      state.passedPlayers.clear();
      state.statusMsg = `Vòng mới! ${PLAYER_NAMES[lastActive]} đánh trước`;
      state.currentPlayer = lastActive;
      state.lastPlayer = lastActive;
      renderGame(state);
      if (lastActive === 0) { startTimer(); }
      else if (lastActive !== 0) { setTimeout(aiPlay, 800); }
    }
    return;
  }

  state.currentPlayer = next;
  renderGame(state);

  // Start timer for player turn
  if (state.currentPlayer === 0) {
    startTimer();
  } else {
    setTimeout(aiPlay, 600 + Math.random() * 600);
  }
}

function setDifficulty(level) {
  if (window.AI) window.AI.setDifficulty(level);
  updateDifficultyUI();
}

function updateDifficultyUI() {
  const current = window.AI ? window.AI.getDifficulty() : 'medium';
  ['easy', 'medium', 'hard'].forEach(d => {
    const btn = document.getElementById(`diff-${d}`);
    if (btn) {
      btn.className = `diff-btn${current === d ? ` active ${d}` : ''}`;
    }
  });
}

function updateAIContext() {
  if (!window.AI || !window.AI.updateContext) return;

  // Track played cards and hand sizes
  const handSizes = state.hands.map(h => h.length);

  window.AI.updateContext({
    playedCards: state.lastPlayedCards,
    handSizes: handSizes,
    currentPlayer: state.currentPlayer
  });
}

function aiPlay() {
  if (state.gameOver) return;
  const aiIdx = state.currentPlayer;
  const hand = state.hands[aiIdx];

  // Update AI context with current game state
  updateAIContext();

  // Use advanced AI (or fallback to old aiSelectCards if window.AI not loaded)
  const selected = (window.AI && window.AI.selectCards)
    ? window.AI.selectCards(hand, state.lastCombo, state.newRound, state)
    : aiSelectCards(hand, state.lastCombo, state.newRound);

  if (!selected) {
    // AI passes
    state.passedPlayers.add(aiIdx);
    state.statusMsg = `${PLAYER_NAMES[aiIdx]} bỏ lượt`;

    // Check if round ended
    const activePlayers = state.hands.filter((h, i) => h.length > 0).length;
    if (state.passedPlayers.size >= activePlayers - 1 && activePlayers > 1) {
      state.newRound = true;
      state.roundNum++;
      state.lastCombo = null;
      state.lastPlayedCards = [];
      state.passedPlayers.clear();
      state.statusMsg = 'Vòng mới!';
      state.currentPlayer = state.lastPlayer;
      renderGame(state);
      if (state.currentPlayer === 0) {
        startTimer();
      } else {
        setTimeout(aiPlay, 800);
      }
    } else {
      renderGame(state);
      nextTurn();
    }
    return;
  }

  // Remove from hand
  for (const c of selected) {
    const idx = hand.findIndex(hc => hc.rank === c.rank && hc.suit === c.suit);
    if (idx >= 0) hand.splice(idx, 1);
  }

  // Update state (except lastPlayedCards - will set after animation)
  state.lastCombo = detectCombo(selected);
  state.lastPlayer = aiIdx;
  state.passedPlayers.clear();
  state.newRound = false;
  state.statusMsg = `${PLAYER_NAMES[aiIdx]} đánh ${selected.length} lá`;

  // Render first WITHOUT showing played cards, then animate
  renderGame(state);
  animatePlay(aiIdx, selected, null, () => {
    state.lastPlayedCards = selected;
    const playedCardsEl = document.querySelector('.played-cards');
    if (playedCardsEl) {
      playedCardsEl.innerHTML = selected.map(c =>
        `<div class="card ${isRed(c.suit) ? 'red' : 'black'}" data-rank="${c.rank}" data-suit="${c.suit}"><span class="center-suit">${c.suit}</span></div>`
      ).join('');
    }
    checkWin(aiIdx);
    if (!state.gameOver) {
      nextTurn();
    }
  });
}

function startGame() {
  // Create and shuffle deck
  state.deck = shuffle(createDeck());

  // Deal 13 cards to each player
  state.hands = [[], [], [], []];
  for (let i = 0; i < 52; i++) {
    state.hands[i % 4].push(state.deck[i]);
  }

  // Sort each hand
  for (let i = 0; i < 4; i++) {
    state.hands[i] = sortHand(state.hands[i]);
  }

  // Find who has 3♠ to go first
  let firstPlayer = 0;
  for (let i = 0; i < 4; i++) {
    const hasThreeSpades = state.hands[i].some(c => c.rank === '3' && c.suit === '♠');
    if (hasThreeSpades) { firstPlayer = i; break; }
  }

  state.currentPlayer = firstPlayer;
  state.lastPlayer = firstPlayer;
  state.lastCombo = null;
  state.lastPlayedCards = [];
  state.passedPlayers = new Set();
  state.selectedIndices = new Set();
  state.gameOver = false;
  state.roundNum = 1;
  state.newRound = true;
  state.statusMsg = `${PLAYER_NAMES[firstPlayer]} có 3♠, đánh trước`;

  // Reset AI context for new game
  if (window.AI) {
    window.AI.reset();
    window.AI.updateContext({ handSizes: [13, 13, 13, 13] });
  }

  stopTimer();
  renderGame(state);

  if (firstPlayer === 0) {
    startTimer();
  } else {
    setTimeout(aiPlay, 1000);
  }
}

// Initialize
function init() {
  const g = document.getElementById('game');
  g.innerHTML = `
    <div class="overlay">
      <div class="menu-box">
        <h1>TIẾN LÊN</h1>
        <p>Game bài Tiến Lên Miền Nam</p>
        <div class="diff-label">Chọn độ khó</div>
        <div class="difficulty-selector">
          <button class="diff-btn" id="diff-easy" onclick="setDifficulty('easy')">Easy</button>
          <button class="diff-btn active medium" id="diff-medium" onclick="setDifficulty('medium')">Medium</button>
          <button class="diff-btn" id="diff-hard" onclick="setDifficulty('hard')">Hard</button>
        </div>
        <button class="btn-start" onclick="startGame()">Chơi Ngay</button>
      </div>
    </div>
  `;
  // Set initial difficulty indicator
  updateDifficultyUI();
}

init();
