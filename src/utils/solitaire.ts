import {
  Card,
  Suit,
  CardColor,
  FoundationPiles,
  TableauPiles,
  GameState,
  MoveHint,
  AiAnalysis,
} from '../types/solitaire';

export const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<Suit, CardColor> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

export function getCardLabel(value: number): string {
  switch (value) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return value.toString();
  }
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
        color: SUIT_COLORS[suit],
        faceUp: false,
      });
    }
  }
  return deck;
}

export function shuffleDeck(cards: Card[]): Card[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function createInitialGame(drawCount: 1 | 3 = 1): GameState {
  const shuffled = shuffleDeck(createDeck());
  const tableau: TableauPiles = [[], [], [], [], [], [], []];

  let cardIndex = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...shuffled[cardIndex++] };
      card.faceUp = row === col; // Only the top card in each column is face up
      tableau[col].push(card);
    }
  }

  const stock: Card[] = shuffled.slice(cardIndex).map(c => ({ ...c, faceUp: false }));

  const foundations: FoundationPiles = {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  };

  return {
    stock,
    waste: [],
    foundations,
    tableau,
    score: 0,
    moves: 0,
    timeSeconds: 0,
    isWon: false,
    drawCount,
  };
}

export function createSimulatedWonGame(): GameState {
  const foundations: FoundationPiles = {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  };

  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      foundations[suit].push({
        id: `${suit}-${value}`,
        suit,
        value,
        color: SUIT_COLORS[suit],
        faceUp: true,
      });
    }
  }

  return {
    stock: [],
    waste: [],
    foundations,
    tableau: [[], [], [], [], [], [], []],
    score: 2850,
    moves: 94,
    timeSeconds: 142,
    isWon: true,
    drawCount: 1,
  };
}

export function canMoveToFoundation(card: Card, foundationCards: Card[]): boolean {
  if (foundationCards.length === 0) {
    return card.value === 1; // Must be Ace
  }
  const top = foundationCards[foundationCards.length - 1];
  return top.suit === card.suit && card.value === top.value + 1;
}

export function canMoveToTableau(cardsToMove: Card[], targetColumn: Card[]): boolean {
  if (cardsToMove.length === 0) return false;
  const bottomMovingCard = cardsToMove[0];

  if (targetColumn.length === 0) {
    // Only Kings (value 13) can go to empty columns
    return bottomMovingCard.value === 13;
  }

  const topTargetCard = targetColumn[targetColumn.length - 1];
  if (!topTargetCard.faceUp) return false;

  // Opposite color and descending by 1
  return (
    bottomMovingCard.color !== topTargetCard.color &&
    bottomMovingCard.value === topTargetCard.value - 1
  );
}

export function checkVictory(foundations: FoundationPiles): boolean {
  return SUITS.every(suit => foundations[suit].length === 13);
}

export function canAutoSolve(tableau: TableauPiles, stock: Card[], waste: Card[]): boolean {
  if (stock.length > 0 || waste.length > 0) return false;
  return tableau.every(col => col.every(card => card.faceUp));
}

export function findNextAutoMove(
  gameState: GameState
): { card: Card; target: 'foundation' | 'tableau'; targetCol?: number; source: 'waste' | 'tableau'; sourceCol?: number } | null {
  // 1. Check Waste to Foundation
  if (gameState.waste.length > 0) {
    const card = gameState.waste[gameState.waste.length - 1];
    if (canMoveToFoundation(card, gameState.foundations[card.suit])) {
      return { card, target: 'foundation', source: 'waste' };
    }
  }

  // 2. Check Tableau to Foundation
  for (let c = 0; c < 7; c++) {
    const col = gameState.tableau[c];
    if (col.length > 0) {
      const card = col[col.length - 1];
      if (card.faceUp && canMoveToFoundation(card, gameState.foundations[card.suit])) {
        return { card, target: 'foundation', source: 'tableau', sourceCol: c };
      }
    }
  }

  return null;
}

export function findHint(gameState: GameState): MoveHint | null {
  // 1. Waste to Foundation
  if (gameState.waste.length > 0) {
    const card = gameState.waste[gameState.waste.length - 1];
    if (canMoveToFoundation(card, gameState.foundations[card.suit])) {
      return {
        cardId: card.id,
        from: 'Waste Buffer',
        to: `${SUIT_SYMBOLS[card.suit]} Foundation Node`,
        description: `Transfer [${getCardLabel(card.value)}${SUIT_SYMBOLS[card.suit]}] to Foundation Matrix`,
      };
    }
  }

  // 2. Tableau to Foundation
  for (let c = 0; c < 7; c++) {
    const col = gameState.tableau[c];
    if (col.length > 0) {
      const card = col[col.length - 1];
      if (card.faceUp && canMoveToFoundation(card, gameState.foundations[card.suit])) {
        return {
          cardId: card.id,
          from: `Lane ${c + 1}`,
          to: `${SUIT_SYMBOLS[card.suit]} Foundation Node`,
          description: `Lock [${getCardLabel(card.value)}${SUIT_SYMBOLS[card.suit]}] into Foundation Matrix`,
        };
      }
    }
  }

  // 3. Tableau to Tableau (prioritize revealing hidden nodes)
  for (let fromCol = 0; fromCol < 7; fromCol++) {
    const col = gameState.tableau[fromCol];
    const firstFaceUpIdx = col.findIndex(c => c.faceUp);
    if (firstFaceUpIdx === -1) continue;

    for (let cardIdx = firstFaceUpIdx; cardIdx < col.length; cardIdx++) {
      const movingCards = col.slice(cardIdx);
      const movingCard = movingCards[0];

      // Avoid redundant King move
      if (cardIdx === 0 && movingCard.value === 13) continue;

      for (let toCol = 0; toCol < 7; toCol++) {
        if (toCol === fromCol) continue;
        const targetCol = gameState.tableau[toCol];

        if (canMoveToTableau(movingCards, targetCol)) {
          const revealsCard = cardIdx > 0 && !col[cardIdx - 1].faceUp;
          return {
            cardId: movingCard.id,
            from: `Lane ${fromCol + 1}`,
            to: `Lane ${toCol + 1}`,
            description: revealsCard
              ? `Route [${getCardLabel(movingCard.value)}${SUIT_SYMBOLS[movingCard.suit]}] to Lane ${toCol + 1} (Unlocks Hidden Node)`
              : `Route [${getCardLabel(movingCard.value)}${SUIT_SYMBOLS[movingCard.suit]}] to Lane ${toCol + 1}`,
          };
        }
      }
    }
  }

  // 4. Waste to Tableau
  if (gameState.waste.length > 0) {
    const card = gameState.waste[gameState.waste.length - 1];
    for (let toCol = 0; toCol < 7; toCol++) {
      const targetCol = gameState.tableau[toCol];
      if (canMoveToTableau([card], targetCol)) {
        return {
          cardId: card.id,
          from: 'Waste Buffer',
          to: `Lane ${toCol + 1}`,
          description: `Deploy [${getCardLabel(card.value)}${SUIT_SYMBOLS[card.suit]}] to Lane ${toCol + 1}`,
        };
      }
    }
  }

  // 5. Stock draw recommendation
  if (gameState.stock.length > 0 || gameState.waste.length > 0) {
    return {
      cardId: 'stock',
      from: 'Quantum Stock',
      to: 'Waste Buffer',
      description: gameState.stock.length > 0 ? 'Cycle Quantum Stock for new node' : 'Recycle Waste Buffer into Quantum Stock',
    };
  }

  return null;
}

export function calculateSolveProbability(gameState: GameState): number {
  if (gameState.isWon) return 100;

  let totalFoundation = 0;
  for (const suit of SUITS) {
    totalFoundation += gameState.foundations[suit].length;
  }

  let totalFaceUpTableau = 0;
  let totalCardsInTableau = 0;
  let emptyLanes = 0;

  for (const col of gameState.tableau) {
    totalCardsInTableau += col.length;
    if (col.length === 0) {
      emptyLanes++;
    } else {
      totalFaceUpTableau += col.filter(c => c.faceUp).length;
    }
  }

  // Baseline 25% + Foundation progress (up to 45%) + Face-up progress (up to 20%) + empty lanes (up to 10%)
  const foundationRatio = totalFoundation / 52;
  const faceUpRatio = totalCardsInTableau > 0 ? totalFaceUpTableau / 28 : 1;
  const laneBonus = emptyLanes * 2.5;

  let prob = 22 + foundationRatio * 45 + faceUpRatio * 25 + laneBonus;
  if (canAutoSolve(gameState.tableau, gameState.stock, gameState.waste)) {
    prob = 99.8;
  }

  return Math.min(99.9, Math.max(15, Math.round(prob * 10) / 10));
}

export function getAiStrategicAnalysis(gameState: GameState): AiAnalysis {
  const probability = calculateSolveProbability(gameState);
  const bestMove = findHint(gameState);

  let status = 'NEURAL COGNITION: ACTIVE';
  let neuralConfidence = '94.2%';
  let advice = 'Scanning quantum deck matrices for optimal branch factor...';

  if (gameState.isWon) {
    status = 'MISSION ACCOMPLISHED // ZERO DEFECTS';
    neuralConfidence = '100%';
    advice = 'All 52 quantum nodes successfully aligned in Foundation Matrix.';
  } else if (canAutoSolve(gameState.tableau, gameState.stock, gameState.waste)) {
    status = 'AUTONOMOUS SOLVE CONFIRMED';
    neuralConfidence = '99.9%';
    advice = 'All nodes exposed. Neural Auto-Pilot can execute complete solve sequence.';
  } else if (bestMove) {
    if (bestMove.to.includes('Foundation')) {
      status = 'HIGH VALUE EXECUTABLE';
      neuralConfidence = '98.5%';
      advice = `Optimal move: ${bestMove.description}. Increases matrix stability.`;
    } else if (bestMove.description.includes('Unlocks Hidden Node')) {
      status = 'STRATEGIC UNLOCK DETECTED';
      neuralConfidence = '96.1%';
      advice = `High priority: ${bestMove.description}. Uncovers encrypted node.`;
    } else {
      status = 'PATHWAY OPTIMIZATION';
      neuralConfidence = `${(80 + Math.random() * 15).toFixed(1)}%`;
      advice = `Recommended step: ${bestMove.description}.`;
    }
  } else {
    status = 'DEADLOCK WARNING';
    neuralConfidence = '62.0%';
    advice = 'No immediate legal paths found. Cycle Quantum Stock or undo previous routing.';
  }

  return {
    probability,
    neuralConfidence,
    status,
    advice,
    bestMove,
  };
}
