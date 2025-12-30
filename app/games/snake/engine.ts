export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export interface Snake {
  id: string
  color: string
  body: Position[]
  direction: Direction
  nextDirection: Direction
  score: number
  alive: boolean
}

export interface Food {
  position: Position
  value: number
}

export interface GameConfig {
  gridWidth: number
  gridHeight: number
  cellSize: number
  initialSpeed: number
  speedIncrement: number
  maxSpeed: number
}

export interface GameState {
  snakes: Map<string, Snake>
  food: Food[]
  gameOver: boolean
  winner: string | null
  tick: number
}

const DEFAULT_CONFIG: GameConfig = {
  gridWidth: 30,
  gridHeight: 20,
  cellSize: 20,
  initialSpeed: 150,
  speedIncrement: 2,
  maxSpeed: 50
}

export class SnakeGame {
  config: GameConfig
  state: GameState
  private intervalId: number | null = null
  private onUpdate: ((state: GameState) => void) | null = null
  private onGameOver: ((winner: string | null) => void) | null = null
  private speed: number

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.speed = this.config.initialSpeed
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      snakes: new Map(),
      food: [],
      gameOver: false,
      winner: null,
      tick: 0
    }
  }

  addSnake(id: string, color: string, startPosition?: Position): Snake {
    const existingPositions = new Set<string>()
    this.state.snakes.forEach(s => {
      s.body.forEach(p => existingPositions.add(`${p.x},${p.y}`))
    })

    // Find a valid start position
    let pos = startPosition
    if (!pos) {
      const snakeCount = this.state.snakes.size
      const positions = [
        { x: 5, y: Math.floor(this.config.gridHeight / 2) },
        { x: this.config.gridWidth - 6, y: Math.floor(this.config.gridHeight / 2) },
        { x: Math.floor(this.config.gridWidth / 2), y: 5 },
        { x: Math.floor(this.config.gridWidth / 2), y: this.config.gridHeight - 6 }
      ]
      pos = positions[snakeCount % positions.length]
    }

    const directions: Direction[] = ['right', 'left', 'down', 'up']
    const direction = directions[this.state.snakes.size % directions.length]

    const snake: Snake = {
      id,
      color,
      body: [
        { ...pos },
        { x: pos.x - (direction === 'right' ? 1 : direction === 'left' ? -1 : 0), y: pos.y - (direction === 'down' ? 1 : direction === 'up' ? -1 : 0) },
        { x: pos.x - (direction === 'right' ? 2 : direction === 'left' ? -2 : 0), y: pos.y - (direction === 'down' ? 2 : direction === 'up' ? -2 : 0) }
      ],
      direction,
      nextDirection: direction,
      score: 0,
      alive: true
    }

    this.state.snakes.set(id, snake)
    return snake
  }

  removeSnake(id: string) {
    this.state.snakes.delete(id)
  }

  spawnFood(count: number = 1) {
    const occupiedPositions = new Set<string>()

    // Mark snake positions
    this.state.snakes.forEach(snake => {
      snake.body.forEach(pos => {
        occupiedPositions.add(`${pos.x},${pos.y}`)
      })
    })

    // Mark existing food positions
    this.state.food.forEach(food => {
      occupiedPositions.add(`${food.position.x},${food.position.y}`)
    })

    for (let i = 0; i < count; i++) {
      let attempts = 0
      let position: Position | null = null

      while (attempts < 100) {
        const x = Math.floor(Math.random() * this.config.gridWidth)
        const y = Math.floor(Math.random() * this.config.gridHeight)
        const key = `${x},${y}`

        if (!occupiedPositions.has(key)) {
          position = { x, y }
          occupiedPositions.add(key)
          break
        }
        attempts++
      }

      if (position) {
        this.state.food.push({
          position,
          value: Math.random() < 0.1 ? 3 : 1 // 10% chance of bonus food
        })
      }
    }
  }

  setDirection(snakeId: string, direction: Direction) {
    const snake = this.state.snakes.get(snakeId)
    if (!snake || !snake.alive) return

    // Prevent 180-degree turns
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    }

    if (opposites[direction] !== snake.direction) {
      snake.nextDirection = direction
    }
  }

  private moveSnake(snake: Snake) {
    if (!snake.alive) return

    snake.direction = snake.nextDirection
    const head = snake.body[0]
    const newHead: Position = { ...head }

    switch (snake.direction) {
      case 'up': newHead.y--; break
      case 'down': newHead.y++; break
      case 'left': newHead.x--; break
      case 'right': newHead.x++; break
    }

    // Check wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= this.config.gridWidth ||
      newHead.y < 0 ||
      newHead.y >= this.config.gridHeight
    ) {
      snake.alive = false
      return
    }

    // Check self collision
    for (let i = 0; i < snake.body.length - 1; i++) {
      if (snake.body[i].x === newHead.x && snake.body[i].y === newHead.y) {
        snake.alive = false
        return
      }
    }

    // Check collision with other snakes
    this.state.snakes.forEach((otherSnake, otherId) => {
      if (otherId === snake.id) return
      for (const segment of otherSnake.body) {
        if (segment.x === newHead.x && segment.y === newHead.y) {
          snake.alive = false
          return
        }
      }
    })

    if (!snake.alive) return

    // Move snake
    snake.body.unshift(newHead)

    // Check food collision
    let ate = false
    this.state.food = this.state.food.filter(food => {
      if (food.position.x === newHead.x && food.position.y === newHead.y) {
        snake.score += food.value * 10
        ate = true
        // Increase speed
        this.speed = Math.max(this.config.maxSpeed, this.speed - this.config.speedIncrement)
        return false
      }
      return true
    })

    if (!ate) {
      snake.body.pop()
    } else {
      // Spawn new food
      this.spawnFood()
    }
  }

  private tick() {
    if (this.state.gameOver) return

    this.state.tick++

    // Move all snakes
    this.state.snakes.forEach(snake => {
      this.moveSnake(snake)
    })

    // Check for game over
    const aliveSnakes = Array.from(this.state.snakes.values()).filter(s => s.alive)

    if (this.state.snakes.size === 1) {
      // Single player
      if (aliveSnakes.length === 0) {
        this.state.gameOver = true
        this.state.winner = null
      }
    } else {
      // Multiplayer
      if (aliveSnakes.length <= 1) {
        this.state.gameOver = true
        this.state.winner = aliveSnakes[0]?.id || null
      }
    }

    // Notify listeners
    this.onUpdate?.(this.getState())

    if (this.state.gameOver) {
      this.stop()
      this.onGameOver?.(this.state.winner)
    }
  }

  start() {
    if (this.intervalId !== null) return

    // Ensure there's food
    if (this.state.food.length === 0) {
      this.spawnFood(3)
    }

    this.intervalId = window.setInterval(() => this.tick(), this.speed)
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  reset() {
    this.stop()
    this.state = this.createInitialState()
    this.speed = this.config.initialSpeed
  }

  getState(): GameState {
    return {
      ...this.state,
      snakes: new Map(this.state.snakes)
    }
  }

  setOnUpdate(callback: (state: GameState) => void) {
    this.onUpdate = callback
  }

  setOnGameOver(callback: (winner: string | null) => void) {
    this.onGameOver = callback
  }

  // For multiplayer sync
  applyState(state: Partial<GameState>) {
    if (state.food) this.state.food = state.food
    if (state.gameOver !== undefined) this.state.gameOver = state.gameOver
    if (state.winner !== undefined) this.state.winner = state.winner
    if (state.tick !== undefined) this.state.tick = state.tick
  }

  updateSnakeFromRemote(id: string, data: Partial<Snake>) {
    const snake = this.state.snakes.get(id)
    if (snake) {
      Object.assign(snake, data)
    }
  }

  getCanvasSize() {
    return {
      width: this.config.gridWidth * this.config.cellSize,
      height: this.config.gridHeight * this.config.cellSize
    }
  }
}
