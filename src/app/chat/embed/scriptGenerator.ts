import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../[id]/types'
import { WidgetConfig } from '../[id]/utils/widgetConfigHelper'


export function generateEmbedScript(
    chatbotId: string,
    type: string,
    serverOrigin: string,
    chatbotConfig: ChatbotConfig,
    chatKitTheme: any,
    preCalculatedWidgetConfig: WidgetConfig
) {
    // Serialize the config to be injected into the script as a CONSTANT
    const injectedConfig = JSON.stringify(chatbotConfig);
    const injectedTheme = JSON.stringify(chatKitTheme || {});
    const injectedWidgetConfig = JSON.stringify(preCalculatedWidgetConfig);

    return `
(function() {
  var chatbotId = '${chatbotId}';
  var type = '${type}';
  var serverOrigin = '${serverOrigin}';
  
  // Prevent multiple instances
  if (window['chatbotLoaded_' + chatbotId]) {
    return;
  }
  window['chatbotLoaded_' + chatbotId] = true;
  
  // INJECTED CONFIGURATION (Server-Side Generated)
  var chatbot = ${injectedConfig};
  var theme = ${injectedTheme};
  var widgetConfig = ${injectedWidgetConfig}; // <--- Shared Logic from widgetConfigHelper.ts
  
  // Shared Z-Index constants
  var Z_INDEX = ${JSON.stringify(Z_INDEX)};
  
  if (type === 'popover') {
    // Create popover widget
    var widgetContainer = document.getElementById('chatbot-widget-' + chatbotId);
    if (!widgetContainer) {
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'chatbot-widget-' + chatbotId;
      widgetContainer.setAttribute('aria-label', 'Chat widget');
      document.body.appendChild(widgetContainer);
    }
    
    // --- STYLING UTILS ---
    
    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
      if (!hex) return '0, 0, 0';
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(function(char) { return char + char; }).join('');
      }
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);
      return r + ', ' + g + ', ' + b;
    }
    
    // Helper to build background style
    function getBackgroundStyle(bgValue, blur, opacity) {
      var style = '';
      if (blur > 0) {
        style += 'backdrop-filter: blur(' + blur + 'px); -webkit-backdrop-filter: blur(' + blur + 'px); ';
      }
      
      if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
        var imageUrl = bgValue.startsWith('url(') ? bgValue : 'url(' + bgValue + ')';
        style += 'background-image: ' + imageUrl + '; ';
        style += 'background-size: cover; ';
        style += 'background-position: center; ';
        style += 'background-repeat: no-repeat; ';
        if (opacity < 100) {
          style += 'background-color: rgba(255, 255, 255, ' + (opacity / 100) + '); ';
        } else {
             style += 'background-color: #ffffff; ';
        }
      } else {
        if (bgValue && (bgValue.includes('gradient'))) {
             style += 'background: ' + bgValue + '; ';
        } else if (opacity < 100) {
           if (bgValue && (bgValue.startsWith('rgba') || bgValue.startsWith('rgb'))) {
                style += 'background-color: ' + bgValue + '; ';
           } else {
             style += 'background-color: rgba(' + hexToRgb(bgValue) + ', ' + (opacity / 100) + '); ';
           }
        } else {
          style += 'background-color: ' + bgValue + '; ';
        }
      }
      return style;
    }
    
    // Calculate Widget Position CSS
    var positionStyle = '';
    var offsetX = widgetConfig.offsetX;
    var offsetY = widgetConfig.offsetY;
    if (widgetConfig.position === 'bottom-right') {
      positionStyle = 'bottom: ' + offsetY + '; right: ' + offsetX + ';';
    } else if (widgetConfig.position === 'bottom-left') {
      positionStyle = 'bottom: ' + offsetY + '; left: ' + offsetX + ';';
    } else if (widgetConfig.position === 'top-right') {
      positionStyle = 'top: ' + offsetY + '; right: ' + offsetX + ';';
    } else if (widgetConfig.position === 'top-left') {
      positionStyle = 'top: ' + offsetY + '; left: ' + offsetX + ';';
    } else if (widgetConfig.position === 'bottom-center') {
      positionStyle = 'bottom: ' + offsetY + '; left: 50%; transform: translateX(-50%);';
    } else if (widgetConfig.position === 'top-center') {
      positionStyle = 'top: ' + offsetY + '; left: 50%; transform: translateX(-50%);';
    }
    
    // Animation styles
    var animationStyle = '';
    if (widgetConfig.animation === 'fade') {
      animationStyle = 'opacity: 0; animation: fadeIn 0.5s ease-in forwards;';
    } else if (widgetConfig.animation === 'slide') {
      animationStyle = 'transform: translateY(' + (widgetConfig.position.indexOf('bottom') !== -1 ? '20px' : '-20px') + '); opacity: 0; animation: slideIn 0.5s ease-out forwards;';
    } else if (widgetConfig.animation === 'bounce') {
      animationStyle = 'opacity: 0; animation: bounceIn 0.6s ease-out forwards;';
    }
    
    // Inject Keyframes
    if (widgetConfig.animation !== 'none') {
      var style = document.createElement('style');
      style.textContent = '@keyframes fadeIn { to { opacity: 1; } } @keyframes slideIn { to { transform: translateY(0); opacity: 1; } } @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }';
      document.head.appendChild(style);
    }
    
    // Create Button Container
    var buttonContainer = document.createElement('div');
    buttonContainer.id = 'chatbot-button-container-' + chatbotId;
    buttonContainer.style.cssText = 'position: fixed; ' + positionStyle + ' z-index: ' + widgetConfig.zIndex + '; display: ' + (widgetConfig.autoShow ? 'flex' : 'none') + '; flex-direction: column; align-items: center; gap: 8px; ' + animationStyle;
    
    var button = document.createElement('button');
    button.id = 'chatbot-button-' + chatbotId;
    button.setAttribute('aria-label', 'Open chat');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('type', 'button');
    
    // Box Shadow - Already computed in config
    var boxShadow = widgetConfig.boxShadow || 'none';
       
    var buttonBgStyle = getBackgroundStyle(widgetConfig.backgroundColor, widgetConfig.widgetBlur, widgetConfig.widgetOpacity);
    var commonButtonStyle = 'border: ' + widgetConfig.borderWidth + ' solid ' + (widgetConfig.borderColor || 'transparent') + '; cursor: pointer; box-shadow: ' + boxShadow + '; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, background-color 0.2s; padding: 0; margin: 0; position: relative; font-family: inherit; outline: none; ' + buttonBgStyle;
    
    // RENDER BUTTON CONTENT based on Config
    if (widgetConfig.avatarStyle === 'circle-with-label') {
        var iconHtml = '';
        if (widgetConfig.labelShowIcon) {
            if (widgetConfig.avatarType === 'image' && widgetConfig.avatarImageUrl) {
                iconHtml = '<img src="' + widgetConfig.avatarImageUrl + '" alt="Chat" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">';
            } else {
                 // Basic SVG Icon Fallback 
                 iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ' + widgetConfig.avatarIconColor + '"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
            }
        }
        
        var innerContent = '';
        if (widgetConfig.labelIconPosition === 'left') {
            innerContent = iconHtml + '<span style="color: ' + widgetConfig.labelColor + '; font-size: 14px; font-weight: 500; white-space: nowrap;">' + widgetConfig.labelText + '</span>';
        } else {
            innerContent = '<span style="color: ' + widgetConfig.labelColor + '; font-size: 14px; font-weight: 500; white-space: nowrap;">' + widgetConfig.labelText + '</span>' + iconHtml;
        }
        
        button.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' + innerContent + '</div>';
        button.style.cssText = 'width: auto; height: ' + widgetConfig.size + '; border-radius: ' + widgetConfig.labelBorderRadius + '; ' + commonButtonStyle + 'padding: 0 16px; min-width: ' + widgetConfig.size + ';';
        
    } else {
      // Circle or Square
      if (widgetConfig.avatarType === 'image' && widgetConfig.avatarImageUrl) {
          button.innerHTML = '<img src="' + widgetConfig.avatarImageUrl + '" style="width: 100%; height: 100%; border-radius: ' + widgetConfig.borderRadius + '; object-fit: cover;" alt="Chat">';
      } else {
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + widgetConfig.avatarIconColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M4 11v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1"/><path d="M4 18v-2a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2"/><circle cx="12" cy="18" r="4"/></svg>';
      }
      button.style.cssText = 'width: ' + widgetConfig.size + '; height: ' + widgetConfig.size + '; border-radius: ' + widgetConfig.borderRadius + '; ' + commonButtonStyle;
    }
    
    // Badge
    if (widgetConfig.showBadge) {
      var badge = document.createElement('div');
      badge.id = 'chatbot-badge-' + chatbotId;
      badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background-color: ' + widgetConfig.badgeColor + '; color: white; border-radius: 50%; min-width: 20px; height: 20px; padding: 0 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-sizing: border-box; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
      badge.textContent = '1';
      badge.style.display = 'none';
      window['updateChatbotBadge_' + chatbotId] = function(count) {
        if (badge && count > 0) {
          badge.textContent = count > 99 ? '99+' : count.toString();
          badge.style.display = 'flex';
          badge.style.borderRadius = count > 9 ? '10px' : '50%';
        } else if (badge) {
          badge.style.display = 'none';
        }
      };
      button.appendChild(badge);
    }
    
    // Hover Effects
    button.onmouseover = function() { this.style.transform = 'scale(1.05)'; };
    button.onmouseout = function() { 
      if (widgetConfig.position === 'bottom-center' || widgetConfig.position === 'top-center') {
        this.style.transform = 'translateX(-50%)';
      } else {
        this.style.transform = 'scale(1)';
      }
    };
    
    // --- CHAT WINDOW ----
    var chatWindowPosition = '';
    var popoverPos = widgetConfig.popoverPosition || 'left';
    // Use pre-stripped numeric values if in config? Or parse again.
    // The widgetConfig helper could provide numeric values, but style strings are easier.
    var widgetSizePx = parseFloat(widgetConfig.size) || 60;
    var popoverMarginPx = parseFloat(widgetConfig.popoverMargin) || 10;
    
    if (popoverPos === 'top') {
       if (widgetConfig.position.includes('bottom')) {
         chatWindowPosition += 'bottom: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); ';
       } else {
         chatWindowPosition += 'top: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); ';
       }
       if (widgetConfig.position.includes('right')) chatWindowPosition += 'right: ' + offsetX + ';';
       else if (widgetConfig.position.includes('left')) chatWindowPosition += 'left: ' + offsetX + ';';
       else if (widgetConfig.position.includes('center')) {
          chatWindowPosition += 'left: 50%; transform: translateX(-50%);';
       }
    } else {
      if (widgetConfig.position.includes('bottom')) chatWindowPosition += 'bottom: ' + offsetY + '; ';
      else chatWindowPosition += 'top: ' + offsetY + '; ';
      
       if (widgetConfig.position.includes('right')) {
         chatWindowPosition += 'right: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
       } else if (widgetConfig.position.includes('left')) {
         chatWindowPosition += 'left: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
       } else if (widgetConfig.position.includes('center')) {
         chatWindowPosition += 'left: calc(50% + ' + (widgetSizePx / 2) + 'px + ' + popoverMarginPx + 'px); transform: translateX(0);';
       }
    }
    
    var isMobile = window.innerWidth <= 768;
    var chatWindowWidth = isMobile ? '100vw' : widgetConfig.chatWidth;
    var chatWindowHeight = isMobile ? '100vh' : widgetConfig.chatHeight;
    var chatWindowPositionMobile = isMobile ? 'top: 0; left: 0; right: 0; bottom: 0; transform: none;' : chatWindowPosition;
    var chatWindowBorderRadius = isMobile ? '0' : (chatbot.borderRadius || '8px');
    
    var chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window-' + chatbotId;
    
    // Use pre-computed styles from shared helper
    var chatWindowBoxShadow = widgetConfig.chatWindowBoxShadow;
    var chatWindowBorder = widgetConfig.chatWindowBorder;
    var chatWindowBorderRadius = isMobile ? '0' : widgetConfig.chatWindowBorderRadius;
    
    // Background style (using shared helper's opacity/blur + script's generator)
    var chatBgStyle = getBackgroundStyle(
        widgetConfig.chatBackgroundColor, 
        widgetConfig.chatBlur, 
        widgetConfig.chatOpacity
    );
    
    chatWindow.style.cssText = 'position: fixed; ' + chatWindowPositionMobile + ' width: ' + chatWindowWidth + '; height: ' + chatWindowHeight + '; ' + chatBgStyle + 'border-radius: ' + chatWindowBorderRadius + '; box-shadow: ' + chatWindowBoxShadow + '; border: ' + chatWindowBorder + '; font-family: ' + widgetConfig.fontFamily + '; font-size: ' + widgetConfig.fontSize + '; color: ' + widgetConfig.fontColor + '; display: none; flex-direction: column; z-index: ' + (widgetConfig.zIndex >= Z_INDEX.chatWidget ? widgetConfig.zIndex + 1 : Z_INDEX.chatWidgetWindow) + '; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: scale(0.9); overflow: hidden;';
    
    if (widgetConfig.chatPaddingX) {
        chatWindow.style.paddingLeft = widgetConfig.chatPaddingX;
        chatWindow.style.paddingRight = widgetConfig.chatPaddingX;
    }
    if (widgetConfig.chatPaddingY) {
        chatWindow.style.paddingTop = widgetConfig.chatPaddingY;
        chatWindow.style.paddingBottom = widgetConfig.chatPaddingY;
    }
    
    var iframe = document.createElement('iframe');
    iframe.src = serverOrigin + '/chat/' + chatbotId + '?mode=embed';
    iframe.style.cssText = 'width: 100%; flex: 1; border: none; border-radius: ' + chatWindowBorderRadius + ';';
    iframe.style.border = 'none';
    
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'close-chat') {
        closeChat();
      }
    });

    widgetContainer.appendChild(buttonContainer);
    widgetContainer.appendChild(chatWindow);
    
    if (widgetConfig.autoShow) {
      setTimeout(function() {
        buttonContainer.style.display = 'flex';
      }, widgetConfig.autoShowDelay * 1000);
    }
    
    var isOpen = false;
    var originalButtonHTML = button.innerHTML;
    
    function openChat() {
      isOpen = true;
      chatWindow.style.display = 'flex';
      if (isMobile) document.body.style.overflow = 'hidden';
      setTimeout(function() {
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'scale(1)';
      }, 10);
      button.innerHTML = '✕';
      if (widgetConfig.avatarStyle === 'circle-with-label') {
          button.style.width = widgetConfig.size;
          button.style.height = widgetConfig.size;
          button.style.borderRadius = '50%';
          button.style.padding = '0';
      }
      setTimeout(function() { iframe.focus(); }, 100);
    }
    
    function closeChat() {
      isOpen = false;
      document.body.style.overflow = '';
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'scale(0.9)';
      setTimeout(function() { chatWindow.style.display = 'none'; }, 300);
      button.innerHTML = originalButtonHTML;
      if (widgetConfig.avatarStyle === 'circle-with-label') {
           button.style.width = 'auto'; // allow grow
           button.style.height = widgetConfig.size;
           button.style.borderRadius = widgetConfig.labelBorderRadius;
           button.style.padding = '0 16px';
      }
      setTimeout(function() { button.focus(); }, 350);
    }
    
    button.onclick = function() {
      if (isOpen) closeChat(); else openChat();
    };
    
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        var wasMobile = isMobile;
        isMobile = window.innerWidth <= 768;
        if (wasMobile !== isMobile && isOpen) {
          chatWindow.style.width = isMobile ? '100vw' : widgetConfig.chatWidth;
          chatWindow.style.height = isMobile ? '100vh' : widgetConfig.chatHeight;
          chatWindow.style.borderRadius = isMobile ? '0' : (chatbot.borderRadius || '8px');
          if (isMobile) {
            chatWindow.style.top = '0'; chatWindow.style.left = '0'; chatWindow.style.right = '0'; chatWindow.style.bottom = '0'; chatWindow.style.transform = 'none';
          } else {
            chatWindow.style.cssText = chatWindow.style.cssText.replace(/top:[^;]+;|left:[^;]+;|right:[^;]+;|bottom:[^;]+;/g, '');
            chatWindow.style.cssText += chatWindowPosition;
          }
        }
      }, 100);
    });
  }
})();
`
}
