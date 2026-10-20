export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';

export interface Card {
  id: string; // e.g. "hearts-1"
  suit: Suit;
  value: number; // 1 (Ace) to 13 (King)
  color: CardColor;
  faceUp: boolean;
}

export type FoundationPiles = Record<Suit, Card[]>;
export type TableauPiles = Card[][]; // 7 columns

export type DragSource =
  | { type: 'waste' }
  | { type: 'foundation'; suit: Suit }
  | { type: 'tableau'; colIndex: number; cardIndex: number };

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: FoundationPiles;
  tableau: TableauPiles;
  score: number;
  moves: number;
  timeSeconds: number;
  isWon: boolean;
  drawCount: 1 | 3;
}

export interface MoveHint {
  from: string;
  to: string;
  description: string;
  cardId: string;
}

export interface AiAnalysis {
  probability: number;
  neuralConfidence: string;
  status: string;
  advice: string;
  bestMove: MoveHint | null;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;
  bestTime: number; // in seconds
}
