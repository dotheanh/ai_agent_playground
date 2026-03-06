// ===== TIẾN LÊN - GAME ENGINE =====
// Vietnamese card game (Tiến Lên / Thirteen)

const SUITS = ['♠', '♣', '♦', '♥'];
const SUIT_NAMES = ['spade', 'club', 'diamond', 'heart'];
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const RANK_VALUES = { '3':0,'4':1,'5':2,'6':3,'7':4,'8':5,'9':6,'10':7,'J':8,'Q':9,'K':10,'A':11,'2':12 };
const SUIT_VALUES = { '♠':0, '♣':1, '♦':2, '♥':3 };

// Card value for comparison: rank * 4 + suit
function cardValue(card) { return RANK_VALUES[card.rank] * 4 + SUIT_VALUES[card.suit]; }
function isRed(suit) { return suit === '♦' || suit === '♥'; }

// ===== COMBO TYPES =====
const COMBO = { SINGLE: 1, PAIR: 2, TRIPLE: 3, STRAIGHT: 4, FOUR: 5 };

function detectCombo(cards) {
  if (!cards.length) return null;
  const sorted = [...cards].sort((a, b) => cardValue(a) - cardValue(b));
  const n = sorted.length;
  const ranks = sorted.map(c => RANK_VALUES[c.rank]);

  if (n === 1) return { type: COMBO.SINGLE, cards: sorted, high: cardValue(sorted[0]) };
  if (n === 2 && ranks[0] === ranks[1])
    return { type: COMBO.PAIR, cards: sorted, high: cardValue(sorted[1]) };
  if (n === 3 && ranks[0] === ranks[1] && ranks[1] === ranks[2])
    return { type: COMBO.TRIPLE, cards: sorted, high: cardValue(sorted[2]) };
  if (n === 4 && ranks.every(r => r === ranks[0]))
    return { type: COMBO.FOUR, cards: sorted, high: cardValue(sorted[3]) };

  // Straight: 3+ consecutive ranks, no 2s allowed
  if (n >= 3) {
    const hasTwos = ranks.some(r => r === 12);
    const isConsecutive = ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1);
    if (!hasTwos && isConsecutive)
      return { type: COMBO.STRAIGHT, cards: sorted, high: cardValue(sorted[n - 1]), len: n };
  }
  return null;
}

function canBeat(prev, next) {
  if (!prev) return true;
  if (!next) return false;
  // Tứ quý chặt đôi 2
  if (next.type === COMBO.FOUR && prev.type === COMBO.PAIR && RANK_VALUES[prev.cards[0].rank] === 12)
    return true;
  // Same type, same length
  if (next.type !== prev.type) return false;
  if (next.type === COMBO.STRAIGHT && next.len !== prev.len) return false;
  return next.high > prev.high;
}

// ===== DECK & DEAL =====
function createDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
