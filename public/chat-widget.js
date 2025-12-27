(function () {
    // Get the script tag that loaded this file
    const currentScript = document.currentScript;
    if (!currentScript) {
        console.error('[ChatWidget] Could not find script tag');
        return;
    }

    // Get chatbot ID from data attribute
    const chatbotId = currentScript.getAttribute('data-chatbot-id');
    if (!chatbotId) {
        console.error('[ChatWidget] No data-chatbot-id attribute found');
        return;
    }

    // Get optional deployment type (default to popover for widget behavior)
    const deploymentType = currentScript.getAttribute('data-type') || 'popover';

    // Get the base URL from the script src
    const scriptSrc = currentScript.src;
    const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

    function initWidget() {
        // Create iframe container - covers the full viewport to allow popover positioning
        const container = document.createElement('div');
        container.id = 'chat-widget-container';
        container.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      pointer-events: none;
    `;

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'chat-widget-iframe';
        // Pass deployment type to the chat page - mode=embed tells it's in an iframe, type controls layout
        iframe.src = `${baseUrl}/chat/${chatbotId}?mode=embed&type=${deploymentType}`;
        iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      pointer-events: auto;
    `;
        iframe.allow = 'microphone; clipboard-write';

        container.appendChild(iframe);
        document.body.appendChild(container);

        // Listen for messages from iframe to handle open/close state
        window.addEventListener('message', function (event) {
            // Verify origin matches our base URL
            try {
                const iframeOrigin = new URL(baseUrl).origin;
                if (event.origin !== iframeOrigin) {
                    return;
                }
            } catch (e) {
                return;
            }

            const data = event.data;
            if (data.type === 'chat-widget-resize') {
                if (data.isOpen) {
                    container.style.width = '100%';
                    container.style.height = '100%';
                    container.style.pointerEvents = 'auto'; // allow interaction with overlay
                } else {
                    // Closed: shrink to widget button size to avoid blocking page
                    // Default to bottom-right area. 
                    // Note: If widget position is changed in config, this might need dynamic positioning updates.
                    container.style.width = '120px'; // Sufficient for standard 60px button + margins/badge
                    container.style.height = '120px';
                    container.style.pointerEvents = 'none'; // container itself doesn't capture
                    iframe.style.pointerEvents = 'auto'; // button inside needs clicks
                }
            }

            // Handle close chat message - minimize container but keep iframe for button
            if (data.type === 'close-chat') {
                // Shrink container to widget button size (same as chat-widget-resize with isOpen: false)
                container.style.width = '120px';
                container.style.height = '120px';
                container.style.pointerEvents = 'none';
                iframe.style.pointerEvents = 'auto';
            }
        });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
