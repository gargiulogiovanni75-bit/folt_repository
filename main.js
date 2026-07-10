// Main navigation, page switching, and viewport scaling logic for FØLT magazine website
import { initInteractiveParticles } from './particles.js';
import { initVirusAttack } from './virus.js';
import lottie from 'lottie-web';
import Lenis from 'lenis';
import animationData from './circular.input.json';
import orderConfirmedAnimationDataRaw from './ORDER_CONFIRMED_UPDATED.json';

// Hide the static 'testi', 'Text Shape' (JOIN THE COMMUNITY), and 'Text Shape 3' (FOLT) layers from the order confirmed animation so we can overlay real HTML buttons
const orderConfirmedAnimationData = JSON.parse(JSON.stringify(orderConfirmedAnimationDataRaw));
if (orderConfirmedAnimationData && orderConfirmedAnimationData.layers) {
  const testiLayer = orderConfirmedAnimationData.layers.find(l => l.nm === 'testi');
  if (testiLayer) {
    testiLayer.ks = testiLayer.ks || {};
    testiLayer.ks.o = { a: 0, k: 0 }; // Set opacity to 0
  }
  const textShapeLayer = orderConfirmedAnimationData.layers.find(l => l.nm === 'Text Shape');
  if (textShapeLayer) {
    textShapeLayer.ks = textShapeLayer.ks || {};
    textShapeLayer.ks.o = { a: 0, k: 0 }; // Set opacity to 0
  }
  const textShape3Layer = orderConfirmedAnimationData.layers.find(l => l.nm === 'Text Shape 3');
  if (textShape3Layer) {
    textShape3Layer.ks = textShape3Layer.ks || {};
    textShape3Layer.ks.o = { a: 0, k: 0 }; // Set opacity to 0
  }

  // Set the animation out-point to frame 28 so it loops continuously on the portrait sequence
  orderConfirmedAnimationData.op = 28;
  orderConfirmedAnimationData.h = 1080; // Revert canvas height to 1080
  const mainComp = orderConfirmedAnimationData.layers.find(l => l.ind === 1);
  if (mainComp) {
    mainComp.op = 28;
    // Composition 2 remains at position (0,0) and scale 100% so that "ORDER CONFIRMED" and "Check your email" texts are positioned correctly.
  }

  // Hide Lottie "ORDER CONFIRMED" title (Text Shape 2) so we can draw it as an HTML element
  const textShape2Layer = orderConfirmedAnimationData.layers.find(l => l.nm === 'Text Shape 2');
  if (textShape2Layer) {
    textShape2Layer.ks = textShape2Layer.ks || {};
    textShape2Layer.ks.o = { a: 0, k: 0 }; // Hide Lottie text shape
  }

  // Hide Lottie "Check your email for more details" subtitle (Text Shape 4) so we can draw it as an HTML element
  const textShape4Layer = orderConfirmedAnimationData.layers.find(l => l.nm === 'Text Shape 4');
  if (textShape4Layer) {
    textShape4Layer.ks = textShape4Layer.ks || {};
    textShape4Layer.ks.o = { a: 0, k: 0 }; // Hide Lottie subtitle shape
  }

  // Hide Lottie "upload your portrait / manipulate it" subtitle (Text Shape 16) so we can draw it as an HTML element
  const textShape16Layer = orderConfirmedAnimationData.layers.find(l => l.nm === 'Text Shape 16');
  if (textShape16Layer) {
    textShape16Layer.ks = textShape16Layer.ks || {};
    textShape16Layer.ks.o = { a: 0, k: 0 }; // Hide Lottie upload shape
  }

  // Center and scale the portraits individually, and adjust the name shape coordinates
  const centerX = -138.08;
  const centerY = -608.12;
  const targetX = 960;
  const targetY = 540;          // Revert Center Y to 540 for the 1080px tall canvas
  const layoutScale = 1.0;      // Proportions at 100% spread
  const portraitScale = 1.0;    // Portrait image size at 100%

  orderConfirmedAnimationData.layers.forEach(l => {
    // ty: 2 is image layers (portraits) parented to Composition 1 (Composition 2 in new json, parent is 1)
    if (l.ty === 2 && l.parent === 1) {
      if (l.ks && l.ks.p) {
        if (l.ks.p.x && typeof l.ks.p.x.k === 'number') {
          l.ks.p.x.k = targetX + (l.ks.p.x.k - centerX) * layoutScale;
          if (l.nm === 'michela_portrait') {
            l.ks.p.x.k -= 40; // Shift left by 40px
          } else if (l.nm === 'caterina_portrait') {
            l.ks.p.x.k -= 20; // Shift left by 20px
          } else if (l.nm === 'giovanni_portrait') {
            l.ks.p.x.k -= 70; // Shift left by 70px
          } else if (l.nm === 'lorenz_portrait') {
            l.ks.p.x.k += 30; // Shift right by 30px
          }
        }
        if (l.ks.p.y && typeof l.ks.p.y.k === 'number') {
          l.ks.p.y.k = targetY + (l.ks.p.y.k - centerY) * layoutScale;
          if (l.nm === 'caterina_portrait') {
            l.ks.p.y.k -= 340; // Shift up by 340px (140px original + 200px additional)
          } else if (l.nm === 'lorenz_portrait') {
            l.ks.p.y.k -= 200; // Shift up by 200px
          } else if (l.nm === 'aurora_portrait') {
            l.ks.p.y.k -= 150; // Shift up by 150px (was -200px, shifted down by 50px)
          } else if (l.nm === 'giovanni_portrait') {
            l.ks.p.y.k -= 40; // Shift up by 40px
          }
        }
      }
      if (l.ks && l.ks.s && l.ks.s.k) {
        l.ks.s.k[0] *= portraitScale;
        l.ks.s.k[1] *= portraitScale;
      }
    }

    // ty: 4 is shape layers (text outlines for names) parented to portrait layers
    if (l.ty === 4 && l.parent && l.parent !== 1) {
      if (l.ks && l.ks.p) {
        // Convert coordinates from center-relative to top-left-relative
        if (l.ks.p.x && typeof l.ks.p.x.k === 'number') {
          l.ks.p.x.k += 1118; // Shift X to left edge of the image
        }
        if (l.ks.p.y && typeof l.ks.p.y.k === 'number') {
          l.ks.p.y.k += 1250; // Shift Y below the image frame
        }
      }
    }
  });
}

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
  let lenisInstance = null;
  let paperfacePreviousPage = 'checkout-page';
  try {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      if (lenisInstance) {
        lenisInstance.raf(time);
      }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } catch (err) {
    console.error("Lenis failed to initialize:", err);
  }

  // Initialize custom cursor
  const customCursor = document.createElement('div');
  customCursor.id = 'custom-cursor';
  customCursor.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%;">
      <path d="M11 9H20V11H11V20H9V11H0V9H9V0H11V9Z" fill="white"/>
    </svg>
  `;
  document.documentElement.appendChild(customCursor);

  window.addEventListener('mousemove', (e) => {
    customCursor.style.display = 'block';
    customCursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
  });

  document.addEventListener('mouseleave', () => {
    customCursor.style.display = 'none';
  });

  document.addEventListener('mouseenter', () => {
    customCursor.style.display = 'block';
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'iframe-mousemove') {
      const iframe = document.getElementById('paperface-iframe');
      if (iframe) {
        const rect = iframe.getBoundingClientRect();
        const parentX = rect.left + event.data.clientX;
        const parentY = rect.top + event.data.clientY;
        customCursor.style.display = 'block';
        customCursor.style.transform = `translate3d(${parentX}px, ${parentY}px, 0) translate(-50%, -50%)`;
      }
    } else if (event.data && event.data.type === 'iframe-mouseleave') {
      customCursor.style.display = 'none';
    } else if (event.data && event.data.type === 'iframe-mouseenter') {
      customCursor.style.display = 'block';
    } else if (event.data && event.data.type === 'paperface-back') {
      const iframe = document.getElementById('paperface-iframe');
      if (iframe) {
        iframe.src = 'about:blank';
      }
      switchPage(paperfacePreviousPage);
    }
  });

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
  let previousPage = 'primary-page';
  let targetProgress = 0;
  let currentProgress = 0;
  let targetScrollY = 0;
  let lastScrollY = getScrollTop();
  let isDampingActive = false;
  let virtualScrollY = 0;
  let smoothScrollY = 0;
  let programmaticScrollTarget = null;
  const SCROLL_RANGE = 180; // Scroll damping zone (ANIMATION_RANGE + 100px boundary)
  const ANIMATION_RANGE = 80; // Animation starts very close to center — component fully visible

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
      const originalHeight = parseFloat(container.dataset.originalHeight) || (container.classList.contains('header-content-inner') ? 92.53 : 6672);

      // Calculate scale factor to fit current window size
      const scale = window.innerWidth / originalWidth;

      if (window.innerWidth < originalWidth) {
        container.style.transform = `scale(${scale})`;
        if (!container.classList.contains('header-content-inner')) {
          container.parentElement.style.height = `${originalHeight * scale}px`;
          container.parentElement.style.width = `${window.innerWidth}px`;
          container.parentElement.style.overflow = container.classList.contains('order-confirmed-canvas') ? 'visible' : 'hidden';
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

    updateCanvasVisibility();
  }

  // Trigger resize on load, resize, and orientationchange
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  // Also trigger after a short delay to make sure styles are fully calculated
  setTimeout(resizeCanvas, 100);

  // --- Transparent Logo Button Resizing Logic ---
  function resizeTransparentLogoBtn() {
    const btn = document.getElementById('transparent-particles-logo-btn');
    if (!btn) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = 1036.52;
    const ih = 336.29;

    const scale = Math.min(cw / iw, ch / ih) * 0.272;
    const w = iw * scale;
    const h = ih * scale;
    const x = cw / 2 - w / 2;
    const y = ch / 2 - h / 2;

    btn.style.width = `${w}px`;
    btn.style.height = `${h}px`;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
  }

  // --- Interactive Particles State ---
  function updateCanvasVisibility() {
    if (!canvasElement) return;
    const isPrimaryActive = document.getElementById('primary-page').classList.contains('active');
    const isCheckoutActive = document.getElementById('checkout-page').classList.contains('active');

    let opacity = 0;
    if (isCheckoutActive) {
      opacity = 1;
    } else if (!isPrimaryActive) {
      opacity = 0;
    } else {
      const scrollY = getScrollTop();
      const originalWidth = 1728;
      const scale = window.innerWidth < originalWidth ? (window.innerWidth / originalWidth) : 1;

      // Define fade bounds
      const fadeStartIn = 300 * scale;
      const fadeEndIn = 900 * scale;

      if (scrollY < fadeStartIn) {
        opacity = 0;
      } else if (scrollY >= fadeStartIn && scrollY <= fadeEndIn) {
        opacity = (scrollY - fadeStartIn) / (fadeEndIn - fadeStartIn);
      } else {
        opacity = 1;
      }
    }

    opacity = Math.max(0, Math.min(1, opacity));
    canvasElement.style.opacity = opacity;

    const transparentLogoBtn = document.getElementById('transparent-particles-logo-btn');
    if (transparentLogoBtn) {
      if (opacity > 0) {
        transparentLogoBtn.style.display = 'block';
        resizeTransparentLogoBtn();
      } else {
        transparentLogoBtn.style.display = 'none';
      }
    }
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
    // Reset Lenis multipliers on page switch to ensure default scroll speed on other pages
    if (lenisInstance) {
      lenisInstance.options.wheelMultiplier = 1.0;
      lenisInstance.options.touchMultiplier = 2.0;
    }

    // Track previous page before switching
    const activePage = Array.from(pageViews).find(view => view.classList.contains('active'));
    if (activePage && activePage.id !== 'video-page') {
      previousPage = activePage.id;
    }

    let bodyAttrValue = 'primary';
    if (pageId === 'about-page') bodyAttrValue = 'about';
    else if (pageId === 'community-page') bodyAttrValue = 'community';
    else if (pageId === 'checkout-page') bodyAttrValue = 'checkout';
    else if (pageId === 'video-page') bodyAttrValue = 'video';
    else if (pageId === 'loader-page') bodyAttrValue = 'loader';
    else if (pageId === 'order-confirmed-page') bodyAttrValue = 'order-confirmed';
    else if (pageId === 'paperface-page') bodyAttrValue = 'paperface';
    else if (pageId === 'community-login-page') bodyAttrValue = 'community-login';

    body.setAttribute('data-page', bodyAttrValue);



    pageViews.forEach(view => {
      if (view.id === pageId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Initialize Lottie dynamic rendering once the page is fully active and layout is calculated
    if (pageId === 'order-confirmed-page') {
      updateOrderConfirmedDetails();
      initOrderConfirmedLottie();
    }

    // Run scaling calculations for the newly showing page canvas
    resizeCanvas();

    // Reset scroll position to top
    if (lenisInstance) {
      lenisInstance.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (pageId === 'community-page') {
      updateCommunityParallax();
    }

    // Update particles visibility
    updateCanvasVisibility();
  }

  // --- Navigation Event Listeners ---

  // Helper to scroll programmatically while bypassing scroll lock
  function startProgrammaticScroll(targetY, options = { behavior: 'smooth' }) {
    isProgrammaticScrolling = true;
    if (lenisInstance) {
      lenisInstance.scrollTo(targetY, {
        duration: options.behavior === 'instant' ? 0 : 1.2,
        immediate: options.behavior === 'instant',
        onComplete: () => {
          isProgrammaticScrolling = false;
        }
      });
    } else {
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

  // Shop Click: switch to primary page and scroll to bottom
  navShop.addEventListener('click', (e) => {
    e.preventDefault();

    const isAlreadyPrimary = document.getElementById('primary-page').classList.contains('active');

    if (!isAlreadyPrimary) {
      switchPage('primary-page');
      setTimeout(scrollToPrimaryBottom, 100);
    } else {
      scrollToPrimaryBottom();
    }
  });

  function scrollToPrimaryBottom() {
    const targetY = document.documentElement.scrollHeight;
    startProgrammaticScroll(targetY);
  }

  // Buy Button at bottom of primary page
  if (buyButton) {
    buyButton.addEventListener('click', () => {
      switchPage('checkout-page');
    });
  }

  // Order Button at bottom of login page
  const loginOrderBtn = document.getElementById('login-order-btn');
  if (loginOrderBtn) {
    loginOrderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage('checkout-page');
    });
  }

  // Back Button at top right of login page (returns to bottom of community page)
  const loginBackBtn = document.getElementById('login-back-btn');
  if (loginBackBtn) {
    loginBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage('community-page');
      setTimeout(() => {
        const targetY = document.documentElement.scrollHeight;
        startProgrammaticScroll(targetY);
      }, 100);
    });
  }

  // Hubs coordinates button to jump directly to order confirmed section
  const hubsConfirmedBtn = document.getElementById('hubs-confirmed-btn');
  if (hubsConfirmedBtn) {
    hubsConfirmedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage('order-confirmed-page');
    });
  }

  // --- Checkout Shipping UI Toggle Logic & Routing ---
  const checkoutLogoBtn = document.getElementById('checkout-logo-btn');
  if (checkoutLogoBtn) {
    checkoutLogoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage('primary-page');
      startProgrammaticScroll(0);
    });
  }

  const hubBlock = document.getElementById('checkout-hub-block');
  const summaryShipping = document.getElementById('summary-shipping');
  const summaryTotal = document.getElementById('summary-total');

  const checkoutSubmitBtn = document.querySelector('.checkout-submit-btn');

  function validateInputField(input) {
    const fieldWrapper = input.closest('.checklist-field, .address-checklist-line, .checklist-line-payment');
    if (!fieldWrapper) return true;

    const errorText = fieldWrapper.querySelector('.checkout-error-text');
    if (!errorText) return true;

    if (!input.required) {
      fieldWrapper.classList.remove('error');
      errorText.style.display = 'none';
      errorText.textContent = '';
      return true;
    }

    const value = input.value.trim();
    let errorMessage = '';

    if (!value) {
      const labelElement = fieldWrapper.querySelector('.checklist-label');
      const fieldLabel = labelElement ? labelElement.textContent : 'Field';
      errorMessage = `${fieldLabel} is required`;
    } else if (input.type === 'email' || input.id === 'input-email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        errorMessage = 'Invalid email address';
      }
    }

    if (errorMessage) {
      fieldWrapper.classList.add('error');
      errorText.textContent = errorMessage;
      errorText.style.display = 'block';
      return false;
    } else {
      fieldWrapper.classList.remove('error');
      errorText.style.display = 'none';
      errorText.textContent = '';
      return true;
    }
  }

  function clearFieldErrors(container) {
    if (!container) return;
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      const fieldWrapper = input.closest('.checklist-field, .address-checklist-line, .checklist-line-payment');
      if (fieldWrapper) {
        fieldWrapper.classList.remove('error');
        const errText = fieldWrapper.querySelector('.checkout-error-text');
        if (errText) {
          errText.style.display = 'none';
          errText.textContent = '';
        }
      }
    });
  }

  function validateCheckoutForm() {
    const isHome = checkHome && checkHome.classList.contains('checked');
    const isPickup = checkPickup && checkPickup.classList.contains('checked');
    const isCard = checkCard && checkCard.classList.contains('checked');
    const isPaypal = checkPaypal && checkPaypal.classList.contains('checked');

    if (!isHome && !isPickup) return false;
    if (!isCard && !isPaypal) return false;

    // Check personal details inputs
    const personalInputs = document.querySelectorAll('.checkout-checklist .checkout-field-input');
    for (const input of personalInputs) {
      if (!input.value.trim()) return false;
      if (input.type === 'email' || input.id === 'input-email') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(input.value.trim())) return false;
      }
    }

    // Check shipping address inputs if home delivery is checked
    if (isHome) {
      const addressInputs = document.querySelectorAll('#checkout-address-block .address-input-field');
      for (const input of addressInputs) {
        if (!input.value.trim()) return false;
      }
    }

    // Check local pickup hub selection if pickup is checked
    if (isPickup) {
      const activeHub = document.querySelector('.affiliate-hub.active');
      if (!activeHub) return false;
    }

    // Check credit card details if card payment is checked
    if (isCard) {
      const cardInputs = document.querySelectorAll('#credit-card-details .checkout-field-input');
      for (const input of cardInputs) {
        if (!input.value.trim()) return false;
      }
    }

    return true;
  }

  function updateCheckoutButtonState() {
    if (!checkoutSubmitBtn) return;
    const isValid = validateCheckoutForm();
    if (isValid) {
      checkoutSubmitBtn.classList.remove('disabled');
      checkoutSubmitBtn.disabled = false;
    } else {
      checkoutSubmitBtn.classList.add('disabled');
      checkoutSubmitBtn.disabled = true;
    }
  }

  if (checkHome && checkPickup && addressBlock && hubBlock) {
    const setCheckoutCanvasHeight = (height) => {
      const checkoutCanvas = document.querySelector('.checkout-canvas');
      if (!checkoutCanvas) return;
      checkoutCanvas.setAttribute('data-original-height', height);
      checkoutCanvas.style.height = `${height}px`;
      checkoutCanvas.dataset.originalHeight = height;
      resizeCanvas();
    };

    const selectMethod = (method) => {
      const isHomeChecked = checkHome.classList.contains('checked');
      const isPickupChecked = checkPickup.classList.contains('checked');

      if (method === 'home') {
        if (isHomeChecked) {
          checkHome.classList.remove('checked');
          addressBlock.style.display = 'none';
          addressBlock.querySelectorAll('input').forEach(input => input.required = false);
          clearFieldErrors(addressBlock);
          if (summaryShipping) summaryShipping.textContent = '—';
          if (summaryTotal) summaryTotal.textContent = '€40';
          setCheckoutCanvasHeight(1090);
        } else {
          checkHome.classList.add('checked');
          checkPickup.classList.remove('checked');
          addressBlock.style.display = 'flex';
          hubBlock.style.display = 'none';
          addressBlock.querySelectorAll('input').forEach(input => input.required = true);
          if (summaryShipping) summaryShipping.textContent = '€5';
          if (summaryTotal) summaryTotal.textContent = '€45';
          setCheckoutCanvasHeight(1400);

          // Reset pickup hubs when switching to home delivery
          const hubsList = document.querySelectorAll('.affiliate-hub');
          hubsList.forEach(h => {
            h.classList.remove('active');
            h.style.display = '';
          });
        }
      } else {
        if (isPickupChecked) {
          checkPickup.classList.remove('checked');
          hubBlock.style.display = 'none';
          clearFieldErrors(addressBlock);
          if (summaryShipping) summaryShipping.textContent = '—';
          if (summaryTotal) summaryTotal.textContent = '€40';
          setCheckoutCanvasHeight(1090);

          // Reset pickup hubs when unchecking local pickup
          const hubsList = document.querySelectorAll('.affiliate-hub');
          hubsList.forEach(h => {
            h.classList.remove('active');
            h.style.display = '';
          });
        } else {
          checkHome.classList.remove('checked');
          checkPickup.classList.add('checked');
          addressBlock.style.display = 'none';
          hubBlock.style.display = 'flex';
          addressBlock.querySelectorAll('input').forEach(input => input.required = false);
          clearFieldErrors(addressBlock);
          if (summaryShipping) summaryShipping.textContent = '€0';
          if (summaryTotal) summaryTotal.textContent = '€40';
          setCheckoutCanvasHeight(1090);
        }
      }
      resizeCanvas();
      updateCheckoutButtonState();
    };

    rowHome.addEventListener('click', () => selectMethod('home'));
    rowPickup.addEventListener('click', () => selectMethod('pickup'));
  }

  // --- Affiliated Hubs Selection Logic ---
  const hubs = document.querySelectorAll('.affiliate-hub');
  hubs.forEach(hub => {
    hub.addEventListener('click', () => {
      const isAlreadyActive = hub.classList.contains('active');
      if (isAlreadyActive) {
        // Deselect and show all hubs
        hubs.forEach(h => {
          h.classList.remove('active');
          h.style.display = '';
        });
      } else {
        // Select this one and hide the others
        hubs.forEach(h => {
          if (h === hub) {
            h.classList.add('active');
            h.style.display = '';
          } else {
            h.classList.remove('active');
            h.style.display = 'none';
          }
        });
      }
      resizeCanvas();
      updateCheckoutButtonState();
    });
  });

  // --- Payment Method Selection Toggle Logic ---
  const checkCard = document.getElementById('check-credit-card');
  const checkPaypal = document.getElementById('check-paypal');
  const rowCard = document.getElementById('row-credit-card');
  const rowPaypal = document.getElementById('row-paypal');
  const cardDetails = document.getElementById('credit-card-details');

  if (checkCard && checkPaypal && cardDetails) {
    const selectPayment = (method) => {
      const isCardChecked = checkCard.classList.contains('checked');
      const isPaypalChecked = checkPaypal.classList.contains('checked');

      if (method === 'card') {
        if (isCardChecked) {
          checkCard.classList.remove('checked');
          cardDetails.style.display = 'none';
          cardDetails.querySelectorAll('input').forEach(input => input.required = false);
          clearFieldErrors(cardDetails);
        } else {
          checkCard.classList.add('checked');
          checkPaypal.classList.remove('checked');
          cardDetails.style.display = 'flex';
          cardDetails.querySelectorAll('input').forEach(input => input.required = true);
        }
      } else {
        if (isPaypalChecked) {
          checkPaypal.classList.remove('checked');
        } else {
          checkCard.classList.remove('checked');
          checkPaypal.classList.add('checked');
          cardDetails.style.display = 'none';
          cardDetails.querySelectorAll('input').forEach(input => input.required = false);
          clearFieldErrors(cardDetails);
        }
      }
      resizeCanvas();
      updateCheckoutButtonState();
    };

    rowCard.addEventListener('click', () => selectPayment('card'));
    rowPaypal.addEventListener('click', () => selectPayment('paypal'));
  }

  // --- Checkout Form Validation Logic ---
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      // Validate fulfilment selection
      const isHome = checkHome && checkHome.classList.contains('checked');
      const isPickup = checkPickup && checkPickup.classList.contains('checked');
      if (!isHome && !isPickup) {
        e.preventDefault();
        alert('Seleziona un metodo di spedizione o ritiro.');
        return;
      }

      // Validate payment method selection
      const isCard = checkCard && checkCard.classList.contains('checked');
      const isPaypal = checkPaypal && checkPaypal.classList.contains('checked');
      if (!isCard && !isPaypal) {
        e.preventDefault();
        alert('Seleziona un metodo di pagamento.');
        return;
      }

      // Validate all active input fields on submit
      const inputs = checkoutForm.querySelectorAll('input[required]');
      let isFormValid = true;
      let firstInvalidInput = null;

      inputs.forEach(input => {
        const isValid = validateInputField(input);
        if (!isValid) {
          isFormValid = false;
          if (!firstInvalidInput) {
            firstInvalidInput = input;
          }
        }
      });

      if (!isFormValid) {
        e.preventDefault();
        if (firstInvalidInput) {
          firstInvalidInput.focus();
        }
        return;
      }

      // Intercept valid checkout to play loader for 1.5s
      e.preventDefault();
      switchPage('loader-page');
      const loaderVideo = document.getElementById('loader-video');
      if (loaderVideo) {
        loaderVideo.currentTime = 0;
        loaderVideo.play().catch(err => console.warn('Loader video playback failed:', err));
      }
      setTimeout(() => {
        if (loaderVideo) {
          loaderVideo.pause();
        }
        switchPage('order-confirmed-page');
      }, 1500);
    });

    // Bind blur and input listeners to checkout form inputs
    const checkoutInputs = checkoutForm.querySelectorAll('input');
    checkoutInputs.forEach(input => {
      input.addEventListener('blur', () => {
        validateInputField(input);
      });

      input.addEventListener('input', () => {
        const fieldWrapper = input.closest('.checklist-field, .address-checklist-line, .checklist-line-payment');
        if (fieldWrapper) {
          fieldWrapper.classList.remove('error');
          const errorText = fieldWrapper.querySelector('.checkout-error-text');
          if (errorText) {
            errorText.style.display = 'none';
            errorText.textContent = '';
          }
        }
        if (input.id === 'input-name') {
          localStorage.setItem('checkoutName', input.value);
        } else if (input.id === 'input-email') {
          localStorage.setItem('checkoutEmail', input.value);
        } else if (input.id === 'input-password') {
          localStorage.setItem('checkoutPassword', input.value);
        }
        updateCheckoutButtonState();
      });
    });
  }

  // Initial state check
  updateCheckoutButtonState();

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

  // --- Order Confirmed Lottie Animation ---
  let orderConfirmedAnim = null;
  function initOrderConfirmedLottie() {
    const orderConfirmedContainer = document.getElementById('order-confirmed-lottie');
    if (!orderConfirmedContainer) return;
    if (orderConfirmedAnim) {
      orderConfirmedAnim.destroy();
      orderConfirmedAnim = null;
    }
    orderConfirmedAnim = lottie.loadAnimation({
      container: orderConfirmedContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: orderConfirmedAnimationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    });
  }

  // --- Update Order Confirmed Details ---
  function updateOrderConfirmedDetails() {
    const choiceEl = document.querySelector('.confirmed-subtitle .order-choice');
    const addressEl = document.querySelector('.confirmed-subtitle .order-address');
    if (!choiceEl || !addressEl) return;

    const isHome = checkHome && checkHome.classList.contains('checked');
    const isPickup = checkPickup && checkPickup.classList.contains('checked');

    let shippingChoice = 'local pickup';
    let shippingAddress = '-Libreria Dispaccio-Via Luigi Settembrini, 33, 80138 Napoli NA'; // default fallback

    if (isHome) {
      shippingChoice = 'home delivery';
      const street = document.getElementById('input-street')?.value.trim() || '';
      const zip = document.getElementById('input-zip')?.value.trim() || '';
      const city = document.getElementById('input-city')?.value.trim() || '';
      const state = document.getElementById('input-state')?.value.trim() || '';
      const country = document.getElementById('input-country')?.value.trim() || '';
      shippingAddress = [street, zip, city, state, country].filter(Boolean).join(', ');
      if (!shippingAddress) {
        shippingAddress = 'N/A';
      }
    } else if (isPickup) {
      shippingChoice = 'local pickup';
      if (document.getElementById('hub-napoli')?.classList.contains('active')) {
        shippingAddress = '-Libreria Dispaccio-Via Luigi Settembrini, 33, 80138 Napoli NA';
      } else if (document.getElementById('hub-milano')?.classList.contains('active')) {
        shippingAddress = '-Frab’s Magazine-Via Giuseppe Sirtori, 11, 20129 Milano MI';
      } else if (document.getElementById('hub-roma')?.classList.contains('active')) {
        shippingAddress = '-Edicola Erno-Piazza Americo Capponi, 00193 Roma RM';
      }
    }

    choiceEl.textContent = shippingChoice;
    addressEl.textContent = shippingAddress;
  }

  // Logo buttons routing back to primary page (for checkout, confirmed, and paperface pages)
  const logoBtns = [
    { id: 'checkout-logo-btn' },
    { id: 'confirmed-logo-btn' },
    {
      id: 'paperface-logo-btn', cleanup: () => {
        const iframe = document.getElementById('paperface-iframe');
        if (iframe) iframe.src = 'about:blank';
      }
    }
  ];
  logoBtns.forEach(btnConfig => {
    const btn = document.getElementById(btnConfig.id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btnConfig.cleanup) btnConfig.cleanup();
        switchPage('primary-page');
        startProgrammaticScroll(0);
      });
    }
  });

  // --- Join the community button click handlers ---
  const communityJoinBtn = document.querySelector('.community-join-btn');
  const loginLogoBtn = document.getElementById('login-logo-btn');
  const loginCloseBtn = document.getElementById('login-close-btn');
  const loginInputEmail = document.getElementById('login-input-email');
  const loginInputPassword = document.getElementById('login-input-password');
  const loginConfirmBtn = document.getElementById('login-confirm-btn');

  function updateLoginButtonState() {
    if (!loginConfirmBtn || !loginInputEmail || !loginInputPassword) return;
    const emailVal = loginInputEmail.value.trim();
    const passVal = loginInputPassword.value.trim();
    loginConfirmBtn.disabled = (!emailVal || !passVal);
  }

  if (communityJoinBtn) {
    communityJoinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Show the community login page view
      switchPage('community-login-page');

      // Reset input fields
      if (loginInputEmail) loginInputEmail.value = '';
      if (loginInputPassword) loginInputPassword.value = '';

      // Reset button state to disabled
      updateLoginButtonState();

      // Clear errors
      const loginCard = document.getElementById('community-login-card');
      if (loginCard) {
        const fields = loginCard.querySelectorAll('.login-field');
        fields.forEach(field => {
          field.classList.remove('error');
          const errText = field.querySelector('.login-error-text');
          if (errText) errText.style.display = 'none';
        });
      }
    });
  }

  // Handle logo and close button click: return to community page
  if (loginLogoBtn) {
    loginLogoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage('community-page');
    });
  }
  if (loginCloseBtn) {
    loginCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage('community-page');
    });
  }



  // Clear validation errors on typing and update confirm button state
  if (loginInputEmail && loginInputPassword) {
    [loginInputEmail, loginInputPassword].forEach(input => {
      input.addEventListener('input', () => {
        const field = input.closest('.login-field');
        if (field) {
          field.classList.remove('error');
          const errText = field.querySelector('.login-error-text');
          if (errText) errText.style.display = 'none';
        }
        updateLoginButtonState();
      });
    });
  }

  // Handle credentials confirmation
  if (loginConfirmBtn) {
    loginConfirmBtn.addEventListener('click', () => {
      const email = loginInputEmail ? loginInputEmail.value.trim() : '';
      const password = loginInputPassword ? loginInputPassword.value.trim() : '';
      let hasError = false;

      // Validate inputs are filled
      if (!email) {
        const field = document.getElementById('login-field-email');
        if (field) {
          field.classList.add('error');
          const errText = field.querySelector('.login-error-text');
          if (errText) {
            errText.textContent = 'email is required';
            errText.style.display = 'block';
          }
        }
        hasError = true;
      }
      if (!password) {
        const field = document.getElementById('login-field-password');
        if (field) {
          field.classList.add('error');
          const errText = field.querySelector('.login-error-text');
          if (errText) {
            errText.textContent = 'password is required';
            errText.style.display = 'block';
          }
        }
        hasError = true;
      }

      if (hasError) return;

      // Check against stored credentials
      const savedEmail = localStorage.getItem('checkoutEmail');
      const savedPassword = localStorage.getItem('checkoutPassword');
      const savedName = localStorage.getItem('checkoutName') || '';

      // If credentials do not match or checkout was never completed
      if (!savedEmail || !savedPassword || email !== savedEmail.trim() || password !== savedPassword.trim()) {
        const field = document.getElementById('login-field-email');
        if (field) {
          field.classList.add('error');
          const errText = field.querySelector('.login-error-text');
          if (errText) {
            errText.textContent = 'account not found';
            errText.style.display = 'block';
          }
        }
        return;
      }

      const iframe = document.getElementById('paperface-iframe');
      if (iframe) {
        iframe.src = `/paperface_tool/index.html?name=${encodeURIComponent(savedName)}`;
      }
      paperfacePreviousPage = 'community-login-page';
      switchPage('paperface-page');
    });
  }

  const confirmedJoinBtn = document.getElementById('confirmed-join-btn');
  if (confirmedJoinBtn) {
    confirmedJoinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const iframe = document.getElementById('paperface-iframe');
      if (iframe) {
        const nameInput = document.getElementById('input-name');
        const name = nameInput ? nameInput.value : '';
        iframe.src = `/paperface_tool/index.html?name=${encodeURIComponent(name)}`;
      }
      paperfacePreviousPage = 'order-confirmed-page';
      switchPage('paperface-page');
    });
  }

  // --- Helper to add new confirmed portraits dynamically ---
  function addNewConfirmedPortrait(image, name) {
    const canvasContainer = document.querySelector('.community-canvas');
    if (!canvasContainer) return 0;

    const grid = canvasContainer.querySelector('.community-grid');
    if (!grid) return 0;

    const index = grid.querySelectorAll('.community-cell').length;

    // Calculate layout coordinates inside the 7-column grid
    const colOffsets = [0, 231, 462, 694, 926, 1158, 1390];
    const left = colOffsets[index % 7];
    const top = Math.floor(index / 7) * 342;

    // Format negative number string: e.g. index 28 -> -015
    const numStr = `-${String(index - 13).padStart(2, '0')}`;

    // Create the cell
    const cell = document.createElement('div');
    cell.className = 'community-cell';
    cell.style.left = `${left}px`;
    cell.style.top = `${top}px`;
    cell.setAttribute('data-name', name);

    // Create portrait
    const portrait = document.createElement('div');
    portrait.className = 'community-portrait';
    portrait.style.backgroundImage = `url(${image})`;
    cell.appendChild(portrait);

    // Create numbers / name wrapper
    const numbers = document.createElement('div');
    numbers.className = 'community-numbers';

    const numEl = document.createElement('span');
    numEl.className = 'community-num';
    numEl.textContent = numStr;
    numbers.appendChild(numEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'community-name';
    
    // Populate spans for character-by-character animation
    const chars = [];
    for (let i = 0; i < name.length; i++) {
      const span = document.createElement('span');
      span.textContent = name[i];
      span.style.opacity = '0';
      span.style.transition = 'opacity 0.05s ease';
      nameEl.appendChild(span);
      chars.push(span);
    }
    numbers.appendChild(nameEl);

    cell.appendChild(numbers);

    // Register typewriter hover events specifically on the new cell
    cell.addEventListener('mouseenter', () => {
      if (nameEl._typeInterval) clearInterval(nameEl._typeInterval);
      
      let currentIdx = 0;
      chars.forEach((span, idx) => {
        if (span.style.opacity === '1') {
          currentIdx = idx + 1;
        }
      });

      nameEl._typeInterval = setInterval(() => {
        if (currentIdx < chars.length) {
          chars[currentIdx].style.opacity = '1';
          currentIdx++;
        } else {
          clearInterval(nameEl._typeInterval);
          nameEl._typeInterval = null;
        }
      }, 20);
    });

    cell.addEventListener('mouseleave', () => {
      if (nameEl._typeInterval) clearInterval(nameEl._typeInterval);
      
      let currentIdx = chars.length - 1;
      chars.forEach((span, idx) => {
        if (span.style.opacity === '1') {
          currentIdx = idx;
        }
      });

      nameEl._typeInterval = setInterval(() => {
        if (currentIdx >= 0) {
          chars[currentIdx].style.opacity = '0';
          currentIdx--;
        } else {
          clearInterval(nameEl._typeInterval);
          nameEl._typeInterval = null;
        }
      }, 15);
    });

    // Append to grid
    grid.appendChild(cell);

    // Dynamic grid size scaling
    const totalRows = Math.ceil((index + 1) / 7);
    const gridHeight = totalRows * 342 - 270;
    grid.style.height = `${gridHeight}px`;

    // Dynamic canvas height scaling
    const gridBottom = 2305 + gridHeight;
    const currentHeight = parseFloat(canvasContainer.getAttribute('data-original-height')) || 3860;
    const requiredHeight = gridBottom + 457;
    if (requiredHeight > currentHeight) {
      canvasContainer.setAttribute('data-original-height', requiredHeight);
      canvasContainer.style.height = `${requiredHeight}px`;
      canvasContainer.dataset.originalHeight = requiredHeight;
      resizeCanvas();
    }

    return top;
  }

  // --- Helper to update parallax on community portraits ---
  function updateCommunityParallax() {
    const isCommunityActive = document.getElementById('community-page').classList.contains('active');
    if (!isCommunityActive) return;

    const scrollY = getScrollTop();
    const cards = document.querySelectorAll('.parallax-card');
    cards.forEach((card, index) => {
      const factor = (index % 2 === 0) ? -0.07 : 0.07;
      const offset = (scrollY - 1800) * factor;
      card.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  }

  // --- Listen to confirm message from Paperface Tool iframe ---
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'paperface-confirm') {
      const { image, name } = event.data;
      let cellTop = 0;
      if (image && name) {
        cellTop = addNewConfirmedPortrait(image, name);
      }

      const iframe = document.getElementById('paperface-iframe');
      if (iframe) {
        iframe.src = 'about:blank';
      }
      switchPage('community-page');
      
      // Auto scroll to the newly uploaded portrait
      setTimeout(() => {
        const scale = window.innerWidth < 1728 ? (window.innerWidth / 1728) : 1;
        const targetY = (2305 + cellTop) - (window.innerHeight / 2) + 40;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const physicalScrollTarget = Math.min(Math.max(0, targetY), maxScroll) * scale;
        startProgrammaticScroll(physicalScrollTarget, { behavior: 'smooth' });
      }, 150);
    }
  });

  let tickId = null;

  function updateAnimation(progress) {
    if (!anim) return;

    // Scrub the Lottie timeline
    const totalFrames = anim.totalFrames;
    anim.goToAndStop(progress * (totalFrames - 1), true);
  }

  // Interpolation loop to make scrubbing extremely smooth, fluid, and harmonic
  function tick() {
    const diff = targetProgress - currentProgress;
    let shouldContinue = false;

    // Apply a light scroll inertia effect when virtual scroll damping is active
    if (isDampingActive) {
      const scrollDiff = virtualScrollY - smoothScrollY;
      if (Math.abs(scrollDiff) > 0.05) {
        // Low LERP for smooth inertial gliding (tremor-safe because parallax uses smoothScrollY)
        const lerpFactor = 0.15;

        smoothScrollY += scrollDiff * lerpFactor;

        // Physical scroll update
        const targetPhysical = Math.round(smoothScrollY);
        if (targetPhysical !== getScrollTop()) {
          programmaticScrollTarget = targetPhysical;
          if (lenisInstance) {
            lenisInstance.scrollTo(targetPhysical, { immediate: true });
          } else {
            window.scrollTo(0, targetPhysical);
          }
        }
        shouldContinue = true;
      } else {
        smoothScrollY = virtualScrollY;
        const targetPhysical = Math.round(smoothScrollY);
        if (targetPhysical !== getScrollTop()) {
          programmaticScrollTarget = targetPhysical;
          if (lenisInstance) {
            lenisInstance.scrollTo(targetPhysical, { immediate: true });
          } else {
            window.scrollTo(0, targetPhysical);
          }
        }
      }
    }

    if (Math.abs(diff) < 0.0001) {
      currentProgress = targetProgress;
      updateAnimation(currentProgress);
    } else {
      // Low ease factor for silky-smooth, flowing rotation
      currentProgress += diff * 0.06;
      updateAnimation(currentProgress);
      shouldContinue = true;
    }

    const isPrimaryActive = document.getElementById('primary-page').classList.contains('active');
    if (isPrimaryActive) {
      updateCircularParallax();
    }

    if (shouldContinue) {
      tickId = requestAnimationFrame(tick);
    } else {
      tickId = null;
    }
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





  // Handle wheel events with virtual scroll damping near circular input
  window.addEventListener('wheel', (e) => {
    const isPrimaryActive = document.getElementById('primary-page').classList.contains('active');
    if (!isPrimaryActive) return;

    calculateTargetScroll();
    const currentScrollY = getScrollTop();
    const distance = Math.abs(currentScrollY - targetScrollY);
    const range = SCROLL_RANGE;

    if (distance < range) {
      if (!isDampingActive) {
        isDampingActive = true;
        virtualScrollY = currentScrollY;
        smoothScrollY = currentScrollY;
        programmaticScrollTarget = currentScrollY;
      }

      e.preventDefault();

      const virtualDistance = Math.abs(virtualScrollY - targetScrollY);
      let speedFactor = 1.0;
      if (virtualDistance < range) {
          const boundaryWidth = 100;
        if (virtualDistance > range - boundaryWidth) {
          // Smooth quadratic ease-in at the boundary for gentle entry
          const u = (range - virtualDistance) / boundaryWidth;
          speedFactor = 1.0 - (1.0 - 0.10) * (u * u);
        } else {
          speedFactor = 0.10;
        }
      }

      // Clamp e.deltaY to max 15 to prevent fast scroll acceleration spikes
      const clampedDeltaY = Math.max(-15, Math.min(15, e.deltaY));
      virtualScrollY += clampedDeltaY * speedFactor;

      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      virtualScrollY = Math.max(0, Math.min(maxScrollY, virtualScrollY));

      startTick();
    } else {
      if (isDampingActive) {
        isDampingActive = false;
      }
    }
  }, { passive: false });

  // Handle touch movements with virtual scroll damping on mobile devices
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  });

  window.addEventListener('touchmove', (e) => {
    const isPrimaryActive = document.getElementById('primary-page').classList.contains('active');
    if (!isPrimaryActive) return;

    calculateTargetScroll();
    const currentScrollY = getScrollTop();
    const distance = Math.abs(currentScrollY - targetScrollY);
    const range = SCROLL_RANGE;

    if (distance < range) {
      if (!isDampingActive) {
        isDampingActive = true;
        virtualScrollY = currentScrollY;
        smoothScrollY = currentScrollY;
        programmaticScrollTarget = currentScrollY;
      }

      e.preventDefault();

      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY; // positive delta means drag up -> scroll down
        touchStartY = currentY;

        const virtualDistance = Math.abs(virtualScrollY - targetScrollY);
        let speedFactor = 1.0;
        if (virtualDistance < range) {
            const boundaryWidth = 100;
          if (virtualDistance > range - boundaryWidth) {
            // Smooth quadratic ease-in at the boundary for gentle entry
            const u = (range - virtualDistance) / boundaryWidth;
            speedFactor = 1.0 - (1.0 - 0.10) * (u * u);
          } else {
            speedFactor = 0.10;
          }
        }

        // Clamp touch drag deltaY to max 15
        const clampedTouchDeltaY = Math.max(-15, Math.min(15, deltaY));
        virtualScrollY += clampedTouchDeltaY * speedFactor * 0.8;

        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
        virtualScrollY = Math.max(0, Math.min(maxScrollY, virtualScrollY));

        startTick();
      }
    } else {
      if (isDampingActive) {
        isDampingActive = false;
      }
    }
  }, { passive: false });

  // Parallax compensation to keep the circular input container almost perfectly centered/still during scroll
  function updateCircularParallax() {
    const container = document.querySelector('.container-generale');
    if (!container) return;

    // Use smoothScrollY for sub-pixel-stable parallax (avoids getScrollTop() rounding tremors)
    const scrollRef = isDampingActive ? smoothScrollY : getScrollTop();
    calculateTargetScroll();
    const distance = Math.abs(scrollRef - targetScrollY);
    const range = SCROLL_RANGE;

    if (distance < range && isDampingActive) {
      const t = distance / range;
      const lockFactor = 0.85 * Math.pow(1 - t, 3);
      const translateY = (scrollRef - targetScrollY) * lockFactor;
      container.style.transform = `translate3d(0, ${translateY}px, 0)`;
    } else {
      container.style.transform = '';
    }
  }

  // Intercept window scroll event to update Lottie animation progress
  window.addEventListener('scroll', () => {
    updateCanvasVisibility();
    updateCommunityParallax();

    const currentScrollY = getScrollTop();
    const isPrimaryActive = document.getElementById('primary-page').classList.contains('active');

    if (!isPrimaryActive) {
      lastScrollY = currentScrollY;
      return;
    }

    // Sync state with manual scrolls (scrollbar dragging, keys, trackpad)
    if (isDampingActive) {
      if (programmaticScrollTarget !== null && Math.abs(currentScrollY - programmaticScrollTarget) <= 1) {
        // Programmatic scroll, do not sync
      } else {
        virtualScrollY = currentScrollY;
        smoothScrollY = currentScrollY;
        programmaticScrollTarget = null;
      }
    }

    // Safely clear the transform outside damping to prevent layout jumps/stray translation
    if (!isDampingActive) {
      const container = document.querySelector('.container-generale');
      if (container && container.style.transform !== '') {
        container.style.transform = '';
      }
    }

    calculateTargetScroll();

    // Map scroll position to Lottie progress using ANIMATION_RANGE
    // The animation only starts when the circular input is near the center of the viewport
    const startScroll = targetScrollY - ANIMATION_RANGE;
    const endScroll = targetScrollY + ANIMATION_RANGE;

    let progress = (currentScrollY - startScroll) / (endScroll - startScroll);
    progress = Math.max(0, Math.min(1, progress));

    targetProgress = progress;
    startTick();

    lastScrollY = currentScrollY;
  });

  // Handle reset when the virus attack is finished/bypassed
  window.addEventListener('virus-attack-finished', () => {
    isProgrammaticScrolling = false;
    targetProgress = 0;
    currentProgress = 0;
    targetScrollY = 0;
    lastScrollY = 0;
    isDampingActive = false;
    virtualScrollY = 0;
    smoothScrollY = 0;
    programmaticScrollTarget = null;

    if (tickId) {
      cancelAnimationFrame(tickId);
      tickId = null;
    }

    // Unlock scroll settings
    document.body.classList.remove('virus-lock');

    // Update Lottie animation to start
    updateAnimation(0);

    // Reset page view to primary-page
    switchPage('primary-page');

    if (window.__virusTriggeredByButtons) {
      window.__virusTriggeredByButtons = false;
      // Scroll to the bottom of the primary page
      const pageHeight = 6672; // design height of the primary canvas
      const originalWidth = 1728;
      const scale = window.innerWidth < originalWidth ? (window.innerWidth / originalWidth) : 1;
      const bottomScrollY = (pageHeight * scale) - window.innerHeight;
      startProgrammaticScroll(bottomScrollY, { behavior: 'instant' });
    } else {
      startProgrammaticScroll(0, { behavior: 'instant' });
    }

    // Recalculate target scroll position
    calculateTargetScroll();
    resizeCanvas();
  });

  // Manual virus attack trigger via the BUTTONS button at the bottom-left
  const virusTrigger = document.getElementById('virus-trigger');
  if (virusTrigger) {
    virusTrigger.addEventListener('click', () => {
      window.__virusTriggeredByButtons = true;
      initVirusAttack(true); // force start the virus attack immediately
    });
  }

  // --- Video Player Logic ---
  const playlist = [
    {
      src: '/video/Chewingpiece_Caterina_diMunzio.MOV',
      title: 'Chewingpiece - Caterina di Munzio'
    },
    {
      src: '/video/Untitled_Gaia_Credentino.mp4',
      title: 'Untitled - Gaia Credentino'
    },
    {
      src: '/video/Kuleshov_Erica_Aurora_M..mp4',
      title: 'Kuleshov - Erica Aurora M.'
    }
  ];

  let currentVideoIndex = 0;
  const videoPlayer = document.getElementById('main-video-player');
  const videoInfoText = document.getElementById('video-info-text');

  function playVideoAtIndex(index) {
    currentVideoIndex = index;
    const video = playlist[currentVideoIndex];
    if (videoPlayer && videoInfoText) {
      videoPlayer.src = video.src;
      videoInfoText.textContent = video.title;
      videoPlayer.muted = false;
      videoPlayer.load();
      videoPlayer.play().catch(err => {
        console.warn("Autoplay video was prevented by browser policy", err);
      });
    }
  }



  const videoBackBtn = document.getElementById('video-back-btn');
  if (videoBackBtn) {
    videoBackBtn.addEventListener('click', () => {
      const prevIndex = (currentVideoIndex - 1 + playlist.length) % playlist.length;
      playVideoAtIndex(prevIndex);
    });
  }

  const videoNextBtn = document.getElementById('video-next-btn');
  if (videoNextBtn) {
    videoNextBtn.addEventListener('click', () => {
      const nextIndex = (currentVideoIndex + 1) % playlist.length;
      playVideoAtIndex(nextIndex);
    });
  }

  if (videoPlayer) {
    videoPlayer.addEventListener('ended', () => {
      const nextIndex = (currentVideoIndex + 1) % playlist.length;
      playVideoAtIndex(nextIndex);
    });
  }

  let videoPinActive = false;
  let enteredVideoPin = "";
  const videoPinSlots = document.querySelectorAll('#video-pin-input-field .pin-input-slot');

  function updateVideoPinDisplay() {
    videoPinSlots.forEach((slot, index) => {
      const digitSpan = slot.querySelector('.pin-digit');
      const lineDiv = slot.querySelector('.pin-line');

      digitSpan.classList.remove('error');
      lineDiv.classList.remove('error');

      if (index < enteredVideoPin.length) {
        digitSpan.textContent = "*";
      } else {
        digitSpan.textContent = "";
      }
    });
  }

  function setVideoPinErrorState() {
    videoPinSlots.forEach((slot) => {
      const digitSpan = slot.querySelector('.pin-digit');
      const lineDiv = slot.querySelector('.pin-line');
      digitSpan.classList.add('error');
      lineDiv.classList.add('error');
      digitSpan.textContent = ""; // Asterisks disappear
    });
    enteredVideoPin = "";

    const errText = document.getElementById('video-key-error-text');
    if (errText) {
      errText.style.display = 'block';
    }
  }

  function clearVideoPinErrorState() {
    videoPinSlots.forEach((slot) => {
      const digitSpan = slot.querySelector('.pin-digit');
      const lineDiv = slot.querySelector('.pin-line');
      digitSpan.classList.remove('error');
      lineDiv.classList.remove('error');
    });

    const errText = document.getElementById('video-key-error-text');
    if (errText) {
      errText.style.display = 'none';
    }
  }

  const handleVideoPinKeyDown = (e) => {
    if (!videoPinActive) return;

    if (e.key >= '0' && e.key <= '9') {
      if (enteredVideoPin.length < 6) {
        clearVideoPinErrorState();
        enteredVideoPin += e.key;
        updateVideoPinDisplay();
      }
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'Backspace') {
      clearVideoPinErrorState();
      enteredVideoPin = enteredVideoPin.slice(0, -1);
      updateVideoPinDisplay();
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'Enter') {
      if (enteredVideoPin.length === 6) {
        if (enteredVideoPin === "111223") {
          videoPinActive = false;

          const videoPage = document.getElementById('video-page');
          const videoKeyOverlay = document.getElementById('video-key-overlay');
          if (videoPage && videoKeyOverlay) {
            videoPage.classList.remove('key-prompt-active');
            videoKeyOverlay.style.display = 'none';
          }

          if (videoPlayer) {
            videoPlayer.muted = false;
          }
        } else {
          setVideoPinErrorState();
        }
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  window.addEventListener('keydown', handleVideoPinKeyDown);

  const videoLogoBtn = document.getElementById('video-logo-btn');
  if (videoLogoBtn) {
    videoLogoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      videoPinActive = false;

      const videoPage = document.getElementById('video-page');
      const videoKeyOverlay = document.getElementById('video-key-overlay');
      if (videoPage && videoKeyOverlay) {
        videoPage.classList.remove('key-prompt-active');
        videoKeyOverlay.style.display = 'none';
      }

      enteredVideoPin = "";
      clearVideoPinErrorState();
      updateVideoPinDisplay();

      if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = "";
      }

      switchPage(previousPage);
    });
  }

  const transparentParticlesLogoBtn = document.getElementById('transparent-particles-logo-btn');
  if (transparentParticlesLogoBtn) {
    transparentParticlesLogoBtn.addEventListener('click', () => {
      // Track previous page to return to if canceled
      const activePage = Array.from(pageViews).find(view => view.classList.contains('active'));
      if (activePage && activePage.id !== 'video-page') {
        previousPage = activePage.id;
      }

      switchPage('video-page');

      // Start the video in the background under the key prompt, muted
      playVideoAtIndex(0);
      if (videoPlayer) {
        videoPlayer.muted = true;
      }

      const videoPage = document.getElementById('video-page');
      const videoKeyOverlay = document.getElementById('video-key-overlay');
      if (videoPage && videoKeyOverlay) {
        videoPage.classList.add('key-prompt-active');
        videoKeyOverlay.style.display = 'flex';
      }

      videoPinActive = true;
      enteredVideoPin = "";
      updateVideoPinDisplay();
    });
  }

  // --- Community Page Typewriter / Custom Hovers ---
  function initCommunityHovers() {
    const artistRows = document.querySelectorAll('.artist-row');
    artistRows.forEach(row => {
      const bioEl = row.querySelector('.artist-bio');
      if (!bioEl) return;

      // Store the original text to type it dynamically, and clear the element's default text
      bioEl._fullText = bioEl.textContent.trim();
      bioEl.textContent = '';
      bioEl._typeInterval = null;

      row.addEventListener('mouseenter', () => {
        // Clear any previous interval to prevent overlapping triggers
        if (bioEl._typeInterval) {
          clearInterval(bioEl._typeInterval);
        }
        bioEl.textContent = '';
        let currentIdx = 0;
        const textBody = bioEl._fullText;

        bioEl._typeInterval = setInterval(() => {
          if (currentIdx < textBody.length) {
            currentIdx += 8; // Twice as fast digital writing
            if (currentIdx > textBody.length) currentIdx = textBody.length;
            bioEl.textContent = textBody.substring(0, currentIdx);
          } else {
            clearInterval(bioEl._typeInterval);
            bioEl._typeInterval = null;
          }
        }, 10);
      });

      row.addEventListener('mouseleave', () => {
        if (bioEl._typeInterval) {
          clearInterval(bioEl._typeInterval);
          bioEl._typeInterval = null;
        }
        // Instantly empty the text so the collapsed state has no visible leftovers
        bioEl.textContent = '';
      });
    });
  }

  // --- Community Grid Portrait Hover Typewriter ---
  function initCommunityGridHovers() {
    const cells = document.querySelectorAll('.community-cell');
    cells.forEach(cell => {
      const nameEl = cell.querySelector('.community-name');
      if (!nameEl) return;

      const targetName = cell.getAttribute('data-name') || "";
      nameEl._typeInterval = null;

      // Populate spans for character-by-character animation
      nameEl.innerHTML = '';
      const chars = [];
      for (let i = 0; i < targetName.length; i++) {
        const span = document.createElement('span');
        span.textContent = targetName[i];
        span.style.opacity = '0';
        span.style.transition = 'opacity 0.05s ease';
        nameEl.appendChild(span);
        chars.push(span);
      }

      cell.addEventListener('mouseenter', () => {
        if (nameEl._typeInterval) clearInterval(nameEl._typeInterval);
        
        let currentIdx = 0;
        chars.forEach((span, idx) => {
          if (span.style.opacity === '1') {
            currentIdx = idx + 1;
          }
        });

        nameEl._typeInterval = setInterval(() => {
          if (currentIdx < chars.length) {
            chars[currentIdx].style.opacity = '1';
            currentIdx++;
          } else {
            clearInterval(nameEl._typeInterval);
            nameEl._typeInterval = null;
          }
        }, 20); // 20ms per character typing speed
      });

      cell.addEventListener('mouseleave', () => {
        if (nameEl._typeInterval) clearInterval(nameEl._typeInterval);
        
        let currentIdx = chars.length - 1;
        chars.forEach((span, idx) => {
          if (span.style.opacity === '1') {
            currentIdx = idx;
          }
        });

        nameEl._typeInterval = setInterval(() => {
          if (currentIdx >= 0) {
            chars[currentIdx].style.opacity = '0';
            currentIdx--;
          } else {
            clearInterval(nameEl._typeInterval);
            nameEl._typeInterval = null;
          }
        }, 15); // 15ms per character erasing speed
      });
    });
  }

  // Run the community hovers initialization
  initCommunityHovers();
  initCommunityGridHovers();

});
