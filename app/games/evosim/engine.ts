import * as PIXI from 'pixi.js'
import { generateInitialBrain, mutateBrain, type BrainGenome } from './genome'

// Re-export brain types
export type { BrainGenome, NeuronGene, ConnectionGene } from './genome'
export { generateInitialBrain, mutateBrain, getBrainStats } from './genome'

// Constants
export const WORLD_W = 8000
export const WORLD_H = 8000

export const CONFIG = {
  foodSpawnRate: 5,
  foodValue: 100,            // Food stores 100 energy units (plant biomass)
  maxFood: 40000,
  startPop: 50,
  mutationRate: 0.25,
  friction: 0.90,
  baseSpeed: 0.15,
  startEnergy: 80,
  metabolismBase: 0.1,
  metabolismPerCell: 0.015,
  agingFactor: 0.0005,
  minPredators: 8,
  minPrey: 15,
  // Ecological efficiency (based on 10% rule)
  efficiencyPlantToHerbivore: 0.15,  // 15% - ectotherms are more efficient
  efficiencyHerbivoreToPredator: 0.10, // 10% - standard trophic transfer
  efficiencyPredatorToPredator: 0.05,  // 5% - apex predators, very inefficient
  batteryCapacity: 50,                // Extra energy capacity per battery cell
  // Neural network mutation rates
  brainMutationRate: 0.8,      // Chance to mutate weights
  addConnectionRate: 0.05,     // Chance to add connection
  addNeuronRate: 0.03,         // Chance to add hidden neuron
  removeConnectionRate: 0.02,  // Chance to remove connection
  weightMutationPower: 0.5     // Max weight change per mutation
}

export const TYPE_DEFS = {
  CORE: { id: 0, color: 0xffffff, size: 10, cost: 0 },
  MOUTH: { id: 1, color: 0x10b981, size: 6, cost: 1 },
  MOVER: { id: 2, color: 0x3b82f6, size: 6, cost: 0.8 },
  SPIKE: { id: 3, color: 0xef4444, size: 5, cost: 0.5 },
  BATTERY: { id: 4, color: 0xfbbf24, size: 8, cost: 0.6 },  // Yellow energy storage
  ARMOR: { id: 5, color: 0x7c3aed, size: 7, cost: 1.2 },
  EYE: { id: 6, color: 0xffffff, size: 5, cost: 1.0 }
}

// Spatial Hash for efficient collision detection
export class SpatialHash {
  cellSize: number
  grid: Map<string, any[]>

  constructor(cellSize: number) {
    this.cellSize = cellSize
    this.grid = new Map()
  }

  key(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`
  }

  clear(): void {
    this.grid.clear()
  }

  add(item: any): void {
    const ix = item.pos ? item.pos.x : item.x
    const iy = item.pos ? item.pos.y : item.y
    const k = this.key(ix, iy)
    if (!this.grid.has(k)) this.grid.set(k, [])
    this.grid.get(k)!.push(item)
  }

  remove(item: any): void {
    const ix = item.pos ? item.pos.x : item.x
    const iy = item.pos ? item.pos.y : item.y
    const k = this.key(ix, iy)
    if (this.grid.has(k)) {
      const arr = this.grid.get(k)!
      const idx = arr.indexOf(item)
      if (idx !== -1) arr.splice(idx, 1)
    }
  }

  query(x: number, y: number, range: number): any[] {
    const res: any[] = []
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    for (let i = cx - range; i <= cx + range; i++) {
      for (let j = cy - range; j <= cy + range; j++) {
        const k = `${i},${j}`
        if (this.grid.has(k)) {
          const cell = this.grid.get(k)!
          for (let l = 0; l < cell.length; l++) res.push(cell[l])
        }
      }
    }
    return res
  }
}

// DNA & Genome generation
export interface GenomeNode {
  type: number
  angle: number
  length: number
  children: GenomeNode[]
}

export interface DNA {
  hue: number
  root: GenomeNode
  brain: BrainGenome
}

export function generateRandomGenome(depth = 0): GenomeNode {
  if (depth === 0) {
    const children: GenomeNode[] = []
    const numChildren = Math.floor(Math.random() * 4) + 1
    for (let i = 0; i < numChildren; i++) children.push(generateRandomGenome(depth + 1))
    return { type: TYPE_DEFS.CORE.id, angle: 0, length: 0, children: children }
  }

  const weights = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6]
  const type = weights[Math.floor(Math.random() * weights.length)]

  const children: GenomeNode[] = []
  if (depth < 3 && Math.random() < 0.4) {
    const num = Math.floor(Math.random() * 2)
    for (let i = 0; i < num; i++) children.push(generateRandomGenome(depth + 1))
  }

  return {
    type: type,
    angle: (Math.random() - 0.5) * 2.0,
    length: Math.random() * 15 + 10,
    children: children
  }
}

// Helper functions
export function hslToHex(h: number, s: number, l: number): number {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return parseInt(`0x${f(0)}${f(8)}${f(4)}`)
}

export function getRoleName(s: { damage: number; mouth: number; battery: number; armor: number; speedMod: number }): string {
  if (s.damage > 5) return 'Predator'
  if (s.battery > 2) return 'Hoarder'
  if (s.armor > 2) return 'Tank'
  if (s.speedMod > 3) return 'Scout'
  if (s.mouth > 2) return 'Grazer'
  return 'Organism'
}

// Predator genome template
export function createPredatorGenome(): DNA {
  const root: GenomeNode = {
    type: TYPE_DEFS.CORE.id,
    angle: 0,
    length: 0,
    children: [
      { type: TYPE_DEFS.EYE.id, angle: 0, length: 8, children: [] },
      { type: TYPE_DEFS.SPIKE.id, angle: 0.4, length: 18, children: [] },
      { type: TYPE_DEFS.SPIKE.id, angle: -0.4, length: 18, children: [] },
      { type: TYPE_DEFS.MOVER.id, angle: 2.5, length: 15, children: [] },
      { type: TYPE_DEFS.MOVER.id, angle: -2.5, length: 15, children: [] }
    ]
  }
  return { hue: 0, root, brain: generateInitialBrain() }
}

// Prey genome template
export function createPreyGenome(): DNA {
  const root: GenomeNode = {
    type: TYPE_DEFS.CORE.id,
    angle: 0,
    length: 0,
    children: [
      { type: TYPE_DEFS.MOUTH.id, angle: 0, length: 12, children: [] },
      { type: TYPE_DEFS.BATTERY.id, angle: 2, length: 15, children: [] },
      { type: TYPE_DEFS.BATTERY.id, angle: -2, length: 15, children: [] },
      { type: TYPE_DEFS.MOVER.id, angle: 3.14, length: 10, children: [] }
    ]
  }
  return { hue: 120, root, brain: generateInitialBrain() }
}

// Mutation function
export function mutate(dna: DNA): DNA {
  const newDna = JSON.parse(JSON.stringify(dna)) as DNA
  if (Math.random() < 0.5) newDna.hue = (newDna.hue + (Math.random() - 0.5) * 20) % 360

  const mutateNode = (node: GenomeNode) => {
    if (Math.random() < 0.1) node.angle += Math.random() - 0.5
    if (Math.random() < 0.1) node.length += (Math.random() - 0.5) * 5
    if (node.length < 5) node.length = 5

    if (Math.random() < 0.02) {
      const types = [1, 2, 3, 4, 5, 6]
      node.type = types[Math.floor(Math.random() * types.length)]
    }

    if (node.children.length < 3 && Math.random() < 0.05) {
      const types = [1, 2, 3, 4, 5, 6]
      node.children.push({
        type: types[Math.floor(Math.random() * types.length)],
        angle: (Math.random() - 0.5) * 2,
        length: 10,
        children: []
      })
    }

    if (node.children.length > 0 && Math.random() < 0.02) {
      node.children.pop()
    }

    node.children.forEach(mutateNode)
  }

  mutateNode(newDna.root)

  // Mutate brain using neural network mutation rates
  newDna.brain = mutateBrain(newDna.brain, {
    weightMutation: CONFIG.brainMutationRate,
    addConnection: CONFIG.addConnectionRate,
    addNeuron: CONFIG.addNeuronRate,
    removeConnection: CONFIG.removeConnectionRate,
    toggleConnection: 0.01,
    weightPower: CONFIG.weightMutationPower
  })

  return newDna
}

// Export types
export interface OrganismStats {
  mass: number
  maxEnergy: number
  damage: number
  sensor: number
  speed: number
  mouthCount: number
  battery: number
  reproThreshold: number
  turnSpeed: number
}

export interface Cell {
  x: number
  y: number
  size: number
  type: number
}

export interface Camera {
  x: number
  y: number
  zoom: number
  targetZoom: number
  dragging: boolean
  lastMouse?: { x: number; y: number }
}
