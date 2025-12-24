import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../[id]/types'
import { WidgetConfig } from '../[id]/utils/widgetConfigHelper'


/**
 * Simplified embed script generator.
 * 
 * Instead of manually creating widget buttons and containers using DOM manipulation,
 * this approach creates a transparent full-page iframe that loads the chat page.
 * The React components inside the iframe handle ALL rendering, ensuring 100% visual
 * parity with the emulator.
 */
export function generateEmbedScript(
    chatbotId: string,
    type: string,
    serverOrigin: string,
    chatbotConfig: ChatbotConfig,
    chatKitTheme: any,
    preCalculatedWidgetConfig: WidgetConfig
) {
    // Pass pre-calculated config to ensure consistency
    const injectedWidgetConfig = JSON.stringify(preCalculatedWidgetConfig);

    return `
(function() {
  var chatbotId = '${chatbotId}';
  var type = '${type}';
  var serverOrigin = '${serverOrigin}';
  var widgetConfig = ${injectedWidgetConfig};
  
  // Prevent multiple instances
  if (window['chatbotLoaded_' + chatbotId]) {
    return;
  }
  window['chatbotLoaded_' + chatbotId] = true;
  
  // Z-Index from shared constants
  var Z_INDEX = ${JSON.stringify(Z_INDEX)};
  
  // Create a container for the iframe
  var embedContainer = document.getElementById('chatbot-embed-' + chatbotId);
  if (!embedContainer) {
    embedContainer = document.createElement('div');
    embedContainer.id = 'chatbot-embed-' + chatbotId;
    embedContainer.setAttribute('aria-label', 'Chat widget');
    document.body.appendChild(embedContainer);
  }
  
  // Style the container to be a transparent overlay
  // The iframe inside will handle its own widget button and popover positioning
  embedContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: ' + (widgetConfig.zIndex || Z_INDEX.chatWidget) + '; border: none; overflow: visible;';
  
  // Create the iframe that loads the full chat page
  // The chat page will render the widget button and container with React components
  var iframe = document.createElement('iframe');
  iframe.id = 'chatbot-iframe-' + chatbotId;
  iframe.src = serverOrigin + '/chat/' + chatbotId;
  iframe.setAttribute('title', 'Chat widget');
  iframe.setAttribute('allow', 'microphone; camera; clipboard-write');
  
  // Style iframe to cover full viewport but be transparent except for widget
  iframe.style.cssText = 'width: 100%; height: 100%; border: none; background: transparent; pointer-events: auto;';
  
  embedContainer.appendChild(iframe);
  
  // Listen for messages from the iframe (e.g., close requests)
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'chatbot-resize') {
      // Handle any resize requests if needed
    }
    if (e.data && e.data.type === 'close-chat') {
      // The iframe handles its own close state internally
    }
  });
  
  // Expose global functions for external control
  window['openChatbot_' + chatbotId] = function() {
    iframe.contentWindow.postMessage({ type: 'open-chat' }, '*');
  };
  
  window['closeChatbot_' + chatbotId] = function() {
    iframe.contentWindow.postMessage({ type: 'close-chat' }, '*');
  };
  
  window['updateChatbotBadge_' + chatbotId] = function(count) {
    iframe.contentWindow.postMessage({ type: 'update-badge', count: count }, '*');
  };
})();
`
}
