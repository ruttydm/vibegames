// Asteroids Game Engine

export interface Point {
  x: number
  y: number
}

export interface Velocity {
  vx: number
  vy: number
}

export type AsteroidSize = 'large' | 'medium' | 'small'

export interface Ship extends Point, Velocity {
  angle: number
  rotationSpeed: number
  thrusting: boolean
  invulnerable: boolean
  invulnerableTime: number
}

export interface Asteroid extends Point, Velocity {
  size: AsteroidSize
  radius: number
  rotation: number
  rotationSpeed: number
  vertices: number[] // angles for irregular shape
}

export interface Bullet extends Point, Velocity {
  life: number
}

export interface Particle extends Point, Velocity {
  life: number
  maxLife: number
  color: string
}

export interface GameState {
  ship: Ship
  asteroids: Asteroid[]
  bullets: Bullet[]
  particles: Particle[]
  score: number
  lives: number
  level: number
  isGameOver: boolean
  isPaused: boolean
  width: number
  height: number
}

export interface GameConfig {
  width: number
  height: number
  shipSize: number
  shipAcceleration: number
  shipMaxSpeed: number
  shipRotationSpeed: number
  shipFriction: number
  bulletSpeed: number
  bulletLife: number
  fireRate: number
  asteroidSpeeds: Record<AsteroidSize, { min: number; max: number }>
  asteroidSizes: Record<AsteroidSize, number>
  asteroidPoints: Record<AsteroidSize, number>
  startingAsteroids: number
  invulnerabilityTime: number
}

const DEFAULT_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  shipSize: 15,
  shipAcceleration: 300,
  shipMaxSpeed: 400,
  shipRotationSpeed: 4,
  shipFriction: 0.99,
  bulletSpeed: 500,
  bulletLife: 1.5,
  fireRate: 0.15,
  asteroidSpeeds: {
    large: { min: 40, max: 80 },
    medium: { min: 60, max: 120 },
    small: { min: 80, max: 160 }
  },
  asteroidSizes: {
    large: 40,
    medium: 25,
    small: 12
  },
  asteroidPoints: {
    large: 20,
    medium: 50,
    small: 100
  },
  startingAsteroids: 4,
  invulnerabilityTime: 3
}

type UpdateCallback = (state: GameState) => void
type GameOverCallback = (score: number) => void
type SoundCallback = (sound: string) => void

export class AsteroidsEngine {
  private config: GameConfig
  private state: GameState
  private lastFireTime: number = 0
  private onUpdate: UpdateCallback | null = null
  private onGameOver: GameOverCallback | null = null
  private onSound: SoundCallback | null = null
  private animationId: number | null = null
  private lastTime: number = 0

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      ship: this.createShip(),
      asteroids: [],
      bullets: [],
      particles: [],
      score: 0,
      lives: 3,
      level: 1,
      isGameOver: false,
      isPaused: false,
      width: this.config.width,
      height: this.config.height
    }
  }

  private createShip(): Ship {
    return {
      x: this.config.width / 2,
      y: this.config.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2, // Pointing up
      rotationSpeed: 0,
      thrusting: false,
      invulnerable: true,
      invulnerableTime: this.config.invulnerabilityTime
    }
  }

  private createAsteroid(
    x?: number,
    y?: number,
    size: AsteroidSize = 'large',
    vx?: number,
    vy?: number
  ): Asteroid {
    const { width, height } = this.config
    const speeds = this.config.asteroidSpeeds[size]
    const speed = speeds.min + Math.random() * (speeds.max - speeds.min)
    const angle = Math.random() * Math.PI * 2

    // If no position given, spawn from edges away from ship
    if (x === undefined || y === undefined) {
      const edge = Math.floor(Math.random() * 4)
      const margin = 50
      switch (edge) {
        case 0: // Top
          x = Math.random() * width
          y = -margin
          break
        case 1: // Right
          x = width + margin
          y = Math.random() * height
          break
        case 2: // Bottom
          x = Math.random() * width
          y = height + margin
          break
        default: // Left
          x = -margin
          y = Math.random() * height
      }
    }

    // Create irregular asteroid shape
    const vertices: number[] = []
    const numVertices = 8 + Math.floor(Math.random() * 5)
    for (let i = 0; i < numVertices; i++) {
      vertices.push(0.7 + Math.random() * 0.6) // Variation in radius
    }

    return {
      x,
      y,
      vx: vx ?? Math.cos(angle) * speed,
      vy: vy ?? Math.sin(angle) * speed,
      size,
      radius: this.config.asteroidSizes[size],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
      vertices
    }
  }

  private spawnAsteroids(count: number): void {
    for (let i = 0; i < count; i++) {
      this.state.asteroids.push(this.createAsteroid())
    }
  }

  private wrapPosition(obj: Point): void {
    const { width, height } = this.config
    const margin = 50

    if (obj.x < -margin) obj.x = width + margin
    if (obj.x > width + margin) obj.x = -margin
    if (obj.y < -margin) obj.y = height + margin
    if (obj.y > height + margin) obj.y = -margin
  }

  private createExplosion(x: number, y: number, count: number, color: string = '#fff'): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 100
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        color
      })
    }
  }

  private distance(a: Point, b: Point): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private checkCollisions(): void {
    const { ship, asteroids, bullets } = this.state

    // Bullet vs Asteroid
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const asteroid = asteroids[j]
        if (this.distance(bullet, asteroid) < asteroid.radius) {
          // Remove bullet
          bullets.splice(i, 1)
          // Handle asteroid destruction
          this.destroyAsteroid(j)
          this.onSound?.('asteroids.explosion')
          break
        }
      }
    }

    // Ship vs Asteroid
    if (!ship.invulnerable && !this.state.isGameOver) {
      for (const asteroid of asteroids) {
        if (this.distance(ship, asteroid) < asteroid.radius + this.config.shipSize * 0.7) {
          this.shipHit()
          break
        }
      }
    }
  }

  private destroyAsteroid(index: number): void {
    const asteroid = this.state.asteroids[index]
    this.state.score += this.config.asteroidPoints[asteroid.size]
    this.createExplosion(asteroid.x, asteroid.y, 10 + Math.floor(asteroid.radius / 2))

    // Split into smaller asteroids
    const splits: { size: AsteroidSize; count: number }[] = []
    if (asteroid.size === 'large') {
      splits.push({ size: 'medium', count: 2 })
    } else if (asteroid.size === 'medium') {
      splits.push({ size: 'small', count: 2 })
    }

    for (const split of splits) {
      for (let i = 0; i < split.count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speeds = this.config.asteroidSpeeds[split.size]
        const speed = speeds.min + Math.random() * (speeds.max - speeds.min)
        this.state.asteroids.push(
          this.createAsteroid(
            asteroid.x,
            asteroid.y,
            split.size,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          )
        )
      }
    }

    // Remove original asteroid
    this.state.asteroids.splice(index, 1)
  }

  private shipHit(): void {
    this.createExplosion(this.state.ship.x, this.state.ship.y, 20, '#0ff')
    this.onSound?.('asteroids.death')
    this.state.lives--

    if (this.state.lives <= 0) {
      this.state.isGameOver = true
      this.onGameOver?.(this.state.score)
    } else {
      // Respawn ship
      this.state.ship = this.createShip()
    }
  }

  private update(dt: number): void {
    if (this.state.isPaused || this.state.isGameOver) return

    const { ship, asteroids, bullets, particles } = this.state

    // Update ship
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * this.config.shipAcceleration * dt
      ship.vy += Math.sin(ship.angle) * this.config.shipAcceleration * dt

      // Clamp speed
      const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy)
      if (speed > this.config.shipMaxSpeed) {
        const scale = this.config.shipMaxSpeed / speed
        ship.vx *= scale
        ship.vy *= scale
      }

      // Thrust particles
      if (Math.random() > 0.5) {
        const angle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.5
        this.state.particles.push({
          x: ship.x - Math.cos(ship.angle) * this.config.shipSize,
          y: ship.y - Math.sin(ship.angle) * this.config.shipSize,
          vx: Math.cos(angle) * 100 + ship.vx * 0.5,
          vy: Math.sin(angle) * 100 + ship.vy * 0.5,
          life: 0.2 + Math.random() * 0.2,
          maxLife: 0.4,
          color: '#f80'
        })
      }
    }

    // Apply friction
    ship.vx *= Math.pow(this.config.shipFriction, dt * 60)
    ship.vy *= Math.pow(this.config.shipFriction, dt * 60)

    // Apply rotation
    ship.angle += ship.rotationSpeed * this.config.shipRotationSpeed * dt

    // Move ship
    ship.x += ship.vx * dt
    ship.y += ship.vy * dt
    this.wrapPosition(ship)

    // Update invulnerability
    if (ship.invulnerable) {
      ship.invulnerableTime -= dt
      if (ship.invulnerableTime <= 0) {
        ship.invulnerable = false
      }
    }

    // Update asteroids
    for (const asteroid of asteroids) {
      asteroid.x += asteroid.vx * dt
      asteroid.y += asteroid.vy * dt
      asteroid.rotation += asteroid.rotationSpeed * dt
      this.wrapPosition(asteroid)
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]
      bullet.x += bullet.vx * dt
      bullet.y += bullet.vy * dt
      bullet.life -= dt
      this.wrapPosition(bullet)

      if (bullet.life <= 0) {
        bullets.splice(i, 1)
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.life -= dt

      if (particle.life <= 0) {
        particles.splice(i, 1)
      }
    }

    // Check collisions
    this.checkCollisions()

    // Check for level complete
    if (asteroids.length === 0) {
      this.nextLevel()
    }

    this.onUpdate?.(this.state)
  }

  private nextLevel(): void {
    this.state.level++
    this.spawnAsteroids(this.config.startingAsteroids + this.state.level - 1)
    // Brief invulnerability on new level
    this.state.ship.invulnerable = true
    this.state.ship.invulnerableTime = 2
    this.onSound?.('asteroids.levelup')
  }

  private gameLoop = (timestamp: number): void => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1)
    this.lastTime = timestamp

    this.update(dt)

    if (!this.state.isGameOver) {
      this.animationId = requestAnimationFrame(this.gameLoop)
    }
  }

  // Public API
  start(): void {
    this.state = this.createInitialState()
    this.spawnAsteroids(this.config.startingAsteroids)
    this.lastTime = performance.now()
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  pause(): void {
    this.state.isPaused = true
  }

  resume(): void {
    this.state.isPaused = false
    this.lastTime = performance.now()
  }

  togglePause(): void {
    if (this.state.isPaused) {
      this.resume()
    } else {
      this.pause()
    }
  }

  setRotation(direction: number): void {
    // -1 = left, 0 = none, 1 = right
    this.state.ship.rotationSpeed = direction
  }

  setThrust(thrusting: boolean): void {
    this.state.ship.thrusting = thrusting
  }

  fire(): void {
    const now = performance.now() / 1000
    if (now - this.lastFireTime < this.config.fireRate) return
    if (this.state.isPaused || this.state.isGameOver) return

    this.lastFireTime = now
    const { ship } = this.state

    this.state.bullets.push({
      x: ship.x + Math.cos(ship.angle) * this.config.shipSize,
      y: ship.y + Math.sin(ship.angle) * this.config.shipSize,
      vx: Math.cos(ship.angle) * this.config.bulletSpeed + ship.vx * 0.3,
      vy: Math.sin(ship.angle) * this.config.bulletSpeed + ship.vy * 0.3,
      life: this.config.bulletLife
    })

    this.onSound?.('asteroids.shoot')
  }

  getState(): GameState {
    return this.state
  }

  setOnUpdate(callback: UpdateCallback): void {
    this.onUpdate = callback
  }

  setOnGameOver(callback: GameOverCallback): void {
    this.onGameOver = callback
  }

  setOnSound(callback: SoundCallback): void {
    this.onSound = callback
  }

  resize(width: number, height: number): void {
    this.config.width = width
    this.config.height = height
    this.state.width = width
    this.state.height = height
  }
}
