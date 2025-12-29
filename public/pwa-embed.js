(function() {
  const SCRIPT_TAG = document.currentScript;
  const PWA_ID = SCRIPT_TAG ? SCRIPT_TAG.getAttribute('data-pwa-id') : null;
  const API_BASE = SCRIPT_TAG ? new URL(SCRIPT_TAG.src).origin : 'https://mdm-app.com'; // Adjust fallback

  if (!PWA_ID) {
    console.error('PWA Embed: Missing data-pwa-id attribute.');
    return;
  }

  // Inject Manifest
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = `${API_BASE}/api/pwa/${PWA_ID}/manifest.json`;
  document.head.appendChild(manifestLink);

  // Helper to fetch Config
  async function fetchConfig() {
    try {
      const res = await fetch(`${API_BASE}/api/pwa/${PWA_ID}`);
      const data = await res.json();
      return data.pwa;
    } catch (e) {
      console.error('PWA Embed: Failed to load config', e);
      return null;
    }
  }

  // Create UI
  async function initPWA() {
    const config = await fetchConfig();
    if (!config) return;

    let deferredPrompt;
    // Detect Mobile (iOS or Android)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    // Check standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator.standalone);
    if (isStandalone) return;

    const container = document.createElement('div');
    container.id = 'pwa-install-container';
    document.body.appendChild(container);

    const shadow = container.attachShadow({ mode: 'open' });
    
    // Style handling from config
    const styles = config.installBannerConfig || {};
    const bannerBg = styles.bannerBgColor || config.bgColor || '#fff';
    const bannerText = styles.bannerTextColor || config.themeColor || '#000';
    const btnBg = styles.buttonBgColor || '#000';
    const btnText = styles.buttonTextColor || '#fff';
    
    const isTop = styles.bannerPosition === 'top';
    const positionStyles = isTop 
        ? `top: 0; bottom: auto; transform: translateY(-100%);` 
        : `bottom: 0; top: auto; transform: translateY(100%);`;

    // Dynamic instructions based on OS
    const instructionsTitle = isIOS ? 'Install on iOS' : 'Install App';
    const step1Icon = isIOS ? 'Share Icon' : 'Menu Icon (⋮)';
    const step1Text = isIOS ? 'Tap the <strong>Share</strong> icon in the menu bar.' : 'Tap the <strong>Menu</strong> icon (⋮) in the browser.';
    const step2Text = isIOS ? 'Scroll down and select <strong>Add to Home Screen</strong>.' : 'Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.';

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
       :host {
         all: initial;
         display: block;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
       }
       .banner {
          position: fixed;
          left: 0;
          right: 0;
          ${positionStyles}
          background: ${bannerBg};
          color: ${bannerText};
          padding: ${styles.bannerPadding || '12px 16px'};
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: ${styles.bannerShadow || '0 2px 10px rgba(0,0,0,0.1)'};
          z-index: 99999;
          transition: transform 0.3s ease-in-out;
          margin: ${styles.bannerMargin || '0'};
          border-radius: ${styles.bannerBorderRadius || '0'};
          border: ${styles.bannerBorderWidth ? `${styles.bannerBorderWidth} solid ${styles.bannerBorderColor || 'transparent'}` : 'none'};
       }
       .banner.visible {
          transform: translateY(0);
       }
       .content {
          display: flex;
          align-items: center;
          gap: 12px;
       }
       .icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
          background: #eee;
       }
       .text {
          display: flex;
          flex-direction: column;
       }
       .title {
          font-weight: 600;
          font-size: 14px;
       }
       .desc {
          font-size: 12px;
          opacity: 0.8;
       }
       .actions {
          display: flex;
          gap: 8px;
          align-items: center;
       }
       .install-btn {
          background: ${btnBg};
          color: ${btnText};
          border: none;
          padding: 8px 16px;
          border-radius: ${styles.buttonBorderRadius || '20px'};
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          box-shadow: ${styles.buttonShadow || 'none'};
       }
       .close-btn {
          background: transparent;
          border: none;
          color: inherit;
          opacity: 0.5;
          cursor: pointer;
          padding: 4px;
          font-size: 18px;
          display: flex;
       }
       /* Instructions Modal */
       .instruction-modal {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          padding: 24px;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
          transform: translateY(100%);
          transition: transform 0.3s ease-out;
          z-index: 100000;
          color: #333;
          display: none;
       }
       .instruction-modal.open {
          transform: translateY(0);
          display: block;
       }
       .modal-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 16px;
       }
       .modal-title { font-weight: bold; font-size: 18px; }
       .instruction-step {
         display: flex;
         align-items: center;
         gap: 12px;
         margin-bottom: 16px;
         font-size: 15px;
       }
       .step-icon { font-size: 24px; }
       .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 99998;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
       }
       .modal-overlay.visible {
          opacity: 1;
          pointer-events: auto;
       }
    `;
    shadow.appendChild(styleSheet);

    const banner = document.createElement('div');
    banner.className = 'banner';
    
    // HTML Content
    banner.innerHTML = `
      <div class="content">
         ${config.iconUrl ? `<img src="${config.iconUrl}" class="icon" alt="App Icon" />` : ''}
         <div class="text">
            <span class="title">${styles.titleText || config.name || 'Install App'}</span>
            <span class="desc">${styles.descriptionText || 'Add to home screen for better experience'}</span>
         </div>
      </div>
      <div class="actions">
         <button class="install-btn">Install</button>
         <button class="close-btn">×</button>
      </div>
    `;
    shadow.appendChild(banner);

    // Modal Components
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    shadow.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'instruction-modal';
    modal.innerHTML = `
      <div class="modal-header">
         <span class="modal-title">${instructionsTitle}</span>
         <button class="close-btn" style="font-size: 24px;">×</button>
      </div>
      <div class="instruction-step">
         <span class="step-icon">1️⃣</span>
         <span>${step1Text}</span>
      </div>
      <div class="instruction-step">
         <span class="step-icon">2️⃣</span>
         <span>${step2Text}</span>
      </div>
    `;
    shadow.appendChild(modal);

    // Event Listeners
    const installBtn = banner.querySelector('.install-btn');
    const closeBtn = banner.querySelector('.close-btn');
    const modalCloseBtn = modal.querySelector('.close-btn');

    // Android/Desktop: Listen for install prompt (still useful if it happens!)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      banner.classList.add('visible'); // Will already be visible on mobile, but harmless
    });

    // Force Show on Mobile (iOS + Android)
    if (isMobile && !sessionStorage.getItem('pwa-banner-dismissed')) {
       setTimeout(() => {
          banner.classList.add('visible');
       }, 2000);
    }

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
         // Trigger native prompt
         deferredPrompt.prompt();
         const { outcome } = await deferredPrompt.userChoice;
         if (outcome === 'accepted') {
           deferredPrompt = null;
           banner.classList.remove('visible');
         }
      } else {
         // Fallback: Show instructions (iOS or Android without event)
         overlay.classList.add('visible');
         modal.classList.add('open');
      }
    });

    closeBtn.addEventListener('click', () => {
      banner.classList.remove('visible');
      sessionStorage.setItem('pwa-banner-dismissed', 'true');
    });

    // Close modal
    const closeModal = () => {
       overlay.classList.remove('visible');
       modal.classList.remove('open');
    };
    modalCloseBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
  }

  initPWA();
})();
