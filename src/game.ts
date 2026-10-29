export const BOARD_SIZE = 13
export const WIN_LENGTH = 5

export type Player = 'amber' | 'cyan'
export type Cell = Player | null
export type Position = { row: number; col: number }
export type GameResult =
  | { status: 'playing' }
  | { status: 'draw' }
  | { status: 'won'; winner: Player; line: Position[] }

const DIRECTIONS: Position[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
]

export function createBoard(size = BOARD_SIZE): Cell[][] {
  return Array.from({ length: size }, () => Array<Cell>(size).fill(null))
}

export function isInside(board: Cell[][], position: Position): boolean {
  return position.row >= 0 && position.row < board.length
    && position.col >= 0 && position.col < (board[position.row]?.length ?? 0)
}

export function placeStone(board: Cell[][], position: Position, player: Player): Cell[][] | null {
  if (!isInside(board, position) || board[position.row][position.col] !== null) return null
  const nextBoard = board.map((row) => [...row])
  nextBoard[position.row][position.col] = player
  return nextBoard
}

export function getWinningLine(board: Cell[][], position: Position, player: Player): Position[] | null {
  if (!isInside(board, position) || board[position.row][position.col] !== player) return null
  for (const direction of DIRECTIONS) {
    const line: Position[] = [position]
    for (const sign of [1, -1]) {
      let row = position.row + direction.row * sign
      let col = position.col + direction.col * sign
      while (board[row]?.[col] === player) {
        line.push({ row, col })
        row += direction.row * sign
        col += direction.col * sign
      }
    }
    if (line.length >= WIN_LENGTH) {
      line.sort((a, b) => a.row - b.row || a.col - b.col)
      return line
    }
  }
  return null
}

export function getGameResult(board: Cell[][], position: Position, player: Player): GameResult {
  const line = getWinningLine(board, position, player)
  if (line) return { status: 'won', winner: player, line }
  if (board.every((row) => row.every((cell) => cell !== null))) return { status: 'draw' }
  return { status: 'playing' }
}

function findImmediateWin(board: Cell[][], player: Player): Position | null {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== null) continue
      const position = { row, col }
      const nextBoard = placeStone(board, position, player)
      if (nextBoard && getWinningLine(nextBoard, position, player)) return position
    }
  }
  return null
}

function nearbyScore(board: Cell[][], position: Position, player: Player): number {
  let score = 0
  for (let row = Math.max(0, position.row - 2); row <= Math.min(board.length - 1, position.row + 2); row += 1) {
    for (let col = Math.max(0, position.col - 2); col <= Math.min(board[row].length - 1, position.col + 2); col += 1) {
      const cell = board[row][col]
      if (!cell) continue
      const distance = Math.max(Math.abs(position.row - row), Math.abs(position.col - col))
      const proximity = distance === 1 ? 6 : 2
      score += cell === player ? proximity * 1.08 : proximity
    }
  }
  // A subtle center preference gives the opening a purposeful first move.
  const center = (board.length - 1) / 2
  score += Math.max(0, 4 - Math.abs(position.row - center) - Math.abs(position.col - center)) * 0.12
  return score
}

export function chooseCpuMove(board: Cell[][]): Position | null {
  const cpuWin = findImmediateWin(board, 'cyan')
  if (cpuWin) return cpuWin
  const playerWin = findImmediateWin(board, 'amber')
  if (playerWin) return playerWin

  const candidates: Array<{ position: Position; score: number }> = []
  const hasStone = board.some((row) => row.some((cell) => cell !== null))
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== null) continue
      const position = { row, col }
      if (hasStone) {
        const nearby = board.some((line, candidateRow) => line.some((cell, candidateCol) => (
          cell !== null && Math.max(Math.abs(candidateRow - row), Math.abs(candidateCol - col)) <= 2
        )))
        if (!nearby) continue
      }
      candidates.push({ position, score: nearbyScore(board, position, 'cyan') })
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.position.row - b.position.row || a.position.col - b.position.col)
  return candidates[0]?.position ?? null
}
