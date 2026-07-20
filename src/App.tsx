import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Play, 
  Pause, 
  HelpCircle,
  Trophy,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Sun,
  Moon
} from 'lucide-react';
import { playClack, playBell, playCarriageReturn, toggleMute, getMuted } from './audio';
import { getRandomTargetWordsForLevels } from './dictionary';

// Grid size
const COLS = 8;
const ROWS = 12;

// General Letter Pool for fallbacks
const LETTER_POOL = "EEEEEEEEETTTTTTTTAAAAAAAOOOOOOOIIIIIIIINNNNNNNSSSSSSSRRRRRRRHHHHHHLLLLLDDDDDCCCCUUUUUMMMMMFFAAPPGGWWYYBVKXZJQ";

function getRandomLetter(): string {
  const randomIndex = Math.floor(Math.random() * LETTER_POOL.length);
  return LETTER_POOL[randomIndex];
}

interface LevelData {
  level: number;
  targets: string[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
  char?: string;
  rotate: number;
}

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wordtris_dark_mode');
    return saved === 'true';
  });

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('wordtris_dark_mode', String(next));
      return next;
    });
    playClack(1.0);
  }, []);

  // Session levels (mixed/randomized on session start)
  const [sessionLevels, setSessionLevels] = useState<LevelData[]>(() => {
    const targets = getRandomTargetWordsForLevels();
    return targets.map((t, idx) => ({
      level: idx + 1,
      targets: t
    }));
  });

  const sessionLevelsRef = useRef<LevelData[]>(sessionLevels);
  sessionLevelsRef.current = sessionLevels;

  // Game States
  const [board, setBoard] = useState<(string | null)[][]>(() => 
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [completedTargets, setCompletedTargets] = useState<Set<string>>(new Set());
  
  const [fallingPiece, setFallingPiece] = useState<{ x: number; y: number; char: string } | null>(null);
  const [nextChar, setNextChar] = useState<string>("");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('wordtris_word_high');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAMEOVER' | 'VICTORY'>('START');
  const [muted, setMuted] = useState(() => getMuted());
  
  // Highlighting & Clearing States
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [clearingRows, setClearingRows] = useState<Set<number>>(new Set());
  const [isProcessingMatches, setIsProcessingMatches] = useState(false);
  
  // Modals / Guides
  const [showHelp, setShowHelp] = useState(false);

  // Shake Animation State
  const [shake, setShake] = useState<{ x: number[]; y: number[]; transition: { duration: number } } | null>(null);

  // Particle State
  const [particles, setParticles] = useState<Particle[]>([]);

  const triggerShake = useCallback((type: 'land' | 'hard-land' | 'clear') => {
    if (type === 'land') {
      setShake({
        x: [0, -1, 1, -0.5, 0.5, 0],
        y: [0, 1.8, -1.2, 0.8, -0.4, 0],
        transition: { duration: 0.12 }
      });
    } else if (type === 'hard-land') {
      setShake({
        x: [0, -2, 2, -1.5, 1.5, -0.5, 0.5, 0],
        y: [0, 3.5, -2.5, 1.8, -1.2, 0.8, -0.4, 0],
        transition: { duration: 0.18 }
      });
    } else if (type === 'clear') {
      setShake({
        x: [0, -3.5, 3.5, -2.5, 2.5, -1.2, 1.2, 0],
        y: [0, -4.5, 4.5, -2.8, 2.8, -1.5, 1.5, 0],
        transition: { duration: 0.28 }
      });
    }

    // Reset after transition finishes to allow consecutive shakes
    const timeoutDuration = type === 'land' ? 130 : type === 'hard-land' ? 190 : 290;
    setTimeout(() => {
      setShake(null);
    }, timeoutDuration);
  }, []);

  const triggerParticles = useCallback((matchedCells: Set<string>, boardState: (string | null)[][]) => {
    const newParticles: Particle[] = [];
    let idCounter = Date.now();

    matchedCells.forEach(cellKey => {
      const [r, c] = cellKey.split(',').map(Number);
      const char = boardState[r]?.[c] || '';
      
      // Center of this cell in percentages
      const startX = ((c + 0.5) / COLS) * 100;
      const startY = ((r + 0.5) / ROWS) * 100;

      // Generate 10 particles per cell for a rich explosion
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const distance = 30 + Math.random() * 55; // distance in percentages / pixels
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        const colors = darkMode 
          ? ['rgba(251,191,36,0.95)', 'rgba(253,224,71,0.95)', 'rgba(255,255,255,0.95)', 'rgba(245,158,11,0.85)']
          : ['rgba(0,0,0,0.85)', 'rgba(217,119,6,0.9)', 'rgba(234,179,8,0.9)', 'rgba(78,71,63,0.85)'];
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const useChar = Math.random() < 0.4 && char; // 40% chance of exploding into the cell's character!

        newParticles.push({
          id: idCounter++,
          x: startX,
          y: startY,
          tx,
          ty,
          size: useChar ? 15 : 4 + Math.random() * 6,
          color,
          char: useChar ? char : undefined,
          rotate: Math.random() * 360 - 180,
        });
      }
    });

    setParticles(prev => [...prev, ...newParticles]);

    // Clean up particles after they finish animating
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1000);
  }, [darkMode]);

  // Refs for callbacks
  const boardRef = useRef(board);
  boardRef.current = board;

  const fallingPieceRef = useRef(fallingPiece);
  fallingPieceRef.current = fallingPiece;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const isProcessingMatchesRef = useRef(isProcessingMatches);
  isProcessingMatchesRef.current = isProcessingMatches;

  const completedTargetsRef = useRef(completedTargets);
  completedTargetsRef.current = completedTargets;

  const currentLevelIdxRef = useRef(currentLevelIdx);
  currentLevelIdxRef.current = currentLevelIdx;

  const currentLevel = sessionLevels[currentLevelIdx] || sessionLevels[0];

  // Helper to trigger clean click sound
  const triggerClack = useCallback(() => {
    playClack(1.0);
  }, []);

  const updateHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('wordtris_word_high', newScore.toString());
    }
  }, [highScore]);

  // Smart Spawner: Bias towards characters needed for remaining target words
  const getSmartLetter = useCallback((completed: Set<string>, levelIdx: number, customLevels?: LevelData[]) => {
    const activeLevels = customLevels || sessionLevelsRef.current;
    const lvl = activeLevels[levelIdx] || activeLevels[0];
    if (!lvl) return getRandomLetter();
    const remaining = lvl.targets.filter(t => !completed.has(t));
    
    let pool = "";
    remaining.forEach(word => {
      pool += word;
    });

    if (pool.length > 0 && Math.random() < 0.75) {
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx].toUpperCase();
    }
    return getRandomLetter();
  }, []);

  // Collision Helper
  const checkCollision = useCallback((x: number, y: number, currentBoard: (string | null)[][]) => {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y >= 0 && currentBoard[y][x] !== null) return true;
    return false;
  }, []);

  // Ghost Piece Y calculation
  const ghostY = useMemo(() => {
    if (!fallingPiece) return null;
    let y = fallingPiece.y;
    while (!checkCollision(fallingPiece.x, y + 1, board)) {
      y++;
    }
    return y;
  }, [fallingPiece, board, checkCollision]);

  // Scan the board specifically for remaining target words
  const findTargetsInGrid = useCallback((currentBoard: (string | null)[][], remaining: string[]) => {
    const matchedCellsSet = new Set<string>();
    const completedThisPass = new Set<string>();

    // Horizontal Scan
    for (let r = 0; r < ROWS; r++) {
      let rowString = "";
      for (let c = 0; c < COLS; c++) {
        rowString += currentBoard[r][c] || " ";
      }

      remaining.forEach(target => {
        const idx = rowString.indexOf(target);
        if (idx !== -1) {
          for (let i = 0; i < target.length; i++) {
            matchedCellsSet.add(`${r},${idx + i}`);
          }
          completedThisPass.add(target);
        }
      });
    }

    // Vertical Scan
    for (let c = 0; c < COLS; c++) {
      let colString = "";
      for (let r = 0; r < ROWS; r++) {
        colString += currentBoard[r][c] || " ";
      }

      remaining.forEach(target => {
        const idx = colString.indexOf(target);
        if (idx !== -1) {
          for (let i = 0; i < target.length; i++) {
            matchedCellsSet.add(`${idx + i},${c}`);
          }
          completedThisPass.add(target);
        }
      });
    }

    return { matchedCells: matchedCellsSet, completedThisPass };
  }, []);

  // Process matches recursively
  const processMatches = useCallback(async (currentBoard: (string | null)[][]): Promise<(string | null)[][]> => {
    setIsProcessingMatches(true);
    const activeLevel = sessionLevelsRef.current[currentLevelIdxRef.current] || sessionLevelsRef.current[0];
    const remaining = activeLevel.targets.filter(t => !completedTargetsRef.current.has(t));

    if (remaining.length === 0) {
      setIsProcessingMatches(false);
      return currentBoard;
    }

    const { matchedCells, completedThisPass } = findTargetsInGrid(currentBoard, remaining);

    if (completedThisPass.size === 0) {
      setIsProcessingMatches(false);
      return currentBoard;
    }

    // Success sound
    playBell();
    triggerShake('clear');
    triggerParticles(matchedCells, currentBoard);

    // Update highlights states
    setClearingCells(matchedCells);
    setClearingRows(new Set()); // No full rows clearing

    // Update completed target list
    const updatedCompleted = new Set(completedTargetsRef.current);
    completedThisPass.forEach(w => updatedCompleted.add(w));
    setCompletedTargets(updatedCompleted);
    completedTargetsRef.current = updatedCompleted; // Keep ref hot

    // Scoring: 500 per word matched * level
    const scoreGain = completedThisPass.size * 500 * (currentLevelIdxRef.current + 1);
    setScore(prev => {
      const nextScore = prev + scoreGain;
      updateHighScore(nextScore);
      return nextScore;
    });

    // High-contrast inverted flash pause delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Collapse board column-by-column to fill gaps of only cleared word cells
    const tempBoard = currentBoard.map(row => [...row]);
    const newBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    for (let c = 0; c < COLS; c++) {
      const surviving: string[] = [];
      for (let r = 0; r < ROWS; r++) {
        const cellKey = `${r},${c}`;
        if (!matchedCells.has(cellKey)) {
          if (tempBoard[r][c] !== null) {
            surviving.push(tempBoard[r][c] as string);
          }
        }
      }
      const emptyCount = ROWS - surviving.length;
      for (let r = 0; r < ROWS; r++) {
        if (r < emptyCount) {
          newBoard[r][c] = null;
        } else {
          newBoard[r][c] = surviving[r - emptyCount];
        }
      }
    }

    // Reset highlights
    setClearingCells(new Set());
    setClearingRows(new Set());
    setBoard(newBoard);

    // Check if level is completely finished!
    const allDone = activeLevel.targets.every(t => updatedCompleted.has(t));
    if (allDone) {
      setIsProcessingMatches(false);
      setTimeout(() => {
        if (currentLevelIdxRef.current === sessionLevelsRef.current.length - 1) {
          setGameState('VICTORY');
        } else {
          setGameState('LEVEL_COMPLETE');
        }
        playBell();
      }, 300);
      return newBoard;
    }

    // Recurse for cascades
    return processMatches(newBoard);
  }, [findTargetsInGrid, updateHighScore, triggerShake, triggerParticles]);

  // Spawn Piece
  const spawnPiece = useCallback((currentBoard: (string | null)[][], levelIdx = currentLevelIdxRef.current, completed = completedTargetsRef.current) => {
    // Generate current character from prior loaded nextChar or fallback
    const char = nextChar || getSmartLetter(completed, levelIdx);
    
    // Generate next character
    const next = getSmartLetter(completed, levelIdx);
    setNextChar(next);

    const startX = Math.floor(COLS / 2);
    const startY = 0;

    if (checkCollision(startX, startY, currentBoard)) {
      setGameState('GAMEOVER');
      playBell();
      setFallingPiece(null);
    } else {
      setFallingPiece({ x: startX, y: startY, char });
    }
  }, [nextChar, getSmartLetter, checkCollision]);

  // Start Next Level
  const startNextLevel = useCallback(() => {
    const nextIdx = currentLevelIdx + 1;
    setCurrentLevelIdx(nextIdx);
    currentLevelIdxRef.current = nextIdx;
    
    setCompletedTargets(new Set());
    completedTargetsRef.current = new Set();
    
    const cleanBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    setBoard(cleanBoard);
    
    setFallingPiece(null);
    setNextChar("");
    setGameState('PLAYING');
    setIsProcessingMatches(false);

    // Pre-seed first pieces
    const firstChar = getSmartLetter(new Set(), nextIdx);
    const secondChar = getSmartLetter(new Set(), nextIdx);
    setNextChar(secondChar);

    setFallingPiece({
      x: Math.floor(COLS / 2),
      y: 0,
      char: firstChar
    });

    playCarriageReturn();
  }, [currentLevelIdx, getSmartLetter]);

  // Fall/Move Down logic
  const moveDown = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || isProcessingMatchesRef.current || !fallingPieceRef.current) return;

    const current = fallingPieceRef.current;
    const nextY = current.y + 1;

    if (!checkCollision(current.x, nextY, boardRef.current)) {
      setFallingPiece({ ...current, y: nextY });
      triggerClack();
    } else {
      // Landed
      const finalBoard = boardRef.current.map(row => [...row]);
      if (current.y >= 0) {
        finalBoard[current.y][current.x] = current.char;
      }
      setBoard(finalBoard);
      setFallingPiece(null);
      playCarriageReturn();
      triggerShake('land');

      processMatches(finalBoard).then(nextBoard => {
        // Only spawn if we didn't complete the level during matches check
        if (gameStateRef.current === 'PLAYING') {
          spawnPiece(nextBoard);
        }
      });
    }
  }, [checkCollision, triggerClack, processMatches, spawnPiece, triggerShake]);

  // Hard Drop Instantly
  const hardDrop = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || isProcessingMatchesRef.current || !fallingPieceRef.current) return;

    const current = fallingPieceRef.current;
    let targetY = current.y;

    while (!checkCollision(current.x, targetY + 1, boardRef.current)) {
      targetY++;
    }

    const finalBoard = boardRef.current.map(row => [...row]);
    if (targetY >= 0) {
      finalBoard[targetY][current.x] = current.char;
    }
    setBoard(finalBoard);
    setFallingPiece(null);
    playCarriageReturn();
    triggerShake('hard-land');

    processMatches(finalBoard).then(nextBoard => {
      if (gameStateRef.current === 'PLAYING') {
        spawnPiece(nextBoard);
      }
    });
  }, [checkCollision, processMatches, spawnPiece, triggerShake]);

  // Move Horizontally
  const moveHorizontally = useCallback((dir: number) => {
    if (gameStateRef.current !== 'PLAYING' || isProcessingMatchesRef.current || !fallingPieceRef.current) return;

    const current = fallingPieceRef.current;
    const nextX = current.x + dir;

    if (!checkCollision(nextX, current.y, boardRef.current)) {
      setFallingPiece({ ...current, x: nextX });
      triggerClack();
    }
  }, [checkCollision, triggerClack]);

  // Toggle audio state
  const handleToggleMute = useCallback(() => {
    const res = toggleMute();
    setMuted(res);
    triggerClack();
  }, [triggerClack]);

  // Fresh Restart
  const restartGame = useCallback(() => {
    // Generate new random targets for this session
    const targets = getRandomTargetWordsForLevels();
    const newLevels = targets.map((t, idx) => ({
      level: idx + 1,
      targets: t
    }));
    setSessionLevels(newLevels);
    sessionLevelsRef.current = newLevels;

    setCurrentLevelIdx(0);
    currentLevelIdxRef.current = 0;
    setCompletedTargets(new Set());
    completedTargetsRef.current = new Set();
    
    const cleanBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    setBoard(cleanBoard);
    setFallingPiece(null);
    setScore(0);
    setNextChar("");
    setGameState('PLAYING');
    setIsProcessingMatches(false);

    // Seed letters using the new levels directly
    const firstChar = getSmartLetter(new Set(), 0, newLevels);
    const secondChar = getSmartLetter(new Set(), 0, newLevels);
    setNextChar(secondChar);

    setFallingPiece({
      x: Math.floor(COLS / 2),
      y: 0,
      char: firstChar
    });

    playCarriageReturn();
  }, [getSmartLetter]);

  // Connect keyboard control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;

      if (state === 'START' || state === 'VICTORY') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          restartGame();
        }
        return;
      }

      if (state === 'LEVEL_COMPLETE') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNextLevel();
        }
        return;
      }

      if (state === 'GAMEOVER') {
        if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          restartGame();
        }
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        setGameState(prev => {
          const next = prev === 'PLAYING' ? 'PAUSED' : 'PLAYING';
          triggerClack();
          return next;
        });
        return;
      }

      if (state !== 'PLAYING' || isProcessingMatchesRef.current) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveHorizontally(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveHorizontally(1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontally, moveDown, hardDrop, restartGame, startNextLevel, triggerClack]);

  // Tick timer
  useEffect(() => {
    if (gameState !== 'PLAYING' || isProcessingMatches) return;

    // Speeds up slowly based on level
    const intervalMs = Math.max(150, 850 - (currentLevelIdx * 75));
    const id = setInterval(() => {
      moveDown();
    }, intervalMs);

    return () => clearInterval(id);
  }, [gameState, isProcessingMatches, currentLevelIdx, moveDown]);

  return (
    <div 
      id="crossword-app-root" 
      className={`min-h-screen font-mono flex flex-col items-center justify-between p-4 md:p-8 select-none transition-colors duration-300 ${
        darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-black'
      }`}
    >
      {/* Top Minimalist Header */}
      <header 
        id="header-bar" 
        className={`w-full max-w-4xl border-b pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          darkMode ? 'border-neutral-800' : 'border-black'
        }`}
      >
        <div className="text-center sm:text-left">
          <h1 id="header-title" className="text-2xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-2">
            <span className="lowercase">none</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            id="btn-theme-toggle"
            onClick={toggleDarkMode}
            className={`px-3 py-1.5 border text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              darkMode 
                ? 'border-neutral-700 hover:bg-neutral-800 text-yellow-400' 
                : 'border-black hover:bg-neutral-100 text-neutral-800'
            }`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            id="btn-help"
            onClick={() => { triggerClack(); setShowHelp(prev => !prev); }}
            className={`px-3 py-1.5 border text-xs font-bold uppercase transition-colors cursor-pointer ${
              darkMode ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-black hover:bg-neutral-100'
            }`}
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          
          <button
            id="btn-mute"
            onClick={handleToggleMute}
            className={`px-3 py-1.5 border text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              darkMode ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-black hover:bg-neutral-100'
            }`}
            title={muted ? "Unmute Sounds" : "Mute Sounds"}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Grid & Side Content Column */}
      <main id="gameplay-area" className="w-full max-w-4xl flex flex-col md:flex-row gap-6 items-stretch justify-center flex-grow">
        
        {/* Left Column: Gameboard (Strict Crossword style, visually enlarged) */}
        <section id="board-container" className="flex-grow flex flex-col items-center justify-center p-2">
          <motion.div 
            animate={shake || { x: 0, y: 0 }}
            className={`relative p-5 border shadow-md w-full max-w-[460px] transition-colors duration-300 ${
              darkMode ? 'bg-neutral-900/60 border-neutral-800 shadow-[2px_2px_12px_rgba(0,0,0,0.5)]' : 'bg-white border-black shadow-sm'
            }`}
          >
            {/* Crossword Grid Matrix (Aspect ratio adjusted to 8/12 = 2/3) */}
            <div 
              id="crossword-grid" 
              className={`grid relative w-full aspect-[8/12] border-2 transition-colors duration-300 ${
                darkMode 
                  ? 'border-neutral-700 bg-neutral-950 shadow-[2px_2px_0px_rgba(255,255,255,0.15)]' 
                  : 'border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {/* Horizontal and Vertical Crossword Grid Lines */}
              {Array.from({ length: ROWS }).map((_, r) => (
                <div 
                  key={`grid-row-line-${r}`} 
                  className={`absolute left-0 right-0 h-[1px] pointer-events-none ${
                    darkMode ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`} 
                  style={{ top: `${(r / ROWS) * 100}%` }}
                />
              ))}
              {Array.from({ length: COLS }).map((_, c) => (
                <div 
                  key={`grid-col-line-${c}`} 
                  className={`absolute top-0 bottom-0 w-[1px] pointer-events-none ${
                    darkMode ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`} 
                  style={{ left: `${(c / COLS) * 100}%` }}
                />
              ))}

              {/* Landed Blocks on the Crossword Grid */}
              {board.map((row, r) => 
                row.map((char, c) => {
                  if (char === null) return null;
                  const isClearing = clearingCells.has(`${r},${c}`);
                  return (
                    <div
                      key={`cell-${r}-${c}`}
                      id={`cell-${r}-${c}`}
                      className="absolute flex items-center justify-center p-[1px]"
                      style={{
                        width: `${100 / COLS}%`,
                        height: `${100 / ROWS}%`,
                        top: `${(r / ROWS) * 100}%`,
                        left: `${(c / COLS) * 100}%`,
                      }}
                    >
                      <div 
                        className={`w-full h-full flex items-center justify-center font-bold text-base md:text-xl transition-all duration-300 border ${
                          isClearing 
                            ? 'bg-yellow-400 text-black border-yellow-400 scale-105 z-20 font-black shadow-[0_0_8px_rgba(234,179,8,0.6)]' 
                            : (darkMode
                                ? 'bg-neutral-850 text-neutral-100 border-neutral-700'
                                : 'bg-white text-black border-neutral-300')
                        }`}
                      >
                        {char}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Ghost Piece Outline */}
              {fallingPiece && ghostY !== null && ghostY > fallingPiece.y && (
                <div
                  id="ghost-piece"
                  className="absolute flex items-center justify-center p-[1px] z-10 pointer-events-none"
                  style={{
                    width: `${100 / COLS}%`,
                    height: `${100 / ROWS}%`,
                    top: `${(ghostY / ROWS) * 100}%`,
                    left: `${(fallingPiece.x / COLS) * 100}%`,
                  }}
                >
                  <div 
                    className={`w-full h-full flex items-center justify-center font-black text-base md:text-xl border border-dashed transition-all duration-300 ${
                      darkMode 
                        ? 'border-white/35 text-white/25 bg-neutral-900/10' 
                        : 'border-black/35 text-black/25 bg-neutral-100/10'
                    }`}
                  >
                    {fallingPiece.char}
                  </div>
                </div>
              )}

              {/* Falling Active Square Block */}
              {fallingPiece && (
                <div
                  id="falling-square"
                  className="absolute flex items-center justify-center p-[1px] z-15"
                  style={{
                    width: `${100 / COLS}%`,
                    height: `${100 / ROWS}%`,
                    top: `${(fallingPiece.y / ROWS) * 100}%`,
                    left: `${(fallingPiece.x / COLS) * 100}%`,
                  }}
                >
                  <div 
                    className={`w-full h-full flex items-center justify-center font-black text-base md:text-xl border ${
                      darkMode 
                        ? 'bg-white text-neutral-950 border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                        : 'bg-black text-white border-black shadow-[1px_1px_3px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    {fallingPiece.char}
                  </div>
                </div>
              )}

              {/* Particle Explosions */}
              <AnimatePresence>
                {particles.map(p => (
                  <motion.div
                    key={`particle-${p.id}`}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      scale: 1, 
                      opacity: 1, 
                      rotate: 0 
                    }}
                    animate={{ 
                      x: p.tx, 
                      y: p.ty, 
                      scale: [1, 1.25, 0], 
                      opacity: [1, 1, 0], 
                      rotate: p.rotate 
                    }}
                    transition={{ 
                      duration: 0.65, 
                      ease: "easeOut" 
                    }}
                    className="absolute flex items-center justify-center pointer-events-none select-none z-10"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: p.size,
                      height: p.size,
                      marginLeft: -p.size / 2,
                      marginTop: -p.size / 2,
                    }}
                  >
                    {p.char ? (
                      <span 
                        className="font-black text-xs md:text-sm tracking-tighter" 
                        style={{ color: p.color }}
                      >
                        {p.char}
                      </span>
                    ) : (
                      <div 
                        className="w-full h-full rounded-sm"
                        style={{ 
                          backgroundColor: p.color,
                          boxShadow: `0 0 5px ${p.color}`
                        }}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Screen Overlay Managers */}
              <AnimatePresence>
                {/* START SCREEN */}
                {gameState === 'START' && (
                  <motion.div 
                    id="start-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center ${
                      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-black'
                    }`}
                  >
                    <div className="space-y-4 max-w-xs">
                      <h2 className="text-lg font-black uppercase">TYPE CROSSWORDS</h2>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Spell specific target words of each level on the board to clear them and solve the puzzle.
                      </p>
                      <button
                        id="btn-play-now"
                        onClick={restartGame}
                        className={`w-full py-2.5 px-4 font-bold text-xs uppercase cursor-pointer transition-all border active:scale-95 ${
                          darkMode 
                            ? 'bg-neutral-100 text-neutral-900 border-neutral-100 hover:bg-neutral-200 shadow-[3px_3px_0px_#222]' 
                            : 'bg-black text-white border-black hover:bg-neutral-800 shadow-[3px_3px_0px_#000]'
                        }`}
                      >
                        Start Game
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* PAUSED OVERLAY */}
                {gameState === 'PAUSED' && (
                  <motion.div 
                    id="paused-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-4 bg-opacity-95 ${
                      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-black'
                    }`}
                  >
                    <div className="space-y-3">
                      <h2 className="text-lg font-black uppercase tracking-widest">GRID SUSPENDED</h2>
                      <p className="text-xs text-neutral-500">The game timer has been locked.</p>
                      <button
                        id="btn-resume"
                        onClick={() => { setGameState('PLAYING'); triggerClack(); }}
                        className={`py-2 px-6 font-bold text-xs uppercase cursor-pointer ${
                          darkMode ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-250' : 'bg-black text-white hover:bg-neutral-800'
                        }`}
                      >
                        Resume Solver
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* LEVEL COMPLETE OVERLAY */}
                {gameState === 'LEVEL_COMPLETE' && (
                  <motion.div 
                    id="level-complete-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center ${
                      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-black'
                    }`}
                  >
                    <div className="space-y-4 max-w-xs">
                      <div className={`text-xs py-1 px-3 inline-block font-black tracking-widest uppercase ${
                        darkMode ? 'bg-neutral-100 text-neutral-900' : 'bg-black text-white'
                      }`}>
                        LEVEL COMPLETED
                      </div>
                      <h2 className="text-lg font-black uppercase">Level {currentLevelIdx + 1} Solved</h2>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        All target crossword words successfully spelled and cleared.
                      </p>
                      <button
                        id="btn-next-level"
                        onClick={startNextLevel}
                        className={`w-full py-2.5 px-4 font-bold text-xs uppercase cursor-pointer transition-all flex items-center justify-center gap-2 ${
                          darkMode 
                            ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-[3px_3px_0px_#222]' 
                            : 'bg-black text-white hover:bg-neutral-800 shadow-[3px_3px_0px_#000]'
                        }`}
                      >
                        <span>Proceed to Level {currentLevelIdx + 2}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <div className="text-[10px] text-neutral-400 uppercase">Or press SPACEBAR / ENTER</div>
                    </div>
                  </motion.div>
                )}

                {/* GAME OVER OVERLAY */}
                {gameState === 'GAMEOVER' && (
                  <motion.div 
                    id="gameover-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center ${
                      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-black'
                    }`}
                  >
                    <div className="space-y-4 max-w-xs">
                      <div className={`text-xs border py-1 px-3 inline-block font-bold tracking-widest uppercase bg-neutral-100 ${
                        darkMode ? 'bg-neutral-900 text-neutral-300 border-neutral-800' : 'bg-neutral-100 border-neutral-300'
                      }`}>
                        GRID OVERFLOW
                      </div>
                      <h2 className="text-lg font-black uppercase">GAME OVER</h2>
                      
                      <div className={`border p-3 text-left text-xs space-y-1.5 ${
                        darkMode ? 'border-neutral-800 bg-neutral-900/60' : 'border-black bg-white'
                      }`}>
                        <div className="flex justify-between">
                          <span className="text-neutral-500 uppercase font-bold">Total Score:</span>
                          <span className="font-bold">{score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500 uppercase font-bold">Solved Level:</span>
                          <span className="font-bold">Lvl {currentLevelIdx + 1}</span>
                        </div>
                      </div>

                      <button
                        id="btn-gameover-restart"
                        onClick={restartGame}
                        className={`w-full py-2.5 px-4 font-bold text-xs uppercase cursor-pointer transition-all ${
                          darkMode 
                            ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-[3px_3px_0px_#222]' 
                            : 'bg-black text-white hover:bg-neutral-800 shadow-[3px_3px_0px_#000]'
                        }`}
                      >
                        Reset & Solve Again
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* VICTORY OVERLAY */}
                {gameState === 'VICTORY' && (
                  <motion.div 
                    id="victory-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center ${
                      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-black'
                    }`}
                  >
                    <div className="space-y-4 max-w-xs">
                      <Trophy className={`w-12 h-12 mx-auto ${darkMode ? 'text-yellow-400' : 'text-black'}`} />
                      <div className={`text-xs py-1 px-3 inline-block font-black tracking-widest uppercase ${
                        darkMode ? 'bg-neutral-100 text-neutral-900' : 'bg-black text-white'
                      }`}>
                        ALL LEVELS SOLVED
                      </div>
                      <h2 className="text-lg font-black uppercase">MASTER SOLVER</h2>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Incredible! You have completed all 10 typographical crossword wordtris levels.
                      </p>
                      <div className={`border p-3 text-left text-xs space-y-1 ${
                        darkMode ? 'border-neutral-800 bg-neutral-900/60' : 'border-black bg-white'
                      }`}>
                        <div className="flex justify-between">
                          <span className="text-neutral-500 uppercase font-bold">Final Tally:</span>
                          <span className="font-bold">{score} pts</span>
                        </div>
                      </div>
                      <button
                        id="btn-victory-restart"
                        onClick={restartGame}
                        className={`w-full py-2.5 px-4 font-bold text-xs uppercase cursor-pointer transition-all ${
                          darkMode 
                            ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-[3px_3px_0px_#222]' 
                            : 'bg-black text-white hover:bg-neutral-800 shadow-[3px_3px_0px_#000]'
                        }`}
                      >
                        Restart from Level 1
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Touch-Friendly Tactile Keyboard Solver Pad */}
          <div 
            id="touch-control-pad" 
            className={`w-full max-w-[460px] mt-4 p-3 border transition-all duration-300 select-none ${
              darkMode 
                ? 'bg-neutral-900/60 border-neutral-800 text-neutral-100 shadow-[2px_2px_12px_rgba(0,0,0,0.5)]' 
                : 'bg-white border-black text-black shadow-sm'
            }`}
          >
            <div className={`flex justify-between items-center text-[9px] font-bold uppercase tracking-widest mb-2 px-1 border-b pb-1 border-dashed ${
              darkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'
            }`}>
              <span>Solver Input Pad</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                <span>Touch Ready</span>
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {/* Left Button */}
              <button
                id="ctrl-left"
                onClick={() => {
                  moveHorizontally(-1);
                }}
                className={`py-3 px-1.5 flex flex-col items-center justify-center font-bold text-xs uppercase cursor-pointer border transition-all active:translate-y-0.5 active:shadow-none select-none touch-manipulation ${
                  darkMode 
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:bg-neutral-800 shadow-[3px_3px_0px_#111]' 
                    : 'bg-neutral-50 border-black text-black hover:bg-neutral-100 shadow-[3px_3px_0px_#000]'
                }`}
              >
                <ArrowLeft className="w-5 h-5 mb-1" />
                <span className="text-[8px] md:text-[9px] tracking-wider">LEFT (A)</span>
              </button>

              {/* Soft Drop Button */}
              <button
                id="ctrl-soft"
                onClick={() => {
                  moveDown();
                }}
                className={`py-3 px-1.5 flex flex-col items-center justify-center font-bold text-xs uppercase cursor-pointer border transition-all active:translate-y-0.5 active:shadow-none select-none touch-manipulation ${
                  darkMode 
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:bg-neutral-800 shadow-[3px_3px_0px_#111]' 
                    : 'bg-neutral-50 border-black text-black hover:bg-neutral-100 shadow-[3px_3px_0px_#000]'
                }`}
              >
                <ArrowDown className="w-5 h-5 mb-1" />
                <span className="text-[8px] md:text-[9px] tracking-wider">SOFT (S)</span>
              </button>

              {/* Hard Drop Button */}
              <button
                id="ctrl-hard"
                onClick={() => {
                  hardDrop();
                }}
                className={`py-3 px-1.5 flex flex-col items-center justify-center font-bold text-xs uppercase cursor-pointer border transition-all active:translate-y-0.5 active:shadow-none select-none touch-manipulation ${
                  darkMode 
                    ? 'bg-neutral-900 border-neutral-700 text-amber-400 hover:bg-neutral-800 shadow-[3px_3px_0px_#111]' 
                    : 'bg-neutral-50 border-black text-amber-600 hover:bg-neutral-100 shadow-[3px_3px_0px_#000]'
                }`}
              >
                <ArrowUp className="w-5 h-5 mb-1 animate-bounce" style={{ animationDuration: '2s' }} />
                <span className="text-[8px] md:text-[9px] tracking-wider font-extrabold text-amber-500">DROP (W)</span>
              </button>

              {/* Right Button */}
              <button
                id="ctrl-right"
                onClick={() => {
                  moveHorizontally(1);
                }}
                className={`py-3 px-1.5 flex flex-col items-center justify-center font-bold text-xs uppercase cursor-pointer border transition-all active:translate-y-0.5 active:shadow-none select-none touch-manipulation ${
                  darkMode 
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:bg-neutral-800 shadow-[3px_3px_0px_#111]' 
                    : 'bg-neutral-50 border-black text-black hover:bg-neutral-100 shadow-[3px_3px_0px_#000]'
                }`}
              >
                <ArrowRight className="w-5 h-5 mb-1" />
                <span className="text-[8px] md:text-[9px] tracking-wider">RIGHT (D)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Level Ledger, Target Word checklist, and Controls (Narrower) */}
        <section 
          id="ledger-sidebar" 
          className={`w-full md:w-[260px] border p-5 flex flex-col justify-between gap-5 transition-all duration-300 ${
            darkMode 
              ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-[2px_2px_0px_rgba(255,255,255,0.15)]' 
              : 'bg-white border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
          }`}
        >
          {/* Level Info & Score tally */}
          <div className="space-y-5">
            <div className={`border-b pb-3 ${darkMode ? 'border-neutral-800' : 'border-black'}`}>
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                <span>Active Ledger</span>
                <span>Lvl {currentLevelIdx + 1} / 10</span>
              </div>
              <div className="text-2xl font-black">{score} <span className="text-xs font-normal text-neutral-400 uppercase tracking-wider ml-1">pts</span></div>
            </div>

            {/* Next character Preview */}
            <div className={`flex items-center justify-between border p-3 ${
              darkMode ? 'border-neutral-800 bg-neutral-950' : 'border-black bg-neutral-50'
            }`}>
              <span className="text-xs font-black uppercase tracking-wider">Next Piece</span>
              <div className={`w-9 h-9 border flex items-center justify-center font-black text-sm relative ${
                darkMode ? 'border-neutral-700 bg-neutral-900 text-white' : 'border-black bg-white'
              }`}>
                {nextChar}
                <div className={`absolute inset-0.5 border border-dashed pointer-events-none ${
                  darkMode ? 'border-neutral-800' : 'border-neutral-200'
                }`} />
              </div>
            </div>

            {/* Target Words checklist */}
            <div className="space-y-2.5">
              <div className={`text-xs font-black uppercase tracking-widest text-neutral-500 border-b border-dashed pb-1.5 flex items-center justify-between ${
                darkMode ? 'border-neutral-800' : 'border-neutral-300'
              }`}>
                <span>Targets Checklist</span>
                <span className={`text-[10px] font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  {completedTargets.size} / {currentLevel.targets.length}
                </span>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {currentLevel.targets.map((word) => {
                  const isDone = completedTargets.has(word);
                  return (
                    <div 
                      key={`word-target-${word}`} 
                      className={`flex items-center gap-2 text-xs py-1 px-2 border transition-all ${
                        isDone 
                          ? (darkMode 
                              ? 'bg-neutral-950 border-neutral-850 text-neutral-600 line-through' 
                              : 'bg-neutral-50 border-neutral-200 text-neutral-400 line-through')
                          : (darkMode 
                              ? 'border-neutral-700 bg-neutral-850 text-neutral-100 font-bold' 
                              : 'border-black bg-white text-black font-bold')
                      }`}
                    >
                      {isDone ? (
                        <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-neutral-500' : 'text-black'}`} />
                      ) : (
                        <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      )}
                      <span className="tracking-widest">{word}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Minimal Controls summary info */}
          <div className={`border-t pt-4 ${darkMode ? 'border-neutral-800' : 'border-black'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Controls</span>
            <div className={`space-y-1 text-[10px] ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <div className="flex justify-between">
                <kbd className={`border px-1 rounded font-bold ${darkMode ? 'border-neutral-750 bg-neutral-850' : 'border-neutral-300 bg-neutral-50'}`}>← / A</kbd>
                <span>Move Left</span>
              </div>
              <div className="flex justify-between">
                <kbd className={`border px-1 rounded font-bold ${darkMode ? 'border-neutral-750 bg-neutral-850' : 'border-neutral-300 bg-neutral-50'}`}>→ / D</kbd>
                <span>Move Right</span>
              </div>
              <div className="flex justify-between">
                <kbd className={`border px-1 rounded font-bold ${darkMode ? 'border-neutral-750 bg-neutral-850' : 'border-neutral-300 bg-neutral-50'}`}>↓ / S</kbd>
                <span>Soft Drop</span>
              </div>
              <div className="flex justify-between">
                <kbd className={`border px-1 rounded font-bold ${darkMode ? 'border-neutral-750 bg-neutral-850' : 'border-neutral-300 bg-neutral-50'}`}>↑ / SPACE</kbd>
                <span>Hard Drop</span>
              </div>
              <div className="flex justify-between">
                <kbd className={`border px-1 rounded font-bold ${darkMode ? 'border-neutral-750 bg-neutral-850' : 'border-neutral-300 bg-neutral-50'}`}>ESC / P</kbd>
                <span>Pause Grid</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Help Overlay Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            id="modal-help-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              id="modal-help-body"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`border p-6 max-w-sm w-full shadow-2xl relative ${
                darkMode ? 'bg-neutral-900 border-neutral-750 text-neutral-100' : 'bg-white border-black text-black'
              }`}
            >
              <h3 className={`text-sm font-black uppercase tracking-wider border-b pb-2 mb-3 ${
                darkMode ? 'border-neutral-800' : 'border-black'
              }`}>
                GRID SOLVER MANUAL
              </h3>
              
              <div className={`space-y-3.5 text-xs leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                <p>
                  <strong>Objective:</strong> Guide the falling letter blocks to spell the required level <strong>target words</strong> either horizontally or vertically.
                </p>
                <p>
                  <strong>Match & Clear:</strong> When any active target word is completed, ONLY those specific word letters clear from the board (the blocks above them drop down column-by-column), and you score points!
                </p>
                <p>
                  <strong>Progression:</strong> Complete all targets in the active checklist to advance to the next level. There are 10 progressive levels to solve.
                </p>
              </div>

              <button
                id="btn-close-help"
                onClick={() => { triggerClack(); setShowHelp(false); }}
                className={`w-full mt-5 py-2 text-xs font-bold uppercase transition-colors cursor-pointer border ${
                  darkMode 
                    ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border-neutral-100' 
                    : 'bg-black text-white hover:bg-neutral-800 border-black'
                }`}
              >
                Close Instructions
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer 
        id="app-footer" 
        className={`w-full text-center text-[10px] mt-8 border-t pt-4 tracking-widest ${
          darkMode ? 'border-neutral-900 text-neutral-500' : 'border-neutral-200 text-neutral-400'
        }`}
      >
        <span className="lowercase font-bold">none</span> • year 2026
      </footer>
    </div>
  );
}
