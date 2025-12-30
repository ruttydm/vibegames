<template>
  <div ref="containerRef" class="relative w-full h-full overflow-hidden bg-[#1a261a]">
    <!-- Start Screen -->
    <div
      v-if="gameScreen === 'start'"
      class="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white z-10"
    >
      <h1 class="text-5xl md:text-6xl mb-4 text-yellow-500 font-serif">WATERLOO MINI</h1>
      <p class="text-xl mb-8 text-gray-300">Grand Battle Edition</p>

      <div class="grid grid-cols-3 gap-4 md:gap-8 mb-8 text-center px-4">
        <div class="bg-gray-800 p-4 rounded border border-gray-600">
          <div class="text-yellow-400 font-bold">INFANTRY</div>
          <div class="text-sm text-gray-400">Balanced Ranged</div>
        </div>
        <div class="bg-gray-800 p-4 rounded border border-gray-600">
          <div class="text-yellow-400 font-bold">CAVALRY</div>
          <div class="text-sm text-gray-400">Fast Melee Shock</div>
        </div>
        <div class="bg-gray-800 p-4 rounded border border-gray-600">
          <div class="text-yellow-400 font-bold">ARTILLERY</div>
          <div class="text-sm text-gray-400">Long Range Siege</div>
        </div>
      </div>

      <div class="text-sm text-gray-400 mb-6 max-w-md text-center px-4">
        <p class="mb-2"><strong>Left Click / Drag</strong> - Select units</p>
        <p class="mb-2"><strong>Right Click</strong> - Move (preserve formation)</p>
        <p class="text-yellow-400"><strong>Right Click + Drag</strong> - Move to start point, face toward end</p>
      </div>

      <div class="text-xs text-gray-500 mb-8 max-w-lg text-center px-4">
        <p class="mb-2 text-gray-400">Formation Hotkeys (press to change formation type):</p>
        <div class="flex flex-wrap justify-center gap-2">
          <span class="px-2 py-1 bg-gray-800 rounded"><strong>1</strong> Line</span>
          <span class="px-2 py-1 bg-gray-800 rounded"><strong>2</strong> Column</span>
          <span class="px-2 py-1 bg-gray-800 rounded"><strong>3</strong> Square</span>
          <span class="px-2 py-1 bg-gray-800 rounded"><strong>4</strong> Wedge</span>
          <span class="px-2 py-1 bg-gray-800 rounded"><strong>5</strong> Skirmish</span>
          <span class="px-2 py-1 bg-gray-800 rounded"><strong>6</strong> Hollow□</span>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <button
          class="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded shadow-lg transition transform hover:scale-105"
          @click="startGame(false)"
        >
          SOLO BATTLE
        </button>
        <button
          class="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition transform hover:scale-105"
          @click="startGame(true)"
        >
          LOCAL MULTIPLAYER (2P)
        </button>
      </div>
    </div>

    <!-- Phaser Game Container -->
    <div ref="gameContainerRef" class="w-full h-full" />

    <!-- Game UI Overlay -->
    <div v-if="gameScreen === 'playing'" class="absolute inset-0 pointer-events-none">
      <!-- Top Bar -->
      <div class="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-start p-4">
        <div class="text-white">
          <span class="text-blue-400 font-bold">ALLIES:</span>
          <span class="ml-1">{{ teamCounts.allies }}</span>
        </div>
        <div class="text-white font-serif text-lg md:text-xl">
          {{ isMultiplayer ? `PLAYER ${localTeam + 1} TURN` : 'BATTLE IN PROGRESS' }}
        </div>
        <div class="text-white">
          <span class="text-red-400 font-bold">ENEMIES:</span>
          <span class="ml-1">{{ teamCounts.enemies }}</span>
        </div>
      </div>

      <!-- Bottom Controls -->
      <div class="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
        <button class="unit-btn" @click="selectByType('INFANTRY')">
          <span class="text-lg">I</span>
          <span class="text-xs">Inf</span>
        </button>
        <button class="unit-btn" @click="selectByType('CAVALRY')">
          <span class="text-lg">C</span>
          <span class="text-xs">Cav</span>
        </button>
        <button class="unit-btn" @click="selectByType('ARTILLERY')">
          <span class="text-lg">A</span>
          <span class="text-xs">Art</span>
        </button>
        <button class="unit-btn" @click="selectAllUnits">
          <span class="text-lg">*</span>
          <span class="text-xs">All</span>
        </button>
      </div>

      <!-- Formation Type Indicator -->
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 -translate-y-14 bg-gray-900/80 border border-yellow-600/50 px-3 py-1 rounded text-xs text-yellow-400 pointer-events-none">
        Formation: <span class="font-bold">{{ formationLabel }}</span>
        <span class="text-gray-500 ml-2">(1-6)</span>
      </div>

      <!-- Music Toggle -->
      <div class="absolute bottom-4 right-4 pointer-events-auto">
        <button
          class="unit-btn"
          :class="musicEnabled ? 'bg-yellow-900/80' : 'bg-gray-800/80'"
          @click="toggleMusic"
        >
          <span class="text-lg">{{ musicEnabled ? '♪' : '♪' }}</span>
          <span class="text-xs">{{ musicEnabled ? 'On' : 'Off' }}</span>
        </button>
      </div>

      <!-- Selection Panel -->
      <div
        v-if="selectedUnit"
        class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 border border-gray-600 px-6 py-3 rounded-lg flex gap-4 items-center text-white"
      >
        <div
          class="w-8 h-8 rounded flex items-center justify-center font-bold"
          :class="selectedUnit.team === 0 ? 'bg-blue-600' : 'bg-red-600'"
        >
          {{ selectedUnit.stats.symbol }}
        </div>
        <div>
          <div class="font-bold text-sm">
            {{ selectedUnit.stats.name }}
            <span v-if="selectedUnitCount > 1" class="text-gray-400">(+{{ selectedUnitCount - 1 }})</span>
          </div>
          <div class="w-32 h-2 bg-gray-700 rounded mt-1 overflow-hidden">
            <div
              class="h-full bg-green-500 transition-all"
              :style="{ width: `${(selectedUnit.currentHp / selectedUnit.stats.hp) * 100}%` }"
            />
          </div>
          <div class="w-32 h-1 bg-gray-700 rounded mt-1 overflow-hidden">
            <div
              class="h-full bg-yellow-500 transition-all"
              :style="{ width: `${Math.max(0, (selectedUnit.currentMorale / selectedUnit.stats.morale) * 100)}%` }"
            />
          </div>
        </div>
        <div class="text-xs text-gray-400 pl-2 border-l border-gray-600">
          State: <span class="text-white">{{ unitStateLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Game Over Screen -->
    <div
      v-if="gameScreen === 'gameover'"
      class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20"
    >
      <h1
        class="text-5xl mb-4 font-serif"
        :class="isVictory ? 'text-yellow-400' : 'text-red-600'"
      >
        {{ isVictory ? 'VICTORY!' : 'DEFEAT' }}
      </h1>
      <p class="text-xl mb-8 text-gray-300">
        {{ isVictory ? 'The enemy army has been routed from the field.' : 'Your forces have been broken.' }}
      </p>
      <button
        class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg"
        @click="restartGame"
      >
        Play Again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, shallowRef, nextTick } from 'vue'
import {
  type GameState,
  type Unit,
  type TerrainMap,
  Team,
  UnitState,
  CommandType,
  FormationType,
  TerrainType,
  CONFIG,
  UNIT_TYPES,
  createInitialState,
  gameUpdate,
  selectUnitsInRect,
  selectUnitsByType,
  selectAllUnits as engineSelectAll,
  selectNearbyUnitsOfSameType,
  issueCommand,
  getTeamCounts,
  isDead,
  dist,
  getFormationPositions
} from '~/games/waterloo/engine'
import { getAudioEngine } from '~/audio/engine'
import {
  playMusketFire,
  playCannonFire,
  playCannonImpact,
  playCavalryCharge,
  playUnitHit,
  playOrderIssued,
  playUnitSelect,
  playBattleVictory,
  playBattleDefeat,
  playUnitRouting,
  registerWaterlooMusic
} from '~/games/waterloo/audio'

const props = defineProps<{
  isFullscreen?: boolean
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const gameContainerRef = ref<HTMLDivElement | null>(null)

const gameScreen = ref<'start' | 'playing' | 'gameover'>('start')
const isMultiplayer = ref(false)
const localTeam = ref(0)

// Shared game state
const gameState = shallowRef<GameState | null>(null)
let phaserGame: any = null
let phaserModule: typeof import('phaser') | null = null

// Audio state
const musicEnabled = ref(true)
let audioInitialized = false
let lastProjectileCount = 0
let lastUnitCount = 0
let routingUnitsPlayed = new Set<string>()

// Current formation type (changed via hotkeys 1-6)
const currentFormationType = ref<FormationType>(FormationType.LINE)

const teamCounts = computed(() => {
  if (!gameState.value) return { allies: 0, enemies: 0 }
  return getTeamCounts(gameState.value)
})

const selectedUnit = computed<Unit | null>(() => {
  if (!gameState.value || gameState.value.selectedUnitIds.length === 0) return null
  return gameState.value.units.find((u) => u.id === gameState.value!.selectedUnitIds[0]) || null
})

const selectedUnitCount = computed(() => {
  return gameState.value?.selectedUnitIds.length || 0
})

const unitStateLabel = computed(() => {
  if (!selectedUnit.value) return 'IDLE'
  const u = selectedUnit.value
  if (u.state === UnitState.ROUTING) return 'ROUTING'
  if (u.command === CommandType.ATTACK) return 'CHARGING'
  if (u.command === CommandType.MOVE) return 'MOVING'
  if (u.state === UnitState.COMBAT) return 'COMBAT'
  return 'IDLE'
})

const isVictory = computed(() => {
  return gameState.value?.winner === Team.PLAYER
})

const formationLabel = computed(() => {
  const labels: Record<FormationType, string> = {
    [FormationType.LINE]: 'LINE',
    [FormationType.COLUMN]: 'COLUMN',
    [FormationType.SQUARE]: 'SQUARE',
    [FormationType.WEDGE]: 'WEDGE',
    [FormationType.SKIRMISH]: 'SKIRMISH',
    [FormationType.HOLLOW_SQUARE]: 'HOLLOW'
  }
  return labels[currentFormationType.value]
})

// Create the Phaser scene class dynamically after Phaser is loaded
function createBattleSceneClass(Phaser: typeof import('phaser')) {
  return class BattleScene extends Phaser.Scene {
    private graphics!: Phaser.GameObjects.Graphics
    private unitGraphics: Map<string, Phaser.GameObjects.Container> = new Map()
    private projectileGraphics: Map<string, Phaser.GameObjects.Arc> = new Map()
    private particleGraphics: Map<string, Phaser.GameObjects.Arc | Phaser.GameObjects.Text> = new Map()
    private selectionBox!: Phaser.GameObjects.Rectangle
    private formationPreview!: Phaser.GameObjects.Graphics

    private isDraggingSelection = false
    private isFormingLine = false
    private dragStart = { x: 0, y: 0 }
    private formationStart = { x: 0, y: 0 }
    private lastClickTime = 0
    private lastClickPos = { x: 0, y: 0 }
    private readonly DOUBLE_CLICK_THRESHOLD = 300 // ms
    private readonly DOUBLE_CLICK_DISTANCE = 20 // pixels

    constructor() {
      super({ key: 'BattleScene' })
    }

    create() {
      this.cameras.main.setBackgroundColor('#3e5f33')

      this.graphics = this.add.graphics()
      this.drawTerrain()

      this.selectionBox = this.add.rectangle(0, 0, 0, 0, 0xffffff, 0.2)
      this.selectionBox.setStrokeStyle(1, 0xffffff)
      this.selectionBox.setVisible(false)
      this.selectionBox.setDepth(100)

      this.formationPreview = this.add.graphics()
      this.formationPreview.setDepth(101)

      this.input.on('pointerdown', this.handlePointerDown, this)
      this.input.on('pointermove', this.handlePointerMove, this)
      this.input.on('pointerup', this.handlePointerUp, this)

      this.input.mouse?.disableContextMenu()
    }

    drawTerrain() {
      if (!gameState.value) return

      const terrain = gameState.value.terrain
      const { cellSize, cols, rows, cells } = terrain

      // Terrain colors
      const terrainColors: Record<TerrainType, { fill: number; alpha: number }> = {
        [TerrainType.GRASS]: { fill: 0x3e5f33, alpha: 0 }, // Base color, no overlay
        [TerrainType.HILL]: { fill: 0x6b8e5f, alpha: 0.6 },
        [TerrainType.FOREST]: { fill: 0x2d5a27, alpha: 0.7 },
        [TerrainType.ROAD]: { fill: 0x8b7355, alpha: 0.5 },
        [TerrainType.MUD]: { fill: 0x5c4033, alpha: 0.6 },
        [TerrainType.BUILDING]: { fill: 0x7f8c8d, alpha: 0.9 }
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = cells[row][col]
          const color = terrainColors[cell.type]

          if (color.alpha > 0) {
            this.graphics.fillStyle(color.fill, color.alpha)
            this.graphics.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)

            // Draw elevation shading for hills
            if (cell.type === TerrainType.HILL && cell.elevation > 0) {
              this.graphics.fillStyle(0xffffff, cell.elevation * 0.08)
              this.graphics.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
            }

            // Draw tree symbols for forests
            if (cell.type === TerrainType.FOREST) {
              this.graphics.fillStyle(0x1a4d1a, 0.8)
              const cx = col * cellSize + cellSize / 2
              const cy = row * cellSize + cellSize / 2
              this.graphics.fillTriangle(
                cx, cy - 12,
                cx - 10, cy + 8,
                cx + 10, cy + 8
              )
            }

            // Draw building symbol
            if (cell.type === TerrainType.BUILDING) {
              this.graphics.fillStyle(0x5a5a5a, 1)
              const cx = col * cellSize + cellSize / 2
              const cy = row * cellSize + cellSize / 2
              this.graphics.fillRect(cx - 15, cy - 10, 30, 20)
              this.graphics.fillStyle(0x8b0000, 1)
              this.graphics.fillTriangle(cx - 18, cy - 10, cx, cy - 22, cx + 18, cy - 10)
            }
          }
        }
      }

      // Draw subtle grid lines
      this.graphics.lineStyle(1, 0x000000, 0.05)
      for (let i = 0; i <= this.scale.width; i += 200) {
        this.graphics.beginPath()
        this.graphics.moveTo(i, 0)
        this.graphics.lineTo(i, this.scale.height)
        this.graphics.strokePath()
      }
      for (let j = 0; j <= this.scale.height; j += 200) {
        this.graphics.beginPath()
        this.graphics.moveTo(0, j)
        this.graphics.lineTo(this.scale.width, j)
        this.graphics.strokePath()
      }
    }

    handlePointerDown(pointer: Phaser.Input.Pointer) {
      if (!gameState.value) return

      if (pointer.leftButtonDown()) {
        this.isDraggingSelection = true
        this.dragStart = { x: pointer.x, y: pointer.y }
        this.selectionBox.setVisible(true)
        this.selectionBox.setPosition(pointer.x, pointer.y)
        this.selectionBox.setSize(0, 0)
      } else if (pointer.rightButtonDown()) {
        if (gameState.value.selectedUnitIds.length === 0) return
        this.isFormingLine = true
        this.formationStart = { x: pointer.x, y: pointer.y }
      }
    }

    handlePointerMove(pointer: Phaser.Input.Pointer) {
      if (this.isDraggingSelection) {
        const width = pointer.x - this.dragStart.x
        const height = pointer.y - this.dragStart.y
        this.selectionBox.setPosition(
          this.dragStart.x + width / 2,
          this.dragStart.y + height / 2
        )
        this.selectionBox.setSize(Math.abs(width), Math.abs(height))
      }

      if (this.isFormingLine && gameState.value) {
        this.drawFormationPreview(pointer.x, pointer.y)
      }
    }

    handlePointerUp(pointer: Phaser.Input.Pointer) {
      if (!gameState.value) return

      if (pointer.leftButtonReleased() && this.isDraggingSelection) {
        this.isDraggingSelection = false
        this.selectionBox.setVisible(false)

        const now = Date.now()
        const clickDist = Math.sqrt(
          (pointer.x - this.lastClickPos.x) ** 2 +
          (pointer.y - this.lastClickPos.y) ** 2
        )
        const isDoubleClick = (now - this.lastClickTime < this.DOUBLE_CLICK_THRESHOLD) &&
          (clickDist < this.DOUBLE_CLICK_DISTANCE)

        const prevSelected = gameState.value.selectedUnitIds.length

        if (isDoubleClick) {
          // Double-click: select nearby units of same type (Total War style)
          selectNearbyUnitsOfSameType(
            gameState.value,
            pointer.x,
            pointer.y,
            gameState.value.localTeam,
            150 // radius
          )
        } else {
          // Single click/drag: normal selection
          selectUnitsInRect(
            gameState.value,
            this.dragStart.x,
            this.dragStart.y,
            pointer.x,
            pointer.y,
            gameState.value.localTeam
          )
        }

        // Update last click tracking
        this.lastClickTime = now
        this.lastClickPos = { x: pointer.x, y: pointer.y }

        // Play selection sound if units were selected
        if (gameState.value.selectedUnitIds.length > 0 && gameState.value.selectedUnitIds.length !== prevSelected) {
          playUnitSelect()
        }

        gameState.value = { ...gameState.value }
      }

      if (pointer.rightButtonReleased() && this.isFormingLine) {
        this.isFormingLine = false
        this.formationPreview.clear()

        // Play order sound if units are selected
        if (gameState.value.selectedUnitIds.length > 0) {
          // Check if any cavalry is selected for charge sound
          const selectedUnits = gameState.value.units.filter(u => gameState.value!.selectedUnitIds.includes(u.id))
          const hasCavalry = selectedUnits.some(u => u.typeStr === 'CAVALRY')
          if (hasCavalry) {
            playCavalryCharge()
          } else {
            playOrderIssued()
          }
        }

        issueCommand(
          gameState.value,
          this.formationStart.x,
          this.formationStart.y,
          pointer.x,
          pointer.y,
          currentFormationType.value
        )
      }
    }

    drawFormationPreview(mouseX: number, mouseY: number) {
      if (!gameState.value) return

      this.formationPreview.clear()

      const startX = this.formationStart.x
      const startY = this.formationStart.y
      const dx = mouseX - startX
      const dy = mouseY - startY
      const dragDist = Math.sqrt(dx * dx + dy * dy)

      // Only show preview when drag is significant
      if (dragDist <= CONFIG.formationDragThreshold) return

      const facingAngle = Math.atan2(dy, dx)  // Face from start toward mouse
      const selectedCount = gameState.value.selectedUnitIds.length

      // Get actual formation positions using the current formation type
      const positions = getFormationPositions(
        selectedCount,
        { x: startX, y: startY },
        facingAngle,
        currentFormationType.value
      )

      // Draw formation destination markers
      this.formationPreview.fillStyle(0x00ff00, 0.6)
      for (const pos of positions) {
        this.formationPreview.fillCircle(pos.x, pos.y, 4)
      }

      // Draw facing direction arrow from center
      this.formationPreview.lineStyle(3, 0xffff00, 0.9)
      this.formationPreview.beginPath()
      this.formationPreview.moveTo(startX, startY)
      this.formationPreview.lineTo(mouseX, mouseY)
      this.formationPreview.strokePath()

      // Arrow head
      const arrowSize = 12
      const arrowAngle1 = facingAngle + Math.PI * 0.85
      const arrowAngle2 = facingAngle - Math.PI * 0.85
      this.formationPreview.fillStyle(0xffff00, 0.9)
      this.formationPreview.fillTriangle(
        mouseX,
        mouseY,
        mouseX + Math.cos(arrowAngle1) * arrowSize,
        mouseY + Math.sin(arrowAngle1) * arrowSize,
        mouseX + Math.cos(arrowAngle2) * arrowSize,
        mouseY + Math.sin(arrowAngle2) * arrowSize
      )

      // Draw formation center marker
      this.formationPreview.lineStyle(2, 0x00ff00, 0.8)
      this.formationPreview.strokeCircle(startX, startY, 8)

      // Formation type label - show at start position
      const formationLabels: Record<string, string> = {
        [FormationType.LINE]: 'LINE',
        [FormationType.COLUMN]: 'COLUMN',
        [FormationType.SQUARE]: 'SQUARE',
        [FormationType.WEDGE]: 'WEDGE',
        [FormationType.SKIRMISH]: 'SKIRMISH',
        [FormationType.HOLLOW_SQUARE]: 'HOLLOW □'
      }

      // Note: Text rendering in Phaser Graphics is limited, so we use a simple approach
      // The formation name will be shown when command is issued as a particle
    }

    update(_time: number, delta: number) {
      if (!gameState.value || gameState.value.isGameOver) return

      const dt = delta / 1000

      // Track projectiles before update for sound effects
      const prevProjectileCount = gameState.value.projectiles.length

      gameUpdate(gameState.value, dt)

      // Play sounds for new projectiles (weapon fire)
      const newProjectiles = gameState.value.projectiles.length - prevProjectileCount
      if (newProjectiles > 0) {
        // Check what type of projectile was fired
        const recentProjectiles = gameState.value.projectiles.slice(-newProjectiles)
        for (const proj of recentProjectiles) {
          if (proj.type === 'cannonball') {
            playCannonFire()
          } else if (Math.random() < 0.3) {
            // Only play some musket sounds to avoid cacophony
            playMusketFire()
          }
        }
      }

      // Play sounds for routing units
      for (const unit of gameState.value.units) {
        if (unit.state === UnitState.ROUTING && !routingUnitsPlayed.has(unit.id)) {
          routingUnitsPlayed.add(unit.id)
          if (Math.random() < 0.3) {
            playUnitRouting()
          }
        }
      }

      // Play hit sounds for particles (blood particles indicate hits)
      const bloodParticles = gameState.value.particles.filter(p => p.type === 'blood' && p.life > 0.9)
      if (bloodParticles.length > 0 && Math.random() < 0.2) {
        playUnitHit()
      }

      // Cannon impacts
      const craterParticles = gameState.value.particles.filter(p => p.type === 'crater' && p.life > 0.9)
      if (craterParticles.length > 0) {
        playCannonImpact()
      }

      if (gameState.value.isGameOver) {
        gameScreen.value = 'gameover'
        // Play victory or defeat sound
        getAudioEngine().stopSong()
        if (gameState.value.winner === Team.PLAYER) {
          playBattleVictory()
        } else {
          playBattleDefeat()
        }
        return
      }

      this.updateUnitGraphics()
      this.updateProjectileGraphics()
      this.updateParticleGraphics()

      gameState.value = { ...gameState.value }
    }

    updateUnitGraphics() {
      if (!gameState.value) return

      const activeIds = new Set<string>()

      for (const unit of gameState.value.units) {
        activeIds.add(unit.id)

        let container = this.unitGraphics.get(unit.id)

        if (!container) {
          container = this.createUnitGraphic(unit)
          this.unitGraphics.set(unit.id, container)
        }

        container.setPosition(unit.x, unit.y)
        container.setRotation(unit.angle)

        if (isDead(unit)) {
          container.setAlpha(0.3)
          container.setDepth(0)
        } else {
          container.setAlpha(1)
          container.setDepth(10)

          const isSelected = gameState.value!.selectedUnitIds.includes(unit.id)

          const selectionRing = container.getByName('selection') as Phaser.GameObjects.Arc
          if (selectionRing) {
            selectionRing.setVisible(isSelected)
          }

          // Show range circle only for selected units with significant range
          const rangeCircle = container.getByName('range') as Phaser.GameObjects.Arc
          if (rangeCircle) {
            rangeCircle.setVisible(isSelected && unit.stats.range > 50)
          }

          const body = container.getByName('body') as Phaser.GameObjects.Arc
          if (body && unit.flash > 0) {
            body.setFillStyle(0xffffff)
          } else if (body) {
            const baseColor = unit.team === Team.PLAYER
              ? parseInt(unit.stats.color.slice(1), 16)
              : 0xb91c1c
            const drawColor = unit.state === UnitState.ROUTING ? 0xdddddd : baseColor
            body.setFillStyle(drawColor)
          }

          const healthBar = container.getByName('healthFill') as Phaser.GameObjects.Rectangle
          if (healthBar) {
            const healthPercent = unit.currentHp / unit.stats.hp
            healthBar.setScale(healthPercent, 1)
            healthBar.setVisible(unit.currentHp < unit.stats.hp)
          }
          const healthBg = container.getByName('healthBg') as Phaser.GameObjects.Rectangle
          if (healthBg) {
            healthBg.setVisible(unit.currentHp < unit.stats.hp)
          }
        }
      }

      for (const [id, container] of this.unitGraphics) {
        if (!activeIds.has(id)) {
          container.destroy()
          this.unitGraphics.delete(id)
        }
      }
    }

    createUnitGraphic(unit: Unit): Phaser.GameObjects.Container {
      const container = this.add.container(unit.x, unit.y)

      const w = unit.stats.width
      const h = unit.stats.height
      const baseColor = unit.team === Team.PLAYER
        ? parseInt(unit.stats.color.slice(1), 16)
        : 0xb91c1c

      // Range circle (shows attack range when selected)
      const rangeCircle = this.add.circle(0, 0, unit.stats.range, 0xffff00, 0)
      rangeCircle.setStrokeStyle(1, 0xffff00, 0.25)
      rangeCircle.setName('range')
      rangeCircle.setVisible(false)
      rangeCircle.setDepth(-1) // Behind units
      container.add(rangeCircle)

      const selectionRing = this.add.circle(0, 0, w, 0x00ff00, 0)
      selectionRing.setStrokeStyle(1, 0x00ff00)
      selectionRing.setName('selection')
      selectionRing.setVisible(false)
      container.add(selectionRing)

      if (unit.typeStr === 'INFANTRY') {
        const body = this.add.circle(0, 0, w / 2, baseColor)
        body.setName('body')
        container.add(body)

        const musket = this.add.rectangle(w / 2 + 2, 0, w + 4, 1.5, 0x333333)
        container.add(musket)
      } else if (unit.typeStr === 'CAVALRY') {
        const horse = this.add.circle(0, 0, w / 2 + 2, 0x5d4037)
        container.add(horse)

        const body = this.add.circle(0, 0, w / 2 - 2, baseColor)
        body.setName('body')
        container.add(body)

        const saber = this.add.rectangle(w / 2 + 1, 1, w + 2, 1.5, 0xcccccc)
        container.add(saber)
      } else if (unit.typeStr === 'ARTILLERY') {
        const wheel1 = this.add.rectangle(-2, -h / 2 - 2, 4, 4, 0x333333)
        const wheel2 = this.add.rectangle(-2, h / 2 - 2, 4, 4, 0x333333)
        container.add([wheel1, wheel2])

        const barrel = this.add.rectangle(2, 0, w + 4, 4, 0x444444)
        container.add(barrel)

        const body = this.add.circle(-w / 2, 0, 3, baseColor)
        body.setName('body')
        container.add(body)
      }

      const healthBg = this.add.rectangle(0, -h / 2 - 4, w, 2, 0xff0000)
      healthBg.setName('healthBg')
      healthBg.setVisible(false)
      container.add(healthBg)

      const healthFill = this.add.rectangle(-w / 2, -h / 2 - 4, w, 2, 0x00ff00)
      healthFill.setOrigin(0, 0.5)
      healthFill.setName('healthFill')
      healthFill.setVisible(false)
      container.add(healthFill)

      return container
    }

    updateProjectileGraphics() {
      if (!gameState.value) return

      const activeIds = new Set<string>()

      for (const proj of gameState.value.projectiles) {
        activeIds.add(proj.id)

        let graphic = this.projectileGraphics.get(proj.id)

        if (!graphic) {
          const size = proj.type === 'cannonball' ? 4 : 1.5
          graphic = this.add.circle(proj.x, proj.y, size, 0x000000)
          graphic.setDepth(50)
          this.projectileGraphics.set(proj.id, graphic)
        }

        graphic.setPosition(proj.x, proj.y)
      }

      for (const [id, graphic] of this.projectileGraphics) {
        if (!activeIds.has(id)) {
          graphic.destroy()
          this.projectileGraphics.delete(id)
        }
      }
    }

    updateParticleGraphics() {
      if (!gameState.value) return

      const activeIds = new Set<string>()

      for (const particle of gameState.value.particles) {
        activeIds.add(particle.id)

        let graphic = this.particleGraphics.get(particle.id)

        if (!graphic) {
          if (particle.type === 'text') {
            const text = this.add.text(particle.x, particle.y, particle.text || '', {
              fontFamily: 'Arial',
              fontSize: '14px',
              fontStyle: 'bold',
              color: particle.color
            })
            text.setDepth(60)
            graphic = text as unknown as Phaser.GameObjects.Arc
          } else {
            const circle = this.add.circle(particle.x, particle.y, particle.size,
              particle.type === 'smoke' ? 0xc8c8c8 :
              particle.type === 'blood' ? 0xb40000 : 0x3c3228
            )
            circle.setDepth(particle.type === 'crater' ? 1 : 55)
            graphic = circle
          }
          this.particleGraphics.set(particle.id, graphic)
        }

        graphic.setPosition(particle.x, particle.y)
        graphic.setAlpha(Math.max(0, particle.life))

        if (particle.type === 'smoke' && graphic instanceof Phaser.GameObjects.Arc) {
          graphic.setRadius(particle.size)
        }
      }

      for (const [id, graphic] of this.particleGraphics) {
        if (!activeIds.has(id)) {
          graphic.destroy()
          this.particleGraphics.delete(id)
        }
      }
    }

    resizeGame(width: number, height: number) {
      this.scale.resize(width, height)
      this.graphics.clear()
      this.drawGrid()

      if (gameState.value) {
        gameState.value.width = width
        gameState.value.height = height
      }
    }

    shutdown() {
      this.unitGraphics.forEach(g => g.destroy())
      this.projectileGraphics.forEach(g => g.destroy())
      this.particleGraphics.forEach(g => g.destroy())
      this.unitGraphics.clear()
      this.projectileGraphics.clear()
      this.particleGraphics.clear()
    }
  }
}

async function startGame(multiplayer: boolean) {
  isMultiplayer.value = multiplayer
  gameScreen.value = 'playing'

  // Initialize audio
  if (!audioInitialized) {
    const engine = getAudioEngine()
    await engine.init()
    registerWaterlooMusic()
    audioInitialized = true
  }

  // Start music if enabled
  if (musicEnabled.value) {
    getAudioEngine().startSong('waterloo-march')
  }

  // Reset audio tracking
  lastProjectileCount = 0
  lastUnitCount = 0
  routingUnitsPlayed.clear()

  // Dynamically import Phaser on client side
  if (!phaserModule) {
    phaserModule = await import('phaser')
  }

  await nextTick()
  initPhaserGame()
}

function restartGame() {
  getAudioEngine().stopSong()
  destroyPhaserGame()
  gameScreen.value = 'start'
}

function toggleMusic() {
  musicEnabled.value = !musicEnabled.value
  const engine = getAudioEngine()
  if (musicEnabled.value) {
    engine.startSong('waterloo-march')
  } else {
    engine.stopSong()
  }
}

function initPhaserGame() {
  if (!gameContainerRef.value || !containerRef.value || !phaserModule) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  gameState.value = createInitialState(width, height, isMultiplayer.value, Team.PLAYER)

  const BattleScene = createBattleSceneClass(phaserModule)

  const config: Phaser.Types.Core.GameConfig = {
    type: phaserModule.AUTO,
    parent: gameContainerRef.value,
    width,
    height,
    backgroundColor: '#3e5f33',
    scene: BattleScene,
    scale: {
      mode: phaserModule.Scale.NONE,
      autoCenter: phaserModule.Scale.NO_CENTER
    },
    input: {
      mouse: {
        preventDefaultWheel: false
      }
    }
  }

  phaserGame = new phaserModule.Game(config)
}

function destroyPhaserGame() {
  if (phaserGame) {
    phaserGame.destroy(true)
    phaserGame = null
  }
  gameState.value = null
}

function handleResize() {
  if (!containerRef.value || !phaserGame || !phaserModule) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  const scene = phaserGame.scene.getScene('BattleScene')
  if (scene && 'resizeGame' in scene) {
    (scene as any).resizeGame(width, height)
  }
}

function selectByType(typeStr: keyof typeof UNIT_TYPES) {
  if (!gameState.value) return
  selectUnitsByType(gameState.value, typeStr, gameState.value.localTeam)
  gameState.value = { ...gameState.value }
}

function selectAllUnits() {
  if (!gameState.value) return
  engineSelectAll(gameState.value, gameState.value.localTeam)
  gameState.value = { ...gameState.value }
}

// Formation hotkey mapping: 1-6 for different formation types
const FORMATION_HOTKEYS: Record<string, FormationType> = {
  '1': FormationType.LINE,
  '2': FormationType.COLUMN,
  '3': FormationType.SQUARE,
  '4': FormationType.WEDGE,
  '5': FormationType.SKIRMISH,
  '6': FormationType.HOLLOW_SQUARE
}

function changeFormation(type: FormationType, applyImmediately: boolean = true) {
  // Always update the current formation type (for future move commands)
  currentFormationType.value = type

  if (!gameState.value) return

  const selectedUnits = gameState.value.units.filter(
    u => gameState.value!.selectedUnitIds.includes(u.id) && !isDead(u)
  )

  // If no units selected or not applying immediately, just update the type
  if (selectedUnits.length === 0 || !applyImmediately) return

  // Calculate center of selected units
  const center = {
    x: selectedUnits.reduce((sum, u) => sum + u.x, 0) / selectedUnits.length,
    y: selectedUnits.reduce((sum, u) => sum + u.y, 0) / selectedUnits.length
  }

  // Calculate average facing angle
  let avgAngle = selectedUnits.reduce((sum, u) => sum + u.angle, 0) / selectedUnits.length

  // Get formation positions
  const positions = getFormationPositions(
    selectedUnits.length,
    center,
    avgAngle,
    type
  )

  // Sort units and positions for optimal assignment (minimize crossing paths)
  const sortedUnits = [...selectedUnits].sort((a, b) => {
    const projA = Math.cos(avgAngle) * a.x + Math.sin(avgAngle) * a.y
    const projB = Math.cos(avgAngle) * b.x + Math.sin(avgAngle) * b.y
    return projA - projB
  })
  const sortedPositions = [...positions].sort((a, b) => {
    const projA = Math.cos(avgAngle) * a.x + Math.sin(avgAngle) * a.y
    const projB = Math.cos(avgAngle) * b.x + Math.sin(avgAngle) * b.y
    return projA - projB
  })

  // Assign each unit to its formation position
  sortedUnits.forEach((unit, i) => {
    unit.targetPos = sortedPositions[i]
    unit.formationAngle = avgAngle
    unit.command = CommandType.MOVE
  })

  playOrderIssued()
  gameState.value = { ...gameState.value }
}

function handleKeyDown(event: KeyboardEvent) {
  if (gameScreen.value !== 'playing') return

  const formationType = FORMATION_HOTKEYS[event.key]
  if (formationType) {
    changeFormation(formationType)
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  getAudioEngine().stopSong()
  destroyPhaserGame()
})

watch(
  () => props.isFullscreen,
  () => {
    setTimeout(handleResize, 100)
  }
)
</script>

<style scoped>
.unit-btn {
  background: rgba(31, 41, 55, 0.9);
  border: 1px solid #4b5563;
  color: #e5e7eb;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.unit-btn:hover {
  background: #374151;
  border-color: #9ca3af;
}

.unit-btn:active {
  transform: translateY(1px);
}
</style>
