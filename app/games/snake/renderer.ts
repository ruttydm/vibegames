import type { GameState, GameConfig, Snake, Food, Position } from './engine'

export class SnakeRenderer {
  private ctx: CanvasRenderingContext2D
  private config: GameConfig

  // Colors
  private bgColor = '#0a0a0f'
  private gridColor = '#1a1a2e'
  private foodColor = '#ff2e63'
  private bonusFoodColor = '#ffd700'

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')
    this.ctx = ctx
    this.config = config

    // Set canvas size
    canvas.width = config.gridWidth * config.cellSize
    canvas.height = config.gridHeight * config.cellSize
  }

  render(state: GameState) {
    this.clear()
    this.drawGrid()
    this.drawFood(state.food)
    state.snakes.forEach(snake => this.drawSnake(snake))
  }

  private clear() {
    this.ctx.fillStyle = this.bgColor
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  private drawGrid() {
    this.ctx.strokeStyle = this.gridColor
    this.ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= this.config.gridWidth; x++) {
      this.ctx.beginPath()
      this.ctx.moveTo(x * this.config.cellSize, 0)
      this.ctx.lineTo(x * this.config.cellSize, this.ctx.canvas.height)
      this.ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= this.config.gridHeight; y++) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y * this.config.cellSize)
      this.ctx.lineTo(this.ctx.canvas.width, y * this.config.cellSize)
      this.ctx.stroke()
    }
  }

  private drawSnake(snake: Snake) {
    const { cellSize } = this.config
    const padding = 2

    snake.body.forEach((segment, index) => {
      const x = segment.x * cellSize + padding
      const y = segment.y * cellSize + padding
      const size = cellSize - padding * 2

      if (index === 0) {
        // Head - slightly larger with glow
        this.ctx.shadowColor = snake.color
        this.ctx.shadowBlur = snake.alive ? 10 : 0
        this.ctx.fillStyle = snake.color
        this.ctx.fillRect(x - 1, y - 1, size + 2, size + 2)

        // Eyes
        this.ctx.shadowBlur = 0
        this.ctx.fillStyle = this.bgColor
        const eyeSize = 4
        const eyeOffset = size / 4

        // Position eyes based on direction
        let eye1: Position, eye2: Position
        switch (snake.direction) {
          case 'up':
            eye1 = { x: x + eyeOffset, y: y + eyeOffset }
            eye2 = { x: x + size - eyeOffset - eyeSize, y: y + eyeOffset }
            break
          case 'down':
            eye1 = { x: x + eyeOffset, y: y + size - eyeOffset - eyeSize }
            eye2 = { x: x + size - eyeOffset - eyeSize, y: y + size - eyeOffset - eyeSize }
            break
          case 'left':
            eye1 = { x: x + eyeOffset, y: y + eyeOffset }
            eye2 = { x: x + eyeOffset, y: y + size - eyeOffset - eyeSize }
            break
          case 'right':
          default:
            eye1 = { x: x + size - eyeOffset - eyeSize, y: y + eyeOffset }
            eye2 = { x: x + size - eyeOffset - eyeSize, y: y + size - eyeOffset - eyeSize }
        }

        this.ctx.fillRect(eye1.x, eye1.y, eyeSize, eyeSize)
        this.ctx.fillRect(eye2.x, eye2.y, eyeSize, eyeSize)
      } else {
        // Body - gradient fade
        const alpha = snake.alive ? 1 - (index / snake.body.length) * 0.4 : 0.3
        this.ctx.fillStyle = this.adjustAlpha(snake.color, alpha)
        this.ctx.fillRect(x, y, size, size)
      }
    })

    // Reset shadow
    this.ctx.shadowBlur = 0
  }

  private drawFood(foods: Food[]) {
    const { cellSize } = this.config
    const padding = 3

    foods.forEach(food => {
      const x = food.position.x * cellSize + padding
      const y = food.position.y * cellSize + padding
      const size = cellSize - padding * 2

      const color = food.value > 1 ? this.bonusFoodColor : this.foodColor

      // Glow effect
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 15

      // Draw food as circle
      this.ctx.fillStyle = color
      this.ctx.beginPath()
      this.ctx.arc(
        x + size / 2,
        y + size / 2,
        size / 2,
        0,
        Math.PI * 2
      )
      this.ctx.fill()

      // Bonus food has extra sparkle
      if (food.value > 1) {
        this.ctx.fillStyle = '#fff'
        this.ctx.beginPath()
        this.ctx.arc(
          x + size / 3,
          y + size / 3,
          size / 6,
          0,
          Math.PI * 2
        )
        this.ctx.fill()
      }

      this.ctx.shadowBlur = 0
    })
  }

  drawGameOver(winner: Snake | null, isMultiplayer: boolean) {
    // Darken background
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.8)'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    // Game Over text
    this.ctx.fillStyle = '#ff2e63'
    this.ctx.font = 'bold 32px "Press Start 2P", monospace'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#ff2e63'
    this.ctx.shadowBlur = 20

    const centerX = this.ctx.canvas.width / 2
    const centerY = this.ctx.canvas.height / 2

    this.ctx.fillText('GAME OVER', centerX, centerY - 40)

    // Winner or score
    this.ctx.font = '16px "Press Start 2P", monospace'
    this.ctx.fillStyle = '#00fff5'
    this.ctx.shadowColor = '#00fff5'

    if (isMultiplayer && winner) {
      this.ctx.fillText(`Winner: ${winner.id}`, centerX, centerY + 10)
      this.ctx.fillText(`Score: ${winner.score}`, centerX, centerY + 40)
    } else if (winner) {
      this.ctx.fillText(`Score: ${winner.score}`, centerX, centerY + 10)
    }

    // Restart prompt
    this.ctx.font = '12px "Press Start 2P", monospace'
    this.ctx.fillStyle = '#ffd700'
    this.ctx.shadowColor = '#ffd700'
    this.ctx.fillText('Press SPACE to restart', centerX, centerY + 80)

    this.ctx.shadowBlur = 0
  }

  drawPaused() {
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.7)'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    this.ctx.fillStyle = '#ffd700'
    this.ctx.font = 'bold 24px "Press Start 2P", monospace'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#ffd700'
    this.ctx.shadowBlur = 15

    this.ctx.fillText('PAUSED', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2)

    this.ctx.font = '12px "Press Start 2P", monospace'
    this.ctx.fillText('Press P to resume', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 40)

    this.ctx.shadowBlur = 0
  }

  drawCountdown(count: number) {
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.7)'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    this.ctx.fillStyle = '#00fff5'
    this.ctx.font = 'bold 64px "Press Start 2P", monospace'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#00fff5'
    this.ctx.shadowBlur = 30

    this.ctx.fillText(
      count > 0 ? count.toString() : 'GO!',
      this.ctx.canvas.width / 2,
      this.ctx.canvas.height / 2 + 20
    )

    this.ctx.shadowBlur = 0
  }

  private adjustAlpha(hex: string, alpha: number): string {
    // Convert hex to rgba
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
}
