// Neural Network Runtime for EvoSim
// Efficient feedforward evaluation with variable topology

import type { BrainGenome, NeuronGene, ConnectionGene } from './genome'
import { NUM_INPUTS, NUM_OUTPUTS } from './genome'

export class NeuralNetwork {
  private neurons: Map<number, NeuronGene>
  private connectionsByTarget: Map<number, ConnectionGene[]>
  private values: Map<number, number>
  private evaluationOrder: number[]
  private inputIds: number[]
  private outputIds: number[]

  constructor(genome: BrainGenome) {
    this.neurons = new Map()
    this.connectionsByTarget = new Map()
    this.values = new Map()
    this.evaluationOrder = []
    this.inputIds = []
    this.outputIds = []

    this.buildFromGenome(genome)
  }

  /**
   * Build the network structure from genome
   */
  private buildFromGenome(genome: BrainGenome): void {
    // Index neurons
    for (const neuron of genome.neurons) {
      this.neurons.set(neuron.id, neuron)
      this.values.set(neuron.id, 0)

      if (neuron.type === 'input') {
        this.inputIds.push(neuron.id)
      } else if (neuron.type === 'output') {
        this.outputIds.push(neuron.id)
      }
    }

    // Sort input/output IDs for consistent ordering
    this.inputIds.sort((a, b) => a - b)
    this.outputIds.sort((a, b) => a - b)

    // Index enabled connections by target neuron
    for (const conn of genome.connections) {
      if (!conn.enabled) continue

      if (!this.connectionsByTarget.has(conn.to)) {
        this.connectionsByTarget.set(conn.to, [])
      }
      this.connectionsByTarget.get(conn.to)!.push(conn)
    }

    // Compute evaluation order using topological sort
    this.computeEvaluationOrder()
  }

  /**
   * Topological sort to determine evaluation order
   * Ensures neurons are evaluated after their inputs
   */
  private computeEvaluationOrder(): void {
    const order: number[] = []
    const visited = new Set<number>()
    const visiting = new Set<number>()

    const visit = (id: number): void => {
      if (visited.has(id)) return
      if (visiting.has(id)) {
        // Cycle detected - skip (recurrent connections not supported in this simple impl)
        return
      }

      const neuron = this.neurons.get(id)
      if (!neuron) return

      // Input neurons don't need dependencies
      if (neuron.type === 'input') {
        visited.add(id)
        return
      }

      visiting.add(id)

      // Visit all neurons that feed into this one
      const connections = this.connectionsByTarget.get(id) || []
      for (const conn of connections) {
        visit(conn.from)
      }

      visiting.delete(id)
      visited.add(id)
      order.push(id)
    }

    // Start from output neurons and work backwards
    for (const outputId of this.outputIds) {
      visit(outputId)
    }

    // Also visit any hidden neurons not reachable from outputs
    for (const [id, neuron] of this.neurons) {
      if (neuron.type === 'hidden' && !visited.has(id)) {
        visit(id)
      }
    }

    this.evaluationOrder = order
  }

  /**
   * Activation functions
   */
  private activate(value: number, neuron: NeuronGene): number {
    switch (neuron.activation) {
      case 'sigmoid':
        return 1 / (1 + Math.exp(-value))
      case 'tanh':
        return Math.tanh(value)
      case 'relu':
        return Math.max(0, value)
      default:
        return Math.tanh(value)
    }
  }

  /**
   * Evaluate the network with given inputs
   * Returns array of output values
   */
  evaluate(inputs: number[]): number[] {
    // Set input values
    for (let i = 0; i < inputs.length && i < this.inputIds.length; i++) {
      this.values.set(this.inputIds[i], inputs[i])
    }

    // Forward pass in topological order
    for (const neuronId of this.evaluationOrder) {
      const neuron = this.neurons.get(neuronId)
      if (!neuron) continue

      // Sum weighted inputs
      let sum = 0
      const connections = this.connectionsByTarget.get(neuronId) || []
      for (const conn of connections) {
        const inputValue = this.values.get(conn.from) || 0
        sum += inputValue * conn.weight
      }

      // Apply activation
      this.values.set(neuronId, this.activate(sum, neuron))
    }

    // Return output values
    return this.outputIds.map(id => this.values.get(id) || 0)
  }

  /**
   * Get current value of a specific neuron (for debugging/visualization)
   */
  getNeuronValue(id: number): number {
    return this.values.get(id) || 0
  }

  /**
   * Get network statistics
   */
  getStats(): { inputs: number; outputs: number; hidden: number; connections: number } {
    let hidden = 0
    for (const neuron of this.neurons.values()) {
      if (neuron.type === 'hidden') hidden++
    }

    let connections = 0
    for (const conns of this.connectionsByTarget.values()) {
      connections += conns.length
    }

    return {
      inputs: this.inputIds.length,
      outputs: this.outputIds.length,
      hidden,
      connections
    }
  }
}

/**
 * Create a neural network from a brain genome
 */
export function createNetwork(genome: BrainGenome): NeuralNetwork {
  return new NeuralNetwork(genome)
}
