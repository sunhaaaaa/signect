export type Grid = number[][] // 9x9, 0 = empty
export type Difficulty = 'easy' | 'medium' | 'hard'

const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 26,
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function isValidPlacement(grid: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false
    }
  }
  return true
}

function solve(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (const num of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num
            if (solve(grid)) return true
            grid[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

/** A fully solved 9x9 grid, generated via randomized backtracking. */
export function generateSolvedGrid(): Grid {
  const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(0))
  solve(grid)
  return grid
}

/**
 * Removes cells from a solved grid to make a puzzle. Doesn't guarantee a
 * unique solution — an accepted simplification for a learning-focused game.
 */
export function makePuzzle(solution: Grid, difficulty: Difficulty): Grid {
  const puzzle = solution.map((row) => [...row])
  const cellsToRemove = 81 - CLUES_BY_DIFFICULTY[difficulty]
  const positions = shuffled(Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as const))
  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = positions[i]
    puzzle[r][c] = 0
  }
  return puzzle
}

export function isBoardComplete(board: Grid, solution: Grid): boolean {
  return board.every((row, r) => row.every((value, c) => value === solution[r][c]))
}
