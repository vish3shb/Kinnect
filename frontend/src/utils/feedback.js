let audioCtx = null;

const initAudio = () => {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
};

// Resume audio context if suspended (needed for some browsers)
const resumeAudio = () => {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playPop = () => {
  try {
    initAudio();
    resumeAudio();
    if (!audioCtx) return;
    
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    
    o.type = 'sine';
    o.frequency.setValueAtTime(400, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
    
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    o.connect(g);
    g.connect(audioCtx.destination);
    
    o.start();
    o.stop(audioCtx.currentTime + 0.05);
    
    if (navigator.vibrate) navigator.vibrate(15);
  } catch(e) {}
};

export const playTick = () => {
  try {
    initAudio();
    resumeAudio();
    if (!audioCtx) return;
    
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    
    o.type = 'sine';
    o.frequency.setValueAtTime(1200, audioCtx.currentTime);
    
    g.gain.setValueAtTime(0.05, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);
    
    o.connect(g);
    g.connect(audioCtx.destination);
    
    o.start();
    o.stop(audioCtx.currentTime + 0.03);
    
    if (navigator.vibrate) navigator.vibrate(5);
  } catch(e) {}
};

export const playSuccess = () => {
  try {
    initAudio();
    resumeAudio();
    if (!audioCtx) return;
    
    // First tone
    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(600, audioCtx.currentTime);
    g1.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    o1.connect(g1);
    g1.connect(audioCtx.destination);
    o1.start();
    o1.stop(audioCtx.currentTime + 0.1);

    // Second tone (slightly delayed and higher pitch)
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
    g2.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    o2.connect(g2);
    g2.connect(audioCtx.destination);
    o2.start(audioCtx.currentTime + 0.1);
    o2.stop(audioCtx.currentTime + 0.25);
    
    if (navigator.vibrate) navigator.vibrate([10, 50, 15]);
  } catch(e) {}
};
