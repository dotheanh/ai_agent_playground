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
