import { lobbyManager } from '../utils/lobbyManager'

export default defineEventHandler(() => {
  return lobbyManager.getPublicLobbies()
})
