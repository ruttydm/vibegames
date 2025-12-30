import type { Peer } from 'crossws'

// Player names generator
const adjectives = ['Neon', 'Pixel', 'Cyber', 'Retro', 'Turbo', 'Hyper', 'Ultra', 'Mega', 'Super', 'Atomic']
const nouns = ['Panda', 'Ninja', 'Dragon', 'Phoenix', 'Wolf', 'Tiger', 'Falcon', 'Shark', 'Viper', 'Ghost']
const colors = ['#ff2e63', '#00fff5', '#ffd700', '#39ff14', '#bf00ff', '#ff6b35']

function generatePlayerName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

function generateRoomCode(gameSlug: string): string {
  const prefix = gameSlug.toUpperCase().slice(0, 4)
  const code = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${code}`
}

function getPlayerColor(index: number): string {
  return colors[index % colors.length]
}

export interface Player {
  id: string
  name: string
  color: string
  peer: Peer
  isHost: boolean
  isReady: boolean
  score: number
}

export interface GameState {
  [key: string]: any
}

export interface Lobby {
  id: string
  gameSlug: string
  gameName: string
  players: Map<string, Player>
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  createdAt: Date
  gameState: GameState
  hostId: string | null
}

class LobbyManager {
  private lobbies: Map<string, Lobby> = new Map()
  private playerToLobby: Map<string, string> = new Map()

  createLobby(gameSlug: string, gameName: string, maxPlayers: number): Lobby {
    const id = generateRoomCode(gameSlug)
    const lobby: Lobby = {
      id,
      gameSlug,
      gameName,
      players: new Map(),
      maxPlayers,
      status: 'waiting',
      createdAt: new Date(),
      gameState: {},
      hostId: null
    }
    this.lobbies.set(id, lobby)
    return lobby
  }

  getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies.get(lobbyId)
  }

  getAllLobbies(): Lobby[] {
    return Array.from(this.lobbies.values())
  }

  getPublicLobbies(): Array<{
    id: string
    gameSlug: string
    gameName: string
    players: number
    maxPlayers: number
    status: string
  }> {
    return Array.from(this.lobbies.values())
      .filter(l => l.status === 'waiting')
      .map(l => ({
        id: l.id,
        gameSlug: l.gameSlug,
        gameName: l.gameName,
        players: l.players.size,
        maxPlayers: l.maxPlayers,
        status: l.status
      }))
  }

  joinLobby(lobbyId: string, peer: Peer, playerName?: string): Player | null {
    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return null
    if (lobby.players.size >= lobby.maxPlayers) return null
    if (lobby.status !== 'waiting') return null

    const playerId = peer.id || crypto.randomUUID()
    const isHost = lobby.players.size === 0
    const player: Player = {
      id: playerId,
      name: playerName || generatePlayerName(),
      color: getPlayerColor(lobby.players.size),
      peer,
      isHost,
      isReady: false,
      score: 0
    }

    lobby.players.set(playerId, player)
    if (isHost) {
      lobby.hostId = playerId
    }
    this.playerToLobby.set(playerId, lobbyId)

    return player
  }

  leaveLobby(playerId: string): { lobby: Lobby; wasHost: boolean } | null {
    const lobbyId = this.playerToLobby.get(playerId)
    if (!lobbyId) return null

    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return null

    const player = lobby.players.get(playerId)
    const wasHost = player?.isHost || false

    lobby.players.delete(playerId)
    this.playerToLobby.delete(playerId)

    // If lobby is empty, delete it
    if (lobby.players.size === 0) {
      this.lobbies.delete(lobbyId)
      return { lobby, wasHost }
    }

    // If host left, assign new host
    if (wasHost && lobby.players.size > 0) {
      const newHost = lobby.players.values().next().value
      if (newHost) {
        newHost.isHost = true
        lobby.hostId = newHost.id
      }
    }

    return { lobby, wasHost }
  }

  setPlayerReady(playerId: string, ready: boolean): Lobby | null {
    const lobbyId = this.playerToLobby.get(playerId)
    if (!lobbyId) return null

    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return null

    const player = lobby.players.get(playerId)
    if (player) {
      player.isReady = ready
    }

    return lobby
  }

  startGame(lobbyId: string): Lobby | null {
    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return null
    if (lobby.status !== 'waiting') return null

    lobby.status = 'playing'
    return lobby
  }

  endGame(lobbyId: string): Lobby | null {
    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return null

    lobby.status = 'finished'
    return lobby
  }

  updateGameState(lobbyId: string, state: GameState): Lobby | null {
    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return null

    lobby.gameState = { ...lobby.gameState, ...state }
    return lobby
  }

  updatePlayerScore(playerId: string, score: number): void {
    const lobbyId = this.playerToLobby.get(playerId)
    if (!lobbyId) return

    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return

    const player = lobby.players.get(playerId)
    if (player) {
      player.score = score
    }
  }

  getPlayerLobby(playerId: string): Lobby | undefined {
    const lobbyId = this.playerToLobby.get(playerId)
    if (!lobbyId) return undefined
    return this.lobbies.get(lobbyId)
  }

  broadcastToLobby(lobbyId: string, message: any, excludePlayer?: string): void {
    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return

    const data = JSON.stringify(message)
    for (const [id, player] of lobby.players) {
      if (excludePlayer && id === excludePlayer) continue
      try {
        player.peer.send(data)
      } catch (e) {
        console.error(`Failed to send to player ${id}:`, e)
      }
    }
  }

  getSerializablePlayers(lobby: Lobby): Array<{
    id: string
    name: string
    color: string
    isHost: boolean
    isReady: boolean
    score: number
  }> {
    return Array.from(lobby.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isHost: p.isHost,
      isReady: p.isReady,
      score: p.score
    }))
  }
}

// Singleton instance
export const lobbyManager = new LobbyManager()
