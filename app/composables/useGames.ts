import type { Game, Category } from '~/types/game'

// Sample games data - replace with actual games as you build them
const games: Game[] = [
  {
    slug: 'snake',
    title: 'Snake',
    description: 'Classic snake game. Eat food, grow longer, don\'t hit yourself! Play solo or compete with friends.',
    thumbnail: '/games/snake/thumbnail.svg',
    categories: ['arcade', 'classic'],
    mode: 'both',
    controls: [
      { key: 'Arrow Keys / WASD', action: 'Move' },
      { key: 'P / Escape', action: 'Pause' },
      { key: 'Space', action: 'Start / Restart' }
    ],
    minPlayers: 1,
    maxPlayers: 4,
    featured: true
  },
  {
    slug: 'pong',
    title: 'Pong',
    description: 'The classic table tennis game. First to 10 wins!',
    thumbnail: '/games/pong/thumbnail.png',
    categories: ['arcade', 'classic', 'sports'],
    mode: 'both',
    controls: [
      { key: 'W/S', action: 'Player 1 Move' },
      { key: 'Up/Down', action: 'Player 2 Move' }
    ],
    minPlayers: 1,
    maxPlayers: 2,
    featured: true
  },
  {
    slug: 'tetris',
    title: 'Block Drop',
    description: 'Stack the falling blocks. Clear lines to score!',
    thumbnail: '/games/tetris/thumbnail.png',
    categories: ['puzzle', 'classic'],
    mode: 'singleplayer',
    controls: [
      { key: 'Left/Right', action: 'Move' },
      { key: 'Up', action: 'Rotate' },
      { key: 'Down', action: 'Soft Drop' },
      { key: 'Space', action: 'Hard Drop' }
    ],
    featured: true
  },
  {
    slug: 'asteroids',
    title: 'Asteroids',
    description: 'Blast through space! Destroy asteroids and survive.',
    thumbnail: '/games/asteroids/thumbnail.png',
    categories: ['arcade', 'shooter'],
    mode: 'singleplayer',
    controls: [
      { key: 'Arrow Keys', action: 'Move & Rotate' },
      { key: 'Space', action: 'Shoot' }
    ],
    featured: true
  },
  {
    slug: 'breakout',
    title: 'Breakout',
    description: 'Break all the bricks with your ball and paddle.',
    thumbnail: '/games/breakout/thumbnail.png',
    categories: ['arcade', 'classic'],
    mode: 'singleplayer',
    controls: [
      { key: 'Left/Right', action: 'Move Paddle' },
      { key: 'Space', action: 'Launch Ball' }
    ]
  },
  {
    slug: 'space-invaders',
    title: 'Space Invaders',
    description: 'Defend Earth from waves of alien invaders!',
    thumbnail: '/games/space-invaders/thumbnail.png',
    categories: ['arcade', 'shooter', 'classic'],
    mode: 'singleplayer',
    controls: [
      { key: 'Left/Right', action: 'Move' },
      { key: 'Space', action: 'Shoot' }
    ]
  },
  {
    slug: 'memory',
    title: 'Memory Match',
    description: 'Find matching pairs. Test your memory!',
    thumbnail: '/games/memory/thumbnail.png',
    categories: ['puzzle', 'card'],
    mode: 'both',
    controls: [
      { key: 'Mouse', action: 'Click to flip cards' }
    ],
    minPlayers: 1,
    maxPlayers: 4
  },
  {
    slug: 'racing',
    title: 'Pixel Racer',
    description: 'Race against time on endless tracks.',
    thumbnail: '/games/racing/thumbnail.png',
    categories: ['racing', 'arcade'],
    mode: 'singleplayer',
    controls: [
      { key: 'Left/Right', action: 'Steer' },
      { key: 'Up', action: 'Accelerate' },
      { key: 'Down', action: 'Brake' }
    ]
  },
  {
    slug: 'evosim',
    title: 'EvoSim: Nodes',
    description: 'Multicellular evolution simulator. Watch organisms evolve, hunt, and reproduce in a living ecosystem.',
    thumbnail: '/games/evosim/thumbnail.svg',
    categories: ['simulation', 'strategy'],
    mode: 'singleplayer',
    controls: [
      { key: 'Left-Click Drag', action: 'Pan camera' },
      { key: 'Right-Click', action: 'Select organism / Spawn food' },
      { key: 'Scroll', action: 'Zoom in/out' }
    ],
    featured: true
  }
]

const categories: Category[] = [
  { slug: 'arcade', name: 'Arcade', icon: 'mdi:pac-man' },
  { slug: 'puzzle', name: 'Puzzle', icon: 'mdi:puzzle' },
  { slug: 'racing', name: 'Racing', icon: 'mdi:car-sports' },
  { slug: 'shooter', name: 'Shooter', icon: 'mdi:target' },
  { slug: 'classic', name: 'Classic', icon: 'mdi:gamepad-classic' },
  { slug: 'sports', name: 'Sports', icon: 'mdi:basketball' },
  { slug: 'card', name: 'Card', icon: 'mdi:cards' },
  { slug: 'strategy', name: 'Strategy', icon: 'mdi:chess-knight' },
  { slug: 'party', name: 'Party', icon: 'mdi:party-popper' },
  { slug: 'simulation', name: 'Simulation', icon: 'mdi:dna' }
]

export function useGames() {
  const getAllGames = () => games

  const getFeaturedGames = () => games.filter(g => g.featured)

  const getGameBySlug = (slug: string) => games.find(g => g.slug === slug)

  const getGamesByCategory = (category: string) =>
    games.filter(g => g.categories.includes(category))

  const getMultiplayerGames = () =>
    games.filter(g => g.mode === 'multiplayer' || g.mode === 'both')

  const getAllCategories = () => categories

  const getCategoryBySlug = (slug: string) =>
    categories.find(c => c.slug === slug)

  return {
    getAllGames,
    getFeaturedGames,
    getGameBySlug,
    getGamesByCategory,
    getMultiplayerGames,
    getAllCategories,
    getCategoryBySlug
  }
}
