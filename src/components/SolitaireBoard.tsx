'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Suit, GameState, DragSource, MoveHint } from '../types/solitaire';
import {
  SUITS,
  SUIT_SYMBOLS,
  createInitialGame,
  createSimulatedWonGame,
  canMoveToFoundation,
  canMoveToTableau,
  checkVictory,
  canAutoSolve,
  findNextAutoMove,
  findHint,
  getAiStrategicAnalysis,
} from '../utils/solitaire';
import { sounds } from '../utils/sounds';
import { CardView } from './CardView';
import { WinModal } from './WinModal';

export const SolitaireBoard: React.FC = () => {
  const [game, setGame] = useState<GameState>(() => createInitialGame(1));
  const [history, setHistory] = useState<GameState[]>([]);
  const [selectedCards, setSelectedCards] = useState<{ source: DragSource; cards: Card[] } | null>(null);
  const [activeHint, setActiveHint] = useState<MoveHint | null>(null);
  const [isAutoSolving, setIsAutoSolving] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [draggedData, setDraggedData] = useState<{ source: DragSource; cards: Card[] } | null>(null);
  const [aiScanActive, setAiScanActive] = useState<boolean>(false);

  // Background Canvas Ref for Cyber Matrix / Neural Circuit Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync sound manager
  useEffect(() => {
    sounds.enabled = soundOn;
  }, [soundOn]);

  // Dynamic AI Strategic Analysis
  const aiAnalysis = useMemo(() => {
    return getAiStrategicAnalysis(game);
  }, [game]);

  // Timer interval
  useEffect(() => {
    if (game.isWon) return;
    const timer = setInterval(() => {
      setGame(prev => ({
        ...prev,
        timeSeconds: prev.timeSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [game.isWon]);

  // Ambient Cyber Grid / Neural Matrix particle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number }> = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle connections (neural synapses)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;
        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p1.alpha * 0.7})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(176, 38, 255, ${(1 - dist / 120) * 0.15})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Save state to undo history
  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-30), JSON.parse(JSON.stringify(game))]);
  }, [game]);

  // Stock Draw / Recycle Handler
  const handleStockClick = () => {
    setActiveHint(null);
    setSelectedCards(null);
    pushHistory();

    if (game.stock.length > 0) {
      sounds.playCardDeal();
      setGame(prev => {
        const newStock = [...prev.stock];
        const newWaste = [...prev.waste];
        const count = Math.min(prev.drawCount, newStock.length);

        for (let i = 0; i < count; i++) {
          const card = newStock.pop()!;
          card.faceUp = true;
          newWaste.push(card);
        }

        return {
          ...prev,
          stock: newStock,
          waste: newWaste,
          moves: prev.moves + 1,
        };
      });
    } else if (game.waste.length > 0) {
      sounds.playCardFlip();
      setGame(prev => {
        const recycledStock = [...prev.waste].reverse().map(c => ({ ...c, faceUp: false }));
        return {
          ...prev,
          stock: recycledStock,
          waste: [],
          moves: prev.moves + 1,
        };
      });
    }
  };

  // Move card to Foundation
  const executeMoveToFoundation = (cardsToMove: Card[], targetSuit: Suit, source: DragSource): boolean => {
    if (cardsToMove.length !== 1) return false;
    const card = cardsToMove[0];

    if (!canMoveToFoundation(card, game.foundations[targetSuit])) {
      return false;
    }

    pushHistory();
    sounds.playFoundationSuccess();

    setGame(prev => {
      const nextFoundations = { ...prev.foundations };
      nextFoundations[targetSuit] = [...nextFoundations[targetSuit], card];

      let nextWaste = [...prev.waste];
      const nextTableau = prev.tableau.map(col => [...col]);

      if (source.type === 'waste') {
        nextWaste.pop();
      } else if (source.type === 'tableau') {
        const col = nextTableau[source.colIndex];
        col.pop();
        if (col.length > 0 && !col[col.length - 1].faceUp) {
          col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
          sounds.playCardFlip();
        }
      }

      const isWon = checkVictory(nextFoundations);
      return {
        ...prev,
        foundations: nextFoundations,
        waste: nextWaste,
        tableau: nextTableau,
        score: prev.score + 10,
        moves: prev.moves + 1,
        isWon,
      };
    });

    setSelectedCards(null);
    setActiveHint(null);
    return true;
  };

  // Move cards to Tableau column
  const executeMoveToTableau = (cardsToMove: Card[], targetColIdx: number, source: DragSource): boolean => {
    if (cardsToMove.length === 0) return false;

    // Check if moving to same column
    if (source.type === 'tableau' && source.colIndex === targetColIdx) {
      return false;
    }

    const targetColumn = game.tableau[targetColIdx];
    if (!canMoveToTableau(cardsToMove, targetColumn)) {
      sounds.playError();
      return false;
    }

    pushHistory();
    sounds.playCardSnap();

    setGame(prev => {
      let nextWaste = [...prev.waste];
      const nextFoundations = { ...prev.foundations };
      const nextTableau = prev.tableau.map(col => [...col]);

      if (source.type === 'waste') {
        nextWaste.pop();
      } else if (source.type === 'foundation') {
        nextFoundations[source.suit].pop();
      } else if (source.type === 'tableau') {
        const sourceCol = nextTableau[source.colIndex];
        sourceCol.splice(source.cardIndex, cardsToMove.length);
        if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
          sourceCol[sourceCol.length - 1] = { ...sourceCol[sourceCol.length - 1], faceUp: true };
          sounds.playCardFlip();
        }
      }

      nextTableau[targetColIdx] = [...nextTableau[targetColIdx], ...cardsToMove];

      return {
        ...prev,
        waste: nextWaste,
        foundations: nextFoundations,
        tableau: nextTableau,
        score: prev.score + (source.type === 'waste' ? 5 : 3),
        moves: prev.moves + 1,
      };
    });

    setSelectedCards(null);
    setActiveHint(null);
    return true;
  };

  // Click-To-Move / Auto-Move single card
  const handleCardAutoMove = (card: Card, source: DragSource) => {
    if (!card.faceUp) return;

    // 1. Try Foundation first
    if (canMoveToFoundation(card, game.foundations[card.suit])) {
      executeMoveToFoundation([card], card.suit, source);
      return;
    }

    // 2. Try Tableau columns
    let cardsToMove = [card];
    if (source.type === 'tableau') {
      const col = game.tableau[source.colIndex];
      cardsToMove = col.slice(source.cardIndex);
    }

    for (let c = 0; c < 7; c++) {
      if (source.type === 'tableau' && source.colIndex === c) continue;
      if (canMoveToTableau(cardsToMove, game.tableau[c])) {
        executeMoveToTableau(cardsToMove, c, source);
        return;
      }
    }

    sounds.playError();
  };

  // AI Copilot Smart Hint Trigger
  const triggerAiHint = () => {
    sounds.playAiScan();
    setAiScanActive(true);
    setTimeout(() => setAiScanActive(false), 800);

    const hint = findHint(game);
    if (hint) {
      setActiveHint(hint);
    }
  };

  // Execute the AI recommended move directly
  const executeAiSuggestedMove = () => {
    if (!aiAnalysis.bestMove) return;
    const move = aiAnalysis.bestMove;

    if (move.cardId === 'stock') {
      handleStockClick();
      return;
    }

    // Look in waste
    if (game.waste.length > 0 && game.waste[game.waste.length - 1].id === move.cardId) {
      handleCardAutoMove(game.waste[game.waste.length - 1], { type: 'waste' });
      return;
    }

    // Look in tableau
    for (let c = 0; c < 7; c++) {
      const col = game.tableau[c];
      const cardIdx = col.findIndex(card => card.id === move.cardId);
      if (cardIdx !== -1) {
        handleCardAutoMove(col[cardIdx], { type: 'tableau', colIndex: c, cardIndex: cardIdx });
        return;
      }
    }
  };

  // Auto-Solve loop
  const triggerAutoSolve = () => {
    setIsAutoSolving(true);
  };

  useEffect(() => {
    if (!isAutoSolving) return;

    const nextMove = findNextAutoMove(game);
    if (!nextMove) {
      setIsAutoSolving(false);
      return;
    }

    const timer = setTimeout(() => {
      if (nextMove.target === 'foundation') {
        const source: DragSource =
          nextMove.source === 'waste'
            ? { type: 'waste' }
            : { type: 'tableau', colIndex: nextMove.sourceCol!, cardIndex: game.tableau[nextMove.sourceCol!].length - 1 };
        executeMoveToFoundation([nextMove.card], nextMove.card.suit, source);
      }
    }, 140);

    return () => clearTimeout(timer);
  }, [isAutoSolving, game]);

  // Undo Move
  const handleUndo = () => {
    if (history.length === 0) return;
    sounds.playCardFlip();
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setGame(previous);
    setSelectedCards(null);
    setActiveHint(null);
  };

  // New Game
  const handleNewGame = () => {
    sounds.playCardDeal();
    setHistory([]);
    setSelectedCards(null);
    setActiveHint(null);
    setIsAutoSolving(false);
    setGame(createInitialGame(game.drawCount));
  };

  // Test Victory Simulation
  const handleSimulateWin = () => {
    sounds.playWinFanfare();
    setGame(createSimulatedWonGame());
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="cyber-terminal-container">
      {/* Dynamic Background Canvas for Neural Circuits */}
      <canvas ref={canvasRef} className="neural-circuit-canvas" />

      {/* Cyberpunk Scanline Effect */}
      <div className="cyber-scanlines" />

      {/* Top AI HUD Bar */}
      <header className="cyber-hud-header">
        <div className="cyber-brand">
          <div className="cyber-logo-icon">
            <span className="core-atom">◈</span>
          </div>
          <div className="brand-text">
            <h1 className="cyber-title">
              NEURAL SOLITAIRE <span className="version-tag">AI CORE v3.0</span>
            </h1>
            <div className="neural-status-indicator">
              <span className={`status-led ${aiScanActive ? 'scanning' : ''}`} />
              <span className="status-text">{aiAnalysis.status}</span>
            </div>
          </div>
        </div>

        {/* Realtime Cyber Stats */}
        <div className="cyber-stats-panel">
          <div className="hud-metric">
            <span className="metric-tag">PROBABILITY</span>
            <div className="prob-bar-container">
              <div
                className="prob-bar-fill"
                style={{
                  width: `${aiAnalysis.probability}%`,
                  background:
                    aiAnalysis.probability > 70
                      ? 'linear-gradient(90deg, #00ff66, #00f0ff)'
                      : aiAnalysis.probability > 40
                      ? 'linear-gradient(90deg, #00f0ff, #b026ff)'
                      : 'linear-gradient(90deg, #ff0055, #ffb700)',
                }}
              />
              <span className="prob-number">{aiAnalysis.probability}%</span>
            </div>
          </div>

          <div className="hud-metric">
            <span className="metric-tag">SCORE</span>
            <span className="metric-val cyan-glow">{game.score}</span>
          </div>

          <div className="hud-metric">
            <span className="metric-tag">OPS</span>
            <span className="metric-val violet-glow">{game.moves}</span>
          </div>

          <div className="hud-metric">
            <span className="metric-tag">TIME</span>
            <span className="metric-val green-glow">{formatTime(game.timeSeconds)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="cyber-actions-panel">
          <button
            id="btn-ai-hint"
            className="hud-btn hud-btn-ai"
            onClick={triggerAiHint}
            title="Scan matrix for optimal neural pathway"
          >
            <span className="btn-icon">💡</span>
            <span>AI SCAN</span>
          </button>

          {canAutoSolve(game.tableau, game.stock, game.waste) && (
            <button
              id="btn-auto-solve"
              className="hud-btn hud-btn-solve animate-pulse"
              onClick={triggerAutoSolve}
            >
              <span className="btn-icon">⚡</span>
              <span>AUTO SOLVE</span>
            </button>
          )}

          <button
            id="btn-undo"
            className="hud-btn"
            disabled={history.length === 0}
            onClick={handleUndo}
            title="Rollback previous instruction"
          >
            <span className="btn-icon">↩</span>
            <span>UNDO</span>
          </button>

          <button
            id="btn-new-matrix"
            className="hud-btn hud-btn-primary"
            onClick={handleNewGame}
            title="Generate new randomized quantum seed"
          >
            <span className="btn-icon">↺</span>
            <span>NEW SEED</span>
          </button>

          <button
            id="btn-sound-toggle"
            className="hud-btn icon-only"
            onClick={() => setSoundOn(prev => !prev)}
            title={soundOn ? 'Mute Audio Synthesizer' : 'Unmute Audio Synthesizer'}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>

          <button
            id="btn-test-win"
            className="hud-btn hud-btn-test"
            onClick={handleSimulateWin}
            title="Simulate Instant AI Convergence for visual review"
          >
            🧪 SIM WIN
          </button>
        </div>
      </header>

      {/* AI Copilot Realtime Guidance Banner */}
      <div className={`ai-copilot-banner ${aiScanActive ? 'scan-pulse' : ''}`}>
        <div className="copilot-avatar">
          <span className="avatar-core">AI</span>
        </div>
        <div className="copilot-message">
          <div className="copilot-meta">
            <span className="meta-badge">NEURAL COPILOT</span>
            <span className="confidence-badge">CONFIDENCE: {aiAnalysis.neuralConfidence}</span>
          </div>
          <div className="advice-text">{aiAnalysis.advice}</div>
        </div>

        {aiAnalysis.bestMove && (
          <button
            id="btn-apply-ai-move"
            className="ai-execute-btn"
            onClick={executeAiSuggestedMove}
          >
            <span>EXECUTE AI ROUTE</span>
            <span className="btn-arrow">➔</span>
          </button>
        )}
      </div>

      {/* Main Solitaire Matrix Surface */}
      <main className="cyber-board-surface">
        {/* Upper Zone: Stock, Waste, Foundations */}
        <div className="cyber-upper-deck">
          {/* Stock & Waste Buffer */}
          <div className="stock-waste-group">
            {/* Stock Pile */}
            <div
              id="stock-pile"
              className="slot-container stock-slot"
              onClick={handleStockClick}
              title="Click to deal quantum card"
            >
              {game.stock.length > 0 ? (
                <div className="stock-counter-badge">
                  <span className="badge-num">{game.stock.length}</span>
                  <CardView card={game.stock[game.stock.length - 1]} />
                </div>
              ) : (
                <div className="cyber-empty-slot reload-slot">
                  <span className="slot-symbol">↺</span>
                  <span className="slot-text">RECYCLE</span>
                </div>
              )}
            </div>

            {/* Waste Pile */}
            <div
              id="waste-pile"
              className="slot-container waste-slot"
              onDragOver={e => e.preventDefault()}
            >
              {game.waste.length > 0 ? (
                (() => {
                  const topWaste = game.waste[game.waste.length - 1];
                  const isSelected = selectedCards?.cards[0]?.id === topWaste.id;
                  const isHint = activeHint?.cardId === topWaste.id;

                  return (
                    <CardView
                      card={topWaste}
                      isSelected={isSelected}
                      isHint={isHint}
                      onClick={() => handleCardAutoMove(topWaste, { type: 'waste' })}
                      onDoubleClick={() => handleCardAutoMove(topWaste, { type: 'waste' })}
                      onDragStart={() => {
                        setDraggedData({
                          source: { type: 'waste' },
                          cards: [topWaste],
                        });
                      }}
                    />
                  );
                })()
              ) : (
                <div className="cyber-empty-slot">
                  <span className="slot-symbol">∅</span>
                  <span className="slot-text">BUFFER</span>
                </div>
              )}
            </div>
          </div>

          {/* 4 Foundation Matrix Nodes */}
          <div className="foundations-group">
            {SUITS.map(suit => {
              const pile = game.foundations[suit];
              const topCard = pile.length > 0 ? pile[pile.length - 1] : null;

              return (
                <div
                  key={suit}
                  id={`foundation-${suit}`}
                  className={`slot-container foundation-slot suit-${suit}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedData) {
                      executeMoveToFoundation(draggedData.cards, suit, draggedData.source);
                      setDraggedData(null);
                    }
                  }}
                  onClick={() => {
                    if (selectedCards) {
                      executeMoveToFoundation(selectedCards.cards, suit, selectedCards.source);
                    }
                  }}
                >
                  {topCard ? (
                    <CardView
                      card={topCard}
                      onClick={() => {
                        // Allow taking back from foundation to tableau if selected
                        setSelectedCards({
                          source: { type: 'foundation', suit },
                          cards: [topCard],
                        });
                      }}
                    />
                  ) : (
                    <div className="cyber-empty-slot foundation-empty">
                      <span className="slot-symbol">{SUIT_SYMBOLS[suit]}</span>
                      <span className="slot-text">MATRIX</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lower Zone: 7 Tableau Cascade Lanes */}
        <div className="cyber-tableau-grid">
          {game.tableau.map((column, colIdx) => {
            return (
              <div
                key={colIdx}
                id={`tableau-lane-${colIdx}`}
                className="cyber-tableau-lane"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (draggedData) {
                    executeMoveToTableau(draggedData.cards, colIdx, draggedData.source);
                    setDraggedData(null);
                  }
                }}
                onClick={() => {
                  if (selectedCards) {
                    executeMoveToTableau(selectedCards.cards, colIdx, selectedCards.source);
                  }
                }}
              >
                {/* Empty Lane Base Placeholder */}
                {column.length === 0 && (
                  <div className="cyber-empty-slot lane-empty">
                    <span className="slot-symbol">K</span>
                    <span className="slot-text">LANE {colIdx + 1}</span>
                  </div>
                )}

                {/* Vertical Card Cascading Stack */}
                {column.map((card, cardIdx) => {
                  const isSelected = selectedCards?.cards.some(c => c.id === card.id);
                  const isHint = activeHint?.cardId === card.id;
                  const topOffset = cardIdx * (card.faceUp ? 30 : 18);

                  return (
                    <div
                      key={card.id}
                      className="tableau-card-wrapper"
                      style={{
                        top: `${topOffset}px`,
                        zIndex: cardIdx + 1,
                      }}
                    >
                      <CardView
                        card={card}
                        isSelected={isSelected}
                        isHint={isHint}
                        onClick={() => {
                          if (card.faceUp) {
                            handleCardAutoMove(card, {
                              type: 'tableau',
                              colIndex: colIdx,
                              cardIndex: cardIdx,
                            });
                          }
                        }}
                        onDoubleClick={() => {
                          if (card.faceUp) {
                            handleCardAutoMove(card, {
                              type: 'tableau',
                              colIndex: colIdx,
                              cardIndex: cardIdx,
                            });
                          }
                        }}
                        onDragStart={e => {
                          if (!card.faceUp) {
                            e.preventDefault();
                            return;
                          }
                          const movingCards = column.slice(cardIdx);
                          setDraggedData({
                            source: {
                              type: 'tableau',
                              colIndex: colIdx,
                              cardIndex: cardIdx,
                            },
                            cards: movingCards,
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </main>

      {/* Cyber Win Convergence Modal */}
      {game.isWon && (
        <WinModal
          score={game.score}
          moves={game.moves}
          timeSeconds={game.timeSeconds}
          onPlayAgain={handleNewGame}
        />
      )}
    </div>
  );
};
