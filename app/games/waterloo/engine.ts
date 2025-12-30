// Waterloo Mini: Grand Battle Engine
// A Napoleonic era tactical battle simulation

export const CONFIG = {
  gridCellSize: 25,  // Reduced from 50 for better separation detection
  unitSpacing: 12,
  formationUnitWidth: 16,
  formationRowDepth: 12,
  maxFormationCols: 15,
  separationForce: 10,
  minSeparationDivisor: 1.5,
  turnSpeedMultiplier: 6,
  formationTurnSpeed: 3,
  slowdownDistance: 20,
  minSpeed: 2,
  clickThreshold: 5,
  formationDragThreshold: 20,
  meleeRange: 40,
  meleeCooldown: 1.0,
  routingSpeedMultiplier: 1.2,
  routingAngleWobble: 0.2,
  routingOffscreenMargin: 50,
  // AI Config
  aiThinkInterval: 0.5,
  aiDeployTime: 2.0,
  aiEngageRange: 220,
  artilleryBlastRadius: 40,
  moraleDamageMultiplier: 0.8,
  formationRotationDistance: 50,
  formationSeparationReduction: 0.5,
  // Legacy AI values (used by simple AI fallback)
  aiEngageDistanceMultiplier: 1.1,
  aiMoveOffset: 200
}

export enum Team {
  PLAYER = 0,
  ENEMY = 1
}

export enum UnitState {
  IDLE = 0,
  MOVING = 1,
  COMBAT = 2,
  ROUTING = 3,
  RELOADING = 4
}

export enum CommandType {
  NONE = 0,
  MOVE = 1,
  ATTACK = 2
}

export enum AIPhase {
  DEPLOY = 0,
  ADVANCE = 1,
  ENGAGE = 2,
  FLANK = 3,
  RETREAT = 4
}

// Formation types with unique tactical properties
export enum FormationType {
  LINE = 'LINE',           // Default - max firepower, weak flanks
  COLUMN = 'COLUMN',       // Fast movement, charge bonus, narrow
  SQUARE = 'SQUARE',       // Anti-cavalry, all-round defense, slow
  WEDGE = 'WEDGE',         // Cavalry charge formation, penetration
  SKIRMISH = 'SKIRMISH',   // Spread out, harder to hit, no volley
  HOLLOW_SQUARE = 'HOLLOW_SQUARE'  // Protect artillery inside
}

// Terrain types for battlefield
export enum TerrainType {
  GRASS = 'GRASS',         // Default, no modifiers
  HILL = 'HILL',           // Height advantage, artillery bonus
  FOREST = 'FOREST',       // Cover, slows cavalry, breaks formations
  ROAD = 'ROAD',           // Speed bonus
  MUD = 'MUD',             // Slows all units
  BUILDING = 'BUILDING'    // Defensible position
}

export interface TerrainEffect {
  speedMultiplier: number
  coverBonus: number       // Damage reduction (0-1)
  cavalryPenalty: number   // Speed multiplier for cavalry (lower = worse)
  formationAllowed: boolean
  artilleryBonus: number   // Damage/range bonus for artillery
  elevationBonus: number   // Attack bonus from high ground
}

export const TERRAIN_EFFECTS: Record<TerrainType, TerrainEffect> = {
  [TerrainType.GRASS]: {
    speedMultiplier: 1.0,
    coverBonus: 0,
    cavalryPenalty: 1.0,
    formationAllowed: true,
    artilleryBonus: 0,
    elevationBonus: 0
  },
  [TerrainType.HILL]: {
    speedMultiplier: 0.8,    // Slower going uphill
    coverBonus: 0.1,
    cavalryPenalty: 0.7,     // Cavalry struggles on slopes
    formationAllowed: true,
    artilleryBonus: 0.3,     // +30% damage from high ground
    elevationBonus: 0.15     // +15% damage when attacking downhill
  },
  [TerrainType.FOREST]: {
    speedMultiplier: 0.6,
    coverBonus: 0.35,        // 35% damage reduction
    cavalryPenalty: 0.3,     // Cavalry nearly useless
    formationAllowed: false, // Breaks formations
    artilleryBonus: -0.5,    // Artillery can't fire effectively
    elevationBonus: 0
  },
  [TerrainType.ROAD]: {
    speedMultiplier: 1.3,    // Faster travel
    coverBonus: 0,
    cavalryPenalty: 1.0,
    formationAllowed: true,
    artilleryBonus: 0,
    elevationBonus: 0
  },
  [TerrainType.MUD]: {
    speedMultiplier: 0.5,    // Very slow
    coverBonus: 0,
    cavalryPenalty: 0.4,     // Cavalry really struggles
    formationAllowed: true,
    artilleryBonus: -0.2,    // Harder to position
    elevationBonus: 0
  },
  [TerrainType.BUILDING]: {
    speedMultiplier: 0,      // Can't pass through
    coverBonus: 0.5,         // 50% reduction when adjacent
    cavalryPenalty: 0,
    formationAllowed: false,
    artilleryBonus: 0,
    elevationBonus: 0.1
  }
}

export interface TerrainCell {
  type: TerrainType
  elevation: number          // 0-2 (0 = low, 2 = high ground)
}

export interface TerrainMap {
  cellSize: number           // Pixels per cell
  cols: number
  rows: number
  cells: TerrainCell[][]     // [row][col]
}

export interface FormationStats {
  speedMultiplier: number
  rangedAccuracyMod: number
  meleeAttackMod: number
  meleeDefenseMod: number
  cavalryDefenseMod: number
  unitsPerRow: number
}

export const FORMATION_STATS: Record<FormationType, FormationStats> = {
  [FormationType.LINE]: {
    speedMultiplier: 1.0,
    rangedAccuracyMod: 1.2,    // Best for volleys
    meleeAttackMod: 1.0,
    meleeDefenseMod: 0.8,      // Weak in melee
    cavalryDefenseMod: 0.5,    // Very vulnerable to cavalry
    unitsPerRow: 15
  },
  [FormationType.COLUMN]: {
    speedMultiplier: 1.3,      // Faster movement
    rangedAccuracyMod: 0.6,    // Poor firing
    meleeAttackMod: 1.3,       // Charge bonus
    meleeDefenseMod: 1.0,
    cavalryDefenseMod: 0.7,
    unitsPerRow: 4
  },
  [FormationType.SQUARE]: {
    speedMultiplier: 0.5,      // Very slow
    rangedAccuracyMod: 0.8,
    meleeAttackMod: 0.7,
    meleeDefenseMod: 1.3,      // Strong defense
    cavalryDefenseMod: 2.0,    // Anti-cavalry
    unitsPerRow: 8
  },
  [FormationType.WEDGE]: {
    speedMultiplier: 1.4,      // Cavalry only
    rangedAccuracyMod: 0.3,
    meleeAttackMod: 1.5,       // Shock attack
    meleeDefenseMod: 0.6,
    cavalryDefenseMod: 1.0,
    unitsPerRow: 1             // Point formation
  },
  [FormationType.SKIRMISH]: {
    speedMultiplier: 1.2,
    rangedAccuracyMod: 0.9,
    meleeAttackMod: 0.6,
    meleeDefenseMod: 0.5,
    cavalryDefenseMod: 0.3,    // Very vulnerable
    unitsPerRow: 20            // Very spread
  },
  [FormationType.HOLLOW_SQUARE]: {
    speedMultiplier: 0.3,
    rangedAccuracyMod: 0.7,
    meleeAttackMod: 0.6,
    meleeDefenseMod: 1.5,
    cavalryDefenseMod: 2.5,    // Best anti-cav
    unitsPerRow: 10
  }
}

export interface AIState {
  phase: AIPhase
  phaseTimer: number
  thinkTimer: number
  infantryLineY: number
  cavalryCharged: boolean
  artilleryTargets: Map<string, string>  // artilleryId -> targetId
}

export interface UnitStats {
  name: string
  speed: number
  range: number
  reloadTime: number
  damage: number
  hp: number
  morale: number
  width: number
  height: number
  color: string
  symbol: string
  melee: number
}

export const UNIT_TYPES: Record<string, UnitStats> = {
  INFANTRY: {
    name: 'Line Infantry',
    speed: 8,
    range: 200,           // Buffed from 180 - outranges cavalry charge
    reloadTime: 2.0,      // Buffed from 3.0 - 50% more DPS
    damage: 15,
    hp: 100,
    morale: 100,
    width: 8,
    height: 8,
    color: '#3b82f6',
    symbol: 'I',
    melee: 0.8            // Buffed from 0.5 - better in melee
  },
  CAVALRY: {
    name: 'Hussars',
    speed: 25,
    range: 20,
    reloadTime: 1.0,
    damage: 35,
    hp: 120,              // Nerfed from 140 - more vulnerable to focus fire
    morale: 120,
    width: 12,
    height: 12,
    color: '#eab308',
    symbol: 'C',
    melee: 1.2            // Nerfed from 2.0 - reduces from 70 to 42 damage
  },
  ARTILLERY: {
    name: '12-lb Cannon',
    speed: 5,
    range: 400,
    reloadTime: 8.0,      // Buffed from 12.0 - more impactful
    damage: 40,
    hp: 80,               // Buffed from 60 - survives longer
    morale: 80,
    width: 16,
    height: 16,
    color: '#4b5563',
    symbol: 'A',
    melee: 0.2
  }
}

export interface Vector2 {
  x: number
  y: number
}

export function dist(a: Vector2, b: Vector2): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

export function angle(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export function interpolateAngle(curr: number, target: number, speed: number): number {
  const diff = normalizeAngle(target - curr)
  if (Math.abs(diff) < speed) return target
  return curr + Math.sign(diff) * speed
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  type: 'smoke' | 'blood' | 'text' | 'crater'
  life: number
  decay: number
  size: number
  color: string
  text?: string
}

export function createParticle(
  x: number,
  y: number,
  type: Particle['type'],
  text?: string,
  textColor?: string
): Particle {
  const id = Math.random().toString(36).substr(2, 9)
  let vx = (Math.random() - 0.5) * 20
  let vy = (Math.random() - 0.5) * 20
  let life = 1.0
  let decay = 0.5
  let size = 5
  let color = 'rgba(200, 200, 200,'

  if (type === 'smoke') {
    size = Math.random() * 10 + 5
    decay = Math.random() * 0.4 + 0.2
    color = 'rgba(200, 200, 200,'
  } else if (type === 'blood') {
    size = Math.random() * 3 + 1
    decay = 1.5
    color = 'rgba(180, 0, 0,'
  } else if (type === 'text') {
    decay = 0.8
    vy = -15
    vx = 0
    color = textColor || '#fff'
  } else if (type === 'crater') {
    size = Math.random() * 4 + 2
    decay = 0.05
    color = 'rgba(60, 50, 40,'
    life = 5.0
    vx = 0
    vy = 0
  }

  return { id, x, y, vx, vy, type, life, decay, size, color, text }
}

export function updateParticle(p: Particle, dt: number): void {
  p.x += p.vx * dt
  p.y += p.vy * dt
  p.life -= p.decay * dt
  if (p.type === 'smoke') {
    p.size += 10 * dt
    p.vx *= 0.9
    p.vy *= 0.9
  }
}

export interface Projectile {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
  type: 'bullet' | 'cannonball'
  ownerId: string
  ownerTeam: Team
  damage: number
  distTotal: number
  traveled: number
  active: boolean
}

export function createProjectile(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  type: Projectile['type'],
  ownerId: string,
  ownerTeam: Team,
  damage: number
): Projectile {
  const id = Math.random().toString(36).substr(2, 9)
  const ang = Math.atan2(targetY - y, targetX - x)
  const speed = type === 'cannonball' ? 180 : 400
  const spread = (Math.random() - 0.5) * (type === 'cannonball' ? 0.1 : 0.2)
  const vx = Math.cos(ang + spread) * speed
  const vy = Math.sin(ang + spread) * speed
  const distTotal = dist({ x, y }, { x: targetX, y: targetY })

  return {
    id,
    x,
    y,
    vx,
    vy,
    targetX,
    targetY,
    type,
    ownerId,
    ownerTeam,
    damage,
    distTotal,
    traveled: 0,
    active: true
  }
}

export interface Unit {
  id: string
  x: number
  y: number
  angle: number
  team: Team
  typeStr: keyof typeof UNIT_TYPES
  stats: UnitStats
  currentHp: number
  currentMorale: number
  reloadTimer: number
  state: UnitState
  command: CommandType
  targetPos: Vector2 | null
  targetUnitId: string | null
  flash: number
  inFormation: boolean
  formationAngle: number | null
  fatigue: number  // 0-100, affects combat stats when high
}

export function createUnit(
  x: number,
  y: number,
  team: Team,
  typeStr: keyof typeof UNIT_TYPES
): Unit {
  const id = Math.random().toString(36).substr(2, 9)
  const stats = { ...UNIT_TYPES[typeStr] }

  return {
    id,
    x,
    y,
    angle: team === Team.PLAYER ? -Math.PI / 2 : Math.PI / 2,
    team,
    typeStr,
    stats,
    currentHp: stats.hp,
    currentMorale: stats.morale,
    reloadTimer: 0,
    state: UnitState.IDLE,
    command: CommandType.NONE,
    targetPos: null,
    targetUnitId: null,
    flash: 0,
    inFormation: false,
    formationAngle: null,
    fatigue: 0  // Start fresh
  }
}

export function unitContains(u: Unit, px: number, py: number): boolean {
  const hw = u.stats.width + 2
  const hh = u.stats.height + 2
  return px >= u.x - hw && px <= u.x + hw && py >= u.y - hh && py <= u.y + hh
}

export function isDead(u: Unit): boolean {
  return u.currentHp <= 0
}

export function isRouting(u: Unit): boolean {
  return u.state === UnitState.ROUTING
}

// Fatigue system - returns multipliers for combat stats based on fatigue level
export interface FatigueModifiers {
  damage: number   // Damage dealt multiplier
  defense: number  // Damage reduction multiplier (higher = more damage taken)
  speed: number    // Movement speed multiplier
  reload: number   // Reload time multiplier (higher = slower)
}

export function getFatigueModifiers(fatigue: number): FatigueModifiers {
  // Fatigue levels:
  // 0-20: Fresh - no penalties
  // 20-40: Active - slight penalties
  // 40-60: Winded - moderate penalties
  // 60-80: Tired - significant penalties
  // 80-100: Exhausted - severe penalties
  if (fatigue < 20) return { damage: 1.0, defense: 1.0, speed: 1.0, reload: 1.0 }
  if (fatigue < 40) return { damage: 0.95, defense: 1.05, speed: 0.95, reload: 1.1 }
  if (fatigue < 60) return { damage: 0.85, defense: 1.15, speed: 0.85, reload: 1.25 }
  if (fatigue < 80) return { damage: 0.7, defense: 1.3, speed: 0.7, reload: 1.5 }
  return { damage: 0.5, defense: 1.5, speed: 0.5, reload: 2.0 }  // Exhausted
}

// Fatigue rates per second
const FATIGUE_RATES = {
  idle: -2,     // Recovery
  walking: 1,   // Light movement
  running: 4,   // Fast movement (cavalry or charging)
  fighting: 6   // Active combat
}

// Formation geometry functions - generate positions for each formation type
export function getFormationPositions(
  count: number,
  center: Vector2,
  facingAngle: number,
  type: FormationType,
  spacing: number = CONFIG.unitSpacing
): Vector2[] {
  switch (type) {
    case FormationType.LINE:
      return getLineFormation(count, center, facingAngle, spacing)
    case FormationType.COLUMN:
      return getColumnFormation(count, center, facingAngle, spacing)
    case FormationType.SQUARE:
      return getSquareFormation(count, center, facingAngle, spacing)
    case FormationType.WEDGE:
      return getWedgeFormation(count, center, facingAngle, spacing)
    case FormationType.SKIRMISH:
      return getSkirmishFormation(count, center, facingAngle, spacing)
    case FormationType.HOLLOW_SQUARE:
      return getHollowSquareFormation(count, center, facingAngle, spacing)
    default:
      return getLineFormation(count, center, facingAngle, spacing)
  }
}

function getLineFormation(count: number, center: Vector2, angle: number, spacing: number): Vector2[] {
  const positions: Vector2[] = []
  const stats = FORMATION_STATS[FormationType.LINE]
  const unitsPerRow = Math.min(count, stats.unitsPerRow)
  const rows = Math.ceil(count / unitsPerRow)

  let placed = 0
  for (let row = 0; row < rows && placed < count; row++) {
    const unitsInRow = Math.min(unitsPerRow, count - placed)
    for (let col = 0; col < unitsInRow && placed < count; col++) {
      // Perpendicular to facing direction
      const x = (col - (unitsInRow - 1) / 2) * spacing
      const y = row * spacing * 0.8  // Rows behind center

      // Rotate by facing angle (perpendicular line)
      const perpAngle = angle + Math.PI / 2
      positions.push({
        x: center.x + x * Math.cos(perpAngle) + y * Math.cos(angle),
        y: center.y + x * Math.sin(perpAngle) + y * Math.sin(angle)
      })
      placed++
    }
  }
  return positions
}

function getColumnFormation(count: number, center: Vector2, angle: number, spacing: number): Vector2[] {
  const positions: Vector2[] = []
  const stats = FORMATION_STATS[FormationType.COLUMN]
  const unitsPerRow = stats.unitsPerRow

  let placed = 0
  let row = 0
  while (placed < count) {
    const unitsInRow = Math.min(unitsPerRow, count - placed)
    for (let col = 0; col < unitsInRow && placed < count; col++) {
      // Narrow column, units stacked behind each other
      const x = (col - (unitsInRow - 1) / 2) * spacing * 0.8
      const y = row * spacing

      const perpAngle = angle + Math.PI / 2
      positions.push({
        x: center.x + x * Math.cos(perpAngle) + y * Math.cos(angle),
        y: center.y + x * Math.sin(perpAngle) + y * Math.sin(angle)
      })
      placed++
    }
    row++
  }
  return positions
}

function getSquareFormation(count: number, center: Vector2, angle: number, spacing: number): Vector2[] {
  const positions: Vector2[] = []
  const side = Math.ceil(Math.sqrt(count))

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / side)
    const col = i % side
    const x = (col - (side - 1) / 2) * spacing
    const y = (row - (side - 1) / 2) * spacing

    // Rotate by formation angle
    positions.push({
      x: center.x + x * Math.cos(angle) - y * Math.sin(angle),
      y: center.y + x * Math.sin(angle) + y * Math.cos(angle)
    })
  }
  return positions
}

function getWedgeFormation(count: number, center: Vector2, angle: number, spacing: number): Vector2[] {
  const positions: Vector2[] = []
  let placed = 0
  let row = 0

  while (placed < count) {
    const unitsInRow = row * 2 + 1
    for (let col = 0; col < unitsInRow && placed < count; col++) {
      const x = (col - row) * spacing * 0.8
      const y = row * spacing

      positions.push({
        x: center.x + x * Math.cos(angle + Math.PI / 2) + y * Math.cos(angle),
        y: center.y + x * Math.sin(angle + Math.PI / 2) + y * Math.sin(angle)
      })
      placed++
    }
    row++
  }
  return positions
}

function getSkirmishFormation(count: number, center: Vector2, angle: number, spacing: number): Vector2[] {
  const positions: Vector2[] = []
  const wideSpacing = spacing * 2.5  // Much wider spacing

  // Randomized loose formation
  const rows = Math.ceil(count / 10)
  let placed = 0

  for (let row = 0; row < rows && placed < count; row++) {
    const unitsInRow = Math.min(10, count - placed)
    for (let col = 0; col < unitsInRow && placed < count; col++) {
      // Add some randomness to positions
      const jitterX = (Math.random() - 0.5) * spacing * 0.5
      const jitterY = (Math.random() - 0.5) * spacing * 0.5
      const x = (col - (unitsInRow - 1) / 2) * wideSpacing + jitterX
      const y = row * wideSpacing + jitterY

      const perpAngle = angle + Math.PI / 2
      positions.push({
        x: center.x + x * Math.cos(perpAngle) + y * Math.cos(angle),
        y: center.y + x * Math.sin(perpAngle) + y * Math.sin(angle)
      })
      placed++
    }
  }
  return positions
}

function getHollowSquareFormation(count: number, center: Vector2, angle: number, spacing: number): Vector2[] {
  const positions: Vector2[] = []

  // Create hollow square - units on the perimeter only
  const side = Math.ceil(Math.sqrt(count)) + 2  // Make it bigger to be hollow
  let placed = 0

  for (let row = 0; row < side && placed < count; row++) {
    for (let col = 0; col < side && placed < count; col++) {
      // Only place on edges (hollow interior)
      if (row === 0 || row === side - 1 || col === 0 || col === side - 1) {
        const x = (col - (side - 1) / 2) * spacing
        const y = (row - (side - 1) / 2) * spacing

        positions.push({
          x: center.x + x * Math.cos(angle) - y * Math.sin(angle),
          y: center.y + x * Math.sin(angle) + y * Math.cos(angle)
        })
        placed++
      }
    }
  }
  return positions
}

export interface GameState {
  units: Unit[]
  projectiles: Projectile[]
  particles: Particle[]
  selectedUnitIds: string[]
  isGameOver: boolean
  winner: Team | null
  spatialGrid: Map<string, Unit[]>
  width: number
  height: number
  isMultiplayer: boolean
  localTeam: Team
  aiState: AIState
  terrain: TerrainMap
}

// Terrain helper functions
export function getTerrainAt(terrain: TerrainMap, x: number, y: number): TerrainCell {
  const col = Math.floor(x / terrain.cellSize)
  const row = Math.floor(y / terrain.cellSize)
  if (row >= 0 && row < terrain.rows && col >= 0 && col < terrain.cols) {
    return terrain.cells[row][col]
  }
  // Default to grass for out-of-bounds
  return { type: TerrainType.GRASS, elevation: 0 }
}

export function getTerrainEffectAt(terrain: TerrainMap, x: number, y: number): TerrainEffect {
  const cell = getTerrainAt(terrain, x, y)
  return TERRAIN_EFFECTS[cell.type]
}

// Get speed modifier for a unit at a position considering terrain
export function getTerrainSpeedModifier(terrain: TerrainMap, unit: Unit): number {
  const effect = getTerrainEffectAt(terrain, unit.x, unit.y)
  let speedMod = effect.speedMultiplier

  // Apply cavalry penalty
  if (unit.typeStr === 'CAVALRY') {
    speedMod *= effect.cavalryPenalty
  }

  return speedMod
}

// Get damage modifier based on terrain cover
export function getTerrainCoverModifier(terrain: TerrainMap, defender: Unit): number {
  const effect = getTerrainEffectAt(terrain, defender.x, defender.y)
  return 1 - effect.coverBonus  // e.g. 0.35 cover = 0.65 damage taken
}

// Get elevation advantage modifier (attacker on high ground)
export function getElevationAdvantage(terrain: TerrainMap, attacker: Unit, defender: Unit): number {
  const attackerCell = getTerrainAt(terrain, attacker.x, attacker.y)
  const defenderCell = getTerrainAt(terrain, defender.x, defender.y)
  const elevationDiff = attackerCell.elevation - defenderCell.elevation

  // +10% damage per elevation level advantage
  return 1 + elevationDiff * 0.1
}

// Check if terrain allows formation
export function canFormAtPosition(terrain: TerrainMap, x: number, y: number): boolean {
  const effect = getTerrainEffectAt(terrain, x, y)
  return effect.formationAllowed
}

// Generate procedural battlefield terrain
export function generateTerrain(width: number, height: number): TerrainMap {
  const cellSize = 50
  const cols = Math.ceil(width / cellSize)
  const rows = Math.ceil(height / cellSize)

  // Initialize with grass
  const cells: TerrainCell[][] = []
  for (let row = 0; row < rows; row++) {
    cells[row] = []
    for (let col = 0; col < cols; col++) {
      cells[row][col] = { type: TerrainType.GRASS, elevation: 0 }
    }
  }

  // Add a central hill (common battlefield feature)
  const hillCenterCol = Math.floor(cols / 2) + Math.floor((Math.random() - 0.5) * cols * 0.3)
  const hillCenterRow = Math.floor(rows / 2) + Math.floor((Math.random() - 0.5) * rows * 0.2)
  const hillRadius = 3 + Math.floor(Math.random() * 2)

  for (let dy = -hillRadius; dy <= hillRadius; dy++) {
    for (let dx = -hillRadius; dx <= hillRadius; dx++) {
      const r = Math.floor(hillCenterRow + dy)
      const c = Math.floor(hillCenterCol + dx)
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d <= hillRadius) {
          cells[r][c].type = TerrainType.HILL
          cells[r][c].elevation = d < hillRadius * 0.5 ? 2 : 1
        }
      }
    }
  }

  // Add 1-2 forest clusters on the flanks
  const forestCount = 1 + Math.floor(Math.random() * 2)
  for (let i = 0; i < forestCount; i++) {
    // Place forests away from center (on flanks)
    const side = i === 0 ? 0.15 : 0.85
    const forestCenterCol = Math.floor(cols * side) + Math.floor((Math.random() - 0.5) * cols * 0.1)
    const forestCenterRow = Math.floor(rows * (0.3 + Math.random() * 0.4))
    const forestRadius = 2 + Math.floor(Math.random() * 2)

    for (let dy = -forestRadius; dy <= forestRadius; dy++) {
      for (let dx = -forestRadius; dx <= forestRadius; dx++) {
        const r = Math.floor(forestCenterRow + dy)
        const c = Math.floor(forestCenterCol + dx)
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d <= forestRadius && Math.random() > 0.2) {
            // Don't overwrite hills
            if (cells[r][c].type !== TerrainType.HILL) {
              cells[r][c].type = TerrainType.FOREST
            }
          }
        }
      }
    }
  }

  // Add a road from top to bottom (slightly curved)
  const roadCol = Math.floor(cols * 0.4) + Math.floor(Math.random() * cols * 0.2)
  for (let row = 0; row < rows; row++) {
    const wobble = Math.floor(Math.sin(row * 0.3) * 1.5)
    const c = roadCol + wobble
    if (c >= 0 && c < cols) {
      // Road only on grass (avoids hills and forests)
      if (cells[row][c].type === TerrainType.GRASS) {
        cells[row][c].type = TerrainType.ROAD
      }
    }
  }

  // Add 1-2 mud patches
  const mudCount = Math.floor(Math.random() * 2) + 1
  for (let i = 0; i < mudCount; i++) {
    const mudCol = Math.floor(Math.random() * cols)
    const mudRow = Math.floor(rows * 0.3 + Math.random() * rows * 0.4)
    const mudRadius = 1 + Math.floor(Math.random() * 2)

    for (let dy = -mudRadius; dy <= mudRadius; dy++) {
      for (let dx = -mudRadius; dx <= mudRadius; dx++) {
        const r = Math.floor(mudRow + dy)
        const c = Math.floor(mudCol + dx)
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d <= mudRadius && cells[r][c].type === TerrainType.GRASS) {
            cells[r][c].type = TerrainType.MUD
          }
        }
      }
    }
  }

  // Optional: Add 1 building (farmhouse)
  if (Math.random() > 0.5) {
    const buildingCol = Math.floor(cols * 0.3 + Math.random() * cols * 0.4)
    const buildingRow = Math.floor(rows * 0.4 + Math.random() * rows * 0.2)
    if (cells[buildingRow][buildingCol].type === TerrainType.GRASS) {
      cells[buildingRow][buildingCol].type = TerrainType.BUILDING
    }
  }

  return { cellSize, cols, rows, cells }
}

export function createInitialState(
  width: number,
  height: number,
  isMultiplayer: boolean = false,
  localTeam: Team = Team.PLAYER
): GameState {
  const units: Unit[] = []
  const centerX = width / 2
  const playerY = height - 150
  const enemyY = 150
  const spacing = CONFIG.unitSpacing

  // Player army (bottom)
  // Main infantry line
  for (let rank = 0; rank < 4; rank++) {
    for (let i = 0; i < 40; i++) {
      units.push(
        createUnit(
          centerX - 240 + i * spacing,
          playerY - rank * 12,
          Team.PLAYER,
          'INFANTRY'
        )
      )
    }
  }

  // Reserve infantry
  for (let rank = 0; rank < 3; rank++) {
    for (let i = 0; i < 30; i++) {
      units.push(
        createUnit(
          centerX - 180 + i * spacing,
          playerY + 80 - rank * 12,
          Team.PLAYER,
          'INFANTRY'
        )
      )
    }
  }

  // Artillery
  for (let i = 0; i < 8; i++) {
    units.push(
      createUnit(centerX - 200 + i * 60, playerY + 40, Team.PLAYER, 'ARTILLERY')
    )
  }

  // Left cavalry wing
  for (let i = 0; i < 20; i++) {
    units.push(
      createUnit(
        100 + (i % 5) * 15,
        playerY - 50 + Math.floor(i / 5) * 15,
        Team.PLAYER,
        'CAVALRY'
      )
    )
  }

  // Right cavalry wing
  for (let i = 0; i < 20; i++) {
    units.push(
      createUnit(
        width - 150 + (i % 5) * 15,
        playerY - 50 + Math.floor(i / 5) * 15,
        Team.PLAYER,
        'CAVALRY'
      )
    )
  }

  // Enemy army (top) - mirror of player
  for (let rank = 0; rank < 4; rank++) {
    for (let i = 0; i < 40; i++) {
      units.push(
        createUnit(
          centerX - 240 + i * spacing,
          enemyY + rank * 12,
          Team.ENEMY,
          'INFANTRY'
        )
      )
    }
  }

  for (let rank = 0; rank < 3; rank++) {
    for (let i = 0; i < 30; i++) {
      units.push(
        createUnit(
          centerX - 180 + i * spacing,
          enemyY - 80 + rank * 12,
          Team.ENEMY,
          'INFANTRY'
        )
      )
    }
  }

  for (let i = 0; i < 8; i++) {
    units.push(
      createUnit(centerX - 200 + i * 60, enemyY - 40, Team.ENEMY, 'ARTILLERY')
    )
  }

  for (let i = 0; i < 20; i++) {
    units.push(
      createUnit(
        100 + (i % 5) * 15,
        enemyY + 50 + Math.floor(i / 5) * 15,
        Team.ENEMY,
        'CAVALRY'
      )
    )
  }

  for (let i = 0; i < 20; i++) {
    units.push(
      createUnit(
        width - 150 + (i % 5) * 15,
        enemyY + 50 + Math.floor(i / 5) * 15,
        Team.ENEMY,
        'CAVALRY'
      )
    )
  }

  return {
    units,
    projectiles: [],
    particles: [],
    selectedUnitIds: [],
    isGameOver: false,
    winner: null,
    spatialGrid: new Map(),
    width,
    height,
    isMultiplayer,
    localTeam,
    aiState: {
      phase: AIPhase.DEPLOY,
      phaseTimer: 0,
      thinkTimer: 0,
      infantryLineY: enemyY + 100,  // Starting advance position
      cavalryCharged: false,
      artilleryTargets: new Map()
    },
    terrain: generateTerrain(width, height)
  }
}

export function findNearestEnemy(state: GameState, unit: Unit): Unit | null {
  let nearest: Unit | null = null
  let minDist = Infinity

  for (const other of state.units) {
    if (other.team !== unit.team && !isDead(other) && !isRouting(other)) {
      const d = dist(unit, other)
      if (d < minDist) {
        minDist = d
        nearest = other
      }
    }
  }

  return nearest
}

export function getUnitById(state: GameState, id: string): Unit | undefined {
  return state.units.find((u) => u.id === id)
}

// Flanking damage system - calculates bonus damage based on attack angle
export interface FlankingResult {
  modifier: number  // 1.0 = front, 1.3 = flank, 1.6 = rear
  type: 'front' | 'flank' | 'rear'
}

export function calculateFlanking(attacker: { x: number; y: number }, defender: Unit): FlankingResult {
  // Calculate attack direction (from attacker to defender)
  const attackAngle = angle(attacker, defender)
  // Defender is facing their own angle, attacks from behind are most effective
  // We want to compare where the attack is coming FROM relative to defender's facing
  const incomingAngle = attackAngle + Math.PI  // Reverse to get "from" direction
  const defenderFacing = defender.angle

  // Calculate relative angle (0 = attack from front, PI = attack from rear)
  let relativeAngle = Math.abs(incomingAngle - defenderFacing)
  // Normalize to 0..PI range
  while (relativeAngle > Math.PI) relativeAngle = Math.abs(relativeAngle - 2 * Math.PI)

  // Front: within 45 degrees (PI/4)
  if (relativeAngle < Math.PI / 4) {
    return { modifier: 1.0, type: 'front' }
  }
  // Rear: beyond 135 degrees (3*PI/4)
  if (relativeAngle > 3 * Math.PI / 4) {
    return { modifier: 1.6, type: 'rear' }
  }
  // Flank: 45-135 degrees
  return { modifier: 1.3, type: 'flank' }
}

// Morale cascade - when a unit routs, nearby allies lose morale and may also rout
function triggerMoraleCascade(
  routingUnit: Unit,
  state: GameState,
  depth: number = 0
): void {
  if (depth > 3) return  // Prevent infinite cascades

  const cascadeRadius = 100
  const moraleDamage = 15

  for (const ally of state.units) {
    if (ally === routingUnit) continue
    if (ally.team !== routingUnit.team) continue
    if (isDead(ally) || isRouting(ally)) continue

    const d = dist(routingUnit, ally)
    if (d < cascadeRadius) {
      ally.currentMorale -= moraleDamage
      state.particles.push(
        createParticle(ally.x, ally.y - 15, 'text', 'PANIC!', '#ffaa00')
      )

      // Check if this ally also routs
      if (ally.currentMorale <= 0 && ally.state !== UnitState.ROUTING) {
        ally.state = UnitState.ROUTING
        ally.command = CommandType.NONE
        ally.inFormation = false
        state.particles.push(
          createParticle(ally.x, ally.y - 20, 'text', 'ROUT!', '#ffffff')
        )
        // Cascade continues!
        triggerMoraleCascade(ally, state, depth + 1)
      }
    }
  }
}

export function takeDamage(
  unit: Unit,
  amount: number,
  particles: Particle[],
  attacker?: { x: number; y: number } & Partial<Unit>,  // Optional attacker for flanking/terrain calculation
  state?: GameState  // Optional state for morale cascade and terrain
): void {
  // Apply flanking modifier if attacker position is known
  let finalAmount = amount
  let flankType: 'front' | 'flank' | 'rear' | null = null

  if (attacker) {
    const flanking = calculateFlanking(attacker, unit)
    finalAmount = amount * flanking.modifier
    flankType = flanking.type
  }

  // Apply terrain modifiers (cover reduces damage, elevation gives advantage)
  if (state) {
    // Cover bonus reduces damage taken
    const coverMod = getTerrainCoverModifier(state.terrain, unit)
    finalAmount *= coverMod

    // If attacker is a full unit, apply elevation advantage
    if (attacker && 'id' in attacker) {
      const elevationMod = getElevationAdvantage(state.terrain, attacker as Unit, unit)
      finalAmount *= elevationMod
    }
  }

  // Apply fatigue defense penalty (tired units take more damage)
  const fatigueModifiers = getFatigueModifiers(unit.fatigue)
  finalAmount *= fatigueModifiers.defense

  unit.currentHp -= finalAmount
  unit.currentMorale -= finalAmount * CONFIG.moraleDamageMultiplier
  unit.flash = 0.2

  particles.push(createParticle(unit.x, unit.y, 'blood'))

  // Show damage numbers with flanking indicator
  if (Math.random() > 0.85 || flankType === 'rear') {
    const color = flankType === 'rear' ? '#ff0000' : flankType === 'flank' ? '#ff8800' : '#ff4444'
    const suffix = flankType === 'rear' ? '!!' : flankType === 'flank' ? '!' : ''
    particles.push(
      createParticle(
        unit.x,
        unit.y - 10,
        'text',
        `-${Math.floor(finalAmount)}${suffix}`,
        color
      )
    )
  }

  if (unit.currentHp <= 0) {
    unit.currentHp = 0
    particles.push(createParticle(unit.x, unit.y, 'smoke'))
  } else if (unit.currentMorale <= 0 && unit.state !== UnitState.ROUTING) {
    unit.state = UnitState.ROUTING
    unit.command = CommandType.NONE
    unit.inFormation = false
    particles.push(createParticle(unit.x, unit.y - 20, 'text', 'ROUT!', '#ffffff'))

    // Trigger morale cascade to nearby allies
    if (state) {
      triggerMoraleCascade(unit, state, 0)
    }
  }
}

// Accuracy system - affects projectile spread based on range, morale, and formation
export function calculateAccuracy(unit: Unit, target: Unit): number {
  const d = dist(unit, target)
  const range = unit.stats.range

  let accuracy = 1.0

  // Range penalty: -40% accuracy at max range
  accuracy *= 1 - (d / range) * 0.4

  // Morale penalty: scared troops can't aim
  accuracy *= unit.currentMorale / unit.stats.morale

  // Formation bonus: +20% when in formation, -20% when scattered
  accuracy *= unit.inFormation ? 1.2 : 0.8

  // Artillery has inherent accuracy bonus
  if (unit.typeStr === 'ARTILLERY') {
    accuracy *= 1.3  // Trained gunners
  }

  return Math.max(0.2, Math.min(1.0, accuracy))  // Clamp 20%-100%
}

export function fireProjectile(
  unit: Unit,
  target: Unit,
  projectiles: Projectile[],
  particles: Particle[]
): void {
  // Calculate accuracy-based spread
  const accuracy = calculateAccuracy(unit, target)
  const spreadAmount = (1 - accuracy) * 50  // Max 40 pixel spread at 20% accuracy
  const spreadX = (Math.random() - 0.5) * spreadAmount
  const spreadY = (Math.random() - 0.5) * spreadAmount

  const muzzleX = unit.x + Math.cos(unit.angle) * (unit.stats.width / 2 + 2)
  const muzzleY = unit.y + Math.sin(unit.angle) * (unit.stats.width / 2 + 2)

  if (Math.random() > 0.5) {
    particles.push(createParticle(muzzleX, muzzleY, 'smoke'))
  }

  // Apply fatigue damage penalty
  const fatigueModifiers = getFatigueModifiers(unit.fatigue)
  const damage = unit.stats.damage * fatigueModifiers.damage

  const type = unit.typeStr === 'ARTILLERY' ? 'cannonball' : 'bullet'
  projectiles.push(
    createProjectile(
      muzzleX,
      muzzleY,
      target.x + spreadX,
      target.y + spreadY,
      type,
      unit.id,
      unit.team,
      damage
    )
  )
}

export function createExplosion(
  x: number,
  y: number,
  radius: number,
  damage: number,
  ownerTeam: Team,
  state: GameState
): void {
  for (const u of state.units) {
    if (!isDead(u) && dist({ x, y }, u) < radius) {
      // Explosions have no flanking (area damage), but can trigger morale cascade
      takeDamage(u, damage * 0.8, state.particles, undefined, state)
    }
  }
  state.particles.push(createParticle(x, y, 'crater'))
  state.particles.push(createParticle(x, y, 'smoke'))
}

export function updateUnit(
  unit: Unit,
  dt: number,
  state: GameState
): void {
  if (isDead(unit)) return
  if (unit.flash > 0) unit.flash -= dt
  if (unit.reloadTimer > 0) unit.reloadTimer -= dt

  // Add to spatial grid
  const gx = Math.floor(unit.x / CONFIG.gridCellSize)
  const gy = Math.floor(unit.y / CONFIG.gridCellSize)
  const key = `${gx},${gy}`
  if (!state.spatialGrid.has(key)) {
    state.spatialGrid.set(key, [])
  }
  state.spatialGrid.get(key)!.push(unit)

  // Routing behavior
  if (unit.state === UnitState.ROUTING) {
    unit.angle += (Math.random() - 0.5) * CONFIG.routingAngleWobble
    unit.x +=
      Math.cos(unit.angle) *
      unit.stats.speed *
      CONFIG.routingSpeedMultiplier *
      dt
    unit.y +=
      Math.sin(unit.angle) *
      unit.stats.speed *
      CONFIG.routingSpeedMultiplier *
      dt

    // Remove if off screen
    if (
      unit.x < -CONFIG.routingOffscreenMargin ||
      unit.x > state.width + CONFIG.routingOffscreenMargin ||
      unit.y < -CONFIG.routingOffscreenMargin ||
      unit.y > state.height + CONFIG.routingOffscreenMargin
    ) {
      unit.currentHp = 0
    }
    return
  }

  // Movement logic
  let moveTarget: Vector2 | null = null

  if (unit.command === CommandType.MOVE && unit.targetPos) {
    moveTarget = unit.targetPos
    unit.state = UnitState.MOVING
  } else if (unit.command === CommandType.ATTACK && unit.targetUnitId) {
    const targetUnit = getUnitById(state, unit.targetUnitId)
    if (!targetUnit || isDead(targetUnit)) {
      unit.command = CommandType.NONE
      unit.targetUnitId = null
    } else {
      const d = dist(unit, targetUnit)
      const engageDist =
        unit.typeStr === 'CAVALRY' ? 5 : unit.stats.range * 0.8
      if (d > engageDist) {
        moveTarget = { x: targetUnit.x, y: targetUnit.y }
        unit.state = UnitState.MOVING
        unit.inFormation = false
      } else {
        moveTarget = null
        unit.state = UnitState.COMBAT
      }
    }
  } else {
    unit.state = UnitState.IDLE
  }

  // Execute movement
  if (moveTarget) {
    const dx = moveTarget.x - unit.x
    const dy = moveTarget.y - unit.y
    const d = Math.sqrt(dx * dx + dy * dy)

    if (d < 3 && unit.command === CommandType.MOVE) {
      unit.x = moveTarget.x
      unit.y = moveTarget.y
      unit.command = CommandType.NONE
      unit.state = UnitState.IDLE
      unit.inFormation = true
      if (unit.formationAngle !== null) {
        unit.angle = unit.formationAngle
      }
    } else {
      const targetAngle = Math.atan2(dy, dx)

      // IMPROVED: Smooth rotation toward formation angle during final approach
      if (unit.command === CommandType.MOVE && unit.formationAngle !== null && d < CONFIG.formationRotationDistance) {
        // Blend between movement angle and formation angle based on distance
        const blendFactor = 1 - (d / CONFIG.formationRotationDistance)
        const blendedTarget = interpolateAngle(targetAngle, unit.formationAngle, blendFactor)
        unit.angle = interpolateAngle(
          unit.angle,
          blendedTarget,
          dt * CONFIG.turnSpeedMultiplier
        )
      } else {
        unit.angle = interpolateAngle(
          unit.angle,
          targetAngle,
          dt * CONFIG.turnSpeedMultiplier
        )
      }

      // Apply fatigue and terrain speed modifiers
      const movementFatigue = getFatigueModifiers(unit.fatigue)
      const terrainSpeedMod = getTerrainSpeedModifier(state.terrain, unit)
      let currentSpeed = unit.stats.speed * movementFatigue.speed * terrainSpeedMod
      if (unit.command === CommandType.MOVE && d < CONFIG.slowdownDistance) {
        currentSpeed *= d / CONFIG.slowdownDistance
      }
      if (currentSpeed < CONFIG.minSpeed) currentSpeed = CONFIG.minSpeed

      // FIXED: Always move, but slower when misaligned (prevents units getting stuck)
      // alignmentFactor: 1.0 when facing target, 0.3 when facing away
      const alignmentFactor = Math.max(0.3, (Math.cos(unit.angle - targetAngle) + 1) / 2)
      unit.x += Math.cos(unit.angle) * currentSpeed * alignmentFactor * dt
      unit.y += Math.sin(unit.angle) * currentSpeed * alignmentFactor * dt
      unit.inFormation = false
    }
  }

  // Separation from nearby units
  // DETERMINISTIC FORMATION: Completely skip separation when moving to assigned formation slot
  // Each soldier has a pre-calculated target position - separation forces would push them off course
  const movingToFormation = unit.targetPos !== null

  if (!unit.inFormation && !movingToFormation) {
    const nearbyUnits: Unit[] = []
    for (let nx = gx - 1; nx <= gx + 1; nx++) {
      for (let ny = gy - 1; ny <= gy + 1; ny++) {
        const nKey = `${nx},${ny}`
        const gridUnits = state.spatialGrid.get(nKey)
        if (gridUnits) nearbyUnits.push(...gridUnits)
      }
    }

    for (const other of nearbyUnits) {
      if (other !== unit && !isDead(other) && !isRouting(other)) {
        const d = dist(unit, other)
        const minSep =
          (unit.stats.width + other.stats.width) / CONFIG.minSeparationDivisor
        if (d < minSep) {
          const pushAngle = angle(other, unit)
          const force = (minSep - d) * CONFIG.separationForce * (other.inFormation ? 2 : 1)

          unit.x += Math.cos(pushAngle) * force * dt
          unit.y += Math.sin(pushAngle) * force * dt
        }
      }
    }
  }

  // Clamp to bounds
  unit.x = Math.max(20, Math.min(state.width - 20, unit.x))
  unit.y = Math.max(20, Math.min(state.height - 20, unit.y))

  // Combat logic when not moving
  if (!moveTarget && unit.state !== UnitState.ROUTING) {
    let shootTarget: Unit | null = null

    if (unit.command === CommandType.ATTACK && unit.targetUnitId) {
      const targetUnit = getUnitById(state, unit.targetUnitId)
      if (targetUnit && !isDead(targetUnit)) {
        shootTarget = targetUnit
      }
    } else {
      const nearest = findNearestEnemy(state, unit)
      if (nearest && dist(unit, nearest) <= unit.stats.range) {
        shootTarget = nearest
      }
    }

    if (shootTarget) {
      const d = dist(unit, shootTarget)
      const attackerFatigue = getFatigueModifiers(unit.fatigue)

      if (d < CONFIG.meleeRange) {
        // Melee combat - flanking is very effective in melee
        // Apply fatigue damage penalty to attacker
        if (unit.reloadTimer <= 0) {
          takeDamage(
            shootTarget,
            unit.stats.damage * unit.stats.melee * attackerFatigue.damage,
            state.particles,
            unit,  // Pass attacker for flanking calculation
            state  // Pass state for morale cascade
          )
          unit.reloadTimer = CONFIG.meleeCooldown * attackerFatigue.reload
          state.particles.push(
            createParticle(
              (unit.x + shootTarget.x) / 2,
              (unit.y + shootTarget.y) / 2,
              'smoke'
            )
          )
        }
      } else if (d <= unit.stats.range) {
        // Ranged combat - fatigue affects reload time
        const angleTo = angle(unit, shootTarget)
        const diff = Math.abs(normalizeAngle(unit.angle - angleTo))
        if (diff < 0.5) {
          if (unit.reloadTimer <= 0 && unit.typeStr !== 'CAVALRY') {
            fireProjectile(unit, shootTarget, state.projectiles, state.particles)
            unit.reloadTimer =
              (unit.stats.reloadTime + Math.random() * 0.5) * attackerFatigue.reload
          }
        } else {
          unit.angle = interpolateAngle(
            unit.angle,
            angleTo,
            dt * CONFIG.formationTurnSpeed
          )
        }
      }
    }
  }

  // Morale recovery when safe
  // Units recover morale when not in combat and near allies
  if (!isRouting(unit) && !isDead(unit)) {
    const nearestEnemy = findNearestEnemy(state, unit)
    const inCombat = nearestEnemy && dist(unit, nearestEnemy) < 150

    if (!inCombat) {
      // Count nearby allies for morale boost
      let nearbyAllies = 0
      for (const ally of state.units) {
        if (ally === unit) continue
        if (ally.team !== unit.team) continue
        if (isDead(ally) || isRouting(ally)) continue
        if (dist(unit, ally) < 80) nearbyAllies++
      }

      // Recovery rate: 3-8 morale/sec when safe, based on nearby allies
      if (nearbyAllies >= 2) {
        const recoveryRate = 3 + Math.min(5, nearbyAllies)  // 3-8 per second
        unit.currentMorale = Math.min(
          unit.stats.morale,
          unit.currentMorale + recoveryRate * dt
        )
      }
    }
  }

  // Fatigue system - update based on activity
  if (!isDead(unit)) {
    const isMoving = unit.targetPos !== null
    const nearestEnemy = findNearestEnemy(state, unit)
    const isFighting = nearestEnemy && dist(unit, nearestEnemy) < CONFIG.meleeRange + 20

    let fatigueRate: number
    if (isFighting) {
      fatigueRate = FATIGUE_RATES.fighting
    } else if (isMoving) {
      // Cavalry moves faster = more fatigue when moving
      fatigueRate = unit.typeStr === 'CAVALRY' ? FATIGUE_RATES.running : FATIGUE_RATES.walking
    } else {
      fatigueRate = FATIGUE_RATES.idle  // Recovery when idle
    }

    unit.fatigue = Math.max(0, Math.min(100, unit.fatigue + fatigueRate * dt))
  }
}

export function updateProjectile(
  p: Projectile,
  dt: number,
  state: GameState
): void {
  const dx = p.vx * dt
  const dy = p.vy * dt
  p.x += dx
  p.y += dy
  p.traveled += Math.sqrt(dx * dx + dy * dy)

  // Check if reached target or out of bounds
  if (
    p.traveled >= p.distTotal ||
    p.x < 0 ||
    p.x > state.width ||
    p.y < 0 ||
    p.y > state.height
  ) {
    p.active = false
    if (p.type === 'cannonball') {
      for (let i = 0; i < 5; i++) {
        state.particles.push(createParticle(p.x, p.y, 'smoke'))
      }
      createExplosion(p.x, p.y, CONFIG.artilleryBlastRadius, p.damage, p.ownerTeam, state)
    }
  }

  // Bullet hit detection - flanking applies based on shooter position
  if (p.active && p.type === 'bullet') {
    const gridKey = `${Math.floor(p.x / CONFIG.gridCellSize)},${Math.floor(p.y / CONFIG.gridCellSize)}`
    const nearby = state.spatialGrid.get(gridKey) || []
    for (const u of nearby) {
      if (u.team !== p.ownerTeam && !isDead(u) && unitContains(u, p.x, p.y)) {
        // Get shooter position for flanking calculation
        const shooter = getUnitById(state, p.ownerId)
        takeDamage(u, p.damage, state.particles, shooter, state)
        p.active = false
        break
      }
    }
  }
}

// AI Helper Functions
function getTeamCentroid(state: GameState, team: Team): Vector2 {
  const units = state.units.filter(u => u.team === team && !isDead(u) && !isRouting(u))
  if (units.length === 0) return { x: state.width / 2, y: state.height / 2 }
  const sum = units.reduce((acc, u) => ({ x: acc.x + u.x, y: acc.y + u.y }), { x: 0, y: 0 })
  return { x: sum.x / units.length, y: sum.y / units.length }
}

function getTeamUnitsByType(state: GameState, team: Team, typeStr: string): Unit[] {
  return state.units.filter(u => u.team === team && u.typeStr === typeStr && !isDead(u) && !isRouting(u))
}

function findPriorityTarget(unit: Unit, state: GameState): Unit | null {
  const enemies = state.units.filter(u => u.team !== unit.team && !isDead(u) && !isRouting(u))
  if (enemies.length === 0) return null

  // Priority 1: Enemy artillery (high value target)
  const artillery = enemies.filter(e => e.typeStr === 'ARTILLERY')
  if (artillery.length > 0) {
    let nearest = artillery[0]
    let minDist = dist(unit, nearest)
    for (const a of artillery) {
      const d = dist(unit, a)
      if (d < minDist) { minDist = d; nearest = a }
    }
    if (minDist < unit.stats.range * 1.5) return nearest
  }

  // Priority 2: Low HP enemies (easy kills)
  const wounded = enemies.filter(e => e.currentHp < e.stats.hp * 0.5)
  if (wounded.length > 0) {
    let nearest = wounded[0]
    let minDist = dist(unit, nearest)
    for (const w of wounded) {
      const d = dist(unit, w)
      if (d < minDist) { minDist = d; nearest = w }
    }
    if (minDist < unit.stats.range) return nearest
  }

  // Priority 3: Closest enemy
  return findNearestEnemy(state, unit)
}

function findDensestEnemyCluster(state: GameState, aiTeam: Team, radius: number): { center: Vector2, count: number, unit: Unit } | null {
  const enemies = state.units.filter(u => u.team !== aiTeam && !isDead(u) && !isRouting(u))
  if (enemies.length === 0) return null

  let bestCluster = { center: enemies[0], count: 1, unit: enemies[0] }
  for (const e of enemies) {
    let count = 0
    for (const other of enemies) {
      if (dist(e, other) < radius) count++
    }
    if (count > bestCluster.count) {
      bestCluster = { center: { x: e.x, y: e.y }, count, unit: e }
    }
  }
  return bestCluster
}

function isInfantryEngaged(state: GameState, aiTeam: Team): boolean {
  const infantry = getTeamUnitsByType(state, aiTeam, 'INFANTRY')
  const enemyCentroid = getTeamCentroid(state, aiTeam === Team.ENEMY ? Team.PLAYER : Team.ENEMY)
  for (const inf of infantry) {
    if (dist(inf, enemyCentroid) < CONFIG.aiEngageRange) return true
  }
  return false
}

function validateAndClearTargets(state: GameState, aiTeam: Team): void {
  const aiUnits = state.units.filter(u => u.team === aiTeam && !isDead(u) && !isRouting(u))
  for (const unit of aiUnits) {
    if (unit.targetUnitId) {
      const target = getUnitById(state, unit.targetUnitId)
      if (!target || isDead(target) || isRouting(target)) {
        unit.targetUnitId = null
        unit.command = CommandType.NONE
      }
    }
  }
}

export function updateAI(state: GameState, dt: number, aiTeam: Team): void {
  const ai = state.aiState

  // AI think timer - only process every aiThinkInterval seconds
  ai.thinkTimer += dt
  if (ai.thinkTimer < CONFIG.aiThinkInterval) return
  ai.thinkTimer = 0

  // Clear invalid targets first
  validateAndClearTargets(state, aiTeam)

  // Get AI units by type
  const infantry = getTeamUnitsByType(state, aiTeam, 'INFANTRY')
  const cavalry = getTeamUnitsByType(state, aiTeam, 'CAVALRY')
  const artillery = getTeamUnitsByType(state, aiTeam, 'ARTILLERY')
  const playerCentroid = getTeamCentroid(state, aiTeam === Team.ENEMY ? Team.PLAYER : Team.ENEMY)

  // Phase timer
  ai.phaseTimer += CONFIG.aiThinkInterval

  // Phase state machine
  switch (ai.phase) {
    case AIPhase.DEPLOY:
      // Initial deployment - form battle line
      {
        const centerX = state.width / 2
        const lineY = aiTeam === Team.ENEMY ? 160 : state.height - 160
        const facingAngle = aiTeam === Team.ENEMY ? Math.PI / 2 : -Math.PI / 2

        // Infantry forms center line
        infantry.forEach((unit, i) => {
          if (unit.command === CommandType.NONE) {
            const col = i % 40
            const row = Math.floor(i / 40)
            unit.targetPos = {
              x: centerX - 240 + col * 12,
              y: lineY + (aiTeam === Team.ENEMY ? row * 12 : -row * 12)
            }
            unit.command = CommandType.MOVE
            unit.formationAngle = facingAngle
          }
        })

        // Cavalry on flanks
        cavalry.forEach((unit, i) => {
          if (unit.command === CommandType.NONE) {
            const side = i < cavalry.length / 2 ? -1 : 1
            const localIdx = i < cavalry.length / 2 ? i : i - Math.floor(cavalry.length / 2)
            unit.targetPos = {
              x: centerX + side * 280 + (localIdx % 5) * 15,
              y: lineY + Math.floor(localIdx / 5) * 15
            }
            unit.command = CommandType.MOVE
            unit.formationAngle = facingAngle
          }
        })

        // Artillery behind infantry
        artillery.forEach((unit, i) => {
          if (unit.command === CommandType.NONE) {
            unit.targetPos = {
              x: centerX - 200 + i * 60,
              y: lineY + (aiTeam === Team.ENEMY ? -50 : 50)
            }
            unit.command = CommandType.MOVE
            unit.formationAngle = facingAngle
          }
        })

        // Transition to ADVANCE after deploy time
        if (ai.phaseTimer > CONFIG.aiDeployTime) {
          ai.phase = AIPhase.ADVANCE
          ai.phaseTimer = 0
          ai.infantryLineY = lineY
        }
      }
      break

    case AIPhase.ADVANCE:
      // Advance infantry line toward enemy
      {
        const distToEnemy = aiTeam === Team.ENEMY
          ? playerCentroid.y - ai.infantryLineY
          : ai.infantryLineY - playerCentroid.y

        if (distToEnemy > CONFIG.aiEngageRange) {
          // Move line forward
          const advance = aiTeam === Team.ENEMY ? 40 : -40
          ai.infantryLineY += advance

          const centerX = state.width / 2
          infantry.forEach((unit, i) => {
            const col = i % 40
            const row = Math.floor(i / 40)
            unit.targetPos = {
              x: centerX - 240 + col * 12,
              y: ai.infantryLineY + (aiTeam === Team.ENEMY ? row * 12 : -row * 12)
            }
            unit.command = CommandType.MOVE
          })
        } else {
          // Close enough - transition to ENGAGE
          ai.phase = AIPhase.ENGAGE
          ai.phaseTimer = 0
        }

        // Artillery targets densest cluster
        for (const art of artillery) {
          if (art.command === CommandType.NONE || !art.targetUnitId) {
            const cluster = findDensestEnemyCluster(state, aiTeam, 60)
            if (cluster && cluster.count >= 2) {
              art.command = CommandType.ATTACK
              art.targetUnitId = cluster.unit.id
            }
          }
        }
      }
      break

    case AIPhase.ENGAGE:
      // Infantry holds and fires, target priority system
      {
        for (const inf of infantry) {
          if (inf.command === CommandType.NONE || !inf.targetUnitId) {
            const target = findPriorityTarget(inf, state)
            if (target) {
              const d = dist(inf, target)
              if (d <= inf.stats.range) {
                inf.command = CommandType.ATTACK
                inf.targetUnitId = target.id
              } else {
                // Move closer but maintain formation
                inf.command = CommandType.MOVE
                inf.targetPos = {
                  x: inf.x + (target.x - inf.x) * 0.3,
                  y: inf.y + (target.y - inf.y) * 0.3
                }
              }
            }
          }
        }

        // Artillery continues targeting clusters, retreats if threatened
        for (const art of artillery) {
          const nearestEnemy = findNearestEnemy(state, art)
          if (nearestEnemy && dist(art, nearestEnemy) < 120) {
            // Retreat toward friendly infantry centroid
            const friendlyCentroid = getTeamCentroid(state, aiTeam)
            art.command = CommandType.MOVE
            art.targetPos = {
              x: art.x + (friendlyCentroid.x - art.x) * 0.5,
              y: art.y + (aiTeam === Team.ENEMY ? -60 : 60)
            }
            art.targetUnitId = null
          } else if (art.command === CommandType.NONE || !art.targetUnitId) {
            // Target enemy cavalry first (counter-charge), then clusters
            const enemyCav = state.units.filter(u =>
              u.team !== aiTeam && u.typeStr === 'CAVALRY' && !isDead(u) && !isRouting(u)
            )
            if (enemyCav.length > 0) {
              let nearest = enemyCav[0]
              let minDist = dist(art, nearest)
              for (const c of enemyCav) {
                const d = dist(art, c)
                if (d < minDist) { minDist = d; nearest = c }
              }
              art.command = CommandType.ATTACK
              art.targetUnitId = nearest.id
            } else {
              const cluster = findDensestEnemyCluster(state, aiTeam, 60)
              if (cluster) {
                art.command = CommandType.ATTACK
                art.targetUnitId = cluster.unit.id
              }
            }
          }
        }

        // Transition to FLANK when infantry is properly engaged
        if (isInfantryEngaged(state, aiTeam) && !ai.cavalryCharged) {
          ai.phase = AIPhase.FLANK
          ai.phaseTimer = 0
        }
      }
      break

    case AIPhase.FLANK:
      // Coordinated cavalry charge on weakest flank
      {
        if (!ai.cavalryCharged) {
          // Find weak flank - check which side has fewer enemies
          const enemies = state.units.filter(u => u.team !== aiTeam && !isDead(u) && !isRouting(u))
          const centerX = state.width / 2
          const leftEnemies = enemies.filter(e => e.x < centerX).length
          const rightEnemies = enemies.filter(e => e.x >= centerX).length
          const weakFlank = leftEnemies < rightEnemies ? 'left' : 'right'

          // Target rear enemies (artillery or wounded) on weak flank
          const flankEnemies = enemies.filter(e =>
            weakFlank === 'left' ? e.x < centerX : e.x >= centerX
          )
          const priorityTargets = flankEnemies.filter(e =>
            e.typeStr === 'ARTILLERY' || e.currentHp < e.stats.hp * 0.5
          )
          const chargeTargets = priorityTargets.length > 0 ? priorityTargets : flankEnemies

          // All cavalry charge together
          cavalry.forEach((cav, i) => {
            const target = chargeTargets[i % chargeTargets.length]
            if (target) {
              cav.command = CommandType.ATTACK
              cav.targetUnitId = target.id
            }
          })

          ai.cavalryCharged = true
        }

        // Cavalry re-targeting if target dies
        for (const cav of cavalry) {
          if (cav.command === CommandType.NONE || !cav.targetUnitId) {
            const target = findPriorityTarget(cav, state)
            if (target) {
              cav.command = CommandType.ATTACK
              cav.targetUnitId = target.id
            }
          }
        }

        // Infantry and artillery continue as in ENGAGE
        for (const inf of infantry) {
          if (inf.command === CommandType.NONE || !inf.targetUnitId) {
            const target = findPriorityTarget(inf, state)
            if (target) {
              inf.command = CommandType.ATTACK
              inf.targetUnitId = target.id
            }
          }
        }

        for (const art of artillery) {
          if (art.command === CommandType.NONE || !art.targetUnitId) {
            const cluster = findDensestEnemyCluster(state, aiTeam, 60)
            if (cluster) {
              art.command = CommandType.ATTACK
              art.targetUnitId = cluster.unit.id
            }
          }
        }
      }
      break

    case AIPhase.RETREAT:
      // Fall back - not implemented yet, placeholder
      break
  }
}

export function checkWinCondition(state: GameState): void {
  const players = state.units.filter(
    (u) => u.team === Team.PLAYER && !isDead(u) && !isRouting(u)
  ).length
  const enemies = state.units.filter(
    (u) => u.team === Team.ENEMY && !isDead(u) && !isRouting(u)
  ).length

  if (!state.isGameOver) {
    if (players === 0) {
      state.isGameOver = true
      state.winner = Team.ENEMY
    } else if (enemies === 0) {
      state.isGameOver = true
      state.winner = Team.PLAYER
    }
  }
}

export function selectUnitsInRect(
  state: GameState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  team: Team
): void {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  const isClick = maxX - minX < CONFIG.clickThreshold && maxY - minY < CONFIG.clickThreshold

  state.selectedUnitIds = []

  for (const u of state.units) {
    if (u.team === team && !isDead(u) && !isRouting(u)) {
      if (isClick) {
        if (unitContains(u, minX, minY)) {
          state.selectedUnitIds.push(u.id)
        }
      } else {
        if (u.x > minX && u.x < maxX && u.y > minY && u.y < maxY) {
          state.selectedUnitIds.push(u.id)
        }
      }
    }
  }
}

export function selectUnitsByType(
  state: GameState,
  typeStr: keyof typeof UNIT_TYPES,
  team: Team
): void {
  state.selectedUnitIds = state.units
    .filter((u) => u.team === team && !isDead(u) && u.typeStr === typeStr)
    .map((u) => u.id)
}

export function selectAllUnits(state: GameState, team: Team): void {
  state.selectedUnitIds = state.units
    .filter((u) => u.team === team && !isDead(u))
    .map((u) => u.id)
}

/**
 * Select nearby units of the same type (Total War style double-click selection)
 * Radius defines how close units need to be to be selected together
 */
export function selectNearbyUnitsOfSameType(
  state: GameState,
  clickX: number,
  clickY: number,
  team: Team,
  radius: number = 150
): void {
  // First find the clicked unit
  let clickedUnit: Unit | null = null
  for (const u of state.units) {
    if (u.team === team && !isDead(u) && !isRouting(u) && unitContains(u, clickX, clickY)) {
      clickedUnit = u
      break
    }
  }

  if (!clickedUnit) return

  // Find all units of the same type within radius
  state.selectedUnitIds = state.units
    .filter((u) => {
      if (u.team !== team || isDead(u) || isRouting(u)) return false
      if (u.typeStr !== clickedUnit!.typeStr) return false
      // Check if within radius of clicked unit
      const d = dist(clickedUnit!, u)
      return d <= radius
    })
    .map((u) => u.id)
}

export function issueCommand(
  state: GameState,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  formationType: FormationType = FormationType.LINE
): void {
  const dx = endX - startX
  const dy = endY - startY
  const d = Math.sqrt(dx * dx + dy * dy)

  // Check for attack target
  let targetEnemy: Unit | null = null
  if (d < CONFIG.formationDragThreshold) {
    for (const u of state.units) {
      if (
        u.team !== state.localTeam &&
        !isDead(u) &&
        unitContains(u, endX, endY)
      ) {
        targetEnemy = u
        break
      }
    }
  }

  const selectedUnits = state.units.filter((u) =>
    state.selectedUnitIds.includes(u.id)
  )

  if (targetEnemy) {
    // Attack command
    for (const u of selectedUnits) {
      u.command = CommandType.ATTACK
      u.targetUnitId = targetEnemy.id
      u.targetPos = null
      u.formationAngle = null
    }
    state.particles.push(createParticle(endX, endY - 20, 'text', 'ATTACK!', '#ff0'))
  } else {
    // Move command with formation
    const unitWidth = CONFIG.formationUnitWidth

    if (d < CONFIG.formationDragThreshold) {
      // CLICK-MOVE: Preserve current formation, just translate to new position
      // Calculate current centroid of selected units
      if (selectedUnits.length === 0) return

      const centroid = selectedUnits.reduce(
        (acc, u) => ({ x: acc.x + u.x / selectedUnits.length, y: acc.y + u.y / selectedUnits.length }),
        { x: 0, y: 0 }
      )

      // Calculate facing angle toward enemy
      const enemyTeam = state.localTeam === Team.PLAYER ? Team.ENEMY : Team.PLAYER
      const enemies = state.units.filter(u => u.team === enemyTeam && !isDead(u) && !isRouting(u))
      let facingAngle = -Math.PI / 2  // Default facing up
      if (enemies.length > 0) {
        const enemyCentroid = enemies.reduce(
          (acc, u) => ({ x: acc.x + u.x / enemies.length, y: acc.y + u.y / enemies.length }),
          { x: 0, y: 0 }
        )
        facingAngle = Math.atan2(enemyCentroid.y - endY, enemyCentroid.x - endX)
      }

      // Move each unit by the offset from centroid to click position
      const offsetX = endX - centroid.x
      const offsetY = endY - centroid.y

      for (const u of selectedUnits) {
        u.command = CommandType.MOVE
        u.targetUnitId = null
        u.targetPos = { x: u.x + offsetX, y: u.y + offsetY }
        u.formationAngle = facingAngle
        u.inFormation = false
      }

      state.particles.push(createParticle(endX, endY - 20, 'text', 'MOVE', '#0f0'))
    } else {
      // DRAG-MOVE: Move to START position, face toward END position
      // Much more intuitive: "move here, face there"
      const facingAngle = Math.atan2(dy, dx)  // Face from start toward end

      // Get formation positions centered at START, facing toward END
      const positions = getFormationPositions(
        selectedUnits.length,
        { x: startX, y: startY },
        facingAngle,
        formationType
      )

      // Sort units for optimal assignment (minimize crossing paths)
      const perpAngle = facingAngle + Math.PI / 2
      const sortedUnits = [...selectedUnits].sort((a, b) => {
        const projA = Math.cos(perpAngle) * a.x + Math.sin(perpAngle) * a.y
        const projB = Math.cos(perpAngle) * b.x + Math.sin(perpAngle) * b.y
        return projA - projB
      })

      const sortedPositions = [...positions].sort((a, b) => {
        const projA = Math.cos(perpAngle) * a.x + Math.sin(perpAngle) * a.y
        const projB = Math.cos(perpAngle) * b.x + Math.sin(perpAngle) * b.y
        return projA - projB
      })

      // Assign units to positions
      for (let i = 0; i < sortedUnits.length && i < sortedPositions.length; i++) {
        const u = sortedUnits[i]
        const point = sortedPositions[i]
        u.command = CommandType.MOVE
        u.targetUnitId = null
        u.targetPos = { x: point.x, y: point.y }
        u.formationAngle = facingAngle
        u.inFormation = false
      }

      // Show formation name
      const formationNames: Record<FormationType, string> = {
        [FormationType.LINE]: 'LINE',
        [FormationType.COLUMN]: 'COLUMN',
        [FormationType.SQUARE]: 'SQUARE',
        [FormationType.WEDGE]: 'WEDGE',
        [FormationType.SKIRMISH]: 'SKIRMISH',
        [FormationType.HOLLOW_SQUARE]: 'HOLLOW'
      }
      state.particles.push(createParticle(startX, startY - 20, 'text', formationNames[formationType], '#0f0'))
    }
  }
}

export function gameUpdate(state: GameState, dt: number): void {
  // Clamp dt to avoid large jumps
  dt = Math.min(dt, 0.1)

  // Clear spatial grid
  state.spatialGrid.clear()

  // Update AI for non-controlled team
  if (!state.isMultiplayer) {
    updateAI(state, dt, Team.ENEMY)
  }

  // Update all units
  for (const unit of state.units) {
    updateUnit(unit, dt, state)
  }

  // Update projectiles
  for (const p of state.projectiles) {
    updateProjectile(p, dt, state)
  }
  state.projectiles = state.projectiles.filter((p) => p.active)

  // Update particles
  for (const p of state.particles) {
    updateParticle(p, dt)
  }
  state.particles = state.particles.filter((p) => p.life > 0)

  // Check win condition
  checkWinCondition(state)
}

export function getTeamCounts(state: GameState): { allies: number; enemies: number } {
  return {
    allies: state.units.filter(
      (u) => u.team === Team.PLAYER && !isDead(u) && !isRouting(u)
    ).length,
    enemies: state.units.filter(
      (u) => u.team === Team.ENEMY && !isDead(u) && !isRouting(u)
    ).length
  }
}
