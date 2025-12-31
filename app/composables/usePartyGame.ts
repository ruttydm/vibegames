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
  isHost: boolean
  isReady: boolean
  score: number
  roundScore: number
  streak: number
  connected: boolean
  hasSubmitted: boolean
}

export interface MiniGameState {
  gameId: MiniGameId
  round: number
  totalRounds: number
  prompt: any
}

export interface PartyRoom {
  id: string
  phase: PartyPhase
  players: PartyPlayer[]
  maxPlayers: number
  hostId: string | null
  currentGame: MiniGameId | null
  currentGameIndex: number
  totalGames: number
  miniGame: MiniGameState | null
  timerEndTime: number | null
  timerDuration: number
}

export interface PartyState {
  room: PartyRoom | null
  currentPlayer: PartyPlayer | null
  status: 'disconnected' | 'connecting' | 'connected'
  error: string | null
  controllerType: ControllerType
  hasSubmitted: boolean
  lastFeedback: 'correct' | 'wrong' | 'fastest' | null
}

type MessageHandler = (type: string, payload: any) => void

// Singleton state - shared across all component instances
let ws: WebSocket | null = null
let isConnectedValue = false
const messageHandlers = new Set<MessageHandler>()

const sharedState = reactive<PartyState>({
  room: null,
  currentPlayer: null,
  status: 'disconnected',
  error: null,
  controllerType: 'waiting',
  hasSubmitted: false,
  lastFeedback: null
})

export function usePartyGame() {
  const isConnected = computed(() => isConnectedValue)
  const state = sharedState

  // Computed helpers
  const isHost = computed(() => sharedState.currentPlayer?.isHost ?? false)
  const playerCount = computed(() => sharedState.room?.players.length ?? 0)
  const canStart = computed(() => {
    if (!isHost.value || !sharedState.room) return false
    if (sharedState.room.players.length < 2) return false
    return sharedState.room.players.filter(p => !p.isHost).every(p => p.isReady)
  })
  const roomCode = computed(() => sharedState.room?.id ?? null)
  const currentGame = computed(() => sharedState.room?.currentGame ?? null)
  const phase = computed(() => sharedState.room?.phase ?? 'lobby')
  const players = computed(() => sharedState.room?.players ?? [])
  const timerRemaining = computed(() => {
    if (!sharedState.room?.timerEndTime) return 0
    const remaining = Math.max(0, sharedState.room.timerEndTime - Date.now())
    return Math.ceil(remaining / 1000)
  })

  // Connection
  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      sharedState.status = 'connecting'
      sharedState.error = null

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/_ws`

      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        isConnectedValue = true
        sharedState.status = 'connected'
        resolve()
      }

      ws.onclose = () => {
        isConnectedValue = false
        sharedState.status = 'disconnected'
        ws = null
      }

      ws.onerror = (error) => {
        sharedState.error = 'Connection failed'
        reject(error)
      }

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data)
          handleMessage(type, payload)
        } catch (e) {
          console.error('Failed to parse message:', e)
        }
      }
    })
  }

  function disconnect() {
    if (ws) {
      ws.close()
      ws = null
    }
    isConnectedValue = false
    resetState()
  }

  function resetState() {
    sharedState.room = null
    sharedState.currentPlayer = null
    sharedState.status = 'disconnected'
    sharedState.error = null
    sharedState.controllerType = 'waiting'
    sharedState.hasSubmitted = false
    sharedState.lastFeedback = null
  }

  function send(type: string, payload?: any) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }))
    }
  }

  function handleMessage(type: string, payload: any) {
    // Notify all registered handlers
    messageHandlers.forEach(handler => handler(type, payload))

    switch (type) {
      case 'party_created':
      case 'party_joined':
        sharedState.room = payload.room
        sharedState.currentPlayer = payload.player
        sharedState.status = 'connected'
        console.log('[Party] Joined room:', payload.room?.id, 'as player:', payload.player?.name, payload.player?.id)
        break

      case 'party_player_joined':
      case 'party_player_left':
      case 'party_player_ready_changed':
        if (sharedState.room) {
          sharedState.room.players = payload.players
          if (payload.newHostId && sharedState.currentPlayer) {
            sharedState.currentPlayer.isHost = sharedState.currentPlayer.id === payload.newHostId
          }
          // Sync currentPlayer with room players to keep all fields updated
          if (sharedState.currentPlayer) {
            const updatedPlayer = payload.players.find((p: any) => p.id === sharedState.currentPlayer?.id)
            if (updatedPlayer) {
              Object.assign(sharedState.currentPlayer, updatedPlayer)
            }
          }
        }
        break

      case 'party_left':
        resetState()
        break

      case 'party_kicked':
        sharedState.error = payload.message
        resetState()
        break

      case 'party_started':
        if (sharedState.room) {
          sharedState.room = payload.room
        }
        break

      case 'party_phase_changed':
        if (sharedState.room) {
          sharedState.room.phase = payload.phase
          sharedState.room = payload.room
        }
        break

      case 'party_game_init':
        if (sharedState.room) {
          sharedState.room = payload.room
          sharedState.controllerType = payload.controllerType || 'waiting'
          sharedState.hasSubmitted = false
          sharedState.lastFeedback = null
        }
        break

      case 'party_timer_started':
        if (sharedState.room) {
          sharedState.room.timerEndTime = payload.endTime
          sharedState.room.timerDuration = payload.duration
        }
        break

      case 'party_answer_received':
      case 'party_vote_received':
      case 'party_drawing_received':
        sharedState.hasSubmitted = true
        break

      case 'party_submission_update':
        if (sharedState.room) {
          sharedState.room.players = payload.players
        }
        break

      case 'party_answer_revealed':
        if (sharedState.room) {
          sharedState.room.players = payload.players
          // Check if current player got it right
          if (payload.scores && sharedState.currentPlayer) {
            const myScore = payload.scores[sharedState.currentPlayer.id]
            if (myScore) {
              sharedState.lastFeedback = myScore.correct ? 'correct' : 'wrong'
            }
          }
        }
        break

      case 'party_scoreboard':
        if (sharedState.room) {
          sharedState.room.players = payload.players
        }
        break

      case 'party_round_advanced':
        sharedState.room = payload.room
        sharedState.hasSubmitted = false
        sharedState.lastFeedback = null
        break

      case 'party_ended':
        if (sharedState.room) {
          sharedState.room.phase = 'game_results'
          sharedState.room.players = payload.players
        }
        break

      case 'party_returned_to_lobby':
        sharedState.room = payload.room
        sharedState.hasSubmitted = false
        sharedState.lastFeedback = null
        sharedState.controllerType = 'waiting'
        break

      case 'party_sync':
        sharedState.room = payload.room
        break

      case 'error':
        sharedState.error = payload.message
        break
    }
  }

  function onMessage(handler: MessageHandler) {
    messageHandlers.add(handler)
    return () => messageHandlers.delete(handler)
  }

  // ============================================
  // Party Actions
  // ============================================

  async function createParty(hostName?: string, maxPlayers: number = 6) {
    await connect()
    send('create_party', { hostName, maxPlayers })
  }

  async function joinParty(roomCode: string, playerName?: string) {
    // If we're already in a different room, clear room state first (but keep connection)
    if (sharedState.room && sharedState.room.id !== roomCode) {
      console.log('[Party] Leaving old room:', sharedState.room.id, 'to join:', roomCode)
      sharedState.room = null
      sharedState.currentPlayer = null
      sharedState.error = null
      sharedState.controllerType = 'waiting'
      sharedState.hasSubmitted = false
      sharedState.lastFeedback = null
    }
    await connect()
    console.log('[Party] Joining room:', roomCode, 'as:', playerName)
    send('join_party', { roomCode, playerName })
  }

  function leaveParty() {
    send('leave_party')
    resetState()
  }

  function setReady(ready: boolean) {
    send('party_player_ready', { ready })
  }

  function startParty() {
    if (isHost.value) {
      send('start_party')
    }
  }

  // ============================================
  // Host-only Actions
  // ============================================

  function setPhase(phase: PartyPhase, gameData?: any) {
    if (isHost.value) {
      send('party_set_phase', { phase, gameData })
    }
  }

  function initGame(gameId: MiniGameId, prompt: any, controllerType: ControllerType) {
    if (isHost.value) {
      send('party_init_game', { gameId, prompt, controllerType })
    }
  }

  function startTimer(duration: number) {
    if (isHost.value) {
      send('party_start_timer', { duration })
    }
  }

  function revealAnswer(correctAnswer: any, scores: Record<string, { points: number; correct: boolean }>) {
    if (isHost.value) {
      send('party_reveal_answer', { correctAnswer, scores })
    }
  }

  function showScoreboard() {
    if (isHost.value) {
      send('party_show_scoreboard')
    }
  }

  function advanceRound() {
    if (isHost.value) {
      send('party_advance_round')
    }
  }

  function endParty() {
    if (isHost.value) {
      send('party_end')
    }
  }

  function returnToLobby() {
    if (isHost.value) {
      send('party_return_to_lobby')
    }
  }

  function kickPlayer(playerId: string) {
    if (isHost.value) {
      send('party_kick_player', { targetPlayerId: playerId })
    }
  }

  // ============================================
  // Player Actions
  // ============================================

  function submitAnswer(answer: any) {
    if (!sharedState.hasSubmitted) {
      send('party_submit_answer', { answer })
    }
  }

  function castVote(targetPlayerId: string) {
    if (!sharedState.hasSubmitted) {
      send('party_cast_vote', { targetPlayerId })
    }
  }

  function submitDrawing(drawingData: string) {
    if (!sharedState.hasSubmitted) {
      send('party_submit_drawing', { drawingData })
    }
  }

  function sendDrawStroke(stroke: string) {
    send('party_draw_stroke', { stroke })
  }

  function submitGuess(guess: string) {
    send('party_submit_guess', { guess })
  }

  function buzzIn() {
    if (!sharedState.hasSubmitted) {
      send('party_buzz_in')
    }
  }

  function requestSync() {
    send('party_sync_request')
  }

  // Note: Don't disconnect on unmount since we're using a singleton
  // The connection persists across page navigations

  return {
    // State
    state,
    isConnected,
    isHost,
    playerCount,
    canStart,
    roomCode,
    currentGame,
    phase,
    players,
    timerRemaining,

    // Connection
    connect,
    disconnect,

    // Party actions
    createParty,
    joinParty,
    leaveParty,
    setReady,
    startParty,

    // Host actions
    setPhase,
    initGame,
    startTimer,
    revealAnswer,
    showScoreboard,
    advanceRound,
    endParty,
    returnToLobby,
    kickPlayer,

    // Player actions
    submitAnswer,
    castVote,
    submitDrawing,
    sendDrawStroke,
    submitGuess,
    buzzIn,
    requestSync,

    // Event handling
    onMessage
  }
}
