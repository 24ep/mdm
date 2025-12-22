import { NextRequest, NextResponse } from 'next/server'
import { Z_INDEX } from '@/lib/z-index'
import { db } from '@/lib/db'
import { mergeVersionConfig } from '@/lib/chatbot-helper'
// import { renderToStaticMarkup } from 'react-dom/server'
import * as Icons from 'lucide-react'
import React from 'react'

export async function GET(request: NextRequest) {
  // Dynamically import renderToStaticMarkup to avoid build errors with Next.js Edge/Server boundary checks
  const { renderToStaticMarkup } = await import('react-dom/server')

  const searchParams = request.nextUrl.searchParams
  const chatbotId = searchParams.get('id')
  const type = searchParams.get('type') || 'popover'

  if (!chatbotId) {
    return new NextResponse("Missing chatbot ID", { status: 400 })
  }

  try {
    // Fetch chatbot configuration server-side (including versions for merged config)
    const rawChatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!rawChatbot) {
      return new NextResponse("Chatbot not found", { status: 404 })
    }

    // Merge version config into chatbot object (this includes chatkitOptions, widgetBackgroundColor, etc.)
    const chatbot = mergeVersionConfig(rawChatbot)

    // Generate Icon SVG if needed
    let iconSvg = ''
    if (chatbot.avatarType !== 'image') {
      const IconName = (chatbot.avatarIcon || 'Bot') as keyof typeof Icons
      // @ts-ignore - Dynamic access to icons
      const IconComponent = Icons[IconName] || Icons.Bot
      const iconColor = chatbot.avatarIconColor || '#ffffff'
      // Render SVG with white color (or configured color) as it usually appears on a colored button
      // forcing white for the button icon usually looks best on colored backgrounds, 
      // but ChatPage uses avatarIconColor. We'll use the configured color.
      iconSvg = renderToStaticMarkup(React.createElement(IconComponent, { 
        size: 24, 
        color: iconColor,
        strokeWidth: 2
      }))
    }

    // Render Close Icon (X) server-side to match emulator style
    const closeIconColor = chatbot.avatarIconColor || '#ffffff'
    const closeIconSvg = renderToStaticMarkup(React.createElement(Icons.X, {
      size: 24,
      color: closeIconColor,
      strokeWidth: 2
    }))

    // Get the origin from the request (this is the MDM server origin)
    const serverOrigin = request.nextUrl.origin

  const script = `
(function() {
  var chatbotId = '${chatbotId}';
  var type = '${type}';
  
  // Try to determine origin dynamically from the script source
  // This handles cases where the server is behind a proxy or accessed via a different hostname
  var scriptUrl = document.currentScript ? document.currentScript.src : null;
  if (!scriptUrl) {
    // Fallback for async injected scripts (document.currentScript is null for them)
    // We look for a script tag that matches our endpoint and chatbot ID
    var scripts = document.querySelectorAll('script[src*="/api/embed"]');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src.indexOf(chatbotId) !== -1) {
        scriptUrl = scripts[i].src;
        break;
      }
    }
  }
  
  var dynamicOrigin = scriptUrl ? new URL(scriptUrl).origin : null;
  // Fallback to server-detected origin
  var serverOrigin = dynamicOrigin || '${serverOrigin}';
  
  console.log('[Chatbot] Initializing widget for:', chatbotId);
  console.log('[Chatbot] Server origin:', serverOrigin);
  if (dynamicOrigin) {
    console.log('[Chatbot] Detected origin from script:', dynamicOrigin);
  } else {
    console.log('[Chatbot] Using fallback server origin');
  }

  // Prevent multiple instances
  if (window['chatbotLoaded_' + chatbotId]) {
    console.warn('[Chatbot] Widget already loaded');
    return;
  }
  window['chatbotLoaded_' + chatbotId] = true;
  
  // Inject server-fetched config directly
  var chatbot = ${JSON.stringify(chatbot)};
  var iconSvg = ${JSON.stringify(iconSvg)};
  var closeIconSvg = ${JSON.stringify(closeIconSvg)};
  
  if (!chatbot) {
    console.error('Chatbot config missing');
    return;
  }

  // Legacy load check (keep for compatibility if needed, but we have config now)
  console.log('[Chatbot] Config loaded server-side for:', chatbotId);
  
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
    // For ChatKit, use theme accent color if available
    var isChatKit = chatbot.engineType === 'chatkit';
    var chatKitAccentColor = isChatKit && chatbot.chatkitOptions && chatbot.chatkitOptions.theme && chatbot.chatkitOptions.theme.color && chatbot.chatkitOptions.theme.color.accent && chatbot.chatkitOptions.theme.color.accent.primary
      ? chatbot.chatkitOptions.theme.color.accent.primary
      : null;
    
    var widgetConfig = {
      avatarStyle: chatbot.widgetAvatarStyle || 'circle',
      position: chatbot.widgetPosition || 'bottom-right',
      size: chatbot.widgetSize || '60px',
      backgroundColor: chatbot.widgetBackgroundColor || chatKitAccentColor || chatbot.primaryColor || '#3b82f6',
      borderColor: chatbot.widgetBorderColor || '#ffffff',
      borderWidth: chatbot.widgetBorderWidth || '2px',
      borderRadius: chatbot.widgetBorderRadius || '50%',
      shadowColor: chatbot.widgetShadowColor || '#000000',
      shadowBlur: chatbot.widgetShadowBlur || '8px',
      shadowX: chatbot.widgetShadowX || '0px',
      shadowY: chatbot.widgetShadowY || '0px',
      shadowSpread: chatbot.widgetShadowSpread || '0px',
      labelText: chatbot.widgetLabelText || 'Chat',
      labelColor: chatbot.widgetLabelColor || '#ffffff',
      logo: chatbot.logo || '',
      animation: chatbot.widgetAnimation || 'fade',
      autoShow: chatbot.widgetAutoShow !== undefined ? chatbot.widgetAutoShow : true,
      autoShowDelay: chatbot.widgetAutoShowDelay || 0,
      offsetX: chatbot.widgetOffsetX || '20px',
      offsetY: chatbot.widgetOffsetY || '20px',
      zIndex: chatbot.widgetZIndex || ${Z_INDEX.chatWidget},
      showBadge: chatbot.showNotificationBadge || false,
      badgeColor: chatbot.notificationBadgeColor || '#ef4444',
      chatWidth: chatbot.chatWindowWidth || '380px',
      chatHeight: chatbot.chatWindowHeight || '600px',
      popoverPosition: chatbot.popoverPosition || 'left', // 'top' or 'left'
      popoverMargin: chatbot.widgetPopoverMargin || '10px', // Margin between widget and popover
      widgetBlur: chatbot.widgetBackgroundBlur || 0, // Widget blur percentage
      widgetOpacity: chatbot.widgetBackgroundOpacity !== undefined ? chatbot.widgetBackgroundOpacity : 100, // Widget opacity percentage
      chatBlur: chatbot.chatWindowBackgroundBlur || 0, // Chat window blur percentage
      chatOpacity: chatbot.chatWindowBackgroundOpacity !== undefined ? chatbot.chatWindowBackgroundOpacity : 100, // Chat window opacity percentage
      overlayEnabled: chatbot.overlayEnabled !== undefined ? chatbot.overlayEnabled : false, // Overlay enabled
      overlayColor: chatbot.overlayColor || '#000000', // Overlay color
      overlayOpacity: chatbot.overlayOpacity !== undefined ? chatbot.overlayOpacity : 50, // Overlay opacity percentage
      overlayBlur: chatbot.overlayBlur || 0 // Overlay blur percentage
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
    buttonContainer.style.cssText = 'position: fixed; ' + positionStyle + ' z-index: ' + widgetConfig.zIndex + '; display: ' + (widgetConfig.autoShow && (!widgetConfig.autoShowDelay || widgetConfig.autoShowDelay <= 0) ? 'flex' : 'none') + '; flex-direction: column; align-items: center; gap: 8px; ' + animationStyle;
    
    var button = document.createElement('button');
    button.id = 'chatbot-button-' + chatbotId;
    button.setAttribute('aria-label', 'Open chat');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('type', 'button');
    
    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(function(char) { return char + char; }).join('');
      }
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);
      return r + ', ' + g + ', ' + b;
    }
    
    // Helper to build widget background style with glassmorphism
    function getWidgetBackgroundStyle(bgValue, blur, opacity) {
      var style = '';
      if (blur > 0) {
        style += 'backdrop-filter: blur(' + blur + 'px); -webkit-backdrop-filter: blur(' + blur + 'px); ';
      }
      // Check if it's an image URL (starts with url(, http://, https://, or /)
      if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
        var imageUrl = bgValue.startsWith('url(') ? bgValue : 'url(' + bgValue + ')';
        style += 'background-image: ' + imageUrl + '; ';
        style += 'background-size: cover; ';
        style += 'background-position: center; ';
        style += 'background-repeat: no-repeat; ';
        if (opacity < 100) {
          style += 'background-color: rgba(255, 255, 255, ' + (opacity / 100) + '); ';
        }
      } else {
        // It's a color value
        if (opacity < 100) {
          style += 'background-color: rgba(' + hexToRgb(bgValue) + ', ' + (opacity / 100) + '); ';
        } else {
          style += 'background-color: ' + bgValue + '; ';
        }
      }
      return style;
    }
    
    // Create button content based on avatar style
    if (widgetConfig.avatarStyle === 'circle-with-label') {
      var iconHtml = widgetConfig.logo ? '<img src="' + widgetConfig.logo + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;" onerror="this.style.display=\\'none\\'; this.parentElement.innerHTML=\\'' + (iconSvg || '💬') + '\\';">' : (iconSvg || '<span style="font-size: 24px; color: white;">💬</span>');
      
      button.innerHTML = iconHtml;
      var buttonBgStyle = getWidgetBackgroundStyle(widgetConfig.backgroundColor, widgetConfig.widgetBlur, widgetConfig.widgetOpacity);
      var shadowX = parseFloat(widgetConfig.shadowX) || 0;
      var shadowY = parseFloat(widgetConfig.shadowY) || 0;
      var shadowBlur = parseFloat(widgetConfig.shadowBlur) || 0;
      var shadowSpread = parseFloat(widgetConfig.shadowSpread) || 0;
      var boxShadow = (shadowBlur !== 0 || shadowX !== 0 || shadowY !== 0 || shadowSpread !== 0)
        ? shadowX + 'px ' + shadowY + 'px ' + shadowBlur + 'px ' + shadowSpread + 'px ' + widgetConfig.shadowColor
        : 'none';
      button.style.cssText = 'width: ' + widgetConfig.size + '; height: ' + widgetConfig.size + '; border-radius: ' + avatarBorderRadius + '; ' + buttonBgStyle + 'border: ' + widgetConfig.borderWidth + ' solid ' + widgetConfig.borderColor + '; color: white; cursor: pointer; box-shadow: ' + boxShadow + '; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; padding: 0; margin: 0;';
      
      var label = document.createElement('div');
      var labelBgStyle = getWidgetBackgroundStyle(widgetConfig.backgroundColor, widgetConfig.widgetBlur, widgetConfig.widgetOpacity);
      label.style.cssText = labelBgStyle + 'color: ' + widgetConfig.labelColor + '; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap;';
      label.textContent = widgetConfig.labelText;
      buttonContainer.appendChild(button);
      buttonContainer.appendChild(label);
    } else {
      var iconHtml = widgetConfig.logo ? '<img src="' + widgetConfig.logo + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;" onerror="this.parentElement.innerHTML=\\'' + (iconSvg || '💬') + '\\';">' : (iconSvg || '💬');
      
      button.innerHTML = iconHtml;
      var buttonBgStyle = getWidgetBackgroundStyle(widgetConfig.backgroundColor, widgetConfig.widgetBlur, widgetConfig.widgetOpacity);
      var shadowX = parseFloat(widgetConfig.shadowX) || 0;
      var shadowY = parseFloat(widgetConfig.shadowY) || 0;
      var shadowBlur = parseFloat(widgetConfig.shadowBlur) || 0;
      var shadowSpread = parseFloat(widgetConfig.shadowSpread) || 0;
      var boxShadow = (shadowBlur !== 0 || shadowX !== 0 || shadowY !== 0 || shadowSpread !== 0)
        ? shadowX + 'px ' + shadowY + 'px ' + shadowBlur + 'px ' + shadowSpread + 'px ' + widgetConfig.shadowColor
        : 'none';
      button.style.cssText = 'width: ' + widgetConfig.size + '; height: ' + widgetConfig.size + '; border-radius: ' + avatarBorderRadius + '; ' + buttonBgStyle + 'border: ' + widgetConfig.borderWidth + ' solid ' + widgetConfig.borderColor + '; color: white; cursor: pointer; box-shadow: ' + boxShadow + '; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; padding: 0; margin: 0; position: relative;';
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
    
    // Calculate chat window position based on widget position and popover position preference
    var chatWindowPosition = '';
    var popoverPos = widgetConfig.popoverPosition || 'left';
    var offsetX = widgetConfig.offsetX;
    var offsetY = widgetConfig.offsetY;
    
    // Parse widget size to get numeric value for calculations
    var widgetSizePx = parseFloat(widgetConfig.size) || 60;
    if (typeof widgetConfig.size === 'string' && widgetConfig.size.includes('px')) {
      widgetSizePx = parseFloat(widgetConfig.size);
    }
    
    // Parse popover margin to get numeric value
    var popoverMarginPx = parseFloat(widgetConfig.popoverMargin) || 10;
    if (typeof widgetConfig.popoverMargin === 'string' && widgetConfig.popoverMargin.includes('px')) {
      popoverMarginPx = parseFloat(widgetConfig.popoverMargin);
    }
    
    // Match positioning logic from chatStyling.ts (Emulator) to ensure consistency
    if (popoverPos === 'top') {
      // Position popover above the widget button (Stacked)
      if (widgetConfig.position === 'bottom-right') {
        chatWindowPosition = 'bottom: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); right: ' + offsetX + ';';
      } else if (widgetConfig.position === 'bottom-left') {
        chatWindowPosition = 'bottom: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: ' + offsetX + ';';
      } else if (widgetConfig.position === 'top-right') {
        chatWindowPosition = 'top: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); right: ' + offsetX + ';';
      } else if (widgetConfig.position === 'top-left') {
        chatWindowPosition = 'top: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: ' + offsetX + ';';
      } else if (widgetConfig.position === 'bottom-center') {
        chatWindowPosition = 'bottom: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: 50%; transform: translateX(-50%);';
      } else if (widgetConfig.position === 'top-center') {
        chatWindowPosition = 'top: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: 50%; transform: translateX(-50%);';
      }
    } else {
      // Position popover to the left/right of widget button (Side-by-Side)
      // IMPORTANT: In chatStyling.ts, we align the top/bottom edge with the widget
      
      if (widgetConfig.position === 'bottom-right') {
        // Aligned to bottom, to the left of widget
        chatWindowPosition = 'bottom: ' + offsetY + '; right: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'bottom-left') {
        // Aligned to bottom, to the right of widget
        chatWindowPosition = 'bottom: ' + offsetY + '; left: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'top-right') {
        // Aligned to top, to the left of widget
        chatWindowPosition = 'top: ' + offsetY + '; right: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'top-left') {
        // Aligned to top, to the right of widget
        chatWindowPosition = 'top: ' + offsetY + '; left: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'bottom-center') {
        // Aligned to bottom, to the right of widget (from center)
        chatWindowPosition = 'bottom: ' + offsetY + '; left: calc(50% + ' + (widgetSizePx / 2) + 'px + ' + popoverMarginPx + 'px); transform: translateX(0);';
      } else if (widgetConfig.position === 'top-center') {
         // Aligned to top, to the right of widget (from center)
        chatWindowPosition = 'top: ' + offsetY + '; left: calc(50% + ' + (widgetSizePx / 2) + 'px + ' + popoverMarginPx + 'px); transform: translateX(0);';
      }
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
    var chatBgColor = chatbot.messageBoxColor || '#ffffff';
    var chatBgStyle = '';
    if (widgetConfig.chatBlur > 0) {
      chatBgStyle += 'backdrop-filter: blur(' + widgetConfig.chatBlur + 'px); -webkit-backdrop-filter: blur(' + widgetConfig.chatBlur + 'px); ';
    }
    if (widgetConfig.chatOpacity < 100) {
      chatBgStyle += 'background-color: rgba(' + hexToRgb(chatBgColor) + ', ' + (widgetConfig.chatOpacity / 100) + '); ';
    } else {
      chatBgStyle += 'background-color: ' + chatBgColor + '; ';
    }
    chatWindow.style.cssText = 'position: fixed; ' + chatWindowPositionMobile + ' width: ' + chatWindowWidth + '; height: ' + chatWindowHeight + '; ' + chatBgStyle + 'border-radius: ' + chatWindowBorderRadius + '; box-shadow: 0 0 ' + chatWindowShadowBlur + ' ' + chatWindowShadowColor + '; border: ' + (chatbot.borderWidth || '1px') + ' solid ' + (chatbot.borderColor || '#e5e7eb') + '; font-family: ' + (chatbot.fontFamily || 'Inter') + '; font-size: ' + (chatbot.fontSize || '14px') + '; color: ' + (chatbot.fontColor || '#000000') + '; display: none; flex-direction: column; z-index: ' + (widgetConfig.zIndex >= ${Z_INDEX.chatWidget} ? widgetConfig.zIndex + 1 : ${Z_INDEX.chatWidgetWindow}) + '; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: scale(0.9);';
    
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
    iframe.src = serverOrigin + '/chat/' + chatbotId + '?mode=embed';
    iframe.style.cssText = 'width: 100%; flex: 1; border: none; border-radius: 0 0 ' + chatWindowBorderRadius + ' ' + chatWindowBorderRadius + ';';
    iframe.style.border = 'none';
    
    // PWA Install Banner
    var pwaBanner = null;
    var pwaConfig = {
      enabled: chatbot.pwaEnabled || false,
      bannerText: chatbot.pwaBannerText || 'Install app for quick access',
      position: chatbot.pwaBannerPosition || 'bottom',
      // Banner styling
      bgColor: chatbot.pwaBannerBgColor || chatbot.primaryColor || '#3b82f6',
      fontColor: chatbot.pwaBannerFontColor || '#ffffff',
      fontFamily: chatbot.pwaBannerFontFamily || chatbot.fontFamily || 'Inter, sans-serif',
      fontSize: chatbot.pwaBannerFontSize || '13px',
      borderRadius: chatbot.pwaBannerBorderRadius || '8px',
      shadow: chatbot.pwaBannerShadow || '0 -2px 10px rgba(0,0,0,0.1)',
      padding: chatbot.pwaBannerPadding || '10px 12px',
      // Button styling
      buttonBgColor: chatbot.pwaBannerButtonBgColor || '#ffffff',
      buttonTextColor: chatbot.pwaBannerButtonTextColor || chatbot.primaryColor || '#3b82f6',
      buttonBorderRadius: chatbot.pwaBannerButtonBorderRadius || '4px',
      buttonFontSize: chatbot.pwaBannerButtonFontSize || '12px'
    };
    
    if (pwaConfig.enabled) {
      // Check if banner was dismissed
      var pwaDismissedKey = 'pwa_dismissed_' + chatbotId;
      var pwaDismissed = false;
      try {
        pwaDismissed = localStorage.getItem(pwaDismissedKey) === 'true';
      } catch (e) {}
      
      // Check if already installed (basic check)
      var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      
      if (!pwaDismissed && !isStandalone) {
        pwaBanner = document.createElement('div');
        pwaBanner.id = 'pwa-banner-' + chatbotId;
        
        var bannerPosition = pwaConfig.position === 'top' ? 'top: 0;' : 'bottom: 0;';
        var bannerBorderRadius = pwaConfig.position === 'top' ? '0 0 ' + pwaConfig.borderRadius + ' ' + pwaConfig.borderRadius : pwaConfig.borderRadius + ' ' + pwaConfig.borderRadius + ' 0 0';
        
        pwaBanner.style.cssText = 'position: absolute; left: 0; right: 0; ' + bannerPosition + ' background: linear-gradient(135deg, ' + pwaConfig.bgColor + ' 0%, ' + pwaConfig.bgColor + 'dd 100%); color: ' + pwaConfig.fontColor + '; padding: ' + pwaConfig.padding + '; display: flex; align-items: center; justify-content: space-between; gap: 8px; z-index: 10; border-radius: ' + bannerBorderRadius + '; box-shadow: ' + pwaConfig.shadow + '; font-family: ' + pwaConfig.fontFamily + ';';
        
        // Banner content
        var bannerContent = document.createElement('div');
        bannerContent.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;';
        
        // Mobile icon
        var mobileIcon = document.createElement('span');
        mobileIcon.innerHTML = '📱';
        mobileIcon.style.cssText = 'font-size: 18px;';
        bannerContent.appendChild(mobileIcon);
        
        // Text
        var bannerText = document.createElement('span');
        bannerText.textContent = pwaConfig.bannerText;
        bannerText.style.cssText = 'font-size: ' + pwaConfig.fontSize + '; font-weight: 500; color: ' + pwaConfig.fontColor + ';';
        bannerContent.appendChild(bannerText);
        
        // Buttons container
        var bannerButtons = document.createElement('div');
        bannerButtons.style.cssText = 'display: flex; align-items: center; gap: 6px;';
        
        // Install button
        var installBtn = document.createElement('button');
        installBtn.textContent = 'Install';
        installBtn.setAttribute('type', 'button');
        installBtn.style.cssText = 'background: ' + pwaConfig.buttonBgColor + '; color: ' + pwaConfig.buttonTextColor + '; border: none; padding: 6px 12px; border-radius: ' + pwaConfig.buttonBorderRadius + '; font-size: ' + pwaConfig.buttonFontSize + '; font-weight: 600; cursor: pointer; transition: opacity 0.2s; font-family: ' + pwaConfig.fontFamily + ';';
        installBtn.onmouseover = function() { this.style.opacity = '0.9'; };
        installBtn.onmouseout = function() { this.style.opacity = '1'; };
        installBtn.onclick = function(e) {
          e.stopPropagation();
          // Open standalone chat URL in new window for PWA installation
          var pwaUrl = window.location.origin + '/chat/' + chatbotId + '?pwa=1';
          window.open(pwaUrl, '_blank', 'noopener,noreferrer');
        };
        bannerButtons.appendChild(installBtn);
        
        // Close button
        var closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.setAttribute('type', 'button');
        closeBtn.setAttribute('aria-label', 'Dismiss install banner');
        closeBtn.style.cssText = 'background: transparent; color: ' + pwaConfig.fontColor + '; border: none; padding: 4px 6px; font-size: 14px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;';
        closeBtn.onmouseover = function() { this.style.opacity = '1'; };
        closeBtn.onmouseout = function() { this.style.opacity = '0.7'; };
        closeBtn.onclick = function(e) {
          e.stopPropagation();
          pwaBanner.style.display = 'none';
          try {
            localStorage.setItem(pwaDismissedKey, 'true');
          } catch (err) {}
        };
        bannerButtons.appendChild(closeBtn);
        
        pwaBanner.appendChild(bannerContent);
        pwaBanner.appendChild(bannerButtons);
      }
    }
    
    chatWindow.appendChild(header);
    chatWindow.appendChild(iframe);
    if (pwaBanner) {
      chatWindow.appendChild(pwaBanner);
      // Adjust iframe to not overlap with banner if at bottom
      if (pwaConfig.position === 'bottom') {
        chatWindow.style.position = 'relative';
      }
    }
    
    // Create overlay element
    var overlay = null;
    if (widgetConfig.overlayEnabled) {
      overlay = document.createElement('div');
      overlay.id = 'chatbot-overlay-' + chatbotId;
      var overlayBgColor = widgetConfig.overlayColor;
      var overlayBgStyle = '';
      if (widgetConfig.overlayBlur > 0) {
        overlayBgStyle += 'backdrop-filter: blur(' + widgetConfig.overlayBlur + 'px); -webkit-backdrop-filter: blur(' + widgetConfig.overlayBlur + 'px); ';
      }
      if (overlayBgColor.startsWith('rgba') || overlayBgColor.startsWith('rgb')) {
        // Extract RGB values and apply new opacity
        var rgbMatch = overlayBgColor.match(/(\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (rgbMatch) {
          overlayBgStyle += 'background-color: rgba(' + rgbMatch[1] + ', ' + rgbMatch[2] + ', ' + rgbMatch[3] + ', ' + (widgetConfig.overlayOpacity / 100) + '); ';
        } else {
          // If we can't parse, use the color as-is (might already have opacity)
          overlayBgStyle += 'background-color: ' + overlayBgColor + '; ';
        }
      } else {
        // Convert hex to rgba
        overlayBgStyle += 'background-color: rgba(' + hexToRgb(overlayBgColor) + ', ' + (widgetConfig.overlayOpacity / 100) + '); ';
      }
      overlay.style.cssText = 'position: fixed; inset: 0; ' + overlayBgStyle + 'z-index: ' + (widgetConfig.zIndex >= ${Z_INDEX.chatWidget} ? widgetConfig.zIndex - 1 : ${Z_INDEX.chatWidgetOverlay}) + '; display: none; pointer-events: auto;';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.onclick = function() { closeChat(); };
    }
    
    // Append to document
    widgetContainer.appendChild(buttonContainer);
    if (overlay) {
      widgetContainer.appendChild(overlay);
    }
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
      // Show overlay if enabled
      if (overlay && widgetConfig.overlayEnabled) {
        overlay.style.display = 'block';
      }
      // Prevent body scroll on mobile when chat is open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
      setTimeout(function() {
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'scale(1)';
      }, 10);
      button.innerHTML = closeIconSvg || '✕';
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
      // Hide overlay if enabled
      if (overlay && widgetConfig.overlayEnabled) {
        overlay.style.display = 'none';
      }
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
})();
`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Private-Network': 'true',
    },
  })
  } catch (error) {
    console.error('Error generating embed script:', error)
    return new NextResponse(`console.error("[Embed API Error] Server failed to generate script:", ${JSON.stringify(error instanceof Error ? error.message : String(error))});`, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Private-Network': 'true',
      }
    })
  }
}
