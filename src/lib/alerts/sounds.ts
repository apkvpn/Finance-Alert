export interface SoundOption {
  id: string;
  name: string;
  category: "builtin" | "custom";
  description: string;
}

export const BUILTIN_SOUNDS: SoundOption[] = [
  { id: "classic_bell", name: "Classic Bell", category: "builtin", description: "Clear resonant bell chime" },
  { id: "digital_pulse", name: "Digital Pulse", category: "builtin", description: "Fast electronic terminal pulse" },
  { id: "soft_chime", name: "Soft Chime", category: "builtin", description: "Warm harmonic chord" },
  { id: "double_beep", name: "Double Beep", category: "builtin", description: "High dual ping" },
  { id: "market_alert", name: "Market Alert", category: "builtin", description: "Trading floor triad horn" },
  { id: "radar", name: "Radar", category: "builtin", description: "Deep sonar ping" },
  { id: "sharp_tone", name: "Sharp Tone", category: "builtin", description: "Urgent staccato signal" },
  { id: "notification", name: "Notification", category: "builtin", description: "Gentle two-tone chime" },
  { id: "rising_tone", name: "Rising Tone", category: "builtin", description: "Ascending frequency synth" },
  { id: "trading_bell", name: "Trading Bell", category: "builtin", description: "Ringing exchange bell" },
];

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export async function playAlertSound(
  soundId: string,
  volume: number = 0.8,
  customAudioDataUrl?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  // Custom audio URL playback if provided
  if (customAudioDataUrl || soundId.startsWith("custom_")) {
    const audioUrl = customAudioDataUrl;
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.volume = Math.min(Math.max(volume, 0), 1);
        await audio.play();
        return;
      } catch (e) {
        console.warn("Failed to play custom sound, falling back to default bell", e);
      }
    }
  }

  // Built-in Web Audio API Synthesis
  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    const clampedVol = Math.min(Math.max(volume, 0), 1);
    masterGain.gain.setValueAtTime(clampedVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (soundId) {
      case "classic_bell": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.2);
        break;
      }

      case "digital_pulse": {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + i * 0.12;
          osc.type = "square";
          osc.frequency.setValueAtTime(1200 + i * 200, startTime);

          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + 0.08);
        }
        break;
      }

      case "soft_chime": {
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.08;
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, t);

          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 1.5);
        });
        break;
      }

      case "double_beep": {
        [0, 0.15].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + delay;
          osc.type = "sine";
          osc.frequency.setValueAtTime(1760, t); // A6

          gain.gain.setValueAtTime(0.5, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.08);
        });
        break;
      }

      case "market_alert": {
        const triad = [440, 554.37, 659.25, 880];
        triad.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.1;
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, t);

          gain.gain.setValueAtTime(0.5, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.3);
        });
        break;
      }

      case "radar": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.8);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      }

      case "sharp_tone": {
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.14;
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(1400, t);

          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.1);
        }
        break;
      }

      case "notification": {
        [659.25, 987.77].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.12;
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, t);

          gain.gain.setValueAtTime(0.5, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.6);
        });
        break;
      }

      case "rising_tone": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.5);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case "trading_bell": {
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.15;
          osc.type = "sine";
          osc.frequency.setValueAtTime(1046.5, t); // C6

          gain.gain.setValueAtTime(0.6, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.4);
        }
        break;
      }

      default: {
        // Fallback default chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    }
  } catch (e) {
    console.error("Audio synthesis error:", e);
  }
}

// Custom sound file validator
export function validateCustomAudioFile(file: File): { valid: boolean; error?: string } {
  const allowedMimeTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/aac",
    "audio/m4a",
  ];

  if (!allowedMimeTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    return {
      valid: false,
      error: "Invalid audio format. Please upload MP3, WAV, OGG, or AAC file.",
    };
  }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: "Audio file too large. Maximum allowed size is 5MB.",
    };
  }

  return { valid: true };
}
