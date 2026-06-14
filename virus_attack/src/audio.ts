export const audioSystem = {
  ctx: null as AudioContext | null,
  breathBuffer: null as AudioBuffer | null,
  breathSource: null as AudioBufferSourceNode | null,
  breathGain: null as GainNode | null,
  breathFilter: null as BiquadFilterNode | null,
  initialized: false,
  lastBeepTime: 0,
  breathSpeedCurrent: 0,
  breathLoopActive: false,
  
  async init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(e => console.log('resume suspended context err', e));
      }
      return;
    }
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    this.initialized = true; // Set this early so playErrorBeep can work while fetching
    
    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.value = 0;
    
    this.breathFilter = this.ctx.createBiquadFilter();
    this.breathFilter.type = 'lowpass';
    this.breathFilter.frequency.value = 400; // muffed initially
    
    this.breathGain.connect(this.breathFilter);
    this.breathFilter.connect(this.ctx.destination);
    
    // Attempt resume immediately
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.log('resume suspended context err', e));
    }
    
    try {
      const response = await fetch('/respiro.mp3');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        this.breathBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      } else {
        this.createSyntheticBreath();
      }
    } catch {
      this.createSyntheticBreath();
    }
  },

  createSyntheticBreath() {
    if (!this.ctx) return;
    const duration = 4.0; // 4 seconds per breath cycle
    const bufferSize = this.ctx.sampleRate * duration; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
        // Generate Pink Noise
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        
        const t = i / this.ctx.sampleRate;
        
        // Breath Envelope
        let env = 0;
        if (t < 1.5) {
            // Inhale - stronger and sharper
            env = Math.sin((t / 1.5) * Math.PI) * 1.5;
        } else if (t < 1.8) {
            // Pause
            env = 0.05;
        } else if (t < 3.6) {
            // Exhale - slightly longer, softer than inhale
            env = Math.sin(((t - 1.8) / 1.8) * Math.PI) * 1.0;
        } else {
            env = 0.05;
        }
        
        // Lowpass filter applied directly to the noise somewhat to make it less harsh by default
        // Decreased base volume multiplier from 0.15 to 0.06
        data[i] = pink * 0.06 * env; 
    }
    this.breathBuffer = buffer;
  },

  playErrorBeep() {
    if (!this.ctx || !this.initialized) return;
    
    // throttle using performance.now() because ctx.currentTime might be 0/frozen while suspended
    const now = performance.now();
    if (now - this.lastBeepTime < 30) return; // 30ms
    this.lastBeepTime = now;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    
    try {
      const gain = this.ctx.createGain();
      
      // Harsh error/alarm frequencies
      const freqs = [800, 830]; 
      // Add a tiny random detune to make it chaotic when cascading
      const randomize = Math.random() * 20 - 10; 
      
      freqs.forEach(f => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth'; // harsher alert
        osc.frequency.setValueAtTime(f + randomize, this.ctx.currentTime);
        
        // Filter out some of the highest frequencies but keep it sharp
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.1);
      });
      
      // Envelope - very short and sharp
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
      
      gain.connect(this.ctx.destination);
      
      setTimeout(() => {
        try { gain.disconnect(); } catch (e) {}
      }, 150);
      
    } catch (e) {
      console.warn("Audio Context beep error", e);
    }
  },
  
  startBreath() {
    if (!this.ctx || !this.initialized || !this.breathBuffer || this.breathSource) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.breathSource = this.ctx.createBufferSource();
    this.breathSource.buffer = this.breathBuffer;
    this.breathSource.loop = true;
    
    this.breathSource.connect(this.breathGain!);
    this.breathSource.start();
    
    // Set an initial audible volume and slightly higher base filter so it sounds like a deep breath
    if (this.breathGain && this.breathFilter) {
      this.breathGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.breathGain.gain.value = 0.5;
      this.breathFilter.frequency.cancelScheduledValues(this.ctx.currentTime);
      this.breathFilter.frequency.value = 700;
    }
    
    this.breathSpeedCurrent = 0;
    if (!this.breathLoopActive) {
      this.breathLoopActive = true;
      this.audioLoop();
    }
  },
  
  audioLoop() {
    if (!this.breathLoopActive || !this.ctx || !this.breathSource || !this.breathGain || !this.breathFilter) return;

    // Decay current speed
    this.breathSpeedCurrent = Math.max(0, this.breathSpeedCurrent - 0.015);
    
    // Apply parameters smoothly
    // Increase rate significantly to make the breath rhythm faster instead of louder
    const targetRate = 1.0 + (this.breathSpeedCurrent * 3.5);
    this.breathSource.playbackRate.value = targetRate;
    
    // Moderate volume increase to avoid clipping and allow baseline to be louder
    const targetVol = 0.5 + (this.breathSpeedCurrent * 0.5);
    this.breathGain.gain.value = targetVol;
    
    // Reduce max filter frequency to prevent it from sounding too noisy/tumorous
    const targetFreq = 700 + (this.breathSpeedCurrent * 900);
    this.breathFilter.frequency.value = targetFreq;
    
    requestAnimationFrame(() => this.audioLoop());
  },
  
  stopBreath() {
    this.breathLoopActive = false;
    if (this.breathSource) {
      this.breathSource.stop();
      this.breathSource.disconnect();
      this.breathSource = null;
    }
    if (this.breathGain && this.ctx) {
        this.breathGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.breathGain.gain.value = 0;
    }
  },
  
  updateBreathParams(speed: number) {
    const maxSpeed = 50; // Max speed threshold logic
    const normalizedSpeed = Math.min(speed / maxSpeed, 1.0);
    
    // Set the current speed to the highest observed, so it jumps when fast and decays when slow/stopped
    this.breathSpeedCurrent = Math.max(this.breathSpeedCurrent, normalizedSpeed);
  }
};
