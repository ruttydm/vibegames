<script setup lang="ts">
import * as PIXI from 'pixi.js'
import { CONFIG, createInitialState, applyUpgrade, type GameState } from '~/games/antcolony/engine'

const props = defineProps<{
  isFullscreen?: boolean
}>()

// Refs
const canvasContainer = ref<HTMLElement | null>(null)

// Game state
const biomass = ref(20)
const antCount = ref(0)
const pherCount = ref(0)
const popCap = ref(50)
const showTutorial = ref(true)

// Upgrade display
const upgrades = ref({
  spawn: { level: 1, cost: 50 },
  speed: { level: 1, cost: 100 },
  cap: { level: 1, cost: 200 },
  pher: { level: 1, cost: 300 }
})

// Internal state
let app: PIXI.Application | null = null
let gameState: GameState
let terrainLayer: PIXI.Container
let trailLayer: PIXI.Container
let itemLayer: PIXI.Container
let entityLayer: PIXI.Container
let fxLayer: PIXI.Container
let trailGraphics: PIXI.Graphics
let terrainGraphics: PIXI.Graphics
let splitX = 0

// Entity arrays
let ants: Ant[] = []
let larvae: Larva[] = []
let foods: Food[] = []
let pheromones: Pheromone[] = []
let particles: Particle[] = []
let queen: Queen | null = null

// Grid for pheromone sensing
let gridWidth = 0
let gridHeight = 0
let pheromoneGrid: Pheromone[][] = []

// Classes
class Pheromone {
  x: number
  y: number
  type: 'food' | 'home'
  life: number

  constructor(x: number, y: number, type: 'food' | 'home') {
    this.x = x
    this.y = y
    this.type = type
    this.life = 1.0
  }
}

class Particle {
  sprite: PIXI.Graphics
  vx: number
  vy: number
  life: number

  constructor(x: number, y: number, color: number) {
    this.sprite = new PIXI.Graphics()
    this.sprite.circle(0, 0, Math.random() * 3 + 1)
    this.sprite.fill(color)
    this.sprite.x = x
    this.sprite.y = y
    this.vx = (Math.random() - 0.5) * 4
    this.vy = (Math.random() - 0.5) * 4
    this.life = 1.0
    fxLayer.addChild(this.sprite)
  }

  update(): boolean {
    this.sprite.x += this.vx
    this.sprite.y += this.vy
    this.life -= 0.05
    this.sprite.alpha = this.life
    return this.life <= 0
  }

  destroy() {
    this.sprite.destroy()
  }
}

class Food {
  x: number
  y: number
  sprite: PIXI.Container
  amount: number
  isBonus: boolean

  constructor(x: number, y: number, isBonus = false) {
    this.x = x
    this.y = y
    this.isBonus = isBonus
    this.amount = isBonus ? 50 : 200

    this.sprite = new PIXI.Container()
    this.sprite.x = x
    this.sprite.y = y

    const color = isBonus ? 0xffd700 : 0x4ade80

    // Glow
    const glow = new PIXI.Graphics()
    glow.circle(0, 0, 10)
    glow.fill({ color, alpha: 0.3 })
    this.sprite.addChild(glow)

    // Main circle
    const main = new PIXI.Graphics()
    main.circle(0, 0, 6)
    main.fill(color)
    this.sprite.addChild(main)

    itemLayer.addChild(this.sprite)
  }

  take(): boolean {
    this.amount--
    if (this.amount <= 0) {
      this.remove()
      return false
    }
    const scale = Math.max(0.3, this.amount / (this.isBonus ? 50 : 200))
    this.sprite.scale.set(scale)
    return true
  }

  remove() {
    spawnParticles(this.x, this.y, 0x4ade80, 8)
    itemLayer.removeChild(this.sprite)
    this.sprite.destroy()
  }
}

class Larva {
  x: number
  y: number
  age: number
  sprite: PIXI.Graphics

  constructor(x: number, y: number) {
    this.x = x + (Math.random() - 0.5) * 20
    this.y = y + (Math.random() - 0.5) * 20
    this.age = 0

    this.sprite = new PIXI.Graphics()
    this.sprite.ellipse(0, 0, 3, 4)
    this.sprite.fill(0xffffff)
    this.sprite.x = this.x
    this.sprite.y = this.y
    this.sprite.alpha = 0.8
    entityLayer.addChild(this.sprite)
  }

  update(): boolean {
    this.age++
    this.sprite.scale.set(1 + Math.sin(this.age * 0.2) * 0.1)
    if (this.age > CONFIG.larvaMaturationTime) {
      entityLayer.removeChild(this.sprite)
      this.sprite.destroy()
      return true
    }
    return false
  }
}

class Ant {
  x: number
  y: number
  age: number
  angle: number
  hasFood: boolean
  targetAcquired: boolean
  distanceSinceLastDrop: number
  container: PIXI.Container
  graphics: PIXI.Graphics
  foodGraphic: PIXI.Graphics

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.age = 0
    this.angle = Math.random() * Math.PI * 2
    this.hasFood = false
    this.targetAcquired = false
    this.distanceSinceLastDrop = 0

    this.container = new PIXI.Container()
    this.container.x = x
    this.container.y = y

    this.graphics = new PIXI.Graphics()
    this.drawAnt()
    this.container.addChild(this.graphics)

    this.foodGraphic = new PIXI.Graphics()
    this.foodGraphic.circle(3, 0, 2)
    this.foodGraphic.fill(0xffd700)
    this.foodGraphic.visible = false
    this.container.addChild(this.foodGraphic)

    entityLayer.addChild(this.container)
  }

  drawAnt() {
    this.graphics.clear()
    // Body segments
    this.graphics.ellipse(-2, 0, 2, 1.5)
    this.graphics.fill(0xaaaaaa)
    this.graphics.circle(0, 0, 1)
    this.graphics.fill(0xaaaaaa)
    this.graphics.circle(2, 0, 1.2)
    this.graphics.fill(0xffffff)
  }

  update(): boolean {
    this.age++
    if (this.age > CONFIG.antLifeSpan) {
      this.container.destroy()
      return true
    }
    if (this.age > CONFIG.antLifeSpan - 500) {
      this.container.alpha = (CONFIG.antLifeSpan - this.age) / 500
    }

    // Speed calculation
    const speedMult = this.x > splitX ? CONFIG.slowZoneSpeed : 1.0
    const actualSpeed = CONFIG.antBaseSpeed * gameState.upgrades.speed.val * speedMult

    this.move(actualSpeed)

    // Bounds
    if (this.x < 0 || this.x > app!.screen.width || this.y < 0 || this.y > app!.screen.height) {
      this.angle += Math.PI
      this.x = Math.max(0, Math.min(app!.screen.width, this.x))
      this.y = Math.max(0, Math.min(app!.screen.height, this.y))
    }

    // Pheromones
    this.distanceSinceLastDrop += actualSpeed
    if (this.distanceSinceLastDrop >= CONFIG.dropDistance) {
      this.distanceSinceLastDrop = 0
      const dropChance = this.targetAcquired ? 0.9 : 0.15
      if (Math.random() < dropChance) {
        addPheromone(this.x, this.y, this.hasFood ? 'food' : 'home')
      }
    }

    // Interaction
    if (!this.hasFood) {
      for (let i = 0; i < foods.length; i++) {
        const f = foods[i]
        const dx = f.x - this.x
        const dy = f.y - this.y
        if (dx * dx + dy * dy < 200) {
          this.hasFood = true
          this.foodGraphic.visible = true
          this.angle += Math.PI
          this.targetAcquired = false
          if (!f.take()) foods.splice(i, 1)
          spawnParticles(this.x, this.y, 0x4ade80, 3)
          break
        }
      }
    } else if (queen) {
      const dx = queen.sprite.x - this.x
      const dy = queen.sprite.y - this.y
      if (dx * dx + dy * dy < 2500) {
        this.hasFood = false
        this.foodGraphic.visible = false
        this.angle += Math.PI
        addBiomass(1)
        this.targetAcquired = false
        spawnParticles(this.x, this.y, 0xffd700, 3)
      }
    }

    this.container.x = this.x
    this.container.y = this.y
    this.container.rotation = this.angle
    return false
  }

  move(speed: number) {
    let seenTarget = false

    if (this.hasFood && queen) {
      const dx = queen.sprite.x - this.x
      const dy = queen.sprite.y - this.y
      if (dx * dx + dy * dy < CONFIG.visionRadius * CONFIG.visionRadius) {
        this.angle = Math.atan2(dy, dx)
        seenTarget = true
      }
    } else {
      let closestSq = CONFIG.visionRadius * CONFIG.visionRadius
      let target: Food | null = null
      for (const f of foods) {
        const dSq = (f.x - this.x) ** 2 + (f.y - this.y) ** 2
        if (dSq < closestSq) {
          closestSq = dSq
          target = f
        }
      }
      if (target) {
        this.angle = Math.atan2(target.y - this.y, target.x - this.x)
        seenTarget = true
      }
    }

    if (seenTarget) {
      this.targetAcquired = true
      this.x += Math.cos(this.angle) * speed
      this.y += Math.sin(this.angle) * speed
      return
    }

    // Pheromone sensing
    const targetType = this.hasFood ? 'home' : 'food'
    const left = this.sense(this.angle - CONFIG.sensorAngle, targetType)
    const center = this.sense(this.angle, targetType)
    const right = this.sense(this.angle + CONFIG.sensorAngle, targetType)

    if (center > left && center > right) {
      this.angle += (Math.random() - 0.5) * 0.05
      this.targetAcquired = true
    } else if (center < left && center < right) {
      this.angle += (Math.random() - 0.5) * 2 * CONFIG.turnSpeed
    } else if (left > right) {
      this.angle -= CONFIG.turnSpeed
      this.targetAcquired = true
    } else if (right > left) {
      this.angle += CONFIG.turnSpeed
      this.targetAcquired = true
    } else {
      this.angle += (Math.random() - 0.5) * 0.2
      this.targetAcquired = false
    }

    this.x += Math.cos(this.angle) * speed
    this.y += Math.sin(this.angle) * speed
  }

  sense(angle: number, type: 'food' | 'home'): number {
    const sx = this.x + Math.cos(angle) * CONFIG.sensorDist
    const sy = this.y + Math.sin(angle) * CONFIG.sensorDist
    const gx = Math.floor(sx / CONFIG.gridSize)
    const gy = Math.floor(sy / CONFIG.gridSize)

    if (gx < 0 || gx >= gridWidth || gy < 0 || gy >= gridHeight) return 0

    const cell = pheromoneGrid[gy * gridWidth + gx]
    let sum = 0
    if (cell) {
      for (const p of cell) {
        if (p.type === type) sum += p.life
      }
    }
    return sum
  }
}

class Queen {
  sprite: PIXI.Container

  constructor(x: number, y: number) {
    this.sprite = new PIXI.Container()
    this.sprite.x = x
    this.sprite.y = y

    // Body
    const body = new PIXI.Graphics()
    body.ellipse(0, 0, 18, 12)
    body.fill(0x9333ea)
    body.circle(12, 0, 8)
    body.fill(0x9333ea)
    this.sprite.addChild(body)

    // Crown
    const crown = new PIXI.Graphics()
    crown.moveTo(8, -8)
    crown.lineTo(12, -12)
    crown.lineTo(16, -8)
    crown.stroke({ width: 2, color: 0xffd700 })
    this.sprite.addChild(crown)

    // Nest visual
    const nest = new PIXI.Graphics()
    nest.circle(0, 0, 40)
    nest.fill({ color: 0x9333ea, alpha: 0.2 })
    nest.x = x
    nest.y = y
    terrainLayer.addChild(nest)

    entityLayer.addChild(this.sprite)
  }

  update() {
    this.sprite.rotation = Math.sin(Date.now() / 1000) * 0.1

    gameState.spawnTimer++
    if (gameState.spawnTimer > gameState.upgrades.spawn.val && ants.length < gameState.upgrades.cap.val) {
      gameState.spawnTimer = 0
      larvae.push(new Larva(this.sprite.x, this.sprite.y))
    }
  }
}

// Helper functions
function spawnParticles(x: number, y: number, color: number, count = 5) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color))
  }
}

function addPheromone(x: number, y: number, type: 'food' | 'home') {
  if (pheromones.length > CONFIG.maxPheromones) return
  const p = new Pheromone(x, y, type)
  pheromones.push(p)

  const gx = Math.floor(x / CONFIG.gridSize)
  const gy = Math.floor(y / CONFIG.gridSize)
  const idx = gy * gridWidth + gx
  if (idx >= 0 && idx < pheromoneGrid.length) {
    pheromoneGrid[idx].push(p)
  }
}

function addBiomass(amount: number) {
  gameState.biomass += amount
  biomass.value = Math.floor(gameState.biomass)
  updateUI()
}

function spawnFood(x: number, y: number, isBonus = false) {
  foods.push(new Food(x, y, isBonus))
  spawnParticles(x, y, 0xffffff, 5)
}

function drawTerrain() {
  if (!app) return
  splitX = app.screen.width * 0.4

  terrainGraphics.clear()

  // Fast zone
  terrainGraphics.rect(0, 0, splitX, app.screen.height)
  terrainGraphics.fill(0x1a1a1a)

  // Slow zone (sand)
  terrainGraphics.rect(splitX, 0, app.screen.width - splitX, app.screen.height)
  terrainGraphics.fill(0x3f2e26)

  // Grid lines
  for (let x = 0; x < app.screen.width; x += 50) {
    terrainGraphics.moveTo(x, 0)
    terrainGraphics.lineTo(x, app.screen.height)
  }
  for (let y = 0; y < app.screen.height; y += 50) {
    terrainGraphics.moveTo(0, y)
    terrainGraphics.lineTo(app.screen.width, y)
  }
  terrainGraphics.stroke({ width: 1, color: 0xffffff, alpha: 0.05 })

  // Divider
  terrainGraphics.moveTo(splitX, 0)
  terrainGraphics.lineTo(splitX, app.screen.height)
  terrainGraphics.stroke({ width: 3, color: 0xffa500, alpha: 0.3 })
}

function updateUI() {
  antCount.value = ants.length
  pherCount.value = pheromones.length
  popCap.value = Math.floor(gameState.upgrades.cap.val)

  upgrades.value = {
    spawn: { level: gameState.upgrades.spawn.level, cost: gameState.upgrades.spawn.cost },
    speed: { level: gameState.upgrades.speed.level, cost: gameState.upgrades.speed.cost },
    cap: { level: gameState.upgrades.cap.level, cost: gameState.upgrades.cap.cost },
    pher: { level: gameState.upgrades.pher.level, cost: gameState.upgrades.pher.cost }
  }
}

function buyUpgrade(type: 'spawn' | 'speed' | 'cap' | 'pher') {
  if (applyUpgrade(gameState, type) && queen) {
    spawnParticles(queen.sprite.x, queen.sprite.y, 0x4ade80, 20)
    biomass.value = Math.floor(gameState.biomass)
    updateUI()
  }
}

async function initGame() {
  if (!canvasContainer.value) return

  gameState = createInitialState()

  app = new PIXI.Application()
  await app.init({
    background: 0x111111,
    resizeTo: canvasContainer.value,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1
  })

  canvasContainer.value.appendChild(app.canvas)

  // Create layers
  terrainLayer = new PIXI.Container()
  trailLayer = new PIXI.Container()
  itemLayer = new PIXI.Container()
  entityLayer = new PIXI.Container()
  fxLayer = new PIXI.Container()

  app.stage.addChild(terrainLayer)
  app.stage.addChild(trailLayer)
  app.stage.addChild(itemLayer)
  app.stage.addChild(entityLayer)
  app.stage.addChild(fxLayer)

  // Setup graphics
  trailGraphics = new PIXI.Graphics()
  trailLayer.addChild(trailGraphics)

  terrainGraphics = new PIXI.Graphics()
  terrainLayer.addChild(terrainGraphics)

  // Setup grid
  gridWidth = Math.ceil(app.screen.width / CONFIG.gridSize) + 10
  gridHeight = Math.ceil(app.screen.height / CONFIG.gridSize) + 10
  pheromoneGrid = new Array(gridWidth * gridHeight).fill(null).map(() => [])

  drawTerrain()

  // Create queen
  queen = new Queen(app.screen.width * 0.2, app.screen.height * 0.5)

  // Initial ants
  for (let i = 0; i < 20; i++) {
    ants.push(new Ant(queen.sprite.x, queen.sprite.y))
  }

  // Initial food
  spawnFood(app.screen.width * 0.7, app.screen.height * 0.5)

  // Input handling
  const view = app.canvas
  view.addEventListener('mousedown', (e) => {
    const rect = view.getBoundingClientRect()
    spawnFood(e.clientX - rect.left, e.clientY - rect.top, true)
  })

  view.addEventListener('contextmenu', (e) => e.preventDefault())

  // Game loop
  app.ticker.add(gameLoop)

  // Hide tutorial after delay
  setTimeout(() => {
    showTutorial.value = false
  }, 5000)

  updateUI()
}

function gameLoop() {
  if (!queen || !app) return

  queen.update()

  // Auto-spawn food
  gameState.autoFoodTimer++
  if (gameState.autoFoodTimer > 300) {
    gameState.autoFoodTimer = 0
    const rx = splitX + Math.random() * (app.screen.width - splitX)
    const ry = Math.random() * app.screen.height
    spawnFood(rx, ry)
    if (Math.random() > 0.5) {
      spawnFood(app.screen.width * 0.9, Math.random() * app.screen.height)
    }
  }

  // Update larvae
  for (let i = larvae.length - 1; i >= 0; i--) {
    if (larvae[i].update()) {
      ants.push(new Ant(larvae[i].x, larvae[i].y))
      larvae.splice(i, 1)
      updateUI()
    }
  }

  // Update ants
  for (let i = ants.length - 1; i >= 0; i--) {
    if (ants[i].update()) {
      ants.splice(i, 1)
      updateUI()
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].update()) {
      particles[i].destroy()
      particles.splice(i, 1)
    }
  }

  // Update pheromones
  trailGraphics.clear()
  for (let i = 0; i < pheromoneGrid.length; i++) {
    pheromoneGrid[i] = []
  }

  const decayRate = gameState.upgrades.pher.val
  for (let i = pheromones.length - 1; i >= 0; i--) {
    const p = pheromones[i]
    p.life -= decayRate

    if (p.life <= 0) {
      pheromones.splice(i, 1)
    } else {
      const color = p.type === 'food' ? 0xef4444 : 0x3b82f6
      trailGraphics.rect(p.x, p.y, 2, 2)
      trailGraphics.fill({ color, alpha: p.life * 0.4 })

      const gx = Math.floor(p.x / CONFIG.gridSize)
      const gy = Math.floor(p.y / CONFIG.gridSize)
      const idx = gy * gridWidth + gx
      if (idx >= 0 && idx < pheromoneGrid.length) {
        pheromoneGrid[idx].push(p)
      }
    }
  }

  pherCount.value = pheromones.length
}

// Watch fullscreen changes
watch(() => props.isFullscreen, () => {
  nextTick(() => {
    if (app && canvasContainer.value) {
      app.renderer.resize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
      drawTerrain()
    }
  })
})

onMounted(() => {
  initGame()
})

onUnmounted(() => {
  if (app) {
    app.destroy(true, { children: true })
    app = null
  }
})

// Expose upgrade function
defineExpose({ buyUpgrade })
</script>

<template>
  <div
    class="antcolony-game relative w-full"
    :class="props.isFullscreen ? 'h-full' : 'h-[800px]'"
    style="background-color: #111111"
  >
    <!-- HUD Top -->
    <div class="absolute top-0 left-0 right-0 z-20 p-5 flex justify-between items-start pointer-events-none"
         style="background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);">
      <div class="text-4xl text-emerald-400 font-bold px-5 py-2 rounded-xl pointer-events-auto"
           style="background: rgba(0,0,0,0.6); border: 1px solid #4ade80; font-family: 'Righteous', cursive, sans-serif;">
        {{ biomass }} ☘
      </div>
      <div class="text-sm text-gray-400 text-right p-3 rounded-lg" style="background: rgba(0,0,0,0.5);">
        <div>Population: <span class="text-white font-mono">{{ antCount }}</span> / <span class="text-gray-500 font-mono">{{ popCap }}</span></div>
        <div>Active Trails: <span class="text-blue-400 font-mono">{{ pherCount }}</span></div>
      </div>
    </div>

    <!-- Tutorial -->
    <Transition name="fade">
      <div v-if="showTutorial" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-center p-8 rounded-2xl pointer-events-none"
           style="background: rgba(0,0,0,0.8); border: 1px solid #444;">
        <h1 class="text-2xl font-bold text-yellow-400 mb-2">Welcome, Overseer</h1>
        <p class="text-gray-300">Click anywhere to spawn Food.</p>
        <p class="text-gray-300">Ants collect food to generate Biomass.</p>
        <p class="text-gray-300">Spend Biomass to evolve the colony.</p>
      </div>
    </Transition>

    <!-- HUD Bottom - Upgrades -->
    <div class="absolute bottom-0 left-0 right-0 z-20 p-5 flex gap-3 justify-center"
         style="background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);">
      <button
        class="upgrade-btn"
        :disabled="biomass < upgrades.spawn.cost"
        @click="buyUpgrade('spawn')"
      >
        <span class="btn-level">Lvl {{ upgrades.spawn.level }}</span>
        <div class="btn-title">Incubator</div>
        <div class="btn-cost">{{ upgrades.spawn.cost }} ☘</div>
        <div class="text-xs text-gray-400">Spawn Rate</div>
      </button>

      <button
        class="upgrade-btn"
        :disabled="biomass < upgrades.speed.cost"
        @click="buyUpgrade('speed')"
      >
        <span class="btn-level">Lvl {{ upgrades.speed.level }}</span>
        <div class="btn-title">Metabolism</div>
        <div class="btn-cost">{{ upgrades.speed.cost }} ☘</div>
        <div class="text-xs text-gray-400">Move Speed</div>
      </button>

      <button
        class="upgrade-btn"
        :disabled="biomass < upgrades.cap.cost"
        @click="buyUpgrade('cap')"
      >
        <span class="btn-level">Lvl {{ upgrades.cap.level }}</span>
        <div class="btn-title">Hive Size</div>
        <div class="btn-cost">{{ upgrades.cap.cost }} ☘</div>
        <div class="text-xs text-gray-400">Max Ants</div>
      </button>

      <button
        class="upgrade-btn"
        :disabled="biomass < upgrades.pher.cost"
        @click="buyUpgrade('pher')"
      >
        <span class="btn-level">Lvl {{ upgrades.pher.level }}</span>
        <div class="btn-title">Pheromones</div>
        <div class="btn-cost">{{ upgrades.pher.cost }} ☘</div>
        <div class="text-xs text-gray-400">Trail Duration</div>
      </button>
    </div>

    <!-- Canvas Container -->
    <div ref="canvasContainer" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
.antcolony-game :deep(canvas) {
  display: block;
}

.upgrade-btn {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 10px 15px;
  width: 160px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  color: white;
}

.upgrade-btn:hover:not(:disabled) {
  background: #475569;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.upgrade-btn:active:not(:disabled) {
  transform: translateY(0);
}

.upgrade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.btn-title {
  font-weight: bold;
  font-size: 0.9rem;
  color: #f8fafc;
  margin-bottom: 4px;
}

.btn-cost {
  color: #fbbf24;
  font-size: 1.1rem;
  font-weight: bold;
}

.btn-level {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.7rem;
  color: #94a3b8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
