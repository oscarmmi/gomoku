<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BOARD_SIZE,
  chooseCpuMove,
  createBoard,
  getGameResult,
  placeStone,
  type Cell,
  type GameResult,
  type Position,
} from './game'

type Score = { wins: number; losses: number; draws: number }
const SCORE_KEY = 'five-ember-score-v1'
const emptyScore = (): Score => ({ wins: 0, losses: 0, draws: 0 })

function readScore(): Score {
  try {
    const stored = localStorage.getItem(SCORE_KEY)
    if (!stored) return emptyScore()
    const score = JSON.parse(stored) as Partial<Score>
    return {
      wins: Math.max(0, Number(score.wins) || 0),
      losses: Math.max(0, Number(score.losses) || 0),
      draws: Math.max(0, Number(score.draws) || 0),
    }
  } catch {
    return emptyScore()
  }
}

const board = ref<Cell[][]>(createBoard())
const score = ref<Score>(readScore())
const result = ref<GameResult>({ status: 'playing' })
const selected = ref<Position>({ row: 6, col: 6 })
const lastMove = ref<Position | null>(null)
const cpuThinking = ref(false)
const isSoundOn = ref(true)
const moveCount = ref(0)
const winningCells = computed(() => new Set(
  result.value.status === 'won' ? result.value.line.map(({ row, col }) => `${row}-${col}`) : [],
))
const moveLabel = computed(() => String(moveCount.value).padStart(2, '0'))
const statusText = computed(() => {
  if (cpuThinking.value) return 'The CPU is weighing its move…'
  if (result.value.status === 'won') return result.value.winner === 'amber' ? 'You connected five. Beautifully played.' : 'The CPU found five. Ready for a rematch?'
  if (result.value.status === 'draw') return 'A full board. This one is a draw.'
  return 'Your move — connect five to win.'
})

let cpuTimer: ReturnType<typeof setTimeout> | undefined
let audioContext: AudioContext | undefined

function playTone(frequency = 460, duration = 0.055, volume = 0.025) {
  if (!isSoundOn.value) return
  try {
    audioContext ??= new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
  } catch {
    // Audio is an optional enhancement; gameplay always works without it.
  }
}

function persistScore() {
  try {
    localStorage.setItem(SCORE_KEY, JSON.stringify(score.value))
  } catch {
    // Private browsing or a full storage quota should not interrupt a match.
  }
}

function finishTurn(position: Position, player: Exclude<Cell, null>) {
  const nextBoard = placeStone(board.value, position, player)
  if (!nextBoard) return false
  board.value = nextBoard
  lastMove.value = position
  moveCount.value += 1
  result.value = getGameResult(nextBoard, position, player)
  playTone(player === 'amber' ? 540 : 340, player === 'amber' ? 0.06 : 0.09)

  if (result.value.status === 'won') {
    if (player === 'amber') score.value.wins += 1
    else score.value.losses += 1
    persistScore()
    playTone(player === 'amber' ? 780 : 220, 0.22, 0.035)
  } else if (result.value.status === 'draw') {
    score.value.draws += 1
    persistScore()
  }
  return true
}

function playAt(position: Position) {
  if (result.value.status !== 'playing' || cpuThinking.value || board.value[position.row]?.[position.col] !== null) return
  selected.value = position
  if (!finishTurn(position, 'amber') || result.value.status !== 'playing') return
  cpuThinking.value = true
  cpuTimer = setTimeout(() => {
    const move = chooseCpuMove(board.value)
    if (move) finishTurn(move, 'cyan')
    cpuThinking.value = false
  }, 460)
}

function restartGame() {
  if (cpuTimer) clearTimeout(cpuTimer)
  cpuThinking.value = false
  board.value = createBoard()
  result.value = { status: 'playing' }
  selected.value = { row: 6, col: 6 }
  lastMove.value = null
  moveCount.value = 0
  playTone(400, 0.08, 0.018)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const key = event.key.toLowerCase()
  if (key === 'r') {
    event.preventDefault()
    restartGame()
    return
  }
  if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
    event.preventDefault()
    const delta = key === 'arrowup' ? [-1, 0] : key === 'arrowdown' ? [1, 0] : key === 'arrowleft' ? [0, -1] : [0, 1]
    selected.value = {
      row: Math.max(0, Math.min(BOARD_SIZE - 1, selected.value.row + delta[0])),
      col: Math.max(0, Math.min(BOARD_SIZE - 1, selected.value.col + delta[1])),
    }
    return
  }
  if (key === 'enter' || key === ' ') {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'BUTTON' && !target.classList.contains('intersection')) return
    event.preventDefault()
    playAt(selected.value)
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (cpuTimer) clearTimeout(cpuTimer)
  void audioContext?.close()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Five Ember home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>five<span class="brand-light">ember</span></span>
      </a>
      <div class="topbar-right">
        <span class="live-label"><span class="live-dot"></span> LOCAL MATCH</span>
        <button class="icon-button sound-toggle" type="button" :aria-label="isSoundOn ? 'Mute sound' : 'Enable sound'" :title="isSoundOn ? 'Mute sound' : 'Enable sound'" @click="isSoundOn = !isSoundOn">
          <svg v-if="isSoundOn" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" /></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6" /></svg>
        </button>
      </div>
    </header>

    <main id="top" class="game-layout">
      <section class="intro-column" aria-labelledby="game-title">
        <div class="eyebrow"><span class="eyebrow-line"></span> THE ANCIENT GAME, REIGNITED</div>
        <h1 id="game-title">Five in a row.<br /><span>One bright spark.</span></h1>
        <p class="intro-copy">A quiet board. A sharp opponent.<br />Make every move count.</p>

        <div class="opponent-card">
          <div class="opponent-avatar" aria-hidden="true"><span></span></div>
          <div class="opponent-info"><span class="card-overline">YOUR OPPONENT</span><strong>Ember CPU</strong><span class="opponent-caption"><span class="cyan-dot"></span> Always up for a challenge</span></div>
          <span class="difficulty">STANDARD</span>
        </div>

        <div class="score-card">
          <div class="score-head"><span class="card-overline">YOUR RECORD</span><span class="score-total">{{ score.wins + score.losses + score.draws }} GAMES</span></div>
          <div class="score-stats">
            <div class="score-stat"><strong class="amber-text">{{ score.wins }}</strong><span>WON</span></div>
            <div class="score-divider"></div>
            <div class="score-stat"><strong>{{ score.losses }}</strong><span>LOST</span></div>
            <div class="score-divider"></div>
            <div class="score-stat"><strong>{{ score.draws }}</strong><span>DRAW</span></div>
          </div>
        </div>

        <div class="tip"><span class="tip-icon">✳</span><p><strong>A small tip</strong><br />The center opens up more ways to connect. Claim it early.</p></div>
      </section>

      <section class="board-column" aria-label="Gomoku game board">
        <div class="board-meta">
          <div class="turn-status" :class="{ 'is-cpu': cpuThinking, 'is-finished': result.status !== 'playing' }">
            <span class="turn-indicator" :class="cpuThinking ? 'cyan-stone' : 'amber-stone'"></span>
            <span>{{ statusText }}</span>
          </div>
          <span class="move-count">MOVE <b>{{ moveLabel }}</b></span>
        </div>

        <div class="board-frame" :class="{ 'board-locked': cpuThinking || result.status !== 'playing' }">
          <div class="board" role="grid" aria-label="13 by 13 Gomoku board" :aria-busy="cpuThinking">
            <button
              v-for="(_, index) in BOARD_SIZE * BOARD_SIZE"
              :key="index"
              class="intersection"
              :class="{
                'is-selected': selected.row === Math.floor(index / BOARD_SIZE) && selected.col === index % BOARD_SIZE && result.status === 'playing',
                'is-last-move': lastMove?.row === Math.floor(index / BOARD_SIZE) && lastMove?.col === index % BOARD_SIZE,
                'is-winning': winningCells.has(`${Math.floor(index / BOARD_SIZE)}-${index % BOARD_SIZE}`),
              }"
              type="button"
              role="gridcell"
              :aria-label="`Row ${Math.floor(index / BOARD_SIZE) + 1}, column ${index % BOARD_SIZE + 1}${board[Math.floor(index / BOARD_SIZE)][index % BOARD_SIZE] ? `, ${board[Math.floor(index / BOARD_SIZE)][index % BOARD_SIZE]} stone` : ', empty'}${winningCells.has(`${Math.floor(index / BOARD_SIZE)}-${index % BOARD_SIZE}`) ? ', winning line' : ''}`"
              :aria-selected="selected.row === Math.floor(index / BOARD_SIZE) && selected.col === index % BOARD_SIZE"
              :disabled="cpuThinking || result.status !== 'playing' || board[Math.floor(index / BOARD_SIZE)][index % BOARD_SIZE] !== null"
              @mouseenter="selected = { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE }"
              @click="playAt({ row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE })"
            >
              <span v-if="board[Math.floor(index / BOARD_SIZE)][index % BOARD_SIZE]" class="stone" :class="`stone-${board[Math.floor(index / BOARD_SIZE)][index % BOARD_SIZE]}`"><i v-if="lastMove?.row === Math.floor(index / BOARD_SIZE) && lastMove?.col === index % BOARD_SIZE" class="last-move-mark"></i></span>
            </button>
          </div>
          <div class="coordinate coordinate-top">A<span>B</span>C<span>D</span>E<span>F</span>G<span>H</span>I<span>J</span>K<span>L</span>M</div>
          <div class="coordinate coordinate-left">01<span>02</span>03<span>04</span>05<span>06</span>07<span>08</span>09<span>10</span>11<span>12</span>13</div>
        </div>

        <div class="board-footer">
          <div class="legend"><span class="legend-stone legend-amber"></span> YOU <span class="legend-separator">·</span> <span class="legend-stone legend-cyan"></span> CPU</div>
          <button class="restart-button" type="button" @click="restartGame"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.2 7A6.5 6.5 0 1 0 16.5 10M16.2 7V3.5M16.2 7h-3.5" /></svg> New game <kbd>R</kbd></button>
        </div>
        <p class="keyboard-hint"><span>↑</span><span>↓</span><span>←</span><span>→</span> to navigate <b>·</b> <kbd>ENTER</kbd> to place</p>
      </section>

      <aside class="side-column" aria-label="Game information">
        <div class="side-card objective-card">
          <div class="side-card-icon objective-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8m0-12.8L5.6 18.4" /></svg></div>
          <span class="card-overline">THE OBJECTIVE</span>
          <h2>Five stones.<br />A single line.</h2>
          <p>Connect five stones in any direction before Ember does.</p>
        </div>
        <div class="side-card controls-card">
          <span class="card-overline">HOW TO PLAY</span>
          <div class="control-row"><span class="control-icon mouse-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a7 7 0 0 0-7 7v4a7 7 0 0 0 14 0v-4a7 7 0 0 0-7-7Zm0 0v6" /></svg></span><span>Click any intersection<br />to place a stone</span></div>
          <div class="control-row"><span class="key-cluster"><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span><span>Move around the board<br />with your keyboard</span></div>
          <div class="control-row"><span class="enter-key">ENTER</span><span>Place your stone<br />on the highlighted spot</span></div>
          <div class="control-row"><span class="restart-key">R</span><span>Start a fresh game<br />whenever you're ready</span></div>
        </div>
        <div class="aside-note"><span class="spark">✦</span><span>Take your time.<br />The best moves often do.</span></div>
      </aside>
    </main>

    <footer class="page-footer"><span>FIVE EMBER <span class="footer-dot">·</span> A GAME OF PATIENCE & PATTERN</span><span>MADE FOR THE LOVE OF THE NEXT MOVE <span class="footer-heart">♥</span></span></footer>
  </div>
</template>
