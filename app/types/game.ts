export interface Game {
  slug: string
  title: string
  description: string
  thumbnail?: string
  categories: string[]
  mode: 'singleplayer' | 'multiplayer' | 'both'
  controls: GameControl[]
  minPlayers?: number
  maxPlayers?: number
  featured?: boolean
}

export interface GameControl {
  key: string
  action: string
}

export interface GameRoom {
  id: string
  gameSlug: string
  players: Player[]
  status: 'waiting' | 'playing' | 'finished'
  maxPlayers: number
  createdAt: Date
}

export interface Player {
  id: string
  name: string
  color: string
  isHost?: boolean
}

export interface Category {
  slug: string
  name: string
  icon: string
  description?: string
}
