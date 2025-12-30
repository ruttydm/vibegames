export interface Player {
  id: string
  name: string
  color: string
  isHost: boolean
  isReady: boolean
  score: number
}

export interface LobbyInfo {
  id: string
  gameSlug: string
  gameName: string
  players: number
  maxPlayers: number
  status: string
}

export interface LobbyState {
  id: string | null
  gameSlug: string | null
  gameName: string | null
  players: Player[]
  maxPlayers: number
  status: 'disconnected' | 'connecting' | 'waiting' | 'playing' | 'finished'
  currentPlayer: Player | null
  gameState: Record<string, any>
  error: string | null
}

type MessageHandler = (type: string, payload: any) => void

export function useMultiplayer() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const messageHandlers = ref<Set<MessageHandler>>(new Set())

  const lobby = reactive<LobbyState>({
    id: null,
    gameSlug: null,
    gameName: null,
    players: [],
    maxPlayers: 4,
    status: 'disconnected',
    currentPlayer: null,
    gameState: {},
    error: null
  })

  const isHost = computed(() => lobby.currentPlayer?.isHost ?? false)
  const playerCount = computed(() => lobby.players.length)
  const canStart = computed(() => {
    if (!isHost.value) return false
    if (lobby.players.length < 2) return true // Can play alone
    return lobby.players.filter(p => !p.isHost).every(p => p.isReady)
  })

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      lobby.status = 'connecting'
      lobby.error = null

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/_ws`

      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        isConnected.value = true
        lobby.status = 'disconnected'
        resolve()
      }

      ws.value.onclose = () => {
        isConnected.value = false
        lobby.status = 'disconnected'
        ws.value = null
      }

      ws.value.onerror = (error) => {
        lobby.error = 'Connection failed'
        reject(error)
      }

      ws.value.onmessage = (event) => {
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
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    resetLobby()
  }

  function resetLobby() {
    lobby.id = null
    lobby.gameSlug = null
    lobby.gameName = null
    lobby.players = []
    lobby.maxPlayers = 4
    lobby.status = 'disconnected'
    lobby.currentPlayer = null
    lobby.gameState = {}
    lobby.error = null
  }

  function send(type: string, payload?: any) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type, payload }))
    }
  }

  function handleMessage(type: string, payload: any) {
    // Notify all registered handlers
    messageHandlers.value.forEach(handler => handler(type, payload))

    switch (type) {
      case 'lobby_created':
      case 'lobby_joined':
        lobby.id = payload.lobbyId
        lobby.gameSlug = payload.gameSlug
        lobby.gameName = payload.gameName
        lobby.maxPlayers = payload.maxPlayers
        lobby.players = payload.players
        lobby.currentPlayer = payload.player
        lobby.status = 'waiting'
        break

      case 'player_joined':
      case 'player_left':
      case 'player_ready_changed':
      case 'score_updated':
        lobby.players = payload.players
        if (payload.newHostId && lobby.currentPlayer) {
          lobby.currentPlayer.isHost = lobby.currentPlayer.id === payload.newHostId
        }
        break

      case 'lobby_left':
        resetLobby()
        break

      case 'game_started':
        lobby.status = 'playing'
        lobby.players = payload.players
        lobby.gameState = payload.gameState
        break

      case 'game_state_sync':
        lobby.gameState = payload.state
        break

      case 'game_ended':
        lobby.status = 'finished'
        lobby.players = payload.players
        break

      case 'error':
        lobby.error = payload.message
        break
    }
  }

  function onMessage(handler: MessageHandler) {
    messageHandlers.value.add(handler)
    return () => messageHandlers.value.delete(handler)
  }

  // Lobby actions
  async function createLobby(gameSlug: string, gameName: string, maxPlayers: number = 4, playerName?: string) {
    await connect()
    send('create_lobby', { gameSlug, gameName, maxPlayers, playerName })
  }

  async function joinLobby(lobbyId: string, playerName?: string) {
    await connect()
    send('join_lobby', { lobbyId, playerName })
  }

  function leaveLobby() {
    send('leave_lobby')
    resetLobby()
  }

  function setReady(ready: boolean) {
    send('player_ready', { ready })
  }

  function startGame() {
    if (isHost.value) {
      send('start_game')
    }
  }

  function sendGameAction(action: string, data?: any) {
    send('game_action', { action, data })
  }

  function updateGameState(state: Record<string, any>) {
    if (isHost.value) {
      send('game_state_update', { state })
    }
  }

  function updateScore(score: number) {
    send('update_score', { score })
  }

  function endGame(winner?: string) {
    send('end_game', { winner })
  }

  function sendChatMessage(message: string) {
    send('chat_message', { message })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (lobby.id) {
      leaveLobby()
    }
    disconnect()
  })

  return {
    // State
    lobby,
    isConnected,
    isHost,
    playerCount,
    canStart,

    // Connection
    connect,
    disconnect,

    // Lobby actions
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startGame,

    // Game actions
    sendGameAction,
    updateGameState,
    updateScore,
    endGame,

    // Chat
    sendChatMessage,

    // Event handling
    onMessage
  }
}
