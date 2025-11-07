# Chat Page Refactoring Guide

This document outlines the refactoring of `page.tsx` into multiple organized files.

## File Structure

```
src/app/chat/[id]/
├── types.ts                          ✅ Created - All interfaces
├── hooks/
│   └── useVoiceAgent.ts              ✅ Created - Voice agent functionality
├── utils/
│   └── messageSender.ts              ✅ Created - Message sending logic
├── components/
│   ├── ChatKitRenderer.tsx           ✅ Created - ChatKit renderer
│   ├── ChatKitWrapper.tsx            ⏳ TODO - Extract from page.tsx (lines 332-945)
│   ├── ChatContent.tsx               ⏳ TODO - Main chat UI (lines 1796-2300)
│   ├── ChatHeader.tsx                ⏳ TODO - Header component (lines 1802-1850)
│   ├── ChatInput.tsx                 ⏳ TODO - Input area (lines 2030-2300)
│   └── MessageList.tsx               ⏳ TODO - Messages display (lines 1860-2050)
└── page.tsx                          ⏳ TODO - Simplified main page

```

## Next Steps

1. **Extract ChatKitWrapper** (lines 332-945 from page.tsx)
   - Move to `components/ChatKitWrapper.tsx`
   - Import types from `types.ts`

2. **Extract Chat Components**
   - `ChatHeader`: Header rendering logic
   - `MessageList`: Message rendering with avatars
   - `ChatInput`: Input form with voice controls
   - `ChatContent`: Combines header, messages, and input

3. **Create useChatMessages hook**
   - Move `sendMessage` logic to use `messageSender.ts`
   - Handle message state management

4. **Refactor main page.tsx**
   - Import all extracted components
   - Keep only orchestration logic
   - Should be ~200-300 lines

## Benefits

- **Maintainability**: Each component has a single responsibility
- **Testability**: Components can be tested independently
- **Reusability**: Components can be reused in other contexts
- **Readability**: Smaller files are easier to understand

