<script setup lang="ts">
import * as PIXI from 'pixi.js'
import { Chart, registerables } from 'chart.js'
import {
  WORLD_W,
  WORLD_H,
  CONFIG,
  TYPE_DEFS,
  SpatialHash,
  generateRandomGenome,
  hslToHex,
  getRoleName,
  createPredatorGenome,
  createPreyGenome,
  mutate,
  generateInitialBrain,
  getBrainStats,
  type DNA,
  type GenomeNode,
  type OrganismStats,
  type Cell,
  type Camera
} from '~/games/evosim/engine'
import { NeuralNetwork } from '~/games/evosim/neural'
import { INPUT_IDS, OUTPUT_IDS, NUM_INPUTS, NUM_OUTPUTS } from '~/games/evosim/genome'

Chart.register(...registerables)

const props = defineProps<{
  isFullscreen?: boolean
}>()

const emit = defineEmits<{
  (e: 'score', score: number): void
  (e: 'gameOver', winner: string | null): void
}>()

// Refs
const canvasContainer = ref<HTMLElement | null>(null)
const minimapCanvas = ref<HTMLCanvasElement | null>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)

// State
const popCount = ref(0)
const predCount = ref(0)
const genRecord = ref(0)
const avgSize = ref('0')
const fpsCounter = ref(60)

// Inspector state
const showInspector = ref(false)
const insId = ref('')
const insGen = ref(0)
const insNrg = ref(0)
const insState = ref('')
const insSpecies = ref('')
const insBrain = ref('')

// Config refs for sliders (defaults centered at ~50% of range)
const metaRate = ref(0.10)
const cellRate = ref(0.015)
const foodRate = ref(5)
const foodVal = ref(100)        // Match CONFIG.foodValue
const mutRate = ref(25)
const batteryCapRef = ref(50)   // Battery capacity
const trophicEffRef = ref(0.15) // Plant→Herbivore efficiency

// Neural network canvas
const neuralCanvas = ref<HTMLCanvasElement | null>(null)

// Game state
let app: PIXI.Application | null = null
let worldContainer: PIXI.Container
let foodLayer: PIXI.Container
let particleLayer: PIXI.Container
let organismLayer: PIXI.Container
let uiLayer: PIXI.Container

let circleTexture: PIXI.Texture
let lineTexture: PIXI.Texture

let organisms: Organism[] = []
let foods: Food[] = []
let particles: Particle[] = []
let maxGen = 1
let selectedOrganism: Organism | null = null

const foodPool: Food[] = []
const particlePool: Particle[] = []

const foodGrid = new SpatialHash(250)
const orgGrid = new SpatialHash(250)

const camera: Camera = {
  x: WORLD_W / 2,
  y: WORLD_H / 2,
  zoom: 0.4,
  targetZoom: 0.4,
  dragging: false
}

let chartInstance: Chart | null = null

// Classes
class Organism {
  pos: { x: number; y: number }
  vel: { x: number; y: number }
  rotation: number
  dna: DNA
  generation: number
  age: number
  id: number
  stats: OrganismStats
  cells: Cell[]
  container: PIXI.Container
  energy: number
  flash: number
  invuln: number
  dead: boolean
  target: any
  speciesName: string
  reproCooldown: number
  brain: NeuralNetwork

  constructor(x: number, y: number, dna?: DNA, generation = 1) {
    this.pos = { x, y }
    this.vel = { x: 0, y: 0 }
    this.rotation = Math.random() * Math.PI * 2
    this.dna = dna || { hue: Math.random() * 360, root: generateRandomGenome(), brain: generateInitialBrain() }
    this.generation = generation
    this.age = 0
    this.id = Math.floor(Math.random() * 100000)
    this.brain = new NeuralNetwork(this.dna.brain)

    this.stats = {
      mass: 0,
      maxEnergy: 100,
      damage: 0,
      sensor: 0,
      speed: 0,
      mouthCount: 0,
      battery: 0,
      reproThreshold: 0,
      turnSpeed: 0
    }
    this.cells = []

    this.container = new PIXI.Container()
    this.container.x = x
    this.container.y = y
    organismLayer.addChild(this.container)

    this.buildBody()

    this.energy = CONFIG.startEnergy
    this.flash = 0
    this.invuln = 50
    this.dead = false
    this.target = null
    this.speciesName = ''
    this.reproCooldown = 120 // Start with cooldown to prevent immediate spawn chains
  }

  buildBody() {
    this.container.removeChildren()
    this.cells = []

    const stats = { mass: 0, damage: 0, sensor: 100, battery: 0, speedMod: 0, mouth: 0, armor: 0 }
    const coreColor = hslToHex(this.dna.hue, 75, 55)

    const buildNode = (node: GenomeNode, parentRef: { x: number; y: number; absAngle: number }) => {
      const def = Object.values(TYPE_DEFS).find((t) => t.id === node.type)!

      stats.mass += def.size
      if (node.type === TYPE_DEFS.MOVER.id) stats.speedMod += 1
      if (node.type === TYPE_DEFS.SPIKE.id) stats.damage += 4
      if (node.type === TYPE_DEFS.MOUTH.id) {
        stats.mouth++
        stats.sensor += 40
      }
      if (node.type === TYPE_DEFS.EYE.id) {
        stats.sensor += 150
        stats.mass -= 2
      }
      if (node.type === TYPE_DEFS.BATTERY.id) stats.battery += 1
      if (node.type === TYPE_DEFS.ARMOR.id) {
        stats.armor += 1
        stats.mass += 5
      }

      let newRef: { x: number; y: number; absAngle: number }

      if (node.length > 0) {
        const connector = new PIXI.Sprite(lineTexture)
        connector.anchor.set(0, 0.5)
        connector.width = node.length
        connector.height = 4
        connector.tint = coreColor
        connector.alpha = 0.8

        const absAngle = parentRef.absAngle + node.angle

        connector.position.set(parentRef.x, parentRef.y)
        connector.rotation = absAngle
        this.container.addChildAt(connector, 0)

        const lx = parentRef.x + Math.cos(absAngle) * node.length
        const ly = parentRef.y + Math.sin(absAngle) * node.length

        newRef = { x: lx, y: ly, absAngle: absAngle }
      } else {
        newRef = { x: 0, y: 0, absAngle: 0 }
      }

      const sprite = new PIXI.Sprite(circleTexture)
      sprite.anchor.set(0.5)
      sprite.width = def.size * 2
      sprite.height = def.size * 2

      let color = coreColor
      if (node.type === TYPE_DEFS.MOUTH.id) color = TYPE_DEFS.MOUTH.color
      if (node.type === TYPE_DEFS.SPIKE.id) color = TYPE_DEFS.SPIKE.color
      if (node.type === TYPE_DEFS.BATTERY.id) color = TYPE_DEFS.BATTERY.color
      if (node.type === TYPE_DEFS.EYE.id) color = TYPE_DEFS.EYE.color
      if (node.type === TYPE_DEFS.ARMOR.id) color = TYPE_DEFS.ARMOR.color
      if (node.type === TYPE_DEFS.MOVER.id) color = TYPE_DEFS.MOVER.color

      sprite.tint = color
      sprite.position.set(newRef.x, newRef.y)
      sprite.rotation = newRef.absAngle
      this.container.addChild(sprite)

      this.cells.push({
        x: newRef.x,
        y: newRef.y,
        size: def.size,
        type: node.type
      })

      if (node.children) {
        for (const child of node.children) {
          buildNode(child, newRef)
        }
      }
    }

    buildNode(this.dna.root, { x: 0, y: 0, absAngle: 0 })

    this.stats.mass = stats.mass
    this.stats.damage = stats.damage
    this.stats.sensor = stats.sensor
    this.stats.battery = stats.battery
    this.stats.mouthCount = stats.mouth
    // Battery cells add extra energy storage capacity
    this.stats.maxEnergy = 100 + stats.mass * 2 + stats.armor * 20 + stats.battery * CONFIG.batteryCapacity
    this.stats.reproThreshold = this.stats.maxEnergy * 0.9

    const baseSpeed = CONFIG.baseSpeed + stats.speedMod * 0.15
    const drag = stats.mass * 0.002
    this.stats.speed = Math.max(0.05, baseSpeed - drag)
    this.stats.turnSpeed = Math.max(0.01, 0.1 - stats.mass * 0.0005)

    this.speciesName = getRoleName(stats)
  }

  update() {
    if (this.dead) return
    this.age++
    if (this.invuln > 0) this.invuln--
    if (this.reproCooldown > 0) this.reproCooldown--

    let cost = CONFIG.metabolismBase + this.cells.length * CONFIG.metabolismPerCell
    if (this.stats.damage > 0) cost *= 0.6

    this.energy -= cost
    if (this.energy > this.stats.maxEnergy) this.energy = this.stats.maxEnergy
    if (this.energy <= 0) return this.die()
    if (this.energy >= this.stats.reproThreshold && this.reproCooldown <= 0) this.reproduce()

    // Neural network decision making
    const inputs = this.getSensorInputs()
    const [turn, thrust] = this.brain.evaluate(inputs)

    // Apply neural network outputs
    this.rotation += turn * this.stats.turnSpeed * 2 // turn is -1 to 1
    const thrustAmount = (thrust + 1) / 2 // Convert -1..1 to 0..1

    this.vel.x += Math.cos(this.rotation) * this.stats.speed * thrustAmount
    this.vel.y += Math.sin(this.rotation) * this.stats.speed * thrustAmount

    this.pos.x += this.vel.x
    this.pos.y += this.vel.y

    this.vel.x *= CONFIG.friction
    this.vel.y *= CONFIG.friction

    if (this.pos.x < 0) this.pos.x = WORLD_W
    if (this.pos.x > WORLD_W) this.pos.x = 0
    if (this.pos.y < 0) this.pos.y = WORLD_H
    if (this.pos.y > WORLD_H) this.pos.y = 0

    this.container.x = this.pos.x
    this.container.y = this.pos.y
    this.container.rotation = this.rotation

    const visible =
      Math.abs(this.pos.x - camera.x) < window.innerWidth / camera.zoom &&
      Math.abs(this.pos.y - camera.y) < window.innerHeight / camera.zoom
    this.container.renderable = visible

    if (this.flash > 0) {
      this.flash--
      this.container.tint = 0xff9999
    } else {
      this.container.tint = 0xffffff
    }

    this.checkCollisions()
  }

  /**
   * Get sensor inputs for neural network
   * Returns: [foodDist, foodAngle, preyDist, preyAngle, predatorNear, energy, speed, bias]
   */
  getSensorInputs(): number[] {
    const sensorRange = this.stats.sensor
    const range = 2

    // Query spatial grids
    const nearbyFood = foodGrid.query(this.pos.x, this.pos.y, range)
    const nearbyOrgs = orgGrid.query(this.pos.x, this.pos.y, range)

    // Find nearest food
    let foodDist = 1
    let foodAngle = 0
    for (const f of nearbyFood) {
      if (f.dead) continue
      const d = Math.hypot(f.x - this.pos.x, f.y - this.pos.y)
      if (d < foodDist * sensorRange) {
        foodDist = d / sensorRange
        foodAngle = this.relativeAngle(f.x, f.y)
      }
    }

    // Find nearest organism + check if predator
    let preyDist = 1
    let preyAngle = 0
    let predatorNear = 0
    for (const o of nearbyOrgs) {
      if (o === this || o.dead) continue
      const d = Math.hypot(o.pos.x - this.pos.x, o.pos.y - this.pos.y)
      if (d < preyDist * sensorRange) {
        preyDist = d / sensorRange
        preyAngle = this.relativeAngle(o.pos.x, o.pos.y)
        predatorNear = o.stats.damage > this.stats.damage ? 1 : 0
      }
    }

    // Compute current speed
    const currentSpeed = Math.hypot(this.vel.x, this.vel.y)
    const maxSpeed = this.stats.speed * 2

    return [
      foodDist,                                    // 0: Distance to nearest food (0-1)
      foodAngle / Math.PI,                        // 1: Angle to food (-1 to 1)
      preyDist,                                    // 2: Distance to nearest organism (0-1)
      preyAngle / Math.PI,                        // 3: Angle to organism (-1 to 1)
      predatorNear,                               // 4: Is nearest organism dangerous? (0 or 1)
      this.energy / this.stats.maxEnergy,         // 5: Own energy level (0-1)
      Math.min(1, currentSpeed / maxSpeed),       // 6: Current velocity (0-1)
      1                                           // 7: Bias (always 1)
    ]
  }

  /**
   * Calculate relative angle to a point
   */
  relativeAngle(tx: number, ty: number): number {
    const targetAngle = Math.atan2(ty - this.pos.y, tx - this.pos.x)
    let diff = targetAngle - this.rotation
    while (diff < -Math.PI) diff += Math.PI * 2
    while (diff > Math.PI) diff -= Math.PI * 2
    return diff
  }

  checkCollisions() {
    if (this.stats.mouthCount > 0) {
      const localFood = foodGrid.query(this.pos.x, this.pos.y, 1)
      const broadPhase = 30 + this.stats.mass * 0.1

      for (const f of localFood) {
        if (f.dead) continue
        if (Math.abs(this.pos.x - f.x) > broadPhase || Math.abs(this.pos.y - f.y) > broadPhase) continue

        const cos = Math.cos(this.rotation)
        const sin = Math.sin(this.rotation)

        for (const c of this.cells) {
          if (c.type !== TYPE_DEFS.MOUTH.id) continue
          const wx = this.pos.x + (c.x * cos - c.y * sin)
          const wy = this.pos.y + (c.x * sin + c.y * cos)

          if (Math.hypot(wx - f.x, wy - f.y) < c.size + f.size) {
            // Ecological efficiency: herbivores extract ~15% of plant energy
            const energyGained = CONFIG.foodValue * CONFIG.efficiencyPlantToHerbivore
            this.energy += energyGained
            createSparks(f.x, f.y, 0x10b981)
            killFood(f)
            break
          }
        }
      }
    }

    if (this.stats.damage > 0) {
      const localPrey = orgGrid.query(this.pos.x, this.pos.y, 1)
      const cos = Math.cos(this.rotation)
      const sin = Math.sin(this.rotation)

      for (const o of localPrey) {
        if (o === this || o.dead || o.invuln > 0) continue
        const isPredatorVsPredator = o.stats.damage > 0

        for (const c of this.cells) {
          if (c.type !== TYPE_DEFS.SPIKE.id) continue
          const wx = this.pos.x + (c.x * cos - c.y * sin)
          const wy = this.pos.y + (c.x * sin + c.y * cos)

          const dist = Math.hypot(wx - o.pos.x, wy - o.pos.y)
          if (dist < c.size + o.stats.mass * 0.2) {
            const dmg = this.stats.damage * 2
            o.takeDamage(dmg)

            // Ecological efficiency based on trophic level (10% rule)
            // Energy gained is based on PREY'S energy, not damage dealt
            if (isPredatorVsPredator) {
              // Predator vs Predator: only 5% efficiency (apex predator inefficiency)
              // Plus combat has metabolic cost
              const energyStolen = o.energy * CONFIG.efficiencyPredatorToPredator * 0.1
              const combatCost = dmg * 0.3
              this.energy += energyStolen - combatCost
            } else {
              // Predator vs Herbivore/Plant: 10% of prey's energy per hit
              const energyStolen = o.energy * CONFIG.efficiencyHerbivoreToPredator
              this.energy += energyStolen
            }
            createSparks(wx, wy, 0xef4444)

            // Knockback to separate fighters
            const force = 8
            o.vel.x += Math.cos(this.rotation) * force
            o.vel.y += Math.sin(this.rotation) * force
            this.vel.x -= Math.cos(this.rotation) * force * 0.3 // Recoil
            this.vel.y -= Math.sin(this.rotation) * force * 0.3
            break // Only one hit per target per frame
          }
        }
      }
    }
  }

  reproduce() {
    this.energy *= 0.4 // Parent keeps only 40% energy (was 50%)
    this.reproCooldown = 300 // ~5 seconds cooldown at 60fps
    const newDNA = mutate(this.dna)
    // Spawn child at a larger offset to avoid clustering
    const angle = Math.random() * Math.PI * 2
    const offsetX = Math.cos(angle) * 60
    const offsetY = Math.sin(angle) * 60
    const child = new Organism(this.pos.x + offsetX, this.pos.y + offsetY, newDNA, this.generation + 1)
    child.energy = CONFIG.startEnergy * 0.6 // Children start with less energy
    child.invuln = 120 // Longer invulnerability to escape the cluster
    organisms.push(child)
    if (child.generation > maxGen) maxGen = child.generation
  }

  takeDamage(amt: number) {
    this.energy -= amt
    this.flash = 4
    if (this.energy <= 0) this.die()
  }

  die() {
    this.dead = true
    for (let i = 0; i < Math.min(5, this.cells.length); i++) {
      spawnFood(this.pos.x + (Math.random() - 0.5) * 20, this.pos.y + (Math.random() - 0.5) * 20)
    }
    this.container.destroy({ children: true })
    createSparks(this.pos.x, this.pos.y, 0xffffff)
  }
}

class Particle {
  x: number = 0
  y: number = 0
  angle: number = 0
  speed: number = 0
  life: number = 1
  decay: number = 0
  sprite: PIXI.Sprite

  constructor() {
    this.sprite = new PIXI.Sprite(circleTexture)
    this.sprite.anchor.set(0.5)
  }

  reset(x: number, y: number, color: number) {
    this.x = x
    this.y = y
    this.angle = Math.random() * Math.PI * 2
    this.speed = Math.random() * 4
    this.life = 1.0
    this.decay = Math.random() * 0.05 + 0.02
    this.sprite.tint = color
    this.sprite.scale.set(0.15)
    this.sprite.x = x
    this.sprite.y = y
    this.sprite.alpha = 1
    particleLayer.addChild(this.sprite)
  }

  update(): boolean {
    this.x += Math.cos(this.angle) * this.speed
    this.y += Math.sin(this.angle) * this.speed
    this.life -= this.decay
    this.sprite.x = this.x
    this.sprite.y = this.y
    this.sprite.alpha = this.life
    if (this.life <= 0) {
      particleLayer.removeChild(this.sprite)
      return false
    }
    return true
  }
}

class Food {
  x: number = 0
  y: number = 0
  size: number = 0
  growth: number = 0
  dead: boolean = false
  sprite: PIXI.Sprite

  constructor() {
    this.sprite = new PIXI.Sprite(circleTexture)
    this.sprite.anchor.set(0.5)
    this.sprite.tint = 0x10b981
  }

  reset(x: number, y: number) {
    this.x = x
    this.y = y
    this.size = Math.random() * 3 + 3
    this.growth = 0
    this.dead = false
    this.sprite.x = x
    this.sprite.y = y
    this.sprite.scale.set(0)
    foodLayer.addChild(this.sprite)
    foodGrid.add(this)
  }

  update() {
    if (this.growth < 1) {
      this.growth += 0.1
      this.sprite.scale.set((this.size / 16) * this.growth)
    }
  }

  kill() {
    this.dead = true
    foodLayer.removeChild(this.sprite)
    foodGrid.remove(this)
  }
}

function spawnFood(x: number, y: number) {
  let f: Food
  if (foodPool.length > 0) f = foodPool.pop()!
  else f = new Food()
  f.reset(x, y)
  foods.push(f)
}

function killFood(f: Food) {
  f.kill()
  foodPool.push(f)
}

function createSparks(x: number, y: number, color: number) {
  for (let i = 0; i < 3; i++) {
    let p: Particle
    if (particlePool.length > 0) p = particlePool.pop()!
    else p = new Particle()
    p.reset(x, y, color)
    particles.push(p)
  }
}

function spawnPredator() {
  const dna = createPredatorGenome()
  const p = new Organism(Math.random() * WORLD_W, Math.random() * WORLD_H, dna)
  p.energy = 400
  p.stats.maxEnergy = 500
  organisms.push(p)
}

function spawnPrey() {
  const dna = createPreyGenome()
  const p = new Organism(Math.random() * WORLD_W, Math.random() * WORLD_H, dna)
  organisms.push(p)
}

function updateChart(preds: number) {
  if (!chartInstance || organisms.length === 0) return

  const avg = organisms.length > 0
    ? (organisms.reduce((a, b) => a + b.cells.length, 0) / organisms.length).toFixed(1)
    : '0'

  const label = new Date().toLocaleTimeString().split(' ')[0]
  // Keep 60 data points (1 minute of history at 1 update/sec)
  if (chartInstance.data.labels!.length > 60) {
    chartInstance.data.labels!.shift()
    chartInstance.data.datasets.forEach((d) => d.data.shift())
  }
  chartInstance.data.labels!.push(label)
  chartInstance.data.datasets[0].data.push(organisms.length)
  chartInstance.data.datasets[1].data.push(preds)
  chartInstance.data.datasets[2].data.push(parseFloat(avg))
  chartInstance.update('none')
}

function updateStats(preds: number) {
  popCount.value = organisms.length
  predCount.value = preds
  fpsCounter.value = Math.round(app?.ticker.FPS || 60)
  genRecord.value = maxGen

  const avg =
    organisms.length > 0
      ? (organisms.reduce((a, b) => a + b.cells.length, 0) / organisms.length).toFixed(1)
      : '0'
  avgSize.value = avg

  if (selectedOrganism && !selectedOrganism.dead) {
    showInspector.value = true
    insId.value = selectedOrganism.speciesName
    insGen.value = selectedOrganism.generation
    insNrg.value = Math.floor(selectedOrganism.energy)
    insState.value = 'Neural'
    insSpecies.value = 'Mass: ' + Math.floor(selectedOrganism.stats.mass)
    const brainInfo = getBrainStats(selectedOrganism.dna.brain)
    insBrain.value = `${brainInfo.hiddenNeurons}h/${brainInfo.enabledConnections}c`
    drawNeuralNetwork()
  } else {
    showInspector.value = false
  }
}

function drawMinimap() {
  const canvas = minimapCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, 160, 160)
  const sx = 160 / WORLD_W
  const sy = 160 / WORLD_H

  ctx.fillStyle = '#064e3b'
  for (let i = 0; i < foods.length; i += 10) {
    const f = foods[i]
    ctx.fillRect(f.x * sx, f.y * sy, 1, 1)
  }

  organisms.forEach((o) => {
    ctx.fillStyle = o.stats.damage > 0 ? '#ef4444' : '#34d399'
    ctx.fillRect(o.pos.x * sx, o.pos.y * sy, 2, 2)
  })

  ctx.strokeStyle = 'white'
  ctx.lineWidth = 1
  const w = window.innerWidth / camera.zoom
  const h = window.innerHeight / camera.zoom
  ctx.strokeRect((camera.x - w / 2) * sx, (camera.y - h / 2) * sy, w * sx, h * sy)
}

function drawNeuralNetwork() {
  const canvas = neuralCanvas.value
  if (!canvas || !selectedOrganism) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width
  const H = canvas.height

  // Clear
  ctx.clearRect(0, 0, W, H)

  const genome = selectedOrganism.dna.brain
  const network = selectedOrganism.brain

  // Layout constants
  const leftMargin = 50
  const rightMargin = 45
  const inputX = leftMargin
  const outputX = W - rightMargin
  const middleX = W / 2

  // Input labels
  const inputLabels = ['food↔', 'food∠', 'prey↔', 'prey∠', 'danger', 'energy', 'speed', 'bias']
  const outputLabels = ['turn', 'thrust']

  // Calculate Y positions for neurons
  const inputPositions: Map<number, { x: number; y: number }> = new Map()
  const outputPositions: Map<number, { x: number; y: number }> = new Map()
  const hiddenPositions: Map<number, { x: number; y: number }> = new Map()

  // Input neurons (IDs 0-7)
  for (let i = 0; i < NUM_INPUTS; i++) {
    const y = 15 + (i * (H - 30)) / (NUM_INPUTS - 1)
    inputPositions.set(i, { x: inputX, y })
  }

  // Output neurons (IDs 8-9)
  for (let i = 0; i < NUM_OUTPUTS; i++) {
    const y = H / 2 - 20 + i * 40
    outputPositions.set(NUM_INPUTS + i, { x: outputX, y })
  }

  // Hidden neurons - arrange in layers based on depth
  const hiddenNeurons = genome.neurons.filter(n => n.type === 'hidden')
  const numHidden = hiddenNeurons.length

  if (numHidden > 0) {
    // Simple layout: spread hidden neurons vertically in the middle
    const rows = Math.ceil(Math.sqrt(numHidden))
    const cols = Math.ceil(numHidden / rows)

    hiddenNeurons.forEach((n, idx) => {
      const col = Math.floor(idx / rows)
      const row = idx % rows
      const xSpread = (outputX - inputX - 60) / (cols + 1)
      const x = inputX + 30 + xSpread * (col + 1)
      const ySpread = (H - 40) / (rows + 1)
      const y = 20 + ySpread * (row + 1)
      hiddenPositions.set(n.id, { x, y })
    })
  }

  // Helper to get neuron position
  const getPos = (id: number) => {
    return inputPositions.get(id) || outputPositions.get(id) || hiddenPositions.get(id) || { x: middleX, y: H / 2 }
  }

  // Draw connections first (behind nodes)
  for (const conn of genome.connections) {
    if (!conn.enabled) continue

    const from = getPos(conn.from)
    const to = getPos(conn.to)

    // Color based on weight
    const weight = conn.weight
    const absWeight = Math.abs(weight)
    const alpha = Math.min(0.3 + absWeight * 0.2, 0.9)

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.strokeStyle = weight > 0
      ? `rgba(16, 185, 129, ${alpha})`  // emerald for positive
      : `rgba(239, 68, 68, ${alpha})`    // red for negative
    ctx.lineWidth = Math.min(1 + absWeight * 0.5, 3)
    ctx.stroke()
  }

  // Draw input neurons with labels
  for (let i = 0; i < NUM_INPUTS; i++) {
    const pos = inputPositions.get(i)!
    const value = network.getNeuronValue(i)

    // Node circle
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2)
    const brightness = Math.floor(80 + value * 175)
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
    ctx.fill()
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 1
    ctx.stroke()

    // Label
    ctx.fillStyle = '#9ca3af'
    ctx.font = '8px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(inputLabels[i], pos.x - 8, pos.y + 3)
  }

  // Draw hidden neurons
  for (const [id, pos] of hiddenPositions) {
    const value = network.getNeuronValue(id)

    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2)
    const brightness = Math.floor(80 + Math.abs(value) * 175)
    ctx.fillStyle = value >= 0
      ? `rgb(${brightness}, ${brightness}, ${Math.floor(brightness * 0.8)})`
      : `rgb(${brightness}, ${Math.floor(brightness * 0.8)}, ${brightness})`
    ctx.fill()
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Draw output neurons with labels
  for (let i = 0; i < NUM_OUTPUTS; i++) {
    const id = NUM_INPUTS + i
    const pos = outputPositions.get(id)!
    const value = network.getNeuronValue(id)

    // Node circle (larger)
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2)

    // Color based on output value (-1 to 1)
    if (value > 0) {
      const intensity = Math.floor(value * 200)
      ctx.fillStyle = `rgb(${80 + intensity}, 255, ${80 + intensity})`
    } else {
      const intensity = Math.floor(Math.abs(value) * 200)
      ctx.fillStyle = `rgb(255, ${80 + 175 - intensity}, ${80 + 175 - intensity})`
    }
    ctx.fill()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    ctx.fillStyle = '#9ca3af'
    ctx.font = '9px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(outputLabels[i], pos.x + 10, pos.y + 3)

    // Value indicator
    ctx.fillStyle = '#6b7280'
    ctx.font = '7px monospace'
    ctx.fillText(value.toFixed(2), pos.x + 10, pos.y + 12)
  }
}

function initChart() {
  const canvas = chartCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Pop',
          data: [],
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4
        },
        {
          label: 'Pred',
          data: [],
          borderColor: '#ef4444',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4
        },
        {
          label: 'Avg Cells',
          data: [],
          borderColor: '#3b82f6',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { display: false },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: '#374151' },
          ticks: { color: '#9ca3af', font: { size: 9 } }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#60a5fa', font: { size: 9 } }
        }
      }
    }
  })
}

function resetGame() {
  organisms.forEach((o) => o.container.destroy({ children: true }))
  foods.forEach((f) => {
    f.dead = true
    foodGrid.remove(f)
    foodLayer.removeChild(f.sprite)
  })
  organisms = []
  foods = []
  foodPool.length = 0
  maxGen = 1
  selectedOrganism = null
}

function spawnOrganism() {
  organisms.push(new Organism(camera.x, camera.y))
}

async function initGame() {
  if (!canvasContainer.value) return

  app = new PIXI.Application()
  await app.init({
    background: '#0f172a',
    resizeTo: canvasContainer.value,
    antialias: false,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1
  })

  canvasContainer.value.appendChild(app.canvas)

  // Create textures
  const circleGraph = new PIXI.Graphics()
  circleGraph.circle(0, 0, 16)
  circleGraph.fill(0xffffff)
  circleTexture = app.renderer.generateTexture(circleGraph)

  const lineGraph = new PIXI.Graphics()
  lineGraph.rect(0, 0, 1, 1)
  lineGraph.fill(0xffffff)
  lineTexture = app.renderer.generateTexture(lineGraph)

  // Setup layers
  worldContainer = new PIXI.Container()
  app.stage.addChild(worldContainer)

  foodLayer = new PIXI.Container()
  particleLayer = new PIXI.Container()
  organismLayer = new PIXI.Container()
  uiLayer = new PIXI.Container()

  worldContainer.addChild(foodLayer, particleLayer, organismLayer, uiLayer)

  // Border
  const borderGraph = new PIXI.Graphics()
  borderGraph.rect(0, 0, WORLD_W, WORLD_H)
  borderGraph.stroke({ width: 20, color: 0x1e293b })
  worldContainer.addChild(borderGraph)

  // Input handling
  const view = app.canvas
  view.addEventListener('wheel', (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    camera.targetZoom = Math.min(Math.max(camera.targetZoom * delta, 0.05), 4)
  })

  view.addEventListener('mousedown', (e) => {
    const rect = view.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (e.button === 0 || e.button === 1) {
      camera.dragging = true
      camera.lastMouse = { x, y }
    } else if (e.button === 2) {
      const wx = (x - view.width / 2) / camera.zoom + camera.x
      const wy = (y - view.height / 2) / camera.zoom + camera.y
      let clicked = false
      for (const o of organisms) {
        if (Math.hypot(wx - o.pos.x, wy - o.pos.y) < 40) {
          selectedOrganism = o
          clicked = true
          break
        }
      }
      if (!clicked) {
        for (let i = 0; i < 5; i++) {
          spawnFood(wx + (Math.random() - 0.5) * 50, wy + (Math.random() - 0.5) * 50)
        }
      }
    }
  })

  window.addEventListener('mousemove', (e) => {
    if (camera.dragging && camera.lastMouse) {
      const rect = view.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const dx = x - camera.lastMouse.x
      const dy = y - camera.lastMouse.y
      camera.x -= dx / camera.zoom
      camera.y -= dy / camera.zoom
      camera.lastMouse = { x, y }
    }
  })

  window.addEventListener('mouseup', () => {
    camera.dragging = false
  })

  view.addEventListener('contextmenu', (e) => e.preventDefault())

  // Game loop
  let frameCount = 0
  app.ticker.add(() => {
    if (Math.abs(camera.targetZoom - camera.zoom) > 0.001) {
      camera.zoom += (camera.targetZoom - camera.zoom) * 0.1
    }

    worldContainer.position.set(view.width / 2, view.height / 2)
    worldContainer.scale.set(camera.zoom)
    worldContainer.pivot.set(camera.x, camera.y)

    foodGrid.clear()
    orgGrid.clear()

    // Update foods
    let fc = foods.length
    for (let i = 0; i < fc; i++) {
      const f = foods[i]
      if (f.dead) {
        foods[i] = foods[fc - 1]
        foods.pop()
        i--
        fc--
        continue
      }
      f.update()
      foodGrid.add(f)
    }

    // Spawn food
    if (foods.length < CONFIG.maxFood) {
      const count = Math.floor(CONFIG.foodSpawnRate * 0.5)
      if (Math.random() < CONFIG.foodSpawnRate * 0.1) {
        for (let i = 0; i < count + 1; i++) {
          let fx: number, fy: number
          if (foods.length > 0 && Math.random() < 0.7) {
            const p = foods[Math.floor(Math.random() * foods.length)]
            const a = Math.random() * Math.PI * 2
            const d = Math.random() * 60 + 20
            fx = p.x + Math.cos(a) * d
            fy = p.y + Math.sin(a) * d
          } else {
            fx = Math.random() * WORLD_W
            fy = Math.random() * WORLD_H
          }
          fx = Math.max(10, Math.min(WORLD_W - 10, fx))
          fy = Math.max(10, Math.min(WORLD_H - 10, fy))
          spawnFood(fx, fy)
        }
      }
    }

    // Update particles
    let pc = particles.length
    for (let i = 0; i < pc; i++) {
      const p = particles[i]
      if (!p.update()) {
        particlePool.push(p)
        particles[i] = particles[pc - 1]
        particles.pop()
        i--
        pc--
      }
    }

    // Update organisms
    const preds = organisms.filter((o) => o.stats.damage > 0).length
    for (let i = organisms.length - 1; i >= 0; i--) {
      const o = organisms[i]
      o.update()
      orgGrid.add(o)
      if (o.dead) {
        if (selectedOrganism === o) selectedOrganism = null
        organisms.splice(i, 1)
      }
    }

    // Update chart every 60 frames (1 second)
    frameCount++
    if (frameCount % 60 === 0) {
      updateChart(preds)
    }

    // Auto-balance every 3 seconds (180 frames) and update stats display
    if (frameCount % 180 === 0) {
      if (preds < CONFIG.minPredators) spawnPredator()
      if (organisms.length - preds < CONFIG.minPrey) spawnPrey()
      updateStats(preds)
    }

    drawMinimap()

    // Update inspector and neural network when organism selected
    if (selectedOrganism && !selectedOrganism.dead) {
      // Show inspector immediately (not just every 180 frames)
      if (!showInspector.value) {
        showInspector.value = true
        insId.value = selectedOrganism.speciesName
        insGen.value = selectedOrganism.generation
        insSpecies.value = 'Mass: ' + Math.floor(selectedOrganism.stats.mass)
        const brainInfo = getBrainStats(selectedOrganism.dna.brain)
        insBrain.value = `${brainInfo.hiddenNeurons}h/${brainInfo.enabledConnections}c`
      }
      insNrg.value = Math.floor(selectedOrganism.energy)
      // Draw neural network every frame for live updates
      drawNeuralNetwork()
    } else if (showInspector.value && (!selectedOrganism || selectedOrganism.dead)) {
      showInspector.value = false
    }

    // Selection UI
    uiLayer.removeChildren()
    if (selectedOrganism && !selectedOrganism.dead) {
      const r = new PIXI.Graphics()
      r.circle(0, 0, 50 + selectedOrganism.stats.mass * 0.2)
      r.stroke({ width: 2, color: 0xffffff, alpha: 0.6 })
      r.position.set(selectedOrganism.pos.x, selectedOrganism.pos.y)
      uiLayer.addChild(r)
    }
  })

  // Initialize
  initChart()
  for (let i = 0; i < CONFIG.startPop; i++) {
    organisms.push(new Organism(Math.random() * WORLD_W, Math.random() * WORLD_H))
  }
  for (let i = 0; i < 500; i++) {
    spawnFood(Math.random() * WORLD_W, Math.random() * WORLD_H)
  }
}

// Watchers for config
watch(metaRate, (val) => (CONFIG.metabolismBase = val))
watch(cellRate, (val) => (CONFIG.metabolismPerCell = val))
watch(foodRate, (val) => (CONFIG.foodSpawnRate = val))
watch(foodVal, (val) => (CONFIG.foodValue = val))
watch(mutRate, (val) => (CONFIG.mutationRate = val / 100))
watch(batteryCapRef, (val) => (CONFIG.batteryCapacity = val))
watch(trophicEffRef, (val) => (CONFIG.efficiencyPlantToHerbivore = val))

// Watch fullscreen changes and resize
watch(() => props.isFullscreen, () => {
  nextTick(() => {
    if (app && canvasContainer.value) {
      app.renderer.resize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
    }
  })
})

onMounted(() => {
  initGame()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  if (app) {
    app.destroy(true, { children: true })
    app = null
  }
})
</script>

<template>
  <div
    class="evosim-game relative w-full"
    :class="props.isFullscreen ? 'h-full' : 'h-[800px]'"
    style="background-color: #0f172a"
  >
    <!-- Control Panel -->
    <div
      class="absolute top-4 left-4 z-20 w-80 rounded-xl p-4 flex flex-col gap-3 select-none pointer-events-auto max-h-[90vh] overflow-y-auto"
      style="
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(75, 85, 99, 0.5);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
      "
    >
      <div class="flex justify-between items-center border-b border-gray-700 pb-2">
        <h1 class="text-lg font-bold text-emerald-400 tracking-wide">EvoSim: Nodes</h1>
        <span class="text-[10px] text-gray-500 uppercase font-mono">v4.3</span>
      </div>

      <div class="grid grid-cols-2 gap-y-1 text-xs text-gray-300 font-mono">
        <span class="text-gray-500">Population</span>
        <span class="text-white text-right">{{ popCount }}</span>
        <span class="text-gray-500">Predators</span>
        <span class="text-red-400 text-right">{{ predCount }}</span>
        <span class="text-gray-500">Max Gen</span>
        <span class="text-yellow-400 text-right">{{ genRecord }}</span>
        <span class="text-gray-500">Avg Cells</span>
        <span class="text-blue-300 text-right">{{ avgSize }}</span>
        <span class="text-gray-500">FPS</span>
        <span class="text-gray-500 text-right">{{ fpsCounter }}</span>
      </div>

      <div class="flex gap-2 mt-1">
        <button
          class="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-xs font-bold text-white transition shadow"
          @click="spawnOrganism"
        >
          SPAWN
        </button>
        <button
          class="flex-1 py-1.5 bg-red-900 hover:bg-red-800 rounded text-xs font-bold text-white transition shadow"
          @click="resetGame"
        >
          RESET
        </button>
      </div>
      <div class="text-[10px] text-center text-gray-500 mt-1">Left-Click Pan • Right-Click Interact</div>

      <!-- Sliders (ranges centered around stable defaults) -->
      <div class="border-t border-gray-700 pt-2 mt-1 space-y-3">
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-gray-400">Hunger Rate (Base)</label>
            <input
              v-model.number="metaRate"
              type="number"
              step="0.01"
              class="w-12 bg-gray-800 text-red-400 text-xs border border-gray-600 rounded px-1 text-right focus:outline-none focus:border-red-500"
            />
          </div>
          <input
            v-model.number="metaRate"
            type="range"
            min="0.02"
            max="0.20"
            step="0.01"
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-gray-400">Metabolism (Per Cell)</label>
            <input
              v-model.number="cellRate"
              type="number"
              step="0.001"
              class="w-12 bg-gray-800 text-orange-400 text-xs border border-gray-600 rounded px-1 text-right focus:outline-none focus:border-orange-500"
            />
          </div>
          <input
            v-model.number="cellRate"
            type="range"
            min="0.005"
            max="0.03"
            step="0.001"
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-gray-400">Plant Growth Rate</label>
            <input
              v-model.number="foodRate"
              type="number"
              class="w-12 bg-gray-800 text-emerald-400 text-xs border border-gray-600 rounded px-1 text-right focus:outline-none focus:border-emerald-500"
            />
          </div>
          <input
            v-model.number="foodRate"
            type="range"
            min="1"
            max="12"
            step="1"
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-gray-400">Food Energy</label>
            <input
              v-model.number="foodVal"
              type="number"
              class="w-12 bg-gray-800 text-emerald-400 text-xs border border-gray-600 rounded px-1 text-right focus:outline-none focus:border-emerald-500"
            />
          </div>
          <input
            v-model.number="foodVal"
            type="range"
            min="50"
            max="200"
            step="5"
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-gray-400">Mutation Rate (%)</label>
            <input
              v-model.number="mutRate"
              type="number"
              class="w-12 bg-gray-800 text-blue-400 text-xs border border-gray-600 rounded px-1 text-right focus:outline-none focus:border-blue-500"
            />
          </div>
          <input
            v-model.number="mutRate"
            type="range"
            min="5"
            max="50"
            step="1"
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-gray-400">Battery Capacity</label>
            <input
              v-model.number="batteryCapRef"
              type="number"
              class="w-12 bg-gray-800 text-yellow-400 text-xs border border-gray-600 rounded px-1 text-right focus:outline-none focus:border-yellow-500"
            />
          </div>
          <input
            v-model.number="batteryCapRef"
            type="range"
            min="20"
            max="100"
            step="5"
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-gray-400">Trophic Efficiency</label>
            <input
              v-model.number="trophicEffRef"
              type="number"
              step="0.01"
              class="w-12 bg-gray-800 text-lime-400 text-xs border border-gray-600 rounded px-1 text-right focus:outline-none focus:border-lime-500"
            />
          </div>
          <input
            v-model.number="trophicEffRef"
            type="range"
            min="0.05"
            max="0.25"
            step="0.01"
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
          />
        </div>
      </div>

      <div class="border-t border-gray-700 pt-2 mt-1">
        <h2 class="text-xs font-semibold text-gray-400 mb-2">History</h2>
        <div class="relative h-[140px] w-full">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Inspector -->
    <div
      v-if="showInspector"
      class="absolute bottom-4 left-4 z-20 w-72 rounded-xl p-4 pointer-events-none"
      style="
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(75, 85, 99, 0.5);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
      "
    >
      <h3 class="text-sm font-bold text-white border-b border-gray-600 pb-1 mb-2 flex justify-between">
        <span>Inspector</span>
        <span class="font-mono text-xs text-gray-500">{{ insId }}</span>
      </h3>
      <div class="grid grid-cols-4 gap-1 text-xs font-mono mb-3">
        <span class="text-gray-400">Gen:</span>
        <span class="text-white">{{ insGen }}</span>
        <span class="text-gray-400">Energy:</span>
        <span class="text-emerald-400">{{ insNrg }}</span>
        <span class="text-gray-400">{{ insSpecies }}</span>
        <span class="text-purple-300"></span>
        <span class="text-gray-400">Brain:</span>
        <span class="text-cyan-300">{{ insBrain }}</span>
      </div>
      <!-- Neural Network Visualization -->
      <div class="border-t border-gray-600 pt-2">
        <canvas ref="neuralCanvas" width="256" height="160" class="w-full rounded" style="background: rgba(0,0,0,0.3);"></canvas>
      </div>
    </div>

    <!-- Minimap -->
    <div
      class="absolute bottom-4 right-4 z-20 w-40 h-40 rounded-lg overflow-hidden shadow-lg"
      style="
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid #374151;
      "
    >
      <canvas ref="minimapCanvas" width="160" height="160"></canvas>
    </div>

    <!-- Canvas Container -->
    <div ref="canvasContainer" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
.evosim-game :deep(canvas) {
  display: block;
}

input[type='range'] {
  -webkit-appearance: none;
  background: transparent;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: white;
  margin-top: -4px;
  cursor: pointer;
}

input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: #374151;
  border-radius: 2px;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
