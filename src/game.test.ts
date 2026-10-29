import { describe, expect, it } from 'vitest'
import { chooseCpuMove, createBoard, getGameResult, placeStone, type Cell, type Position } from './game'

function boardWith(positions: Position[], player: 'amber' | 'cyan' = 'amber'): Cell[][] {
  const board = createBoard()
  positions.forEach(({ row, col }) => { board[row][col] = player })
  return board
}

describe('Five Ember game rules', () => {
  it('recognizes five stones in a row and returns the winning line', () => {
    const board = boardWith([{ row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }])
    const nextBoard = placeStone(board, { row: 4, col: 6 }, 'amber')!

    expect(getGameResult(nextBoard, { row: 4, col: 6 }, 'amber')).toEqual({
      status: 'won',
      winner: 'amber',
      line: [{ row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 }],
    })
  })

  it('rejects a move on an occupied intersection without mutating the board', () => {
    const board = boardWith([{ row: 3, col: 7 }])

    expect(placeStone(board, { row: 3, col: 7 }, 'cyan')).toBeNull()
    expect(board[3][7]).toBe('amber')
  })

  it('recognizes a full board with no five in a row as a draw', () => {
    const board = createBoard()
    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) board[row][col] = (row + col * 2) % 5 < 2 ? 'amber' : 'cyan'
    }

    expect(getGameResult(board, { row: 12, col: 12 }, 'amber')).toEqual({ status: 'draw' })
  })

  it('takes an available winning move before considering a block', () => {
    const board = boardWith([{ row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }], 'cyan')
    board[5][2] = 'amber'
    board[5][3] = 'amber'
    board[5][4] = 'amber'
    board[5][5] = 'amber'

    expect(chooseCpuMove(board)).toEqual({ row: 6, col: 1 })
  })

  it('blocks the player’s immediate winning move', () => {
    const board = boardWith([{ row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 7, col: 7 }])

    expect(chooseCpuMove(board)).toEqual({ row: 7, col: 3 })
  })
})
