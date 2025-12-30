// Ant Colony Tycoon Engine
// A simulation/tycoon game where players manage an ant colony

export const CONFIG = {
  antBaseSpeed: 2.5,
  slowZoneSpeed: 0.35,
  sensorAngle: Math.PI / 3.5,
  sensorDist: 35,
  turnSpeed: 0.25,
  antLifeSpan: 2500,
  larvaMaturationTime: 150,
  maxPheromones: 50000,
  visionRadius: 70,
  dropDistance: 10,
  gridSize: 20
}

export interface Upgrade {
  level: number
  cost: number
  val: number
  name: string
}

export interface GameState {
  biomass: number
  spawnTimer: number
  autoFoodTimer: number
  upgrades: {
    spawn: Upgrade
    speed: Upgrade
    cap: Upgrade
    pher: Upgrade
  }
}

export function createInitialState(): GameState {
  return {
    biomass: 20,
    spawnTimer: 0,
    autoFoodTimer: 0,
    upgrades: {
      spawn: { level: 1, cost: 50, val: 200, name: 'Incubator' },
      speed: { level: 1, cost: 100, val: 1.0, name: 'Metabolism' },
      cap: { level: 1, cost: 200, val: 50, name: 'Hive Size' },
      pher: { level: 1, cost: 300, val: 0.002, name: 'Pheromones' }
    }
  }
}

export function applyUpgrade(state: GameState, type: keyof GameState['upgrades']): boolean {
  const up = state.upgrades[type]
  if (state.biomass >= up.cost) {
    state.biomass -= up.cost
    up.level++
    up.cost = Math.floor(up.cost * 1.5)

    switch (type) {
      case 'spawn':
        up.val = Math.max(20, up.val * 0.8) // Faster spawn
        break
      case 'speed':
        up.val += 0.2 // Faster move
        break
      case 'cap':
        up.val += 50 // More ants
        break
      case 'pher':
        up.val *= 0.8 // Slower decay (better trails)
        break
    }
    return true
  }
  return false
}
