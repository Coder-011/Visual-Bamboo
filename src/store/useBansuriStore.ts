import { create } from 'zustand';

export type HoleState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';
export type Swara = 'Sa' | 'Re' | 'Ga' | 'Ma' | 'Pa' | 'Dha' | 'Ni' | null;

interface BansuriState {
  isPlaying: boolean;
  currentSwara: Swara;
  holeStates: HoleState[];
  isGestureActive: boolean;
  webcamReady: boolean;
  audioReady: boolean;
  detectionLatency: number;
  setPlaying: (playing: boolean) => void;
  setCurrentSwara: (swara: Swara) => void;
  setHoleStates: (states: HoleState[]) => void;
  setGestureActive: (active: boolean) => void;
  setWebcamReady: (ready: boolean) => void;
  setAudioReady: (ready: boolean) => void;
  setDetectionLatency: (latency: number) => void;
}

export const useBansuriStore = create<BansuriState>((set) => ({
  isPlaying: false,
  currentSwara: null,
  holeStates: ['OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'],
  isGestureActive: false,
  webcamReady: false,
  audioReady: false,
  detectionLatency: 0,
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentSwara: (swara) => set({ currentSwara: swara }),
  setHoleStates: (states) => set({ holeStates: states }),
  setGestureActive: (active) => set({ isGestureActive: active }),
  setWebcamReady: (ready) => set({ webcamReady: ready }),
  setAudioReady: (ready) => set({ audioReady: ready }),
  setDetectionLatency: (latency) => set({ detectionLatency: latency }),
}));