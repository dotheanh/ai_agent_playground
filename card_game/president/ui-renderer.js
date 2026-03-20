// ===== UI RENDERER =====

const PLAYER_NAMES = ['Bạn', 'Bot Tây', 'Bot Bắc', 'Bot Đông'];
const PLAYER_EMOJIS = ['😎', '🤖', '🧠', '👾'];

function renderCard(card, extraClass = '') {
  const color = isRed(card.suit) ? 'red' : 'black';
  return `<div class="card ${color} ${extraClass}" data-rank="${card.rank}" data-suit="${card.suit}">
    <span class="center-suit">${card.suit}</span></div>`;
}

function renderGame(state) {
  const g = document.getElementById('game');
  const isPlayerTurn = state.currentPlayer === 0 && !state.gameOver;
  const timerClass = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : '';

  g.innerHTML = `
    <div class="top-bar">
      <div class="logo">TIẾN LÊN</div>
      <div class="info">
        <span>Vòng ${state.roundNum}</span>
      </div>
    </div>

    <div class="opponents">
      ${[1, 2, 3].map(i => {
        const active = state.currentPlayer === i && !state.gameOver;
        const passed = state.passedPlayers.has(i);
        const finished = state.hands[i].length === 0;
        return `<div class="opponent ${active ? 'active' : ''} ${passed ? 'passed' : ''} ${finished ? 'finished' : ''}">
          <div class="avatar">${PLAYER_EMOJIS[i]}</div>
          <div class="name">${PLAYER_NAMES[i]}</div>
          <div class="card-count">${finished ? 'Hết bài' : state.hands[i].length + ' lá'}</div>
          <div style="margin-top:2px">${!finished ? Array(Math.min(state.hands[i].length, 6)).fill('<span class="card-back"></span>').join('') : ''}</div>
        </div>`;
      }).join('')}
    </div>

    <div class="table-center">
      <div class="table-felt"></div>
      ${isPlayerTurn ? `<div id="timer-display" class="timer-display ${timerClass}">${timeLeft}</div>` : ''}
      <div class="played-cards">
        ${state.lastPlayedCards.length > 0
          ? state.lastPlayedCards.map(c => renderCard(c)).join('')
          : '<div class="turn-indicator show">' + (state.gameOver ? '' : (state.newRound ? 'Vòng mới' : 'Chờ đánh bài...')) + '</div>'}
      </div>
      <div class="status-msg">${state.statusMsg}</div>
    </div>

    <div class="controls">
      ${isPlayerTurn ? `<div class="timer-bar"><div id="timer-fill" class="timer-fill ${timerClass}" style="width:${(timeLeft / TURN_TIME) * 100}%"></div></div>` : ''}
    </div>
    <div class="controls">
      <button class="btn btn-sort" onclick="onSort()">Sắp xếp</button>
      <button class="btn btn-hint" onclick="onHint()" ${!isPlayerTurn ? 'disabled' : ''}>Gợi ý</button>
      <button class="btn btn-play" onclick="onPlay()" ${!isPlayerTurn ? 'disabled' : ''}>Đánh</button>
      <button class="btn btn-pass${isPlayerTurn && !state.newRound ? ' can-pass' : ''}" onclick="onPass()" ${!isPlayerTurn || state.newRound ? 'disabled' : ''}>Bỏ lượt</button>
    </div>

    <div class="hand-area">
      <div class="hand" id="player-hand">
        ${renderPlayerHand(state.hands[0], state.selectedIndices)}
      </div>
    </div>
  `;

  // Attach click + drag handlers to player cards
  initHandInteractions();
}

function renderPlayerHand(hand, selectedIndices) {
  const n = hand.length;
  if (n === 0) return '';
  // Calculate card spacing for fan layout
  const maxWidth = 460;
  const cardW = 72;
  const overlap = Math.min(48, Math.max(26, (maxWidth - cardW) / (n - 1 || 1)));
  const totalWidth = cardW + (n - 1) * overlap;
  const startX = (maxWidth - totalWidth) / 2;

  // Get combo groups
  const groupLabels = detectComboGroups(hand);

  return hand.map((c, i) => {
    const sel = selectedIndices.has(i) ? 'selected' : '';
    const grp = groupLabels[i] ? 'group-' + groupLabels[i] : '';
    const x = startX + i * overlap;
    return `<div class="card ${isRed(c.suit) ? 'red' : 'black'} ${sel} ${grp}"
      data-idx="${i}" data-rank="${c.rank}" data-suit="${c.suit}"
      style="left:${x}px; z-index:${i}"
    ><span class="center-suit">${c.suit}</span></div>`;
  }).join('');
}
