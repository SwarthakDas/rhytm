"use client";

import { useState, useRef } from "react";
import * as Tone from "tone";

const notes = [
  { note: "E", frequency: 82.41 },
  { note: "A", frequency: 110.00 },
  { note: "D", frequency: 146.83 },
  { note: "G", frequency: 196.00 },
  { note: "B", frequency: 246.94 },
  { note: "e", frequency: 329.63 },
];

export default function GuitarTuner() {
  const [isListening, setIsListening] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [closestNote, setClosestNote] = useState<string | null>(null);
  
  const micRef = useRef<Tone.UserMedia | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationRef = useRef<number | null>(null);

  const startTuning = async () => {
    await Tone.start();

    micRef.current = new Tone.UserMedia();
    analyserRef.current = new Tone.Analyser("fft", 1024);

    await micRef.current.open();
    micRef.current.connect(analyserRef.current);
    setIsListening(true);

    const updatePitch = () => {
      if (!analyserRef.current) return;
      const fftValues = analyserRef.current.getValue() as Float32Array;

      let maxVal = -Infinity;
      let maxIndex = -1;

      for (let i = 0; i < fftValues.length; i++) {
        if (fftValues[i] > maxVal) {
          maxVal = fftValues[i];
          maxIndex = i;
        }
      }

      if (maxIndex > 0) {
        const frequency = (maxIndex * Tone.context.sampleRate) / analyserRef.current.size;
        setCurrentFrequency(frequency);
        setClosestNote(findClosestNote(frequency));
      }

      animationRef.current = requestAnimationFrame(updatePitch);
    };

    updatePitch();
  };

  const stopTuning = () => {
    // Cancel the animation frame to stop the loop
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Close the microphone
    if (micRef.current) {
      micRef.current.close();
      micRef.current = null;
    }
    
    setIsListening(false);
    setCurrentFrequency(null);
    setClosestNote(null);
  };

  const findClosestNote = (freq: number) => {
    return notes.reduce((prev, curr) =>
      Math.abs(curr.frequency - freq) < Math.abs(prev.frequency - freq) ? curr : prev
    ).note;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Guitar Tuner</h1>
      <button
        className="px-4 py-2 bg-blue-500 rounded-md text-white hover:bg-blue-600"
        onClick={isListening ? stopTuning : startTuning}
      >
        {isListening ? "Stop Tuning" : "Start Tuning"}
      </button>
      {currentFrequency && (
        <div className="mt-6 text-center">
          <p className="text-lg">Current Frequency: {currentFrequency.toFixed(2)} Hz</p>
          <p className="text-2xl font-semibold">Closest Note: {closestNote}</p>
        </div>
      )}
    </div>
  );
}