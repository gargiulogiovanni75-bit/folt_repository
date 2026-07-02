// Main navigation, page switching, and viewport scaling logic for FØLT magazine website
import { initInteractiveParticles } from './particles.js';
import { initVirusAttack } from './virus.js';
import lottie from 'lottie-web';
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
          }
        }
        if (l.ks.p.y && typeof l.ks.p.y.k === 'number') {
          l.ks.p.y.k = targetY + (l.ks.p.y.k - centerY) * layoutScale;
          if (l.nm === 'caterina_portrait') {
            l.ks.p.y.k -= 140; // Shift up by 140px total (40px original + 100px additional)
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
  let isLocked = false;
  let previousPage = 'primary-page';
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
      initOrderConfirmedLottie();
    }

    // Run scaling calculations for the newly showing page canvas
    resizeCanvas();

     // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    
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
        preserveAspectRatio: 'xMidYMid meet'
      }
    });
  }

  // Logo buttons routing back to primary page (for checkout, confirmed, and paperface pages)
  const logoBtns = [
    { id: 'checkout-logo-btn' },
    { id: 'confirmed-logo-btn' },
    { id: 'paperface-logo-btn', cleanup: () => {
      const iframe = document.getElementById('paperface-iframe');
      if (iframe) iframe.src = 'about:blank';
    }}
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
  if (communityJoinBtn) {
    communityJoinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const iframe = document.getElementById('paperface-iframe');
      if (iframe) {
        const nameInput = document.getElementById('input-name');
        const name = nameInput ? nameInput.value : '';
        iframe.src = `/paperface_tool/index.html?name=${encodeURIComponent(name)}`;
      }
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
      switchPage('paperface-page');
    });
  }

  // --- Helper to add new confirmed portraits dynamically ---
  function addNewConfirmedPortrait(image, name) {
    const canvasContainer = document.querySelector('.community-canvas');
    if (!canvasContainer) return;

    // Count how many cards are currently on the page
    const existingCards = canvasContainer.querySelectorAll('.extra-card');
    const index = existingCards.length;

    // Calculate layout coordinates
    let left;
    if (index === 0) {
      left = 225;
    } else if (index === 1) {
      left = 963;
    } else {
      const positions = [594, 410, 778];
      left = positions[(index - 2) % positions.length];
    }
    const top = 2260 + (index * 220);

    // Create the wrapper card
    const card = document.createElement('div');
    card.className = 'extra-card parallax-card';
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;

    // Create image element
    const imgEl = document.createElement('div');
    imgEl.className = 'extra-portrait-image';
    imgEl.style.backgroundImage = `url(${image})`;

    // Create name element
    const nameEl = document.createElement('div');
    nameEl.className = 'extra-portrait-name caption_texts';
    nameEl.textContent = name;

    // Append elements
    card.appendChild(imgEl);
    card.appendChild(nameEl);

    // Append before membership text so layout is preserved in DOM flow
    const membershipText = canvasContainer.querySelector('.community-membership-text');
    if (membershipText) {
      canvasContainer.insertBefore(card, membershipText);
    } else {
      canvasContainer.appendChild(card);
    }

    // Dynamic height scaling of canvas container
    const cardBottom = top + 250;
    const originalHeightAttr = parseFloat(canvasContainer.getAttribute('data-original-height')) || 3100;
    if (cardBottom > originalHeightAttr - 300) {
      const newHeight = cardBottom + 300;
      canvasContainer.setAttribute('data-original-height', newHeight);
      canvasContainer.style.height = `${newHeight}px`;
      canvasContainer.dataset.originalHeight = newHeight;
      resizeCanvas();
    }
    
    // Update parallax on the newly created card
    updateCommunityParallax();
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
      if (image && name) {
        addNewConfirmedPortrait(image, name);
      }

      const iframe = document.getElementById('paperface-iframe');
      if (iframe) {
        iframe.src = 'about:blank';
      }
      switchPage('community-page');
      // Trigger initial parallax on page switch
      setTimeout(updateCommunityParallax, 50);
    }
  });

  let tickId = null;

  function updateAnimation(progress) {
    if (!anim) return;

    // Scrub the Lottie timeline
    const totalFrames = anim.totalFrames;
    anim.goToAndStop(progress * (totalFrames - 1), true);
  }

  let lockScrollY = 0;

  // Interpolation loop to make scrubbing extremely smooth, fluid, and harmonic
  function tick() {
    const diff = targetProgress - currentProgress;
    let shouldContinue = true;

    // Smooth scroll pinning transition / Release slide
    if (isReleasing) {
      const scrollDiff = releaseTargetScrollY - lockScrollY;
      if (Math.abs(scrollDiff) > 0.5) {
        lockScrollY += scrollDiff * 0.15; // smooth exit slide
        window.scrollTo(0, lockScrollY);
      } else {
        lockScrollY = releaseTargetScrollY;
        window.scrollTo(0, releaseTargetScrollY);
        document.documentElement.style.overflow = '';
        isLocked = false;
        isReleasing = null;
        lastScrollY = releaseTargetScrollY;
        tickId = null; // stop tick loop
        return;
      }
    } else if (isLocked) {
      const scrollDiff = targetScrollY - lockScrollY;
      if (Math.abs(scrollDiff) > 0.5) {
        lockScrollY += scrollDiff * 0.15; // smooth slide centering LERP
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
        shouldContinue = false;
      }
    } else {
      // Ease factor 0.06 makes the movement slow, elegant, and fluid
      currentProgress += diff * 0.06;
      updateAnimation(currentProgress);
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

    if (isReleasing === 'down' && deltaY > 0) {
      lockScrollY += deltaY * 0.6; // user helps push scroll down
      if (lockScrollY >= releaseTargetScrollY) {
        // Release immediately if we scroll past release target
        lockScrollY = releaseTargetScrollY;
        window.scrollTo(0, releaseTargetScrollY);
        document.documentElement.style.overflow = '';
        isLocked = false;
        isReleasing = null;
        lastScrollY = releaseTargetScrollY;
        if (tickId) {
          cancelAnimationFrame(tickId);
          tickId = null;
        }
        return;
      }
    } else if (isReleasing === 'up' && deltaY < 0) {
      lockScrollY += deltaY * 0.6; // user helps push scroll up
      if (lockScrollY <= releaseTargetScrollY) {
        // Release immediately if we scroll past release target
        lockScrollY = releaseTargetScrollY;
        window.scrollTo(0, releaseTargetScrollY);
        document.documentElement.style.overflow = '';
        isLocked = false;
        isReleasing = null;
        lastScrollY = releaseTargetScrollY;
        if (tickId) {
          cancelAnimationFrame(tickId);
          tickId = null;
        }
        return;
      }
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

  // Keyboard navigation controls when locked
  const scrollKeys = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 37: 1, 38: 1, 39: 1, 40: 1 };
  window.addEventListener('keydown', (e) => {
    if (isLocked && scrollKeys[e.keyCode]) {
      e.preventDefault();
      let delta = 0;
      if (e.keyCode === 40 || e.keyCode === 32 || e.keyCode === 34) { // Down, Space, PageDown
        delta = 100;
      } else if (e.keyCode === 38 || e.keyCode === 33) { // Up, PageUp
        delta = -100;
      }
      if (delta !== 0) {
        handleScrub(delta * 0.2);
      }
    }
  }, { passive: false });

  // Intercept window scroll event to trigger locks
  window.addEventListener('scroll', () => {
    updateCanvasVisibility();
    updateCommunityParallax();

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
      
      const excessDelta = currentScrollY - targetScrollY;
      targetProgress = 0;
      currentProgress = 0;
      updateAnimation(currentProgress);
      if (excessDelta > 0) {
        handleScrub(excessDelta);
      }
      startTick();
    } else if (crossedUp && targetProgress > 0) {
      isLocked = true;
      lockScrollY = currentScrollY;
      document.documentElement.style.overflow = 'hidden';
      
      const excessDelta = currentScrollY - targetScrollY;
      targetProgress = 1;
      currentProgress = 1;
      updateAnimation(currentProgress);
      if (excessDelta < 0) {
        handleScrub(excessDelta);
      }
      startTick();
    }

    lastScrollY = getScrollTop();
  });

  // Handle reset when the virus attack is finished/bypassed
  window.addEventListener('virus-attack-finished', () => {
    isLocked = false;
    isReleasing = null;
    isProgrammaticScrolling = false;
    targetProgress = 0;
    currentProgress = 0;
    targetScrollY = 0;
    lastScrollY = 0;
    
    if (tickId) {
      cancelAnimationFrame(tickId);
      tickId = null;
    }
    
    // Unlock scroll settings
    document.documentElement.style.overflow = '';
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

  // Run the community hovers initialization
  initCommunityHovers();

});
