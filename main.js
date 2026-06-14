// Main navigation, page switching, and viewport scaling logic for FØLT magazine website
import { initInteractiveParticles } from './particles.js';
import { initVirusAttack } from './virus.js';
import lottie from 'lottie-web';
import animationData from './circular.input.json';

// Error banner logger for debugging
window.addEventListener('error', (e) => {
  const banner = document.getElementById('debug-error-banner');
  if (banner) return; // avoid duplicate banners
  const errorBanner = document.createElement('div');
  errorBanner.id = 'debug-error-banner';
  errorBanner.style.position = 'fixed';
  errorBanner.style.top = '10px';
  errorBanner.style.left = '10px';
  errorBanner.style.background = 'red';
  errorBanner.style.color = 'white';
  errorBanner.style.padding = '20px';
  errorBanner.style.zIndex = '1000000';
  errorBanner.style.fontFamily = 'monospace';
  errorBanner.style.fontSize = '14px';
  errorBanner.style.whiteSpace = 'pre-wrap';
  errorBanner.style.maxHeight = '90vh';
  errorBanner.style.overflow = 'auto';
  errorBanner.style.pointerEvents = 'auto';
  errorBanner.innerHTML = `Error: ${e.message}<br>at ${e.filename}:${e.lineno}:${e.colno}`;
  document.body.appendChild(errorBanner);
});

document.addEventListener('DOMContentLoaded', () => {
  // Initialize virus attack if it's the first visit
  initVirusAttack();

  // Safe helper to get scroll position across different browsers
  function getScrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  // Elements
  const body = document.body;
  const pageViews = document.querySelectorAll('.page-view');
  const canvasElement = document.getElementById('particles-bg-canvas');
  let isProgrammaticScrolling = false;
  let isLocked = false;
  let isReleasing = null;
  let releaseTargetScrollY = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let targetScrollY = 0;
  let lastScrollY = getScrollTop();
  
  // Nav Links
  const headerLogoBtn = document.getElementById('header-logo-btn');
  const navCommunity = document.getElementById('nav-community');
  const navAbout = document.getElementById('nav-about');
  const navShop = document.getElementById('nav-shop');
  
  // Custom Actions
  const buyButton = document.getElementById('buy-button');
  
  // Shipping Conditional UI Elements
  const checkHome = document.getElementById('check-home');
  const checkPickup = document.getElementById('check-pickup');
  const rowHome = document.getElementById('row-home');
  const rowPickup = document.getElementById('row-pickup');
  const addressBlock = document.getElementById('checkout-address-block');

  // --- Dynamic Viewport Canvas Scaling Logic ---
  function resizeCanvas() {
    const containers = document.querySelectorAll('.canvas-container, .header-content-inner');
    containers.forEach(container => {
      const originalWidth = parseFloat(container.dataset.originalWidth) || 1728;
      const originalHeight = parseFloat(container.dataset.originalHeight) || (container.classList.contains('header-content-inner') ? 92.53 : 7022);
      
      // Calculate scale factor to fit current window size
      const scale = window.innerWidth / originalWidth;
      
      if (window.innerWidth < originalWidth) {
        container.style.transform = `scale(${scale})`;
        if (!container.classList.contains('header-content-inner')) {
          container.parentElement.style.height = `${originalHeight * scale}px`;
          container.parentElement.style.width = `${window.innerWidth}px`;
          container.parentElement.style.overflow = 'hidden';
        } else {
          container.parentElement.style.height = `${originalHeight * scale}px`;
        }
      } else {
        container.style.transform = 'none';
        if (!container.classList.contains('header-content-inner')) {
          container.parentElement.style.height = 'auto';
          container.parentElement.style.width = '100%';
          container.parentElement.style.overflow = 'visible';
        } else {
          container.parentElement.style.height = '92.53px';
        }
      }
    });
    
    if (typeof calculateTargetScroll === 'function') {
      calculateTargetScroll();
    }
    updateCanvasVisibility();
  }

  // Trigger resize on load, resize, and orientationchange
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  // Also trigger after a short delay to make sure styles are fully calculated
  setTimeout(resizeCanvas, 100);

  // --- Interactive Particles State ---
  function updateCanvasVisibility() {
    if (!canvasElement) return;
    const isPrimaryActive = document.getElementById('primary-page').classList.contains('active');
    
    if (!isPrimaryActive) {
      canvasElement.style.opacity = '0';
      return;
    }

    const scrollY = getScrollTop();
    const originalWidth = 1728;
    const scale = window.innerWidth < originalWidth ? (window.innerWidth / originalWidth) : 1;

    // Define fade bounds
    const fadeStartIn = 300 * scale;
    const fadeEndIn = 900 * scale;
    
    // The black background starts at 5952px
    const blackSectionTop = 5952 * scale;
    const fadeEndOut = blackSectionTop - window.innerHeight;
    const fadeStartOut = fadeEndOut - 500;

    let opacity = 0;

    if (scrollY < fadeStartIn) {
      opacity = 0;
    } else if (scrollY >= fadeStartIn && scrollY <= fadeEndIn) {
      opacity = (scrollY - fadeStartIn) / (fadeEndIn - fadeStartIn);
    } else if (scrollY > fadeEndIn && scrollY < fadeStartOut) {
      opacity = 1;
    } else if (scrollY >= fadeStartOut && scrollY <= fadeEndOut) {
      opacity = 1 - (scrollY - fadeStartOut) / (fadeEndOut - fadeStartOut);
    } else {
      opacity = 0;
    }

    opacity = Math.max(0, Math.min(1, opacity));
    canvasElement.style.opacity = opacity;
  }

  // Initialize Particles Background
  if (canvasElement) {
    try {
      initInteractiveParticles(canvasElement);
      updateCanvasVisibility();
    } catch (err) {
      console.error("Particles background engine failed to initialize:", err);
    }
  }

  // --- Page Switcher ---
  function switchPage(pageId) {
    let bodyAttrValue = 'primary';
    if (pageId === 'about-page') bodyAttrValue = 'about';
    else if (pageId === 'community-page') bodyAttrValue = 'community';
    else if (pageId === 'checkout-page') bodyAttrValue = 'checkout';

    body.setAttribute('data-page', bodyAttrValue);



    pageViews.forEach(view => {
      if (view.id === pageId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Run scaling calculations for the newly showing page canvas
    resizeCanvas();

    // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Update particles visibility
    updateCanvasVisibility();
  }

  // --- Navigation Event Listeners ---

  // Helper to scroll programmatically while bypassing scroll lock
  function startProgrammaticScroll(targetY, options = { behavior: 'smooth' }) {
    isProgrammaticScrolling = true;
    window.scrollTo({ top: targetY, ...options });
    
    let scrollTimeout;
    const checkScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isProgrammaticScrolling = false;
        window.removeEventListener('scroll', checkScrollEnd);
      }, 100);
    };
    window.addEventListener('scroll', checkScrollEnd);
  }

  // Logo: return to top of primary page
  headerLogoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage('primary-page');
    startProgrammaticScroll(0);
  });

  // About Click
  navAbout.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage('about-page');
  });

  // Community Click
  navCommunity.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage('community-page');
  });

  // Shop Click: switch to primary page and scroll to order issue section
  navShop.addEventListener('click', (e) => {
    e.preventDefault();
    
    const isAlreadyPrimary = document.getElementById('primary-page').classList.contains('active');
    
    if (!isAlreadyPrimary) {
      switchPage('primary-page');
      setTimeout(scrollToBuyButton, 100);
    } else {
      scrollToBuyButton();
    }
  });

  function scrollToBuyButton() {
    const buyBtn = document.getElementById('buy-button');
    if (buyBtn) {
      // Calculate scaled position of the buy button
      const rect = buyBtn.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop - 150; // offset a bit for padding
      startProgrammaticScroll(targetY);
    }
  }

  // Buy Button at bottom of primary page
  if (buyButton) {
    buyButton.addEventListener('click', () => {
      switchPage('checkout-page');
    });
  }

  // --- Checkout Shipping UI Toggle Logic ---
  if (checkHome && checkPickup && addressBlock) {
    const selectMethod = (method) => {
      if (method === 'home') {
        checkHome.classList.add('checked');
        checkPickup.classList.remove('checked');
        addressBlock.style.display = 'flex';
        addressBlock.querySelectorAll('input').forEach(input => input.required = true);
      } else {
        checkHome.classList.remove('checked');
        checkPickup.classList.add('checked');
        addressBlock.style.display = 'none';
        addressBlock.querySelectorAll('input').forEach(input => input.required = false);
      }
      // Re-trigger viewport scaling to adjust parent height dynamically if form grows/shrinks
      resizeCanvas();
    };

    rowHome.addEventListener('click', () => selectMethod('home'));
    rowPickup.addEventListener('click', () => selectMethod('pickup'));

    // Initial state
    selectMethod('home');
  }

  // --- Lottie Animation and Scroll Pinning / Scrubbing logic ---
  let anim = null;
  const lottieContainer = document.getElementById('circular-input');
  if (lottieContainer) {
    anim = lottie.loadAnimation({
      container: lottieContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet'
      }
    });
    anim.addEventListener('DOMLoaded', () => {
      updateAnimation(0);
    });
  }

  let tickId = null;
  let lockScrollY = 0;

  function updateAnimation(progress) {
    if (!anim) return;

    // Scrub the Lottie timeline
    const totalFrames = anim.totalFrames;
    anim.goToAndStop(progress * (totalFrames - 1), true);
  }

  // Interpolation loop to make scrubbing extremely smooth, fluid, and harmonic
  function tick() {
    const diff = targetProgress - currentProgress;

    // Smooth scroll pinning transition / Release slide
    if (isReleasing) {
      const scrollDiff = releaseTargetScrollY - lockScrollY;
      if (Math.abs(scrollDiff) > 0.5) {
        lockScrollY += scrollDiff * 0.08; // very gentle exit slide out
        window.scrollTo(0, lockScrollY);
      } else {
        lockScrollY = releaseTargetScrollY;
        window.scrollTo(0, releaseTargetScrollY);
        document.documentElement.style.overflow = '';
        isLocked = false;
        isReleasing = null;
        tickId = null; // stop tick loop
        return;
      }
    } else if (isLocked) {
      const scrollDiff = targetScrollY - lockScrollY;
      if (Math.abs(scrollDiff) > 0.5) {
        lockScrollY += scrollDiff * 0.12; // smooth slide to center
        window.scrollTo(0, lockScrollY);
      } else {
        lockScrollY = targetScrollY;
        window.scrollTo(0, targetScrollY);
      }
    }

    if (Math.abs(diff) < 0.0001) {
      currentProgress = targetProgress;
      updateAnimation(currentProgress);

      // Stop the tick loop if centering is also finished
      if (!isLocked || Math.abs(targetScrollY - lockScrollY) <= 0.5) {
        tickId = null; // stop tick loop
      }
    } else {
      // Ease factor 0.06 makes the movement slow, elegant, and fluid
      currentProgress += diff * 0.06;
      updateAnimation(currentProgress);
    }

    tickId = requestAnimationFrame(tick);
  }

  function startTick() {
    if (!tickId) {
      tickId = requestAnimationFrame(tick);
    }
  }

  // Calculate target scroll position where the composition is centered
  function calculateTargetScroll() {
    const container = document.querySelector('.container-generale');
    const canvasContainer = document.querySelector('.canvas-container.primary-canvas');
    if (!container || !canvasContainer) return;

    const originalWidth = 1728;
    const scale = window.innerWidth < originalWidth ? (window.innerWidth / originalWidth) : 1;

    const rawTop = container.offsetTop;
    const rawHeight = container.offsetHeight;
    const rawCenterY = rawTop + rawHeight / 2;

    const actualCenterY = rawCenterY * scale;
    targetScrollY = actualCenterY - window.innerHeight / 2;
  }

  // Initialize and calculate on events
  calculateTargetScroll();
  window.addEventListener('resize', calculateTargetScroll);
  window.addEventListener('orientationchange', calculateTargetScroll);

  // Helper to handle scrubbing delta
  function handleScrub(deltaY) {
    // Slowed down further by 200% -> sensitivity = 0.00025 (requires 40 clicks to complete)
    const sensitivity = 0.00025;

    // Check if we reverse direction while releasing
    if (isReleasing === 'down' && deltaY < 0) {
      isReleasing = null;
      isLocked = true;
      document.documentElement.style.overflow = 'hidden';
    } else if (isReleasing === 'up' && deltaY > 0) {
      isReleasing = null;
      isLocked = true;
      document.documentElement.style.overflow = 'hidden';
    }

    if (!isReleasing) {
      targetProgress += deltaY * sensitivity;
      targetProgress = Math.max(0, Math.min(1, targetProgress));

      // If targetProgress crosses boundaries, prepare release
      if (targetProgress >= 1) {
        targetProgress = 1;
        isReleasing = 'down';
        releaseTargetScrollY = targetScrollY + 60; // 60px gentle exit slide
      } else if (targetProgress <= 0) {
        targetProgress = 0;
        isReleasing = 'up';
        releaseTargetScrollY = targetScrollY - 60; // 60px gentle exit slide
      } else {
        isLocked = true;
      }
    }

    startTick();
  }

  // Handle wheel events when locked
  window.addEventListener('wheel', (e) => {
    if (isLocked) {
      e.preventDefault();
      handleScrub(e.deltaY);
    }
  }, { passive: false });

  // Handle touch events on mobile when locked
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (isLocked) {
      e.preventDefault();
      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY; // positive delta means drag up -> scroll down
        touchStartY = currentY;
        handleScrub(deltaY * 0.4); // touch swipe sensitivity slowed down proportionally
      }
    }
  }, { passive: false });

  // Keyboard scroll navigation prevention & scrubbing
  const scrollKeys = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 37: 1, 38: 1, 39: 1, 40: 1 };
  window.addEventListener('keydown', (e) => {
    if (isLocked && scrollKeys[e.keyCode]) {
      e.preventDefault();

      let delta = 0;
      if (e.keyCode === 40 || e.keyCode === 32 || e.keyCode === 34) { // Down, Space, PageDown
        delta = 100; // triggers exactly one 0.05 progress increment
      } else if (e.keyCode === 38 || e.keyCode === 33) { // Up, PageUp
        delta = -100;
      }

      if (delta !== 0) {
        handleScrub(delta);
      }
    }
  }, { passive: false });

  // Intercept window scroll event to trigger locks
  window.addEventListener('scroll', () => {
    updateCanvasVisibility();

    const currentScrollY = getScrollTop();
    const isPrimaryActive = document.getElementById('primary-page').classList.contains('active');

    if (!isPrimaryActive || isProgrammaticScrolling) {
      lastScrollY = currentScrollY;
      return;
    }

    if (isLocked) {
      return; // Do nothing, let the tick loop programmatically control scroll
    }

    calculateTargetScroll();

    // Check if we crossed the targetScrollY position
    const crossedDown = lastScrollY < targetScrollY && currentScrollY >= targetScrollY;
    const crossedUp = lastScrollY > targetScrollY && currentScrollY <= targetScrollY;

    // Lock scroll and snap only if we cross and have progress to run
    if (crossedDown && targetProgress < 1) {
      isLocked = true;
      lockScrollY = currentScrollY;
      document.documentElement.style.overflow = 'hidden';
      targetProgress = 0;
      currentProgress = 0;
      updateAnimation(currentProgress);
      startTick();
    } else if (crossedUp && targetProgress > 0) {
      isLocked = true;
      lockScrollY = currentScrollY;
      document.documentElement.style.overflow = 'hidden';
      targetProgress = 1;
      currentProgress = 1;
      updateAnimation(currentProgress);
      startTick();
    }

    lastScrollY = getScrollTop();
  });

});
