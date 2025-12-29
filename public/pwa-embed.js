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
    const container = document.createElement('div');
    container.id = 'pwa-install-container';
    document.body.appendChild(container);

    const shadow = container.attachShadow({ mode: 'open' });
    
    // Style handling from config
    const styles = config.installBannerConfig || {};
    // Default or Override
    const bannerBg = styles.bannerBgColor || config.bgColor || '#fff';
    const bannerText = styles.bannerTextColor || config.themeColor || '#000';
    const btnBg = styles.buttonBgColor || '#000';
    const btnText = styles.buttonTextColor || '#fff';
    
    // Position Logic
    const isTop = styles.bannerPosition === 'top';
    const positionStyles = isTop 
        ? `top: 0; bottom: auto; transform: translateY(-100%);` 
        : `bottom: 0; top: auto; transform: translateY(100%);`;

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

    // Event Listeners
    const installBtn = banner.querySelector('.install-btn');
    const closeBtn = banner.querySelector('.close-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      banner.classList.add('visible');
    });

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        banner.classList.remove('visible');
      }
    });

    closeBtn.addEventListener('click', () => {
      banner.classList.remove('visible');
    });
  }

  initPWA();
})();
