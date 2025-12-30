export interface PublicLobby {
  id: string
  gameSlug: string
  gameName: string
  players: number
  maxPlayers: number
  status: string
}

export function useLobbies() {
  const lobbies = ref<PublicLobby[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const ws = ref<WebSocket | null>(null)

  async function fetchLobbies() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<PublicLobby[]>('/api/lobbies')
      lobbies.value = data
    } catch (e) {
      error.value = 'Failed to fetch lobbies'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function subscribeToLobbies() {
    if (ws.value?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/_ws`

    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      // Request initial list
      ws.value?.send(JSON.stringify({ type: 'get_lobbies' }))
    }

    ws.value.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data)
        if (type === 'lobbies_list') {
          lobbies.value = payload.lobbies
        }
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }

    ws.value.onclose = () => {
      ws.value = null
    }

    // Refresh periodically
    const interval = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ type: 'get_lobbies' }))
      }
    }, 5000)

    onUnmounted(() => {
      clearInterval(interval)
      ws.value?.close()
    })
  }

  function unsubscribe() {
    ws.value?.close()
    ws.value = null
  }

  return {
    lobbies,
    loading,
    error,
    fetchLobbies,
    subscribeToLobbies,
    unsubscribe
  }
}
