// Programmatic audio synthesizer for beeps and pink noise breathing
const audioSystem = {
  ctx: null,
  breathBuffer: null,
  breathSource: null,
  breathGain: null,
  breathFilter: null,
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
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    this.initialized = true; 
    
    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.value = 0;
    
    this.breathFilter = this.ctx.createBiquadFilter();
    this.breathFilter.type = 'lowpass';
    this.breathFilter.frequency.value = 400; 
    
    this.breathGain.connect(this.breathFilter);
    this.breathFilter.connect(this.ctx.destination);
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.log('resume suspended context err', e));
    }
    
    try {
      const response = await fetch('/respiro.mp3');
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('audio')) {
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
    const duration = 4.0; 
    const bufferSize = this.ctx.sampleRate * duration; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
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
        
        let env = 0;
        if (t < 1.5) {
            env = Math.sin((t / 1.5) * Math.PI) * 1.5;
        } else if (t < 1.8) {
            env = 0.05;
        } else if (t < 3.6) {
            env = Math.sin(((t - 1.8) / 1.8) * Math.PI) * 1.0;
        } else {
            env = 0.05;
        }
        
        data[i] = pink * 0.06 * env; 
    }
    this.breathBuffer = buffer;
  },

  playErrorBeep() {
    if (!this.ctx || !this.initialized) return;
    
    const now = performance.now();
    if (now - this.lastBeepTime < 30) return; 
    this.lastBeepTime = now;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    
    try {
      const gain = this.ctx.createGain();
      const freqs = [800, 830]; 
      const randomize = Math.random() * 20 - 10; 
      
      freqs.forEach(f => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(f + randomize, this.ctx.currentTime);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.1);
      });
      
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
    
    this.breathSource.connect(this.breathGain);
    this.breathSource.start();
    
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

    this.breathSpeedCurrent = Math.max(0, this.breathSpeedCurrent - 0.015);
    
    const targetRate = 1.0 + (this.breathSpeedCurrent * 3.5);
    this.breathSource.playbackRate.value = targetRate;
    
    const targetVol = 0.5 + (this.breathSpeedCurrent * 0.5);
    this.breathGain.gain.value = targetVol;
    
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

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(e => console.log('suspend context err', e));
    }
  },
  
  updateBreathParams(speed) {
    const maxSpeed = 50; 
    const normalizedSpeed = Math.min(speed / maxSpeed, 1.0);
    this.breathSpeedCurrent = Math.max(this.breathSpeedCurrent, normalizedSpeed);
  }
};

const CARDS = [
  '/0.jpg',
  '/1.jpg',
  '/2.jpg',
  '/3.png',
  '/4.png',
  '/5.png'
];

const createPlaceholder = (index) => {
  const svg = `<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="500" fill="#ffffff" stroke="#c0c0c0" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-family="sans-serif" font-size="20">Image Placeholder ${index}</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="14">Upload image ${index} to public/ folder</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const FALLBACK_CARDS = [
  createPlaceholder(0),
  createPlaceholder(1),
  createPlaceholder(2),
  createPlaceholder(3),
  createPlaceholder(4),
  createPlaceholder(5)
];

let virusAttackCompleted = false;

export function initVirusAttack(force = false) {
  localStorage.removeItem('virus_attack_completed'); // Clean up any stale local storage keys
  if (force) {
    virusAttackCompleted = false;
    window.__virusAttackCompleted = false;
    window.__virusAttackInitialized = false;
  }
  if (virusAttackCompleted || window.__virusAttackCompleted || window.__virusAttackInitialized) {
    return; // Already completed or initialized, do not run!
  }
  window.__virusAttackInitialized = true;

  // Create the container element dynamically
  let container = document.getElementById('virus-attack-container');
  let handleInputKeyDown = null;
  if (!container) {
    container = document.createElement('div');
    container.id = 'virus-attack-container';
    container.className = 'font-pixel';
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; background-color: var(--color-surface-main); user-select: none; overflow: hidden; display: none;';
    document.body.appendChild(container);
  }

  // Insert base layout with foreground texts "click to hear the sound" and "key_components"
  container.innerHTML = `
    <div id="virus-header-left" class="header_texts" style="position: absolute; top: 39px; left: 40px; color: var(--color-text-disabled); text-transform: uppercase; letter-spacing: 0.05em; z-index: 100000; cursor: default;">click to hear the sound</div>
    
    <div class="key-components-container" id="key-components-container">
      <div class="key-components" id="key-components-wrapper">
        <!-- Close Button X -->
        <div class="key-close-btn" id="key-close-btn" style="display: none;">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#979797" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- Trigger Button -->
        <div class="key-trigger-btn label_link_button_small_texts" id="key-trigger-btn" style="cursor: pointer;">
          <span>insert the key to skip</span>
        </div>
        
        <!-- PIN Input Fields -->
        <div class="pin-input-field" id="pin-input-field" style="display: none;">
          <div class="pin-input-slot" data-index="0">
            <span class="pin-digit"></span>
            <div class="pin-line"></div>
          </div>
          <div class="pin-input-slot" data-index="1">
            <span class="pin-digit"></span>
            <div class="pin-line"></div>
          </div>
          <div class="pin-input-slot" data-index="2">
            <span class="pin-digit"></span>
            <div class="pin-line"></div>
          </div>
          <div class="pin-input-slot" data-index="3">
            <span class="pin-digit"></span>
            <div class="pin-line"></div>
          </div>
          <div class="pin-input-slot" data-index="4">
            <span class="pin-digit"></span>
            <div class="pin-line"></div>
          </div>
          <div class="pin-input-slot" data-index="5">
            <span class="pin-digit"></span>
            <div class="pin-line"></div>
          </div>
        </div>
        <!-- Error message -->
        <div class="key-error-text" id="virus-key-error-text" style="display: none;">key not valid</div>
      </div>
    </div>

    <div id="virus-cascade-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"></div>
    <div id="virus-typing-layer" class="typing-container" style="display: none;">
      <div id="virus-typing-text" class="typing-text"></div>
    </div>
  `;

  // Get key components elements & setup event listeners
  const keyComponentsContainer = document.getElementById('key-components-container');
  const keyTriggerBtn = document.getElementById('key-trigger-btn');
  const pinInputField = document.getElementById('pin-input-field');
  const keyCloseBtn = document.getElementById('key-close-btn');
  const pinSlots = container.querySelectorAll('#pin-input-field .pin-input-slot');

  let pinActive = false;
  let enteredPin = "";

  function updatePinDisplay() {
    pinSlots.forEach((slot, index) => {
      const digitSpan = slot.querySelector('.pin-digit');
      const lineDiv = slot.querySelector('.pin-line');
      
      digitSpan.classList.remove('error');
      lineDiv.classList.remove('error');
      
      if (index < enteredPin.length) {
        digitSpan.textContent = "*";
      } else {
        digitSpan.textContent = "";
      }
    });
  }

  function setErrorState() {
    pinSlots.forEach((slot) => {
      const digitSpan = slot.querySelector('.pin-digit');
      const lineDiv = slot.querySelector('.pin-line');
      digitSpan.classList.add('error');
      lineDiv.classList.add('error');
      digitSpan.textContent = ""; // Asterisks disappear
    });
    enteredPin = "";

    const errText = document.getElementById('virus-key-error-text');
    if (errText) {
      errText.style.display = 'block';
    }
  }

  function clearErrorState() {
    pinSlots.forEach((slot) => {
      const digitSpan = slot.querySelector('.pin-digit');
      const lineDiv = slot.querySelector('.pin-line');
      digitSpan.classList.remove('error');
      lineDiv.classList.remove('error');
    });

    const errText = document.getElementById('virus-key-error-text');
    if (errText) {
      errText.style.display = 'none';
    }
  }

  if (keyTriggerBtn) {
    keyTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!pinActive) {
        pinActive = true;
        if (pinInputField) {
          pinInputField.style.display = 'flex';
        }
        keyCloseBtn.style.display = 'flex';
        enteredPin = "";
        updatePinDisplay();
        
        if (container) {
          container.classList.add('pin-active');
        }
        const wrapper = document.getElementById('key-components-wrapper');
        if (wrapper) {
          wrapper.classList.add('selected');
        }
      }
    });
  }

  if (keyCloseBtn) {
    keyCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pinActive = false;
      if (pinInputField) {
        pinInputField.style.display = 'none';
      }
      keyCloseBtn.style.display = 'none';
      enteredPin = "";
      updatePinDisplay();
      clearErrorState();
      
      if (container) {
        container.classList.remove('pin-active');
      }
      const wrapper = document.getElementById('key-components-wrapper');
      if (wrapper) {
        wrapper.classList.remove('selected');
      }
    });
  }

  const handlePinKeyDown = (e) => {
    if (!pinActive) return;

    if (e.key >= '0' && e.key <= '9') {
      if (enteredPin.length < 6) {
        clearErrorState();
        enteredPin += e.key;
        updatePinDisplay();
      }
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'Backspace') {
      clearErrorState();
      enteredPin = enteredPin.slice(0, -1);
      updatePinDisplay();
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'Enter') {
      if (enteredPin.length === 6) {
        if (enteredPin === "111223") {
          pinActive = false;
          finishVirusAttack();
        } else {
          setErrorState();
        }
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };

  window.addEventListener('keydown', handlePinKeyDown);

  const appContainer = document.getElementById('app-container');
  
  let appState = 'idle'; // 'idle', 'transitioning', 'cascading', 'typing', 'input'
  let windowsCount = 0;
  const lastMousePos = { x: -1, y: -1 };
  let inputValue = "";
  let typeInterval = null;

  const textBody = `-Noise.\n-flesh.\n-whisper.\n-fragments.\nthe skin becomes a screen, the mind a labyrinth of broken mirrors.\nlisten?\n-----------An irregular heartbeat, labored breathing,\nthe echo of that which dares not speak to itself.\nthere is no surface here. just falls, leaps into the void, sudden discards. fashion that scratches, art that screams silently, philosophy that slips into the folds of the soul. biting\nimages, deep blacks with living grain, secrets Unveiled Between Shadows. You're a navigator of restless spaces, a seeker of burning details, a soul that wants to know,\nfeel, expand beyond the confines of the skin.\nMusic guides you, a wave that collapses and rebuilds, a psychological journey made of bright splinters and pulsating darkness. It is not a journey for those who fear chaos,\nfor those looking for simple answers. it's a whirlwind, a tightrope dance, an exploration of the boundary between pleasure and annoyance, between desire and fear.\nHere you get lost to find yourself. here the raw becomes art, and art becomes life.`;
  const questionBody = "what have you learned to hide to be accepted ?";

  // Preload images
  CARDS.forEach(url => {
    const img = new Image();
    img.src = url;
  });

  // Audio activation helper
  const unlockAudio = () => {
    audioSystem.init();
    if (audioSystem.ctx) {
      if (audioSystem.ctx.state === 'suspended') {
        audioSystem.ctx.resume().then(() => {
          if (audioSystem.ctx.state === 'running') {
            cleanupAudioEvents();
            const headerLeft = document.getElementById('virus-header-left');
            if (headerLeft) {
              headerLeft.style.opacity = '0.5';
            }
          }
        }).catch(() => {});
      } else if (audioSystem.ctx.state === 'running') {
        cleanupAudioEvents();
        const headerLeft = document.getElementById('virus-header-left');
        if (headerLeft) {
          headerLeft.style.opacity = '0.5';
        }
      }
    }
  };

  const audioEvents = ['mousedown', 'keydown', 'touchstart', 'pointerdown'];
  const cleanupAudioEvents = () => {
    audioEvents.forEach(e => window.removeEventListener(e, unlockAudio));
  };
  audioEvents.forEach(e => window.addEventListener(e, unlockAudio, { passive: true }));

  // Mouse move listener to trigger cascade
  const handleMouseMove = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const dist = Math.hypot(startX - lastMousePos.x, startY - lastMousePos.y);

    if (appState === 'idle') {
      appState = 'transitioning';
      // Freeze the normal site screen
      document.body.classList.add('virus-lock');

      setTimeout(() => {
        appState = 'cascading';
        document.body.classList.remove('virus-lock');
        
        // Hide the main site and show virus container
        if (appContainer) appContainer.style.display = 'none';
        container.style.display = 'block';
        
        lastMousePos.x = startX;
        lastMousePos.y = startY;
        createCascadeWindow(startX, startY);
      }, 1000);
    } else if (appState === 'cascading') {
      if (dist > 25) {
        createCascadeWindow(startX, startY);
        lastMousePos.x = startX;
        lastMousePos.y = startY;
      }
    } else if (appState === 'typing' || appState === 'input') {
      lastMousePos.x = startX;
      lastMousePos.y = startY;
      audioSystem.updateBreathParams(dist);
    }
  };

  // Listen for mousemove to start the virus attack on normal site immediately
  window.addEventListener('mousemove', handleMouseMove);

  // If forced, trigger transition immediately
  if (force) {
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    lastMousePos.x = startX;
    lastMousePos.y = startY;
    
    appState = 'transitioning';
    document.body.classList.add('virus-lock');

    setTimeout(() => {
      appState = 'cascading';
      document.body.classList.remove('virus-lock');
      
      if (appContainer) appContainer.style.display = 'none';
      container.style.display = 'block';
      
      createCascadeWindow(startX, startY);
    }, 1000);
  }

  function createCascadeWindow(startX, startY) {
    audioSystem.playErrorBeep();
    windowsCount++;

    const idx = (windowsCount - 1) % CARDS.length;
    const imgUrl = CARDS[idx];
    const fallbackUrl = FALLBACK_CARDS[idx];

    const winDiv = document.createElement('div');
    winDiv.className = 'cascade-window';
    winDiv.style.cssText = `position: absolute; left: ${startX}px; top: ${startY}px; width: 280px; transform: translate(-50%, -10px); z-index: ${windowsCount};`;

    winDiv.innerHTML = `
      <div class="cascade-window-header">
        <span>Error</span>
        <span class="cascade-window-close">x</span>
      </div>
      <img src="${imgUrl}" alt="Error Cascade">
    `;

    const img = winDiv.querySelector('img');
    img.onerror = () => {
      img.src = fallbackUrl;
      img.onerror = null;
    };

    const cascadeLayer = document.getElementById('virus-cascade-layer');
    if (cascadeLayer) {
      cascadeLayer.appendChild(winDiv);
    }

    if (windowsCount >= 120) {
      startTypingPhase();
    }
  }

  function startTypingPhase() {
    appState = 'typing';
    window.removeEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleMouseMoveBreathOnly);

    // Hide cascade and show typing layer
    const cascadeLayer = document.getElementById('virus-cascade-layer');
    if (cascadeLayer) cascadeLayer.innerHTML = '';
    
    const typingLayer = document.getElementById('virus-typing-layer');
    if (typingLayer) typingLayer.style.display = 'flex';

    container.classList.add('cursor-none');
    audioSystem.startBreath();

    let currentIdx = 0;
    const textDiv = document.getElementById('virus-typing-text');
    
    typeInterval = setInterval(() => {
      if (currentIdx < textBody.length) {
        currentIdx += 4;
        if (currentIdx > textBody.length) currentIdx = textBody.length;
        if (textDiv) textDiv.textContent = textBody.substring(0, currentIdx);
      } else {
        clearInterval(typeInterval);
        startInputPhase();
      }
    }, 10);
  }

  function handleMouseMoveBreathOnly(e) {
    const dist = Math.hypot(e.clientX - lastMousePos.x, e.clientY - lastMousePos.y);
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
    audioSystem.updateBreathParams(dist);
  }

  function startInputPhase() {
    appState = 'input';
    const textDiv = document.getElementById('virus-typing-text');
    
    if (textDiv) {
      const inputBlock = document.createElement('div');
      inputBlock.className = 'input-block';
      inputBlock.innerHTML = `
        <div>${questionBody}</div>
        <div style="margin-top: 1vh; display: flex; align-items: center; break-all; flex-wrap: wrap;">
          <span id="virus-input-value" style="white-space: pre-wrap; color: var(--color-text-primary);"></span>
          <span class="blink-cursor"></span>
        </div>
      `;
      textDiv.appendChild(inputBlock);
    }

    const valueSpan = document.getElementById('virus-input-value');

    handleInputKeyDown = (e) => {
      // Ignore key events if the PIN input overlay is active
      if (pinActive) {
        return;
      }

      if (e.key === 'Enter') {
        window.removeEventListener('keydown', handleInputKeyDown);
        finishVirusAttack();
      } else if (e.key === 'Backspace') {
        inputValue = inputValue.slice(0, -1);
        if (valueSpan) valueSpan.textContent = inputValue;
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputValue += e.key;
        if (valueSpan) valueSpan.textContent = inputValue;
      }
    };

    window.addEventListener('keydown', handleInputKeyDown);
  }

  function finishVirusAttack() {
    appState = 'idle';
    audioSystem.stopBreath();
    audioSystem.suspend();
    
    if (typeInterval) {
      clearInterval(typeInterval);
      typeInterval = null;
    }
    
    // Remove all listeners to prevent memory leaks and re-triggering of virus screen
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mousemove', handleMouseMoveBreathOnly);
    window.removeEventListener('keydown', handlePinKeyDown);
    if (handleInputKeyDown) {
      window.removeEventListener('keydown', handleInputKeyDown);
    }
    cleanupAudioEvents();

    // Save state in memory so it resets on page refresh/reload
    virusAttackCompleted = true;
    window.__virusAttackCompleted = true;

    // Remove the virus container and restore normal site
    container.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    // Remove the container element from DOM entirely
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Dispatch finished event to main.js
    window.dispatchEvent(new CustomEvent('virus-attack-finished'));
  }
}
