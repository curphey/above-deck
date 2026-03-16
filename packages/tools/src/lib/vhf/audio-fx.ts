export class RadioAudioFX {
  private ctx: AudioContext;
  private bandpass: BiquadFilterNode;
  private compressor: DynamicsCompressorNode;
  private noiseGain: GainNode;
  private disposed = false;

  constructor() {
    this.ctx = new AudioContext();

    // Band-pass filter: 300Hz - 3kHz (VHF radio frequency range)
    this.bandpass = this.ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 1650; // center frequency
    this.bandpass.Q.value = 0.7;

    // Compressor for consistent volume
    this.compressor = this.ctx.createDynamicsCompressor();

    // Noise gain (for background static)
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0.02;

    // Chain: bandpass → compressor → destination
    this.bandpass.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  connect(source: AudioNode): AudioNode {
    source.connect(this.bandpass);
    return this.compressor;
  }

  setSquelch(level: number): void {
    const clamped = Math.max(0, Math.min(9, level));
    // Higher squelch = less background noise
    this.noiseGain.gain.value = 0.05 * (1 - clamped / 9);
  }

  playSquelchBreak(): void {
    if (this.disposed) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 2000;
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playStaticBurst(): void {
    if (this.disposed) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 1500;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  startBackgroundNoise(): void {
    // Background noise will be implemented via white noise generator
    // For now, a low-level hiss
  }

  stopBackgroundNoise(): void {
    this.noiseGain.gain.value = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.ctx.close();
  }
}
