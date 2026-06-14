/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, SlidersHorizontal, RefreshCw, Download, Image as ImageIcon, X, Loader2 } from 'lucide-react';
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
        if (extIntensity > 0 && dist > 1) {
            ctx.save();
            ctx.globalAlpha = 1.0;
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const tx = dx * t;
                const ty = dy * t;
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(bx + p1.x + tx, by + p1.y + ty);
                ctx.lineTo(bx + p2.x + tx, by + p2.y + ty);
                ctx.lineTo(bx + p3.x + tx, by + p3.y + ty);
                if (isQuad) ctx.lineTo(bx + p4.x + tx, by + p4.y + ty);
                ctx.closePath();
                ctx.clip();
                
                // Draw the original image shifted to simulate stretched pixels
                ctx.drawImage(glitchSource, bx, by, bw, bh, bx + tx, by + ty, bw, bh);
                ctx.restore();
            }
            ctx.restore();
        }

        // Final Displaced Fragment at the end of the extrusion
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx + p1.x + dx, by + p1.y + dy);
        ctx.lineTo(bx + p2.x + dx, by + p2.y + dy);
        ctx.lineTo(bx + p3.x + dx, by + p3.y + dy);
        if (isQuad) ctx.lineTo(bx + p4.x + dx, by + p4.y + dy);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(glitchSource, bx, by, bw, bh, bx + dx, by + dy, bw, bh);
        
        if (chaosFactor > 0.2) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(random() * 0.15 * chaosFactor).toFixed(3)})`;
            ctx.fill();
        }
        ctx.restore();
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
      className="min-h-screen bg-[#ffffff] text-[#1a1a1a] font-sans flex flex-col relative"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {originalImage && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-10 z-50 w-[200px] flex flex-col items-stretch text-[#1a1a1a] pointer-events-auto">
          <div className="flex flex-col gap-0">
            <div className="py-2">
              <label className="block text-[10px] uppercase tracking-[0.05em] text-[#888] mb-2 flex justify-between items-center cursor-pointer">
                Low Res Filter
                <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${params.lowResEnabled ? 'bg-black' : 'bg-gray-200'}`}>
                  <input 
                    type="checkbox" 
                    name="lowResEnabled" 
                    checked={params.lowResEnabled} 
                    onChange={handleSliderChange}
                    className="peer sr-only"
                  />
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${params.lowResEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>

            <div className="py-2">
              <label className="block text-[10px] uppercase tracking-[0.05em] text-[#888] mb-2 flex justify-between items-center cursor-pointer">
                Extrusion Effect
                <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${params.extrusionEnabled ? 'bg-black' : 'bg-gray-200'}`}>
                  <input 
                    type="checkbox" 
                    name="extrusionEnabled" 
                    checked={params.extrusionEnabled} 
                    onChange={handleSliderChange}
                    className="peer sr-only"
                  />
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${params.extrusionEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>

            <div className={`py-2 transition-opacity ${!params.extrusionEnabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <label className="block text-[10px] uppercase tracking-[0.05em] text-[#888] mb-2 flex justify-between">
                Extrusion Length <span>{params.extrusionLength}%</span>
              </label>
              <input 
                type="range" name="extrusionLength" min="0" max="100" 
                value={params.extrusionLength} onChange={handleSliderChange}
                className="theme-slider"
              />
            </div>

            <div className="py-2">
              <label className="block text-[10px] uppercase tracking-[0.05em] text-[#888] mb-2 flex justify-between">
                Glitch Fragments <span>{params.polyGlitch}</span>
              </label>
              <input 
                type="range" name="polyGlitch" min="1" max="10" 
                value={params.polyGlitch} onChange={handleSliderChange}
                className="theme-slider"
              />
            </div>

            <div className="py-2">
              <label className="block text-[10px] uppercase tracking-[0.05em] text-[#888] mb-2 flex justify-between">
                Fragment Size <span>{params.fragmentSize}%</span>
              </label>
              <input 
                type="range" name="fragmentSize" min="10" max="300" 
                value={params.fragmentSize} onChange={handleSliderChange}
                className="theme-slider"
              />
            </div>

            <div className="py-2 mb-2 pb-4">
              <label className="block text-[10px] uppercase tracking-[0.05em] text-[#888] mb-2 flex justify-between">
                Chaos & Variance <span>{params.chaos}%</span>
              </label>
              <input 
                type="range" name="chaos" min="0" max="100" 
                value={params.chaos} onChange={handleSliderChange}
                className="theme-slider"
              />
            </div>

            <div className="flex flex-col gap-3 pt-6 *:flex *:items-center *:gap-2 *:text-[10px] *:uppercase *:tracking-widest *:text-[#888] *:hover:text-[#1a1a1a] *:transition-colors *:text-left">
              <button onClick={generateSeed}>
                <RefreshCw size={12} /> Re-roll
              </button>
              <button onClick={downloadImage}>
                <Download size={12} /> Save
              </button>
              <button onClick={() => { setOriginalImage(null); }}>
                Load another photo
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow flex items-center justify-center bg-[#ffffff] relative">
        {!originalImage ? (
          <div className="w-full max-w-md h-[500px] border border-[#e5e5e5] bg-[#fafafa] flex flex-col items-center justify-center gap-6 transition-colors cursor-pointer relative group rounded-sm"
               onClick={() => document.getElementById('file-upload')?.click()}>
            <div className="p-4 bg-white rounded shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:shadow-md transition-all border border-[#f5f5f5]">
              {isModelLoading ? (
                <Loader2 size={24} className="text-[#888] animate-spin" />
              ) : (
                <ImageIcon size={24} className="text-[#888] group-hover:text-black transition-colors" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-[#1a1a1a] mb-2">Upload a Portrait</h2>
              <p className="text-[10px] uppercase tracking-[0.05em] text-[#888]">
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
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 p-4 pb-12">
            <div className="flex-1 flex items-center justify-center min-h-0 w-full relative pt-8">
              <canvas 
                ref={canvasRef}
                className="max-w-full max-h-[75vh] object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
              />
            </div>
            <button 
              onClick={downloadImage}
              className="text-[#888] hover:text-[#1a1a1a] text-xs uppercase tracking-[0.1em] transition-colors"
            >
              Confirm
            </button>
            <div className="absolute bottom-6 right-8 text-[10px] text-[#bbb] tracking-[0.1em] pointer-events-none uppercase hidden sm:block">ALGORITHM: LINEAR_WARP_GAUSSIAN</div>
          </div>
        )}
      </main>
    </div>
  );
}
