import fs from 'fs';
import Pitchfinder from 'pitchfinder';
import path from "path";
import audioDecode from 'audio-decode';

const tempData = {
  "E0": 82.41, "E1": 87.31, "E2": 92.50, "E3": 98.00, "E4": 103.83, "E5": 110.00, "E6": 116.54, "E7": 123.47, "E8": 130.81, "E9": 138.59, "E10": 146.83, "E11": 155.56, "E12": 164.81,
  "A0": 110.00, "A1": 116.54, "A2": 123.47, "A3": 130.81, "A4": 138.59, "A5": 146.83, "A6": 155.56, "A7": 164.81, "A8": 174.61, "A9": 185.00, "A10": 196.00, "A11": 207.65, "A12": 220.00,
  "D0": 146.83, "D1": 155.56, "D2": 164.81, "D3": 174.61, "D4": 185.00, "D5": 196.00, "D6": 207.65, "D7": 220.00, "D8": 233.08, "D9": 246.94, "D10": 261.63, "D11": 277.18, "D12": 293.66,
  "G0": 196.00, "G1": 207.65, "G2": 220.00, "G3": 233.08, "G4": 246.94, "G5": 261.63, "G6": 277.18, "G7": 293.66, "G8": 311.13, "G9": 329.63, "G10": 349.23, "G11": 369.99, "G12": 392.00,
  "B0": 246.94, "B1": 261.63, "B2": 277.18, "B3": 293.66, "B4": 311.13, "B5": 329.63, "B6": 349.23, "B7": 369.99, "B8": 392.00, "B9": 415.30, "B10": 440.00, "B11": 466.16, "B12": 493.88,
  "e0": 329.63, "e1": 349.23, "e2": 369.99, "e3": 392.00, "e4": 415.30, "e5": 440.00, "e6": 466.16, "e7": 493.88, "e8": 523.25, "e9": 554.37, "e10": 587.33, "e11": 622.25, "e12": 659.26
};

const tempDir = "./temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const detectPitchInChunks = (audioBuffer, chunkDuration = 0.25) => {
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerChunk = Math.floor(sampleRate * chunkDuration);
  const float32Array = audioBuffer.getChannelData(0);
  
  const pitches = [];
  const detectPitch = Pitchfinder.YIN({
    threshold: 0.28,
    probability: true
  });

  for (let start = 0; start < float32Array.length; start += samplesPerChunk) {
    const chunk = float32Array.slice(start, start + samplesPerChunk);
    
    const chunkAmplitude = Math.max(...chunk.map(Math.abs));
 
    if (chunkAmplitude > 0.01) {
      const pitchResult = detectPitch(chunk);
      
      if (pitchResult && pitchResult > 20 && pitchResult < 2000) {
        pitches.push(pitchResult);
      } else {
        pitches.push(null);
      }
    } else {
      pitches.push(null);
    }
  }

  return pitches;
};


export const generateTabs = async (req, res) => {
  const mp3Path = path.join(tempDir, "uploaded.mp3");

  try {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    fs.writeFileSync(mp3Path, req.file.buffer);

    const audioBuffer = await audioDecode(req.file.buffer);

    const pitches = detectPitchInChunks(audioBuffer);
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    // res.json({ pitches });

    const findClosestNote = (pitch) => {
      let closestNote = null;
      let minDiff = Infinity;

      for (const [note, freq] of Object.entries(tempData)) {
        const diff = Math.abs(pitch - freq);
        if (diff < minDiff) {
          minDiff = diff;
          closestNote = note;
        }
      }

      return closestNote;
    };

    const matchedNotes = pitches.map(pitch => (findClosestNote(pitch)));

    res.json({ matchedNotes });
  } catch (error) {
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    res.status(500).json({ error: error.message });
  }
};