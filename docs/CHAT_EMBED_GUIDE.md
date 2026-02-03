# ChatKit & Chat Embed Module Guide

## Overview
The MDM system provides a modern, extensible chat embedding system that allows event organizations to integrate chatbots into their own websites. It supports multiple deployment types (Popover, Popup, Full Page) and integrates seamlessly with the OpenAI ChatKit SDK.

---

## Embedding Mechanism

The system uses a **Script-to-Iframe** architecture. This ensures that the chatbot's styling and logic are isolated from the host website, while still allowing for dynamic interaction.

### 1. The Embed Script
When a user copies the embed code from the Admin panel, they get a script tag pointing to the `/chat/embed` endpoint.

```html
<script src="https://mdm.example.com/chat/embed?id=CHATBOT_ID&type=popover"></script>
```

### 2. Script Execution Flow
The server (`src/app/chat/embed/route.ts`) generates a dynamic JavaScript payload using `scriptGenerator.ts`. This script:
1.  **Creates a Container**: Injects a `<div>` with a unique ID into the host's DOM.
2.  **Injects an IFrame**: Creates an `<iframe>` pointing to the chat page with `mode=embed`.
3.  **Handles Communication**: Sets up an event listener for `window.postMessage` to receive sizing updates from the iframe.

### 3. Iframe Communication (Bridge)
Since the chat is in an iframe, it cannot resize itself. The Chat Page inside the iframe calculates its required size (based on whether the chat is open or closed) and sends a message to the parent:

```javascript
// Internal logic in src/app/chat/[id]/page.tsx
window.parent.postMessage({
  type: 'chat-widget-resize',
  isOpen: true,
  width: '450px',
  height: '800px'
}, '*')
```

The host script then updates the `embedContainer.style` to match the requested dimensions.

---

## ChatKit Integration

`ChatKit` is the premium rendering engine for chatbots, utilizing the OpenAI ChatKit SDK for advanced UI features.

### Components
- **`ChatKitRenderer`**: The main entry point. It handles:
  - Loading the OpenAI SDK script from the CDN.
  - Dynamically importing the `@openai/chatkit-react` module.
  - Selecting the correct Agent ID (either standard ChatKit or Agent SDK).
- **`ChatKitWrapper`**: Wraps the SDK component and provides it with the MDM-specific configuration and styling overrides.

### Rendering Logic
The system supports two rendering styles:
1.  **Native Style**: The ChatKit SDK handles its own widget button and popover.
2.  **Regular Style**: The MDM platform provides the container and widget button, while ChatKit renders only the conversation area.

---

## Configuration & Deployment

### Deployment Types
- **Popover**: A small bubble in the corner. Clicking it expands the chat.
- **Popup Center**: A modal-style chat that appears in the center of the screen.
- **Full Page**: A standalone chat experience that covers the entire viewport.

### Security
- **Domain Allowlist**: For production, the system checks the `Origin` header against an allowlist in the chatbot configuration.
- **Status Toggle**: Chatbots can be enabled/disabled instantly from the Admin UI without needing to remove the script from the host site.

---

## Development & Debugging
- **Iframe Inspection**: When debugging, you can append `?mode=embed` to any chat URL to see how it will behave in the embedded context.
- **Styles**: Embed styles are managed via `src/app/chat/[id]/utils/chatStyling.ts`.
