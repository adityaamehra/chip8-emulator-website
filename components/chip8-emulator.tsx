"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Chip8 } from "@/lib/chip8"

const Chip8Emulator = forwardRef((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const emulatorRef = useRef<Chip8 | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isRunningRef = useRef(false)
  const keypadRef = useRef<Record<number, boolean>>({})

  const render = () => {
    if (!emulatorRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw pixels
    ctx.fillStyle = "#00FF00"
    const WIDTH = 64
    const HEIGHT = 32
    const PIXEL_SIZE = 10
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
      if (emulatorRef.current.display[i]) {
        const x = (i % WIDTH) * PIXEL_SIZE
        const y = Math.floor(i / WIDTH) * PIXEL_SIZE
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE)
      }
    }
  }

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    loadROM: (arrayBuffer: ArrayBuffer) => {
      if (emulatorRef.current) {
        emulatorRef.current.loadROM(new Uint8Array(arrayBuffer))
        render()
      }
    },
    start: () => {
      isRunningRef.current = true
    },
    stop: () => {
      isRunningRef.current = false
    },
    reset: () => {
      if (emulatorRef.current) {
        emulatorRef.current = new Chip8()
        isRunningRef.current = false
        render()
      }
    },
  }))

  useEffect(() => {
    if (!canvasRef.current) return

    emulatorRef.current = new Chip8()
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const WIDTH = 64
    const HEIGHT = 32
    const PIXEL_SIZE = 10

    canvas.width = WIDTH * PIXEL_SIZE
    canvas.height = HEIGHT * PIXEL_SIZE

    // Keyboard mapping
    const keyMap: Record<string, number> = {
      "1": 0x1,
      "2": 0x2,
      "3": 0x3,
      "4": 0xc,
      q: 0x4,
      w: 0x5,
      e: 0x6,
      r: 0xd,
      a: 0x7,
      s: 0x8,
      d: 0x9,
      f: 0xe,
      z: 0xa,
      x: 0x0,
      c: 0xb,
      v: 0xf,
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keyMap) {
        keypadRef.current[keyMap[key]] = true
        if (emulatorRef.current) {
          emulatorRef.current.keypad[keyMap[key]] = 1
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keyMap) {
        keypadRef.current[keyMap[key]] = false
        if (emulatorRef.current) {
          emulatorRef.current.keypad[keyMap[key]] = 0
        }
      }
    }

    const gameLoop = () => {
      if (isRunningRef.current && emulatorRef.current) {
        // Run multiple cycles per frame for better speed
        for (let i = 0; i < 10; i++) {
          emulatorRef.current.cycle()
        }
        render()
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-auto bg-black rounded" style={{ imageRendering: "pixelated" }} />
})

Chip8Emulator.displayName = "Chip8Emulator"

export default Chip8Emulator
