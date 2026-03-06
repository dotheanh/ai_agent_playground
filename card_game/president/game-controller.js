// ===== GAME CONTROLLER =====

let state = {
  deck: [],
  hands: [[], [], [], []],
  currentPlayer: 0,
  lastPlayer: 0,          // Người đánh bài cuối cùng (thắng vòng)
  lastCombo: null,
  lastPlayedCards: [],
  passedPlayers: new Set(),
  selectedIndices: new Set(),
  gameOver: false,
  roundNum: 1,
  newRound: true,
  statusMsg: ''
};

// UI functions
function toggleSelect(idx) {
  if (state.gameOver || state.currentPlayer !== 0) return;
  if (state.selectedIndices.has(idx)) state.selectedIndices.delete(idx);
  else state.selectedIndices.add(idx);
  renderGame(state);
}

function onPlay() {
  if (state.currentPlayer !== 0 || state.gameOver) return;
  const selected = getSelectedCards();
  const combo = detectCombo(selected);
  if (!combo) { state.statusMsg = 'Chọn bài hợp lệ!'; renderGame(state); return; }
  const valid = state.newRound || canBeat(state.lastCombo, combo);
  if (!valid) { state.statusMsg = 'Không chặn được!'; renderGame(state); return; }

  // Remove from hand
  for (const c of selected) {
    const idx = state.hands[0].findIndex(hc => hc.rank === c.rank && hc.suit === c.suit);
    if (idx >= 0) state.hands[0].splice(idx, 1);
  }

  // Play cards
  state.lastPlayedCards = selected;
  state.lastCombo = combo;
  state.lastPlayer = 0;  // Player 0 is the last to play
  state.passedPlayers.clear();
  state.newRound = false;
  state.selectedIndices.clear();
  state.statusMsg = '';

  checkWin(0);
  if (!state.gameOver) {
    nextTurn();
  }
}

function onPass() {
  if (state.currentPlayer !== 0 || state.gameOver || state.newRound) return;
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
    if (state.currentPlayer !== 0) {
      setTimeout(aiPlay, 800);
    }
  } else {
    // Continue to next player
    nextTurn();
  }
}

function onSort() {
  state.hands[0] = sortHand(state.hands[0]);
  renderGame(state);
}

function getSelectedCards() {
  const cards = [];
  const sortedHand = [...state.hands[0]].sort((a, b) => cardValue(a) - cardValue(b));
  const selectedSorted = [...state.selectedIndices].sort((a, b) => a - b);
  for (const idx of selectedSorted) {
    if (idx < sortedHand.length) cards.push(sortedHand[idx]);
  }
  return cards;
}

function checkWin(player) {
  if (state.hands[player].length === 0) {
    state.gameOver = true;
    state.statusMsg = player === 0 ? '🎉 Bạn thắng!' : `${PLAYER_NAMES[player]} thắng!`;
    renderGame(state);
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
      if (lastActive !== 0) { setTimeout(aiPlay, 800); }
    }
    return;
  }

  state.currentPlayer = next;
  renderGame(state);

  if (state.currentPlayer !== 0) {
    setTimeout(aiPlay, 600 + Math.random() * 600);
  }
}

function aiPlay() {
  if (state.gameOver) return;
  const aiIdx = state.currentPlayer;
  const hand = state.hands[aiIdx];

  const selected = aiSelectCards(hand, state.lastCombo, state.newRound);

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
      if (state.currentPlayer !== 0) {
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

  state.lastPlayedCards = selected;
  state.lastCombo = detectCombo(selected);
  state.lastPlayer = aiIdx;  // Track who played last
  state.passedPlayers.clear();
  state.newRound = false;
  state.statusMsg = `${PLAYER_NAMES[aiIdx]} đánh ${selected.length} lá`;

  checkWin(aiIdx);
  if (!state.gameOver) {
    nextTurn();
  }
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

  renderGame(state);

  if (firstPlayer !== 0) {
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
        <button class="btn-start" onclick="startGame()">Chơi Ngay</button>
      </div>
    </div>
  `;
}

init();
