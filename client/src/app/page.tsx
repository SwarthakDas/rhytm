"use client"
import { useState, useRef, useEffect } from "react"
import * as Tone from "tone"

const guitarStrings = [
  { note: "E", frequency: 82.41, string: "6th (lowest)" },
  { note: "A", frequency: 110.0, string: "5th" },
  { note: "D", frequency: 146.83, string: "4th" },
  { note: "G", frequency: 196.0, string: "3rd" },
  { note: "B", frequency: 246.94, string: "2nd" },
  { note: "e", frequency: 329.63, string: "1st (highest)" },
]

export default function GuitarTuner() {
  const [isListening, setIsListening] = useState(false)
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null)
  const [selectedString, setSelectedString] = useState<number>(0)
  const [tuningStatus, setTuningStatus] = useState<"flat" | "sharp" | "in-tune" | null>(null)
  const [tuningDifference, setTuningDifference] = useState<number>(0)

  const micRef = useRef<Tone.UserMedia | null>(null)
  const analyserRef = useRef<Tone.Analyser | null>(null)
  const animationRef = useRef<number | null>(null)

  const startTuning = async () => {
    try {
      await Tone.start()

      micRef.current = new Tone.UserMedia()
      analyserRef.current = new Tone.Analyser("fft", 2048)

      await micRef.current.open()
      micRef.current.connect(analyserRef.current)
      setIsListening(true)

      const updatePitch = () => {
        if (!analyserRef.current) return
        const fftValues = analyserRef.current.getValue() as Float32Array

        let maxVal = Number.NEGATIVE_INFINITY
        let maxIndex = -1

        // Find the peak in the FFT data
        for (let i = 0; i < fftValues.length; i++) {
          if (fftValues[i] > maxVal) {
            maxVal = fftValues[i]
            maxIndex = i
          }
        }

        if (maxIndex > 0) {
          const frequency = (maxIndex * Tone.context.sampleRate) / (analyserRef.current.size * 2)
          if (frequency > 70 && frequency < 1000) {
            setCurrentFrequency(frequency)
            const targetFreq = guitarStrings[selectedString].frequency
            const cents = 1200 * Math.log2(frequency / targetFreq)
            setTuningDifference(cents)
            if (Math.abs(cents) < 5) {
              setTuningStatus("in-tune")
            } else if (cents < 0) {
              setTuningStatus("flat")
            } else {
              setTuningStatus("sharp")
            }
          }
        }

        animationRef.current = requestAnimationFrame(updatePitch)
      }

      updatePitch()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Could not access microphone. Please check your permissions.")
      stopTuning()
    }
  }

  const stopTuning = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (micRef.current) {
      micRef.current.close()
      micRef.current = null
    }

    setIsListening(false)
    setCurrentFrequency(null)
    setTuningStatus(null)
  }

  useEffect(() => {
    return () => {
      stopTuning()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Guitar Tuner</h1>
      <div className="w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Select String</h2>
        <div className="grid grid-cols-6 gap-1">
          {guitarStrings.map((string, index) => (
            <button
              key={string.note}
              onClick={() => setSelectedString(index)}
              className={`py-3 px-1 rounded-md text-center transition-all ${
                selectedString === index ? "bg-blue-600 shadow-lg scale-105" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <div className="text-xl font-bold">{string.note}</div>
              <div className="text-xs mt-1">{string.string}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-md mb-8 bg-gray-800 rounded-lg p-4 text-center">
        <h2 className="text-2xl font-bold">
          {guitarStrings[selectedString].note} String
          <span className="text-sm ml-2 text-gray-400">({guitarStrings[selectedString].frequency.toFixed(2)} Hz)</span>
        </h2>
      </div>

      <div className="w-full max-w-md mb-8">
        <div className="relative h-20 bg-gray-800 rounded-lg overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="w-full h-1 bg-gray-700 flex">
              <div className="w-1/3 h-full bg-red-500"></div>
              <div className="w-1/3 h-full bg-green-500"></div>
              <div className="w-1/3 h-full bg-red-500"></div>
            </div>
            <div className="absolute h-12 w-0.5 bg-white"></div>
          </div>

          {tuningStatus && (
            <div
              className={`absolute top-0 left-1/2 h-full w-2 bg-white -ml-1 transition-transform duration-150 ease-out ${
                tuningStatus === "in-tune" ? "bg-green-500" : "bg-yellow-500"
              }`}
              style={{
                transform: `translateX(${tuningDifference * 2}px)`,
              }}
            ></div>
          )}

          <div className="absolute bottom-2 left-0 w-full flex justify-between px-4 text-xs">
            <span>♭ Flat</span>
            <span>In Tune</span>
            <span>Sharp ♯</span>
          </div>
        </div>
      </div>

      {currentFrequency && (
        <div className="w-full max-w-md mb-8 bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-lg">
            Detected: <span className="font-mono">{currentFrequency.toFixed(2)} Hz</span>
          </p>
          <p className="text-lg mt-2">
            {tuningStatus === "flat" && "Too low - tighten string ↑"}
            {tuningStatus === "sharp" && "Too high - loosen string ↓"}
            {tuningStatus === "in-tune" && "Perfect! 👍"}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${
            isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={isListening ? stopTuning : startTuning}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm max-w-md">
        <p>Select a string, then click Start Listening and play the string on your guitar.</p>
        <p className="mt-2">Adjust your tuning until the needle is centered and turns green.</p>
        <p className="mt-2">You can also play a reference tone to tune by ear.</p>
      </div>
    </div>
  )
}

