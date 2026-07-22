/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, SlidersHorizontal, RefreshCw, Download, X, Loader2 } from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface GlitchParams {
  extrusionEnabled: boolean;
  lowResEnabled: boolean;
  extrusionLength: number;
  polyGlitch: number;
  fragmentSize: number;
  chaos: number;
}

const CRUCIAL_POINTS = [
  33, 133, 159, 145, 153, // left eye area
  362, 263, 386, 374, 380, // right eye area
  1, 4, 5, 195, 19, 94, // nose
  0, 13, 14, 17, 39, 40, 269, 270, // mouth / lips
];

const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

export default function App() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [seed, setSeed] = useState(0);
  const [checkoutName, setCheckoutName] = useState('');

  useEffect(() => {
    // 1. Try URL parameters
    const params = new URLSearchParams(window.location.search);
    let name = params.get('name');

    // 2. Try localStorage
    if (!name) {
      try {
        name = localStorage.getItem('checkoutName');
      } catch (e) {
        console.warn('LocalStorage access blocked or failed', e);
      }
    }

    if (name) {
      // Capitalize first letter of each word and lowercase the rest
      const formattedName = name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setCheckoutName(formattedName);
    }
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<GlitchParams>({
    extrusionEnabled: true,
    lowResEnabled: false,
    extrusionLength: 60,
    polyGlitch: 4,
    fragmentSize: 100,
    chaos: 30,
  });

  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [faces, setFaces] = useState<any[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const fl = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "IMAGE",
          numFaces: 1
        });
        setFaceLandmarker(fl);
      } catch (err) {
        console.error("Failed to load FaceLandmarker", err);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextInput = target ? (
        (target.tagName === 'INPUT' && ['text', 'email', 'password', 'tel', 'number', 'search', 'url'].includes((target as HTMLInputElement).type)) ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.classList.contains('pin-input-slot') ||
        target.closest('.pin-input-field') ||
        target.closest('.pin-input-slot')
      ) : false;

      window.parent.postMessage({
        type: 'iframe-mousemove',
        clientX: e.clientX,
        clientY: e.clientY,
        isTextInput: isTextInput
      }, '*');
    };

    const handleMouseLeave = () => {
      window.parent.postMessage({ type: 'iframe-mouseleave' }, '*');
    };

    const handleMouseEnter = () => {
      window.parent.postMessage({ type: 'iframe-mouseenter' }, '*');
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  useEffect(() => {
    if (originalImage && faceLandmarker) {
      try {
        const results = faceLandmarker.detect(originalImage);
        if (results && results.faceLandmarks) {
          setFaces(results.faceLandmarks);
        } else {
          setFaces([]);
        }
      } catch (err) {
        setFaces([]);
      }
    }
  }, [originalImage, faceLandmarker]);

  const generateSeed = () => setSeed(Math.random() * 10000);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800; // Reduced from 1600 to optimize AI and performance
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = (h / w) * maxDim;
            w = maxDim;
          } else {
            w = (w / h) * maxDim;
            h = maxDim;
          }
        }
        const oc = document.createElement('canvas');
        oc.width = w;
        oc.height = h;
        const octx = oc.getContext('2d');
        octx?.drawImage(img, 0, 0, w, h);

        const newImg = new Image();
        newImg.onload = () => {
          setOriginalImage(newImg);
          generateSeed();
        };
        newImg.src = oc.toDataURL('image/png');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `distorted_portrait_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    let baseImgToDraw: HTMLImageElement | HTMLCanvasElement = originalImage;

    if (params.lowResEnabled) {
      const offCanvas = document.createElement('canvas');
      const scaleFactor = 0.4; // "older phone" / compressed look
      offCanvas.width = Math.max(1, originalImage.width * scaleFactor);
      offCanvas.height = Math.max(1, originalImage.height * scaleFactor);
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(originalImage, 0, 0, offCanvas.width, offCanvas.height);

        const lowResCanvas = document.createElement('canvas');
        lowResCanvas.width = originalImage.width;
        lowResCanvas.height = originalImage.height;
        const lrCtx = lowResCanvas.getContext('2d');
        if (lrCtx) {
          lrCtx.imageSmoothingEnabled = false;
          lrCtx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height, 0, 0, lowResCanvas.width, lowResCanvas.height);
          baseImgToDraw = lowResCanvas;
        }
      }
    }

    // Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImgToDraw, 0, 0);

    let glitchSource: HTMLImageElement | HTMLCanvasElement = baseImgToDraw;

    if (faces && faces.length > 0) {
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = canvas.width;
      faceCanvas.height = canvas.height;
      const fCtx = faceCanvas.getContext('2d');
      if (fCtx) {
        const landmarks = faces[0];
        fCtx.beginPath();
        FACE_OVAL_INDICES.forEach((idx, i) => {
          const lm = landmarks[idx];
          if (lm) {
            const x = lm.x * canvas.width;
            const y = lm.y * canvas.height;
            if (i === 0) fCtx.moveTo(x, y);
            else fCtx.lineTo(x, y);
          }
        });
        fCtx.closePath();
        fCtx.fillStyle = 'white';
        fCtx.fill();
        fCtx.globalCompositeOperation = 'source-in';
        fCtx.drawImage(baseImgToDraw, 0, 0);
        glitchSource = faceCanvas;
      }
    }

    let currentSeed = seed;
    const random = () => {
      const x = Math.sin(currentSeed++) * 10000;
      return x - Math.floor(x);
    };

    const width = canvas.width;
    const height = canvas.height;

    const chaosFactor = params.chaos / 100;
    const extLen = params.extrusionLength / 100;
    const extIntensity = params.extrusionEnabled ? 1 : 0;

    const numBlocks = params.polyGlitch;

    // 3/8 = 0.375 for 1 block, scaling down for more blocks
    const baseSizeRatio = 0.375 - ((numBlocks - 1) / 9) * 0.225;
    const fragmentSizeMult = params.fragmentSize / 100; // 1x at 100%

    for (let i = 0; i < numBlocks; i++) {
      const sizeVarianceW = numBlocks === 1 ? 0 : (random() * 0.05 - 0.025);
      const sizeVarianceH = numBlocks === 1 ? 0 : (random() * 0.05 - 0.025);

      const bw = Math.abs(baseSizeRatio + sizeVarianceW) * fragmentSizeMult * width;
      const bh = Math.abs(baseSizeRatio + sizeVarianceH) * fragmentSizeMult * height;

      const chaosShiftX = (random() - 0.5) * chaosFactor * width * 0.8;
      const chaosShiftY = (random() - 0.5) * chaosFactor * height * 0.8;

      let bx = random() * (width - bw) + chaosShiftX;
      let by = random() * (height - bh) + chaosShiftY;

      if (faces && faces.length > 0) {
        const landmarks = faces[0];
        const pIdx = CRUCIAL_POINTS[Math.floor(random() * CRUCIAL_POINTS.length)];
        const lm = landmarks[pIdx];
        if (lm) {
          bx = lm.x * width - bw / 2 + (chaosShiftX * 0.5);
          by = lm.y * height - bh / 2 + (chaosShiftY * 0.5);
        }
      }

      // Completely random direction based on chaos
      const angle = random() * Math.PI * 2;

      const maxDist = extLen * Math.min(width, height) * 0.6 + chaosFactor * Math.min(width, height) * 0.6;
      const dist = random() * maxDist;

      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      const p1 = { x: random() * bw * 0.4, y: random() * bh * 0.4 };
      const p2 = { x: bw - random() * bw * 0.4, y: random() * bh * 0.4 };
      const p3 = { x: bw - random() * bw * 0.4, y: bh - random() * bh * 0.4 };
      const p4 = { x: random() * bw * 0.4, y: bh - random() * bh * 0.4 };
      const isQuad = random() > 0.3;

      // Extrusion connection - trailing smear linking back to original face
      // Use capped steps to make the extrusion smooth and linear without freezing the browser
      const maxSteps = 150;
      const steps = Math.min(maxSteps, Math.floor(dist / 2));
      // Pre-render the clipped polygon block onto an offscreen canvas to optimize rendering
      const blockCanvas = document.createElement('canvas');
      blockCanvas.width = Math.max(1, Math.ceil(bw));
      blockCanvas.height = Math.max(1, Math.ceil(bh));
      const bCtx = blockCanvas.getContext('2d');
      if (bCtx) {
        bCtx.beginPath();
        bCtx.moveTo(p1.x, p1.y);
        bCtx.lineTo(p2.x, p2.y);
        bCtx.lineTo(p3.x, p3.y);
        if (isQuad) bCtx.lineTo(p4.x, p4.y);
        bCtx.closePath();
        bCtx.clip();
        bCtx.drawImage(glitchSource, bx, by, bw, bh, 0, 0, bw, bh);

        // Extrusion connection - trailing smear linking back to original face
        if (extIntensity > 0 && dist > 1) {
          ctx.save();
          ctx.globalAlpha = 1.0;
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const tx = dx * t;
            const ty = dy * t;
            ctx.drawImage(blockCanvas, bx + tx, by + ty);
          }
          ctx.restore();
        }

        // Final Displaced Fragment at the end of the extrusion
        ctx.save();
        ctx.drawImage(blockCanvas, bx + dx, by + dy);
        if (chaosFactor > 0.2) {
          ctx.beginPath();
          ctx.moveTo(bx + p1.x + dx, by + p1.y + dy);
          ctx.lineTo(bx + p2.x + dx, by + p2.y + dy);
          ctx.lineTo(bx + p3.x + dx, by + p3.y + dy);
          if (isQuad) ctx.lineTo(bx + p4.x + dx, by + p4.y + dy);
          ctx.closePath();
          ctx.clip();
          ctx.fillStyle = `rgba(0, 0, 0, ${(random() * 0.15 * chaosFactor).toFixed(3)})`;
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }, [originalImage, params, seed, faces]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : parseInt(e.target.value, 10);
    setParams({
      ...params,
      [e.target.name]: val
    });
  };

  return (
    <div
      className="min-h-screen bg-[#ffffff] text-[#1a1a1a] font-sans flex flex-col relative overflow-hidden"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Background SVG */}
      <img className="confirmed-bg-testi" src="/background_community_names.svg" alt="Background Texts" />

      {originalImage && (
        <div className="paperface-action-window">
          {/* selectors_section */}
          <div className="selectors-section">
            <div className="selector-row">
              <span className="selector-label">Low res filter</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="lowResEnabled"
                  checked={params.lowResEnabled}
                  onChange={handleSliderChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="selector-row">
              <span className="selector-label">Extrusion effect</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="extrusionEnabled"
                  checked={params.extrusionEnabled}
                  onChange={handleSliderChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* slider_section */}
          <div className="slider-section">
            <div className={`slider-row-container ${!params.extrusionEnabled ? 'disabled' : ''}`}>
              <span className="slider-label">Extrusion length</span>
              <div className="slider-and-value">
                <input
                  type="range"
                  name="extrusionLength"
                  min="0"
                  max="100"
                  value={params.extrusionLength}
                  onChange={handleSliderChange}
                  className="custom-range-slider"
                  disabled={!params.extrusionEnabled}
                  style={{ '--value-percent': `${params.extrusionLength}%` } as React.CSSProperties}
                />
                <span className="slider-value-text">{params.extrusionLength}</span>
              </div>
            </div>

            <div className="slider-row-container">
              <span className="slider-label">Glitch fragments</span>
              <div className="slider-and-value">
                <input
                  type="range"
                  name="polyGlitch"
                  min="1"
                  max="10"
                  value={params.polyGlitch}
                  onChange={handleSliderChange}
                  className="custom-range-slider"
                  style={{ '--value-percent': `${(params.polyGlitch - 1) / 9 * 100}%` } as React.CSSProperties}
                />
                <span className="slider-value-text">{params.polyGlitch}</span>
              </div>
            </div>

            <div className="slider-row-container">
              <span className="slider-label">Fragment size</span>
              <div className="slider-and-value">
                <input
                  type="range"
                  name="fragmentSize"
                  min="10"
                  max="300"
                  value={params.fragmentSize}
                  onChange={handleSliderChange}
                  className="custom-range-slider"
                  style={{ '--value-percent': `${(params.fragmentSize - 10) / 290 * 100}%` } as React.CSSProperties}
                />
                <span className="slider-value-text">{params.fragmentSize}</span>
              </div>
            </div>

            <div className="slider-row-container">
              <span className="slider-label">Chaos & variance</span>
              <div className="slider-and-value">
                <input
                  type="range"
                  name="chaos"
                  min="0"
                  max="100"
                  value={params.chaos}
                  onChange={handleSliderChange}
                  className="custom-range-slider"
                  style={{ '--value-percent': `${params.chaos}%` } as React.CSSProperties}
                />
                <span className="slider-value-text">{params.chaos}</span>
              </div>
            </div>
          </div>

          {/* operation-buttons-section */}
          <div className="operation-buttons-section">
            <button className="op-btn" onClick={generateSeed}>Re-roll</button>
            <button className="op-btn" onClick={downloadImage}>Save</button>
            <button className="op-btn" onClick={() => setOriginalImage(null)}>Load another photo</button>
          </div>
        </div>
      )}

      <main className="flex-grow flex items-center justify-center bg-transparent relative z-10">
        {!originalImage && (
          <a
            href="#"
            className="login-back-btn btn-text"
            onClick={(e) => {
              e.preventDefault();
              window.parent.postMessage({ type: 'paperface-back' }, '*');
            }}
          >
            <span>Back</span>
          </a>
        )}
        {!originalImage ? (
          <div className="uploader-card"
            onClick={() => document.getElementById('file-upload')?.click()}>
            <div className="uploader-icon-container">
              {isModelLoading ? (
                <Loader2 className="uploader-icon animate-spin" />
              ) : (
                <svg
                  width="54"
                  height="43"
                  viewBox="0 0 54 43"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="uploader-icon"
                >
                  <path
                    d="M54 5.375H27L21.6 0C14.409 0 7.21802 -1.35649e-05 0.0270264 6.80797e-06L0 43C18 43 36 43 54 43V5.375ZM48.6 37.625H5.40002V10.75H48.6V37.625ZM16.2 24.2144L20.007 28.0038L24.3 23.7575V34.9375H29.7V23.7575L33.993 28.0306L37.8 24.2144L27.027 13.4375L16.2 24.2144Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            <div className="uploader-text-container">
              <h2 className="uploader-title">Upload a Portrait</h2>
              <p className="uploader-subtitle">
                {isModelLoading ? 'Loading AI Model...' : 'Click or drag here'}
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isModelLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative inline-flex flex-col items-start" style={{ height: '527px' }}>
              <canvas
                ref={canvasRef}
                style={{ height: '527px', maxWidth: '100%', objectFit: 'contain' }}
                className="drop-shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
              />
              {checkoutName && (
                <div
                  className="checkout-photo-name text-black tracking-[-0.03em] select-none absolute"
                  style={{
                    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: '20px',
                    lineHeight: '100%',
                    letterSpacing: '-0.03em',
                    fontWeight: 500,
                    bottom: '-40px',
                    left: '0px'
                  }}
                >
                  {checkoutName}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {originalImage && (
        <button
          onClick={() => {
            downloadImage();
            let imageDataUrl = "";
            if (canvasRef.current) {
              imageDataUrl = canvasRef.current.toDataURL('image/png');
            }
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({
                type: 'paperface-confirm',
                image: imageDataUrl,
                name: checkoutName
              }, '*');
            }
          }}
          className="confirm-btn"
        >
          <span>Confirm</span>
        </button>
      )}
    </div>
  );
}
