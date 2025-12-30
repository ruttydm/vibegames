// Asteroids Game Renderer

import type { GameState, Ship, Asteroid, Bullet, Particle } from './engine'

export interface RenderConfig {
  shipColor: string
  asteroidColor: string
  bulletColor: string
  backgroundColor: string
  shipSize: number
}

const DEFAULT_RENDER_CONFIG: RenderConfig = {
  shipColor: '#0ff',
  asteroidColor: '#fff',
  bulletColor: '#ff0',
  backgroundColor: '#000',
  shipSize: 15
}

export class AsteroidsRenderer {
  private ctx: CanvasRenderingContext2D
  private config: RenderConfig

  constructor(ctx: CanvasRenderingContext2D, config: Partial<RenderConfig> = {}) {
    this.ctx = ctx
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config }
  }

  render(state: GameState): void {
    const { ctx } = this
    const { width, height } = state

    // Clear background
    ctx.fillStyle = this.config.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw stars (static background)
    this.drawStars(width, height)

    // Draw particles
    for (const particle of state.particles) {
      this.drawParticle(particle)
    }

    // Draw asteroids
    for (const asteroid of state.asteroids) {
      this.drawAsteroid(asteroid)
    }

    // Draw bullets
    for (const bullet of state.bullets) {
      this.drawBullet(bullet)
    }

    // Draw ship (if alive)
    if (!state.isGameOver) {
      this.drawShip(state.ship)
    }

    // Draw UI
    this.drawUI(state)

    // Draw overlays
    if (state.isPaused) {
      this.drawPaused(width, height)
    }

    if (state.isGameOver) {
      this.drawGameOver(width, height, state.score)
    }
  }

  private drawStars(width: number, height: number): void {
    const { ctx } = this
    // Use seeded positions based on canvas size
    const seed = width * height
    for (let i = 0; i < 100; i++) {
      const x = ((seed * (i + 1) * 7919) % width)
      const y = ((seed * (i + 1) * 104729) % height)
      const brightness = 0.3 + ((i * 31) % 70) / 100
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  private drawShip(ship: Ship): void {
    const { ctx, config } = this
    const { x, y, angle, thrusting, invulnerable, invulnerableTime } = ship
    const size = config.shipSize

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // Flickering effect when invulnerable
    if (invulnerable && Math.floor(invulnerableTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.3
    }

    // Ship body (triangle)
    ctx.strokeStyle = config.shipColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(size, 0)
    ctx.lineTo(-size * 0.7, -size * 0.6)
    ctx.lineTo(-size * 0.4, 0)
    ctx.lineTo(-size * 0.7, size * 0.6)
    ctx.closePath()
    ctx.stroke()

    // Thrust flame
    if (thrusting) {
      ctx.strokeStyle = '#f80'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-size * 0.4, -size * 0.3)
      ctx.lineTo(-size * 1.2, 0)
      ctx.lineTo(-size * 0.4, size * 0.3)
      ctx.stroke()
    }

    ctx.restore()
  }

  private drawAsteroid(asteroid: Asteroid): void {
    const { ctx, config } = this
    const { x, y, radius, rotation, vertices } = asteroid

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    ctx.strokeStyle = config.asteroidColor
    ctx.lineWidth = 2
    ctx.beginPath()

    const numVertices = vertices.length
    for (let i = 0; i <= numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2
      const r = radius * vertices[i % numVertices]
      const vx = Math.cos(angle) * r
      const vy = Math.sin(angle) * r

      if (i === 0) {
        ctx.moveTo(vx, vy)
      } else {
        ctx.lineTo(vx, vy)
      }
    }

    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }

  private drawBullet(bullet: Bullet): void {
    const { ctx, config } = this

    ctx.fillStyle = config.bulletColor
    ctx.beginPath()
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawParticle(particle: Particle): void {
    const { ctx } = this
    const alpha = particle.life / particle.maxLife

    ctx.fillStyle = particle.color
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  private drawUI(state: GameState): void {
    const { ctx } = this

    // Score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px "Press Start 2P", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(state.score.toString().padStart(6, '0'), 20, 40)

    // Lives
    const lifeSize = 10
    for (let i = 0; i < state.lives; i++) {
      ctx.save()
      ctx.translate(30 + i * 25, 70)
      ctx.rotate(-Math.PI / 2)
      ctx.strokeStyle = this.config.shipColor
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(lifeSize, 0)
      ctx.lineTo(-lifeSize * 0.7, -lifeSize * 0.6)
      ctx.lineTo(-lifeSize * 0.4, 0)
      ctx.lineTo(-lifeSize * 0.7, lifeSize * 0.6)
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }

    // Level
    ctx.fillStyle = '#888'
    ctx.font = '14px "Press Start 2P", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`LEVEL ${state.level}`, state.width - 20, 40)
  }

  private drawPaused(width: number, height: number): void {
    const { ctx } = this

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 36px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('PAUSED', width / 2, height / 2)

    ctx.font = '14px "Press Start 2P", monospace'
    ctx.fillStyle = '#888'
    ctx.fillText('Press ESC to resume', width / 2, height / 2 + 50)
  }

  private drawGameOver(width: number, height: number, score: number): void {
    const { ctx } = this

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#f00'
    ctx.font = 'bold 48px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', width / 2, height / 2 - 40)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px "Press Start 2P", monospace'
    ctx.fillText(`SCORE: ${score}`, width / 2, height / 2 + 20)

    ctx.font = '14px "Press Start 2P", monospace'
    ctx.fillStyle = '#888'
    ctx.fillText('Press SPACE to restart', width / 2, height / 2 + 80)
  }

  drawCountdown(width: number, height: number, count: number): void {
    const { ctx } = this

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#0ff'
    ctx.font = 'bold 72px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(count.toString(), width / 2, height / 2 + 20)
  }

  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
