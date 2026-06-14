/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  friction: number;
  history: {x: number, y: number}[];
  maxHistory: number;
  phaseOffset: number;
  homeX: number;
  homeY: number;
  alphaMult: number;

  constructor(hx: number, hy: number, index: number, total: number) {
    this.homeX = hx;
    this.homeY = hy;
    this.x = hx;
    this.y = hy;
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.94;
    this.history = [];
    this.maxHistory = 60; // Scia lunga
    this.phaseOffset = (index / total) * Math.PI * 2;
    this.alphaMult = 1.0;
    
    // Riempiamo la storia iniziale per non avere scie che crescono brutalmente da 0
    for (let i = 0; i < this.maxHistory; i++) {
        this.history.push({x: hx, y: hy});
    }
  }

  update(mouseX: number, mouseY: number, mouseActive: boolean, globalStrength: number, cw: number, ch: number, checkCollision: (x: number, y: number) => boolean, time: number) {
    // Rendiamo l'oscillazione dipendente da phaseOffset per evitare che tutte vengano attratte insieme
    const osc = Math.sin(time * 0.5 + this.phaseOffset); 
    const isAttracting = mouseActive && osc > 0;
    let speedLimit = 25.3; // 22 * 1.15
    
    // Dissolvenza dell'opacità quando vicine al cursore (per evitare nodo nero)
    const dxM = mouseX - this.x;
    const dyM = mouseY - this.y;
    const trueMouseDist = Math.sqrt(dxM * dxM + dyM * dyM);
    if (mouseActive) {
       this.alphaMult = Math.min(1.0, Math.max(0.1, (trueMouseDist - 30) / 40.0)); // Svanisce fino al 10% in un raggio di 30px
    } else {
       this.alphaMult = Math.min(1.0, this.alphaMult + 0.02); // Ritorna visibile gradualmente
    }
    
    if (isAttracting) {
      // Fase positiva: Contrazione diretta verso il mouse con movimenti oscillatori (raggio 20)
      let orbitSpeed = 1.725; // 1.5 * 1.15
      if (trueMouseDist < 50) {
         orbitSpeed = 0.575; // 0.5 * 1.15 (Movimenti oscillatori più lenti quando sono vicini)
         speedLimit = Math.max(1.725, 25.3 * (trueMouseDist / 50)); // Abbassa il limite di velocità proporzionalmente
      }
      
      const targetMouseX = mouseX + Math.cos(time * orbitSpeed + this.phaseOffset) * 20;
      const targetMouseY = mouseY + Math.sin(time * orbitSpeed + this.phaseOffset) * 20;
      
      const dx = targetMouseX - this.x;
      const dy = targetMouseY - this.y;
      const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      
      const force = (osc * 690) / (distance + 50); // 600 * 1.15 = 690
      const slowDown = trueMouseDist < 50 ? Math.max(0.1, trueMouseDist / 50) : 1.0;

      this.vx += (dx / distance) * force * slowDown;
      this.vy += (dy / distance) * force * slowDown;

      // Freno intenso addizionale quando nell'orbita del cursore
      if (trueMouseDist < 40) {
          this.vx *= 0.75;
          this.vy *= 0.75;
      }
    } else {
      // Fase negativa: Ritorno a casa fluido e libero (diagonali organiche)
      const dxH = this.homeX - this.x;
      const dyH = this.homeY - this.y;
      const distH = Math.sqrt(dxH * dxH + dyH * dyH);

      if (distH > 0.5) {
          const returnForce = (Math.abs(Math.min(0, osc)) * 1.5 + 0.2); 
          
          const dirX = dxH / distH;
          const dirY = dyH / distH;
          
          // Nessun arco se troppo vicini a casa per evitare oscillazioni
          const distanceFade = Math.max(0, Math.min(1.0, (distH - 50) / 100.0));
          const crossForce = Math.sin(distH * 0.005 + this.phaseOffset) * 0.8 * distanceFade;
          
          const flowX = dirX + -dirY * crossForce;
          const flowY = dirY + dirX * crossForce;
          
          const flowMag = Math.max(0.0001, Math.sqrt(flowX * flowX + flowY * flowY));

          // Se vicini a casa, limitiamo la forza addizionale per evitare di sorpassare
          const proximityFactor = Math.min(1.0, distH / 30.0);

          this.vx += (flowX / flowMag) * returnForce * 2.875 * proximityFactor; // 2.5 * 1.15 = 2.875
          this.vy += (flowY / flowMag) * returnForce * 2.875 * proximityFactor;

          // Aggiungiamo smorzamento se molto vicini
          if (distH < 30) {
              this.vx *= 0.8;
              this.vy *= 0.8;
          }
      } else {
          // Ferme e immobili quando raggiungono casa, niente oscillazioni
          this.vx = 0;
          this.vy = 0;
          this.x = this.homeX;
          this.y = this.homeY;
      }
    }

    this.vx *= this.friction;
    this.vy *= this.friction;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > speedLimit) {
      this.vx = (this.vx / speed) * speedLimit;
      this.vy = (this.vy / speed) * speedLimit;
    }

    if (speed < 0.05) {
      this.vx = 0;
      this.vy = 0;
    }

    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    // Collisione con il logo (Corpo rigido)
    if (checkCollision(nextX, nextY)) {
      let nx = 0, ny = 0;
      const step = 4;
      if (checkCollision(this.x + step, this.y)) nx -= 1;
      if (checkCollision(this.x - step, this.y)) nx += 1;
      if (checkCollision(this.x, this.y + step)) ny -= 1;
      if (checkCollision(this.x, this.y - step)) ny += 1;

      if (nx === 0 && ny === 0) {
         nx = this.x - (cw / 2);
         ny = this.y - (ch / 2);
      }
      
      const normalAngle = Math.atan2(ny, nx);
      const targetAngle = isAttracting 
          ? Math.atan2(mouseY - this.y, mouseX - this.x)
          : Math.atan2(this.homeY - this.y, this.homeX - this.x);
      
      const t1 = normalAngle + Math.PI / 2;
      const t2 = normalAngle - Math.PI / 2;
      const dot1 = Math.cos(t1 - targetAngle);
      const dot2 = Math.cos(t2 - targetAngle);
      const targetTangent = dot1 > dot2 ? t1 : t2;

      // Scivolamento senza rimbalzi
      this.vx = Math.cos(targetTangent) * speed;
      this.vy = Math.sin(targetTangent) * speed;
      
      let escapeTries = 0;
      while (checkCollision(this.x, this.y) && escapeTries < 20) {
         this.x += Math.cos(normalAngle) * 2;
         this.y += Math.sin(normalAngle) * 2;
         escapeTries++;
      }
      
      if (!checkCollision(this.x + this.vx, this.y + this.vy)) {
         this.x += this.vx;
         this.y += this.vy;
      } else {
         this.x += Math.cos(normalAngle) * speed;
         this.y += Math.sin(normalAngle) * speed;
         this.vx = Math.cos(normalAngle) * speed;
         this.vy = Math.sin(normalAngle) * speed;
      }
      
    } else {
      this.x = nextX;
      this.y = nextY;
    }

    // Costringi nei bounds rigidamente (no wrap)
    if (this.x <= 0) { this.x = 0; this.vx = 0; }
    if (this.x >= cw) { this.x = cw; this.vx = 0; }
    if (this.y <= 0) { this.y = 0; this.vy = 0; }
    if (this.y >= ch) { this.y = ch; this.vy = 0; }

    const lastP = this.history[0];
    const dxH2 = lastP ? this.x - lastP.x : 0;
    const dyH2 = lastP ? this.y - lastP.y : 0;
    const distH2 = Math.sqrt(dxH2 * dxH2 + dyH2 * dyH2);

    if (!lastP || distH2 > 0.1) {
      this.history.unshift({ x: this.x, y: this.y });
      if (this.history.length > this.maxHistory) {
        this.history.pop();
      }
    } else {
      // Se fermo, consuma la coda dolcemente (non farla sparire tutta di botto)
      if (this.history.length > 0) {
        this.history[0] = { x: this.x, y: this.y };
      }
      // Accorciamo la coda lentamente per effetto smooth
      if (this.history.length > 1) {
        this.history.pop();
      }
    }
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let particles: Particle[] = [];
    const numParticles = 100;
    let animationFrameId: number;
    let img = new Image();
    
    // Mask data for collisions
    let logoMaskData: Uint8ClampedArray | null = null;
    let maskWidth = 0;
    let maskHeight = 0;
    
    // Default mouse near center
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };

    const computeMask = () => {
      const cw = Math.max(1, canvas.width);
      const ch = Math.max(1, canvas.height);
      const iw = Math.max(1, img.width);
      const ih = Math.max(1, img.height);

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offscreen.width = cw;
      offscreen.height = ch;

      // Draw SVG centered
      const scale = Math.min(cw / iw, ch / ih) * 0.34;
      const w = iw * scale;
      const h = ih * scale;
      const x = cw / 2 - w / 2;
      const y = ch / 2 - h / 2;

      // Draw image
      offCtx.clearRect(0, 0, cw, ch);
      offCtx.drawImage(img, x, y, w, h);

      try {
        const imageData = offCtx.getImageData(0, 0, cw, ch);
        logoMaskData = imageData.data;
        maskWidth = cw;
        maskHeight = ch;
      } catch (err) {
        console.error(err);
      }
    };
    
    const checkCollision = (x: number, y: number) => {
      if (!logoMaskData) return false;
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || px >= maskWidth || py < 0 || py >= maskHeight) return false;
      
      const alpha = logoMaskData[(py * maskWidth + px) * 4 + 3];
      return alpha > 50; 
    };

    // Set the particles array FIRST so setCanvasSize can update them
    for (let i = 0; i < numParticles; i++) {
        // Will set proper home coordinates inside setCanvasSize
        particles.push(new Particle(0, 0, i, numParticles));
    }

    const setCanvasSize = () => {
      canvas.width = Math.max(1, window.innerWidth);
      canvas.height = Math.max(1, window.innerHeight);
      
      if (img.complete && img.naturalWidth > 0) {
        computeMask();
      }

      // Adatta la posizione di partenza al perimetro attuale
      const perimeter = 2 * (canvas.width + canvas.height);
      particles.forEach((p, i) => {
          const d = (i / numParticles) * perimeter;
          let hx = 0, hy = 0;
          if (d <= canvas.width) { hx = d; hy = 0; }
          else if (d <= canvas.width + canvas.height) { hx = canvas.width; hy = d - canvas.width; }
          else if (d <= 2 * canvas.width + canvas.height) { hx = canvas.width - (d - (canvas.width + canvas.height)); hy = canvas.height; }
          else { hx = 0; hy = canvas.height - (d - (2 * canvas.width + canvas.height)); }
          
          p.homeX = hx;
          p.homeY = hy;
          
          // Se la particella non è mai stata mossa (es. inizializzazione vera), mettila in posizione
          if (p.x === 0 && p.y === 0 && p.vx === 0 && p.vy === 0) {
              p.x = hx;
              p.y = hy;
              p.history = [];
              for (let j = 0; j < p.maxHistory; j++) {
                  p.history.push({x: hx, y: hy});
              }
          }
      });
    };
    
    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    img.src = '/logo_folt_definitivo.svg'; 
    
    img.onload = () => {
      computeMask();
      
      // I punti di origine (home) sono sui bordi, quindi non spawnano mai nel logo. Rimossa la randomizzazione.
      
      setLoaded(true);
      if (!animationFrameId) startAnimation();
    };
    
    img.onerror = () => {
      setErrorInfo("File '/logo_folt_definitivo.svg' non trovato. Caricalo nella cartella public.");
      setLoaded(true); 
      if (!animationFrameId) startAnimation();
    }

    const startAnimation = () => {
      const render = () => {
         const time = Date.now() * 0.001 * 1.2; 
         const strength = Math.sin(time);

         ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; 
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         ctx.lineCap = 'round';
         ctx.lineJoin = 'round';

         for (const p of particles) {
             p.update(mouse.x, mouse.y, mouse.active, strength, canvas.width, canvas.height, checkCollision, time);
         }

         for (const p of particles) {
             ctx.fillStyle = `rgba(17, 17, 17, ${0.4 * p.alphaMult})`;
             ctx.beginPath();
             ctx.arc(p.x, p.y, 0.125, 0, Math.PI * 2);
             ctx.fill();
         }

         // Curve quadratiche simulative di curveVertex() per scie fluide
         const maxHistoryLen = 60;
         const alphaLevels = [0.1, 0.3, 0.5, 0.7, 1.0];
         
         const buckets: Particle[][] = [[], [], [], [], []];
         for (const p of particles) {
             let pBucket = 4;
             if (p.alphaMult < 0.2) pBucket = 0;
             else if (p.alphaMult < 0.4) pBucket = 1;
             else if (p.alphaMult < 0.6) pBucket = 2;
             else if (p.alphaMult < 0.8) pBucket = 3;
             buckets[pBucket].push(p);
         }

         ctx.lineWidth = 0.1; // Traccia ultra sottile
         
         for (let bucketIdx = 0; bucketIdx < 5; bucketIdx++) {
             const bucketParticles = buckets[bucketIdx];
             if (bucketParticles.length === 0) continue;
             
             const aLevel = alphaLevels[bucketIdx];
             
             for (let i = 0; i < maxHistoryLen - 2; i++) {
                 const ratio = 1 - (i / maxHistoryLen); // 1 alla testa, 0 alla coda
                 let hasStartedPath = false;
                 
                 ctx.strokeStyle = `rgba(17, 17, 17, ${ratio * 0.25 * aLevel})`;
                 ctx.beginPath();
                 
                 for (const p of bucketParticles) {
                     if (i < p.history.length - 2) {
                         const p0 = p.history[i];
                         const p1 = p.history[i + 1];
                         const p2 = p.history[i + 2];
                         
                         // Quadratic curve between midpoints makes it perfectly smooth
                         const startX = (p0.x + p1.x) / 2;
                         const startY = (p0.y + p1.y) / 2;
                         const endX = (p1.x + p2.x) / 2;
                         const endY = (p1.y + p2.y) / 2;
    
                         ctx.moveTo(startX, startY);
                         ctx.quadraticCurveTo(p1.x, p1.y, endX, endY);
                         hasStartedPath = true;
                     }
                 }
                 
                 if (hasStartedPath) {
                     ctx.stroke();
                 }
             }
         }

         animationFrameId = requestAnimationFrame(render);
      };
      
      render();
    };

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#ffffff] font-['Helvetica_Neue',Arial,sans-serif] cursor-crosshair select-none">
       <canvas ref={canvasRef} className="absolute inset-0 z-[1] block w-full h-full" />
       
       <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none">
         {/* Diagnostic overlays */}
         {!loaded && !errorInfo && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                <span className="animate-pulse text-[#aaaaaa] text-[10px] uppercase tracking-[0.3em] font-semibold">Inizializzazione particelle...</span>
             </div>
         )}
         {errorInfo && (
             <div className="absolute inset-x-0 top-0 p-4 bg-red-100 text-red-700 text-center">
                {errorInfo}
             </div>
         )}
         
         <div className="absolute bottom-10 w-full text-center text-[10px] uppercase tracking-[0.3em] text-[#aaaaaa] font-semibold pointer-events-none">
            Fluid Dynamics &bull; Harmonic Oscillation
         </div>
       </div>
    </div>
  );
}

