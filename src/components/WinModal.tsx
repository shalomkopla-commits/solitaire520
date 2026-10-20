'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sounds';

interface WinModalProps {
  score: number;
  moves: number;
  timeSeconds: number;
  onPlayAgain: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  score,
  moves,
  timeSeconds,
  onPlayAgain,
}) => {
  useEffect(() => {
    sounds.playWinFanfare();

    // Multi-stage cyber neon confetti celebration
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }

      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 80,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#00f0ff', '#b026ff', '#00ff66', '#ff0055', '#ffffff'],
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="win-modal-overlay" className="cyber-overlay">
      <div className="cyber-modal-card">
        <div className="cyber-badge-pulse">
          <span className="cyber-icon">⚡</span>
          <span>NEURAL SYNC 100%</span>
        </div>

        <h2 className="cyber-win-title">QUANTUM CONVERGENCE</h2>
        <p className="cyber-win-subtitle">
          All 52 Quantum Nodes successfully synchronized into the Foundation Matrix.
        </p>

        <div className="cyber-stats-grid">
          <div className="cyber-stat-box">
            <div className="stat-label">NEURAL SCORE</div>
            <div className="stat-val cyber-cyan">{score}</div>
          </div>
          <div className="cyber-stat-box">
            <div className="stat-label">ROUTING OPS</div>
            <div className="stat-val cyber-violet">{moves}</div>
          </div>
          <div className="cyber-stat-box">
            <div className="stat-label">EXECUTION TIME</div>
            <div className="stat-val cyber-green">{formatTime(timeSeconds)}</div>
          </div>
        </div>

        <div className="cyber-ai-congrats">
          <span className="copilot-dot" />
          <span>AI Core Assessment: Flawless algorithmic strategy executed.</span>
        </div>

        <button
          id="btn-play-again"
          className="cyber-btn cyber-btn-primary"
          style={{ width: '100%', marginTop: '20px' }}
          onClick={onPlayAgain}
        >
          <span>INITIALIZE NEW SIMULATION</span>
          <span className="btn-glow" />
        </button>
      </div>
    </div>
  );
};
