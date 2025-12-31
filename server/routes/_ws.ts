import { lobbyManager } from '../utils/lobbyManager'
import { partyManager, type PartyPhase, type MiniGameId, type ControllerType } from '../utils/partyManager'

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

      // ============================================
      // Party Game Messages
      // ============================================

      case 'create_party': {
        const { hostName, maxPlayers } = payload
        const room = partyManager.createRoom(maxPlayers || 6)
        const player = partyManager.joinRoom(room.id, peer, hostName)

        if (player) {
          peer.send(JSON.stringify({
            type: 'party_created',
            payload: {
              room: partyManager.getSerializableRoom(room),
              player: {
                id: player.id,
                name: player.name,
                color: player.color,
                avatar: player.avatar,
                isHost: player.isHost,
                isReady: player.isReady,
                score: player.score,
                roundScore: player.roundScore,
                streak: player.streak,
                connected: player.connected,
                hasSubmitted: player.hasSubmitted
              }
            }
          }))
        }
        break
      }

      case 'join_party': {
        const { roomCode, playerName } = payload
        console.log('[Party] Join request for room:', roomCode, 'from:', playerName)
        const room = partyManager.getRoom(roomCode)

        if (!room) {
          console.log('[Party] Room not found:', roomCode)
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Party not found' }
          }))
          return
        }

        if (room.phase !== 'lobby') {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Party already in progress' }
          }))
          return
        }

        if (room.players.size >= room.maxPlayers) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Party is full' }
          }))
          return
        }

        const player = partyManager.joinRoom(roomCode, peer, playerName)
        if (player) {
          console.log('[Party] Player joined:', player.name, 'to room:', room.id, '- total players:', room.players.size)
          // Send to joining player - include all player fields
          peer.send(JSON.stringify({
            type: 'party_joined',
            payload: {
              room: partyManager.getSerializableRoom(room),
              player: {
                id: player.id,
                name: player.name,
                color: player.color,
                avatar: player.avatar,
                isHost: player.isHost,
                isReady: player.isReady,
                score: player.score,
                roundScore: player.roundScore,
                streak: player.streak,
                connected: player.connected,
                hasSubmitted: player.hasSubmitted
              }
            }
          }))

          // Notify other players
          partyManager.broadcastToRoom(roomCode, {
            type: 'party_player_joined',
            payload: {
              player: {
                id: player.id,
                name: player.name,
                color: player.color,
                avatar: player.avatar,
                isHost: player.isHost
              },
              players: partyManager.getSerializablePlayers(room)
            }
          }, player.id)
        }
        break
      }

      case 'leave_party': {
        const result = partyManager.leaveRoom(peer.id!)
        if (result) {
          const { room, wasHost } = result

          peer.send(JSON.stringify({
            type: 'party_left',
            payload: { success: true }
          }))

          // Notify remaining players
          if (room.players.size > 0) {
            partyManager.broadcastToRoom(room.id, {
              type: 'party_player_left',
              payload: {
                playerId: peer.id,
                players: partyManager.getSerializablePlayers(room),
                newHostId: wasHost ? room.hostId : null
              }
            })
          }
        }
        break
      }

      case 'party_player_ready': {
        const { ready } = payload
        const room = partyManager.setPlayerReady(peer.id!, ready)

        if (room) {
          partyManager.broadcastToRoom(room.id, {
            type: 'party_player_ready_changed',
            payload: {
              playerId: peer.id,
              ready,
              players: partyManager.getSerializablePlayers(room)
            }
          })
        }
        break
      }

      case 'start_party': {
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Only the host can start the party' }
          }))
          return
        }

        // Check if enough players
        if (room.players.size < 2) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Need at least 2 players to start' }
          }))
          return
        }

        // Check if all players are ready
        const allReady = Array.from(room.players.values())
          .filter(p => !p.isHost)
          .every(p => p.isReady)

        if (!allReady) {
          peer.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Not all players are ready' }
          }))
          return
        }

        partyManager.startParty(room.id)

        partyManager.broadcastToRoom(room.id, {
          type: 'party_started',
          payload: {
            room: partyManager.getSerializableRoom(room)
          }
        })
        break
      }

      case 'party_set_phase': {
        // Host only - advance game phase
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        const { phase, gameData } = payload
        partyManager.setPhase(room.id, phase)

        partyManager.broadcastToRoom(room.id, {
          type: 'party_phase_changed',
          payload: {
            phase,
            gameData,
            room: partyManager.getSerializableRoom(room)
          }
        })
        break
      }

      case 'party_init_game': {
        // Host initializes a mini-game with prompt
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        const { gameId, prompt, controllerType } = payload
        partyManager.initMiniGame(room.id, gameId, prompt)

        partyManager.broadcastToRoom(room.id, {
          type: 'party_game_init',
          payload: {
            gameId,
            prompt,
            controllerType,
            room: partyManager.getSerializableRoom(room)
          }
        })
        break
      }

      case 'party_start_timer': {
        // Host starts round timer
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        const { duration } = payload
        partyManager.setTimer(room.id, duration)

        partyManager.broadcastToRoom(room.id, {
          type: 'party_timer_started',
          payload: {
            duration,
            endTime: room.timerEndTime
          }
        })
        break
      }

      case 'party_submit_answer': {
        const { answer } = payload
        const result = partyManager.submitAnswer(peer.id!, answer)

        if (result) {
          const { room, allSubmitted } = result

          // Confirm to submitter
          peer.send(JSON.stringify({
            type: 'party_answer_received',
            payload: { success: true }
          }))

          // Notify host (and others) of submission count
          partyManager.broadcastToRoom(room.id, {
            type: 'party_submission_update',
            payload: {
              playerId: peer.id,
              submittedCount: room.miniGame?.submissions.size || 0,
              totalPlayers: room.players.size,
              allSubmitted,
              players: partyManager.getSerializablePlayers(room)
            }
          })
        }
        break
      }

      case 'party_cast_vote': {
        const { targetPlayerId } = payload
        const result = partyManager.submitAnswer(peer.id!, targetPlayerId)

        if (result) {
          const { room, allSubmitted } = result

          peer.send(JSON.stringify({
            type: 'party_vote_received',
            payload: { success: true, votedFor: targetPlayerId }
          }))

          partyManager.broadcastToRoom(room.id, {
            type: 'party_submission_update',
            payload: {
              playerId: peer.id,
              submittedCount: room.miniGame?.submissions.size || 0,
              totalPlayers: room.players.size,
              allSubmitted,
              players: partyManager.getSerializablePlayers(room)
            }
          })
        }
        break
      }

      case 'party_draw_stroke': {
        // Forward drawing stroke to all (for real-time drawing display)
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        partyManager.addDrawingStroke(room.id, payload.stroke)

        // Broadcast to everyone except drawer
        partyManager.broadcastToRoom(room.id, {
          type: 'party_draw_stroke',
          payload: {
            playerId: peer.id,
            stroke: payload.stroke
          }
        }, peer.id)
        break
      }

      case 'party_submit_drawing': {
        const { drawingData } = payload
        const result = partyManager.submitAnswer(peer.id!, drawingData)

        if (result) {
          peer.send(JSON.stringify({
            type: 'party_drawing_received',
            payload: { success: true }
          }))
        }
        break
      }

      case 'party_submit_guess': {
        const { guess } = payload
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        // Broadcast guess to host for checking
        partyManager.broadcastToRoom(room.id, {
          type: 'party_guess_submitted',
          payload: {
            playerId: peer.id,
            playerName: room.players.get(peer.id!)?.name,
            guess
          }
        })
        break
      }

      case 'party_buzz_in': {
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player || player.hasSubmitted) return

        // Record buzz timestamp
        const result = partyManager.submitAnswer(peer.id!, Date.now())

        if (result) {
          partyManager.broadcastToRoom(room.id, {
            type: 'party_player_buzzed',
            payload: {
              playerId: peer.id,
              playerName: player.name,
              playerColor: player.color,
              timestamp: Date.now()
            }
          })
        }
        break
      }

      case 'party_reveal_answer': {
        // Host reveals correct answer and scores
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        const { correctAnswer, scores } = payload

        // Update player scores
        if (scores) {
          for (const [playerId, scoreData] of Object.entries(scores as Record<string, { points: number; correct: boolean }>)) {
            partyManager.updatePlayerScore(playerId, scoreData.points, scoreData.correct)
          }
        }

        partyManager.broadcastToRoom(room.id, {
          type: 'party_answer_revealed',
          payload: {
            correctAnswer,
            scores,
            players: partyManager.getSerializablePlayers(room)
          }
        })
        break
      }

      case 'party_show_scoreboard': {
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        partyManager.broadcastToRoom(room.id, {
          type: 'party_scoreboard',
          payload: {
            players: partyManager.getSerializablePlayers(room)
          }
        })
        break
      }

      case 'party_advance_round': {
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        const result = partyManager.advanceRound(room.id)
        if (result) {
          const { room: updatedRoom, isGameOver, isPartyOver } = result

          partyManager.broadcastToRoom(room.id, {
            type: 'party_round_advanced',
            payload: {
              room: partyManager.getSerializableRoom(updatedRoom),
              isGameOver,
              isPartyOver
            }
          })
        }
        break
      }

      case 'party_end': {
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        partyManager.setPhase(room.id, 'game_results')

        partyManager.broadcastToRoom(room.id, {
          type: 'party_ended',
          payload: {
            players: partyManager.getSerializablePlayers(room),
            winner: Array.from(room.players.values()).sort((a, b) => b.score - a.score)[0]
          }
        })
        break
      }

      case 'party_return_to_lobby': {
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        // Reset room state
        partyManager.setPhase(room.id, 'lobby')
        room.currentGameIndex = 0
        room.miniGame = null
        room.players.forEach(p => {
          p.score = 0
          p.roundScore = 0
          p.streak = 0
          p.isReady = false
          p.hasSubmitted = false
        })

        partyManager.broadcastToRoom(room.id, {
          type: 'party_returned_to_lobby',
          payload: {
            room: partyManager.getSerializableRoom(room)
          }
        })
        break
      }

      case 'party_kick_player': {
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        const player = room.players.get(peer.id!)
        if (!player?.isHost) return

        const { targetPlayerId } = payload
        const targetPlayer = room.players.get(targetPlayerId)

        if (targetPlayer && !targetPlayer.isHost) {
          // Notify the kicked player
          partyManager.sendToPlayer(targetPlayerId, {
            type: 'party_kicked',
            payload: { message: 'You have been removed from the party' }
          })

          // Remove the player
          partyManager.leaveRoom(targetPlayerId)

          // Notify remaining players
          partyManager.broadcastToRoom(room.id, {
            type: 'party_player_left',
            payload: {
              playerId: targetPlayerId,
              players: partyManager.getSerializablePlayers(room),
              kicked: true
            }
          })
        }
        break
      }

      case 'party_sync_request': {
        // Player requests full state sync (e.g., after reconnect)
        const room = partyManager.getPlayerRoom(peer.id!)
        if (!room) return

        peer.send(JSON.stringify({
          type: 'party_sync',
          payload: {
            room: partyManager.getSerializableRoom(room)
          }
        }))
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
