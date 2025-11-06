import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const chatbotId = searchParams.get('id')
  const type = searchParams.get('type') || 'popover'

  if (!chatbotId) {
    return new NextResponse("Missing chatbot ID", { status: 400 })
  }

  // Generate embed script
  const script = `
(function() {
  var chatbotId = '${chatbotId}';
  var type = '${type}';
  var origin = window.location.origin;
  
  // Prevent multiple instances
  if (window['chatbotLoaded_' + chatbotId]) {
    return;
  }
  window['chatbotLoaded_' + chatbotId] = true;
  
  // Load chatbot config
  function loadChatbotConfig(callback) {
    // Try API first, then localStorage as fallback
    fetch(origin + '/api/chatbots/' + chatbotId)
      .then(function(response) {
        if (response.ok) {
          return response.json();
        }
        throw new Error('API request failed');
      })
      .then(function(data) {
        if (data.chatbot) {
          callback(data.chatbot);
          return;
        }
        throw new Error('Chatbot not found in API');
      })
      .catch(function() {
        // Fallback to localStorage
        try {
          var saved = localStorage.getItem('ai-chatbots');
          if (saved) {
            var chatbots = JSON.parse(saved);
            var chatbot = chatbots.find(function(c) { return c.id === chatbotId; });
            if (chatbot) {
              callback(chatbot);
              return;
            }
          }
        } catch (e) {
          console.error('Error loading chatbot config:', e);
        }
        callback(null);
      });
  }
  
  loadChatbotConfig(function(chatbot) {
    if (!chatbot) {
      console.error('Chatbot not found:', chatbotId);
      // Show error state (optional - can be removed if not needed)
      return;
    }
  
    if (type === 'popover') {
    // Create popover widget (Facebook Messenger style)
    var widgetContainer = document.getElementById('chatbot-widget-' + chatbotId);
    if (!widgetContainer) {
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'chatbot-widget-' + chatbotId;
      widgetContainer.setAttribute('aria-label', 'Chat widget');
      document.body.appendChild(widgetContainer);
    }
    
    // Get widget configuration
    var widgetConfig = {
      avatarStyle: chatbot.widgetAvatarStyle || 'circle',
      position: chatbot.widgetPosition || 'bottom-right',
      size: chatbot.widgetSize || '60px',
      backgroundColor: chatbot.widgetBackgroundColor || chatbot.primaryColor || '#3b82f6',
      borderColor: chatbot.widgetBorderColor || '#ffffff',
      borderWidth: chatbot.widgetBorderWidth || '2px',
      borderRadius: chatbot.widgetBorderRadius || '50%',
      shadowColor: chatbot.widgetShadowColor || '#000000',
      shadowBlur: chatbot.widgetShadowBlur || '8px',
      labelText: chatbot.widgetLabelText || 'Chat',
      labelColor: chatbot.widgetLabelColor || '#ffffff',
      logo: chatbot.logo || '',
      animation: chatbot.widgetAnimation || 'fade',
      autoShow: chatbot.widgetAutoShow !== undefined ? chatbot.widgetAutoShow : true,
      autoShowDelay: chatbot.widgetAutoShowDelay || 0,
      offsetX: chatbot.widgetOffsetX || '20px',
      offsetY: chatbot.widgetOffsetY || '20px',
      zIndex: chatbot.widgetZIndex || 9999,
      showBadge: chatbot.showNotificationBadge || false,
      badgeColor: chatbot.notificationBadgeColor || '#ef4444',
      chatWidth: chatbot.chatWindowWidth || '380px',
      chatHeight: chatbot.chatWindowHeight || '600px'
    };
    
    // Calculate position with custom offsets
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
    
    // Determine border radius based on avatar style
    var avatarBorderRadius = widgetConfig.borderRadius;
    if (widgetConfig.avatarStyle === 'square') {
      avatarBorderRadius = '8px';
    } else if (widgetConfig.avatarStyle === 'circle' || widgetConfig.avatarStyle === 'circle-with-label') {
      avatarBorderRadius = widgetConfig.borderRadius || '50%';
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
    
    // Add animation keyframes
    if (widgetConfig.animation !== 'none') {
      var style = document.createElement('style');
      style.textContent = '@keyframes fadeIn { to { opacity: 1; } } @keyframes slideIn { to { transform: translateY(0); opacity: 1; } } @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }';
      document.head.appendChild(style);
    }
    
    // Create floating button/container
    var buttonContainer = document.createElement('div');
    buttonContainer.id = 'chatbot-button-container-' + chatbotId;
    buttonContainer.style.cssText = 'position: fixed; ' + positionStyle + ' z-index: ' + widgetConfig.zIndex + '; display: ' + (widgetConfig.autoShow ? 'flex' : 'none') + '; flex-direction: column; align-items: center; gap: 8px; ' + animationStyle;
    
    var button = document.createElement('button');
    button.id = 'chatbot-button-' + chatbotId;
    button.setAttribute('aria-label', 'Open chat');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('type', 'button');
    
    // Create button content based on avatar style
    if (widgetConfig.avatarStyle === 'circle-with-label') {
      button.innerHTML = (widgetConfig.logo ? '<img src="' + widgetConfig.logo + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;" onerror="this.style.display=\\'none\\'; this.parentElement.innerHTML=\\'💬\\'; this.parentElement.style.fontSize=\\'24px\\'; this.parentElement.style.color=\\'white\\';">' : '<span style="font-size: 24px; color: white;">💬</span>');
      button.style.cssText = 'width: ' + widgetConfig.size + '; height: ' + widgetConfig.size + '; border-radius: ' + avatarBorderRadius + '; background-color: ' + widgetConfig.backgroundColor + '; border: ' + widgetConfig.borderWidth + ' solid ' + widgetConfig.borderColor + '; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 0 ' + widgetConfig.shadowBlur + ' ' + widgetConfig.shadowColor + '; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; padding: 0; margin: 0;';
      
      var label = document.createElement('div');
      label.style.cssText = 'background-color: ' + widgetConfig.backgroundColor + '; color: ' + widgetConfig.labelColor + '; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap;';
      label.textContent = widgetConfig.labelText;
      buttonContainer.appendChild(button);
      buttonContainer.appendChild(label);
    } else {
      button.innerHTML = widgetConfig.logo ? '<img src="' + widgetConfig.logo + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;" onerror="this.parentElement.innerHTML=\\'💬\\'; this.parentElement.style.fontSize=\\'24px\\'; this.parentElement.style.color=\\'white\\';">' : '💬';
      button.style.cssText = 'width: ' + widgetConfig.size + '; height: ' + widgetConfig.size + '; border-radius: ' + avatarBorderRadius + '; background-color: ' + widgetConfig.backgroundColor + '; border: ' + widgetConfig.borderWidth + ' solid ' + widgetConfig.borderColor + '; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 0 ' + widgetConfig.shadowBlur + ' ' + widgetConfig.shadowColor + '; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; padding: 0; margin: 0; position: relative;';
      buttonContainer.appendChild(button);
    }
    
    // Add notification badge if enabled
    if (widgetConfig.showBadge) {
      var badge = document.createElement('div');
      badge.id = 'chatbot-badge-' + chatbotId;
      badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background-color: ' + widgetConfig.badgeColor + '; color: white; border-radius: 50%; min-width: 20px; height: 20px; padding: 0 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-sizing: border-box;';
      badge.textContent = '1';
      badge.style.display = 'none'; // Hidden by default, can be shown via API
      // Expose function to update badge count
      window['updateChatbotBadge_' + chatbotId] = function(count) {
        if (badge && count > 0) {
          badge.textContent = count > 99 ? '99+' : count.toString();
          badge.style.display = 'flex';
          badge.style.borderRadius = count > 9 ? '10px' : '50%';
        } else if (badge) {
          badge.style.display = 'none';
        }
      };
      button.style.position = 'relative';
      button.appendChild(badge);
    }
    
    button.onmouseover = function() { this.style.transform = 'scale(1.1)'; };
    button.onmouseout = function() { 
      if (widgetConfig.position === 'bottom-center' || widgetConfig.position === 'top-center') {
        this.style.transform = 'translateX(-50%)';
      } else {
        this.style.transform = 'scale(1)';
      }
    };
    
    // Calculate chat window position based on widget position
    var chatWindowPosition = '';
    var widgetOffset = widgetConfig.avatarStyle === 'circle-with-label' ? '120px' : '90px';
    var offsetX = widgetConfig.offsetX;
    if (widgetConfig.position === 'bottom-right') {
      chatWindowPosition = 'bottom: ' + widgetOffset + '; right: ' + offsetX + ';';
    } else if (widgetConfig.position === 'bottom-left') {
      chatWindowPosition = 'bottom: ' + widgetOffset + '; left: ' + offsetX + ';';
    } else if (widgetConfig.position === 'top-right') {
      chatWindowPosition = 'top: ' + widgetOffset + '; right: ' + offsetX + ';';
    } else if (widgetConfig.position === 'top-left') {
      chatWindowPosition = 'top: ' + widgetOffset + '; left: ' + offsetX + ';';
    } else if (widgetConfig.position === 'bottom-center') {
      chatWindowPosition = 'bottom: ' + widgetOffset + '; left: 50%; transform: translateX(-50%);';
    } else if (widgetConfig.position === 'top-center') {
      chatWindowPosition = 'top: ' + widgetOffset + '; left: 50%; transform: translateX(-50%);';
    }
    
    // Detect mobile
    var isMobile = window.innerWidth <= 768;
    
    // Mobile chat window sizing
    var chatWindowWidth = isMobile ? '100vw' : widgetConfig.chatWidth;
    var chatWindowHeight = isMobile ? '100vh' : widgetConfig.chatHeight;
    var chatWindowPositionMobile = isMobile ? 'top: 0; left: 0; right: 0; bottom: 0; transform: none;' : chatWindowPosition;
    var chatWindowBorderRadius = isMobile ? '0' : (chatbot.borderRadius || '8px');
    
    // Create chat window
    var chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window-' + chatbotId;
    var chatWindowShadowColor = chatbot.chatWindowShadowColor || chatbot.shadowColor || '#000000';
    var chatWindowShadowBlur = chatbot.chatWindowShadowBlur || chatbot.shadowBlur || '4px';
    chatWindow.style.cssText = 'position: fixed; ' + chatWindowPositionMobile + ' width: ' + chatWindowWidth + '; height: ' + chatWindowHeight + '; background: ' + (chatbot.messageBoxColor || '#ffffff') + '; border-radius: ' + chatWindowBorderRadius + '; box-shadow: 0 0 ' + chatWindowShadowBlur + ' ' + chatWindowShadowColor + '; border: ' + (chatbot.borderWidth || '1px') + ' solid ' + (chatbot.borderColor || '#e5e7eb') + '; font-family: ' + (chatbot.fontFamily || 'Inter') + '; font-size: ' + (chatbot.fontSize || '14px') + '; color: ' + (chatbot.fontColor || '#000000') + '; display: none; flex-direction: column; z-index: ' + (widgetConfig.zIndex + 1) + '; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: scale(0.9);';
    
    // Create header for chat window
    var header = document.createElement('div');
    header.style.cssText = 'padding: 12px 16px; border-bottom: 1px solid ' + (chatbot.borderColor || '#e5e7eb') + '; display: flex; justify-content: space-between; align-items: center; background: ' + (chatbot.messageBoxColor || '#ffffff') + '; border-radius: ' + chatWindowBorderRadius + ' ' + chatWindowBorderRadius + ' 0 0;';
    
    var headerContent = document.createElement('div');
    headerContent.style.cssText = 'display: flex; align-items: center; gap: 8px;';
    if (chatbot.logo) {
      var logoImg = document.createElement('img');
      logoImg.src = chatbot.logo;
      logoImg.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; object-fit: cover;';
      logoImg.onerror = function() { this.style.display = 'none'; };
      headerContent.appendChild(logoImg);
    }
    var agentName = document.createElement('span');
    agentName.textContent = chatbot.name || 'Chat';
    agentName.style.cssText = 'font-weight: 600; font-size: 16px; color: ' + (chatbot.fontColor || '#000000') + ';';
    headerContent.appendChild(agentName);
    
    var closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.setAttribute('type', 'button');
    closeButton.style.cssText = 'background: none; border: none; font-size: 24px; cursor: pointer; color: ' + (chatbot.fontColor || '#000000') + '; padding: 4px 8px; line-height: 1; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background-color 0.2s;';
    closeButton.onmouseover = function() { this.style.backgroundColor = 'rgba(0,0,0,0.1)'; };
    closeButton.onmouseout = function() { this.style.backgroundColor = 'transparent'; };
    
    header.appendChild(headerContent);
    header.appendChild(closeButton);
    
    // Create iframe for chat
    var iframe = document.createElement('iframe');
    iframe.src = window.location.origin + '/chat/' + chatbotId;
    iframe.style.cssText = 'width: 100%; flex: 1; border: none; border-radius: 0 0 ' + chatWindowBorderRadius + ' ' + chatWindowBorderRadius + ';';
    iframe.style.border = 'none';
    
    chatWindow.appendChild(header);
    chatWindow.appendChild(iframe);
    
    // Append to document
    widgetContainer.appendChild(buttonContainer);
    widgetContainer.appendChild(chatWindow);
    
    // Auto-show with delay
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
      button.setAttribute('aria-expanded', 'true');
      // Prevent body scroll on mobile when chat is open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
      setTimeout(function() {
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'scale(1)';
      }, 10);
      button.innerHTML = '✕';
      // Hide badge when chat is open
      if (widgetConfig.showBadge) {
        var badge = document.getElementById('chatbot-badge-' + chatbotId);
        if (badge) badge.style.display = 'none';
      }
      // Focus management
      setTimeout(function() {
        iframe.focus();
      }, 100);
    }
    
    function closeChat() {
      isOpen = false;
      button.setAttribute('aria-expanded', 'false');
      // Restore body scroll
      document.body.style.overflow = '';
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'scale(0.9)';
      setTimeout(function() {
        chatWindow.style.display = 'none';
      }, 300);
      button.innerHTML = originalButtonHTML;
      // Return focus to button
      setTimeout(function() {
        button.focus();
      }, 350);
    }
    
    button.onclick = function() {
      if (isOpen) {
        closeChat();
      } else {
        openChat();
      }
    };
    
    closeButton.onclick = function(e) {
      e.stopPropagation();
      closeChat();
    };
    
    // Close on outside click (only if not mobile, or if mobile and clicked outside)
    document.addEventListener('click', function(e) {
      if (isOpen && !chatWindow.contains(e.target) && !buttonContainer.contains(e.target)) {
        if (!isMobile || (isMobile && e.target === chatWindow)) {
          closeChat();
        }
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    });
    
    // Handle window resize for mobile
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        var wasMobile = isMobile;
        isMobile = window.innerWidth <= 768;
        if (wasMobile !== isMobile && isOpen) {
          // Update chat window size on resize
          chatWindow.style.width = isMobile ? '100vw' : widgetConfig.chatWidth;
          chatWindow.style.height = isMobile ? '100vh' : widgetConfig.chatHeight;
          chatWindow.style.borderRadius = isMobile ? '0' : (chatbot.borderRadius || '8px');
          if (isMobile) {
            chatWindow.style.top = '0';
            chatWindow.style.left = '0';
            chatWindow.style.right = '0';
            chatWindow.style.bottom = '0';
            chatWindow.style.transform = 'none';
          } else {
            chatWindow.style.cssText = chatWindow.style.cssText.replace(/top:[^;]+;|left:[^;]+;|right:[^;]+;|bottom:[^;]+;/g, '');
            chatWindow.style.cssText += chatWindowPosition;
          }
        }
      }, 100);
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
      if (isOpen) {
        document.body.style.overflow = '';
      }
    });
    }
  });
})();
`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
