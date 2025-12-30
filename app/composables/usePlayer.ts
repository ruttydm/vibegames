import { readonly } from 'vue'

// Fun arcade-themed adjectives and nouns for random names
const adjectives = [
  'Neon', 'Pixel', 'Cyber', 'Retro', 'Turbo', 'Hyper', 'Ultra', 'Mega', 'Super', 'Power',
  'Cosmic', 'Laser', 'Atomic', 'Quantum', 'Binary', 'Digital', 'Electric', 'Sonic', 'Blazing', 'Shadow'
]

const nouns = [
  'Ninja', 'Wizard', 'Dragon', 'Phoenix', 'Panda', 'Tiger', 'Wolf', 'Falcon', 'Viper', 'Knight',
  'Warrior', 'Hunter', 'Ghost', 'Storm', 'Blaze', 'Thunder', 'Rider', 'Runner', 'Striker', 'Bomber'
]

function generateRandomName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

const STORAGE_KEY = 'vibegames_player_name'

export function usePlayer() {
  const playerName = useState<string>('playerName', () => '')
  const isEditingName = useState<boolean>('isEditingName', () => false)

  // Initialize player name from session storage or generate a new one
  const initPlayer = () => {
    if (import.meta.client) {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        playerName.value = stored
      } else {
        const newName = generateRandomName()
        playerName.value = newName
        sessionStorage.setItem(STORAGE_KEY, newName)
      }
    }
  }

  // Update the player name
  const setPlayerName = (name: string) => {
    const trimmed = name.trim()
    if (trimmed.length > 0 && trimmed.length <= 20) {
      playerName.value = trimmed
      if (import.meta.client) {
        sessionStorage.setItem(STORAGE_KEY, trimmed)
      }
    }
  }

  // Generate a new random name
  const randomizeName = () => {
    const newName = generateRandomName()
    setPlayerName(newName)
  }

  // Toggle edit mode
  const toggleEdit = () => {
    isEditingName.value = !isEditingName.value
  }

  const closeEdit = () => {
    isEditingName.value = false
  }

  return {
    playerName: readonly(playerName),
    isEditingName: readonly(isEditingName),
    initPlayer,
    setPlayerName,
    randomizeName,
    toggleEdit,
    closeEdit
  }
}
