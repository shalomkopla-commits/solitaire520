'use client';

import React from 'react';
import { Card } from '../types/solitaire';
import { SUIT_SYMBOLS, getCardLabel } from '../utils/solitaire';

interface CardViewProps {
  card: Card;
  isSelected?: boolean;
  isHint?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected,
  isHint,
  onClick,
  onDoubleClick,
  onDragStart,
  style,
  className = '',
}) => {
  const isRed = card.color === 'red';
  const rankLabel = getCardLabel(card.value);
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  // Face Down: Futuristic AI Neural Core / Quantum Microchip
  if (!card.faceUp) {
    return (
      <div
        id={`card-${card.id}`}
        className={`cyber-card cyber-card-back ${className}`}
        style={style}
        onClick={onClick}
      >
        <div className="chip-grid">
          <div className="chip-corner tl" />
          <div className="chip-corner tr" />
          <div className="chip-corner bl" />
          <div className="chip-corner br" />
          <div className="chip-circuits">
            <span className="circuit-line line-1" />
            <span className="circuit-line line-2" />
          </div>
          <div className="chip-core-pulse">
            <span className="pulse-dot" />
            <span className="chip-code">AI</span>
          </div>
        </div>
      </div>
    );
  }

  // Face Up: Holographic Glass Cyber Card with Neon Glow
  return (
    <div
      id={`card-${card.id}`}
      className={`cyber-card cyber-card-front ${isRed ? 'suit-plasma-red' : 'suit-cyber-cyan'} ${
        isSelected ? 'selected-glow' : ''
      } ${isHint ? 'ai-target-glow' : ''} ${className}`}
      style={style}
      draggable={true}
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Sci-fi HUD Corner Accents */}
      <div className="card-bracket tl" />
      <div className="card-bracket tr" />
      <div className="card-bracket bl" />
      <div className="card-bracket br" />

      {/* Top Left Corner */}
      <div className="cyber-corner top">
        <span className="cyber-rank">{rankLabel}</span>
        <span className="cyber-suit-glyph">{suitSymbol}</span>
      </div>

      {/* Center Holographic Pip */}
      <div className="cyber-center-hologram">
        <span className="hologram-symbol">{suitSymbol}</span>
        {card.value >= 11 && (
          <span className="court-ai-tag">
            {card.value === 11 ? 'NODE-J' : card.value === 12 ? 'CORE-Q' : 'ARCH-K'}
          </span>
        )}
      </div>

      {/* Bottom Right Corner */}
      <div className="cyber-corner bottom">
        <span className="cyber-rank">{rankLabel}</span>
        <span className="cyber-suit-glyph">{suitSymbol}</span>
      </div>
    </div>
  );
};
