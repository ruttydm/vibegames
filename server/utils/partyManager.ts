import type { Peer } from 'crossws'

// Party player avatars
const avatars = ['🎉', '🥳', '🎊', '✨', '🌟', '🎆', '🎇', '🍾', '🥂', '🎈']
const colors = ['#ff2e63', '#00fff5', '#ffd700', '#39ff14', '#bf00ff', '#ff6b35']

// NYE themed name generator
const adjectives = ['Sparkling', 'Midnight', 'Festive', 'Champagne', 'Glitter', 'Countdown', 'Firework', 'Party', 'Bubbly', 'Golden']
const nouns = ['Star', 'Confetti', 'Rocket', 'Toast', 'Dancer', 'Sparkler', 'Balloon', 'Streamer', 'Cheers', 'Glow']

function generatePartyName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

function generateRoomCode(): string {
  const code = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PRTY-${code}`
}

function getPlayerColor(index: number): string {
  return colors[index % colors.length]
}

function getPlayerAvatar(index: number): string {
  return avatars[index % avatars.length]
}

export type PartyPhase =
  | 'lobby'
  | 'game_intro'
  | 'round_start'
  | 'round_active'
  | 'round_reveal'
  | 'round_scoreboard'
  | 'game_results'

export type MiniGameId = 'trivia' | 'voting' | 'drawing' | 'reaction'
export type ControllerType = 'buttons' | 'draw' | 'text' | 'vote' | 'buzzer' | 'waiting'

export interface PartyPlayer {
  id: string
  name: string
  color: string
  avatar: string
  peer: Peer
  isHost: boolean
  isReady: boolean
  score: number
  roundScore: number
  streak: number
  connected: boolean
  hasSubmitted: boolean
  lastSubmission: any
}

export interface MiniGameState {
  gameId: MiniGameId
  round: number
  totalRounds: number
  prompt: any
  correctAnswer?: any
  submissions: Map<string, { answer: any; timestamp: number }>
  turnPlayerId?: string
  drawingData?: string[]
}

export interface PartyRoom {
  id: string
  players: Map<string, PartyPlayer>
  maxPlayers: number
  phase: PartyPhase
  hostId: string | null
  createdAt: Date

  // Game playlist
  games: MiniGameId[]
  currentGameIndex: number

  // Current mini-game state
  miniGame: MiniGameState | null

  // Timer state
  timerEndTime: number | null
  timerDuration: number

  // Overall settings
  roundsPerGame: number
  roundDuration: number
}

class PartyManager {
  private rooms: Map<string, PartyRoom> = new Map()
  private playerToRoom: Map<string, string> = new Map()

  createRoom(maxPlayers: number = 6): PartyRoom {
    const id = generateRoomCode()
    const room: PartyRoom = {
      id,
      players: new Map(),
      maxPlayers,
      phase: 'lobby',
      hostId: null,
      createdAt: new Date(),
      games: ['trivia', 'voting', 'reaction', 'drawing'], // Default game rotation
      currentGameIndex: 0,
      miniGame: null,
      timerEndTime: null,
      timerDuration: 0,
      roundsPerGame: 3,
      roundDuration: 30
    }
    this.rooms.set(id, room)
    return room
  }

  getRoom(roomId: string): PartyRoom | undefined {
    return this.rooms.get(roomId)
  }

  joinRoom(roomId: string, peer: Peer, playerName?: string): PartyPlayer | null {
    const room = this.rooms.get(roomId)
    if (!room) return null
    if (room.players.size >= room.maxPlayers) return null
    if (room.phase !== 'lobby') return null

    const playerId = peer.id || crypto.randomUUID()
    const isHost = room.players.size === 0
    const playerIndex = room.players.size

    const player: PartyPlayer = {
      id: playerId,
      name: playerName || generatePartyName(),
      color: getPlayerColor(playerIndex),
      avatar: getPlayerAvatar(playerIndex),
      peer,
      isHost,
      isReady: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      connected: true,
      hasSubmitted: false,
      lastSubmission: null
    }

    room.players.set(playerId, player)
    if (isHost) {
      room.hostId = playerId
    }
    this.playerToRoom.set(playerId, roomId)

    return player
  }

  leaveRoom(playerId: string): { room: PartyRoom; wasHost: boolean } | null {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return null

    const room = this.rooms.get(roomId)
    if (!room) return null

    const player = room.players.get(playerId)
    const wasHost = player?.isHost || false

    room.players.delete(playerId)
    this.playerToRoom.delete(playerId)

    // If room is empty, delete it
    if (room.players.size === 0) {
      this.rooms.delete(roomId)
      return { room, wasHost }
    }

    // If host left, assign new host
    if (wasHost && room.players.size > 0) {
      const newHost = room.players.values().next().value
      if (newHost) {
        newHost.isHost = true
        room.hostId = newHost.id
      }
    }

    return { room, wasHost }
  }

  setPlayerReady(playerId: string, ready: boolean): PartyRoom | null {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return null

    const room = this.rooms.get(roomId)
    if (!room) return null

    const player = room.players.get(playerId)
    if (player) {
      player.isReady = ready
    }

    return room
  }

  setPlayerDisconnected(playerId: string): PartyRoom | null {
    const room = this.getPlayerRoom(playerId)
    if (!room) return null

    const player = room.players.get(playerId)
    if (player) {
      player.connected = false
    }

    return room
  }

  reconnectPlayer(playerId: string, peer: Peer): PartyRoom | null {
    const room = this.getPlayerRoom(playerId)
    if (!room) return null

    const player = room.players.get(playerId)
    if (player) {
      player.connected = true
      player.peer = peer
    }

    return room
  }

  // Phase management
  setPhase(roomId: string, phase: PartyPhase): PartyRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.phase = phase
    return room
  }

  // Game flow
  startParty(roomId: string): PartyRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null
    if (room.phase !== 'lobby') return null

    // Shuffle games for variety
    room.games = this.shuffleArray([...room.games])
    room.currentGameIndex = 0
    room.phase = 'game_intro'

    // Reset all player scores
    room.players.forEach(p => {
      p.score = 0
      p.roundScore = 0
      p.streak = 0
    })

    return room
  }

  initMiniGame(roomId: string, gameId: MiniGameId, prompt: any): PartyRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.miniGame = {
      gameId,
      round: 1,
      totalRounds: room.roundsPerGame,
      prompt,
      submissions: new Map()
    }

    // Reset player submission states
    room.players.forEach(p => {
      p.hasSubmitted = false
      p.lastSubmission = null
      p.roundScore = 0
    })

    return room
  }

  submitAnswer(playerId: string, answer: any): { room: PartyRoom; allSubmitted: boolean } | null {
    const room = this.getPlayerRoom(playerId)
    if (!room || !room.miniGame) return null

    const player = room.players.get(playerId)
    if (!player) return null

    player.hasSubmitted = true
    player.lastSubmission = answer
    room.miniGame.submissions.set(playerId, {
      answer,
      timestamp: Date.now()
    })

    // Only check non-host players for "all submitted" since host doesn't play
    const allSubmitted = Array.from(room.players.values())
      .filter(p => p.connected && !p.isHost)
      .every(p => p.hasSubmitted)

    return { room, allSubmitted }
  }

  addDrawingStroke(roomId: string, strokeData: string): PartyRoom | null {
    const room = this.rooms.get(roomId)
    if (!room || !room.miniGame) return null

    if (!room.miniGame.drawingData) {
      room.miniGame.drawingData = []
    }
    room.miniGame.drawingData.push(strokeData)

    return room
  }

  setTimer(roomId: string, duration: number): PartyRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.timerDuration = duration
    room.timerEndTime = Date.now() + duration * 1000

    return room
  }

  clearTimer(roomId: string): PartyRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.timerEndTime = null
    room.timerDuration = 0

    return room
  }

  // Scoring
  updatePlayerScore(playerId: string, points: number, isCorrect: boolean = false): void {
    const room = this.getPlayerRoom(playerId)
    if (!room) return

    const player = room.players.get(playerId)
    if (player) {
      player.roundScore = points
      player.score += points
      if (isCorrect) {
        player.streak++
      } else {
        player.streak = 0
      }
    }
  }

  advanceRound(roomId: string): { room: PartyRoom; isGameOver: boolean; isPartyOver: boolean } | null {
    const room = this.rooms.get(roomId)
    if (!room || !room.miniGame) return null

    room.miniGame.round++
    room.miniGame.submissions.clear()

    // Reset player submission states
    room.players.forEach(p => {
      p.hasSubmitted = false
      p.lastSubmission = null
      p.roundScore = 0
    })

    const isGameOver = room.miniGame.round > room.miniGame.totalRounds

    if (isGameOver) {
      room.currentGameIndex++
    }

    const isPartyOver = room.currentGameIndex >= room.games.length

    return { room, isGameOver, isPartyOver }
  }

  getPlayerRoom(playerId: string): PartyRoom | undefined {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return undefined
    return this.rooms.get(roomId)
  }

  broadcastToRoom(roomId: string, message: any, excludePlayer?: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    const data = JSON.stringify(message)
    for (const [id, player] of room.players) {
      if (excludePlayer && id === excludePlayer) continue
      if (!player.connected) continue
      try {
        player.peer.send(data)
      } catch (e) {
        console.error(`Failed to send to player ${id}:`, e)
      }
    }
  }

  sendToPlayer(playerId: string, message: any): void {
    const room = this.getPlayerRoom(playerId)
    if (!room) return

    const player = room.players.get(playerId)
    if (!player || !player.connected) return

    try {
      player.peer.send(JSON.stringify(message))
    } catch (e) {
      console.error(`Failed to send to player ${playerId}:`, e)
    }
  }

  getSerializablePlayers(room: PartyRoom): Array<{
    id: string
    name: string
    color: string
    avatar: string
    isHost: boolean
    isReady: boolean
    score: number
    roundScore: number
    streak: number
    connected: boolean
    hasSubmitted: boolean
    lastSubmission: any
  }> {
    return Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      score: p.score,
      roundScore: p.roundScore,
      streak: p.streak,
      connected: p.connected,
      hasSubmitted: p.hasSubmitted,
      lastSubmission: p.lastSubmission
    }))
  }

  getSerializableRoom(room: PartyRoom): {
    id: string
    phase: PartyPhase
    players: ReturnType<typeof this.getSerializablePlayers>
    maxPlayers: number
    hostId: string | null
    currentGame: MiniGameId | null
    currentGameIndex: number
    totalGames: number
    miniGame: {
      gameId: MiniGameId
      round: number
      totalRounds: number
      prompt: any
    } | null
    timerEndTime: number | null
    timerDuration: number
  } {
    return {
      id: room.id,
      phase: room.phase,
      players: this.getSerializablePlayers(room),
      maxPlayers: room.maxPlayers,
      hostId: room.hostId,
      currentGame: room.games[room.currentGameIndex] || null,
      currentGameIndex: room.currentGameIndex,
      totalGames: room.games.length,
      miniGame: room.miniGame ? {
        gameId: room.miniGame.gameId,
        round: room.miniGame.round,
        totalRounds: room.miniGame.totalRounds,
        prompt: room.miniGame.prompt
      } : null,
      timerEndTime: room.timerEndTime,
      timerDuration: room.timerDuration
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

// Singleton instance
export const partyManager = new PartyManager()
