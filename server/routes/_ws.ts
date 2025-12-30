import { lobbyManager } from '../utils/lobbyManager'

interface WSMessage {
  type: string
  payload?: any
}

export default defineWebSocketHandler({
  open(peer) {
    console.log(`[WS] Client connected: ${peer.id}`)
  },

  close(peer) {
    console.log(`[WS] Client disconnected: ${peer.id}`)

    // Handle player leaving
    const result = lobbyManager.leaveLobby(peer.id!)
    if (result) {
      const { lobby, wasHost } = result

      // Notify remaining players
      if (lobby.players.size > 0) {
        lobbyManager.broadcastToLobby(lobby.id, {
          type: 'player_left',
          payload: {
            playerId: peer.id,
            players: lobbyManager.getSerializablePlayers(lobby),
            newHostId: wasHost ? lobby.hostId : null
          }
        })
      }
    }
  },

  error(peer, error) {
    console.error(`[WS] Error for ${peer.id}:`, error)
  },

  message(peer, message) {
    let data: WSMessage
    try {
      data = JSON.parse(message.text())
    } catch {
      peer.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON' } }))
      return
    }

    const { type, payload } = data

    switch (type) {
      case 'get_lobbies': {
        const lobbies = lobbyManager.getPublicLobbies()
        peer.send(JSON.stringify({
          type: 'lobbies_list',
          payload: { lobbies }
        }))
        break
      }

      case 'create_lobby': {
        const { gameSlug, gameName, maxPlayers, playerName } = payload
        const lobby = lobbyManager.createLobby(gameSlug, gameName, maxPlayers || 4)
        const player = lobbyManager.joinLobby(lobby.id, peer, playerName)

        if (player) {
          peer.send(JSON.stringify({
            type: 'lobby_created',
            payload: {
              lobbyId: lobby.id,
              player: {
                id: player.id,
                name: player.name,
                color: player.color,
                isHost: player.isHost
              },
              players: lobbyManager.getSerializablePlayers(lobby),
              gameSlug: lobby.gameSlug,
              gameName: lobby.gameName,
              maxPlayers: lobby.maxPlayers
            }
          }))
        }
        break
      }

      case 'join_lobby': {
        const { lobbyId, playerName } = payload
        const lobby = lobbyManager.getLobby(lobbyId)

        if (!lobby) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Lobby not found' }
          }))
          return
        }

        if (lobby.status !== 'waiting') {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Game already in progress' }
          }))
          return
        }

        if (lobby.players.size >= lobby.maxPlayers) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Lobby is full' }
          }))
          return
        }

        const player = lobbyManager.joinLobby(lobbyId, peer, playerName)
        if (player) {
          // Send to joining player
          peer.send(JSON.stringify({
            type: 'lobby_joined',
            payload: {
              lobbyId: lobby.id,
              player: {
                id: player.id,
                name: player.name,
                color: player.color,
                isHost: player.isHost
              },
              players: lobbyManager.getSerializablePlayers(lobby),
              gameSlug: lobby.gameSlug,
              gameName: lobby.gameName,
              maxPlayers: lobby.maxPlayers
            }
          }))

          // Notify other players
          lobbyManager.broadcastToLobby(lobbyId, {
            type: 'player_joined',
            payload: {
              player: {
                id: player.id,
                name: player.name,
                color: player.color,
                isHost: player.isHost
              },
              players: lobbyManager.getSerializablePlayers(lobby)
            }
          }, player.id)
        }
        break
      }

      case 'leave_lobby': {
        const result = lobbyManager.leaveLobby(peer.id!)
        if (result) {
          const { lobby, wasHost } = result

          peer.send(JSON.stringify({
            type: 'lobby_left',
            payload: { success: true }
          }))

          // Notify remaining players
          if (lobby.players.size > 0) {
            lobbyManager.broadcastToLobby(lobby.id, {
              type: 'player_left',
              payload: {
                playerId: peer.id,
                players: lobbyManager.getSerializablePlayers(lobby),
                newHostId: wasHost ? lobby.hostId : null
              }
            })
          }
        }
        break
      }

      case 'player_ready': {
        const { ready } = payload
        const lobby = lobbyManager.setPlayerReady(peer.id!, ready)

        if (lobby) {
          lobbyManager.broadcastToLobby(lobby.id, {
            type: 'player_ready_changed',
            payload: {
              playerId: peer.id,
              ready,
              players: lobbyManager.getSerializablePlayers(lobby)
            }
          })
        }
        break
      }

      case 'start_game': {
        const lobby = lobbyManager.getPlayerLobby(peer.id!)
        if (!lobby) return

        const player = lobby.players.get(peer.id!)
        if (!player?.isHost) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Only the host can start the game' }
          }))
          return
        }

        // Check if all players are ready (except host)
        const allReady = Array.from(lobby.players.values())
          .filter(p => !p.isHost)
          .every(p => p.isReady)

        if (!allReady && lobby.players.size > 1) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Not all players are ready' }
          }))
          return
        }

        lobbyManager.startGame(lobby.id)

        lobbyManager.broadcastToLobby(lobby.id, {
          type: 'game_started',
          payload: {
            players: lobbyManager.getSerializablePlayers(lobby),
            gameState: lobby.gameState
          }
        })
        break
      }

      case 'game_action': {
        // Forward game-specific actions to all players
        const lobby = lobbyManager.getPlayerLobby(peer.id!)
        if (!lobby || lobby.status !== 'playing') return

        lobbyManager.broadcastToLobby(lobby.id, {
          type: 'game_action',
          payload: {
            playerId: peer.id,
            action: payload.action,
            data: payload.data
          }
        }, peer.id)
        break
      }

      case 'game_state_update': {
        // Host sends game state updates
        const lobby = lobbyManager.getPlayerLobby(peer.id!)
        if (!lobby) return

        const player = lobby.players.get(peer.id!)
        if (!player?.isHost) return

        lobbyManager.updateGameState(lobby.id, payload.state)

        lobbyManager.broadcastToLobby(lobby.id, {
          type: 'game_state_sync',
          payload: {
            state: lobby.gameState
          }
        }, peer.id)
        break
      }

      case 'update_score': {
        const { score } = payload
        lobbyManager.updatePlayerScore(peer.id!, score)

        const lobby = lobbyManager.getPlayerLobby(peer.id!)
        if (lobby) {
          lobbyManager.broadcastToLobby(lobby.id, {
            type: 'score_updated',
            payload: {
              playerId: peer.id,
              score,
              players: lobbyManager.getSerializablePlayers(lobby)
            }
          })
        }
        break
      }

      case 'end_game': {
        const lobby = lobbyManager.getPlayerLobby(peer.id!)
        if (!lobby) return

        lobbyManager.endGame(lobby.id)

        lobbyManager.broadcastToLobby(lobby.id, {
          type: 'game_ended',
          payload: {
            players: lobbyManager.getSerializablePlayers(lobby),
            winner: payload.winner
          }
        })
        break
      }

      case 'chat_message': {
        const lobby = lobbyManager.getPlayerLobby(peer.id!)
        if (!lobby) return

        const player = lobby.players.get(peer.id!)
        if (!player) return

        lobbyManager.broadcastToLobby(lobby.id, {
          type: 'chat_message',
          payload: {
            playerId: peer.id,
            playerName: player.name,
            playerColor: player.color,
            message: payload.message
          }
        })
        break
      }

      default:
        peer.send(JSON.stringify({
          type: 'error',
          payload: { message: `Unknown message type: ${type}` }
        }))
    }
  }
})
