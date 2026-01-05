"use client"

import type React from "react"

import { useRef, useState } from "react"
import Chip8Emulator from "@/components/chip8-emulator"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [romLoaded, setRomLoaded] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [romName, setRomName] = useState("")
  const emulatorRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const romDataRef = useRef<ArrayBuffer | null>(null)

const PRELOADED_ROMS = [
  "15PUZZLE",
  "BLINKY",
  "BRIX",
  "CONNECT4",
  "GUESS",
  "MAZE",
  "MISSILE",
  "PONG",
  "PONG2",
  "SYZYGY",
  "TANK",
  "TICTAC",
  "VBRIX",
  "VERS",
  "WIPEOFF",
]
    const loadPreloadedROM = async (rom: string) => {
  const res = await fetch(`/ROM/${rom}`)
  const arrayBuffer = await res.arrayBuffer()

  romDataRef.current = arrayBuffer

  emulatorRef.current.reset()
  emulatorRef.current.loadROM(arrayBuffer)

  setRomLoaded(true)
  setRomName(rom)
  setIsRunning(false)
}


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      romDataRef.current = arrayBuffer
      if (emulatorRef.current) {
        emulatorRef.current.loadROM(arrayBuffer)
        setRomLoaded(true)
        setRomName(file.name)
        setIsRunning(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const toggleRunning = () => {
    if (emulatorRef.current) {
      if (isRunning) {
        emulatorRef.current.stop()
      } else {
        emulatorRef.current.start()
      }
      setIsRunning(!isRunning)
    }
  }

  const resetEmulator = () => {
    if (emulatorRef.current && romDataRef.current) {
      emulatorRef.current.reset()
      emulatorRef.current.loadROM(romDataRef.current)
      setIsRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-black p-4 flex flex-col">
      <div className="max-w-6xl mx-auto flex-1">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Emulator Display */}
          <div className="lg:col-span-2">
            <Card className="bg-black border-2 border-green-500 overflow-hidden">
              <div className="p-6">
                <div className="bg-black rounded-lg p-4 border-4 border-green-500 shadow-2xl">
                  <Chip8Emulator ref={emulatorRef} />
                </div>
              </div>
            </Card>
            {/* Preloaded ROMs */}
            <Card className="bg-black border-2 border-green-500 p-4 padding-top-6 mt-4">
              <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-widest">
                Preloaded ROMs
              </h2>

              <select
                defaultValue=""
                className="w-full bg-black border-2 border-green-500 rounded-lg text-green-400 p-2 font-mono text-sm"
                onChange={(e) => {
                  if (e.target.value) loadPreloadedROM(e.target.value)
                }}
              >
                <option value="" disabled>
                  Select ROM
                </option>

                {PRELOADED_ROMS.map((rom) => (
                  <option key={rom} value={rom}>
                    {rom}
                  </option>
                ))}
              </select>
            </Card>

          </div>
          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* ROM Upload */}
            <Card className="bg-black border-2 border-green-500 p-4">
              <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-widest">ROM Upload</h2>
              <input ref={fileInputRef} type="file" accept=".ch8" onChange={handleFileUpload} className="hidden" />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-black border-2 border-green-500 text-green-500 font-bold py-2 mb-2 transition-colors duration-200 hover:bg-green-500 hover:text-black"
              >
                Upload ROM
              </Button>
              {romLoaded && <p className="text-white text-sm truncate mt-2">Loaded: {romName}</p>}
            </Card>

            {/* Playback Controls */}
            <Card className="bg-black border-2 border-green-500 p-4">
              <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-widest">Controls</h2>
              <div className="space-y-2">
                <Button
                  onClick={toggleRunning}
                  disabled={!romLoaded}
                  className="w-full bg-black border-2 border-white text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2 transition-colors duration-200 hover:bg-white hover:text-black"
                >
                  {isRunning ? (
                    <>
                      <span className="mr-2">⏸</span>
                      Pause
                    </>
                  ) : (
                    <>
                      <span className="mr-2">▶</span>
                      Play
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetEmulator}
                  disabled={!romLoaded}
                  className="w-full bg-black border-2 border-white text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2 transition-colors duration-200 hover:bg-white hover:text-black"
                >
                  <span className="mr-2">↻</span>
                  Reset
                </Button>
              </div>
            </Card>

            {/* Keyboard Map */}
            <Card className="bg-black border-2 border-green-500 p-4">
            <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-widest">
              Keyboard Map
            </h2>

            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              {[
                [["1", "1"], ["2", "2"], ["3", "3"], ["4", "C"]],
                [["Q", "4"], ["W", "5"], ["E", "6"], ["R", "D"]],
                [["A", "7"], ["S", "8"], ["D", "9"], ["F", "E"]],
                [["Z", "A"], ["X", "0"], ["C", "B"], ["V", "F"]],
              ].map((row, i) => (
                <div key={i} className="contents">
                  {row.map(([kbd, chip8]) => (
                    <div
                      key={kbd}
                      className="bg-gray-900 border border-green-500 rounded p-2 text-center text-green-400"
                    >
                      <div className="text-white/70 text-sm">{kbd}</div>
                      <div className="text-green-400 font-bold text-sm">{chip8}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <p className="text-white/60 text-xs mt-3 leading-relaxed">
              Top: physical keyboard key · Bottom: CHIP-8 hex key
            </p>
          </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
