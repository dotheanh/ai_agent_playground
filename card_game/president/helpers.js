// ===== HELPER FUNCTIONS =====

function groupByRank(hand) {
  const groups = {};
  for (const c of hand) {
    if (!groups[c.rank]) groups[c.rank] = [];
    groups[c.rank].push(c);
  }
  return groups;
}

function findStraights(hand, minLen = 3) {
  // Find all possible straights (consecutive ranks)
  const sorted = [...hand].filter(c => RANK_VALUES[c.rank] < 12).sort((a, b) => cardValue(a) - cardValue(b));
  const results = [];

  if (sorted.length < minLen) return results;

  // Group by rank
  const rankGroups = {};
  for (const c of sorted) {
    const rv = RANK_VALUES[c.rank];
    if (!rankGroups[rv]) rankGroups[rv] = [];
    rankGroups[rv].push(c);
  }

  // Find consecutive sequences
  const ranks = [...new Set(sorted.map(c => RANK_VALUES[c.rank]))].sort((a, b) => a - b);

  for (let start = 0; start < ranks.length; start++) {
    for (let end = start + minLen - 1; end < ranks.length; end++) {
      // Check if consecutive
      let consecutive = true;
      for (let i = start; i < end; i++) {
        if (ranks[i + 1] !== ranks[i] + 1) { consecutive = false; break; }
      }
      if (!consecutive) continue;

      // Build straight from lowest suit for each rank
      const straight = [];
      for (let r = ranks[start]; r <= ranks[end]; r++) {
        if (rankGroups[r]) straight.push(rankGroups[r][0]); // take lowest suit
      }
      if (straight.length >= minLen) results.push(straight);
    }
  }
  return results;
}

// Sort hand by value
function sortHand(hand) {
  return [...hand].sort((a, b) => cardValue(a) - cardValue(b));
}

// ===== COMBO GROUP DETECTION =====
// Detect groups of adjacent cards that form valid combos
// Returns array of group labels per card index: ['a','a','a','','b','b','b','b','b', ...]
const GROUP_LABELS = ['a', 'b', 'c', 'd', 'e'];

function detectComboGroups(hand) {
  const n = hand.length;
  if (n === 0) return [];

  const labels = new Array(n).fill('');
  const used = new Array(n).fill(false);
  let groupIdx = 0;

  // Pass 1: Find same-rank groups (pairs, triples, four-of-a-kind) among adjacent cards
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && hand[j + 1].rank === hand[i].rank) j++;
    const count = j - i + 1;
    if (count >= 2 && groupIdx < GROUP_LABELS.length) {
      const label = GROUP_LABELS[groupIdx++];
      for (let k = i; k <= j; k++) { labels[k] = label; used[k] = true; }
    }
    i = j + 1;
  }

  // Pass 2: Find straights (3+ consecutive ranks) among remaining unused adjacent cards
  i = 0;
  while (i < n) {
    if (used[i]) { i++; continue; }
    // Start a potential straight from this card
    let run = [i];
    let j = i + 1;
    while (j < n && !used[j]) {
      const prevRank = RANK_VALUES[hand[j - 1].rank];
      const currRank = RANK_VALUES[hand[j].rank];
      // Must be consecutive rank and not a "2"
      if (currRank === prevRank + 1 && currRank < 12 && prevRank < 12) {
        run.push(j);
        j++;
      } else {
        break;
      }
    }
    if (run.length >= 3 && groupIdx < GROUP_LABELS.length) {
      const label = GROUP_LABELS[groupIdx++];
      for (const idx of run) { labels[idx] = label; used[idx] = true; }
    }
    i = (run.length >= 3) ? j : i + 1;
  }

  return labels;
}
