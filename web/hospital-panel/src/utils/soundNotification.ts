/**
 * Utility for playing notification sounds
 */

class SoundNotificationService {
  private audioContext: AudioContext | null = null;
  private isMuted = false;
  private volume = 0.5;

  constructor() {
    // Initialize AudioContext on first use (browser requires user interaction)
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
    }
  }

  /**
   * Play a notification sound
   */
  async playNotification() {
    if (this.isMuted || !this.audioContext) {
      return;
    }

    try {
      // Resume audio context if it's suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create a pleasant notification sound (two-tone chime)
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure first tone (higher pitch)
      oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator1.type = 'sine';

      // Configure second tone (lower pitch)
      oscillator2.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator2.type = 'sine';

      // Set volume with fade in/out
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);

      // Play the sound
      oscillator1.start(this.audioContext.currentTime);
      oscillator2.start(this.audioContext.currentTime);
      oscillator1.stop(this.audioContext.currentTime + 0.3);
      oscillator2.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * Play a simple beep sound (alternative)
   */
  async playBeep() {
    if (this.isMuted || !this.audioContext) {
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Failed to play beep sound:', error);
    }
  }

  /**
   * Set the volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get the current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Mute/unmute notifications
   */
  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Check if notifications are muted
   */
  isMutedState(): boolean {
    return this.isMuted;
  }
}

// Singleton instance
let soundServiceInstance: SoundNotificationService | null = null;

export const getSoundNotificationService = (): SoundNotificationService => {
  if (!soundServiceInstance) {
    soundServiceInstance = new SoundNotificationService();
  }
  return soundServiceInstance;
};

