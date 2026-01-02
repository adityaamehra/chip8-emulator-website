const FONTSET_SIZE = 80
const FONTSET_START_ADDRESS = 0x50
const START_ADDRESS = 0x200

const fontset = new Uint8Array([
  0xf0, 0x90, 0x90, 0x90, 0xf0, 0x20, 0x60, 0x20, 0x20, 0x70, 0xf0, 0x10, 0xf0, 0x80, 0xf0, 0xf0, 0x10, 0xf0, 0x10,
  0xf0, 0x90, 0x90, 0xf0, 0x10, 0x10, 0xf0, 0x80, 0xf0, 0x10, 0xf0, 0xf0, 0x80, 0xf0, 0x90, 0xf0, 0xf0, 0x10, 0x20,
  0x40, 0x40, 0xf0, 0x90, 0xf0, 0x90, 0xf0, 0xf0, 0x90, 0xf0, 0x10, 0xf0, 0xf0, 0x90, 0xf0, 0x90, 0x90, 0xe0, 0x90,
  0xe0, 0x90, 0xe0, 0xf0, 0x80, 0x80, 0x80, 0xf0, 0xe0, 0x90, 0x90, 0x90, 0xe0, 0xf0, 0x80, 0xf0, 0x80, 0xf0, 0xf0,
  0x80, 0xf0, 0x80, 0x80,
])

export class Chip8 {
  gpr = new Uint8Array(16)
  memory = new Uint8Array(4096)
  ir = 0
  pc = 0
  stack = new Uint16Array(16)
  sp = 0
  delayTimer = 0
  soundTimer = 0
  keypad = new Uint8Array(16)
  display = new Uint32Array(64 * 32)
  opcode = 0

  private table: Array<() => void> = []
  private table0: Array<() => void> = []
  private table8: Array<() => void> = []
  private tableE: Array<() => void> = []
  private tableF: Array<() => void> = []

  constructor() {
    this.pc = START_ADDRESS
    this.loadFontset()
    this.initializeTables()
  }

  private initializeTables() {
    this.table = Array(16).fill(() => {})
    this.table0 = Array(16).fill(() => {})
    this.table8 = Array(16).fill(() => {})
    this.tableE = Array(16).fill(() => {})
    this.tableF = Array(256).fill(() => {})

    this.table[0x0] = () => this.table0[this.opcode & 0x000f]()
    this.table[0x1] = () => this.OP_1NNN()
    this.table[0x2] = () => this.OP_2NNN()
    this.table[0x3] = () => this.OP_3XNN()
    this.table[0x4] = () => this.OP_4XNN()
    this.table[0x5] = () => this.OP_5XY0()
    this.table[0x6] = () => this.OP_6XNN()
    this.table[0x7] = () => this.OP_7XNN()
    this.table[0x8] = () => this.table8[this.opcode & 0x000f]()
    this.table[0x9] = () => this.OP_9XY0()
    this.table[0xa] = () => this.OP_ANNN()
    this.table[0xb] = () => this.OP_BNNN()
    this.table[0xc] = () => this.OP_CXNN()
    this.table[0xd] = () => this.OP_DXYN()
    this.table[0xe] = () => this.tableE[this.opcode & 0x000f]()
    this.table[0xf] = () => this.tableF[this.opcode & 0x00ff]()

    this.table0[0x0] = () => this.OP_00E0()
    this.table0[0xe] = () => this.OP_00EE()

    this.table8[0x0] = () => this.OP_8XY0()
    this.table8[0x1] = () => this.OP_8XY1()
    this.table8[0x2] = () => this.OP_8XY2()
    this.table8[0x3] = () => this.OP_8XY3()
    this.table8[0x4] = () => this.OP_8XY4()
    this.table8[0x5] = () => this.OP_8XY5()
    this.table8[0x6] = () => this.OP_8XY6()
    this.table8[0x7] = () => this.OP_8XY7()
    this.table8[0xe] = () => this.OP_8XYE()

    this.tableE[0xe] = () => this.OP_EX9E()
    this.tableE[0x1] = () => this.OP_EXA1()

    this.tableF[0x07] = () => this.OP_FX07()
    this.tableF[0x0a] = () => this.OP_FX0A()
    this.tableF[0x15] = () => this.OP_FX15()
    this.tableF[0x18] = () => this.OP_FX18()
    this.tableF[0x1e] = () => this.OP_FX1E()
    this.tableF[0x29] = () => this.OP_FX29()
    this.tableF[0x33] = () => this.OP_FX33()
    this.tableF[0x55] = () => this.OP_FX55()
    this.tableF[0x65] = () => this.OP_FX65()
  }

  cycle() {
    this.opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1]
    this.pc += 2
    this.table[(this.opcode & 0xf000) >> 12]()

    if (this.delayTimer > 0) this.delayTimer--
    if (this.soundTimer > 0) this.soundTimer--
  }

  loadFontset() {
    for (let i = 0; i < FONTSET_SIZE; i++) {
      this.memory[FONTSET_START_ADDRESS + i] = fontset[i]
    }
  }

  loadROM(buffer: Uint8Array) {
    for (let i = 0; i < buffer.length; i++) {
      this.memory[START_ADDRESS + i] = buffer[i]
    }
  }

  private OP_00E0() {
    this.display.fill(0)
  }

  private OP_00EE() {
    this.sp--
    this.pc = this.stack[this.sp]
  }

  private OP_1NNN() {
    this.pc = this.opcode & 0x0fff
  }

  private OP_2NNN() {
    this.stack[this.sp++] = this.pc
    this.pc = this.opcode & 0x0fff
  }

  private OP_3XNN() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const nn = this.opcode & 0x00ff
    if (this.gpr[Vx] === nn) this.pc += 2
  }

  private OP_4XNN() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const nn = this.opcode & 0x00ff
    if (this.gpr[Vx] !== nn) this.pc += 2
  }

  private OP_5XY0() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    if (this.gpr[Vx] === this.gpr[Vy]) this.pc += 2
  }

  private OP_6XNN() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const nn = this.opcode & 0x00ff
    this.gpr[Vx] = nn
  }

  private OP_7XNN() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const nn = this.opcode & 0x00ff
    this.gpr[Vx] = (this.gpr[Vx] + nn) & 0xff
  }

  private OP_8XY0() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    this.gpr[Vx] = this.gpr[Vy]
  }

  private OP_8XY1() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    this.gpr[Vx] |= this.gpr[Vy]
  }

  private OP_8XY2() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    this.gpr[Vx] &= this.gpr[Vy]
  }

  private OP_8XY3() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    this.gpr[Vx] ^= this.gpr[Vy]
  }

  private OP_8XY4() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    const sum = this.gpr[Vx] + this.gpr[Vy]
    this.gpr[Vx] = sum & 0xff
    this.gpr[0xf] = sum > 0xff ? 1 : 0
  }

  private OP_8XY5() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    this.gpr[0xf] = this.gpr[Vx] > this.gpr[Vy] ? 1 : 0
    this.gpr[Vx] = (this.gpr[Vx] - this.gpr[Vy]) & 0xff
  }

  private OP_8XY6() {
    const Vx = (this.opcode & 0x0f00) >> 8
    this.gpr[0xf] = this.gpr[Vx] & 0x1
    this.gpr[Vx] >>= 1
  }

  private OP_8XY7() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    this.gpr[0xf] = this.gpr[Vy] > this.gpr[Vx] ? 1 : 0
    this.gpr[Vx] = (this.gpr[Vy] - this.gpr[Vx]) & 0xff
  }

  private OP_8XYE() {
    const Vx = (this.opcode & 0x0f00) >> 8
    this.gpr[0xf] = (this.gpr[Vx] & 0x80) >> 7
    this.gpr[Vx] = (this.gpr[Vx] << 1) & 0xff
  }

  private OP_9XY0() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    if (this.gpr[Vx] !== this.gpr[Vy]) this.pc += 2
  }

  private OP_ANNN() {
    this.ir = this.opcode & 0x0fff
  }

  private OP_BNNN() {
    this.pc = (this.opcode & 0x0fff) + this.gpr[0]
  }

  private OP_CXNN() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const nn = this.opcode & 0x00ff
    this.gpr[Vx] = Math.floor(Math.random() * 256) & nn
  }

  private OP_DXYN() {
    const Vx = (this.opcode & 0x0f00) >> 8
    const Vy = (this.opcode & 0x00f0) >> 4
    const n = this.opcode & 0x000f

    const x = this.gpr[Vx] % 64
    const y = this.gpr[Vy] % 32

    this.gpr[0xf] = 0

    for (let r = 0; r < n; r++) {
      const spriteByte = this.memory[this.ir + r]
      for (let c = 0; c < 8; c++) {
        const spriteBit = spriteByte & (0x80 >> c) ? 1 : 0

        let rx = x + c
        let ry = y + r

        if (rx >= 64) rx -= 64
        if (ry >= 32) ry -= 32

        const screenPixelIndex = ry * 64 + rx
        const screenPixel = this.display[screenPixelIndex]

        if (spriteBit) {
          if (screenPixel === 0xffffffff) {
            this.gpr[0xf] = 1
          }
          this.display[screenPixelIndex] ^= 0xffffffff
        }
      }
    }
  }

  private OP_EX9E() {
    const Vx = (this.opcode & 0x0f00) >> 8
    if (this.keypad[this.gpr[Vx]]) this.pc += 2
  }

  private OP_EXA1() {
    const Vx = (this.opcode & 0x0f00) >> 8
    if (!this.keypad[this.gpr[Vx]]) this.pc += 2
  }

  private OP_FX07() {
    const Vx = (this.opcode & 0x0f00) >> 8
    this.gpr[Vx] = this.delayTimer
  }

  private OP_FX0A() {
    const Vx = (this.opcode & 0x0f00) >> 8
    for (let i = 0; i < 16; i++) {
      if (this.keypad[i]) {
        this.gpr[Vx] = i
        return
      }
    }
    this.pc -= 2
  }

  private OP_FX15() {
    const Vx = (this.opcode & 0x0f00) >> 8
    this.delayTimer = this.gpr[Vx]
  }

  private OP_FX18() {
    const Vx = (this.opcode & 0x0f00) >> 8
    this.soundTimer = this.gpr[Vx]
  }

  private OP_FX1E() {
    const Vx = (this.opcode & 0x0f00) >> 8
    this.ir += this.gpr[Vx]
  }

  private OP_FX29() {
    const Vx = (this.opcode & 0x0f00) >> 8
    this.ir = FONTSET_START_ADDRESS + 5 * this.gpr[Vx]
  }

  private OP_FX33() {
    const Vx = (this.opcode & 0x0f00) >> 8
    let value = this.gpr[Vx]
    this.memory[this.ir + 2] = value % 10
    value = Math.floor(value / 10)
    this.memory[this.ir + 1] = value % 10
    value = Math.floor(value / 10)
    this.memory[this.ir] = value % 10
  }

  private OP_FX55() {
    const Vx = (this.opcode & 0x0f00) >> 8
    for (let i = 0; i <= Vx; i++) {
      this.memory[this.ir + i] = this.gpr[i]
    }
  }

  private OP_FX65() {
    const Vx = (this.opcode & 0x0f00) >> 8
    for (let i = 0; i <= Vx; i++) {
      this.gpr[i] = this.memory[this.ir + i]
    }
  }
}
