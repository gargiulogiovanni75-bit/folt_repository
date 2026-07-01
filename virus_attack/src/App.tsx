/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CARDS, FALLBACK_CARDS } from './assets';
import { audioSystem } from './audio';

type AppState = 'idle' | 'cascading' | 'typing' | 'input';

const textBody = `{
    "atmosphere": [
        "Noise",
        "flesh",
        "whisper",
        "fragments"
    ],
    "metaphor": "the skin becomes a screen, the mind a labyrinth of broken mirrors.",
    "question": "listen?",
    "symptoms": {
        "heartbeat": "irregular",
        "breathing": "labored",
        "echo": "of that which dares not speak to itself"
    },
    "spatial_state": "there is no surface here. just falls, leaps into the void, sudden discards.",
    "manifestations": {
        "fashion": "that scratches",
        "art": "that screams silently",
        "philosophy": "that slips into the folds of the soul"
    },
    "visuals": {
        "nature": "biting images",
        "textures": "deep blacks with living grain",
        "revelation": "secrets Unveiled Between Shadows"
    },
    "identity": {
        "role": "a navigator of restless spaces, a seeker of burning details",
        "desire": "a soul that wants to know, feel, expand beyond the confines of the skin"
    },
    "soundtrack": {
        "nature": "Music guides you, a wave that collapses and rebuilds",
        "composition": "a psychological journey made of bright splinters and pulsating darkness"
    },
    "warnings": [
        "It is not a journey for those who fear chaos",
        "for those looking for simple answers"
    ],
    "experience": "it's a whirlwind, a tightrope dance, an exploration of the boundary between pleasure and annoyance, between desire and fear.",
    "conclusion": "Here you get lost to find yourself. here the raw becomes art, and art becomes life."
}`;

const questionBody = "what have you learned to hide to be accepted ?";

const CACHE_BUSTER = Date.now();

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [cascadeWindows, setCascadeWindows] = useState<{id: number, x: number, y: number, imgUrl: string, fallbackUrl: string}[]>([]);
  const [typedText, setTypedText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const typeInterval = useRef<NodeJS.Timeout | null>(null);
  const lastMousePos = useRef({ x: -1, y: -1 });

  // Initialize audio context and preload images
  useEffect(() => {
    // Preload cascade images
    CARDS.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    // We eagerly initialize
    audioSystem.init();

    const unlockAudio = () => {
      if (audioSystem.ctx) {
        if (audioSystem.ctx.state === 'suspended') {
          audioSystem.ctx.resume().then(() => {
            if (audioSystem.ctx?.state === 'running') {
               cleanup();
            }
          }).catch(() => {});
        } else if (audioSystem.ctx.state === 'running') {
          cleanup();
        }
      } else {
        audioSystem.init();
      }
    };
    
    // Bind to all potential early interactions
    const events = ['mousedown', 'keydown', 'touchstart', 'mousemove', 'pointerdown'];
    
    const cleanup = () => {
      events.forEach(e => window.removeEventListener(e, unlockAudio));
    };

    events.forEach(e => window.addEventListener(e, unlockAudio, { passive: true }));
    
    return cleanup;
  }, []);

  // Handle Mouse Move and triggering the cascade
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - lastMousePos.current.x, e.clientY - lastMousePos.current.y);
      
      if (appState === 'idle') {
        setAppState('cascading');
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setCascadeWindows([
           { id: Date.now(), x: e.clientX, y: e.clientY, imgUrl: CARDS[0], fallbackUrl: FALLBACK_CARDS[0] }
        ]);
        audioSystem.playErrorBeep();
      } else if (appState === 'cascading') {
        // Throttle cascade window creation based on distance
        if (dist > 25) { 
          setCascadeWindows(prev => [
            ...prev,
            { 
               id: Date.now() + Math.random(), 
               x: e.clientX, 
               y: e.clientY, 
               imgUrl: CARDS[prev.length % CARDS.length],
               fallbackUrl: FALLBACK_CARDS[prev.length % FALLBACK_CARDS.length]
            }
          ]);
          lastMousePos.current = { x: e.clientX, y: e.clientY };
          audioSystem.playErrorBeep();
        }
      } else if (appState === 'typing' || appState === 'input') {
          // Track mouse distance purely for breath parameter mapping
          lastMousePos.current = { x: e.clientX, y: e.clientY };
          audioSystem.updateBreathParams(dist);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [appState]);

  // Transition after 120 tabs are created
  useEffect(() => {
    if (appState === 'cascading' && cascadeWindows.length >= 120) {
      setAppState('typing');
      setCascadeWindows([]);
      audioSystem.startBreath();
    } else if (appState === 'idle') {
      audioSystem.stopBreath();
    }
  }, [appState, cascadeWindows.length]);

  // Handle Typing effect
  useEffect(() => {
    if (appState === 'typing') {
      let currentIdx = 0;
      setTypedText("");
      
      typeInterval.current = setInterval(() => {
        if (currentIdx < textBody.length) {
          currentIdx += 4;
          if (currentIdx > textBody.length) currentIdx = textBody.length;
          setTypedText(textBody.substring(0, currentIdx));
        } else {
          if (typeInterval.current) clearInterval(typeInterval.current);
          setAppState('input');
        }
      }, 10); // Extremely fast typing speed
    }
    return () => {
      if (typeInterval.current) clearInterval(typeInterval.current);
    }
  }, [appState]);

  // Handle Input phase keystrokes
  useEffect(() => {
    if (appState === 'input') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          setAppState('idle');
          setInputValue("");
        } else if (e.key === 'Backspace') {
          setInputValue(prev => prev.slice(0, -1));
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setInputValue(prev => prev + e.key);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [appState]);

  const hideCursor = appState === 'typing' || appState === 'input';

  return (
    <div className={"min-h-screen w-full bg-white select-none relative " + (hideCursor ? "cursor-none" : "")}>
      {(appState === 'idle' || appState === 'cascading') && (
        <div className="absolute top-4 left-4 text-[12px] text-black font-pixel z-[100] uppercase tracking-widest pointer-events-none">
          click to hear the sound
        </div>
      )}

      {/* Cascading Windows */}
      {appState === 'cascading' && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]">
          {cascadeWindows.map((win) => (
            <div
              key={win.id}
              className="absolute shadow-[2px_2px_0_#000] border-2 border-t-[#dfdfdf] border-l-[#dfdfdf] border-r-[#808080] border-b-[#808080] bg-[#c0c0c0] p-[2px]"
              style={{ left: win.x, top: win.y, width: '280px', transform: 'translate(-50%, -10px)' }}
            >
              <div className="bg-[#000080] text-white px-[4px] py-[2px] text-[11px] font-bold flex justify-between items-center mb-[2px]">
                <span>Error</span>
                <span className="bg-[#c0c0c0] border border-t-[#dfdfdf] border-l-[#dfdfdf] border-r-[#808080] border-b-[#808080] text-black px-[4px] py-[0px] font-normal leading-none pb-[2px]">x</span>
              </div>
              <img
                src={win.imgUrl}
                className="w-full block"
                alt="Error Cascade"
                onError={(e) => {
                  e.currentTarget.src = win.fallbackUrl;
                  e.currentTarget.onerror = null;
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Typing & Input Phase */}
      {(appState === 'typing' || appState === 'input') && (
        <div className="absolute inset-0 flex flex-col justify-start p-[10px] box-border relative z-10 w-full h-full items-start">
          <div className="font-pixel text-black text-[2.5vh] sm:text-[2.8vh] md:text-[3.2vh] lg:text-[3.5vh] max-w-full w-full leading-[1.2] whitespace-pre-wrap text-left break-words">
            {typedText}
            
            {appState === 'input' && (
              <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 transition={{ duration: 0.5 }}
                 className="mt-[5vh] font-bold"
              >
                <div>{questionBody}</div>
                <div className="mt-[1vh] flex items-center break-words flex-wrap">
                  <span className="whitespace-pre-wrap text-black">{inputValue}</span>
                  <span className="animate-blink w-[0.6em] h-[1.2em] bg-black ml-[0.3em] inline-block shrink-0 align-middle"></span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
