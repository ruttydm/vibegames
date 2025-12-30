// Neural Network Genome for EvoSim
// NEAT-inspired variable topology neural networks

export interface NeuronGene {
  id: number
  type: 'input' | 'hidden' | 'output'
  activation: 'sigmoid' | 'tanh' | 'relu'
}

export interface ConnectionGene {
  from: number
  to: number
  weight: number
  enabled: boolean
  innovation: number
}

export interface BrainGenome {
  neurons: NeuronGene[]
  connections: ConnectionGene[]
  nextNeuronId: number
  nextInnovation: number
}

// Input neuron IDs (0-7)
export const INPUT_IDS = {
  FOOD_DIST: 0,
  FOOD_ANGLE: 1,
  PREY_DIST: 2,
  PREY_ANGLE: 3,
  PREDATOR_NEAR: 4,
  ENERGY: 5,
  SPEED: 6,
  BIAS: 7
}

// Output neuron IDs (8-9)
export const OUTPUT_IDS = {
  TURN: 8,
  THRUST: 9
}

export const NUM_INPUTS = 8
export const NUM_OUTPUTS = 2

// Global innovation counter for tracking gene history
let globalInnovation = 0

export function getNextInnovation(): number {
  return globalInnovation++
}

export function resetInnovationCounter(): void {
  globalInnovation = 0
}

/**
 * Generate initial brain with minimal topology
 * 8 inputs -> 2 outputs with random sparse connections
 */
export function generateInitialBrain(): BrainGenome {
  const neurons: NeuronGene[] = []
  const connections: ConnectionGene[] = []

  // Create input neurons (IDs 0-7)
  for (let i = 0; i < NUM_INPUTS; i++) {
    neurons.push({
      id: i,
      type: 'input',
      activation: 'sigmoid' // Not used for inputs
    })
  }

  // Create output neurons (IDs 8-9)
  for (let i = 0; i < NUM_OUTPUTS; i++) {
    neurons.push({
      id: NUM_INPUTS + i,
      type: 'output',
      activation: 'tanh' // tanh for -1 to 1 range
    })
  }

  // Create random initial connections (8-16 connections)
  const numConnections = Math.floor(Math.random() * 9) + 8

  for (let i = 0; i < numConnections; i++) {
    const fromId = Math.floor(Math.random() * NUM_INPUTS) // Random input
    const toId = NUM_INPUTS + Math.floor(Math.random() * NUM_OUTPUTS) // Random output

    // Check if connection already exists
    const exists = connections.some(c => c.from === fromId && c.to === toId)
    if (!exists) {
      connections.push({
        from: fromId,
        to: toId,
        weight: (Math.random() - 0.5) * 4, // -2 to 2
        enabled: true,
        innovation: getNextInnovation()
      })
    }
  }

  return {
    neurons,
    connections,
    nextNeuronId: NUM_INPUTS + NUM_OUTPUTS,
    nextInnovation: globalInnovation
  }
}

/**
 * Deep clone a brain genome
 */
export function cloneBrain(brain: BrainGenome): BrainGenome {
  return {
    neurons: brain.neurons.map(n => ({ ...n })),
    connections: brain.connections.map(c => ({ ...c })),
    nextNeuronId: brain.nextNeuronId,
    nextInnovation: brain.nextInnovation
  }
}

/**
 * Mutate weights of existing connections
 */
function mutateWeights(brain: BrainGenome, power: number): void {
  for (const conn of brain.connections) {
    if (Math.random() < 0.1) {
      // 10% chance to completely reset weight
      conn.weight = (Math.random() - 0.5) * 4
    } else {
      // 90% chance to perturb
      conn.weight += (Math.random() - 0.5) * 2 * power
      // Clamp weights
      conn.weight = Math.max(-4, Math.min(4, conn.weight))
    }
  }
}

/**
 * Add a new connection between two unconnected neurons
 */
function addConnection(brain: BrainGenome): boolean {
  // Get all possible from neurons (inputs + hidden)
  const fromNeurons = brain.neurons.filter(n => n.type !== 'output')
  // Get all possible to neurons (hidden + outputs)
  const toNeurons = brain.neurons.filter(n => n.type !== 'input')

  // Try to find an unconnected pair
  const attempts = 20
  for (let i = 0; i < attempts; i++) {
    const from = fromNeurons[Math.floor(Math.random() * fromNeurons.length)]
    const to = toNeurons[Math.floor(Math.random() * toNeurons.length)]

    // Can't connect to itself
    if (from.id === to.id) continue

    // Check if connection exists
    const exists = brain.connections.some(
      c => c.from === from.id && c.to === to.id
    )

    if (!exists) {
      brain.connections.push({
        from: from.id,
        to: to.id,
        weight: (Math.random() - 0.5) * 4,
        enabled: true,
        innovation: getNextInnovation()
      })
      return true
    }
  }

  return false
}

/**
 * Add a new neuron by splitting an existing connection
 * Old: A -> B
 * New: A -> C -> B (where C is new hidden neuron)
 */
function addNeuron(brain: BrainGenome): boolean {
  // Get enabled connections
  const enabledConnections = brain.connections.filter(c => c.enabled)
  if (enabledConnections.length === 0) return false

  // Pick random connection to split
  const conn = enabledConnections[Math.floor(Math.random() * enabledConnections.length)]

  // Disable original connection
  conn.enabled = false

  // Create new hidden neuron
  const newNeuronId = brain.nextNeuronId++
  brain.neurons.push({
    id: newNeuronId,
    type: 'hidden',
    activation: Math.random() < 0.5 ? 'tanh' : 'relu'
  })

  // Create two new connections
  // A -> C with weight 1 (preserves signal)
  brain.connections.push({
    from: conn.from,
    to: newNeuronId,
    weight: 1,
    enabled: true,
    innovation: getNextInnovation()
  })

  // C -> B with original weight (preserves behavior initially)
  brain.connections.push({
    from: newNeuronId,
    to: conn.to,
    weight: conn.weight,
    enabled: true,
    innovation: getNextInnovation()
  })

  return true
}

/**
 * Remove a connection by disabling it
 */
function removeConnection(brain: BrainGenome): boolean {
  const enabledConnections = brain.connections.filter(c => c.enabled)
  if (enabledConnections.length <= 2) return false // Keep at least some connections

  const conn = enabledConnections[Math.floor(Math.random() * enabledConnections.length)]
  conn.enabled = false
  return true
}

/**
 * Toggle a connection's enabled state
 */
function toggleConnection(brain: BrainGenome): boolean {
  if (brain.connections.length === 0) return false

  const conn = brain.connections[Math.floor(Math.random() * brain.connections.length)]
  conn.enabled = !conn.enabled
  return true
}

export interface BrainMutationRates {
  weightMutation: number    // Chance to mutate weights (0.8)
  addConnection: number     // Chance to add connection (0.05)
  addNeuron: number         // Chance to add neuron (0.03)
  removeConnection: number  // Chance to remove connection (0.02)
  toggleConnection: number  // Chance to toggle connection (0.01)
  weightPower: number       // Mutation strength for weights (0.5)
}

export const DEFAULT_MUTATION_RATES: BrainMutationRates = {
  weightMutation: 0.8,
  addConnection: 0.05,
  addNeuron: 0.03,
  removeConnection: 0.02,
  toggleConnection: 0.01,
  weightPower: 0.5
}

/**
 * Mutate a brain genome
 */
export function mutateBrain(
  brain: BrainGenome,
  rates: BrainMutationRates = DEFAULT_MUTATION_RATES
): BrainGenome {
  const newBrain = cloneBrain(brain)

  // Weight mutations (most common)
  if (Math.random() < rates.weightMutation) {
    mutateWeights(newBrain, rates.weightPower)
  }

  // Structural mutations (less common)
  if (Math.random() < rates.addConnection) {
    addConnection(newBrain)
  }

  if (Math.random() < rates.addNeuron) {
    addNeuron(newBrain)
  }

  if (Math.random() < rates.removeConnection) {
    removeConnection(newBrain)
  }

  if (Math.random() < rates.toggleConnection) {
    toggleConnection(newBrain)
  }

  return newBrain
}

/**
 * Get statistics about a brain genome
 */
export function getBrainStats(brain: BrainGenome): {
  neurons: number
  hiddenNeurons: number
  connections: number
  enabledConnections: number
} {
  return {
    neurons: brain.neurons.length,
    hiddenNeurons: brain.neurons.filter(n => n.type === 'hidden').length,
    connections: brain.connections.length,
    enabledConnections: brain.connections.filter(c => c.enabled).length
  }
}
