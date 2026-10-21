/**
 * SOUND MANAGER (Hệ Thống Quản Lý Âm Thanh)
 * Web Audio API Synthesizer:
 * - Nhạc nền không gian kỳ ảo (Ethereal Cosmic Ambient Music generator)
 * - Hiệu ứng âm thanh tương tác: Đúng, Sai, Nhận Thưởng, Bước chân, Nút bấm, Đăng quang
 * - Tuân thủ chính sách trình duyệt: Chỉ phát khi người dùng đã tương tác
 * - Tùy chọn độc lập: Bật/Tắt Nhạc Nền (BGM), Bật/Tắt Hiệu Ứng (SFX), Âm lượng BGM, Âm lượng SFX
 */

interface SoundSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
}

const STORAGE_KEY = 'vuong_quoc_so_huu_ti_audio_settings';

class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmMasterGain: GainNode | null = null;
  private sfxMasterGain: GainNode | null = null;

  private isBgmPlaying = false;
  private bgmTimer: number | null = null;
  private bgmStepIndex = 0;

  private settings: SoundSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
    bgmVolume: 0.35,
    sfxVolume: 0.8,
  };

  private listeners: Array<(settings: SoundSettings) => void> = [];

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      // Ignore localStorage errors
    }
    this.listeners.forEach((cb) => cb(this.settings));
  }

  public subscribe(cb: (settings: SoundSettings) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Initializes AudioContext safely upon user interaction
   */
  public initAudioContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Initialize Master Gain Nodes if not present
      if (this.ctx && !this.bgmMasterGain) {
        this.bgmMasterGain = this.ctx.createGain();
        this.bgmMasterGain.gain.setValueAtTime(
          this.settings.bgmEnabled ? this.settings.bgmVolume : 0,
          this.ctx.currentTime
        );
        this.bgmMasterGain.connect(this.ctx.destination);
      }

      if (this.ctx && !this.sfxMasterGain) {
        this.sfxMasterGain = this.ctx.createGain();
        this.sfxMasterGain.gain.setValueAtTime(
          this.settings.sfxEnabled ? this.settings.sfxVolume : 0,
          this.ctx.currentTime
        );
        this.sfxMasterGain.connect(this.ctx.destination);
      }

      return this.ctx;
    } catch (e) {
      return null;
    }
  }

  // ==========================================
  // BGM: Nhạc Nền Không Gian Kỳ Ảo (Cosmic Ambient)
  // ==========================================

  public startBGM() {
    const ctx = this.initAudioContext();
    if (!ctx) return;
    if (this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    this.scheduleNextCosmicChord();

    // Loop ethereal cosmic chords every 6 seconds
    this.bgmTimer = window.setInterval(() => {
      if (this.isBgmPlaying && this.settings.bgmEnabled) {
        this.scheduleNextCosmicChord();
      }
    }, 6000);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public toggleBGM(): boolean {
    this.initAudioContext();
    this.settings.bgmEnabled = !this.settings.bgmEnabled;
    if (this.bgmMasterGain && this.ctx) {
      this.bgmMasterGain.gain.setTargetAtTime(
        this.settings.bgmEnabled ? this.settings.bgmVolume : 0,
        this.ctx.currentTime,
        0.1
      );
    }
    if (this.settings.bgmEnabled && !this.isBgmPlaying) {
      this.startBGM();
    }
    this.saveSettings();
    return this.settings.bgmEnabled;
  }

  public setBGMVolume(volume: number) {
    this.initAudioContext();
    this.settings.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmMasterGain && this.ctx && this.settings.bgmEnabled) {
      this.bgmMasterGain.gain.setTargetAtTime(this.settings.bgmVolume, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  public toggleSFX(): boolean {
    this.initAudioContext();
    this.settings.sfxEnabled = !this.settings.sfxEnabled;
    if (this.sfxMasterGain && this.ctx) {
      this.sfxMasterGain.gain.setTargetAtTime(
        this.settings.sfxEnabled ? this.settings.sfxVolume : 0,
        this.ctx.currentTime,
        0.05
      );
    }
    this.saveSettings();
    return this.settings.sfxEnabled;
  }

  public setSFXVolume(volume: number) {
    this.initAudioContext();
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxMasterGain && this.ctx && this.settings.sfxEnabled) {
      this.sfxMasterGain.gain.setTargetAtTime(this.settings.sfxVolume, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  /**
   * Generates a warm, dreamy cosmic chord with soft sine/triangle oscillators,
   * gentle low-pass filtering, slow evolving attack and long release.
   */
  private scheduleNextCosmicChord() {
    if (!this.ctx || !this.bgmMasterGain || !this.settings.bgmEnabled) return;

    // Mystical chord progressions in D / A Dorian/Lydian space mood
    const chordProgressions = [
      [146.83, 220.00, 277.18, 329.63, 440.00], // D - A - C# - E - A (Dmaj9)
      [110.00, 164.81, 220.00, 261.63, 329.63], // A - E - A - C - E (Am7)
      [174.61, 220.00, 261.63, 329.63, 392.00], // F - A - C - E - G (Fmaj9)
      [196.00, 246.94, 293.66, 369.99, 440.00], // G - B - D - F# - A (Gmaj9)
    ];

    const chord = chordProgressions[this.bgmStepIndex % chordProgressions.length];
    this.bgmStepIndex++;

    const now = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.linearRampToValueAtTime(750, now + 3.0);
    filter.frequency.linearRampToValueAtTime(500, now + 5.8);
    filter.connect(this.bgmMasterGain);

    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Alternate sine and gentle triangle for warmth
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      // Slight pitch detune for rich celestial chorus effect
      osc.frequency.setValueAtTime(freq + (idx - 2) * 0.4, now);

      // Slow mystical swell
      const maxGain = 0.035 / (chord.length * 0.7);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(maxGain, now + 2.0 + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.9);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + 6.0);
    });

    // Occasional gentle celestial sparkle note (high chime)
    if (Math.random() > 0.3) {
      const sparkleFreqs = [587.33, 659.25, 880.00, 987.77, 1174.66];
      const sparkleFreq = sparkleFreqs[Math.floor(Math.random() * sparkleFreqs.length)];
      const sparkleOsc = this.ctx.createOscillator();
      const sparkleGain = this.ctx.createGain();

      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(sparkleFreq, now + 1.2);

      sparkleGain.gain.setValueAtTime(0.0001, now + 1.2);
      sparkleGain.gain.exponentialRampToValueAtTime(0.03, now + 1.5);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(this.bgmMasterGain);

      sparkleOsc.start(now + 1.2);
      sparkleOsc.stop(now + 3.3);
    }
  }

  // ==========================================
  // SFX: Hiệu Ứng Âm Thanh Tương Tác
  // ==========================================

  /**
   * Tap / Click sound (UI Buttons)
   */
  public playTap() {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.sfxMasterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxMasterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  /**
   * Footstep / Stepping stone walk
   */
  public playStep() {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.sfxMasterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxMasterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  /**
   * Correct Answer (ĐÚNG) - Bright harmonic success chime
   */
  public playCorrect() {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.sfxMasterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      if (!ctx || !this.sfxMasterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startTime = ctx.currentTime + index * 0.08;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }

  /**
   * Wrong Answer (SAI) - Gentle low wobble (not harsh or scary)
   */
  public playWrong() {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.sfxMasterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.24);

    gain.gain.setValueAtTime(0.11, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxMasterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
  }

  /**
   * Reward / Crystal / XP Collection (NHẬN THƯỞNG)
   */
  public playReward() {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.sfxMasterGain) return;

    const notes = [659.25, 830.61, 987.77, 1318.51, 1567.98];
    notes.forEach((freq, index) => {
      if (!ctx || !this.sfxMasterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startTime = ctx.currentTime + index * 0.06;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.32);
    });
  }

  /**
   * Royal Crown Fanfare (VƯƠNG MIỆN)
   */
  public playCrownFanfare() {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.initAudioContext();
    if (!ctx || !this.sfxMasterGain) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, index) => {
      if (!ctx || !this.sfxMasterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startTime = ctx.currentTime + index * 0.11;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });
  }
}

export const soundManager = new SoundManager();

// ==========================================
// Backward-compatible exports for components
// ==========================================
export function playTapSound() {
  soundManager.playTap();
}

export function playStepSound() {
  soundManager.playStep();
}

export function playSuccessChime() {
  soundManager.playCorrect();
}

export function playErrorBoop() {
  soundManager.playWrong();
}

export function playCrystalSound() {
  soundManager.playReward();
}

export function playCrownFanfare() {
  soundManager.playCrownFanfare();
}

export function setSoundMuted(muted: boolean) {
  if (muted) {
    if (soundManager.getSettings().bgmEnabled) soundManager.toggleBGM();
    if (soundManager.getSettings().sfxEnabled) soundManager.toggleSFX();
  } else {
    if (!soundManager.getSettings().bgmEnabled) soundManager.toggleBGM();
    if (!soundManager.getSettings().sfxEnabled) soundManager.toggleSFX();
  }
}

export function getSoundMuted(): boolean {
  const s = soundManager.getSettings();
  return !s.bgmEnabled && !s.sfxEnabled;
}
