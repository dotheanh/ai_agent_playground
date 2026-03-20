// ===== AI PLAYER LOGIC =====

function aiSelectCards(hand, lastCombo, isNewRound) {
  const sorted = [...hand].sort((a, b) => cardValue(a) - cardValue(b));

  if (isNewRound || !lastCombo) {
    // Play lowest single card to start
    return [sorted[0]];
  }

  // Try to beat the last combo
  const candidates = findBeatingCombos(sorted, lastCombo);
  if (candidates.length === 0) return null; // pass

  // Play the weakest valid combo
  candidates.sort((a, b) => a.high - b.high);
  return candidates[0].cards;
}

function findBeatingCombos(hand, lastCombo) {
  const results = [];

  if (lastCombo.type === COMBO.SINGLE) {
    for (const c of hand) {
      if (cardValue(c) > lastCombo.high) {
        results.push({ type: COMBO.SINGLE, cards: [c], high: cardValue(c) });
      }
    }
  } else if (lastCombo.type === COMBO.PAIR) {
    // Group by rank
    const groups = groupByRank(hand);
    for (const [, cards] of Object.entries(groups)) {
      if (cards.length >= 2) {
        const pair = cards.slice(0, 2).sort((a, b) => cardValue(a) - cardValue(b));
        const combo = detectCombo(pair);
        if (combo && canBeat(lastCombo, combo)) results.push(combo);
      }
    }
    // Tứ quý chặt đôi 2
    if (RANK_VALUES[lastCombo.cards[0].rank] === 12) {
      for (const [, cards] of Object.entries(groups)) {
        if (cards.length >= 4) {
          const four = cards.slice(0, 4);
          results.push({ type: COMBO.FOUR, cards: four, high: cardValue(four[3]) });
        }
      }
    }
  } else if (lastCombo.type === COMBO.TRIPLE) {
    const groups = groupByRank(hand);
    for (const [, cards] of Object.entries(groups)) {
      if (cards.length >= 3) {
        const triple = cards.slice(0, 3).sort((a, b) => cardValue(a) - cardValue(b));
        const combo = detectCombo(triple);
        if (combo && canBeat(lastCombo, combo)) results.push(combo);
      }
    }
  } else if (lastCombo.type === COMBO.STRAIGHT) {
    const len = lastCombo.len;
    const straights = findStraights(hand, len);
    for (const s of straights) {
      const combo = detectCombo(s);
      if (combo && canBeat(lastCombo, combo)) results.push(combo);
    }
  } else if (lastCombo.type === COMBO.FOUR) {
    const groups = groupByRank(hand);
    for (const [, cards] of Object.entries(groups)) {
      if (cards.length >= 4) {
        const four = cards.slice(0, 4).sort((a, b) => cardValue(a) - cardValue(b));
        const combo = detectCombo(four);
        if (combo && canBeat(lastCombo, combo)) results.push(combo);
      }
    }
  }
  return results;
}
