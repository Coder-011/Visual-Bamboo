import * as Tone from 'tone';
import { SWARA_FREQUENCIES } from './audioMapping';

class AudioEngine {
  private synth: Tone.Synth | null = null;
  private reverb: Tone.Reverb | null = null;
  private currentSwara: string | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    await Tone.start();

    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
    
    this.synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.6,
        release: 0.8,
      },
    }).connect(this.reverb);

    this.isInitialized = true;
  }

  playSwara(swara: string | null) {
    if (!this.synth || !this.isInitialized) return;

    if (swara === this.currentSwara) return;

    const frequency = SWARA_FREQUENCIES[swara as keyof typeof SWARA_FREQUENCIES];
    if (!frequency || frequency === 0) {
      this.synth.triggerRelease();
      this.currentSwara = null;
      return;
    }

    try {
      this.synth.triggerRelease();
      this.synth.triggerAttack(frequency);
      this.currentSwara = swara;
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.triggerRelease();
      this.currentSwara = null;
    }
  }

  dispose() {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }
    this.isInitialized = false;
  }
}

export const audioEngine = new AudioEngine();