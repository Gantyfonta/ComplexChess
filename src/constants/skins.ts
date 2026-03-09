export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface PassiveEffect {
  name: string;
  description: string;
  gameplay: string;
  color: string;
}

export interface Skin {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  pieces: {
    [key in PieceColor]: {
      [key in PieceType]: string;
    };
  };
  effects: {
    [key in PieceType]: PassiveEffect;
  };
}

export const SKINS: Skin[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The standard Staunton chess pieces.',
    previewColor: 'bg-slate-200',
    pieces: {
      w: {
        p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
        r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
        n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
        b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
        q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
        k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
      },
      b: {
        p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
        r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
        n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
        b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
        q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
        k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
      },
    },
    effects: {
      p: { name: 'Vanguard', description: 'Standard pawn.', gameplay: 'Standard rules.', color: '#94a3b8' },
      r: { name: 'Bastion', description: 'Standard rook.', gameplay: 'Standard rules.', color: '#64748b' },
      n: { name: 'Gallop', description: 'Standard knight.', gameplay: 'Standard rules.', color: '#475569' },
      b: { name: 'Grace', description: 'Standard bishop.', gameplay: 'Standard rules.', color: '#cbd5e1' },
      q: { name: 'Majesty', description: 'Standard queen.', gameplay: 'Standard rules.', color: '#f8fafc' },
      k: { name: 'Authority', description: 'Standard king.', gameplay: 'Standard rules.', color: '#e2e8f0' },
    }
  },
  {
    id: 'neon',
    name: 'Neon Pulse',
    description: 'Futuristic glowing pieces for the digital age.',
    previewColor: 'bg-cyan-400',
    pieces: {
      w: {
        p: 'https://api.iconify.design/game-icons:pawn.svg?color=%2300f2ff',
        r: 'https://api.iconify.design/game-icons:chess-rook.svg?color=%2300f2ff',
        n: 'https://api.iconify.design/game-icons:chess-knight.svg?color=%2300f2ff',
        b: 'https://api.iconify.design/game-icons:chess-bishop.svg?color=%2300f2ff',
        q: 'https://api.iconify.design/game-icons:chess-queen.svg?color=%2300f2ff',
        k: 'https://api.iconify.design/game-icons:chess-king.svg?color=%2300f2ff',
      },
      b: {
        p: 'https://api.iconify.design/game-icons:pawn.svg?color=%23ff00e1',
        r: 'https://api.iconify.design/game-icons:chess-rook.svg?color=%23ff00e1',
        n: 'https://api.iconify.design/game-icons:chess-knight.svg?color=%23ff00e1',
        b: 'https://api.iconify.design/game-icons:chess-bishop.svg?color=%23ff00e1',
        q: 'https://api.iconify.design/game-icons:chess-queen.svg?color=%23ff00e1',
        k: 'https://api.iconify.design/game-icons:chess-king.svg?color=%23ff00e1',
      },
    },
    effects: {
      p: { name: 'Turbo', description: 'High-speed propulsion.', gameplay: 'Costs 1 Mana: Can always move 2 squares forward.', color: '#00f2ff' },
      r: { name: 'Phase', description: 'Quantum tunneling.', gameplay: 'Costs 1 Mana: Can jump over exactly one piece.', color: '#ff00e1' },
      n: { name: 'Chain', description: 'Sequential processing.', gameplay: 'Costs 1 Mana: Can move again after capturing.', color: '#00ff9d' },
      b: { name: 'Refract', description: 'Light bending.', gameplay: 'Costs 1 Mana: Can make one 90° turn during a move.', color: '#ffea00' },
      q: { name: 'Burst', description: 'Energy surge.', gameplay: 'Costs 1 Mana: Can move twice in one turn.', color: '#ffffff' },
      k: { name: 'Recall', description: 'Emergency extraction.', gameplay: 'Costs 1 Mana: Can swap places with any adjacent ally.', color: '#ff0055' },
    }
  },
  {
    id: 'wood',
    name: 'Artisanal Wood',
    description: 'Hand-carved wooden pieces with a natural finish.',
    previewColor: 'bg-amber-700',
    pieces: {
      w: {
        p: 'https://api.iconify.design/mdi:chess-pawn.svg?color=%23fde68a',
        r: 'https://api.iconify.design/mdi:chess-rook.svg?color=%23fde68a',
        n: 'https://api.iconify.design/mdi:chess-knight.svg?color=%23fde68a',
        b: 'https://api.iconify.design/mdi:chess-bishop.svg?color=%23fde68a',
        q: 'https://api.iconify.design/mdi:chess-queen.svg?color=%23fde68a',
        k: 'https://api.iconify.design/mdi:chess-king.svg?color=%23fde68a',
      },
      b: {
        p: 'https://api.iconify.design/mdi:chess-pawn.svg?color=%23451a03',
        r: 'https://api.iconify.design/mdi:chess-rook.svg?color=%23451a03',
        n: 'https://api.iconify.design/mdi:chess-knight.svg?color=%23451a03',
        b: 'https://api.iconify.design/mdi:chess-bishop.svg?color=%23451a03',
        q: 'https://api.iconify.design/mdi:chess-queen.svg?color=%23451a03',
        k: 'https://api.iconify.design/mdi:chess-king.svg?color=%23451a03',
      },
    },
    effects: {
      p: { name: 'Sprout', description: 'Aggressive growth.', gameplay: 'Costs 1 Mana: Can capture pieces directly forward.', color: '#4ade80' },
      r: { name: 'Ironwood', description: 'Dense grain.', gameplay: 'Costs 1 Mana: Immune to capture while on the back rank.', color: '#166534' },
      n: { name: 'Thicket', description: 'Entangling vines.', gameplay: 'Costs 1 Mana: Adjacent enemies can only move 1 square.', color: '#92400e' },
      b: { name: 'Pollen', description: 'Allergic reaction.', gameplay: 'Costs 1 Mana: Adjacent enemies cannot capture this piece.', color: '#facc15' },
      q: { name: 'Forest', description: 'Protective canopy.', gameplay: 'Costs 1 Mana: All adjacent allies are immune to capture.', color: '#f472b6' },
      k: { name: 'Heartwood', description: 'Deep resilience.', gameplay: 'Costs 1 Mana: Can move up to 2 squares in any direction.', color: '#78350f' },
    }
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Clean, geometric shapes for focused play.',
    previewColor: 'bg-zinc-800',
    pieces: {
      w: {
        p: 'https://api.iconify.design/ph:circle-fill.svg?color=%23ffffff',
        r: 'https://api.iconify.design/ph:square-fill.svg?color=%23ffffff',
        n: 'https://api.iconify.design/ph:triangle-fill.svg?color=%23ffffff',
        b: 'https://api.iconify.design/ph:hexagon-fill.svg?color=%23ffffff',
        q: 'https://api.iconify.design/ph:star-fill.svg?color=%23ffffff',
        k: 'https://api.iconify.design/ph:crown-fill.svg?color=%23ffffff',
      },
      b: {
        p: 'https://api.iconify.design/ph:circle-fill.svg?color=%23000000',
        r: 'https://api.iconify.design/ph:square-fill.svg?color=%23000000',
        n: 'https://api.iconify.design/ph:triangle-fill.svg?color=%23000000',
        b: 'https://api.iconify.design/ph:hexagon-fill.svg?color=%23000000',
        q: 'https://api.iconify.design/ph:star-fill.svg?color=%23000000',
        k: 'https://api.iconify.design/ph:crown-fill.svg?color=%23000000',
      },
    },
    effects: {
      p: { name: 'Slide', description: 'Lateral movement.', gameplay: 'Costs 1 Mana: Can move 1 square horizontally.', color: '#ffffff' },
      r: { name: 'Cross', description: 'Diagonal shift.', gameplay: 'Costs 1 Mana: Can move 1 square diagonally.', color: '#a1a1aa' },
      n: { name: 'L-Step', description: 'Short hop.', gameplay: 'Costs 1 Mana: Can move 1 square in any direction.', color: '#71717a' },
      b: { name: 'Square', description: 'Orthogonal shift.', gameplay: 'Costs 1 Mana: Can move 1 square horizontally or vertically.', color: '#52525b' },
      q: { name: 'Void', description: 'Quantum leap.', gameplay: 'Costs 1 Mana: Can teleport to any empty square.', color: '#27272a' },
      k: { name: 'Sphere', description: 'Extended reach.', gameplay: 'Costs 1 Mana: Can move up to 2 squares in any direction.', color: '#09090b' },
    }
  },
];


