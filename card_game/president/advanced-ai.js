// ===== ADVANCED AI - Tiến Lên =====
(function() {
  'use strict';

  // ===== DEPENDENCIES (from global scope - game-engine.js, helpers.js) =====
  const { COMBO, cardValue, detectCombo, canBeat } = window;
  const { groupByRank, findStraights, sortHand } = window;

  // ===== CONSTANTS =====
  const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  const RANK_VALUES = { '3':0,'4':1,'5':2,'6':3,'7':4,'8':5,'9':6,'10':7,'J':8,'Q':9,'K':10,'A':11,'2':12 };

  // ===== DIFFICULTY LEVELS =====
  const DIFFICULTY = {
    EASY: 'easy',       // Bot cũ: đánh yếu nhất
    MEDIUM: 'medium',   // Có hand classification + shouldPass
    HARD: 'hard'        // Thêm card counting + danger assessment
  };

  // ===== AI STATE (self-contained, reads from window.gameState if available) =====
  let currentDifficulty = DIFFICULTY.MEDIUM;

  // Game context tracking (for Hard mode)
  let gameContext = {
    playedCards: new Set(),
    handSizes: [13, 13, 13, 13],
    currentPlayer: 0,
    players: [] // [{name, handSize, isBot}]
  };

  // ===== HELPER FUNCTIONS =====

  /**
   * Build AI context from game state
   * @param {Object} state - game-controller state (if available)
   * @returns {Object} context for AI decision making
   */
  function buildAIContext(state) {
    if (!state) return null;

    const ctx = {
      playedCards: gameContext.playedCards,
      handSizes: [...gameContext.handSizes],
      currentPlayer: state.currentPlayer || 0,
      players: gameContext.players
    };

    // Calculate unknown cards count
    ctx.unknownCards = 52 - gameContext.playedCards.size;

    // Danger assessment: find most dangerous opponent
    ctx.minOpponentCards = Math.min(...gameContext.handSizes.filter((_, i) => i !== state.currentPlayer));
    ctx.dangerPlayer = gameContext.handSizes.indexOf(ctx.minOpponentCards);
    ctx.isDangerous = ctx.minOpponentCards <= 3;

    return ctx;
  }

  /**
   * Count remaining cards of a rank in game
   */
  function countRankRemaining(rank) {
    const rv = RANK_VALUES[rank];
    let count = 4; // 4 suits per rank
    for (const card of gameContext.playedCards) {
      if (RANK_VALUES[card.rank] === rv) count--;
    }
    return count;
  }

  // ===== COMBO FINDING =====

  /**
   * Find all combos that can beat lastCombo
   */
  function findBeatingCombos(hand, lastCombo) {
    const results = [];

    if (lastCombo.type === COMBO.SINGLE) {
      for (const c of hand) {
        if (cardValue(c) > lastCombo.high) {
          results.push({ type: COMBO.SINGLE, cards: [c], high: cardValue(c) });
        }
      }
    } else if (lastCombo.type === COMBO.PAIR) {
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

  // ===== HAND CLASSIFICATION (Phase 2) =====

  /**
   * Classify hand into isolated cards and combos
   */
  function classifyHand(hand) {
    const groups = groupByRank(hand);
    const usedInCombo = new Set();

    // Find pairs, triples, fours
    const pairs = [];
    const triples = [];
    const fours = [];

    for (const [rank, cards] of Object.entries(groups)) {
      const count = cards.length;
      const sorted = cards.sort((a, b) => cardValue(a) - cardValue(b));
      if (count >= 4) {
        fours.push({ rank, cards: sorted });
        sorted.forEach(c => usedInCombo.add(c)); // all 4 used
      } else if (count >= 3) {
        triples.push({ rank, cards: sorted.slice(0, 3) });
        sorted.slice(0, 3).forEach(c => usedInCombo.add(c));
      } else if (count >= 2) {
        pairs.push({ rank, cards: sorted.slice(0, 2) });
        sorted.slice(0, 2).forEach(c => usedInCombo.add(c));
      }
      // count === 1: isolated, don't mark
    }

    // Find straights
    const straights = findStraights(hand, 3).map(s => ({
      cards: s,
      high: cardValue(s[s.length - 1]),
      len: s.length
    }));

    // Mark cards used in straights
    for (const s of straights) {
      for (const c of s.cards) usedInCombo.add(c);
    }

    // Isolated = not used in any combo
    const isolated = hand.filter(c => !usedInCombo.has(c));

    return {
      isolated,
      pairs,
      triples,
      fours,
      straights: straights.sort((a, b) => a.high - b.high),
      totalCards: hand.length
    };
  }

  /**
   * Score a combo for selection (lower = better to play)
   */
  function scoreCombo(combo, hand, ctx) {
    let score = combo.high; // Base: prefer weaker combos

    const classified = classifyHand(hand);

    // Penalty for using 2s (high value cards)
    const hasTwo = combo.cards.some(c => RANK_VALUES[c.rank] === 12);
    if (hasTwo) score += 200;

    // Penalty for using fours
    if (combo.type === COMBO.FOUR) score += 300;

    // Bonus for clearing isolated cards
    const comboCards = new Set(combo.cards.map(c => `${c.rank}${c.suit}`));
    const clearsIsolated = combo.cards.filter(c => classified.isolated.some(i => i.rank === c.rank && i.suit === c.suit)).length;
    score -= clearsIsolated * 50;

    // Bonus for short straights (3-4 cards) vs long straights
    if (combo.type === COMBO.STRAIGHT) {
      score -= (10 - combo.len) * 30; // Prefer shorter straights
    }

    // Danger bonus (from Hard mode context)
    if (ctx && ctx.isDangerous) {
      score -= 100; // More willing to spend resources
    }

    return score;
  }

  // ===== SHOULD PASS LOGIC =====

  /**
   * Decide if AI should pass instead of beating lastCombo
   */
  function shouldPass(hand, lastCombo, ctx) {
    // No combo to beat = can't pass
    if (!lastCombo) return false;

    const candidates = findBeatingCombos(hand, lastCombo);
    if (candidates.length === 0) return true; // Can't beat anyway

    // HARD: Danger assessment
    if (ctx && ctx.isDangerous) {
      return false; // MUST block dangerous opponent
    }

    // MEDIUM: Check if beating is "expensive"
    const weakest = candidates.reduce((min, c) => scoreCombo(c, hand, ctx) < scoreCombo(min, hand, ctx) ? c : min);
    const weakestScore = scoreCombo(weakest, hand, ctx);

    // Pass if weakest combo is "expensive" (high score) and opponent not dangerous
    if (weakestScore > 150 && (!ctx || ctx.minOpponentCards > 5)) {
      return true;
    }

    return false;
  }

  // ===== SELECTION STRATEGIES =====

  /**
   * Select best cards to start a new round (Easy mode: lowest single)
   */
  function selectBestStartingHand(hand) {
    const sorted = sortHand(hand);
    return [sorted[0]]; // Play lowest single card
  }

  /**
   * Select weakest valid combo to play (Easy mode)
   */
  function selectWeakestValidCombo(hand, lastCombo) {
    const candidates = findBeatingCombos(hand, lastCombo);
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.high - b.high);
    return candidates[0].cards;
  }

  /**
   * Select best combo using scoring system (Medium/Hard mode)
   */
  function selectSmartCombo(hand, lastCombo, ctx) {
    const candidates = findBeatingCombos(hand, lastCombo);
    if (candidates.length === 0) return null;

    // Score all candidates
    candidates.forEach(c => {
      c.score = scoreCombo(c, hand, ctx);
    });

    // Sort by score (lowest = best)
    candidates.sort((a, b) => a.score - b.score);
    return candidates[0].cards;
  }

  /**
   * Decide play style based on hand and context
   */
  function decidePlayStyle(hand, lastCombo, isNewRound, ctx) {
    // Easy: always use weakest valid
    if (currentDifficulty === DIFFICULTY.EASY) {
      return isNewRound ? 'start' : 'weakest';
    }

    // Medium/Hard: use smart selection
    if (isNewRound || !lastCombo) {
      return 'smart-start';
    }

    return 'smart-beat';
  }

  // ===== MAIN ENTRY POINT =====

  /**
   * Main AI selection function
   * @param {Array} hand - current hand of cards
   * @param {Object} lastCombo - combo on table to beat (or null)
   * @param {boolean} isNewRound - true if starting new round
   * @param {Object} state - optional game state for context
   * @returns {Array|null} selected cards to play, or null to pass
   */
  function advancedAiSelectCards(hand, lastCombo, isNewRound, state) {
    // Build context for Medium/Hard modes
    const ctx = buildAIContext(state);

    // === RULE: First move of the whole game must include 3♠ ===
    const isFirstMove = isNewRound && !lastCombo && state && state.roundNum === 1;
    if (isFirstMove) {
      const threeSpade = hand.find(c => c.rank === '3' && c.suit === '♠');
      if (threeSpade) {
        // Try to find a valid combo containing 3♠
        const threeIdx = hand.indexOf(threeSpade);
        const groupLabels = window.detectComboGroups ? window.detectComboGroups(hand) : [];
        const label = groupLabels[threeIdx];
        if (label) {
          const groupIndices = groupLabels.map((lbl, i) => lbl === label ? i : -1).filter(i => i >= 0);
          const groupCards = groupIndices.map(i => hand[i]);
          const combo = detectCombo(groupCards);
          if (combo) return groupCards;
        }
        return [threeSpade]; // fallback: play 3♠ alone
      }
    }

    const playStyle = decidePlayStyle(hand, lastCombo, isNewRound, ctx);

    switch (playStyle) {
      case 'start':
      case 'weakest':
        return isNewRound || !lastCombo
          ? selectBestStartingHand(hand)
          : selectWeakestValidCombo(hand, lastCombo);

      case 'smart-start': {
        // Smart start: prefer playing isolated cards
        const classified = classifyHand(hand);
        if (classified.isolated.length > 0) {
          // Play lowest isolated card
          const sorted = sortHand(classified.isolated);
          return [sorted[0]];
        }
        // No isolated, play weakest pair/triple/straight
        if (classified.pairs.length > 0) {
          return classified.pairs[0].cards;
        }
        if (classified.straights.length > 0) {
          return classified.straights[0].cards;
        }
        return [sortHand(hand)[0]];
      }

      case 'smart-beat': {
        // Check if should pass
        if (shouldPass(hand, lastCombo, ctx)) {
          return null;
        }
        return selectSmartCombo(hand, lastCombo, ctx);
      }

      default:
        return selectWeakestValidCombo(hand, lastCombo);
    }
  }

  // ===== PUBLIC API =====

  /**
   * Set AI difficulty level
   */
  function setDifficulty(level) {
    if (Object.values(DIFFICULTY).includes(level)) {
      currentDifficulty = level;
      console.log(`[AI] Difficulty set to: ${level}`);
    } else {
      console.warn(`[AI] Unknown difficulty: ${level}. Available: ${Object.values(DIFFICULTY).join(', ')}`);
    }
  }

  /**
   * Get current difficulty
   */
  function getDifficulty() {
    return currentDifficulty;
  }

  /**
   * Update game context (called by game-controller)
   */
  function updateContext(data) {
    if (data.playedCards) {
      for (const card of data.playedCards) {
        gameContext.playedCards.add(card);
      }
    }
    if (data.handSizes) {
      gameContext.handSizes = [...data.handSizes];
    }
    if (data.currentPlayer !== undefined) {
      gameContext.currentPlayer = data.currentPlayer;
    }
    if (data.players) {
      gameContext.players = [...data.players];
    }
  }

  /**
   * Reset AI state for new game
   */
  function reset() {
    gameContext = {
      playedCards: new Set(),
      handSizes: [13, 13, 13, 13],
      currentPlayer: 0,
      players: []
    };
  }

  // Export to window
  window.AI = {
    selectCards: advancedAiSelectCards,
    setDifficulty,
    getDifficulty,
    updateContext,
    reset,
    DIFFICULTY
  };

  console.log('[AI] Advanced AI loaded. Difficulty:', currentDifficulty);

})();
