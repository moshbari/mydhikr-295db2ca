// Simple sound effects using Web Audio API
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playTone = (frequency: number, duration: number, volume: number = 0.1) => {
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Silently fail if audio not available
  }
};

export const sounds = {
  // Light tap sound for button presses
  tap: () => playTone(800, 0.05, 0.08),
  
  // Success sound for completed actions
  success: () => {
    playTone(523, 0.1, 0.1); // C5
    setTimeout(() => playTone(659, 0.15, 0.1), 100); // E5
  },
  
  // Add entry sound
  add: () => {
    playTone(659, 0.08, 0.09); // E5
    setTimeout(() => playTone(784, 0.12, 0.09), 80); // G5
  },
  
  // Delete sound
  delete: () => {
    playTone(400, 0.1, 0.08);
    setTimeout(() => playTone(300, 0.15, 0.08), 100);
  },
  
  // Navigation sound
  navigate: () => playTone(600, 0.08, 0.08),
  
  // Error sound
  error: () => {
    playTone(200, 0.15, 0.1);
  },
  
  // Select sound for dropdowns/selections
  select: () => playTone(700, 0.06, 0.07),
};
