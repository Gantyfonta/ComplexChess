import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess, Move } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Palette, 
  ChevronRight, 
  ChevronLeft,
  History,
  Settings2,
  User,
  Cpu,
  Play,
  X,
  Check,
  Globe,
  Copy,
  LogOut
} from 'lucide-react';
import { cn } from './lib/utils';
import { SKINS, Skin, PieceType, PieceColor } from './constants/skins';
import { db } from './lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';

// --- Types ---
type Square = string;
type GameState = 'title' | 'playing';
type PieceSkins = Record<PieceType, string>;

interface ActiveEffect {
  id: string;
  square: string;
  color: string;
  name: string;
}

const PIECE_NAMES: Record<PieceType, string> = {
  p: 'Pawn',
  r: 'Rook',
  n: 'Knight',
  b: 'Bishop',
  q: 'Queen',
  k: 'King'
};

// --- Components ---

interface PassiveEffectProps {
  effect: ActiveEffect;
  key?: string | number;
}

function PassiveEffectDisplay({ effect }: PassiveEffectProps) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
    >
      <div 
        className="w-full h-full rounded-full blur-md opacity-30"
        style={{ backgroundColor: effect.color }}
      />
      <motion.span 
        initial={{ y: 0 }}
        animate={{ y: -20 }}
        className="absolute text-[10px] font-black uppercase tracking-tighter whitespace-nowrap"
        style={{ color: effect.color, textShadow: `0 0 10px ${effect.color}` }}
      >
        {effect.name}
      </motion.span>
    </motion.div>
  );
}

const Piece = ({ type, color, skinId }: { type: PieceType; color: PieceColor; skinId: string }) => {
  const skin = SKINS.find(s => s.id === skinId) || SKINS[0];
  const src = skin.pieces[color][type];
  return (
    <motion.img
      src={src}
      alt={`${color === 'w' ? 'White' : 'Black'} ${type}`}
      className="w-full h-full p-1 select-none pointer-events-none"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      referrerPolicy="no-referrer"
    />
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [pieceSkins, setPieceSkins] = useState<PieceSkins>({
    p: 'classic',
    r: 'classic',
    n: 'classic',
    b: 'classic',
    q: 'classic',
    k: 'classic',
  });
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [activePieceType, setActivePieceType] = useState<PieceType>('p');
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [bonusMovePiece, setBonusMovePiece] = useState<Square | null>(null);
  const [mana, setMana] = useState<{ w: number; b: number }>({ w: 1, b: 1 });
  const [gameOver, setGameOver] = useState<{ winner: string | null; reason: string } | null>(null);

  // --- Multiplayer State ---
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<PieceColor | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomInput, setRoomInput] = useState('');

  // --- Persistence ---
  useEffect(() => {
    const savedSkins = localStorage.getItem('chess_skins');
    if (savedSkins) {
      try {
        setPieceSkins(JSON.parse(savedSkins));
      } catch (e) {
        console.error("Failed to load skins", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chess_skins', JSON.stringify(pieceSkins));
  }, [pieceSkins]);

  // --- Firebase Sync ---
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.fen !== game.fen()) {
          setGame(new Chess(data.fen));
        }
        if (JSON.stringify(data.mana) !== JSON.stringify(mana)) {
          setMana(data.mana);
        }
        if (JSON.stringify(data.moveHistory) !== JSON.stringify(moveHistory)) {
          setMoveHistory(data.moveHistory || []);
        }
        if (data.bonusMovePiece !== bonusMovePiece) {
          setBonusMovePiece(data.bonusMovePiece);
        }
        if (data.gameOver && JSON.stringify(data.gameOver) !== JSON.stringify(gameOver)) {
          setGameOver(data.gameOver);
        }
        // Sync skins if they are shared or just use local? 
        // Let's sync them so both players see the same "custom" game
        if (JSON.stringify(data.pieceSkins) !== JSON.stringify(pieceSkins)) {
          setPieceSkins(data.pieceSkins);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, game, mana, moveHistory, bonusMovePiece, gameOver, pieceSkins]);

  const syncToFirebase = useCallback((updates: any) => {
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    update(roomRef, updates);
  }, [roomId]);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialData = {
      fen: new Chess().fen(),
      mana: { w: 1, b: 1 },
      moveHistory: [],
      pieceSkins,
      bonusMovePiece: null,
      gameOver: null,
      createdAt: Date.now()
    };
    set(ref(db, `rooms/${newRoomId}`), initialData);
    setRoomId(newRoomId);
    setPlayerRole('w');
    setIsMultiplayer(true);
    setGameState('playing');
  };

  const joinRoom = (id: string) => {
    const roomRef = ref(db, `rooms/${id}`);
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomId(id);
        setPlayerRole('b');
        setIsMultiplayer(true);
        setGameState('playing');
      } else {
        alert("Room not found!");
      }
    }, { onlyOnce: true });
  };

  const leaveRoom = () => {
    setRoomId(null);
    setPlayerRole(null);
    setIsMultiplayer(false);
    setGameState('title');
    resetGame();
  };

  // --- Game Logic ---

  const triggerEffect = useCallback((square: string, pieceType: PieceType, skinId: string) => {
    const skin = SKINS.find(s => s.id === skinId) || SKINS[0];
    const effect = skin.effects[pieceType];
    
    const newEffect: ActiveEffect = {
      id: Math.random().toString(36).substr(2, 9),
      square,
      color: effect.color,
      name: effect.name
    };

    setActiveEffects(prev => [...prev, newEffect]);
    setTimeout(() => {
      setActiveEffects(prev => prev.filter(e => e.id !== newEffect.id));
    }, 1000);
  }, []);

  const getSpecialMoves = useCallback((square: string, piece: { type: PieceType, color: PieceColor }, skinId: string) => {
    const moves: string[] = [];
    const col = square.charCodeAt(0) - 97;
    const row = parseInt(square[1]) - 1;

    // Only allow special moves if player has mana
    if (mana[piece.color] < 1) return [];

    if (skinId === 'neon') {
      if (piece.type === 'p') {
        // Turbo: 2 squares forward always
        const dir = piece.color === 'w' ? 1 : -1;
        if (row + dir * 2 >= 0 && row + dir * 2 < 8) {
          const intermediate = `${String.fromCharCode(97 + col)}${row + 1 + dir}`;
          const target = `${String.fromCharCode(97 + col)}${row + 1 + dir * 2}`;
          if (!game.get(intermediate as any) && !game.get(target as any)) {
            moves.push(target);
          }
        }
      }
      if (piece.type === 'r') {
        // Phase: Jump over exactly one piece
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        directions.forEach(([dr, dc]) => {
          let pieceCount = 0;
          for (let step = 1; step < 8; step++) {
            const nr = row + dr * step;
            const nc = col + dc * step;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
            const target = `${String.fromCharCode(97 + nc)}${nr + 1}`;
            const p = game.get(target as any);
            if (p) {
              pieceCount++;
              if (pieceCount === 2) {
                if (p.color !== piece.color) moves.push(target);
                break;
              }
            } else if (pieceCount === 1) {
              moves.push(target);
            }
          }
        });
      }
      if (piece.type === 'b') {
        // Refract: Can move like a knight
        const knightMoves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
        knightMoves.forEach(([dr, dc]) => {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = `${String.fromCharCode(97 + nc)}${nr + 1}`;
            const p = game.get(target as any);
            if (!p || p.color !== piece.color) moves.push(target);
          }
        });
      }
      if (piece.type === 'k') {
        // Recall: Swap with adjacent ally
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              const target = `${String.fromCharCode(97 + nc)}${nr + 1}`;
              const p = game.get(target as any);
              if (p && p.color === piece.color) moves.push(target);
            }
          }
        }
      }
    }

    if (skinId === 'wood') {
      if (piece.type === 'p') {
        // Sprout: Capture forward
        const dir = piece.color === 'w' ? 1 : -1;
        const nr = row + dir;
        if (nr >= 0 && nr < 8) {
          const target = `${String.fromCharCode(97 + col)}${nr + 1}`;
          const p = game.get(target as any);
          if (p && p.color !== piece.color) moves.push(target);
        }
      }
      if (piece.type === 'k') {
        // Heartwood: 2 squares any direction
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              const target = `${String.fromCharCode(97 + nc)}${nr + 1}`;
              const p = game.get(target as any);
              if (!p || p.color !== piece.color) moves.push(target);
            }
          }
        }
      }
    }

    if (skinId === 'minimal') {
      const range = piece.type === 'k' ? 2 : 1;
      for (let dr = -range; dr <= range; dr++) {
        for (let dc = -range; dc <= range; dc++) {
          if (dr === 0 && dc === 0) continue;
          
          // Filter based on piece type
          if (piece.type === 'p' && dr !== 0) continue; 
          if (piece.type === 'r' && (Math.abs(dr) !== Math.abs(dc))) continue; 
          if (piece.type === 'b' && dr !== 0 && dc !== 0) continue; 
          
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = `${String.fromCharCode(97 + nc)}${nr + 1}`;
            const p = game.get(target as any);
            if (!p || p.color !== piece.color) moves.push(target);
          }
        }
      }
      if (piece.type === 'q') {
        // Void: Teleport to any empty square
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const target = `${String.fromCharCode(97 + c)}${r + 1}`;
            if (!game.get(target as any)) moves.push(target);
          }
        }
      }
    }

    return moves;
  }, [game, mana]);

  const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    try {
      const piece = game.get(move.from as any);
      if (!piece) return false;
      
      const skinId = pieceSkins[piece.type as PieceType];
      const playerColor = piece.color;
      
      // Multiplayer check: Only move your own pieces
      if (isMultiplayer && playerRole && playerColor !== playerRole) return false;
      // Multiplayer check: Only move on your turn
      if (isMultiplayer && game.turn() !== playerRole) return false;

      // Check for Wood protection (Now costs 1 mana to trigger)
      const targetPiece = game.get(move.to as any);
      if (targetPiece) {
        const targetSkinId = pieceSkins[targetPiece.type as PieceType];
        const targetColor = targetPiece.color;
        let isProtected = false;
        
        if (mana[targetColor] >= 1) {
          // Rook: Back rank protection
          if (targetPiece.type === 'r' && targetSkinId === 'wood') {
            const r = parseInt(move.to[1]) - 1;
            if ((targetPiece.color === 'w' && r === 0) || (targetPiece.color === 'b' && r === 7)) isProtected = true;
          }
          
          // Bishop: Adjacent wood protection
          if (targetPiece.type === 'b' && targetSkinId === 'wood') {
            const r = parseInt(move.to[1]) - 1;
            const c = move.to.charCodeAt(0) - 97;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                  const adj = game.get(`${String.fromCharCode(97 + nc)}${nr + 1}` as any);
                  if (adj && adj.color === targetPiece.color && pieceSkins[adj.type as PieceType] === 'wood') isProtected = true;
                }
              }
            }
          }

          // Queen: Adjacent allies immune
          const r = parseInt(move.to[1]) - 1;
          const c = move.to.charCodeAt(0) - 97;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const adj = game.get(`${String.fromCharCode(97 + nc)}${nr + 1}` as any);
                if (adj && adj.type === 'q' && adj.color === targetPiece.color && pieceSkins['q'] === 'wood') isProtected = true;
              }
            }
          }
        }

        if (isProtected) {
          triggerEffect(move.to, targetPiece.type as PieceType, targetSkinId);
          setMana(prev => ({ ...prev, [targetColor]: prev[targetColor] - 1 }));
          return false;
        }
      }

      // Check for Wood Knight Thicket (Costs 1 mana to trigger)
      if (piece.color === game.turn()) {
        const fromR = parseInt(move.from[1]) - 1;
        const fromC = move.from.charCodeAt(0) - 97;
        const toR = parseInt(move.to[1]) - 1;
        const toC = move.to.charCodeAt(0) - 97;
        const dist = Math.max(Math.abs(fromR - toR), Math.abs(fromC - toC));
        
        if (dist > 1) {
          // Check if adjacent to enemy wood knight
          let isEntangled = false;
          let knightPos = '';
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = fromR + dr;
              const nc = fromC + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const adjPos = `${String.fromCharCode(97 + nc)}${nr + 1}`;
                const adj = game.get(adjPos as any);
                if (adj && adj.type === 'n' && adj.color !== piece.color && pieceSkins['n'] === 'wood' && mana[adj.color] >= 1) {
                  isEntangled = true;
                  knightPos = adjPos;
                }
              }
            }
          }
          if (isEntangled) {
            triggerEffect(move.from, 'n', 'wood');
            const knight = game.get(knightPos as any);
            if (knight) setMana(prev => ({ ...prev, [knight.color]: prev[knight.color] - 1 }));
            return false;
          }
        }
      }

      let result = game.move(move);
      let isSpecial = false;

      if (!result) {
        const specialMoves = getSpecialMoves(move.from, piece, skinId);
        if (specialMoves.includes(move.to) && mana[playerColor] >= 1) {
          isSpecial = true;
          const target = game.get(move.to as any);
          
          // Handle Recall (Swap)
          if (skinId === 'neon' && piece.type === 'k' && target && target.color === piece.color) {
            game.remove(move.from as any);
            game.remove(move.to as any);
            game.put({ type: piece.type, color: piece.color }, move.to as any);
            game.put({ type: target.type, color: target.color }, move.from as any);
          } else {
            // Standard special move (teleport, jump, etc)
            game.remove(move.from as any);
            game.put({ type: piece.type, color: piece.color }, move.to as any);
          }

          // Swap turn
          const fen = game.fen();
          const parts = fen.split(' ');
          parts[1] = parts[1] === 'w' ? 'b' : 'w';
          game.load(parts.join(' '));
          
          result = { san: `${piece.type.toUpperCase()}${move.to}`, to: move.to, piece: piece.type, captured: !!target } as any;
          setMana(prev => ({ ...prev, [playerColor]: prev[playerColor] - 1 }));
        }
      }

      if (result) {
        setGame(new Chess(game.fen()));
        setMoveHistory(prev => [...prev, result!.san]);
        triggerEffect(result!.to, result!.piece as PieceType, skinId);

        // Handle Neon Bonus Move (Knight and Queen) - Costs 1 mana
        const canBonus = (skinId === 'neon' && (result!.piece === 'n' || result!.piece === 'q') && mana[playerColor] >= 1);
        if (canBonus && !bonusMovePiece) {
          const fen = game.fen();
          const parts = fen.split(' ');
          parts[1] = parts[1] === 'w' ? 'b' : 'w';
          game.load(parts.join(' '));
          setGame(new Chess(game.fen()));
          setBonusMovePiece(result!.to);
          setMana(prev => ({ ...prev, [playerColor]: prev[playerColor] - 1 }));
        } else {
          setBonusMovePiece(null);
        }

        // Increment mana for the NEXT player
        const nextTurn = game.turn();
        setMana(prev => ({
          ...prev,
          [nextTurn]: Math.min(5, prev[nextTurn] + 1)
        }));

        if (game.isGameOver()) {
          let reason = '';
          if (game.isCheckmate()) reason = 'Checkmate';
          else if (game.isDraw()) reason = 'Draw';
          else if (game.isStalemate()) reason = 'Stalemate';
          else if (game.isThreefoldRepetition()) reason = 'Threefold Repetition';
          else if (game.isInsufficientMaterial()) reason = 'Insufficient Material';

          const overData = {
            winner: game.turn() === 'b' ? 'White' : 'Black',
            reason
          };
          setGameOver(overData);
          if (isMultiplayer) syncToFirebase({ gameOver: overData });
        }

        if (isMultiplayer) {
          syncToFirebase({
            fen: game.fen(),
            mana: {
              w: nextTurn === 'w' ? Math.min(5, mana.w + 1) : mana.w,
              b: nextTurn === 'b' ? Math.min(5, mana.b + 1) : mana.b
            },
            moveHistory: [...moveHistory, result!.san],
            bonusMovePiece: canBonus && !bonusMovePiece ? result!.to : null,
            pieceSkins // Sync skins so both see the same
          });
        }

        return true;
      }
    } catch (e) {
      console.error("Move error", e);
      return false;
    }
    return false;
  }, [game, pieceSkins, bonusMovePiece, triggerEffect, getSpecialMoves, mana, isMultiplayer, playerRole, syncToFirebase, moveHistory]);

  const onSquareClick = (square: Square) => {
    if (gameOver) return;
    if (isMultiplayer && game.turn() !== playerRole) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    // If a square is already selected, try to move
    if (selectedSquare) {
      // If bonusMovePiece is set, only allow moving that piece
      if (bonusMovePiece && selectedSquare !== bonusMovePiece) {
        const piece = game.get(square as any);
        if (piece && piece.color === game.turn() && square === bonusMovePiece) {
          setSelectedSquare(square);
        } else {
          // Flash effect to show it's a bonus move
          triggerEffect(bonusMovePiece, game.get(bonusMovePiece as any)?.type as PieceType || 'p', pieceSkins[game.get(bonusMovePiece as any)?.type as PieceType || 'p']);
        }
        return;
      }

      const moveSuccess = makeMove({
        from: selectedSquare,
        to: square,
        promotion: 'q', // Always promote to queen for simplicity in this demo
      });

      if (moveSuccess) {
        setSelectedSquare(null);
      } else {
        // If move failed, check if we clicked another of our own pieces
        const piece = game.get(square as any);
        if (piece && piece.color === game.turn()) {
          // If bonusMovePiece is active, we can't switch pieces
          if (bonusMovePiece && square !== bonusMovePiece) return;
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // Select piece if it's the current player's turn
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        // If bonusMovePiece is active, only allow selecting that piece
        if (bonusMovePiece && square !== bonusMovePiece) {
           triggerEffect(bonusMovePiece, piece.type as PieceType, pieceSkins[piece.type as PieceType]);
           return;
        }
        setSelectedSquare(square);
      }
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setSelectedSquare(null);
    setBonusMovePiece(null);
    setMana({ w: 1, b: 1 });
    setGameOver(null);
  };

  const board = useMemo(() => {
    const rows = [];
    const boardData = game.board();
    
    const isFlipped = playerRole === 'b';

    for (let i = 0; i < 8; i++) {
      const row = [];
      for (let j = 0; j < 8; j++) {
        const displayI = isFlipped ? 7 - i : i;
        const displayJ = isFlipped ? 7 - j : j;

        const squareName = `${String.fromCharCode(97 + displayJ)}${8 - displayI}`;
        const piece = boardData[displayI][displayJ];
        const isDark = (displayI + displayJ) % 2 === 1;
        const isSelected = selectedSquare === squareName;
        
        // Check if this square is a valid move for the selected piece
        let isValidMove = selectedSquare && game.moves({ square: selectedSquare as any, verbose: true })
          .some(m => m.to === squareName);

        // Check for Special Moves in UI
        if (!isValidMove && selectedSquare) {
          const piece = game.get(selectedSquare as any);
          if (piece) {
            const skinId = pieceSkins[piece.type as PieceType];
            const specialMoves = getSpecialMoves(selectedSquare, piece, skinId);
            if (specialMoves.includes(squareName)) {
              isValidMove = true;
            }
          }
        }

        row.push(
          <div
            key={squareName}
            onClick={() => onSquareClick(squareName)}
            className={cn(
              "relative w-full aspect-square flex items-center justify-center cursor-pointer transition-colors duration-200",
              isDark ? "bg-[#769656]" : "bg-[#eeeed2]",
              isSelected && "bg-yellow-200/80",
              isValidMove && "after:content-[''] after:absolute after:w-4 after:h-4 after:bg-black/10 after:rounded-full"
            )}
          >
            {piece && (
              <Piece 
                type={piece.type as PieceType} 
                color={piece.color as PieceColor} 
                skinId={pieceSkins[piece.type as PieceType]} 
              />
            )}

            {/* Passive Effects */}
            <AnimatePresence>
              {activeEffects.filter(e => e.square === squareName).map(effect => (
                <PassiveEffectDisplay key={effect.id} effect={effect} />
              ))}
            </AnimatePresence>
            
            {/* Coordinates */}
            {displayJ === (isFlipped ? 7 : 0) && (
              <span className={cn(
                "absolute top-0.5 left-0.5 text-[10px] font-bold",
                isDark ? "text-[#eeeed2]" : "text-[#769656]"
              )}>
                {8 - displayI}
              </span>
            )}
            {displayI === (isFlipped ? 0 : 7) && (
              <span className={cn(
                "absolute bottom-0.5 right-0.5 text-[10px] font-bold",
                isDark ? "text-[#eeeed2]" : "text-[#769656]"
              )}>
                {String.fromCharCode(97 + displayJ)}
              </span>
            )}
          </div>
        );
      }
      rows.push(<div key={i} className="flex">{row}</div>);
    }
    return rows;
  }, [game, selectedSquare, pieceSkins, playerRole, activeEffects, onSquareClick, getSpecialMoves]);

  if (gameState === 'title') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square border border-white/20 rotate-12" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square border border-white/20 -rotate-12" />
          <div className="grid grid-cols-8 w-full h-full opacity-5">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className={cn("w-full h-full", (Math.floor(i / 8) + i) % 2 === 1 ? "bg-white" : "bg-transparent")} />
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center max-w-lg w-full"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-8">
            <Trophy className="text-white w-12 h-12" />
          </div>
          
          <h1 className="text-6xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            SKINCHESS
          </h1>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-sm mb-12">
            The Ultimate Custom Chess Experience
          </p>

          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={() => {
                setIsMultiplayer(false);
                setGameState('playing');
              }}
              className="group relative w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Play className="w-6 h-6 fill-current relative z-10" />
              <span className="relative z-10">LOCAL PLAY</span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={createRoom}
                className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                <Globe className="w-5 h-5 text-emerald-400" />
                CREATE 1v1
              </button>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="ROOM CODE"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  className="w-full h-full bg-zinc-900 border border-white/10 rounded-2xl px-4 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-all"
                />
                {roomInput.length >= 6 && (
                  <button 
                    onClick={() => joinRoom(roomInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowSkinSelector(true)}
              className="w-full py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-lg rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-3"
            >
              <Palette className="w-6 h-6 text-emerald-400" />
              CUSTOMIZE SKINS
            </button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-zinc-600">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-zinc-400">4</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Skin Sets</span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-zinc-400">6</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Piece Types</span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-zinc-400">∞</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Combinations</span>
            </div>
          </div>
        </motion.div>

        {/* Skin Selector Modal (Shared with Playing state) */}
        <AnimatePresence>
          {showSkinSelector && (
            <SkinSelectorModal 
              pieceSkins={pieceSkins}
              setPieceSkins={setPieceSkins}
              activePieceType={activePieceType}
              setActivePieceType={setActivePieceType}
              onClose={() => setShowSkinSelector(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setGameState('title')}>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SkinChess</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Grandmaster Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Black Mana</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={false}
                  animate={{ 
                    backgroundColor: i < mana.b ? '#ff00e1' : 'rgba(255,255,255,0.05)',
                    boxShadow: i < mana.b ? '0 0 10px #ff00e1' : 'none'
                  }}
                  className="w-4 h-2 rounded-full transition-colors"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 ${game.turn() === 'w' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-zinc-800 text-zinc-500'}`}>
              {game.turn() === 'w' ? "White's Turn" : "Black's Turn"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">White Mana</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={false}
                  animate={{ 
                    backgroundColor: i < mana.w ? '#00f2ff' : 'rgba(255,255,255,0.05)',
                    boxShadow: i < mana.w ? '0 0 10px #00f2ff' : 'none'
                  }}
                  className="w-4 h-2 rounded-full transition-colors"
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {roomId && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest">Room</span>
              <span className="text-sm font-mono font-bold text-emerald-500">{roomId}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                }}
                className="p-1 hover:bg-emerald-500/20 rounded transition-colors"
                title="Copy Room ID"
              >
                <Copy className="w-3 h-3 text-emerald-500" />
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowSkinSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm font-medium border border-white/5"
          >
            <Palette className="w-4 h-4 text-emerald-400" />
            Skins
          </button>
          <button 
            onClick={isMultiplayer ? leaveRoom : resetGame}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-white/5"
            title={isMultiplayer ? "Leave Room" : "Reset Game"}
          >
            {isMultiplayer ? <LogOut className="w-5 h-5 text-red-400" /> : <RotateCcw className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Board Section */}
        <section className="flex flex-col items-center justify-center">
          {/* Opponent Info */}
          <div className="w-full max-w-[600px] mb-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
                <Cpu className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-bold">{isMultiplayer ? "Opponent" : "Deep Blue v2"}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{isMultiplayer ? "Multiplayer" : "Level 1500"}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-zinc-800 rounded text-sm font-mono text-zinc-400 border border-white/5">
              10:00
            </div>
          </div>

          <div className="relative w-full max-w-[600px] aspect-square rounded-lg overflow-hidden shadow-2xl shadow-black/50 border-4 border-[#2c2c2c]">
            {board}
            
            {/* Game Over Overlay */}
            <AnimatePresence>
              {gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-center items-center justify-center z-50 p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-zinc-900 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-xs w-full"
                  >
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{gameOver.winner} Wins!</h2>
                    <p className="text-zinc-400 text-sm mb-6">{gameOver.reason}</p>
                    <button 
                      onClick={resetGame}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Play Again
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player Info */}
          <div className="w-full max-w-[600px] mt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <User className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold">You {playerRole && `(${playerRole === 'w' ? 'White' : 'Black'})`}</p>
                <p className="text-[10px] text-emerald-500/70 uppercase tracking-wider">Challenger</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 rounded text-sm font-mono text-emerald-500 border border-emerald-500/20">
              10:00
            </div>
          </div>
        </section>

        {/* Sidebar Section */}
        <aside className="flex flex-col gap-6">
          {/* Move History */}
          <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Move History</h3>
              </div>
              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">{moveHistory.length} moves</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {moveHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                  <History className="w-8 h-8 opacity-20" />
                  <p className="text-xs italic">No moves yet...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-3 group">
                        <span className="text-[10px] font-mono text-zinc-700 w-4">{i + 1}.</span>
                        <div className="flex-1 bg-zinc-800/50 group-hover:bg-zinc-800 p-2 rounded text-sm font-medium transition-colors border border-transparent group-hover:border-white/5">
                          {moveHistory[i * 2]}
                        </div>
                      </div>
                      {moveHistory[i * 2 + 1] && (
                        <div className="flex items-center gap-3 group">
                          <div className="flex-1 bg-zinc-800/50 group-hover:bg-zinc-800 p-2 rounded text-sm font-medium transition-colors border border-transparent group-hover:border-white/5">
                            {moveHistory[i * 2 + 1]}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Current Skins Summary */}
          <div className="bg-zinc-900 rounded-2xl border border-white/5 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Active Skins</h3>
              <Settings2 className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(pieceSkins) as PieceType[]).map((type) => {
                const skinId = pieceSkins[type];
                const skin = SKINS.find(s => s.id === skinId) || SKINS[0];
                return (
                  <div key={type} className="flex flex-col items-center gap-1 p-2 bg-zinc-800/50 rounded-lg border border-white/5">
                    <img src={skin.pieces.w[type]} className="w-8 h-8" alt={type} referrerPolicy="no-referrer" />
                    <span className="text-[8px] uppercase font-bold text-zinc-500">{PIECE_NAMES[type]}</span>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => setShowSkinSelector(true)}
              className="w-full mt-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              Customize Pieces
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </aside>
      </main>

      {/* Skin Selector Modal */}
      <AnimatePresence>
        {showSkinSelector && (
          <SkinSelectorModal 
            pieceSkins={pieceSkins}
            setPieceSkins={setPieceSkins}
            activePieceType={activePieceType}
            setActivePieceType={setActivePieceType}
            onClose={() => setShowSkinSelector(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

// --- Sub-components ---

function SkinSelectorModal({ 
  pieceSkins, 
  setPieceSkins, 
  activePieceType, 
  setActivePieceType, 
  onClose 
}: { 
  pieceSkins: PieceSkins;
  setPieceSkins: React.Dispatch<React.SetStateAction<PieceSkins>>;
  activePieceType: PieceType;
  setActivePieceType: React.Dispatch<React.SetStateAction<PieceType>>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px]"
      >
        {/* Left Sidebar: Piece Selection */}
        <div className="w-full md:w-64 bg-zinc-950/50 border-r border-white/5 p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-6 px-2">Customize</h2>
          <div className="flex-1 space-y-2">
            {(Object.keys(PIECE_NAMES) as PieceType[]).map((type) => {
              const isActive = activePieceType === type;
              const currentSkinId = pieceSkins[type];
              const skin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
              
              return (
                <button
                  key={type}
                  onClick={() => setActivePieceType(type)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    isActive 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                      : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isActive ? "bg-white/20" : "bg-zinc-800"
                  )}>
                    <img 
                      src={skin.pieces.w[type]} 
                      className="w-7 h-7" 
                      alt={type} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-bold text-sm">{PIECE_NAMES[type]}</span>
                </button>
              );
            })}
          </div>
          <button 
            onClick={onClose}
            className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        </div>

        {/* Right Content: Skin Selection */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{PIECE_NAMES[activePieceType]} Skins</h3>
              <p className="text-sm text-zinc-500">Select a style for your {PIECE_NAMES[activePieceType].toLowerCase()}s</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 custom-scrollbar">
            {SKINS.map((skin) => {
              const isSelected = pieceSkins[activePieceType] === skin.id;
              
              return (
                <button
                  key={skin.id}
                  onClick={() => setPieceSkins(prev => ({ ...prev, [activePieceType]: skin.id }))}
                  className={cn(
                    "group relative p-6 rounded-2xl border transition-all text-left overflow-hidden",
                    isSelected 
                      ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50" 
                      : "bg-zinc-800/50 border-white/5 hover:bg-zinc-800 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center shadow-lg", skin.previewColor)}>
                      <img 
                        src={skin.pieces.w[activePieceType]} 
                        className="w-12 h-12 drop-shadow-md" 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg group-hover:text-emerald-400 transition-colors">{skin.name}</h4>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter"
                            style={{ backgroundColor: `${skin.effects[activePieceType].color}20`, color: skin.effects[activePieceType].color }}
                          >
                            {skin.effects[activePieceType].name}
                          </span>
                          <p className="text-[10px] text-zinc-500 italic">{skin.effects[activePieceType].description}</p>
                        </div>
                        <p className="text-[9px] text-emerald-500/80 font-medium leading-tight">{skin.effects[activePieceType].gameplay}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Background piece decoration */}
                  <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <img src={skin.pieces.b[activePieceType]} className="w-24 h-24 rotate-12" alt="" referrerPolicy="no-referrer" />
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Quick Apply All */}
          <div className="p-6 bg-zinc-950/50 border-t border-white/5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 italic">Tip: You can mix and match skins from different sets!</p>
              <button 
                onClick={() => {
                  const currentSkinId = pieceSkins[activePieceType];
                  setPieceSkins({
                    p: currentSkinId,
                    r: currentSkinId,
                    n: currentSkinId,
                    b: currentSkinId,
                    q: currentSkinId,
                    k: currentSkinId,
                  });
                }}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                Apply this set to all pieces
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
